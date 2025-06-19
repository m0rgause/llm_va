import { NextResponse } from "next/server";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { prisma } from "@/prisma";

const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY || "",
});

const index = pinecone.index("va").namespace("syaki");

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    return prisma.$transaction(async (prisma) => {
      // get the document
      const document = await prisma.document.findUnique({
        where: { id },
      });
      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      // delete the document from Pinecone with metadata
      await index.deleteMany({
        file_name: document.file_name,
        file_size: document.file_size,
        file_type: document.file_type,
      });

      // delete the document from Prisma
      await prisma.document.delete({
        where: { id },
      });

      return NextResponse.json(
        { message: "Document deleted successfully" },
        { status: 200 }
      );
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
