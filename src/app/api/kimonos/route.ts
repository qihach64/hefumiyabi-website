import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { KimonoCategory, Season } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 获取查询参数
    const category = searchParams.get("category") as KimonoCategory | null;
    const style = searchParams.get("style");
    const color = searchParams.get("color");
    const season = searchParams.get("season") as Season | null;
    const storeId = searchParams.get("storeId");
    const isAvailable = searchParams.get("isAvailable");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "12");

    // 构建查询条件
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (style) {
      where.style = { contains: style, mode: "insensitive" };
    }

    if (color) {
      where.color = { has: color };
    }

    if (season) {
      where.season = { has: season };
    }

    if (storeId) {
      where.stores = {
        some: {
          storeId: storeId,
        },
      };
    }

    if (isAvailable !== null) {
      where.isAvailable = isAvailable === "true";
    }

    // 获取总数
    const total = await prisma.kimono.count({ where });

    // 获取分页数据
    const kimonos = await prisma.kimono.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      data: kimonos,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取和服列表失败:", error);
    return NextResponse.json(
      { error: "获取和服列表失败" },
      { status: 500 }
    );
  }
}
