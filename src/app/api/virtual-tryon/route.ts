import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { TryOnStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { DEFAULT_PROMPT } from '@/lib/virtual-tryon-prompts';

// 初始化 Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
});

// 限制配置
const DAILY_FREE_LIMIT = 3;
const REGISTERED_USER_LIMIT = 8;
const CACHE_TTL = 60 * 60 * 24 * 30; // 30天

// 检查用户额度 - 临时禁用数据库检查
async function checkUserQuota(userId: string | null, sessionId: string): Promise<{
  allowed: boolean;
  remaining: number;
  message?: string;
}> {
  // TODO: 暂时跳过数据库检查，直接允许所有请求
  console.log('⚠️ Quota check bypassed - allowing all requests');
  return { allowed: true, remaining: -1 }; // -1 表示无限
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
    const { personImageBase64, planId, kimonoId, kimonoImageUrl, customPrompt } = body;

    if (!personImageBase64) {
      return NextResponse.json(
        { error: 'missing_image', message: '请上传照片' },
        { status: 400 }
      );
    }

    // 验证自定义prompt（如果提供）
    const prompt = customPrompt || DEFAULT_PROMPT;
    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: 'prompt_too_long', message: 'Prompt长度不能超过5000字符' },
        { status: 400 }
      );
    }
    if (prompt.length < 10) {
      return NextResponse.json(
        { error: 'prompt_too_short', message: 'Prompt长度至少10字符' },
        { status: 400 }
      );
    }

    // 检查额度 - 已禁用
    const quota = await checkUserQuota(userId, sessionId);
    // quota 检查已在函数内部跳过

    // TODO: 临时跳过数据库记录创建和缓存检查
    console.log('⚠️ Skipping database operations for virtualTryOn');

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
      console.error('❌ Kimono image not found');
      return NextResponse.json(
        { error: 'kimono_not_found', message: '未找到和服信息' },
        { status: 404 }
      );
    }

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

      // TODO: 跳过数据库更新记录
      console.log('✅ Image generated successfully, skipping database update');

      const response = NextResponse.json({
        success: true,
        id: 'temp-' + Date.now(), // 临时 ID
        imageUrl: resultUrl,
        duration,
        remainingQuota: -1, // 无限制
        quality: 'premium',
        debugInfo: {
          model: 'gemini-2.5-flash-image',
          promptLength: prompt.length,
          personImageSize: personImageData.length,
          kimonoImageSize: kimonoImageBase64.length,
          resultImageSize: resultBuffer.length,
          timestamp: new Date().toISOString(),
          isCustomPrompt: !!customPrompt,
        },
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

      // TODO: 跳过数据库错误记录
      console.log('⚠️ AI error occurred, skipping database error logging');

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

// GET 方法：查询试穿历史 - 暂时禁用
export async function GET(req: NextRequest) {
  console.log('⚠️ GET endpoint temporarily disabled - virtualTryOn table not available');
  return NextResponse.json({
    error: 'not_implemented',
    message: '历史记录功能暂时不可用',
  }, { status: 501 });
}

// TODO: 恢复历史记录功能
// export async function GET(req: NextRequest) {
//   try {
//     const session = await auth();
//     const userId = session?.user?.id;
//
//     if (!userId) {
//       return NextResponse.json(
//         { error: 'unauthorized', message: '请先登录' },
//         { status: 401 }
//       );
//     }
//
//     const searchParams = req.nextUrl.searchParams;
//     const limit = parseInt(searchParams.get('limit') || '10');
//     const offset = parseInt(searchParams.get('offset') || '0');
//
//     const [tryOns, total] = await Promise.all([
//       prisma.virtualTryOn.findMany({
//         where: {
//           userId,
//           status: 'COMPLETED' as TryOnStatus,
//         },
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//         skip: offset,
//         select: {
//           id: true,
//           resultImageUrl: true,
//           createdAt: true,
//           fromCache: true,
//           duration: true,
//         },
//       }),
//       prisma.virtualTryOn.count({
//         where: {
//           userId,
//           status: 'COMPLETED' as TryOnStatus,
//         },
//       }),
//     ]);
//
//     return NextResponse.json({
//       success: true,
//       data: tryOns,
//       total,
//       limit,
//       offset,
//     });
//
//   } catch (error: any) {
//     console.error('Get try-on history error:', error);
//     return NextResponse.json({
//       error: 'internal_error',
//       message: '获取历史记录失败',
//     }, { status: 500 });
//   }
// }
