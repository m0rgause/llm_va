import { createOllama } from "ollama-ai-provider";
import { streamText, convertToCoreMessages, UserContent } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, selectedModel, data } = await req.json();

  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  let retrievedContent = "";
  let relevanceScore = 0;
  try {
    const retrievedData = await retrieveFromPinecone(currentMessage.content);

    if (retrievedData.length > 0) {
      // relevanceScore = retrievedData.map((item: any) => item.score);
      retrievedContent = retrievedData
        .slice(0, 3)
        .map(
          (item: any) => `[Relevansi: ${item.score.toFixed(2)}] ${item.text}`
        )
        .join("\n\n---\n\n");
    }
  } catch (error) {
    console.error("Error retrieving data from Pinecone:", error);
  }

  const prompt = PromptTemplate.fromTemplate(`
You are a knowledgeable and friendly virtual assistant for University of SyaKi. Your task is to assist users by providing clear, natural, and semi-formal answers about the university, including academic programs, administrative procedures, and campus events. Always use polite, friendly, and natural-sounding language, similar to how a university staff or senior student would talk when helping others. Avoid robotic or overly rigid phrasing, and do not use excessive spacing or bullet lists unless it's absolutely necessary for clarity. If providing a list, it should be formatted smoothly in paragraph form without bullets. If the user asks for a list of courses, display the information in a neat table format. If the retrieved context contains relevant information to answer the question, use only that information to form your answer. Do not make up answers or pull from general knowledge. If the context does not provide the needed answer, respond with: "Maaf, saya tidak memiliki informasi tentang hal tersebut."

Retrieved Context:
{retrieved_content}

User Input:
{user_input}

Answer:
`);

  const formattedPrompt = await prompt.format({
    retrieved_content: retrievedContent,
    user_input: currentMessage.content,
  });
  console.log("Formatted Prompt:", formattedPrompt);

  const result = streamText({
    model: ollama("llama3.1"),
    messages: [
      ...convertToCoreMessages(initialMessages),
      { role: "user", content: formattedPrompt },
    ],
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
}

async function retrieveFromPinecone(query: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retrieve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve data from Pinecone");
  }

  const data = await response.json();
  return data.results || [];
}
