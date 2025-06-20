// app/api/chat/route.ts (atau .js)
import { createOllama } from "ollama-ai-provider";
import { streamText, convertToCoreMessages, UserContent } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
import { NextResponse } from "next/server"; // Pastikan ini diimpor jika belum ada

// ... (fungsi retrieveFromPinecone dan normalizeText Anda yang ada)

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const abortController = new AbortController();

  // Tambahkan console log untuk request masuk
  console.log("Incoming request to /api/chat");

  req.signal.addEventListener("abort", () => {
    console.log("❌ Client aborted the request.");
    abortController.abort();
  });

  // const { messages, selectedModel, data } = await req.json();

  type MessageRole = "user" | "system" | "assistant" | "data";
  interface UIMessage {
    role: MessageRole;
    content: string;
  }

  const messages: UIMessage[] = [
    { role: "user", content: "Apa itu Syaki AI?" },
  ];
  const selectedModel = "syaki-ai"; // Model default jika tidak ada yang dipilih

  const ollamaUrl = process.env.OLLAMA_URL;
  // Log URL Ollama
  console.log(`OLLAMA_URL configured: ${ollamaUrl}`);

  if (!ollamaUrl) {
    console.error("OLLAMA_URL is not configured.");
    return NextResponse.json(
      { error: "OLLAMA_URL is not configured." },
      { status: 500 }
    );
  }

  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });
  console.log(`Ollama client initialized with baseURL: ${ollamaUrl}/api`);

  let retrievedContent = "";
  let retrievalError = null;
  try {
    console.log("Starting Pinecone retrieval...");
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
      console.log(
        "Pinecone retrieval successful. Content length:",
        retrievedContent.length
      );
    } else {
      console.log("Pinecone retrieval returned no data.");
    }
  } catch (error: any) {
    console.error("Error retrieving data from Pinecone:", error);
    retrievalError = error.message;
  }

  const prompt = PromptTemplate.fromTemplate(`
== Context ==
{retrieved_content}

== User Input ==
{user_input}

== Response ==
`);

  const formattedPrompt = await prompt.format({
    retrieved_content: retrievedContent,
    user_input: normalizeText(currentMessage.content),
  });

  console.log("Formatted Prompt generated.");
  // console.log("Formatted Prompt:", formattedPrompt); // Hati-hati dengan logging prompt besar

  try {
    console.log(
      `Calling streamText with model: ${selectedModel || "syaki-ai"}`
    );
    const result = streamText({
      model: ollama(selectedModel || "syaki-ai"), // Pastikan ada fallback model
      messages: [
        ...convertToCoreMessages(initialMessages),
        { role: "user", content: formattedPrompt },
      ],
      abortSignal: abortController.signal,
      temperature: 0.2,
      maxTokens: 1024,
    });

    // Logging untuk setiap delta yang diterima dari stream
    let streamedTextDebug = "";
    const debugStream = new ReadableStream({
      async start(controller) {
        for await (const delta of result.fullStream) {
          console.log("Received stream delta:", delta); // LOG PENTING
          if (delta.type === "text-delta" && delta.textDelta) {
            streamedTextDebug += delta.textDelta;
            console.log("Current streamed text (in debug):", streamedTextDebug); // Opsional, jika sangat detail
          }
          controller.enqueue(JSON.stringify(delta) + "\n"); // Meneruskan delta ke frontend
        }
        console.log(
          "Stream processing finished. Total streamed text length:",
          streamedTextDebug.length
        );
        controller.close();
      },
      cancel() {
        console.log("❌ Stream cancelled by client.");
        abortController.abort();
      },
    });

    // Mengembalikan stream ke frontend
    return new Response(debugStream, {
      headers: {
        "Content-Type": "application/json", // Atau 'text/plain' jika frontend mengharapkan itu
        "Transfer-Encoding": "chunked",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error during Ollama streaming:", error);
    return NextResponse.json(
      {
        error: "Failed to stream text from Ollama.",
        details: error.message,
        retrievalError: retrievalError,
      },
      { status: 500 }
    );
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
