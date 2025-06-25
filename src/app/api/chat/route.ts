import { createOllama } from "ollama-ai-provider";
import { streamText, convertToCoreMessages, generateText } from "ai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PromptTemplate } from "@langchain/core/prompts";
import normalizeText from "@/utils/normalize-text";
import { prisma } from "@/prisma";
import { auth } from "@/auth";
import readableUserData from "@/utils/readable-user";
import intentDetection from "@/utils/intent-detection";
import retrieveFromPinecone from "@/utils/retrieve-pinecone";
// export const runtime = "edge";
// export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const abortController = new AbortController();
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  req.signal.addEventListener("abort", () => {
    console.log("❌ Client aborted the request.");
    abortController.abort();
  });

  let { messages } = await req.json();

  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  const currentMessageContent = normalizeText(currentMessage.content);

  // Intent detection
  const intent = await intentDetection(
    normalizeText(currentMessageContent),
    ollama
  );

  const user_data = await prisma.user.findFirst({
    where: { id: user.id },
    select: {
      nama: true,
      semester: {
        select: {
          nama: true,
          kelas: true,
        },
      },
      no_whatsapp: true,
    },
  });
  const user_data_str = readableUserData(user_data);

  let formattedPrompt = "";
  if (intent == "Memilih Mata Kuliah Semester Selanjutnya") {
    // get context from docs folder
    const loader = new TextLoader("./docs/mata kuliah.txt");
    const docs = (await loader.load())[0].pageContent;

    const promptTemplate = PromptTemplate.fromTemplate(`
      The user wants to choose courses for the next semester.
      The context is about curriculum and courses data.
      Compare the curriculum and course data in the context with the user data.

      == Context ==
      {retrieved_content}

      == User Data ==
      {user_data}

      Based on this, suggest courses the user can take next semester, considering their current semester and class, also considering prerequisites and total SKS.
      Avoid repeating courses they have already taken.
      == User Input ==
      {user_input}

      == Response ==
      `);
    formattedPrompt = await promptTemplate.format({
      retrieved_content: docs,
      user_input: currentMessageContent,
      user_data: user_data_str,
    });
  } else {
    const retrievedContent = await retrieveFromPinecone(
      normalizeText(currentMessageContent)
    );
    const promptTemplate = PromptTemplate.fromTemplate(`
  == Retrieved Context ==
  {retrieved_content}

  == User Data ==
  {user_data}

  == User Input ==
  {user_input}

  == Response ==
  `);

    formattedPrompt = await promptTemplate.format({
      retrieved_content: retrievedContent,
      user_input: currentMessageContent,
      user_data: user_data_str,
    });
  }

  let result;
  try {
    result = streamText({
      model: ollama("syaki-ai"),
      messages: [
        ...convertToCoreMessages(initialMessages),
        { role: "user", content: formattedPrompt },
      ],
      abortSignal: abortController.signal,
      maxTokens: 1024,
    });
  } catch (error) {
    console.error("Error streaming text:", error);
    return new Response("Text streaming error", { status: 500 });
  }

  try {
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error returning data stream response:", error);
    return new Response("Stream response error", { status: 500 });
  }
}
