import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ merchant: null });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        status: true,
        businessName: true,
      },
    });

    return NextResponse.json({ merchant });
  } catch (error) {
    console.error("Error fetching merchant profile:", error);
    return NextResponse.json({ merchant: null }, { status: 500 });
  }
}
