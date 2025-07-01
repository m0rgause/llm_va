import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/prisma";

export async function POST(req: Request) {
  try {
    const { nama, email, password, no_whatsapp } = await req.json();

    // Validate input
    if (!nama || !email || !password || !no_whatsapp) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findFirst({
      where: {email
      }
    });

    // Check if the WhatsApp number already exists
    const existingWhatsAppUser = await prisma.user.findFirst({
      where: { no_whatsapp }
    });
    

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }
    if (existingWhatsAppUser) {
      return NextResponse.json(
        { message: "WhatsApp number already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const { v4: uuidv4 } = await import('uuid');
    try {
      const user = await prisma.user.create({
        data: {
          id: uuidv4(),
          nama,
          email,
          password: hashedPassword,
          no_whatsapp,
          role: "user", // Default role
          is_notify: false, // Default notification setting
        },
      });

      // Remove sensitive or non-serializable fields before returning
      const { password: _, ...userSafe } = user;

      return NextResponse.json(
        { message: "User created successfully", user: userSafe },
        { status: 201 }
      );
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
    // return NextResponse.json(
    //   { message: "User created successfully", user: newUser },
    //   { status: 201 }
    // );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
