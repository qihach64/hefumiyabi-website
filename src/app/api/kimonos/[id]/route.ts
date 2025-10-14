import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kimono = await prisma.kimono.findUnique({
      where: {
        id: params.id,
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
        stores: {
          include: {
            store: true,
          },
        },
      },
    });

    if (!kimono) {
      return NextResponse.json(
        { error: "和服不存在" },
        { status: 404 }
      );
    }

    // 增加浏览次数
    await prisma.kimono.update({
      where: { id: params.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(kimono);
  } catch (error) {
    console.error("获取和服详情失败:", error);
    return NextResponse.json(
      { error: "获取和服详情失败" },
      { status: 500 }
    );
  }
}
