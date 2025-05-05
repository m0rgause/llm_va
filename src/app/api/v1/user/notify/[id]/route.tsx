import { NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // get id from params
  const userId = params.id;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.is_notify, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching notify:", error);
    return NextResponse.json(
      { error: "Failed to fetch notify" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  // get id from params
  const { notify, userId } = body;

  try {
    if (params.id !== userId) {
      return NextResponse.json(
        { error: "User ID does not match" },
        { status: 400 }
      );
    }

    const isExisting = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!isExisting) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // is saved
    const isSaved = await prisma.user.findFirst({
      where: {
        id: userId,
        is_saved: true,
      },
    });

    if (!isSaved) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          is_notify: false,
        },
      });
      return NextResponse.json({ error: "User is not saved" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        is_notify: notify,
      },
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update notify" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching notify:", error);
    return NextResponse.json(
      { error: "Failed to fetch notify" },
      { status: 500 }
    );
  }
}
