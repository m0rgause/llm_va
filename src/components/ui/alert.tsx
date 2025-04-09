"use client";

import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

interface AlertProps {
  message: string;
  type: "success" | "error" | "info";
}

const Alert: React.FC<AlertProps> = ({ message, type }) => {
  // save on local storage
  React.useEffect(() => {
    localStorage.setItem("alert", message);
  }, [message]);

  return (
    <div
      className={`flex items-center p-4 mb-4 text-sm border rounded-lg mt-5 ${
        type === "success"
          ? "text-green-800 border-green-300 "
          : type === "error"
          ? "text-red-800 border-red-300 "
          : "text-blue-800 border-blue-300 "
      }`}
      role="alert"
    >
      <i className="bi bi-info-circle-fill me-3"></i>
      <div>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Alert;
