import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone"
import { OllamaEmbeddings } from "@langchain/ollama";

export async function initRetriever() {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "",
  });

  return await pinecone.
}
