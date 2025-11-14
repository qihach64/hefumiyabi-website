-- 创建 VirtualTryOn 表的 SQL 脚本
-- 如果 prisma db push 失败，可以在 Supabase SQL Editor 中手动运行

-- 1. 创建 TryOnStatus 枚举类型（如果不存在）
DO $$ BEGIN
    CREATE TYPE "TryOnStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. 创建 virtual_tryons 表
CREATE TABLE IF NOT EXISTS "virtual_tryons" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "planId" TEXT,
    "kimonoId" TEXT,
    "personImageUrl" TEXT,
    "resultImageUrl" TEXT NOT NULL,
    "status" "TryOnStatus" NOT NULL DEFAULT 'PROCESSING',
    "duration" INTEGER,
    "cost" DOUBLE PRECISION,
    "fromCache" BOOLEAN NOT NULL DEFAULT false,
    "prompt" TEXT,
    "modelVersion" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_tryons_pkey" PRIMARY KEY ("id")
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS "virtual_tryons_userId_idx" ON "virtual_tryons"("userId");
CREATE INDEX IF NOT EXISTS "virtual_tryons_sessionId_idx" ON "virtual_tryons"("sessionId");
CREATE INDEX IF NOT EXISTS "virtual_tryons_planId_idx" ON "virtual_tryons"("planId");
CREATE INDEX IF NOT EXISTS "virtual_tryons_status_idx" ON "virtual_tryons"("status");
CREATE INDEX IF NOT EXISTS "virtual_tryons_createdAt_idx" ON "virtual_tryons"("createdAt");

-- 4. 验证表是否创建成功
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE tablename = 'virtual_tryons';

-- 5. 验证索引是否创建成功
SELECT
    indexname
FROM pg_indexes
WHERE tablename = 'virtual_tryons';
