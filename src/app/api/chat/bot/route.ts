import { createOllama } from "ollama-ai-provider";
import { convertToCoreMessages, generateText } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const abortController = new AbortController();

  req.signal.addEventListener("abort", () => {
    console.log("❌ Client aborted the request.");
    abortController.abort();
  });
  let messages, userContent;
  try {
    ({ messages, userContent } = await req.json());
  } catch (error) {
    console.error("Error parsing request JSON:", error);
    return new Response("Invalid JSON", { status: 400 });
  }

  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 2];
  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });
  const currentMessageContent = normalizeText(
    currentMessage.content.replace("!tanya ", "")
  );
  let retrievedContent = "";
  try {
    const retrievedData = await retrieveFromPinecone(currentMessageContent);

    if (retrievedData.length > 0) {
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
  const formattedPrompt = await prompt.format({
    retrieved_content: retrievedContent,
    user_input: currentMessageContent,
    user_database: formatUserDatabase(userContent),
  });
  console.log("Formatted Prompt:", formattedPrompt);
  const result = await generateText({
    model: ollama("syaki-ai"),
    messages: [
      ...convertToCoreMessages(initialMessages),
      { role: "user", content: formattedPrompt },
    ],
    temperature: 0.2,
    maxTokens: 240,
    abortSignal: abortController.signal,
  });
  return new Response(JSON.stringify({ text: result.text }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function retrieveFromPinecone(query: string) {
  let response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
  } catch (error) {
    throw error;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve data from Pinecone: ${response.statusText}`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw error;
  }
  return data.results || [];
}

const formatUserDatabase = (userContent: any) => {
  // format the user content into a readable string
  if (!userContent || Object.keys(userContent).length === 0) {
    return "Tidak ada informasi pengguna yang tersedia.";
  }
  return Object.entries(userContent)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        return `${key}: ${JSON.stringify(value, null, 2)}`;
      }
      return `${key}: ${value}`;
    })
    .join("\n");
};

const normalizeText = (text: string) => {
  const dictionary = {
    TA: "tugas akhir",
    Metopen: "metodologi penelitian",
    PA: "pembimbing akademik",
    BNSP: "badan nasional sertifikasi profesi",
    SIA: "sistem informasi akademik",
    MKCU: "mata kuliah catur umum",
    MKWP: "mata kuliah wajib prodi",
    PKM: "program kreativitas mahasiswa",
    MBKM: "Merdeka Belajar Kampus Merdeka",
    MSIB: "Magang dan Studi Independen Bersertifikat",
    KP: "Kerja Praktek",
    SKS: "Satuan Kredit Semester",
  };

  // if the text contains any of the keys in the dictionary, replace it with the corresponding value
  for (let [key, value] of Object.entries(dictionary)) {
    // lowercase the text and value for case-insensitive replacement
    key = key.toLowerCase();
    value = value.toLowerCase();
    text = text.toLowerCase();

    const regex = new RegExp(`\\b${key}\\b`, "gi");
    text = text.replace(regex, value);
  }

  // Normalize spaces and remove extra spaces
  text = text
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .trim(); // Trim leading and trailing spaces

  return text;
};

//   const {
//     messages,
//     userContent,
//   }: {
//     messages: { role: "user"; content: string }[];
//     userContent: [];
//   } = await req.json();

//   const ollamaUrl = process.env.OLLAMA_URL;
//   const initialMessages = messages.slice(0, -1);
//   const currentMessage = messages[messages.length - 2];

//   const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

//   let retrievedContent = "";
//   let relevanceScore = 0;
//   try {
//     const retrievedData = await retrieveFromPinecone(
//       currentMessage.content.replace("!tanya ", "")
//     );

//     if (retrievedData.length > 0) {
//       // relevanceScore = retrievedData.map((item: any) => item.score);
//       retrievedContent = retrievedData
//         .slice(0, 3)
//         .map(
//           (item: any) => `[Relevansi: ${item.score.toFixed(2)}] ${item.text}`
//         )
//         .join("\n\n---\n\n");
//     }
//   } catch (error) {
//     console.error("Error retrieving data from Pinecone:", error);
//   }

//   const prompt = PromptTemplate.fromTemplate(`
// You are a knowledgeable and friendly virtual assistant for University of SyaKi. Your task is to assist users by providing clear, natural, and semi-formal answers about the university, including academic programs, administrative procedures, and campus events. Always use polite, friendly, and natural-sounding language, similar to how a university staff or senior student would talk when helping others. Avoid robotic or overly rigid phrasing. If the retrieved context or user database contains relevant information to answer the question, use that information to form your answer, DONT MAKE UP THE ANSWER. It will be sent to students via Whatsapp, so please use the following markdown formatting:
// - Use *bold* for important points.
// - Use _italics_ for emphasis.
// - Use \`\`\`monospace\`\`\` for code or technical terms.
// - Use \`inline code\` for short code snippets.
// - Use > Blockquotes for quoting text.
// - Use - bullet points for lists.
// - Use 1. numbered lists for ordered items.

// When formulating your response, consider the user's information from the user database as part of the overall context to personalize the answer where appropriate. if user ask about his/her own data, you can use the user database to answer it. If the context does not provide the needed answer, respond with: "Maaf, saya tidak memiliki informasi tentang hal tersebut."

// Retrieved Context:
// {retrieved_content}

// User Database:
// {user_database}

// User Input:
// {user_input}

// Answer:
// `);

//   const formattedPrompt = await prompt.format({
//     retrieved_content: retrievedContent,
//     user_input: currentMessage.content.replace("!tanya ", ""),
//     user_database: JSON.stringify(userContent),
//   });

//   console.log("Formatted Prompt:", formattedPrompt);

//   const result = await generateText({
//     model: ollama("syaki-ai"),
//     messages: [
//       ...convertToCoreMessages(initialMessages),
//       { role: "user", content: formattedPrompt },
//     ],
//     temperature: 0.3,
//     maxTokens: 200,
//   });

//   return new Response(
//     JSON.stringify({
//       text: result.text,
//     }),
//     {
//       headers: { "Content-Type": "application/json" },
//     }
//   );
// }

// async function retrieveFromPinecone(query: string) {
//   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retrieve`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ query }),
//   });

//   if (!response.ok) {
//     throw new Error("Failed to retrieve data from Pinecone");
//   }

//   const data = await response.json();
//   return data.results || [];
// }
