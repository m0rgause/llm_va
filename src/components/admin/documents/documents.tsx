"use client";
import Alert from "@/components/ui/alert";
import { TrashIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DocumentForm from "./documents-add";

interface Document {
  id: number;
  user_id: number;
  nama: string;
  category: string;
  file_name: string;
  file_type: string;
  file_size: number;
  user: {
    id: string;
    nama: string;
    email: string;
  };
}

export default function Documents() {
  const { data: session } = useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const user_id = session?.user.id;

  useEffect(() => {
    const fetchDocuments = async () => {
      if (user_id) {
        try {
          const response = await fetch(`/api/v1/documents?s=${searchQuery}`, {
            method: "GET",
          });
          if (!response.ok) {
            throw new Error("Failed to fetch documents");
          }
          const data = await response.json();
          setDocuments(data.data);
        } catch (error) {
          setAlert({
            message: "Error fetching documents",
            type: "error",
          });
        }
      }
    };

    fetchDocuments();
  }, [user_id]);

  const handleDocumentCreated = (formData: FormData) => {
    const document: Document = {
      id: Number(formData.get("id")),
      user_id: Number(formData.get("user_id")),
      nama: String(formData.get("nama")),
      category: String(JSON.stringify(formData.get("category"))),
      file_name: String(formData.get("file_name")),
      file_type: String(formData.get("file_type")),
      file_size: Number(formData.get("file_size")),
      user: {
        id: String(formData.get("user_id")),
        nama: session?.user.nama || "",
        email: session?.user.email || "",
      },
    };
    setDocuments((prev) => [...prev, document]);
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <a
                href="#"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                Administrator
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
                  Documents
                </a>
              </div>
            </li>
          </ol>
        </nav>
      </div>
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
                  Tambah Dokumen
                </span>
              </button>
            </DialogTrigger>
            <DialogContent
              className="space-y-2"
              aria-describedby="Add Semester"
            >
              <DialogTitle>Tambah Dokumen</DialogTitle>
              <DocumentForm
                onDocumentCreated={handleDocumentCreated}
                onAlert={setAlert}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative overflow-x-auto dark:shadow-md sm:rounded">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead>
              <tr className=" text-gray-700 uppercase bg-gray-50 bg-accent dark:bg-[#1D1D1F] dark:text-gray-400 dark:border-gray-700 border-gray-200">
                <th scope="col" className="px-6 py-3">
                  Nama
                </th>
                <th scope="col" className="px-6 py-3">
                  Kategori
                </th>
                <th scope="col" className="px-6 py-3">
                  Nama File
                </th>
                <th scope="col" className="px-6 py-3">
                  Tipe File
                </th>
                <th scope="col" className="px-6 py-3">
                  Ukuran File
                </th>
                <th scope="col" className="px-6 py-3">
                  Pengunggah
                </th>
                <th scope="col" className="px-6 py-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="dark:bg-[#27272a] border-b dark:border-gray-700 border-gray-200"
                >
                  <td
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    {doc.nama}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const categories = JSON.parse(JSON.parse(doc.category));

                      try {
                        if (Array.isArray(categories)) {
                          return categories.map((cat: string) => (
                            <span
                              key={cat}
                              className="inline-block px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300"
                            >
                              {cat}
                            </span>
                          ));
                        }
                        return <span>{categories}</span>;
                      } catch {
                        return <span>{categories}</span>;
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4">{doc.file_name}</td>
                  <td className="px-6 py-4">{doc.file_type}</td>
                  <td className="px-6 py-4">{doc.file_size} KB</td>
                  <td className="px-6 py-4">{doc.user.nama}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <form
                      method="POST"
                      action={`/api/v1/documents/${doc.id}`}
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          const res = await fetch(
                            `/api/v1/documents/${doc.id}`,
                            {
                              method: "DELETE",
                            }
                          );
                          if (!res.ok) {
                            throw new Error("Failed to delete document");
                          }
                          setDocuments((prev) =>
                            prev.filter((d) => d.id !== doc.id)
                          );
                          setAlert({
                            message: "Document deleted successfully",
                            type: "success",
                          });
                        } catch {
                          setAlert({
                            message: "Error deleting document",
                            type: "error",
                          });
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="font-medium text-red-600 dark:text-red-500 hover:underline"
                        title="Delete"
                        onClick={(e) => {
                          if (
                            !confirm(
                              "Apakah Anda yakin ingin menghapus dokumen ini?"
                            )
                          ) {
                            return;
                          }
                        }}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
