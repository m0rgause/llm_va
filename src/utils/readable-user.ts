import { formatTime } from "@/lib/utils";

const readableUserData = (userData: any) => {
  let data = `Nama: ${userData.nama}\n`;
  data += `No WhatsApp: ${userData.no_whatsapp || "Tidak ada"}\n`;
  for (const semester of userData.semester) {
    data += `Semester: ${semester.nama}\n`;
    if (semester.kelas && semester.kelas.length > 0) {
      data += "- Kelas:\n";
      for (const kelas of semester.kelas) {
        data += `-- Mata Kuliah: ${kelas.mata_kuliah}, Waktu: (${
          kelas.hari
        }, ${formatTime(kelas.waktu_mulai)} - ${formatTime(
          kelas.waktu_selesai
        )}), Ruangan: ${kelas.ruang}, Dosen: ${kelas.dosen}\n`;
      }
    } else {
      data += "- Kelas: Tidak ada kelas terdaftar.\n";
    }
  }
  return data;
};

export default readableUserData;
