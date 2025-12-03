import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const themes = await prisma.theme.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        color: true,
        coverImage: true,
        displayOrder: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Failed to fetch themes:", error);
    return NextResponse.json(
      { error: "Failed to fetch themes" },
      { status: 500 }
    );
  }
}
