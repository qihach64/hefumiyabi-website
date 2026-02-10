import { supabaseAdmin } from './supabase';

/**
 * 上传图片到 Supabase Storage
 * @param buffer 图片 Buffer
 * @param path 存储路径（例如: "tryon/user123/1234567890.jpg"）
 * @param contentType MIME类型（例如: "image/jpeg"）
 * @returns 公开访问的 URL
 */
export async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('tryon-results')
    .upload(path, buffer, {
      contentType,
      cacheControl: '31536000', // 1年缓存
      upsert: false, // 不覆盖已存在的文件
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`上传失败: ${error.message}`);
  }

  // 获取公开 URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('tryon-results')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * 生成存储路径
 * @param userId 用户 ID（或 'guest'）
 * @param fileExtension 文件扩展名（例如: 'jpg'）
 * @returns 路径字符串
 */
export function generateStoragePath(
  userId: string | null,
  fileExtension: string = 'jpg'
): string {
  const userDir = userId || 'guest';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${userDir}/${timestamp}-${random}.${fileExtension}`;
}
