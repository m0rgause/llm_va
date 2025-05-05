"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Alert from "@/components/ui/alert";
import React from "react";
import "@/app/globals.css";
import Image from "next/image";

type Props = {
  className?: string;
  callbackUrl?: string;
};

export default function Signin(props: Props) {
  const session = useSession();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session.status === "authenticated") {
      setLoading(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else if (session.status === "loading") {
      setLoading(true);
    } else if (session.status === "unauthenticated") {
      setLoading(false);
    }
  }, [session]);

  const [input, setInput] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
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
      default:
        break;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.email || !input.password) {
      setAlert({ message: "Please fill all fields", type: "error" });
      return;
    }

    try {
      const response = await signIn("credentials", {
        email: input.email,
        password: input.password,
        redirect: false,
      });
      if (response && response.error) {
        setAlert({
          message: response.code || "Error logging in",
          type: "error",
        });

        setTimeout(() => {
          setAlert({ message: "", type: "" });
        }, 10000);
      } else {
        setAlert({
          message: "Logged in successfully. Redirecting...",
          type: "success",
        });

        setTimeout(() => {
          setAlert({ message: "", type: "" });
          window.location.href = "/";
        }, 2000);
      }
    } catch (e) {
      setAlert({ message: "Error logging in", type: "error" });

      setTimeout(() => {
        setAlert({ message: "", type: "" });
      }, 10000);
    }
  };

  return loading ? (
    <div className="flex justify-center items-center min-h-screen ">
      <div className="w-full max-w-md p-8 bg-white-100 rounded-lg shadow-2xl">
        <Image
          src="/ollama.png"
          alt="logo"
          className="w-20 mx-auto mb-4"
          width={30}
          height={30}
        />
        <h1 className="text-2xl font-semibold  text-center">Loading...</h1>
      </div>
    </div>
  ) : (
    <div className="flex justify-center items-center min-h-screen">
      {/* use variable card color */}
      <div className="w-full max-w-md p-8 rounded-lg shadow-2xl bg-card/35">
        <Image
          src="/ollama.png"
          alt="logo"
          className="w-20 mx-auto mb-4"
          width={30}
          height={30}
        />
        <h1 className="text-2xl font-semibold  text-center">Login</h1>

        {/* alert */}
        {(alert.message != "" || alert.type != "") && (
          <Alert message={alert.message} type={alert.type as "error"} />
        )}

        {/* form */}

        <form onSubmit={handleLogin} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium ">
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
            <label htmlFor="password" className="block text-sm font-medium ">
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
          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#002D70] text-white rounded-md hover:bg-[#001A4D] focus:outline-none focus:ring focus:ring-[#002D70] focus:ring-opacity-50 focus:border-[#002D70]"
          >
            Login
          </button>
          <p className="text-sm text-center text-gray-600">
            Don&apos;t have an account?{" "}
            <a
              href="/auth/signup"
              className=" font-semibold hover:underline text-blue-500"
            >
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
