import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 获取有图片的和服，用于虚拟试穿展示
    const kimonos = await prisma.kimono.findMany({
      where: {
        images: {
          some: {}, // 查找至少有一张图片的和服
        },
      },
      take: 12,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        images: {
          select: {
            url: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        color: true,
        pattern: true,
        season: true,
      },
    });

    // 转换格式，将 images 对象数组转换为 URL 字符串数组
    const formattedKimonos = kimonos.map((kimono) => ({
      id: kimono.id,
      name: kimono.name,
      images: kimono.images.map((img) => img.url),
      color: kimono.color.length > 0 ? kimono.color[0] : null,
      pattern: kimono.pattern.length > 0 ? kimono.pattern[0] : null,
      season: kimono.season.length > 0 ? kimono.season[0] : null,
    }));

    return NextResponse.json(formattedKimonos);
  } catch (error) {
    console.error("Error fetching kimonos:", error);
    return NextResponse.json(
      { error: "Failed to fetch kimonos" },
      { status: 500 }
    );
  }
}
