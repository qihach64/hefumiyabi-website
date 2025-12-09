import { GoogleGenAI } from '@google/genai';
import {
  UNIFIED_TRYON_PROMPT,
  PRESERVE_USER_EXPRESSION_ADDON,
  ROUND1_DRESS_PROMPT,
  ROUND2_MERGE_KEEP_EXPRESSION_PROMPT,
  V3_CLEAN_BACKGROUND_PROMPT,
  V3_WITH_POSE_REFERENCE_PROMPT,
} from '../lib/prompts';
import { uploadToSupabase, generateStoragePath } from '../lib/upload';
import type { TryOnConfig, TryOnRequestV2, DebugInfo } from '../types';

// ============================================================================
// CONSTANTS AND LIMITS
// ============================================================================

/** Maximum base64 image size in characters (approx 10MB decoded) */
const MAX_IMAGE_SIZE_CHARS = 13_000_000;

/** Maximum base64 image size in MB for error messages */
const MAX_IMAGE_SIZE_MB = 10;

/** Default fetch timeout in milliseconds (30 seconds) */
const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fetch with timeout support
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default: 30s)
 */
async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new TryOnGeneratorError('fetch_timeout', `请求超时 (${timeoutMs / 1000}秒)`);
    }
    throw new TryOnGeneratorError('network_error', `网络错误: ${error.message || '无法连接服务器'}`);
  }
}

/**
 * Validate image size to prevent DoS attacks
 * @param base64Data Base64 encoded image data (without data URI prefix)
 * @param imageName Image name for error messages
 */
function validateImageSize(base64Data: string, imageName: string): void {
  if (base64Data.length > MAX_IMAGE_SIZE_CHARS) {
    const actualSizeMB = Math.round((base64Data.length * 0.75) / 1024 / 1024);
    throw new TryOnGeneratorError(
      'image_too_large',
      `${imageName}过大 (${actualSizeMB}MB)，请压缩至 ${MAX_IMAGE_SIZE_MB}MB 以下`
    );
  }
}

/**
 * Result from the try-on generation
 */
export interface GeneratorResult {
  success: boolean;
  imageUrl?: string;
  imageBuffer?: Buffer;
  duration: number;
  debugInfo: DebugInfo;
  /** 两轮模式中间结果（第一轮的白底和服照） */
  intermediateImageUrl?: string;
  intermediateImageBuffer?: Buffer;
}

/**
 * Error thrown during generation
 */
export class TryOnGeneratorError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'TryOnGeneratorError';
  }
}

/**
 * Generate virtual try-on image using Gemini AI (Three-image mode)
 *
 * Three-image input (all required):
 * 1. Face source image (user's half-body photo)
 * 2. Kimono source image
 * 3. Background/pose reference image
 *
 * @param request - Try-on request parameters
 * @param config - AI and storage configuration
 * @returns Generated image URL or buffer
 */
