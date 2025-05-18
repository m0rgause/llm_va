import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const semester = await prisma.semester.findMany({
      where: {
        user_id: id,
      },
      orderBy: {
        nama: "asc",
      },
    });

    if (!semester) {
      return NextResponse.json(
        { error: "Semester not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(semester, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching semester:", error);
    return NextResponse.json(
      { error: "Failed to fetch semester" },
      { status: 500 }
    );
  }
}
