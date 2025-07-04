import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React from "react";

interface KRS {
  id?: string;
  user_id: string;
  hari: string;
  waktu_mulai: string;
  waktu_selesai: string;
  kode: string;
  mata_kuliah: string;
  kelas: string;
  ruang: string;
  dosen: string;
}

type KRSArray = KRS[];

interface KRSAddProps {
  onKRSCreated: (krs: KRSArray) => void;
  onAlert: (alert: { message: string; type: "success" | "error" }) => void;
}

const KRSAddLLM: React.FC<KRSAddProps> = ({ onKRSCreated, onAlert }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [processing, setProcessing] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (processing) return; // Prevent multiple submissions
    setProcessing(true);
    e.preventDefault();
    // get data from textarea
    const textarea = e.currentTarget.querySelector("textarea");
    if (!textarea) return;
    const jadwalKuliah = textarea.value.trim();
    if (!jadwalKuliah) {
      onAlert({ message: "Jadwal Kuliah tidak boleh kosong", type: "error" });
      return;
    }

    const semester = pathname.split("/").pop();
    if (!semester) {
      onAlert({ message: "Semester tidak ditemukan", type: "error" });
      return;
    }

    // call API to process KRS
    const response = await fetch("/api/v1/krs/llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jadwal_kuliah: jadwalKuliah,
        user_id: session?.user.id,
        semester: semester,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      onAlert({
        message: errorData.message || "Gagal memproses KRS",
        type: "error",
      });
      setProcessing(false);
      return;
    }
    const data = await response.json();

    onKRSCreated(data);
    onAlert({ message: "KRS berhasil diproses", type: "success" });
    setProcessing(false);
  };
  return (
    <div>
      {/* BAGIAN BARU: INSTRUKSI & EMBED YOUTUBE */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Cara Penggunaan
        </h2>
        {/* Wrapper untuk membuat video responsif (aspek rasio 16:9) */}
        <div className="relative w-full overflow-hidden rounded-lg shadow-lg pb-[56.25%]">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/s4HS4dy7ff8" // <-- GANTI DENGAN VIDEO ID YOUTUBE ANDA
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Tonton video di atas untuk melihat cara menyalin jadwal kuliah dan
          mem-paste nya di kolom di bawah.
        </p>
      </div>
      {/* AKHIR BAGIAN BARU */}

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <form
        className="w-full mx-auto"
        aria-describedby="krs-add-llm-description"
        onSubmit={handleSubmit}
      >
        {/* text area */}
        <div className="mb-4 relative inline-flex w-full items-center justify-center p-0.5  me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800">
          <textarea
            rows={20}
            className="block py-3.5 px-4 w-full text-sm rounded-lg border-0 active:border-0"
            placeholder="Paste Jadwal Kuliah anda di sini"
            disabled={processing}
          ></textarea>
        </div>
        {/* submit button */}
        <div className="">
          <button
            type="submit"
            className="w-full relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
          >
            <span className="w-full relative px-5 py-2.5 transition-all ease-in duration-75 bg-accent dark:bg-card rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
              {processing ? (
                <span className="animate-spin">Processing...</span>
              ) : (
                "Proses KRS"
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default KRSAddLLM;
