import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

interface HotspotUpdate {
  id: string;
  x: number;
  y: number;
  labelPosition?: "left" | "right" | "top" | "bottom";
}

// PATCH /api/admin/map-templates/[id]/hotspots - 批量更新热点坐标
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    // 权限检查: 仅 ADMIN 或 STAFF 可修改热点
    if (!session?.user?.id) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 403 });
    }

    const { id: templateId } = await params;
    const { hotspots } = (await request.json()) as { hotspots: HotspotUpdate[] };

    if (!Array.isArray(hotspots) || hotspots.length === 0) {
      return NextResponse.json({ message: "缺少热点数据" }, { status: 400 });
    }

    // 验证模板是否存在
    const template = await prisma.mapTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    });

    if (!template) {
      return NextResponse.json({ message: "地图模板不存在" }, { status: 404 });
    }

    // 批量更新热点坐标
    const updatePromises = hotspots.map((hotspot) => {
      const updateData: { x: number; y: number; labelPosition?: string } = {
        x: hotspot.x,
        y: hotspot.y,
      };

      if (hotspot.labelPosition) {
        updateData.labelPosition = hotspot.labelPosition;
      }

      return prisma.mapHotspot.update({
        where: {
          id: hotspot.id,
          templateId: templateId, // 确保热点属于该模板
        },
        data: updateData,
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "热点位置已更新",
      count: hotspots.length,
    });
  } catch (error) {
    console.error("Update hotspots error:", error);
    return NextResponse.json({ message: "更新失败，请重试" }, { status: 500 });
  }
}

// GET /api/admin/map-templates/[id]/hotspots - 获取模板的所有热点
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 权限检查: 仅 ADMIN 或 STAFF 可查看热点
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 403 });
    }

    const { id: templateId } = await params;

    const template = await prisma.mapTemplate.findUnique({
      where: { id: templateId },
      include: {
        hotspots: {
          include: {
            component: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ message: "地图模板不存在" }, { status: 404 });
    }

    const hotspots = template.hotspots.map((h) => ({
      id: h.id,
      x: h.x,
      y: h.y,
      labelPosition: h.labelPosition,
      displayOrder: h.displayOrder,
      componentName: h.component.name,
      componentIcon: h.component.icon,
    }));

    return NextResponse.json({
      templateId: template.id,
      imageUrl: template.imageUrl,
      hotspots,
    });
  } catch (error) {
    console.error("Get hotspots error:", error);
    return NextResponse.json({ message: "获取失败" }, { status: 500 });
  }
}
