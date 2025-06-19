// app/api/test-config/route.js (atau .ts)

// Import Next.js specific functions for handling requests and responses
import { NextResponse } from "next/server";

export async function GET(request: any) {
  // Ambil variabel lingkungan
  const ollamaUrl = process.env.OLLAMA_URL;
  const nextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Lakukan pengecekan sederhana, misalnya apakah variabel lingkungan terdefinisi
  const configStatus = {
    ollamaUrl: ollamaUrl ? "Defined" : "Undefined",
    nextPublicApiUrl: nextPublicApiUrl ? "Defined" : "Undefined",
    ollamaUrlValue: ollamaUrl || "N/A", // Tampilkan nilainya jika terdefinisi
    nextPublicApiUrlValue: nextPublicApiUrl || "N/A",
  };

  // Opsional: Coba ping endpoint Ollama dari sini
  let ollamaPingStatus = "Not Attempted";
  let ollamaPingError = null;

  if (ollamaUrl) {
    try {
      const pingResponse = await fetch(`${ollamaUrl}/api/tags`, {
        method: "GET",
        // Penting: Jika Ollama Anda berjalan di alamat yang berbeda,
        // pastikan headers CORS di sisi Ollama mengizinkan origin dari Next.js Anda.
        // Atau, jika ini adalah server-to-server call, CORS tidak relevan,
        // tetapi pastikan alamatnya bisa dijangkau.
      });
      if (pingResponse.ok) {
        const data = await pingResponse.json();
        ollamaPingStatus = `Success: ${
          data.models ? data.models.length + " models found" : "No models"
        }`;
      } else {
        ollamaPingStatus = `Failed: HTTP ${pingResponse.status}`;
        ollamaPingError = await pingResponse.text();
      }
    } catch (error: any) {
      ollamaPingStatus = "Failed: Network Error";
      ollamaPingError = error.message;
    }
  }

  // Kirim respons dalam format JSON menggunakan NextResponse
  return NextResponse.json({
    message: "Testing configuration and Ollama connectivity",
    config: configStatus,
    ollamaPing: {
      status: ollamaPingStatus,
      error: ollamaPingError,
    },
    timestamp: new Date().toISOString(),
  });
}

// Anda juga bisa secara eksplisit menolak metode lain jika diperlukan,
// meskipun Next.js akan mengembalikan 405 secara default untuk metode yang tidak diekspor.
export async function POST(request: any) {
  return NextResponse.json(
    { message: "Method POST Not Allowed for this test route" },
    { status: 405 }
  );
}
