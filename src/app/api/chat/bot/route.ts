import { createOllama } from "ollama-ai-provider";
import { streamText, convertToCoreMessages, generateText } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const {
    messages,
    userContent,
  }: {
    messages: { role: "user"; content: string }[];
    userContent: [];
  } = await req.json();

  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 2];

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  let retrievedContent = "";
  let relevanceScore = 0;
  try {
    const retrievedData = await retrieveFromPinecone(
      currentMessage.content.replace("!tanya ", "")
    );

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
You are a knowledgeable and friendly virtual assistant for University of SyaKi. Your task is to assist users by providing clear, natural, and semi-formal answers about the university, including academic programs, administrative procedures, and campus events. Always use polite, friendly, and natural-sounding language, similar to how a university staff or senior student would talk when helping others. Avoid robotic or overly rigid phrasing. If the retrieved context or user database contains relevant information to answer the question, use that information to form your answer, DONT MAKE UP THE ANSWER. It will be sent to students via Whatsapp, so please use the following markdown formatting:
- Use *bold* for important points.
- Use _italics_ for emphasis.
- Use \`\`\`monospace\`\`\` for code or technical terms.
- Use \`inline code\` for short code snippets.
- Use > Blockquotes for quoting text.
- Use - bullet points for lists.
- Use 1. numbered lists for ordered items.

When formulating your response, consider the user's information from the user database as part of the overall context to personalize the answer where appropriate. if user ask about his/her own data, you can use the user database to answer it. If the context does not provide the needed answer, respond with: "Maaf, saya tidak memiliki informasi tentang hal tersebut."

Retrieved Context:
{retrieved_content}

User Database:
{user_database}

User Input:
{user_input}

Answer:
`);

  const formattedPrompt = await prompt.format({
    retrieved_content: retrievedContent,
    user_input: currentMessage.content.replace("!tanya ", ""),
    user_database: JSON.stringify(userContent),
  });

  console.log("Formatted Prompt:", formattedPrompt);

  const result = await generateText({
    model: ollama("llama3.2"),
    messages: [
      ...convertToCoreMessages(initialMessages),
      { role: "user", content: formattedPrompt },
    ],
    temperature: 0.3,
  });

  return new Response(
    JSON.stringify({
      text: result.text,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
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
