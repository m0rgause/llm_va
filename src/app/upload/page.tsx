"use client";
import React, { useState } from "react";

export default function UploadFile() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Pilih file terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      alert(result.message || "File berhasil diunggah.");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengunggah file.");
    }
  };

  return (
    <div>
      <input type="file" accept=".txt,.csv" onChange={handleFileChange} />
      <button onClick={handleUpload}>Unggah File</button>
    </div>
  );
}
