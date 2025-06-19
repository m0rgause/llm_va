// app/api/test-chat-simple/route.js (atau .ts)

import { NextResponse } from "next/server";
// import { createOllama } from "ollama-ai-provider";
// import { streamText, convertToCoreMessages } from "ai";
import { ChatOllama } from "@langchain/ollama";

export async function GET(request: Request) {
  const ollamaUrl = process.env.OLLAMA_URL;
  if (!ollamaUrl) {
    return NextResponse.json(
      { error: "OLLAMA_URL is not configured." },
      { status: 500 }
    );
  }

  // Inisialisasi Ollama provider
  const ollama = new ChatOllama({
    baseUrl: `${ollamaUrl}`,
    model: "syaki-ai", // Model default yang digunakan
  });

  const messages = [{ role: "user", content: "Halo, apakah kamu berfungsi?" }];

  try {
    // Mengirim pesan ke model dan mendapatkan respons
    const response = await ollama.invoke(messages);
    return NextResponse.json({
      success: true,
      queryMessages: messages,
      ollamaResponse: response,
      modelUsed: "syaki-ai", // Model yang digunakan
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error during Ollama invocation:", error);
    return NextResponse.json(
      {
        error: "Failed to invoke Ollama model.",
        details: error.message,
        queryMessages: messages,
      },
      { status: 500 }
    );
  }
}
