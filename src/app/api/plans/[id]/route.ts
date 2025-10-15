import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by slug
    let plan = await prisma.rentalPlan.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
      },
    });

    // If not found by ID, try by slug
    if (!plan) {
      plan = await prisma.rentalPlan.findUnique({
        where: {
          slug: id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
        },
      });
    }

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}
