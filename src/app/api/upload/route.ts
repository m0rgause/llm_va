import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { OllamaEmbeddings } from "@langchain/ollama";
import { NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inisialisasi Pinecone
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index("va");

export async function GET(req: Request) {
  try {
    const loader = new DirectoryLoader("./docs", {
      ".pdf": (path) => new PDFLoader(path, { splitPages: false }),
      ".txt": (path) => new TextLoader(path),
    });

    const docs = await loader.load();
    const model = new OllamaEmbeddings({
      model: "mxbai-embed-large",
    });

    for (const doc of docs) {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const documentChunks = await splitter.splitText(doc.pageContent);

      let chunkBatchIndex = 0;
      while (documentChunks.length > 0) {
        chunkBatchIndex++;
        const chunkBatch = documentChunks.splice(0, 10);
        const embeddingsBatch = await model.embedDocuments(
          chunkBatch.map((str) => str.replace(/\n/g, " "))
        );

        let vectorBatch = [];

        for (let i = 0; i < chunkBatch.length; i++) {
          const chunk = chunkBatch[i];
          const embedding = embeddingsBatch[i];

          const vector = {
            id: `chunk-${i}-${Date.now()}-${chunkBatchIndex}`,
            values: embedding,
            metadata: {
              chunk: chunk,
            },
          };
          vectorBatch.push(vector);
        }

        const index = pinecone.index("va").namespace("cnn");

        await index.upsert(vectorBatch);
        console.log(`Batch ${chunkBatchIndex} berhasil diunggah ke Pinecone.`);
      }
    }

    return NextResponse.json({
      message: "Data berhasil diunggah ke Pinecone.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Terjadi kesalahan dalam mengunggah data." },
      { status: 500 }
    );
  }
}

// export async function GET(req: Request) {
//   try {
//     const texts = [
//       "Pengetahuan tentang Universitas Mercubuana",
//       "Bagaimana cara mendaftar di Universitas Mercubuana",
//       "Apa saja fakultas yang ada di Universitas Mercubuana",
//       "Apa saja program studi yang ada di Universitas Mercubuana",
//       "Apa saja fasilitas yang ada di Universitas Mercubuana",
//       "Apa saja kegiatan ekstrakurikuler yang ada di Universitas Mercubuana",
//     ];

//     const embeddingModel = new OllamaEmbeddings({
//       model: "mxbai-embed-large",
//     });

//     const embeddings = await Promise.all(
//       texts.map(async (text, index) => ({
//         id: `line-${index}-${Date.now()}`,
//         values: await embeddingModel.embedQuery(text),
//         metadata: { content: text },
//       }))
//     );

//     await index.upsert(embeddings);

//     return NextResponse.json({
//       message: "Data berhasil diunggah ke Pinecone.",
//     });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Terjadi kesalahan dalam mengunggah data." },
//       { status: 500 }
//     );
//   }
// }
