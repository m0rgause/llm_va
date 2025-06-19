// app/api/test-chat/route.js (atau .ts)

import { NextResponse } from "next/server";
import { createOllama } from "ollama-ai-provider";
import { streamText, convertToCoreMessages } from "ai";

// Fungsi bantuan yang sama dari kode Anda
async function retrieveFromPinecone(query: string) {
  console.log("Starting Pinecone retrieval for test-chat...");
  const startTime = Date.now();
  // Gunakan NEXT_PUBLIC_API_URL untuk memanggil endpoint /retrieve yang mungkin ada di backend terpisah
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retrieve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve data from Pinecone: ${response.statusText}`
    );
  }

  const data = await response.json();
  const endTime = Date.now();
  console.log(
    `Pinecone retrieval for test-chat finished in ${endTime - startTime}ms`
  );
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

  for (let [key, value] of Object.entries(dictionary)) {
    key = key.toLowerCase();
    value = value.toLowerCase();
    text = text.toLowerCase();

    const regex = new RegExp(`\\b${key}\\b`, "gi");
    text = text.replace(regex, value);
  }

  text = text.replace(/\s+/g, " ").trim();

  console.log("Normalized text for test-chat:", text);
  return text;
};

export async function POST(request: any) {
  const abortController = new AbortController();

  // Ini adalah contoh body yang bisa Anda kirimkan dari client
  // Anda bisa menyesuaikannya untuk menguji skenario yang berbeda
  const {
    messages = [{ role: "user", content: "apa itu TA?" }],
    selectedModel = "syaki-ai",
    data = {},
  } = await request.json();

  const ollamaUrl = process.env.OLLAMA_URL;

  if (!ollamaUrl) {
    return NextResponse.json(
      { error: "OLLAMA_URL is not configured." },
      { status: 500 }
    );
  }

  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  // Inisialisasi Ollama provider
  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  let retrievedContent = "";
  let retrievalError = null;
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
  } catch (error: any) {
    console.error("Error retrieving data from Pinecone in test-chat:", error);
    retrievalError = error.message;
  }

  const prompt = `
== Context ==
${retrievedContent}

== User Input ==
${normalizeText(currentMessage.content)}

== Response ==
`;

  try {
    const result = await streamText({
      model: ollama(selectedModel), // Menggunakan model yang dipilih atau default 'syaki-ai'
      messages: [
        ...convertToCoreMessages(initialMessages),
        { role: "user", content: prompt }, // Menggunakan prompt yang sudah diformat
      ],
      abortSignal: abortController.signal,
      temperature: 0.2,
      maxTokens: 1024,
    });

    // Mengembalikan stream sebagai respons
    // Next.js App Router dengan Vercel AI SDK secara otomatis menangani streaming
    // dari `streamText().toDataStreamResponse()` atau `streamText().toAIStream()`
    // Namun, untuk endpoint pengujian, kita bisa menunggu seluruh hasilnya.
    // Jika Anda ingin menguji streaming, Anda bisa mengembalikan `result.toDataStreamResponse()`.
    // Untuk tujuan pengujian sederhana, kita akan membaca seluruh stream dan mengembalikannya sebagai JSON.

    let fullResponse = "";
    for await (const delta of result.fullStream) {
      if (delta.type === "text-delta") {
        fullResponse += delta.textDelta;
      }
    }

    return NextResponse.json({
      success: true,
      query: currentMessage.content,
      retrievedContent: retrievedContent,
      retrievalError: retrievalError,
      ollamaResponse: fullResponse,
      modelUsed: selectedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error during Ollama streaming in test-chat:", error);
    return NextResponse.json(
      {
        error: "Failed to stream text from Ollama.",
        details: error.message,
        retrievedContent: retrievedContent,
        retrievalError: retrievalError,
      },
      { status: 500 }
    );
  }
}

// Secara eksplisit menolak metode GET untuk rute ini
export async function GET(request: any) {
  return NextResponse.json(
    { message: "Method GET Not Allowed for this chat test route" },
    { status: 405 }
  );
}
