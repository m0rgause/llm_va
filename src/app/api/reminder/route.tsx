import { createOllama } from "ollama-ai-provider";
import { generateText, convertToCoreMessages } from "ai"; // Mengubah streamText menjadi generateText
import { PromptTemplate } from "@langchain/core/prompts";
import { formatTime } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const {
    kelas,
  }: {
    query: string;
    kelas: any;
  } = await req.json();

  const messages: { role: "user"; content: string }[] = [
    {
      role: "user",
      content: `Buatkan kata pengingat untuk mahasiswa yang akan mengikuti kelas ini dalam 15 menit:
- Mata Kuliah: ${kelas.subject}
- Hari: ${kelas.day}
- Jam Mulai: ${formatTime(kelas.startTime)}
- Jam Selesai: ${formatTime(kelas.endTime)}
- Ruangan: ${kelas.room}
- Dosen: ${kelas.lecturer}`,
    },
  ];

  const ollamaUrl = process.env.OLLAMA_URL;
  const initialMessages = messages.slice(0, -1);
  const currentMessage = messages[messages.length - 1];

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  let retrievedContent = "";

  const prompt = PromptTemplate.fromTemplate(`
avoid robotic or overly rigid phrasing, no need to comment on what the class is about, just focus on the reminder.
It will be sent to students via WhatsApp, so please use the following markdown formatting:
- For bold text, use asterisks: *bold text*
- For italic text, use underscores: _italic text_
- For strikethrough, use tildes: ~strikethrough text~
- For monospace, use three backticks on both sides: \`\`\`monospace text\`\`\`
- For inline code, use single backticks: \`inline code\`

User Input:
{user_input}

Answer:
`);

  const formattedPrompt = await prompt.format({
    user_input: currentMessage.content,
  });

  // Menggunakan generateText untuk mendapatkan hasil lengkap
  const result = await generateText({
    model: ollama("gemma3:1b"),
    messages: [
      // ...convertToCoreMessages(initialMessages),
      { role: "user", content: formattedPrompt },
    ],
  });

  // Mengembalikan respons JSON dengan teks lengkap
  return new Response(
    JSON.stringify({
      text: result.text,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
