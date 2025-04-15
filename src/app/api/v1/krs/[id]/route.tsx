import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

// delete krs by id
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? null;

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
