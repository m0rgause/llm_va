import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inisialisasi Pinecone
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index("va").namespace("cnn");

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const model = new OllamaEmbeddings({
      model: "mxbai-embed-large",
    });

    const queryEmbedding = await model.embedQuery(query);

    const results = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    // filter hasil dengan score di atas 0.5
    // Filter hasil dengan score yang memadai
    const filteredResults = results.matches.filter(
      (match) => (match.score ?? 0) >= 0.7
    );

    const formattedResults = filteredResults.map((match) => ({
      chunk: match.metadata!.chunk,
      score: match.score,
    }));

    return NextResponse.json({
      results: formattedResults,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Terjadi kesalahan dalam mengambil data." },
      { status: 500 }
    );
  }
}
