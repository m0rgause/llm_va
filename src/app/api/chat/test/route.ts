// app/api/test-chat-simple/route.js (atau .ts)

import { NextResponse } from "next/server";
import { createOllama } from "ollama-ai-provider";
import { streamText, convertToCoreMessages } from "ai";

export async function GET(request: Request) {
  const abortController = new AbortController();

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: "Halo, apakah kamu berfungsi?" },
  ];
  const selectedModel = "syaki-ai"; // Model default yang digunakan

  const ollamaUrl = process.env.OLLAMA_URL;

  if (!ollamaUrl) {
    return NextResponse.json(
      { error: "OLLAMA_URL is not configured." },
      { status: 500 }
    );
  }

  // Inisialisasi Ollama provider
  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  try {
    const result = streamText({
      model: ollama(selectedModel), // Menggunakan model yang dipilih atau default 'syaki-ai'
      messages: convertToCoreMessages(messages), // Langsung menggunakan pesan yang diterima
      abortSignal: abortController.signal,
      temperature: 0.2,
      maxTokens: 100, // Batasi token untuk respons yang lebih cepat
    });

    // Membaca seluruh stream untuk pengujian sederhana
    let fullResponse = "";
    for await (const delta of result.fullStream) {
      if (delta.type === "text-delta") {
        fullResponse += delta.textDelta;
      }
    }

    return NextResponse.json({
      success: true,
      queryMessages: messages,
      ollamaResponse: fullResponse,
      modelUsed: selectedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error during Ollama streaming in test-chat-simple:", error);
    return NextResponse.json(
      {
        error: "Failed to stream text from Ollama.",
        details: error.message,
        queryMessages: messages,
      },
      { status: 500 }
    );
  }
}
