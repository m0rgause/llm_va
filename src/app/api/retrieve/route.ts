import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";
import { getModel } from "@/utils/model";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inisialisasi Pinecone
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index("va").namespace("syaki");

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const model = await getModel();

    const queryEmbedding = await model.embedQuery(query);

    const results = await index.query({
      vector: queryEmbedding,
      topK: 15,
      includeMetadata: true,
    });

    // filter hasil dengan score di atas 0.5
    // Filter hasil dengan score yang memadai
    const filteredResults = results.matches.filter(
      (match) => (match.score ?? 0) >= 0.7
    );

    const formattedResults = filteredResults.map((match) => ({
      text: match.metadata!.text,
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
