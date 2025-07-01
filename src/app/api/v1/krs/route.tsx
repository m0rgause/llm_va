import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(request: Request) {
  // get user id from params
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") ?? null;
  const semester = searchParams.get("semester") ?? null;
  console.log("User ID:", userId, "Semester ID:", semester);

  try {
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!semester) {
      return NextResponse.json(
        { error: "Semester Name is required" },
        { status: 400 }
      );
    }

    const krs = await prisma.kelas.findMany({
      where: {
        semester: {
          nama: Number(semester),
          user_id: userId,
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

export async function POST(request: Request) {
  let body = await request.json();
  console.log("Request Body:", body);

  try {
    // validate request body
    const requiredFields = [
      "user_id",
      "semester",
      "hari",
      "waktu_mulai",
      "waktu_selesai",
      "kode",
      "mata_kuliah",
      "kelas",
      "ruang",
      "dosen",
    ];

    const error: any = [];

    for (const field of requiredFields) {
      if (!body[field]) {
        error.push(`${field.replace("_", " ")} is required`);
      }
    }

    const existingKRS = await prisma.kelas.findFirst({
      where: {
        kode: body.kode,
        semester: {
          nama: Number(body.semester),
          user_id: body.user_id,
        },
      },
      include: {
        semester: true,
      },
    });

    if (existingKRS) {
      error.push("KRS already exists for this semester");
    }

    const existingSemester = await prisma.semester.findFirst({
      where: {
        nama: Number(body.semester),
        user_id: body.user_id,
      },
    });

    if (!existingSemester) {
      error.push("Semester not found");
    }

    if (error.length > 0) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const { v4: uuidv4 } = await import("uuid");
    const krs = await prisma.kelas.create({
      data: {
        id: uuidv4(),
        semester_id: existingSemester!.id,
        hari: body.hari,
        waktu_mulai: body.waktu_mulai,
        waktu_selesai: body.waktu_selesai,
        kode: body.kode,
        mata_kuliah: body.mata_kuliah,
        kelas: body.kelas,
        ruang: body.ruang,
        dosen: body.dosen,
      },
    });

    return NextResponse.json(krs, {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating KRS:", error);
    return NextResponse.json(
      { error: "Failed to create KRS" },
      { status: 500 }
    );
  }
}
