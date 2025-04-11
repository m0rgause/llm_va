import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface KRS {
  id: number;
  user_id: number;
  hari: string;
  waktu_mulai: string;
  waktu_selesai: string;
  kode: string;
  mata_kuliah: string;
  kelas: string;
  ruang: string;
  dosen: string;
}

interface KRSAddProps {
  onKRSCreated: (krs: KRS) => void;
  onAlert: (alert: { message: string; type: string }) => void;
}

const KRSAdd: React.FC<KRSAddProps> = ({ onKRSCreated, onAlert }) => {
  const { data: session, status } = useSession();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto"
        aria-describedby="Add KRS"
      >
        <div className="relative z-0 w-full mb-5 group">
          <select
            name="hari"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            required
          >
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
        </div>
      </form>
    </div>
  );
};

export default KRSAdd;
