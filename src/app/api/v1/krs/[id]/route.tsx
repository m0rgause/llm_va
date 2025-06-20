import { NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { formatTime } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const krs = await prisma.kelas.findUnique({
      where: {
        id: id,
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();

  try {
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const krs = await prisma.kelas.update({
      where: {
        id: id,
      },
      data: {
        mata_kuliah: body.mata_kuliah,
        hari: body.hari,
        waktu_mulai: body.waktu_mulai,
        waktu_selesai: body.waktu_selesai,
        kode: body.kode,
        kelas: body.kelas,
        ruang: body.ruang,
        dosen: body.dosen,
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
    console.error("Error updating KRS:", error);
    return NextResponse.json(
      { error: "Failed to update KRS" },
      { status: 500 }
    );
  }
}

// delete krs by id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const krs = await prisma.kelas.delete({
      where: {
        id: id,
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
    console.error("Error deleting KRS:", error);
    return NextResponse.json(
      { error: "Failed to delete KRS" },
      { status: 500 }
    );
  }
}