export async function generateTryOn(
  request: TryOnRequestV2,
  config: TryOnConfig
): Promise<GeneratorResult> {
  const { faceImageBase64, kimonoImageUrl, backgroundPoseRef, options, customPrompt } = request;

  // Validate inputs - all three images are required
  if (!faceImageBase64) {
    throw new TryOnGeneratorError('missing_face', '请上传半身照');
  }

  if (!kimonoImageUrl) {
    throw new TryOnGeneratorError('missing_kimono', '请选择和服');
  }

  if (!backgroundPoseRef?.imageUrl) {
    throw new TryOnGeneratorError('missing_background', '请选择背景/姿势参考图');
  }

  // Parse face image
  const faceImageData = faceImageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Get kimono image as base64
  let kimonoImageBase64: string;
  if (kimonoImageUrl.startsWith('data:')) {
    kimonoImageBase64 = kimonoImageUrl.replace(/^data:image\/\w+;base64,/, '');
  } else {
    const kimonoImageResponse = await fetch(kimonoImageUrl);
    const kimonoImageBuffer = await kimonoImageResponse.arrayBuffer();
    kimonoImageBase64 = Buffer.from(kimonoImageBuffer).toString('base64');
  }

  // Get background reference image (required)
  let backgroundImageBase64: string;
  if (backgroundPoseRef.imageUrl.startsWith('data:')) {
    backgroundImageBase64 = backgroundPoseRef.imageUrl.replace(/^data:image\/\w+;base64,/, '');
  } else {
    const bgImageResponse = await fetch(backgroundPoseRef.imageUrl);
    const bgImageBuffer = await bgImageResponse.arrayBuffer();
    backgroundImageBase64 = Buffer.from(bgImageBuffer).toString('base64');
  }

  // Build prompt - always use unified three-image prompt
  let prompt = customPrompt || UNIFIED_TRYON_PROMPT;

  // Add expression override if requested
  if (!customPrompt && options?.preserveExpression) {
    prompt += PRESERVE_USER_EXPRESSION_ADDON;
  }

  if (prompt.length > 8000) {
    throw new TryOnGeneratorError('prompt_too_long', 'Prompt长度不能超过8000字符');
  }

  const startTime = Date.now();

  // Initialize Gemini AI
  const ai = new GoogleGenAI({
    apiKey: config.googleApiKey,
  });

  // Debug logging
  console.log('[VirtualTryOn] Calling Gemini API (Three-image mode)...');
  console.log('[VirtualTryOn] Prompt length:', prompt.length);
  console.log('[VirtualTryOn] Face image size:', faceImageData.length, 'chars');
  console.log('[VirtualTryOn] Kimono image size:', kimonoImageBase64.length, 'chars');
  console.log('[VirtualTryOn] Background image size:', backgroundImageBase64.length, 'chars');

  try {
    // Build contents array - three images required
    const contents: any[] = [
      // Image 1: Face source
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: faceImageData,
        }
      },
      // Image 2: Kimono source
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: kimonoImageBase64,
        }
      },
      // Image 3: Background/pose reference
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: backgroundImageBase64,
        }
      },
      // Prompt text
      { text: prompt }
    ];

    // Get image quality settings from options (default to 2K for better quality)
    const imageSize = options?.imageSize || '2K';
    const aspectRatio = options?.aspectRatio || '3:4'; // 竖版人像

    console.log('[VirtualTryOn] Image config:', { imageSize, aspectRatio });

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        // High-quality image output settings
        imageConfig: {
          imageSize: imageSize,      // '1K', '2K', or '4K'
          aspectRatio: aspectRatio,  // '3:4' for portrait
        },
      } as any, // Type assertion for imageConfig (not in @google/genai types yet)
    });

    console.log('[VirtualTryOn] Gemini API response received');

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Extract image from response
    const candidate = result.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new TryOnGeneratorError('no_content', 'AI 未生成内容');
    }

    const imagePart = candidate.content.parts.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!imagePart || !imagePart.inlineData?.data) {
      throw new TryOnGeneratorError('no_image', 'AI 响应中没有图片数据');
    }

    const imageBytes = imagePart.inlineData.data;
    const resultBuffer = Buffer.from(imageBytes, 'base64');

    console.log('[VirtualTryOn] Generated image size:', resultBuffer.length, 'bytes');

    // Build debug info
    const debugInfo: DebugInfo = {
      model: 'gemini-3-pro-image-preview',
      promptLength: prompt.length,
      personImageSize: faceImageData.length,
      kimonoImageSize: kimonoImageBase64.length,
      resultImageSize: resultBuffer.length,
      timestamp: new Date().toISOString(),
      isCustomPrompt: !!customPrompt,
      imageSize: imageSize,
      aspectRatio: aspectRatio,
    };

    // Upload to Supabase if config provided
    let imageUrl: string | undefined;
    if (config.supabaseUrl && config.supabaseServiceKey) {
      const storagePath = generateStoragePath(null, 'jpg');
      imageUrl = await uploadToSupabase(resultBuffer, storagePath, 'image/jpeg', {
        supabaseUrl: config.supabaseUrl,
        supabaseServiceKey: config.supabaseServiceKey,
        bucket: config.storageBucket,
      });
      console.log('[VirtualTryOn] Image uploaded to Supabase:', imageUrl);
    }

    return {
      success: true,
      imageUrl,
      imageBuffer: resultBuffer,
      duration,
      debugInfo,
    };

  } catch (error: any) {
    console.error('[VirtualTryOn] Gemini AI error:', error);

    // Handle specific AI errors
    if (error instanceof TryOnGeneratorError) {
      throw error;
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new TryOnGeneratorError('api_quota_exceeded', 'API 配额已用完，请稍后重试');
    }

    if (error.message?.includes('SAFETY')) {
      throw new TryOnGeneratorError('content_filtered', '图片内容不适合处理，请上传其他照片');
    }

    throw new TryOnGeneratorError('generation_failed', error.message || '生成失败');
  }
}

