// types/next-auth.d.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      id: string; // Add id to the session
      nama: string; // Add name to the session
      no_wa: string; // Add WhatsApp number to the session
      email: string; // Add email to the session
      role: "user" | "administrator"; // Add role to the session
    };
  }

  interface User {
    email: string;
    role: "user" | "administrator"; // Include role when user logs in
  }
}
