import { createOllama } from "ollama-ai-provider";
import {
  streamText,
  convertToCoreMessages,
  CoreMessage,
  UserContent,
} from "ai";

export const runtime = "edge";
export const dynamic = "force-dynamic";

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

export async function POST(req: Request) {
  const { messages, selectedModel, data } = await req.json();

  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  let retrievedContent = "";
  try {
    const retrievedData = await retrieveFromPinecone(currentMessage.content);

    if (retrievedData.length > 0) {
      retrievedContent = retrievedData.map((d: any) => d.chunk).join("\n");
    }
  } catch (error) {
    console.error("Error retrieving data from Pinecone:", error);
  }

  const augmentedMessageContent: UserContent = [
    {
      type: "text",
      text: `Retrieved Context: ${retrievedContent}\n\nUser Input: ${currentMessage.content}`,
    },
  ];

  console.log(
    `Retrieved Context: ${retrievedContent}\n\nUser Input: ${currentMessage.content}`
  );

  const result = await streamText({
    model: ollama(selectedModel),
    messages: [
      ...convertToCoreMessages(initialMessages),
      { role: "user", content: augmentedMessageContent },
    ],
  });

  return result.toDataStreamResponse();
}
