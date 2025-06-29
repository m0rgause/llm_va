import { generateText } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
import { google } from "@ai-sdk/google";

const intentDetection = async (input_user: string, ollama: any) => {
  const promptIntent = PromptTemplate.fromTemplate(`
    Anda adalah sistem pendeteksi niat yang cerdas. Tugas Anda adalah menganalisis "Input Pengguna" dan mengidentifikasi niat utamanya dari daftar kategori yang diberikan. Anda harus memberikan respons yang ringkas dan hanya berisi label niat yang paling sesuai.
    
    == Kategori Niat ==
    - Mencari Informasi Mata Kuliah: Pengguna bertanya tentang mata kuliah spesifik, detail mata kuliah, atau daftar mata kuliah.
    - Memilih Mata Kuliah Semester Selanjutnya: Pengguna meminta bantuan untuk merencanakan atau memilih mata kuliah untuk semester mendatang, termasuk saran atau persyaratan.
    - Mencari Informasi Administrasi: Pengguna bertanya tentang prosedur administrasi (misalnya, pendaftaran ulang, pembayaran, formulir).
    - Informasi Umum Kampus: Pengguna bertanya pertanyaan umum tentang universitas atau kegiatan kampus.
    - Lain-lain: Jika niat tidak cocok dengan kategori di atas.
    
    == Aturan Respons ==
    - Respons Anda harus berupa satu baris dan hanya berisi label niat yang terdeteksi, diawali dengan "INTENT: ".
    - Jangan menyertakan teks lain, penjelasan, atau salam.
    - Pilih hanya satu niat yang paling sesuai.
    
    == Contoh ==
    Input Pengguna: Saya ingin tahu jadwal kuliah Sistem Basis Data.
    INTENT: Mencari Informasi Mata Kuliah
    
    Input Pengguna: Bagaimana cara saya mendaftar ulang untuk semester depan?
    INTENT: Mencari Informasi Administrasi
    
    Input Pengguna: Bisakah Anda bantu saya memilih SKS untuk semester 5?
    INTENT: Memilih Mata Kuliah Semester Selanjutnya
    
    Input Pengguna: Apakah ada event kampus minggu ini?
    INTENT: Informasi Umum Kampus
    
    Input Pengguna: Terima kasih
    INTENT: Lain-lain
    
      == Input Pengguna ==
      {user_input}
    
      == Respons ==
      `);

  const formattedPromptIntent = await promptIntent.format({
    user_input: input_user,
  });

  const intentResult = await generateText({
    model: google("gemma-3-27b-it"),
    messages: [{ role: "user", content: formattedPromptIntent }],
    maxTokens: 50,
    temperature: 0.2,
  });

  let detectedIntent = "Lain-lain";
  const intentMatch = intentResult.text.match(/INTENT:\s*(.*)/);
  if (intentMatch && intentMatch[1]) {
    detectedIntent = intentMatch[1].trim();
  }
  console.log("Detected intent:", detectedIntent);
  return detectedIntent;
};

export default intentDetection;
