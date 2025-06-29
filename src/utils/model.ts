// import { OllamaEmbeddings } from "@langchain/ollama";
import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

export async function embedding(text: string) {
  const { embedding } = await embed({
    model: google.textEmbeddingModel("text-embedding-004"),
    value: text,
  });

  if (!embedding) {
    throw new Error("Failed to generate embedding");
  }
  return embedding;
}

export async function embeddingMany(texts: string[]) {
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel("text-embedding-004"),
    values: texts,
  });

  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error("Failed to generate embeddings for all texts");
  }
  return embeddings;
}
