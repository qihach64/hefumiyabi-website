import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// AWS 配置
const AWS_REGION = process.env.AWS_REGION || "ap-northeast-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "kimono-one-images-prod";
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "";

// 延迟初始化 S3 客户端
let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials are not configured");
    }

    _s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return _s3Client;
}

// 图片分类和对应的存储路径
export type ImageCategory =
  | "plan"
  | "merchant"
  | "user"
  | "tryon"
  | "component"
  | "upgrade"
  | "custom-service";

export type ImagePurpose = "main" | "gallery" | "avatar" | "logo" | "cover" | "banner";

// 支持的图片类型
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// 最大文件大小 (20MB)
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

// 图片尺寸变体
export const IMAGE_VARIANTS = {
  thumbnail: { width: 200, height: 267 }, // 3:4 ratio
  small: { width: 400, height: 533 },
  medium: { width: 800, height: 1067 },
  large: { width: 1200, height: 1600 },
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

/**
 * 生成 S3 存储路径
 */
export function generateS3Key(
  category: ImageCategory,
  entityId: string,
  purpose: ImagePurpose = "main",
  extension: string = "jpg"
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  // 根据分类生成不同的路径结构
  switch (category) {
    case "plan":
      return `originals/plans/${entityId}/${purpose}-${timestamp}-${random}.${extension}`;
    case "merchant":
      return `originals/merchants/${entityId}/${purpose}-${timestamp}-${random}.${extension}`;
    case "user":
      return `originals/users/${entityId}/${purpose}-${timestamp}-${random}.${extension}`;
    case "tryon":
      return `originals/tryon/${entityId}/${timestamp}-${random}.${extension}`;
    case "component":
      return `originals/components/${entityId}/${purpose}-${timestamp}-${random}.${extension}`;
    case "upgrade":
      return `originals/upgrades/${entityId}/${purpose}-${timestamp}-${random}.${extension}`;
    default:
      return `originals/misc/${entityId}/${timestamp}-${random}.${extension}`;
  }
}

/**
 * 获取文件扩展名
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return mimeToExt[mimeType] || "jpg";
}

/**
 * 获取预签名上传 URL
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: AllowedImageType,
  expiresIn: number = 300 // 5 分钟
): Promise<{ presignedUrl: string; publicUrl: string }> {
  const s3 = getS3Client();

  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000", // 1 年缓存
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn });

  // 构建公开访问 URL
  const publicUrl = CLOUDFRONT_DOMAIN
    ? `https://${CLOUDFRONT_DOMAIN}/${key}`
    : `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return { presignedUrl, publicUrl };
}
