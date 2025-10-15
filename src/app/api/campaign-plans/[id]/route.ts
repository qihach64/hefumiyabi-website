import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaignPlan = await prisma.campaignPlan.findUnique({
      where: { id },
    });

    if (!campaignPlan) {
      return NextResponse.json(
        { error: "Campaign plan not found" },
        { status: 404 }
      );
    }

    // Return campaign plan data (CampaignPlan has all needed fields)
    return NextResponse.json({
      id: campaignPlan.id,
      name: campaignPlan.name,
      description: campaignPlan.description,
      price: campaignPlan.campaignPrice, // Use campaign price
      originalPrice: campaignPlan.originalPrice,
    });
  } catch (error) {
    console.error("Error fetching campaign plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign plan" },
      { status: 500 }
    );
  }
}
