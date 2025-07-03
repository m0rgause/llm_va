import { convertTime, formatTime } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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

interface KRSEditProps {
  krsData: KRS | null;
  onKRSUpdated: (updatedKRS: KRS) => void;
  onAlert: (alert: { message: string; type: string }) => void;
}

const KRSEdit: React.FC<KRSEditProps> = ({
  krsData,
  onKRSUpdated,
  onAlert,
}) => {
  const { data: session, status } = useSession();
  const [krs, setKrs] = useState<KRS | null>(krsData || null);
  const pathname = usePathname();

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!krs) {
      onAlert({ message: "KRS data is incomplete", type: "error" });
      return;
    }

    const updatedKRS: KRS = {
      ...krs,
      user_id: session?.user?.id || "",
      hari: krs.hari.toLowerCase(),
      waktu_mulai: new Date(
        `1970-01-01T${convertTime(krs.waktu_mulai)}:00Z`
      ).toISOString(),
      waktu_selesai: new Date(
        `1970-01-01T${convertTime(krs.waktu_selesai)}:00Z`
      ).toISOString(),
    };

    try {
      const response = await fetch(`/api/v1/krs/${krs.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedKRS),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        onAlert({
          message: errorData.error || "Failed to update KRS",
          type: "error",
        });
        return;
      }
      const updatedData = await response.json();
      setKrs(updatedData);
      onKRSUpdated(updatedData);
      onAlert({ message: "KRS updated successfully", type: "success" });
    } catch (error) {
      console.error("Error updating KRS:", error);
      onAlert({ message: "Failed to update KRS", type: "error" });
      return;
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto"
        aria-describedby="krs-form-description"
      >
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="text"
            name="mata_kuliah"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={krs?.mata_kuliah || ""}
            onChange={(e) =>
              setKrs({ ...krs, mata_kuliah: e.target.value } as KRS)
            }
            required
          />
          <label
            htmlFor="mata_kuliah"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Mata Kuliah
          </label>
        </div>
        <div className="relative z-0 w-full mb-5 group">
          <select
            name="hari"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            value={
              krs && krs.hari
                ? krs.hari.charAt(0).toUpperCase() + krs.hari.slice(1)
                : ""
            }
            onChange={(e) => setKrs({ ...krs, hari: e.target.value } as KRS)}
            required
          >
            <option value="" disabled>
              Pilih Hari
            </option>
            {days.map((day) => (
              <option
                key={day}
                value={day}
                className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                {day}
              </option>
            ))}
          </select>
          <label
            htmlFor="hari"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Hari
          </label>
        </div>
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="time"
            name="waktu_mulai"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={
              krs?.waktu_mulai ? convertTime(krs.waktu_mulai) : "08:00" // Default value for time input
            } // Default value for time input
            onChange={(e) =>
              setKrs({ ...krs, waktu_mulai: e.target.value } as KRS)
            }
            required
          />
          <label
            htmlFor="waktu_mulai"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Waktu Mulai
          </label>
        </div>
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="time"
            name="waktu_selesai"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={
              krs?.waktu_selesai ? convertTime(krs.waktu_selesai) : "10:00" // Default value for time input
            } // Default value for time input
            onChange={(e) =>
              setKrs({ ...krs, waktu_selesai: e.target.value } as KRS)
            }
            required
          />
          <label
            htmlFor="waktu_selesai"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Waktu Selesai
          </label>
        </div>
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="text"
            name="kode"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={krs?.kode || ""}
            onChange={(e) => setKrs({ ...krs, kode: e.target.value } as KRS)}
            required
          />
          <label
            htmlFor="kode"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Kode
          </label>
        </div>
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="text"
            name="kelas"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={krs?.kelas || ""}
            onChange={(e) => setKrs({ ...krs, kelas: e.target.value } as KRS)}
            required
          />
          <label
            htmlFor="kelas"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Kelas
          </label>
        </div>
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="text"
            name="ruang"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={krs?.ruang || ""}
            onChange={(e) => setKrs({ ...krs, ruang: e.target.value } as KRS)}
            required
          />
          <label
            htmlFor="ruang"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Ruang
          </label>
        </div>
        <div className="relative z-0 w-full mb-5 group">
          <input
            type="text"
            name="dosen"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            value={krs?.dosen || ""}
            onChange={(e) => setKrs({ ...krs, dosen: e.target.value } as KRS)}
            required
          />
          <label
            htmlFor="dosen"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Dosen
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Simpan KRS
        </button>
      </form>
    </div>
  );
};

export default KRSEdit;