/**
 * Create a Next.js API route handler (Three-image mode)
 *
 * This is a helper to wrap the generator for use in Next.js App Router
 */
export function createNextHandler(config: TryOnConfig) {
  return async function handler(request: Request): Promise<Response> {
    try {
      const body = await request.json();

      const result = await generateTryOn({
        faceImageBase64: body.faceImageBase64,
        kimonoImageUrl: body.kimonoImageUrl,
        backgroundPoseRef: body.backgroundPoseRef,
        options: body.options,
        customPrompt: body.customPrompt,
        planId: body.planId,
        kimonoId: body.kimonoId,
      }, config);

      // If no Supabase URL, convert imageBuffer to base64 data URL
      let finalImageUrl = result.imageUrl;
      if (!finalImageUrl && result.imageBuffer) {
        const base64 = result.imageBuffer.toString('base64');
        finalImageUrl = `data:image/jpeg;base64,${base64}`;
        console.log('[VirtualTryOn] Returning base64 data URL (length:', finalImageUrl.length, ')');
      }

      return Response.json({
        success: true,
        imageUrl: finalImageUrl,
        duration: result.duration,
        remainingQuota: -1,
        quality: 'premium',
        debugInfo: result.debugInfo,
      });

    } catch (error: any) {
      console.error('[VirtualTryOn] Handler error:', error);

      const statusCode = error.code === 'content_filtered' ? 400
        : error.code === 'api_quota_exceeded' ? 503
        : error.code?.startsWith('missing') || error.code?.startsWith('prompt') ? 400
        : 500;

      return Response.json({
        error: error.code || 'internal_error',
        message: error.message || '处理失败，请重试',
      }, { status: statusCode });
    }
  };
}

// ============================================================================
// TWO-ROUND GENERATION (方案A: 两轮分离法)
// ============================================================================

/**
 * Generate virtual try-on image using Two-Round approach
 *
 * Round 1: Face + Kimono → White background full-body portrait
 * Round 2: Round 1 result + Background reference → Final merged image
 *
 * This approach provides better identity preservation and quality.
 *
 * @param request - Try-on request parameters
 * @param config - AI and storage configuration
 * @returns Generated image URL or buffer (with intermediate result)
 */
