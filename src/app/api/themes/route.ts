import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 日本传统色系映射 (与首页、plans页面保持一致)
const themeColorMap: Record<string, string> = {
  'trendy-photo': '#F28B82',    // 薄红
  'formal-ceremony': '#FFCC80', // 杏色
  'together': '#80CBC4',        // 青磁
  'seasonal': '#AED581',        // 萌黄
  'casual-stroll': '#90CAF9',   // 勿忘草
  'specialty': '#B39DDB',       // 藤紫
};

export async function GET() {
  try {
    const themesRaw = await prisma.theme.findMany({
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

    // 应用日本传统色系
    const themes = themesRaw.map(theme => ({
      ...theme,
      color: themeColorMap[theme.slug] || theme.color,
    }));

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Failed to fetch themes:", error);
    return NextResponse.json(
      { error: "Failed to fetch themes" },
      { status: 500 }
    );
  }
}
