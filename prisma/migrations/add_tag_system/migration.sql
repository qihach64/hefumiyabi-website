-- 标签分类表
CREATE TABLE "tag_categories" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "name_en" TEXT,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "show_in_filter" BOOLEAN NOT NULL DEFAULT true,
  "filter_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tag_categories_pkey" PRIMARY KEY ("id")
);

-- 标签表
CREATE TABLE "tags" (
  "id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "name_en" TEXT,
  "icon" TEXT,
  "color" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "usage_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- 套餐标签关联表
CREATE TABLE "plan_tags" (
  "id" TEXT NOT NULL,
  "plan_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,
  "added_by" TEXT,
  "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "plan_tags_pkey" PRIMARY KEY ("id")
);

-- 创建唯一索引
CREATE UNIQUE INDEX "tag_categories_code_key" ON "tag_categories"("code");
CREATE UNIQUE INDEX "tags_category_id_code_key" ON "tags"("category_id", "code");
CREATE UNIQUE INDEX "plan_tags_plan_id_tag_id_key" ON "plan_tags"("plan_id", "tag_id");

-- 创建常规索引
CREATE INDEX "tag_categories_is_active_order_idx" ON "tag_categories"("is_active", "order");
CREATE INDEX "tag_categories_show_in_filter_filter_order_idx" ON "tag_categories"("show_in_filter", "filter_order");
CREATE INDEX "tags_category_id_is_active_order_idx" ON "tags"("category_id", "is_active", "order");
CREATE INDEX "tags_usage_count_idx" ON "tags"("usage_count");
CREATE INDEX "plan_tags_plan_id_idx" ON "plan_tags"("plan_id");
CREATE INDEX "plan_tags_tag_id_idx" ON "plan_tags"("tag_id");

-- 添加外键约束
ALTER TABLE "tags" ADD CONSTRAINT "tags_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tag_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_tags" ADD CONSTRAINT "plan_tags_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "rental_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_tags" ADD CONSTRAINT "plan_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
