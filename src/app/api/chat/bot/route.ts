import { createOllama } from "ollama-ai-provider";
import { convertToCoreMessages, generateText } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
import { TextLoader } from "langchain/document_loaders/fs/text";
import normalizeText from "@/utils/normalize-text";
import readableUserData from "@/utils/readable-user";
import retrieveFromPinecone from "@/utils/retrieve-pinecone";
import intentDetection from "@/utils/intent-detection";
// export const runtime = "edge";
// export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let { messages, userContent } = await req.json();
  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 2];

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });
  const currentMessageContent = normalizeText(
    currentMessage.content.replace("!tanya ", "")
  );

  const intent = await intentDetection(currentMessageContent, ollama);

  const user_data = readableUserData(userContent);

  let formattedPrompt = "";
  if (intent === "Memilih Mata Kuliah Semester Selanjutnya") {
    // Load context from docs folder
    const loader = new TextLoader("./docs/mata kuliah.txt");
    const docs = (await loader.load())[0].pageContent;

    const promptTemplate = PromptTemplate.fromTemplate(`
      The user wants to choose courses for the next semester.
      the content of the docs is about curriculum and courses offered by the university.
      your task is to compare the user data with the content of the docs, and give the user a recommendation on which courses to take next semester.
      Remember, you can offer the previous semester courses if the user has not taken them yet.
      Here is the content of the docs:
      {docs}
      Here is the user data:
      {user_data}
      Here is the user input:
      {user_input}
      Please provide a concise recommendation for the user.
      `);

    formattedPrompt = await promptTemplate.format({
      docs,
      user_data,
      user_input: currentMessageContent,
    });
  } else {
    const retrievedContent = await retrieveFromPinecone(currentMessageContent);

    const prompt = PromptTemplate.fromTemplate(`
      It will be sent to student user via Whatsapp, so please use the following markdown formatting:
       - Use *bold* for important points.
       - Use _italics_ for emphasis.
       - Use \`\`\`monospace\`\`\` for code or technical terms.
       - Use \`inline code\` for short code snippets.
       - Use > Blockquotes for quoting text.
       - Use - bullet points for lists.
       - Use 1. numbered lists for ordered items.

      if the user ask about his/her own data, you can use the user database to answer it, THIS IS LEGAL because the user database is his/her own data.

      Retrieved Context:
      {retrieved_content}

      User/Student Database:
      {user_database}

      User Input:
      {user_input}

      You have 240 tokens to answer this question, so please be concise and clear.
      Answer:
    `);
    formattedPrompt = await prompt.format({
      retrieved_content: retrievedContent,
      user_input: currentMessageContent,
      user_database: user_data,
    });
  }

  console.log("Formatted Prompt:", formattedPrompt);
  const result = await generateText({
    model: ollama("syaki-ai"),
    messages: [
      ...convertToCoreMessages(initialMessages),
      { role: "user", content: formattedPrompt },
    ],
    temperature: 0.2,
  });
  return new Response(JSON.stringify({ text: result.text }), {
    headers: { "Content-Type": "application/json" },
  });
}

// export async function POST(req: Request) {
//   let messages, userContent;
//   try {
//     ({ messages, userContent } = await req.json());
//   } catch (error) {
//     console.error("Error parsing request JSON:", error);
//     return new Response("Invalid JSON", { status: 400 });
//   }

//   const ollamaUrl = process.env.OLLAMA_URL;
//   const initialMessages = messages.slice(0, -1);
//   const currentMessage = messages[messages.length - 2];
//   const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });
//   const currentMessageContent = normalizeText(
//     currentMessage.content.replace("!tanya ", "")
//   );

//   const retrievedContent = await retrieveFromPinecone(currentMessageContent);

//   const prompt = PromptTemplate.fromTemplate(`
// It will be sent to student user via Whatsapp, so please use the following markdown formatting:
//  - Use *bold* for important points.
//  - Use _italics_ for emphasis.
//  - Use \`\`\`monospace\`\`\` for code or technical terms.
//  - Use \`inline code\` for short code snippets.
//  - Use > Blockquotes for quoting text.
//  - Use - bullet points for lists.
//  - Use 1. numbered lists for ordered items.

// if the user ask about his/her own data, you can use the user database to answer it, THIS IS LEGAL because the user database is his/her own data.

//  Retrieved Context:
//  {retrieved_content}

//  User/Student Database:
//  {user_database}

//  User Input:
//  {user_input}

//  You have 240 tokens to answer this question, so please be concise and clear.
//  Answer:
//     `);
//   const formattedPrompt = await prompt.format({
//     retrieved_content: retrievedContent,
//     user_input: currentMessageContent,
//     user_database: readableUserData(userContent),
//   });
//   console.log("Formatted Prompt:", formattedPrompt);
//   const result = await generateText({
//     model: ollama("syaki-ai"),
//     messages: [
//       ...convertToCoreMessages(initialMessages),
//       { role: "user", content: formattedPrompt },
//     ],
//     temperature: 0.2,
//     maxTokens: 240,
//   });
//   return new Response(JSON.stringify({ text: result.text }), {
//     headers: { "Content-Type": "application/json" },
//   });
// }
