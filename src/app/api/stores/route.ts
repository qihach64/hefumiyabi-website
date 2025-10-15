import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        city: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        address: true,
      },
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error("Error fetching stores:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}
