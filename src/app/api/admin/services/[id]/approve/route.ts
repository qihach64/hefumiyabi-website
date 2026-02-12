import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/services/[id]/approve
 * 批准自定义服务
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    // 验证管理员权限
    if (!session?.user?.id) {
      return NextResponse.json({ message: "请先登录" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      return NextResponse.json({ message: "无权限执行此操作" }, { status: 403 });
    }

    const { id } = await params;

    // 查找服务
    const service = await prisma.merchantComponent.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            businessName: true,
            owner: {
              select: { email: true, name: true },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ message: "服务不存在" }, { status: 404 });
    }

    if (!service.isCustom) {
      return NextResponse.json({ message: "只能审核自定义服务" }, { status: 400 });
    }

    if (service.approvalStatus !== "PENDING") {
      return NextResponse.json(
        { message: `服务已是 ${service.approvalStatus} 状态` },
        { status: 400 }
      );
    }

    // 更新状态为已批准
    const updated = await prisma.merchantComponent.update({
      where: { id },
      data: {
        approvalStatus: "APPROVED",
        adminFeedback: null,
      },
    });

    // TODO: 可选 - 发送邮件通知商户

    return NextResponse.json({
      message: "服务已批准",
      service: {
        id: updated.id,
        customName: updated.customName,
        approvalStatus: updated.approvalStatus,
      },
    });
  } catch (error) {
    console.error("批准服务失败:", error);
    return NextResponse.json({ message: "操作失败" }, { status: 500 });
  }
}
