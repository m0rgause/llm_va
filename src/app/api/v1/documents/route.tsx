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

    let loader;
    if (file_type === "application/pdf") {
      loader = new PDFLoader(documentFile, {
        splitPages: false,
      });
    } else if (file_type === "text/plain") {
      loader = new TextLoader(documentFile);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }
    const docs = await loader.load();
    const model = await getModel();

    for (const doc of docs) {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", " ", ""],
      });
      const documentChunks = await splitter.splitText(doc.pageContent);

      let chunkBatchIndex = 0;
      while (documentChunks.length > 0) {
        chunkBatchIndex++;
        const chunkBatch = documentChunks.splice(0, 10);
        const embeddingsBatch = await model.embedDocuments(
          chunkBatch.map((str) => str.replace(/\n/g, " "))
        );
        // console.log(`Embeddings batch ${embeddingsBatch} created.`);

        let vectorBatch = [];

        for (let i = 0; i < chunkBatch.length; i++) {
          const chunk = chunkBatch[i];
          const embedding = embeddingsBatch[i];

          const vector = {
            id: `chunk-${i}-${Date.now()}-${chunkBatchIndex}`,
            values: embedding,
            metadata: {
              text: chunk,
              file_name,
              file_type,
              file_size,
              category: JSON.parse(category),
              user_id: userId,
            },
          };
          vectorBatch.push(vector);
        }
        const index = pinecone.index("va").namespace("syaki");

        await index.upsert(vectorBatch);
        console.log(
          `Batch ${chunkBatchIndex} successfully uploaded to Pinecone.`
        );
      }
    }

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
