-- 激活所有有主题的套餐
-- 可以在 Supabase Dashboard > SQL Editor 中直接执行

-- 1. 查看将要激活的套餐
SELECT
    rp.id,
    rp.name,
    t.name as theme_name,
    rp."isActive"
FROM rental_plans rp
INNER JOIN themes t ON rp."themeId" = t.id
WHERE rp."isActive" = false;

-- 2. 执行激活
UPDATE rental_plans
SET "isActive" = true
WHERE "themeId" IS NOT NULL
  AND "isActive" = false;

-- 3. 查看结果统计
SELECT
    COUNT(*) FILTER (WHERE "isActive" = true AND "themeId" IS NOT NULL) as active_with_theme,
    COUNT(*) FILTER (WHERE "isActive" = true AND "themeId" IS NULL) as active_without_theme,
    COUNT(*) FILTER (WHERE "isActive" = false) as inactive_total
FROM rental_plans;
