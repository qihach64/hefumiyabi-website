import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import {
  getPresignedUploadUrl,
  generateS3Key,
  getExtensionFromMimeType,
  isAllowedImageType,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  type ImageCategory,
  type ImagePurpose,
  type AllowedImageType,
} from '@/lib/aws';

interface PresignRequest {
  fileType: string;
  fileSize: number;
  category: ImageCategory;
  entityId?: string;
  purpose?: ImagePurpose;
}

interface PresignResponse {
  presignedUrl: string;
  key: string;
  publicUrl: string;
  expiresAt: string;
}

/**
 * POST /api/upload/presign
 * 获取预签名上传 URL
 *
 * 权限控制:
 * - plan/kimono/campaign: 需要 ADMIN 或 MERCHANT 角色
 * - merchant: 需要是对应商家的所有者
 * - user: 需要是当前登录用户
 * - tryon: 允许游客 (使用 session ID)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = (await request.json()) as PresignRequest;

    const { fileType, fileSize, category, entityId, purpose = 'main' } = body;

    // 验证必填字段
    if (!fileType || !category) {
      return NextResponse.json(
        { error: '缺少必填字段: fileType, category' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!isAllowedImageType(fileType)) {
      return NextResponse.json(
        {
          error: `不支持的文件类型。支持: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件太大。最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 权限检查
    const authResult = await checkPermission(session, category, entityId);
    if (!authResult.allowed) {
      return NextResponse.json({ error: authResult.message }, { status: 403 });
    }

    // 生成 S3 Key
    const resolvedEntityId = entityId || authResult.resolvedEntityId || 'unknown';
    const extension = getExtensionFromMimeType(fileType);
    const key = generateS3Key(category, resolvedEntityId, purpose, extension);

    // 获取预签名 URL
    const { presignedUrl, publicUrl } = await getPresignedUploadUrl(
      key,
      fileType as AllowedImageType
    );

    const response: PresignResponse = {
      presignedUrl,
      key,
      publicUrl,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 分钟后过期
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Presign error:', error);

    if (error instanceof Error && error.message.includes('AWS credentials')) {
      return NextResponse.json(
        { error: 'AWS 服务未配置' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: '获取上传凭证失败' },
      { status: 500 }
    );
  }
}

/**
 * 权限检查
 */
async function checkPermission(
  session: Awaited<ReturnType<typeof auth>>,
  category: ImageCategory,
  entityId?: string
): Promise<{
  allowed: boolean;
  message?: string;
  resolvedEntityId?: string;
}> {
  const user = session?.user;
  const userId = user?.id;
  const userRole = (user as { role?: string } | undefined)?.role;

  switch (category) {
    case 'plan':
    case 'kimono':
    case 'campaign': {
      // 需要管理员角色 或 拥有已审批的商家账户
      if (!userId) {
        return { allowed: false, message: '需要登录' };
      }

      // 管理员直接通过
      if (userRole === 'ADMIN') {
        return { allowed: true, resolvedEntityId: entityId || `admin-${userId}` };
      }

      // 检查是否有已审批的商家账户
      const merchant = await prisma.merchant.findUnique({
        where: { ownerId: userId },
        select: { id: true, status: true },
      });

      if (!merchant || merchant.status !== 'APPROVED') {
        return { allowed: false, message: '需要管理员或已审批的商家权限' };
      }

      // 商家通过，使用商家 ID 作为路径
      return {
        allowed: true,
        resolvedEntityId: entityId || `merchant-${merchant.id}`
      };
    }

    case 'merchant': {
      // 需要是商家所有者
      if (!userId) {
        return { allowed: false, message: '需要登录' };
      }

      // 检查是否有已审批的商家账户
      const merchant = await prisma.merchant.findUnique({
        where: { ownerId: userId },
        select: { id: true, status: true },
      });

      if (!merchant || merchant.status !== 'APPROVED') {
        return { allowed: false, message: '需要已审批的商家权限' };
      }

      return { allowed: true, resolvedEntityId: entityId || merchant.id };
    }

    case 'user':
      // 需要登录，只能上传自己的内容
      if (!userId) {
        return { allowed: false, message: '需要登录' };
      }
      // 用户只能上传自己的头像/评价图
      return { allowed: true, resolvedEntityId: userId };

    case 'tryon':
      // AI 试穿允许游客，使用 userId 或 'guest'
      return { allowed: true, resolvedEntityId: userId || 'guest' };

    default:
      return { allowed: false, message: '不支持的分类' };
  }
}