export async function generateTryOnTwoRound(
  request: TryOnRequestV2,
  config: TryOnConfig
): Promise<GeneratorResult> {
  const { faceImageBase64, kimonoImageUrl, backgroundPoseRef, options } = request;

  // Validate inputs - all three images are required
  if (!faceImageBase64) {
    throw new TryOnGeneratorError('missing_face', '请上传半身照');
  }

  if (!kimonoImageUrl) {
    throw new TryOnGeneratorError('missing_kimono', '请选择和服');
  }

  if (!backgroundPoseRef?.imageUrl) {
    throw new TryOnGeneratorError('missing_background', '请选择背景/姿势参考图');
  }

  // Parse face image
  const faceImageData = faceImageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Get kimono image as base64
  let kimonoImageBase64: string;
  if (kimonoImageUrl.startsWith('data:')) {
    kimonoImageBase64 = kimonoImageUrl.replace(/^data:image\/\w+;base64,/, '');
  } else {
    const kimonoImageResponse = await fetch(kimonoImageUrl);
    const kimonoImageBuffer = await kimonoImageResponse.arrayBuffer();
    kimonoImageBase64 = Buffer.from(kimonoImageBuffer).toString('base64');
  }

  // Get background reference image
  let backgroundImageBase64: string;
  if (backgroundPoseRef.imageUrl.startsWith('data:')) {
    backgroundImageBase64 = backgroundPoseRef.imageUrl.replace(/^data:image\/\w+;base64,/, '');
  } else {
    const bgImageResponse = await fetch(backgroundPoseRef.imageUrl);
    const bgImageBuffer = await bgImageResponse.arrayBuffer();
    backgroundImageBase64 = Buffer.from(bgImageBuffer).toString('base64');
  }

  const startTime = Date.now();

  // Initialize Gemini AI
  const ai = new GoogleGenAI({
    apiKey: config.googleApiKey,
  });

  // Get image quality settings
  const imageSize = options?.imageSize || '2K';
  const aspectRatio = options?.aspectRatio || '3:4';

  console.log('[VirtualTryOn] Starting Two-Round generation...');
  console.log('[VirtualTryOn] Image config:', { imageSize, aspectRatio });

  try {
    // ========================================================================
    // ROUND 1: Face + Kimono + Composition Ref → White background with correct composition
    // ========================================================================
    console.log('[VirtualTryOn] Round 1: Generating kimono portrait with composition reference...');

    const round1Contents: any[] = [
      // Image 1: Face source
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: faceImageData,
        }
      },
      // Image 2: Kimono source
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: kimonoImageBase64,
        }
      },
      // Image 3: Composition reference (background image for pose/framing)
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: backgroundImageBase64,
        }
      },
      // Prompt
      { text: ROUND1_DRESS_PROMPT }
    ];

    const round1Result = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: round1Contents,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          imageSize: imageSize,
          aspectRatio: aspectRatio,
        },
      } as any,
    });

    // Extract Round 1 image
    const round1Candidate = round1Result.candidates?.[0];
    if (!round1Candidate || !round1Candidate.content?.parts) {
      throw new TryOnGeneratorError('round1_no_content', 'Round 1: AI 未生成内容');
    }

    const round1ImagePart = round1Candidate.content.parts.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!round1ImagePart || !round1ImagePart.inlineData?.data) {
      throw new TryOnGeneratorError('round1_no_image', 'Round 1: AI 响应中没有图片数据');
    }

    const round1ImageBase64 = round1ImagePart.inlineData.data;
    const round1Buffer = Buffer.from(round1ImageBase64, 'base64');

    console.log('[VirtualTryOn] Round 1 completed. Image size:', round1Buffer.length, 'bytes');

    // ========================================================================
    // ROUND 2: Round 1 result + Background → Final merged image
    // ========================================================================
    console.log('[VirtualTryOn] Round 2: Merging with background...');

    // Always use keep-expression prompt to preserve user identity
    // Expression transfer often makes the result look unlike the original person
    const round2Prompt = ROUND2_MERGE_KEEP_EXPRESSION_PROMPT;

    const round2Contents: any[] = [
      // Image 1: Round 1 result (kimono portrait)
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: round1ImageBase64,
        }
      },
      // Image 2: Background/pose reference
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: backgroundImageBase64,
        }
      },
      // Prompt
      { text: round2Prompt }
    ];

    const round2Result = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: round2Contents,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          imageSize: imageSize,
          aspectRatio: aspectRatio,
        },
      } as any,
    });

    // Extract Round 2 image
    const round2Candidate = round2Result.candidates?.[0];
    if (!round2Candidate || !round2Candidate.content?.parts) {
      throw new TryOnGeneratorError('round2_no_content', 'Round 2: AI 未生成内容');
    }

    const round2ImagePart = round2Candidate.content.parts.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    );

    if (!round2ImagePart || !round2ImagePart.inlineData?.data) {
      throw new TryOnGeneratorError('round2_no_image', 'Round 2: AI 响应中没有图片数据');
    }

    const round2ImageBase64 = round2ImagePart.inlineData.data;
    const finalBuffer = Buffer.from(round2ImageBase64, 'base64');

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('[VirtualTryOn] Round 2 completed. Final image size:', finalBuffer.length, 'bytes');
    console.log('[VirtualTryOn] Total duration:', duration, 'seconds');

    // Build debug info
    const debugInfo: DebugInfo = {
      model: 'gemini-3-pro-image-preview',
      promptLength: ROUND1_DRESS_PROMPT.length + round2Prompt.length,
      personImageSize: faceImageData.length,
      kimonoImageSize: kimonoImageBase64.length,
      resultImageSize: finalBuffer.length,
      timestamp: new Date().toISOString(),
      isCustomPrompt: false,
      imageSize: imageSize,
      aspectRatio: aspectRatio,
    };

    // Upload to Supabase if config provided
    let imageUrl: string | undefined;
    let intermediateImageUrl: string | undefined;

    if (config.supabaseUrl && config.supabaseServiceKey) {
      // Upload final image
      const storagePath = generateStoragePath(null, 'jpg');
      imageUrl = await uploadToSupabase(finalBuffer, storagePath, 'image/jpeg', {
        supabaseUrl: config.supabaseUrl,
        supabaseServiceKey: config.supabaseServiceKey,
        bucket: config.storageBucket,
      });
      console.log('[VirtualTryOn] Final image uploaded to Supabase:', imageUrl);

      // Upload intermediate image (optional, for debugging/preview)
      const intermediatePath = generateStoragePath(null, 'jpg');
      intermediateImageUrl = await uploadToSupabase(round1Buffer, intermediatePath, 'image/jpeg', {
        supabaseUrl: config.supabaseUrl,
        supabaseServiceKey: config.supabaseServiceKey,
        bucket: config.storageBucket,
      });
      console.log('[VirtualTryOn] Intermediate image uploaded to Supabase:', intermediateImageUrl);
    }

    return {
      success: true,
      imageUrl,
      imageBuffer: finalBuffer,
      intermediateImageUrl,
      intermediateImageBuffer: round1Buffer,
      duration,
      debugInfo,
    };

  } catch (error: any) {
    console.error('[VirtualTryOn] Two-Round generation error:', error);

    // Handle specific AI errors
    if (error instanceof TryOnGeneratorError) {
      throw error;
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new TryOnGeneratorError('api_quota_exceeded', 'API 配额已用完，请稍后重试');
    }

    if (error.message?.includes('SAFETY')) {
      throw new TryOnGeneratorError('content_filtered', '图片内容不适合处理，请上传其他照片');
    }

    throw new TryOnGeneratorError('generation_failed', error.message || '生成失败');
  }
}

