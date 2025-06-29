import { google } from "@ai-sdk/google";
import { convertToCoreMessages, generateText } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
import { TextLoader } from "langchain/document_loaders/fs/text";
import normalizeText from "@/utils/normalize-text";
import readableUserData from "@/utils/readable-user";
import retrieveFromPinecone from "@/utils/retrieve-pinecone";
import intentDetection from "@/utils/intent-detection";
// export const runtime = "edge";
// export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let { messages, userContent } = await req.json();
  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 2];

  const currentMessageContent = normalizeText(
    currentMessage.content.replace("!tanya ", "")
  );

  const intent = await intentDetection(currentMessageContent, google);

  const user_data = readableUserData(userContent);

  let formattedPrompt = "";
  if (intent === "Memilih Mata Kuliah Semester Selanjutnya") {
    // Load context from docs folder
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
      {docs}

      == User Data ==
      {user_data}

      == User Input ==
      {user_input}

      == Response ==
      `);

    formattedPrompt = await promptTemplate.format({
      docs,
      user_data,
      user_input: currentMessageContent,
    });
  } else {
    const retrievedContent = await retrieveFromPinecone(currentMessageContent);

    const prompt = PromptTemplate.fromTemplate(`

You are a helpful, friendly, and context-aware virtual assistant for Universitas SyaKi. Your role is to assist users by answering questions related to academic matters, administrative procedures, and campus activities, using the retrieved context and student/user data provided to you.

  == Output Control ==
- Always respond in a deterministic style—avoid randomness.
- Use Markdown formatting for lists, tables, or structured data.
    It will be sent to student user via Whatsapp, so please use the following markdown formatting:
      - Use *bold* for important points.
      - Use _italics_ for emphasis.
      - Use \`\`\`monospace\`\`\` for code or technical terms.
      - Use \`inline code\` for short code snippets.
      - Use > Blockquotes for quoting text.
      - Use - bullet points for lists.
      - Use 1. numbered lists for ordered items.
       

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
  {user_database}

  == User Input ==
  {user_input}

  == Response ==
    `);
    formattedPrompt = await prompt.format({
      retrieved_content: retrievedContent,
      user_input: currentMessageContent,
      user_database: user_data,
    });
  }

  const result = await generateText({
    model: google("gemini-2.0-flash"),
    messages: [
      ...convertToCoreMessages(initialMessages),
      { role: "user", content: formattedPrompt },
    ],
    temperature: 0.2,
  });
  return new Response(JSON.stringify({ text: result.text }), {
    headers: { "Content-Type": "application/json" },
  });
}
