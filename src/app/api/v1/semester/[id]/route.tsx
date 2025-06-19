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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    return prisma.$transaction(async (prisma) => {
      // delete kelas related to the semester
      await prisma.kelas.deleteMany({
        where: {
          semester_id: id,
        },
      });

      // delete semester
      const deletedSemester = await prisma.semester.delete({
        where: {
          id: id,
        },
      });
      if (!deletedSemester) {
        return NextResponse.json(
          { error: "Semester not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(deletedSemester, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  } catch (error) {
    console.error("Error deleting semester:", error);
    return NextResponse.json(
      { error: "Failed to delete semester" },
      { status: 500 }
    );
  }
}
