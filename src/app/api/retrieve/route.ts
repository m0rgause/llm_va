import { embedding } from "@/utils/model";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { NextResponse } from "next/server";
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

    const queryEmbedding = await embedding(query);

    const results = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    const filteredResults = results.matches.filter(
      (match) => (match.score ?? 0) >= 0.6
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
