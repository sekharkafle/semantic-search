import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { getEnv, validateEnvironmentVariables } from "./utils/util.js";
import { config } from "dotenv";
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
export const handler = async (event /*: APIGatewayEvent*/, context /*: Context*/): Promise<APIGatewayProxyResult> => {
  config();
  validateEnvironmentVariables();
  console.log(event.body)
  let body = JSON.parse(event.body)
  console.log(body)
  if (body && body.question) {
       
      const pinecone = new Pinecone();

      // Target the index
      const indexName = getEnv("PINECONE_INDEX");
      const index = pinecone.index(indexName);

      const openai = new OpenAI({
        apiKey: getEnv("OPENAI_KEY"),
        });
        
        const embedding = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input:body.question,
            encoding_format: "float",
        });
        

      const topK: number = 15;
      // Query the index using the query embedding
      const results = await index.query({
        vector: embedding.data[0].embedding,
        topK,
        includeMetadata: true,
        includeValues: false,
      });

        results.matches?.map((match) => ({
          text: match.metadata?.text,
          score: match.score,
        }))
      
      
       return {
          statusCode: 200,
          body: JSON.stringify(results),
      };
    
  }
  return {
    statusCode: 400,
    body: `{'error':'Invalid input params. Required "question" as input.'}`,
  };
};