/**
 * Create a Next.js API route handler (Two-Round mode)
 */
export function createNextHandlerTwoRound(config: TryOnConfig) {
  return async function handler(request: Request): Promise<Response> {
    try {
      const body = await request.json();

      const result = await generateTryOnTwoRound({
        faceImageBase64: body.faceImageBase64,
        kimonoImageUrl: body.kimonoImageUrl,
        backgroundPoseRef: body.backgroundPoseRef,
        options: body.options,
        planId: body.planId,
        kimonoId: body.kimonoId,
      }, config);

      // If no Supabase URL, convert imageBuffer to base64 data URL
      let finalImageUrl = result.imageUrl;
      if (!finalImageUrl && result.imageBuffer) {
        const base64 = result.imageBuffer.toString('base64');
        finalImageUrl = `data:image/jpeg;base64,${base64}`;
        console.log('[VirtualTryOn] Returning base64 data URL (length:', finalImageUrl.length, ')');
      }

      // Also convert intermediate image if available
      let intermediateImageUrl = result.intermediateImageUrl;
      if (!intermediateImageUrl && result.intermediateImageBuffer) {
        const base64 = result.intermediateImageBuffer.toString('base64');
        intermediateImageUrl = `data:image/jpeg;base64,${base64}`;
      }

      return Response.json({
        success: true,
        imageUrl: finalImageUrl,
        intermediateImageUrl: intermediateImageUrl,
        duration: result.duration,
        remainingQuota: -1,
        quality: 'premium',
        mode: 'two-round',
        debugInfo: result.debugInfo,
      });

    } catch (error: any) {
      console.error('[VirtualTryOn] Handler error:', error);

      const statusCode = error.code === 'content_filtered' ? 400
        : error.code === 'api_quota_exceeded' ? 503
        : error.code?.startsWith('missing') || error.code?.startsWith('round') ? 400
        : 500;

      return Response.json({
        error: error.code || 'internal_error',
        message: error.message || '处理失败，请重试',
      }, { status: statusCode });
    }
  };
}

// ============================================================================
// V3: Clean Background Single-Round Mode (推荐方案)
// ============================================================================

/**
 * V3 Request 类型 - 支持 4 图模式（带姿势参考）
 */
export interface TryOnRequestV3 extends TryOnRequestV2 {
  /** 干净的背景图URL（人物已移除） */
  cleanBackgroundUrl?: string;
}

/**
 * V3 生成函数 - 使用预处理好的干净背景
 *
 * 支持两种模式：
 * 1. 3图模式：用户脸 + 和服 + 干净背景 → 最终图
 * 2. 4图模式：用户脸 + 和服 + 原图(姿势参考) + 干净背景 → 最终图
 */
