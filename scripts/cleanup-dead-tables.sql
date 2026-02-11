-- 清理数据库中已从 Prisma Schema 移除的死表和废弃列
-- 运行前请先备份！
-- 用法: psql $DATABASE_URL < scripts/cleanup-dead-tables.sql

-- === 1. 删除死表 (0 行，无代码引用) ===
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
-- 注意: accounts/sessions 是 NextAuth 表，保留

-- === 2. 删除 rental_plans 上的废弃列 ===
ALTER TABLE rental_plans
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS includes,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS "isLimited",
  DROP COLUMN IF EXISTS "maxBookings",
  DROP COLUMN IF EXISTS "currentBookings",
  DROP COLUMN IF EXISTS "nameEn";

-- === 3. 验证 ===
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('carts', 'cart_items', 'payouts', 'listings');
-- 预期: 0 行

SELECT column_name FROM information_schema.columns
WHERE table_name = 'rental_plans'
AND column_name IN ('category', 'includes', 'tags', 'isLimited', 'maxBookings', 'currentBookings', 'nameEn');
-- 预期: 0 行
