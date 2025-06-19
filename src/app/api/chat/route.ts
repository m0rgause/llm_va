import { createOllama } from "ollama-ai-provider";
import { streamText, convertToCoreMessages, UserContent } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const abortController = new AbortController();

  req.signal.addEventListener("abort", () => {
    console.log("❌ Client aborted the request.");
    abortController.abort();
  });

  let messages, selectedModel, data;
  try {
    ({ messages, selectedModel, data } = await req.json());
  } catch (error) {
    console.error("Error parsing request JSON:", error);
    return new Response("Invalid JSON", { status: 400 });
  }

  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  let retrievedContent = "";
  let relevanceScore = 0;
  try {
    const retrievedData = await retrieveFromPinecone(
      normalizeText(currentMessage.content)
    );

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

  let formattedPrompt = "";
  try {
    const prompt = PromptTemplate.fromTemplate(`
== Context ==
{retrieved_content}

== User Input ==
{user_input}

== Response ==
`);
    formattedPrompt = await prompt.format({
      retrieved_content: retrievedContent,
      user_input: normalizeText(currentMessage.content),
    });
  } catch (error) {
    console.error("Error formatting prompt:", error);
    return new Response("Prompt formatting error", { status: 500 });
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
      temperature: 0.2,
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

async function retrieveFromPinecone(query: string) {
  console.log("Starting Pinecone retrieval...");
  const startTime = Date.now();
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
    console.error("Fetch error in retrieveFromPinecone:", error);
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
    console.error("Error parsing Pinecone response JSON:", error);
    throw error;
  }
  const endTime = Date.now();
  console.log(`Pinecone retrieval finished in ${endTime - startTime}ms`);
  return data.results || [];
}

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

  console.log("Normalized text:", text);

  return text;
};