export async function generateTryOnV3(
  request: TryOnRequestV3,
  config: TryOnConfig
): Promise<GeneratorResult> {
  const { faceImageBase64, kimonoImageUrl, backgroundPoseRef, cleanBackgroundUrl, options } = request;

  // Validate inputs
  if (!faceImageBase64) {
    throw new TryOnGeneratorError('missing_face', '请上传半身照');
  }

  if (!kimonoImageUrl) {
    throw new TryOnGeneratorError('missing_kimono', '请选择和服');
  }

  // 需要干净背景或原背景图
  const bgUrl = cleanBackgroundUrl || backgroundPoseRef?.cleanBackgroundUrl;
  if (!bgUrl) {
    throw new TryOnGeneratorError('missing_clean_background', '请选择已处理的背景图');
  }

  // Parse face image and validate size
  const faceImageData = faceImageBase64.replace(/^data:image\/\w+;base64,/, '');
  validateImageSize(faceImageData, '人物照片');

  // Get kimono image as base64
  let kimonoImageBase64: string;
  if (kimonoImageUrl.startsWith('data:')) {
    kimonoImageBase64 = kimonoImageUrl.replace(/^data:image\/\w+;base64,/, '');
  } else {
    const kimonoImageResponse = await fetchWithTimeout(kimonoImageUrl);
    if (!kimonoImageResponse.ok) {
      throw new TryOnGeneratorError('kimono_fetch_failed', '无法加载和服图片');
    }
    const kimonoImageBuffer = await kimonoImageResponse.arrayBuffer();
    kimonoImageBase64 = Buffer.from(kimonoImageBuffer).toString('base64');
  }
  validateImageSize(kimonoImageBase64, '和服图片');

  // Get clean background image as base64
  let cleanBgBase64: string;
  if (bgUrl.startsWith('data:')) {
    cleanBgBase64 = bgUrl.replace(/^data:image\/\w+;base64,/, '');
  } else {
    const bgResponse = await fetchWithTimeout(bgUrl);
    if (!bgResponse.ok) {
      throw new TryOnGeneratorError('background_fetch_failed', '无法加载背景图片');
    }
    const bgBuffer = await bgResponse.arrayBuffer();
    cleanBgBase64 = Buffer.from(bgBuffer).toString('base64');
  }
  validateImageSize(cleanBgBase64, '背景图片');

  // Check if we have pose reference (4-image mode)
  let poseRefBase64: string | null = null;
  const usePoseReference = !!backgroundPoseRef?.imageUrl;
  if (usePoseReference) {
    const poseUrl = backgroundPoseRef!.imageUrl;
    if (poseUrl.startsWith('data:')) {
      poseRefBase64 = poseUrl.replace(/^data:image\/\w+;base64,/, '');
    } else {
      const poseResponse = await fetchWithTimeout(poseUrl);
      if (!poseResponse.ok) {
        throw new TryOnGeneratorError('pose_fetch_failed', '无法加载姿势参考图');
      }
      const poseBuffer = await poseResponse.arrayBuffer();
      poseRefBase64 = Buffer.from(poseBuffer).toString('base64');
    }
    validateImageSize(poseRefBase64, '姿势参考图');
  }

  const startTime = Date.now();

  // Initialize Gemini AI
  const ai = new GoogleGenAI({
    apiKey: config.googleApiKey,
  });

  const imageSize = options?.imageSize || '2K';
  const aspectRatio = options?.aspectRatio || '3:4';

  console.log('[VirtualTryOn] Starting V3 generation...');
  console.log('[VirtualTryOn] Mode:', usePoseReference ? '4-image (with pose ref)' : '3-image (clean bg only)');

  try {
    // Build content array based on mode
    const contentParts: any[] = [
      // Image 1: Face source
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: faceImageData,
        }
      },
      // Image 2: Kimono source
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: kimonoImageBase64,
        }
      },
    ];

    // Choose prompt based on mode
    let prompt: string;

    if (usePoseReference && poseRefBase64) {
      // 4-image mode: face + kimono + pose ref + clean bg
      contentParts.push(
        // Image 3: Pose reference (original with person)
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: poseRefBase64,
          }
        },
        // Image 4: Clean background
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBgBase64,
          }
        }
      );
      prompt = V3_WITH_POSE_REFERENCE_PROMPT;
    } else {
      // 3-image mode: face + kimono + clean bg
      contentParts.push(
        // Image 3: Clean background
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBgBase64,
          }
        }
      );
      prompt = V3_CLEAN_BACKGROUND_PROMPT;
    }

    contentParts.push({ text: prompt });

    console.log('[VirtualTryOn] V3 Image config:', { imageSize, aspectRatio });

    // Generate image using Gemini 3.0 Pro for best quality
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: contentParts,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
        // High-quality image output settings
        imageConfig: {
          imageSize: imageSize,      // '1K', '2K', or '4K'
          aspectRatio: aspectRatio,  // '3:4' for portrait
        },
      } as any, // Type assertion for imageConfig
    });

    // Extract generated image
    const result = response.candidates?.[0]?.content?.parts;
    if (!result) {
      throw new TryOnGeneratorError('no_response', 'AI 未返回结果');
    }

    const imagePart = result.find((part: any) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      const textPart = result.find((part: any) => part.text);
      if (textPart?.text?.toLowerCase().includes('sorry') ||
          textPart?.text?.toLowerCase().includes('cannot') ||
          textPart?.text?.toLowerCase().includes('unable')) {
        throw new TryOnGeneratorError('content_filtered', 'AI 无法生成该图像，请更换照片重试');
      }
      throw new TryOnGeneratorError('no_image', 'AI 未返回图像');
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const duration = Date.now() - startTime;

    console.log(`[VirtualTryOn] V3 generation completed in ${duration}ms`);

    // Upload to Supabase if configured
    let imageUrl: string | undefined;
    if (config.supabaseUrl && config.supabaseServiceKey) {
      const storagePath = generateStoragePath(null, 'jpg');
      imageUrl = await uploadToSupabase(imageBuffer, storagePath, 'image/jpeg', {
        supabaseUrl: config.supabaseUrl,
        supabaseServiceKey: config.supabaseServiceKey,
        bucket: config.storageBucket,
      });
      console.log('[VirtualTryOn] V3 Image uploaded to Supabase:', imageUrl);
    }

    const debugInfo: DebugInfo = {
      model: 'gemini-3-pro-image-preview',
      promptLength: prompt.length,
      personImageSize: faceImageData.length,
      kimonoImageSize: kimonoImageBase64.length,
      resultImageSize: imageBuffer.length,
      timestamp: new Date().toISOString(),
      isCustomPrompt: !!request.customPrompt,
      imageSize: imageSize,
      aspectRatio: aspectRatio,
    };

    return {
      success: true,
      imageUrl,
      imageBuffer,
      duration,
      debugInfo,
    };
  } catch (error: any) {
    console.error('[VirtualTryOn] V3 generation error:', error);

    if (error instanceof TryOnGeneratorError) {
      throw error;
    }

    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      throw new TryOnGeneratorError('api_quota_exceeded', 'API 配额已用完，请稍后重试');
    }

    throw new TryOnGeneratorError('generation_failed', error.message || '生成失败，请重试');
  }
}

