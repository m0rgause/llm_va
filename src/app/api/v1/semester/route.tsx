import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET() {
  try {
    const semesters = await prisma.semester.findMany();
    return NextResponse.json(semesters);
  } catch (error) {
    console.error("Error fetching semesters:", error);
    return NextResponse.json(
      { error: "Failed to fetch semesters" },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  const { nama, user_id } = await request.json();
  const userId = user_id;

  try {
    if (!nama) {
      return NextResponse.json(
        { error: "Semester name is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // validate if semester already exists on the same user
    const existingSemester = await prisma.semester.findFirst({
      where: {
        nama: Number(nama),
        user_id: userId,
      },
    });

    if (existingSemester) {
      return NextResponse.json(
        { error: "Semester already exists for this user" },
        { status: 409 }
      );
    }

    const newSemester = await prisma.semester.create({
      data: {
        nama: Number(nama),
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return NextResponse.json(newSemester, { status: 201 });
  } catch (error) {
    console.error("Error creating semester:", error);
    return NextResponse.json(
      { error: "Failed to create semester" },
      { status: 500 }
    );
  }
}
