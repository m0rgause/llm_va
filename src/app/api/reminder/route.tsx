import { createOllama } from "ollama-ai-provider";
import { generateText, convertToCoreMessages } from "ai"; // Mengubah streamText menjadi generateText
import { PromptTemplate } from "@langchain/core/prompts";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const {
    query,
    kelas,
  }: {
    query: string;
    kelas: any;
  } = await req.json();

  // convert kelas to messages
  const formatTime = (date: string) => {
    const dateObj = new Date(date);
    const hours = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();
    const amPm = hours < 12 ? "AM" : "PM";
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${amPm}`;
  };

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
  // try {
  //   // const retrievedData = await retrieveFromPinecone(currentMessage.content);

  //   if (retrievedData.length > 0) {
  //     retrievedContent = retrievedData
  //       .slice(0, 3)
  //       .map(
  //         (item: any) => `[Relevansi: ${item.score.toFixed(2)}] ${item.text}`
  //       )
  //       .join("\n\n---\n\n");
  //   }
  // } catch (error) {
  //   console.error("Error retrieving data from Pinecone:", error);
  // }

  const prompt = PromptTemplate.fromTemplate(`
You are a knowledgeable and friendly virtual assistant for University of SyaKi. Your task is to assist users by reminding students about their upcoming classes in a clear, natural, and semi-formal manner. Always use polite, friendly, and natural-sounding language, similar to how a university staff or senior student would talk when helping others. Avoid robotic or overly rigid phrasing, no need to comment on what the class is about, just focus on the reminder.
It will be sent to students via WhatsApp, so please use the following markdown formatting:
- For bold text, use asterisks: *bold text*
- For italic text, use underscores: _italic text_
- For strikethrough, use tildes: ~strikethrough text~
- For monospace, use three backticks on both sides: \`\`\`monospace text\`\`\`
- For inline code, use single backticks: \`inline code\`

Retrieved Context:
{retrieved_content}

User Input:
{user_input}

Answer:
`);

  const formattedPrompt = await prompt.format({
    retrieved_content: retrievedContent,
    user_input: currentMessage.content,
  });

  // Menggunakan generateText untuk mendapatkan hasil lengkap
  const result = await generateText({
    model: ollama("llama3.1"),
    messages: [
      ...convertToCoreMessages(initialMessages),
      { role: "user", content: formattedPrompt },
    ],
    temperature: 0.3,
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

async function retrieveFromPinecone(query: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retrieve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve data from Pinecone");
  }

  const data = await response.json();
  return data.results || [];
}