/**
 * 创建 V3 Next.js API Handler
 */
export function createNextHandlerV3(config: TryOnConfig) {
  return async (req: Request) => {
    try {
      const body = await req.json();

      const result = await generateTryOnV3({
        faceImageBase64: body.faceImageBase64,
        kimonoImageUrl: body.kimonoImageUrl,
        backgroundPoseRef: body.backgroundPoseRef,
        cleanBackgroundUrl: body.cleanBackgroundUrl,
        options: body.options,
        planId: body.planId,
        kimonoId: body.kimonoId,
      }, config);

      // If no Supabase URL, convert imageBuffer to base64 data URL
      let finalImageUrl = result.imageUrl;
      if (!finalImageUrl && result.imageBuffer) {
        const base64 = result.imageBuffer.toString('base64');
        finalImageUrl = `data:image/jpeg;base64,${base64}`;
      }

      return Response.json({
        success: true,
        imageUrl: finalImageUrl,
        duration: result.duration,
        remainingQuota: -1,
        quality: 'premium',
        mode: 'v3-clean-background',
        debugInfo: result.debugInfo,
      });

    } catch (error: any) {
      console.error('[VirtualTryOn] V3 Handler error:', error);

      const statusCode = error.code === 'content_filtered' ? 400
        : error.code === 'api_quota_exceeded' ? 503
        : error.code === 'fetch_timeout' ? 504
        : error.code === 'network_error' ? 502
        : error.code === 'image_too_large' ? 413
        : error.code?.startsWith('missing') ? 400
        : error.code?.endsWith('_fetch_failed') ? 502
        : 500;

      return Response.json({
        error: error.code || 'internal_error',
        message: error.message || '处理失败，请重试',
      }, { status: statusCode });
    }
  };
}

// Aliases for backwards compatibility
export const generateTryOnV2 = generateTryOn;
export const createNextHandlerV2 = createNextHandler;
