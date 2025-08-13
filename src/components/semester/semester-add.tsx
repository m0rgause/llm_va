import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Semester {
  id: number;
  user_id: number;
  nama: number;
}

interface SemesterFormProps {
  onSemesterCreated: (semester: Semester) => void;
  onAlert: (alert: { message: string; type: string }) => void;
}

const SemesterForm: React.FC<SemesterFormProps> = ({
  onSemesterCreated,
  onAlert,
}) => {
  // get session
  const { data: session, status } = useSession();
  const [lastSemester, setLastSemester] = useState<number | null>(null);

  useEffect(() => {
    const fetchLastSemester = async () => {
      if (session?.user.id) {
        const response = await fetch(
          `/api/v1/semester/last?user_id=${session.user.id}`
        );

        if (!response.ok) {
          // onAlert({ message: "Failed to fetch last semester", type: "error" });
          setLastSemester(0);
          return;
        }
        const data = await response.json();
        setLastSemester(data?.nama);
      }
    };

    fetchLastSemester();
  }, [session?.user.id]);

  if (status === "loading") {
    return <div>Memuat...</div>;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userId = session?.user.id;

    const data = {
      nama: Number(formData.get("nama")),
      user_id: userId,
    };

    // Validate input
    if (!data.nama) {
      onAlert({ message: "Nama semester harus diisi", type: "error" });
      return;
    }

    const response = await fetch("/api/v1/semester", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const { error } = await response.json();

      onAlert({ message: error, type: "error" });
      return;
    }

    const newSemester = await response.json();
    onSemesterCreated(newSemester);

    onAlert({ message: "Semester berhasil dibuat", type: "success" });
    setTimeout(() => {
      onAlert({ message: "", type: "" });
    }, 5000);
    // reload the page to reflect changes
    window.location.reload();
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-2"
        aria-describedby="Add Semester"
      >
        <div className="mb-4">
          <label
            htmlFor="nama"
            className="block text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            Nama Semester
          </label>
          <input
            type="number"
            name="nama"
            value={lastSemester !== null ? lastSemester + 1 : ""}
            id="nama"
            readOnly={true}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-[#27272a] dark:border-gray-600 dark:text-white"
            placeholder="Masukkan nama semester"
          />
        </div>
        <button
          type="submit"
          className={`relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-green-600 to-blue-500 group-hover:from-green-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800`}
        >
          <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-accent dark:bg-card rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
            Tambah Semester
          </span>
        </button>
      </form>
    </div>
  );
};

export default SemesterForm;
