/**
 * AWS Lambda 图片处理函数
 *
 * 触发器: S3 ObjectCreated 事件 (originals/ 目录)
 * 功能: 生成多种尺寸的 WebP 缩略图
 *
 * 部署要求:
 * 1. 创建 Lambda Layer 包含 sharp 模块
 * 2. 设置内存 >= 512MB，超时 >= 30s
 * 3. 配置 S3 触发器 (prefix: originals/, suffix: .jpg/.jpeg/.png/.webp)
 * 4. IAM 权限: s3:GetObject, s3:PutObject
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3 = new S3Client();

// 图片尺寸变体配置 (3:4 比例)
const VARIANTS = [
  { name: 'thumbnail', width: 200, height: 267 },
  { name: 'small', width: 400, height: 533 },
  { name: 'medium', width: 800, height: 1067 },
  { name: 'large', width: 1200, height: 1600 },
];

// WebP 压缩质量
const WEBP_QUALITY = 85;

export async function handler(event) {
  console.log('Processing event:', JSON.stringify(event, null, 2));

  const results = [];

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing: ${bucket}/${key}`);

    // 跳过非 originals 目录的文件
    if (!key.startsWith('originals/')) {
      console.log('Skipping non-originals file');
      continue;
    }

    // 跳过已处理的文件
    if (key.startsWith('processed/')) {
      console.log('Skipping already processed file');
      continue;
    }

    try {
      // 1. 从 S3 获取原图
      const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await s3.send(getCommand);

      // 转换 stream 为 buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const imageBuffer = Buffer.concat(chunks);

      console.log(`Downloaded ${imageBuffer.length} bytes`);

      // 2. 生成各尺寸变体
      for (const variant of VARIANTS) {
        try {
          const processedBuffer = await sharp(imageBuffer)
            .resize(variant.width, variant.height, {
              fit: 'cover',
              position: 'center',
            })
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();

          // 生成处理后的 key
          const processedKey = key
            .replace('originals/', `processed/${variant.name}/`)
            .replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');

          // 3. 上传处理后的图片
          const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: processedKey,
            Body: processedBuffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000',
          });

          await s3.send(putCommand);

          console.log(`Created ${variant.name}: ${processedKey} (${processedBuffer.length} bytes)`);

          results.push({
            variant: variant.name,
            key: processedKey,
            size: processedBuffer.length,
            status: 'success',
          });
        } catch (variantError) {
          console.error(`Error creating ${variant.name}:`, variantError);
          results.push({
            variant: variant.name,
            key: key,
            status: 'error',
            error: variantError.message,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      results.push({
        key,
        status: 'error',
        error: error.message,
      });
    }
  }

  return {
    statusCode: 200,
    body: {
      message: 'Processing complete',
      results,
    },
  };
}
