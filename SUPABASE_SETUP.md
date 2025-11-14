# Supabase Storage 配置指南

## 1. 环境变量配置

在 `.env.local` 中添加以下环境变量：

```bash
# Supabase 配置（可能已存在，如果没有请添加）
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."  # 服务端密钥，千万不要暴露到客户端
```

### 如何获取这些值？

1. 进入 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧 Settings → API
4. 复制以下值：
   - `URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role secret` → SUPABASE_SERVICE_ROLE_KEY

## 2. 创建 Storage Bucket

### 方式 A：通过 Dashboard（推荐）

1. 进入 Supabase Dashboard
2. 点击左侧 Storage
3. 点击 "Create a new bucket"
4. 配置：
   ```
   Name: tryon-results
   Public bucket: ✅ 勾选（允许公开访问）
   File size limit: 10 MB
   Allowed MIME types: image/jpeg, image/png
   ```
5. 点击 "Create bucket"

### 方式 B：通过 SQL（可选）

在 SQL Editor 中运行：

```sql
-- 创建 bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tryon-results', 'tryon-results', true);

-- 设置访问策略（允许所有人读取）
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tryon-results' );

-- 允许认证用户上传
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tryon-results'
  AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);
```

## 3. 设置 RLS 策略（可选，推荐）

如果你想控制谁可以上传/删除文件：

```sql
-- 只允许 service_role 上传和删除
CREATE POLICY "Service role only upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tryon-results'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Service role only delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tryon-results'
  AND auth.role() = 'service_role'
);
```

## 4. 运行数据库迁移

创建 VirtualTryOn 表：

```bash
# 方式 A：使用 prisma migrate（生产环境推荐）
pnpm prisma migrate dev --name add_virtual_tryon

# 方式 B：使用 prisma db push（开发环境快速）
pnpm prisma db push
```

## 5. 验证配置

### 测试 Storage 连接

创建测试脚本 `scripts/test-supabase-storage.ts`：

```typescript
import { supabaseAdmin } from '../src/lib/supabase';

async function testStorage() {
  // 测试上传
  const testData = Buffer.from('Hello Supabase!');
  const { data, error } = await supabaseAdmin.storage
    .from('tryon-results')
    .upload('test/hello.txt', testData, {
      contentType: 'text/plain',
    });

  if (error) {
    console.error('❌ Upload failed:', error);
    return;
  }

  console.log('✅ Upload success:', data);

  // 获取公开 URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('tryon-results')
    .getPublicUrl(data.path);

  console.log('📍 Public URL:', publicUrl);

  // 测试删除
  const { error: deleteError } = await supabaseAdmin.storage
    .from('tryon-results')
    .remove([data.path]);

  if (deleteError) {
    console.error('❌ Delete failed:', deleteError);
    return;
  }

  console.log('✅ Delete success');
}

testStorage().catch(console.error);
```

运行测试：

```bash
pnpm tsx scripts/test-supabase-storage.ts
```

## 6. 常见问题

### Q: 报错 "Bucket not found"
A: 检查 bucket 名称是否为 `tryon-results`，大小写敏感

### Q: 报错 "new row violates row-level security policy"
A: 检查 RLS 策略，确保 service_role 有权限上传

### Q: 图片无法访问（404）
A: 检查 bucket 是否设置为 public

### Q: CORS 错误
A: 在 Supabase Dashboard → Storage → Configuration → CORS 中添加你的域名

## 7. 成本估算

### Supabase 免费版限制
- 存储: 1GB
- 流量: 2GB/月
- 带宽: 50GB/月

### Pro 版（$25/月）
- 存储: 100GB
- 流量: 200GB/月
- 带宽: 250GB/月

### 实际使用估算
假设每月 1000 次试穿，每张图片 1MB：

```
存储: 1000 张 × 1MB = 1GB（免费版够用）
流量: 1000 张 × 5 次查看 × 1MB = 5GB（需升级 Pro）
```

## 8. 迁移到生产环境

### Vercel 部署

1. 在 Vercel Dashboard → Settings → Environment Variables 中添加：
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

2. 重新部署：
   ```bash
   git push origin main
   ```

### 数据库迁移

```bash
# 在生产环境运行
pnpm prisma migrate deploy
```

## 9. 监控和维护

### 查看 Storage 使用情况

Supabase Dashboard → Storage → Usage

### 清理旧文件

创建定时任务 `scripts/cleanup-old-tryons.ts`：

```typescript
import { supabaseAdmin } from '../src/lib/supabase';
import prisma from '../src/lib/prisma';

async function cleanupOldTryOns() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 查找30天前的记录
  const oldRecords = await prisma.virtualTryOn.findMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      userId: null, // 仅清理游客记录
    },
    select: { id: true, resultImageUrl: true },
  });

  console.log(`Found ${oldRecords.length} old records to delete`);

  for (const record of oldRecords) {
    // 从 Storage 删除文件
    const path = record.resultImageUrl.split('/').slice(-2).join('/');
    await supabaseAdmin.storage.from('tryon-results').remove([path]);

    // 从数据库删除记录
    await prisma.virtualTryOn.delete({ where: { id: record.id } });
  }

  console.log('✅ Cleanup complete');
}

cleanupOldTryOns().catch(console.error);
```

设置 Vercel Cron Job：

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-tryons",
    "schedule": "0 2 * * *"
  }]
}
```
