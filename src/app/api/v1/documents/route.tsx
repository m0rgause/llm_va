import { NextRequest, NextResponse } from "next/server";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getModel } from "@/utils/model";

export async function GET(request: NextRequest) {
  // get query parameters, and make it paginated
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("s");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    const where = query
      ? {
          OR: [
            { nama: { contains: query, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: documents,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  try {
    const formData = await request.formData();

    const nama = formData.get("nama") as string;
    const documentFile = formData.get("document") as Blob;
    const category = formData.get("category") as string;
    const file_name = formData.get("file_name") as string;
    const file_type = formData.get("file_type") as string;
    const file_size = parseInt(formData.get("file_size") as string, 10);
    const userId = formData.get("user_id") as string;

    if (
      !documentFile ||
      !nama ||
      !category ||
      !file_name ||
      !file_type ||
      !file_size ||
      !userId
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Load dan split dokumen jadi array chunk teks
    const chunks = await loadAndSplitDocument(documentFile, file_type);

    // Dapatkan embedder
    const model = await getModel();

    // Upload dalam batch ke Pinecone
    const index = pinecone.index("va").namespace("syaki");
    let batchIndex = 0;
    const batchSize = 10;

    while (chunks.length > 0) {
      const chunkBatch = chunks.splice(0, batchSize);
      const embeddings = await model.embedDocuments(
        chunkBatch.map((text) => text.replace(/\n/g, " "))
      );

      const vectors = chunkBatch.map((chunk, i) => ({
        id: `chunk-${Date.now()}-${batchIndex}-${i}`,
        values: embeddings[i],
        metadata: {
          text: chunk,
          file_name,
          file_type,
          file_size,
          category: JSON.parse(category),
          user_id: userId,
        },
      }));

      await index.upsert(vectors);
      batchIndex++;
    }

    // Simpan metadata ke database
    const document = await prisma.document.create({
      data: {
        nama,
        category: JSON.stringify(category),
        file_name,
        file_type,
        file_size,
        user_id: userId,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

/**
 * Load dan split dokumen (pdf / txt) menjadi array chunk teks.
 * @param blob - Blob file dari form
 * @param fileType - MIME type file
 * @returns Array chunk teks
 */
export async function loadAndSplitDocument(
  blob: Blob,
  fileType: string
): Promise<string[]> {
  // Konfigurasi text splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1200,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", ".", " ", ""],
  });

  if (fileType === "application/pdf") {
    const loader = new PDFLoader(blob, { splitPages: false });
    const docs = await loader.load();

    // Gabungkan semua konten halaman jika ada lebih dari 1
    const fullText = docs.map((d) => d.pageContent).join("\n\n");
    return await splitter.splitText(fullText);
  }

  if (fileType === "text/plain") {
    const text = await blob.text();
    const cleanedText = text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return await splitter.splitText(cleanedText);
  }

  throw new Error("Unsupported file type for splitting");
}
