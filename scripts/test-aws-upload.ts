/**
 * AWS S3 图片上传测试脚本
 *
 * 运行: pnpm tsx scripts/test-aws-upload.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

// 配置
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-1';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'kimono-one-images-prod';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || '';

async function main() {
  console.log('🧪 AWS S3 上传测试\n');
  console.log('配置:');
  console.log(`  Region: ${AWS_REGION}`);
  console.log(`  Bucket: ${AWS_S3_BUCKET}`);
  console.log(`  CloudFront: ${CLOUDFRONT_DOMAIN || '(未配置)'}`);
  console.log('');

  // 检查凭证
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId) {
    console.error('❌ 缺少 AWS_ACCESS_KEY_ID');
    console.log('\n请在 .env.local 中添加:');
    console.log('AWS_ACCESS_KEY_ID=your_access_key');
    console.log('AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('AWS_REGION=ap-northeast-1');
    console.log('AWS_S3_BUCKET=your_bucket_name');
    console.log('CLOUDFRONT_DOMAIN=your_cloudfront_domain (可选)');
    process.exit(1);
  }

  if (!secretAccessKey) {
    console.error('❌ 缺少 AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  console.log('✅ AWS 凭证已配置\n');

  // 创建 S3 客户端
  const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // 测试用的图片内容 (1x1 红色 PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    'base64'
  );

  const testKey = `test/upload-test-${Date.now()}.png`;

  try {
    // 1. 测试上传
    console.log('📤 测试上传...');
    await s3.send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: testKey,
        Body: testImageBuffer,
        ContentType: 'image/png',
      })
    );
    console.log(`  ✅ 上传成功: ${testKey}`);

    // 构建 URL
    const s3Url = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${testKey}`;
    const cdnUrl = CLOUDFRONT_DOMAIN ? `https://${CLOUDFRONT_DOMAIN}/${testKey}` : null;

    console.log(`  📎 S3 URL: ${s3Url}`);
    if (cdnUrl) {
      console.log(`  📎 CDN URL: ${cdnUrl}`);
    }

    // 2. 验证文件存在
    console.log('\n🔍 验证文件存在...');
    const headResult = await s3.send(
      new HeadObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: testKey,
      })
    );
    console.log(`  ✅ 文件已确认 (${headResult.ContentLength} bytes)`);

    // 3. 清理测试文件
    console.log('\n🧹 清理测试文件...');
    await s3.send(
      new DeleteObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: testKey,
      })
    );
    console.log('  ✅ 测试文件已删除');

    console.log('\n✅ 所有测试通过！AWS S3 配置正确。');
    console.log('\n现在可以:');
    console.log('  1. 访问 http://localhost:3000/test-upload 测试前端上传');
    console.log('  2. 在商家后台上传套餐图片');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);

    if (error instanceof Error) {
      if (error.name === 'NoSuchBucket') {
        console.log(`\n🔧 Bucket "${AWS_S3_BUCKET}" 不存在，请检查 AWS_S3_BUCKET 配置`);
      } else if (error.name === 'AccessDenied' || error.message.includes('Access Denied')) {
        console.log('\n🔧 访问被拒绝，请检查:');
        console.log('  1. AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY 是否正确');
        console.log('  2. IAM 用户是否有 S3 权限 (s3:PutObject, s3:GetObject, s3:DeleteObject)');
        console.log('  3. Bucket 策略是否允许该用户访问');
      } else if (error.name === 'InvalidAccessKeyId') {
        console.log('\n🔧 Access Key ID 无效，请检查 AWS_ACCESS_KEY_ID');
      } else if (error.name === 'SignatureDoesNotMatch') {
        console.log('\n🔧 Secret Access Key 无效，请检查 AWS_SECRET_ACCESS_KEY');
      }
    }

    process.exit(1);
  }
}

main();
