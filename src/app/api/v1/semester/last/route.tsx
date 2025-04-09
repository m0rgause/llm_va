import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(request: Request) {
  // get user id from params
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") ?? null;
  try {
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const semester = await prisma.semester.findFirst({
      where: {
        user_id: Number(userId),
      },
      orderBy: {
        nama: "desc",
      },
      take: 1,
    });
    if (!semester) {
      return NextResponse.json(
        { error: "Semester not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(semester);
  } catch (error) {
    console.error("Error fetching semesters:", error);
    return NextResponse.json(
      { error: "Failed to fetch semesters" },
      { status: 500 }
    );
  }
}
