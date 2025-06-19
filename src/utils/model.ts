import { OllamaEmbeddings } from "@langchain/ollama";

export async function getModel() {
  const model = new OllamaEmbeddings({
    model: "mxbai",
  });

  return model;
}
