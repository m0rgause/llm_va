const normalizeText = (text: string) => {
  const dictionary = {
    TA: "tugas akhir",
    Metopen: "metodologi penelitian",
    PA: "pembimbing akademik",
    BNSP: "badan nasional sertifikasi profesi",
    SIA: "sistem informasi akademik",
    MKCU: "Mata Kuliah Ciri Universitas",
    MKCF: "Mata Kuliah Ciri Fakultas",
    MKPP: "Mata Kuliah Pilihan Prodi",
    MKWP: "mata kuliah wajib prodi",
    PKM: "program kreativitas mahasiswa",
    MBKM: "Merdeka Belajar Kampus Merdeka",
    MSIB: "Magang dan Studi Independen Bersertifikat",
    KP: "Kerja Praktek",
    SKS: "Satuan Kredit Semester",
    SKPI: "Surat Keterangan Pendamping Ijazah",
    KRS: "Kartu Rencana Studi",
    KHS: "Kartu Hasil Studi",
    Matkul: "Mata Kuliah",
    MK: "Mata Kuliah",
  };

  // if the text contains any of the keys in the dictionary, replace it with the corresponding value
  for (let [key, value] of Object.entries(dictionary)) {
    // lowercase the text and value for case-insensitive replacement
    key = key.toLowerCase();
    value = value.toLowerCase();
    text = text.toLowerCase();

    const regex = new RegExp(`\\b${key}\\b`, "gi");
    text = text.replace(regex, value);
  }

  // Normalize spaces and remove extra spaces
  text = text
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .trim(); // Trim leading and trailing spaces

  return text;
};

export default normalizeText;
