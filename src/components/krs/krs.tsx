"use client";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import KRSAdd from "./krs-add";
import Alert from "../ui/alert";

// No| Hari| Mulai| Selesai| Kode | Mata Kuliah| Kelas| Dosen
interface KRS {
  id: number;
  hari: string;
  waktu_mulai: string;
  waktu_selesai: string;
  kode: string;
  mata_kuliah: string;
  kelas: string;
  ruang: string;
  dosen: string;
}

export default function KRS() {
  const { data: session, status } = useSession();
  const [krs, setKrs] = useState<KRS[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alert, setAlert] = useState({
    message: "",
    type: "",
  });

  const pathname = usePathname();
  const semester = pathname.split("/").pop();
  const user_id = session?.user.id;

  const formatTime = (date: string) => {
    const dateObj = new Date(date);
    const hours = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();
    const amPm = hours < 12 ? "AM" : "PM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, "0")} ${amPm}`;
  };

  useEffect(() => {
    const fetchKRS = async () => {
      if (user_id && semester) {
        const response = await fetch(
          `/api/v1/krs?user_id=${user_id}&semester=${semester}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch KRS");
        }
        const data = await response.json();

        // re apply date formatting
        const formattedData = data.map((item: KRS) => {
          return {
            ...item,
            waktu_mulai: formatTime(item.waktu_mulai),
            waktu_selesai: formatTime(item.waktu_selesai),
          };
        });
        setKrs(formattedData);
      }
    };

    fetchKRS();
  }, [user_id, semester]);

  const handleChange = (krs: KRS) => {
    const formattedKRS = {
      ...krs,
      waktu_mulai: formatTime(krs.waktu_mulai),
      waktu_selesai: formatTime(krs.waktu_selesai),
    };
    setKrs((prevKrs) => [...prevKrs, formattedKRS]);

    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">KRS</h1>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <a
                href="#"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                Kartu Rencana Studi
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <a
                  href="#"
                  className="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
                >
                  Semester {semester}
                </a>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      {/* alert */}
      {(alert.message != "" || alert.type != "") && (
        <Alert message={alert.message} type={alert.type as "error"} />
      )}

      <div className="bg-accent dark:bg-card p-4 rounded shadow-lg mb-6">
        <div className="flex justify-betweem items-center mb-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                className={`relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-600 to-blue-500 group-hover:from-green-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800`}
                type="button"
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-accent dark:bg-card rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                  Tambah Mata Kuliah
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="space-y-2" aria-describedby="Add KRS">
              <DialogTitle>Tambah Mata Kuliah</DialogTitle>
              <KRSAdd onKRSCreated={handleChange} onAlert={setAlert} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative overflow-x-auto shadow-md rounded">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead>
              <tr className="text-gray-700 uppercase bg-gray-50 bg-accent dark:bg-[#1D1D1F] dark:text-gray-400 dark:border-gray-700 border-gray-200">
                <th scope="col" className="px-6 py-3">
                  No
                </th>
                <th scope="col" className="px-6 py-3">
                  Mata Kuliah
                </th>
                <th scope="col" className="px-6 py-3">
                  Hari
                </th>
                <th scope="col" className="px-6 py-3">
                  Waktu Mulai
                </th>
                <th scope="col" className="px-6 py-3">
                  Waktu Selesai
                </th>
                <th scope="col" className="px-6 py-3">
                  Kode
                </th>
                <th scope="col" className="px-6 py-3">
                  Kelas
                </th>
                <th scope="col" className="px-6 py-3">
                  Ruang
                </th>
                <th scope="col" className="px-6 py-3">
                  Dosen
                </th>
                <th scope="col" className="px-6 py-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {krs.map((item, index) => (
                <tr
                  key={item.id}
                  className="dark:bg-[#27272a] border-b dark:border-gray-700 border-gray-200"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">{item.mata_kuliah}</td>
                  <td className="px-6 py-4">
                    {item.hari.charAt(0).toUpperCase() + item.hari.slice(1)}
                  </td>
                  <td className="px-6 py-4">{item.waktu_mulai}</td>
                  <td className="px-6 py-4">{item.waktu_selesai}</td>
                  <td className="px-6 py-4">{item.kode}</td>
                  <td className="px-6 py-4">{item.kelas}</td>
                  <td className="px-6 py-4">{item.ruang}</td>
                  <td className="px-6 py-4">{item.dosen}</td>
                  <td className="px-6 py-4 flex gap-2">
                    {/* edit */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                          onClick={() => {
                            setDialogOpen(true);
                            // set the form values to the selected item
                            const form = document.querySelector(
                              "#krs-form"
                            ) as HTMLFormElement;
                            if (form) {
                              form.hari.value = item.hari;
                              form.waktu_mulai.value = item.waktu_mulai;
                              form.waktu_selesai.value = item.waktu_selesai;
                              form.kode.value = item.kode;
                              form.mata_kuliah.value = item.mata_kuliah;
                              form.kelas.value = item.kelas;
                              form.ruang.value = item.ruang;
                              form.dosen.value = item.dosen;
                              // form.id.value = String(item.id);
                            }
                          }}
                        >
                          Edit
                        </button>
                      </DialogTrigger>
                      <DialogContent
                        className="space-y-2"
                        aria-describedby="Edit KRS"
                      >
                        <DialogTitle>Edit Mata Kuliah</DialogTitle>
                        <KRSAdd
                          onKRSCreated={handleChange}
                          onAlert={setAlert}
                        />
                      </DialogContent>
                    </Dialog>
                    {/* delete */}
                    <a
                      href="#"
                      onClick={async () => {
                        // send warning before delete
                        const confirmDelete = confirm(
                          `Apakah anda yakin ingin menghapus ${item.mata_kuliah}?`
                        );
                        if (!confirmDelete) {
                          return;
                        }

                        const response = await fetch(`/api/v1/krs/${item.id}`, {
                          method: "DELETE",
                        });

                        if (!response.ok) {
                          setAlert({
                            message: "Gagal menghapus KRS",
                            type: "error",
                          });
                          return;
                        }
                        setKrs((prevKrs) =>
                          prevKrs.filter((krs) => krs.id !== item.id)
                        );

                        const data = await response.json();

                        setAlert({
                          message: `Berhasil menghapus ${data.mata_kuliah}`,
                          type: "success",
                        });

                        setTimeout(() => {
                          setAlert({ message: "", type: "" });
                        }, 3000);
                      }}
                      className="font-medium text-red-600 dark:text-red-500 hover:underline"
                    >
                      Hapus
                    </a>
                  </td>
                </tr>
              ))}
              {krs.length === 0 && (
                <tr className="dark:bg-[#27272a] border-b dark:border-gray-700 border-gray-200">
                  <td
                    colSpan={10}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada data KRS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
