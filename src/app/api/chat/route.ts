import { google } from "@ai-sdk/google";
import { streamText, convertToCoreMessages, generateText } from "ai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PromptTemplate } from "@langchain/core/prompts";
import normalizeText from "@/utils/normalize-text";
import { prisma } from "@/prisma";
import { auth } from "@/auth";
import readableUserData from "@/utils/readable-user";
import intentDetection from "@/utils/intent-detection";
import retrieveFromPinecone from "@/utils/retrieve-pinecone";

export async function POST(req: Request) {
  const abortController = new AbortController();
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  req.signal.addEventListener("abort", () => {
    console.log("❌ Client aborted the request.");
    abortController.abort();
  });

  let { messages } = await req.json();

  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const currentMessageContent = normalizeText(currentMessage.content);
  console.log("Current message:", currentMessageContent);

  // Intent detection
  const intent = await intentDetection(currentMessageContent, google);

  const user_data = await prisma.user.findFirst({
    where: { id: user.id },
    select: {
      nama: true,
      semester: {
        select: {
          nama: true,
          kelas: true,
        },
      },
      no_whatsapp: true,
    },
  });
  const user_data_str = readableUserData(user_data);

  let formattedPrompt = "";
  if (intent == "Memilih Mata Kuliah Semester Selanjutnya") {
    // get context from docs folder
    const loader = new TextLoader("./docs/mata kuliah.txt");
    const docs = (await loader.load())[0].pageContent;

    const promptTemplate = PromptTemplate.fromTemplate(`
      You are a helpful, friendly, and context-aware virtual assistant for Universitas SyaKi. Your role is to suggest courses for the next semester based on the user's academic history and the curriculum provided in the context. You can choose either the courses from the previous semester(if the user has not taken them yet) or new courses based on the user's current semester and academic standing.
      In consentration MKPP, there are 2 consentrations available:
      - Data Science
      - Network Solution
      If the user already on semester 3 or higher, you can ask the user to choose one of the consentrations first.

      == Output Control ==
      - Always respond in a deterministic style—avoid randomness.
      - Use Markdown formatting for lists, tables, or structured data.

      == Behavior Rules ==
      - If the user’s question includes abbreviations (e.g., TA, Metopen, BNSP), always expand the abbreviation on first use before continuing the explanation. Example: "TA (Tugas Akhir)".
      - Avoid repeating the user’s question unless needed for clarity.

      == Glossary of Abbreviations ==
- TA      : Tugas Akhir
- Metopen : Metodologi Penelitian
- PA      : Pembimbing Akademik
- BNSP    : Badan Nasional Sertifikasi Profesi
- SIA     : Sistem Informasi Akademik
- MKCU    : Mata Kuliah Catur Umum
- MKCF  : Mata Kuliah Ciri Fakultas,
- MKPP  : Mata Kuliah Pilihan Prodi,
- MKWP    : Mata Kuliah Wajib Prodi
- PKM     : Program Kreativitas Mahasiswa
- MBKM    : Merdeka Belajar Kampus Merdeka
- MSIB    : Magang dan Studi Independen Bersertifikat
- KP      : Kerja Praktek
- SKS     : Satuan Kredit Semester
- SKPI    : Surat Keterangan Pendamping Ijazah
- KRS     : Kartu Rencana Studi
- KHS     : Kartu Hasil Studi
- KKN     : Kuliah Kerja Nyata
- Matkul  : Mata Kuliah
- MK      : Mata Kuliah
"""

      == Context ==
      {retrieved_content}

      == User Data ==
      {user_data}

      == User Input ==
      {user_input}

      == Response ==
      `);
    formattedPrompt = await promptTemplate.format({
      retrieved_content: docs,
      user_input: currentMessageContent,
      user_data: user_data_str,
    });
  } else {
    const retrievedContent = await retrieveFromPinecone(currentMessageContent);
    const promptTemplate = PromptTemplate.fromTemplate(`
  You are a helpful, friendly, and context-aware virtual assistant for Universitas SyaKi. Your role is to assist users by answering questions related to academic matters, administrative procedures, and campus activities, using the retrieved context and student/user data provided to you.

  == Output Control ==
- Always respond in a deterministic style—avoid randomness.
- Use Markdown formatting for lists, tables, or structured data.

== Behavior Rules ==
- If the user’s question includes abbreviations (e.g., TA, Metopen, BNSP), always expand the abbreviation on first use before continuing the explanation. Example: "TA (Tugas Akhir)".
- Avoid repeating the user’s question unless needed for clarity.

== Glossary of Abbreviations ==
- TA      : Tugas Akhir
- Metopen : Metodologi Penelitian
- PA      : Pembimbing Akademik
- BNSP    : Badan Nasional Sertifikasi Profesi
- SIA     : Sistem Informasi Akademik
- MKCU    : Mata Kuliah Catur Umum
- MKCF  : Mata Kuliah Ciri Fakultas,
- MKPP  : Mata Kuliah Pilihan Prodi,
- MKWP    : Mata Kuliah Wajib Prodi
- PKM     : Program Kreativitas Mahasiswa
- MBKM    : Merdeka Belajar Kampus Merdeka
- MSIB    : Magang dan Studi Independen Bersertifikat
- KP      : Kerja Praktek
- SKS     : Satuan Kredit Semester
- SKPI    : Surat Keterangan Pendamping Ijazah
- KRS     : Kartu Rencana Studi
- KHS     : Kartu Hasil Studi
- KKN     : Kuliah Kerja Nyata
- Matkul  : Mata Kuliah
- MK      : Mata Kuliah

  == Retrieved Context ==
  {retrieved_content}

  == User Data ==
  {user_data}

  == User Input ==
  {user_input}

  == Response ==
  `);

    formattedPrompt = await promptTemplate.format({
      retrieved_content: retrievedContent,
      user_input: currentMessageContent,
      user_data: user_data_str,
    });
  }

  let result;
  try {
    result = streamText({
      model: google("gemini-2.0-flash"),
      messages: [
        ...convertToCoreMessages(initialMessages),
        { role: "user", content: formattedPrompt },
      ],
      abortSignal: abortController.signal,
      maxTokens: 1024,
    });
  } catch (error) {
    console.error("Error streaming text:", error);
    return new Response("Text streaming error", { status: 500 });
  }

  try {
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error returning data stream response:", error);
    return new Response("Stream response error", { status: 500 });
  }
}
