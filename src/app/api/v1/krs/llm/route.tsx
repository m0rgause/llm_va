import { prisma } from "@/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { PromptTemplate } from "@langchain/core/prompts";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  let {
    jadwal_kuliah,
    user_id,
    semester,
  }: {
    jadwal_kuliah: string;
    user_id: string;
    semester: string;
  } = await request.json();

  const error: string[] = [];
  if (!jadwal_kuliah) error.push("Jadwal kuliah diperlukan");
  if (!user_id) error.push("ID pengguna diperlukan");
  if (!semester) error.push("Semester diperlukan");

  if (error.length > 0) {
    return new Response(JSON.stringify({ error }), { status: 400 });
  }

  const existingSemester = await prisma.semester.findFirst({
    where: {
      nama: Number(semester),
      user_id: user_id,
    },
  });

  if (!existingSemester) {
    return new Response(JSON.stringify({ error: ["Semester not found"] }), {
      status: 404,
    });
  }

  const promptTemplate = PromptTemplate.fromTemplate(`
Anda adalah asisten AI yang sangat ahli dalam mengekstrak informasi dari teks yang tidak terstruktur. Tugas Anda adalah membaca blok teks data jadwal kuliah dan mengubahnya menjadi sebuah array JSON yang valid.

Konteks & Aturan:
1.  Fokus utama Anda adalah mengekstrak data dari teks di bawah ini.
2. Ekstrak Informasi: Untuk setiap mata kuliah, ekstrak data berikut:
- hari, waktu_mulai, waktu_selesai, kode, mata_kuliah (gunakan nama dalam Bahasa Indonesia), dan kelas.
- ruang: Ekstrak dari teks setelah "Ruang :". Contoh: dari "Ruang : D-204", ambil "D-204".
- dosen: Ekstrak nama lengkap dosen beserta title yang disandang yang tercantum sebelum nama jurusan ("Teknik Informatika")
3.  Output HARUS berupa array JSON yang valid tanpa teks atau penjelasan tambahan.

Berikut adalah data jadwal kuliah yang perlu Anda proses:
{jadwal_kuliah}

Tugas anda:
Berdasarkan data jadwal kuliah yang diberikan, buatkan array JSON lengkap untuk semua mata kuliah sesuai aturan di atas. Pastikan formatnya valid dan sesuai dengan contoh yang diberikan.
    `);

  const formattedPrompt = await promptTemplate.format({
    jadwal_kuliah: jadwal_kuliah,
  });

  // 5. Panggil AI
  const response = await generateText({
    model: google("gemma-3-27b-it"),
    prompt: formattedPrompt,
  });

  // 6. Parsing dan validasi response
  let krsData: any[];
  try {
    const rawText = response.text.trim();
    // Menggunakan regex untuk menemukan JSON yang valid dalam teks
    const jsonMatch = rawText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawText;
    krsData = JSON.parse(jsonString); // Parse the cleaned string
    if (!Array.isArray(krsData)) {
      throw new Error("Parsed data is not a valid array.");
    }
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: ["Failed to parse AI response as a valid JSON array"],
      }),
      { status: 500 }
    );
  }

  // 7. Simpan ke DB menggunakan Transaksi Prisma
  try {
    const processedKRS = await prisma.$transaction(
      krsData.map((krs) => {
        const where = {
          UQkelas_kode_kelas_semester: {
            kode: krs.kode,
            kelas: krs.kelas,
            semester_id: existingSemester.id,
          },
        };

        const dataToCreateOrUpdate = {
          hari: krs.hari.toLowerCase(),
          waktu_mulai: new Date(`1970-01-01T${krs.waktu_mulai}Z`),
          waktu_selesai: new Date(`1970-01-01T${krs.waktu_selesai}Z`),
          mata_kuliah: krs.mata_kuliah,
          ruang: krs.ruang,
          dosen: krs.dosen,
        };

        return prisma.kelas.upsert({
          where: where,
          update: dataToCreateOrUpdate,

          create: {
            id: uuidv4(),
            ...where.UQkelas_kode_kelas_semester,
            ...dataToCreateOrUpdate,
          },
        });
      })
    );
    return new Response(JSON.stringify(processedKRS), { status: 201 });
  } catch (prismaError) {
    return new Response(
      JSON.stringify({ error: ["Failed to save data to database"] }),
      {
        status: 500,
      }
    );
  }
}
