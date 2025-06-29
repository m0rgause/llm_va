"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/alert";
import React from "react";
import "@/app/globals.css";
import Image from "next/image";

export default function Signup() {
  const router = useRouter();
  const [input, setInput] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    no_whatsapp: "",
  });

  const [errors, setErrors] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    no_whatsapp: "",
  });

  const [alert, setAlert] = useState({
    message: "",
    type: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const validateInput = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    switch (name) {
      case "nama":
        if (!value) {
          setErrors({ ...errors, nama: "Name is required" });
        } else {
          setErrors({ ...errors, nama: "" });
        }
        break;
      case "email":
        if (!value) {
          setErrors({ ...errors, email: "Email is required" });
        } else {
          setErrors({ ...errors, email: "" });
        }
        break;
      case "password":
        if (!value) {
          setErrors({ ...errors, password: "Password is required" });
        } else {
          setErrors({ ...errors, password: "" });
        }
        break;
      case "confirmPassword":
        if (value !== input.password) {
          setErrors({ ...errors, confirmPassword: "Passwords do not match" });
        } else {
          setErrors({ ...errors, confirmPassword: "" });
        }
        break;
      case "no_whatsapp":
        if (!value) {
          setErrors({ ...errors, no_whatsapp: "WhatsApp number is required" });
        } else if (!/^\d{10,15}$/.test(value)) {
          setErrors({
            ...errors,
            no_whatsapp: "WhatsApp number must be 10-15 digits",
          });
        } else {
          setErrors({ ...errors, no_whatsapp: "" });
        }
        break;
      default:
        break;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !input.nama ||
      !input.email ||
      !input.password ||
      !input.confirmPassword ||
      !input.no_whatsapp
    ) {
      setAlert({ message: "Please fill all fields", type: "error" });
      return;
    }

    if (input.password !== input.confirmPassword) {
      setAlert({ message: "Passwords do not match", type: "error" });
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama: input.nama,
          email: input.email,
          password: input.password,
          no_whatsapp: input.no_whatsapp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAlert({
          message: data.message || "Error signing up",
          type: "error",
        });
        return;
      }

      setAlert({
        message: "Account created successfully. Redirecting...",
        type: "success",
      });

      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } catch (error) {
      setAlert({ message: "Error signing up", type: "error" });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-xl p-8 rounded-lg shadow-2xl bg-card/35">
        <Image
          src="/ollama.png"
          alt="logo"
          className="w-20 mx-auto mb-4 dark:invert"
          width={100}
          height={100}
        />
        {/* <h1 className="text-2xl font-semibold text-center">Sign Up</h1> */}

        {/* alert */}
        {(alert.message != "" || alert.type != "") && (
          <Alert message={alert.message} type={alert.type as "error"} />
        )}

        {/* form */}
        <form onSubmit={handleSignup} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="nama" className="block text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                id="nama"
                name="nama"
                value={input.nama}
                onChange={handleChange}
                onBlur={validateInput}
                className={
                  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-[#002D70] focus:ring-opacity-50 focus:border-[#002D70] sm:text-sm " +
                  (errors.nama ? " border-red-500" : "")
                }
                placeholder="Your Name"
              />
              {errors.nama && (
                <p className="text-red-500 text-sm mt-1">{errors.nama}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={input.email}
                onChange={handleChange}
                onBlur={validateInput}
                className={
                  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-[#002D70] focus:ring-opacity-50 focus:border-[#002D70] sm:text-sm " +
                  (errors.email ? " border-red-500" : "")
                }
                placeholder="eg@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={input.password}
                onChange={handleChange}
                onBlur={validateInput}
                className={
                  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-[#002D70] focus:ring-opacity-50 focus:border-[#002D70] sm:text-sm " +
                  (errors.password ? " border-red-500" : "")
                }
                placeholder="********"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={input.confirmPassword}
                onChange={handleChange}
                onBlur={validateInput}
                className={
                  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-[#002D70] focus:ring-opacity-50 focus:border-[#002D70] sm:text-sm " +
                  (errors.confirmPassword ? " border-red-500" : "")
                }
                placeholder="********"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label
                htmlFor="no_whatsapp"
                className="block text-sm font-medium"
              >
                WhatsApp Number
              </label>
              <input
                type="text"
                id="no_whatsapp"
                name="no_whatsapp"
                value={input.no_whatsapp}
                onChange={handleChange}
                onBlur={validateInput}
                className={
                  "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-[#002D70] focus:ring-opacity-50 focus:border-[#002D70] sm:text-sm " +
                  (errors.no_whatsapp ? " border-red-500" : "")
                }
                placeholder="e.g., 081234567890"
              />
              {errors.no_whatsapp && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.no_whatsapp}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#002D70] text-white rounded-md hover:bg-[#001A4D] focus:outline-none focus:ring focus:ring-[#002D70] focus:ring-opacity-50 focus:border-[#002D70]"
          >
            Sign Up
          </button>
          <p className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <a
              href="/auth/signin"
              className="font-semibold hover:underline text-blue-500"
            >
              Sign In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
