import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/prisma";

export async function POST(req: Request) {
  try {
    const { nama, email, password, no_whatsapp } = await req.json();
    console.log("Request Body:", { nama, email, password, no_whatsapp });

    // Validate input
    if (!nama || !email || !password || !no_whatsapp) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        no_whatsapp,
        role: "user", // Default role
        is_notify: false, // Default notification setting
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
