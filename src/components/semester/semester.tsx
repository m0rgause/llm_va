"use client";

import { useEffect, useState } from "react";
import { TrashIcon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Alert from "../ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SemesterForm from "./semester-add";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Semester {
  id: number;
  user_id: number;
  nama: number;
}

export default function SemesterLayout() {
  const { data: session, status } = useSession();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogNotifyOpen, setDialogNotifyOpen] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [notify, setNotify] = useState(false);

  // Fetch semesters from the server
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const userId = session?.user.id;
        if (!userId) return;
        const response = await fetch(`/api/v1/semester/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch semesters");
        }
        const data = await response.json();
        setSemesters(data);
      } catch (error) {
        throw new Error("Failed to fetch semesters");
      }
    };

    const fetchNotify = async () => {
      const userId = session?.user.id;
      if (!userId) return;

      try {
        const response = await fetch(`/api/v1/user/notify/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch notify");
        }
        const data = await response.json();
        setNotify(data);
      } catch (error) {
        throw new Error("Failed to fetch notify");
      }
    };

    fetchNotify();
    fetchSemesters();
  }, [session]);

  const handleNotify = async (e: boolean) => {
    const userId = session?.user.id;
    if (!userId) return;

    const response = await fetch(`/api/v1/user/notify/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notify: e, userId }),
    });

    if (!response.ok) {
      setNotify(false);
      const { error } = await response.json();
      if (error == "User is not saved") {
        setDialogNotifyOpen(true);
      }
      return;
    }

    const data = await response.json();
    if (data) {
      setNotify(e);
      // setAlert({ message: "Notify updated successfully", type: "success" });
    } else {
      setNotify(false);
      // setAlert({ message: "Failed to update notify", type: "error" });
    }
  };

  const handleSemesterCreated = (semester: Semester) => {
    setSemesters((prevSemesters) => [...prevSemesters, semester]);
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Semester</h1>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <a
                href="#"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                Dashboard
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
                  Semester
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
        <div className="flex justify-between items-center mb-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                className={`relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-600 to-blue-500 group-hover:from-green-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800`}
                type="button"
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-accent dark:bg-card rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                  Tambah Semester
                </span>
              </button>
            </DialogTrigger>
            <DialogContent
              className="space-y-2"
              aria-describedby="Add Semester"
            >
              <DialogTitle>Tambah Semester</DialogTitle>
              <SemesterForm
                onSemesterCreated={handleSemesterCreated}
                onAlert={setAlert}
              />
            </DialogContent>
          </Dialog>
          <label className="inline-flex items-center cursor-pointer">
            <span className="me-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              Pengingat Kelas
            </span>
            <input
              type="checkbox"
              checked={notify}
              className="sr-only peer"
              onChange={(e) => handleNotify(e.target.checked)}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="relative overflow-x-auto dark:shadow-md sm:rounded">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead>
              <tr className=" text-gray-700 uppercase bg-gray-50 bg-accent dark:bg-[#1D1D1F] dark:text-gray-400 dark:border-gray-700 border-gray-200">
                <th scope="col" className="px-6 py-3">
                  Semester
                </th>
                <th scope="col" className="px-6 py-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((semester) => (
                <tr
                  key={semester.id}
                  className="dark:bg-[#27272a] border-b dark:border-gray-700 border-gray-200"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    Semester {semester.nama}
                  </th>
                  <td className="px-6 py-4 flex gap-2">
                    <form
                      method="POST"
                      action="."
                      onSubmit={async (e) => {
                        console.log("Deleting semester:", semester.id);
                        e.preventDefault();
                        const res = await fetch(
                          `/api/v1/semester/${semester.id}`,
                          {
                            method: "DELETE",
                          }
                        );
                        if (res.ok) {
                          setSemesters((prev) =>
                            prev.filter((s) => s.id !== semester.id)
                          );
                          // reload the page to reflect changes
                          setAlert({
                            message: "Semester berhasil dihapus",
                            type: "success",
                          });
                          setTimeout(() => {
                            setAlert({ message: "", type: "" });
                          }, 3000);
                          window.location.reload();
                        } else {
                          setAlert({
                            message: "Gagal menghapus semester",
                            type: "error",
                          });
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-700 dark:border-red-700 dark:hover:bg-red-800 dark:hover:border-red-800 dark:focus:ring-red-900"
                        title="Hapus Semester"
                        onClick={(e) => {
                          if (
                            !confirm(
                              "Apakah Anda yakin ingin menghapus semester ini? Semua data terkait semester ini akan dihapus."
                            )
                          ) {
                            return;
                          }
                        }}
                      >
                        Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={dialogNotifyOpen} onOpenChange={setDialogNotifyOpen}>
        <DialogContent className="space-y-2" aria-describedby="Add Semester">
          <DialogTitle className="flex items-center gap-2">
            Pengingat Kelas
          </DialogTitle>
          {/* col */}
          <div className="flex gap-5">
            <ExclamationTriangleIcon className="h-16 text-yellow-500 w-24 self-center" />
            <p className="text-sm text-gray-700 dark:text-gray-300 self-center">
              Untuk mengaktifkan pengingat kelas, silakan chat terlebih dahulu
              ke nomor WhatsApp virtual assistant dengan mengklik button di
              bawah.
            </p>
          </div>

          <Link
            onClick={() => setDialogNotifyOpen(false)}
            href={`https://wa.me/${
              process.env.NEXT_PUBLIC_BOT_WA_NUMBER
            }?text=${encodeURIComponent(`!start ${session?.user.id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
          >
            Chat WhatsApp
          </Link>
        </DialogContent>
      </Dialog>
    </div>
  );
}
