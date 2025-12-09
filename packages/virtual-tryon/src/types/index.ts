// Virtual Try-On Types

/**
 * Kimono item for virtual try-on
 */
export interface KimonoItem {
  id: string;
  name: string;
  imageUrl: string;
  /** 处理后的纯和服图片URL（用于AI生成，移除了人物和背景） */
  cleanImageUrl?: string;
  planId?: string;
  source: 'plan' | 'upload';
}

/**
 * Try-on result after generation
 */
export interface TryOnResult {
  userPhoto: string;
  kimonoImage: string;
  resultImage: string;
  timestamp: Date;
}

/**
 * Generated result with additional metadata
 */
export interface GeneratedResult {
  kimono: KimonoItem;
  resultImage: string;
  timestamp: Date;
  userPhoto: string;
}

/**
 * Debug information from API response
 */
export interface DebugInfo {
  model: string;
  promptLength: number;
  personImageSize: number;
  kimonoImageSize: number;
  resultImageSize: number;
  timestamp: string;
  isCustomPrompt: boolean;
  /** 请求的图片质量 */
  imageSize?: string;
  /** 请求的宽高比 */
  aspectRatio?: string;
}

/**
 * Request payload for virtual try-on API (V1 - backwards compatible)
 */
export interface TryOnRequest {
  personImageBase64: string;
  kimonoImageUrl: string;
  planId?: string;
  kimonoId?: string;
  customPrompt?: string;
}

/**
 * V2 Request payload with background/pose reference support
 */
export interface TryOnRequestV2 {
  /** 用户半身照（重点面部） */
  faceImageBase64: string;
  /** 和服图片 URL */
  kimonoImageUrl: string;
  /** 背景参考（可选，不选则使用用户原背景） */
  backgroundPoseRef?: {
    /** 参考图 URL */
    imageUrl: string;
    /** 分类 */
    category: 'girl' | 'boy' | 'kid';
    /** 反抠像URL（移除人物后的背景） */
    cleanBackgroundUrl?: string;
  };
  /** 生成选项 */
  options?: {
    /** 保留用户原表情（默认 false，使用参考图表情） */
    preserveExpression?: boolean;
    /** 身体补全体型 */
    bodyType?: 'auto' | 'slim' | 'normal' | 'curvy';
    /** 图片输出质量/分辨率 (1K=默认, 2K=高清, 4K=超高清) */
    imageSize?: '1K' | '2K' | '4K';
    /** 宽高比 (默认 3:4 竖版人像) */
    aspectRatio?: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  };
  /** 自定义 Prompt（覆盖默认） */
  customPrompt?: string;
  /** 关联的套餐 ID */
  planId?: string;
  /** 关联的和服 ID */
  kimonoId?: string;
}

/**
 * Response from virtual try-on API
 */
export interface TryOnResponse {
  success: boolean;
  id?: string;
  imageUrl?: string;
  duration?: number;
  remainingQuota?: number;
  quality?: string;
  debugInfo?: DebugInfo;
  error?: string;
  message?: string;
}

/**
 * Configuration for the try-on generator
 */
export interface TryOnConfig {
  googleApiKey: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
  storageBucket?: string;
}

/**
 * Prompt preset for different scenarios
 */
export interface PromptPreset {
  name: string;
  prompt: string;
  description: string;
}

/**
 * Cached try-on result for localStorage
 */
export interface CachedTryOnResult {
  planId: string;
  planName: string;
  planImageUrl: string;
  resultPhoto: string;
  timestamp: number;
}
