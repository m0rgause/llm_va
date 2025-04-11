import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(request: Request) {
  // get user id from params
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") ?? null;
  const semesterId = searchParams.get("semester_id") ?? null;

  try {
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!semesterId) {
      return NextResponse.json(
        { error: "Semester ID is required" },
        { status: 400 }
      );
    }

    const krs = await prisma.kelas.findMany({
      where: {
        semester_id: Number(semesterId),
        semester: {
          user_id: Number(userId),
        },
      },
      include: {
        semester: true,
      },
    });

    if (!krs) {
      return NextResponse.json({ error: "KRS not found" }, { status: 404 });
    }

    return NextResponse.json(krs, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching KRS:", error);
    return NextResponse.json({ error: "Failed to fetch KRS" }, { status: 500 });
  }
}
