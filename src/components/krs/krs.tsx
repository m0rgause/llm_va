"use client";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
} from "@/components/ui/dialog";
import KRSAdd from "./krs-add";
import Alert from "../ui/alert";
import { formatTime } from "@/lib/utils";
import KRSEdit from "./krs-edit";

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

export default function KRS() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [krs, setKrs] = useState<KRS[]>([]);
  const [dialogAddOpen, setDialogAddOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [alert, setAlert] = useState({
    message: "",
    type: "",
  });

  const pathname = usePathname();
  const semester = pathname.split("/").pop();
  const user_id = session?.user.id;

  useEffect(() => {
    const fetchKRS = async () => {
      if (user_id && semester) {
        try {
          const response = await fetch(
            `/api/v1/krs?user_id=${user_id}&semester=${semester}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch KRS");
          }
          const data = await response.json();

          const formattedData = data.map((item: KRS) => {
            return {
              ...item,
              waktu_mulai: formatTime(item.waktu_mulai),
              waktu_selesai: formatTime(item.waktu_selesai),
            };
          });
          setKrs(formattedData);
        } catch (error) {
          console.error("Error fetching KRS:", error);
          setAlert({ message: "Gagal memuat data KRS", type: "error" });
        }
      }
    };

    fetchKRS();
  }, [user_id, semester]);

  const handleAddKRS = (newKRS: KRS) => {
    const formattedKRS = {
      ...newKRS,
      waktu_mulai: formatTime(newKRS.waktu_mulai),
      waktu_selesai: formatTime(newKRS.waktu_selesai),
    };
    setKrs((prevKrs) => [...prevKrs, formattedKRS]);
    setDialogAddOpen(false);
  };

  const handleEditClick = (itemId: string) => {
    setEditingItemId(itemId);
  };

  const handleEditDialogClose = () => {
    setEditingItemId(null);
  };

  const handleKRSUpdated = (updatedData: KRS) => {
    setKrs((prevKrs) =>
      prevKrs.map((item) =>
        item.id === updatedData.id
          ? {
              ...item,
              ...updatedData,
              waktu_mulai: formatTime(updatedData.waktu_mulai),
              waktu_selesai: formatTime(updatedData.waktu_selesai),
            }
          : item
      )
    );
    setEditingItemId(null);
    setTimeout(() => {
      setAlert({ message: "", type: "" });
    }, 2000);
  };

  const handleDelete = async (itemToDelete: KRS) => {
    const confirmDelete = confirm(
      `Apakah anda yakin ingin menghapus ${itemToDelete.mata_kuliah}?`
    );
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/krs/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete KRS");
      }

      setKrs((prevKrs) =>
        prevKrs.filter((krsItem) => krsItem.id !== itemToDelete.id)
      );

      const data = await response.json();
      setAlert({
        message: `Berhasil menghapus ${data.mata_kuliah || "item"}`,
        type: "success",
      });

      setTimeout(() => {
        setAlert({ message: "", type: "" });
      }, 3000);
    } catch (error: any) {
      console.error("Error deleting KRS:", error);
      setAlert({
        message: error.message || "Gagal menghapus KRS",
        type: "error",
      });
      setTimeout(() => {
        setAlert({ message: "", type: "" });
      }, 3000);
    }
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
      {(alert.message !== "" || alert.type !== "") && (
        <Alert
          message={alert.message}
          type={alert.type as "error" | "success"}
        />
      )}

      <div className="bg-accent dark:bg-card p-4 rounded shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <Dialog open={dialogAddOpen} onOpenChange={setDialogAddOpen}>
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
            <DialogPortal>
              <DialogOverlay className="fixed inset-0 bg-black/40" />
              <DialogContent
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md p-6 bg-white dark:bg-card rounded-lg shadow-xl space-y-4"
                aria-describedby="dialog-description"
              >
                <DialogTitle>Tambah Mata Kuliah</DialogTitle>
                <KRSAdd onKRSCreated={handleAddKRS} onAlert={setAlert} />
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </div>

        <div className="relative overflow-x-auto dark:shadow-md rounded">
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
              {krs.map((item, index) => {
                const itemId = item.id || `temp-${index}`;
                return (
                  <tr
                    key={itemId}
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
                      <Dialog
                        open={editingItemId === itemId}
                        onOpenChange={(open) => {
                          if (!open) {
                            handleEditDialogClose();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <button
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500 dark:focus:ring-blue-800"
                            type="button"
                            onClick={() => handleEditClick(itemId)}
                          >
                            Ubah
                          </button>
                        </DialogTrigger>
                        <DialogPortal>
                          <DialogOverlay className="fixed inset-0 bg-black/40" />
                          <DialogContent
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md p-6 bg-white dark:bg-card rounded-lg shadow-xl space-y-4"
                            aria-describedby="dialog-description"
                          >
                            <DialogTitle>Ubah Mata Kuliah</DialogTitle>
                            <KRSEdit
                              krsData={item}
                              onKRSUpdated={handleKRSUpdated}
                              onAlert={setAlert}
                            />
                          </DialogContent>
                        </DialogPortal>
                      </Dialog>
                      <button
                        onClick={() => {
                          if (item.id) {
                            handleDelete(item);
                          } else {
                            setAlert({
                              message: "Item ID is missing, cannot delete.",
                              type: "error",
                            });
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-700 dark:border-red-700 dark:hover:bg-red-800 dark:hover:border-red-800 dark:focus:ring-red-900"
                        type="button"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
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
