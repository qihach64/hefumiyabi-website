import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { TryOnStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// 初始化 Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

// 限制配置
const DAILY_FREE_LIMIT = 3;
const REGISTERED_USER_LIMIT = 8;
const CACHE_TTL = 60 * 60 * 24 * 30; // 30天

// 检查用户额度
async function checkUserQuota(userId: string | null, sessionId: string): Promise<{
  allowed: boolean;
  remaining: number;
  message?: string;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 检查用户是否有活跃预约（有预约的用户无限制）
  if (userId) {
    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (activeBooking) {
      return { allowed: true, remaining: -1 }; // -1 表示无限
    }
  }

  // 检查今日使用次数
  const todayUsage = await prisma.virtualTryOn.count({
    where: {
      OR: [
        { userId: userId || undefined },
        { sessionId },
      ],
      createdAt: {
        gte: today,
      },
      status: 'COMPLETED',
    },
  });

  const limit = userId ? REGISTERED_USER_LIMIT : DAILY_FREE_LIMIT;
  const remaining = Math.max(0, limit - todayUsage);

  if (todayUsage >= limit) {
    return {
      allowed: false,
      remaining: 0,
      message: userId
        ? '今日免费次数已用完，预约后可无限使用！'
        : '今日免费次数已用完，注册可获得更多次数',
    };
  }

  return { allowed: true, remaining };
}

// 上传图片到临时存储（实际项目中应该上传到 R2/S3）
async function uploadImage(buffer: Buffer, mimeType: string): Promise<string> {
  // TODO: 实现实际的图片上传逻辑
  // 现在返回 base64 作为临时方案
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    // 获取或创建 sessionId
    const sessionId = req.cookies.get('session-id')?.value ||
                      `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const body = await req.json();
    const { personImageBase64, planId, kimonoId, kimonoImageUrl } = body;

    if (!personImageBase64) {
      return NextResponse.json(
        { error: 'missing_image', message: '请上传照片' },
        { status: 400 }
      );
    }

    // 检查额度
    const quota = await checkUserQuota(userId, sessionId);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'quota_exceeded',
          message: quota.message,
          suggestedAction: userId ? 'booking' : 'register'
        },
        { status: 429 }
      );
    }

    // 创建试穿记录
    const tryOn = await prisma.virtualTryOn.create({
      data: {
        userId,
        sessionId,
        planId,
        kimonoId,
        personImageUrl: 'processing', // 临时占位
        provider: 'nano-banana',
        status: 'PROCESSING' as TryOnStatus,
      },
    });

    // 检查缓存
    if (planId || kimonoId) {
      const cacheKey = `${planId || kimonoId}-${personImageBase64.substring(0, 100)}`;
      const cached = await prisma.virtualTryOn.findFirst({
        where: {
          metadata: {
            path: ['cacheKey'],
            equals: cacheKey,
          },
          status: 'COMPLETED' as TryOnStatus,
          createdAt: {
            gte: new Date(Date.now() - CACHE_TTL * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (cached && cached.resultImageUrl) {
        await prisma.virtualTryOn.update({
          where: { id: tryOn.id },
          data: {
            resultImageUrl: cached.resultImageUrl,
            status: 'COMPLETED' as TryOnStatus,
            fromCache: true,
            duration: 0,
          },
        });

        return NextResponse.json({
          success: true,
          id: tryOn.id,
          imageUrl: cached.resultImageUrl,
          fromCache: true,
          remainingQuota: quota.remaining - 1,
        });
      }
    }

    // 获取和服图片URL
    let kimonoImageUrlToUse = kimonoImageUrl;

    if (!kimonoImageUrlToUse) {
      // 如果没有直接提供URL，尝试从数据库获取
      if (kimonoId) {
        const kimonoInfo = await prisma.kimono.findUnique({
          where: { id: kimonoId },
          include: { images: { orderBy: { order: 'asc' }, take: 1 } },
        });
        kimonoImageUrlToUse = kimonoInfo?.images?.[0]?.url;
      } else if (planId) {
        const plan = await prisma.rentalPlan.findUnique({
          where: { id: planId },
          select: { imageUrl: true },
        });
        kimonoImageUrlToUse = plan?.imageUrl;
      }
    }

    if (!kimonoImageUrlToUse) {
      await prisma.virtualTryOn.update({
        where: { id: tryOn.id },
        data: {
          status: 'FAILED' as TryOnStatus,
          errorMessage: '未找到和服图片',
        },
      });

      return NextResponse.json(
        { error: 'kimono_not_found', message: '未找到和服信息' },
        { status: 404 }
      );
    }

    // 优化的 prompt - 确保全身照、正面姿势、手部可见
    const prompt = `You are a professional fashion photographer and digital artist. Replace the clothing in the first image with the complete kimono outfit from the second image.

TASK: Create a realistic full-body virtual try-on where the person from image 1 wears the complete kimono from image 2.

REQUIREMENTS:
1. Generate a FULL-BODY photograph showing the person from head to toe, FACING THE CAMERA directly
2. The person must be in a front-facing pose with their body oriented towards the viewer
3. BOTH HANDS must be clearly visible in the final image (not hidden or cropped)
4. Replace ALL clothing with the complete kimono outfit - including the top garment AND the bottom (hakama/skirt)
5. The kimono must cover the ENTIRE body appropriately:
   - Upper body: kimono top with proper collar and sleeves
   - Lower body: kimono bottom/hakama extending to ankles
   - Obi (belt) positioned correctly at waist level
   - Sleeves should show the hands naturally
6. Preserve the person's face, body proportions, and background exactly as they are
7. Adjust the pose if needed to ensure front-facing orientation with visible hands
8. Make the kimono drape naturally with realistic fabric folds and movement
9. Accurately transfer the kimono's colors, patterns, and textures from the reference image
10. Match the original photo's lighting, shadows, and atmosphere
11. Ensure the complete traditional kimono styling is visible from head to toe
12. Create a seamless, photorealistic full-body result

The output must be a complete full-body photograph showing this person FACING FORWARD, wearing the entire kimono outfit with BOTH HANDS VISIBLE, in their original setting, as if professionally photographed.`.trim();

    // 解析 base64 图片
    const personImageData = personImageBase64.replace(/^data:image\/\w+;base64,/, '');

    // 获取和服图片
    let kimonoImageBase64: string;

    if (kimonoImageUrlToUse.startsWith('data:')) {
      // 已经是 base64
      kimonoImageBase64 = kimonoImageUrlToUse.replace(/^data:image\/\w+;base64,/, '');
    } else {
      // 需要fetch
      const kimonoImageResponse = await fetch(kimonoImageUrlToUse);
      const kimonoImageBuffer = await kimonoImageResponse.arrayBuffer();
      kimonoImageBase64 = Buffer.from(kimonoImageBuffer).toString('base64');
    }

    const startTime = Date.now();

    // 调试日志
    console.log('=== Virtual Try-On API Call ===');
    console.log('Prompt length:', prompt.length);
    console.log('Person image size:', personImageData.length, 'chars');
    console.log('Kimono image size:', kimonoImageBase64.length, 'chars');

    try {
      // 调用 Gemini 2.5 Flash API
      // 图片顺序：[用户照片, 和服图片, 文本提示]
      const contents: any[] = [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: personImageData,
          }
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: kimonoImageBase64,
          }
        },
        { text: prompt }
      ];

      console.log('Calling Gemini API...');

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents,
      });

      console.log('✅ Gemini API response received');

      const duration = Math.round((Date.now() - startTime) / 1000);

      // 处理结果 - 从 candidates 中提取图片数据
      const candidate = result.candidates?.[0];
      if (!candidate || !candidate.content?.parts) {
        throw new Error('AI 未生成内容');
      }

      // 查找包含图片数据的 part
      const imagePart = candidate.content.parts.find(
        (part: any) => part.inlineData?.mimeType?.startsWith('image/')
      );

      if (!imagePart || !imagePart.inlineData?.data) {
        console.error('❌ No image data found in response');
        throw new Error('AI 响应中没有图片数据');
      }

      const imageBytes = imagePart.inlineData.data;
      console.log('📷 Generated image size:', imageBytes.length, 'bytes');

      // 上传结果图片
      const resultBuffer = Buffer.from(imageBytes, 'base64');
      const resultUrl = await uploadImage(resultBuffer, 'image/png');

      // 更新记录
      await prisma.virtualTryOn.update({
        where: { id: tryOn.id },
        data: {
          personImageUrl: personImageBase64.substring(0, 500), // 存储部分用于去重
          resultImageUrl: resultUrl,
          status: 'COMPLETED' as TryOnStatus,
          duration,
          cost: 0.00, // Gemini 2.5 Flash Image - 免费
          metadata: {
            cacheKey: `${planId || kimonoId || 'custom'}-${personImageBase64.substring(0, 100)}`,
            prompt: prompt.substring(0, 500),
            kimonoSource: kimonoImageUrlToUse.startsWith('data:') ? 'upload' : 'plan',
          },
        },
      });

      const response = NextResponse.json({
        success: true,
        id: tryOn.id,
        imageUrl: resultUrl,
        duration,
        remainingQuota: quota.remaining - 1,
        quality: 'premium',
      });

      // 设置 session cookie
      if (!req.cookies.get('session-id')) {
        response.cookies.set('session-id', sessionId, {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 365, // 1年
        });
      }

      return response;

    } catch (aiError: any) {
      console.error('Gemini AI error:', aiError);

      await prisma.virtualTryOn.update({
        where: { id: tryOn.id },
        data: {
          status: 'FAILED' as TryOnStatus,
          errorMessage: aiError.message,
        },
      });

      // AI API 错误处理
      if (aiError.message?.includes('quota') || aiError.message?.includes('rate limit')) {
        return NextResponse.json({
          error: 'api_quota_exceeded',
          message: 'API 配额已用完，请稍后重试',
        }, { status: 503 });
      }

      if (aiError.message?.includes('SAFETY')) {
        return NextResponse.json({
          error: 'content_filtered',
          message: '图片内容不适合处理，请上传其他照片',
        }, { status: 400 });
      }

      throw aiError;
    }

  } catch (error: any) {
    console.error('Virtual try-on error:', error);

    return NextResponse.json({
      error: 'internal_error',
      message: '处理失败，请重试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }, { status: 500 });
  }
}

// GET 方法：查询试穿历史
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: '请先登录' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [tryOns, total] = await Promise.all([
      prisma.virtualTryOn.findMany({
        where: {
          userId,
          status: 'COMPLETED' as TryOnStatus,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          resultImageUrl: true,
          createdAt: true,
          fromCache: true,
          duration: true,
        },
      }),
      prisma.virtualTryOn.count({
        where: {
          userId,
          status: 'COMPLETED' as TryOnStatus,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: tryOns,
      total,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error('Get try-on history error:', error);
    return NextResponse.json({
      error: 'internal_error',
      message: '获取历史记录失败',
    }, { status: 500 });
  }
}
