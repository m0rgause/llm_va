import { OllamaEmbeddings } from "@langchain/ollama";

export async function getModel() {
  const model = new OllamaEmbeddings({
    baseUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    model: "mxbai",
  });

  return model;
}
