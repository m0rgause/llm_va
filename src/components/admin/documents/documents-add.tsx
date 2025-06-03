import { useState, useRef } from "react";
import { useSession } from "next-auth/react";

interface DocumentFormProps {
  onDocumentCreated: (documentData: FormData) => void;
  onAlert: (alert: { message: string; type: string }) => void;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  onDocumentCreated,
  onAlert,
}) => {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [documentCategories, setDocumentCategories] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false); // Loading state

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentTitle(event.target.value);
  };

  const handleCategoryInputChange = (index: number, value: string) => {
    const newCategories = [...documentCategories];
    newCategories[index] = value;
    setDocumentCategories(newCategories);
  };

  const handleAddCategory = () => {
    setDocumentCategories([...documentCategories, ""]);
  };

  const handleRemoveCategory = (index: number) => {
    const newCategories = documentCategories.filter((_, i) => i !== index);
    setDocumentCategories(newCategories);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    if (!documentTitle.trim()) {
      onAlert({ message: "Judul dokumen tidak boleh kosong.", type: "error" });
      setLoading(false);
      return;
    }

    const validCategories = documentCategories.filter(
      (cat) => cat.trim() !== ""
    );
    if (validCategories.length === 0) {
      onAlert({
        message: "Mohon tambahkan setidaknya satu kategori dokumen.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    if (!selectedFile) {
      onAlert({
        message: "Mohon pilih dokumen terlebih dahulu.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("nama", documentTitle);
    formData.append("category", JSON.stringify(validCategories));
    formData.append("file_name", selectedFile.name);
    formData.append(
      "file_type",
      selectedFile.type || "application/octet-stream"
    );
    formData.append("file_size", selectedFile.size.toString());
    formData.append("user_id", session?.user.id || "");

    try {
      const response = await fetch("/api/v1/documents", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Gagal mengunggah dokumen.");
      }
      onDocumentCreated(formData);
      onAlert({
        message: "Dokumen berhasil diunggah.",
        type: "success",
      });
      setSelectedFile(null);
      setDocumentTitle("");
      setDocumentCategories([""]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await response.json();
    } catch (error: any) {
      onAlert({
        message: error.message || "Terjadi kesalahan saat mengunggah dokumen.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Judul Dokumen */}
        <div className="mb-4">
          <label
            htmlFor="documentTitle"
            className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300"
          >
            Judul Dokumen:
          </label>
          <input
            type="text"
            id="documentTitle"
            className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-[#27272a] dark:border-gray-700 dark:text-gray-300 dark:focus:ring-gray-600"
            placeholder="Masukkan judul dokumen"
            value={documentTitle}
            onChange={handleTitleChange}
            disabled={loading}
          />
        </div>

        {/* Kategori Dokumen (Input Dinamis) */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
            Kategori Dokumen:
          </label>
          {documentCategories.map((category, index) => (
            <div key={index} className="flex items-center mb-2">
              <input
                type="text"
                className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-[#27272a] dark:border-gray-700 dark:text-gray-300 dark:focus:ring-gray-600 mr-2"
                placeholder={`Kategori ${index + 1}`}
                value={category}
                onChange={(e) =>
                  handleCategoryInputChange(index, e.target.value)
                }
                disabled={loading}
              />
              {documentCategories.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(index)}
                  className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                  disabled={loading}
                >
                  Hapus
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCategory}
            className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600 mt-2"
            disabled={loading}
          >
            Tambah Kategori
          </button>
        </div>

        {/* Pilih Dokumen */}
        <div className="mb-6">
          <label
            htmlFor="documentUpload"
            className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300"
          >
            Pilih Dokumen:
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="documentUpload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition duration-300 ease-in-out dark:bg-[#27272a] dark:border-gray-700 dark:hover:bg-slate-800"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-900 dark:text-gray-300"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L7 9m3-3 3 3"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-900 dark:text-gray-300">
                  <span className="font-semibold">Klik untuk mengunggah</span>{" "}
                  atau seret dan lepas
                </p>
                <p className="text-xs text-gray-900 dark:text-gray-300">
                  PDF, TXT
                </p>
              </div>
              <input
                id="documentUpload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                accept=".pdf, .txt"
                disabled={loading}
              />
            </label>
          </div>
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              File terpilih:{" "}
              <span className="font-medium">{selectedFile.name}</span>
            </p>
          )}
        </div>

        {/* Tombol Unggah */}
        <button
          type="submit"
          className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Mengunggah...
            </>
          ) : (
            "Unggah Dokumen"
          )}
        </button>
      </form>
    </div>
  );
};

export default DocumentForm;
