import { z } from 'zod';

// ========== 子 schema ==========

// 套餐组件配置（v10.1 - 使用 merchantComponentId）
export const planComponentSchema = z.object({
  merchantComponentId: z.string(),
  hotmapX: z.number().min(0).max(1).optional().nullable(),
  hotmapY: z.number().min(0).max(1).optional().nullable(),
  hotmapLabelPosition: z.enum(['left', 'right']).optional().default('right'),
  hotmapLabelOffsetX: z.number().optional().nullable(),
  hotmapLabelOffsetY: z.number().optional().nullable(),
  hotmapOrder: z.number().int().optional().default(0),
});

// 升级服务配置
export const planUpgradeSchema = z.object({
  merchantComponentId: z.string(),
  priceOverride: z.number().int().positive().optional().nullable(),
  isPopular: z.boolean().optional().default(false),
  displayOrder: z.number().int().optional().default(0),
});

// ========== 共享字段 ==========

// 价格字段（create 和 update 共用）
const priceFields = {
  price: z.number().int().positive('价格必须大于0'),
  originalPrice: z.number().int().positive().optional().nullable(),
  depositAmount: z.number().int().nonnegative('押金不能为负数').default(0),
} as const;

// 图片字段
const imageFields = {
  imageUrl: z.union([z.string().url(), z.literal('')]).optional().nullable().transform(val => val || null),
  images: z.array(z.string().url()).max(20, '最多上传20张图片').optional().default([]),
} as const;

// ========== 创建套餐 ==========

export const createPlanSchema = z.object({
  name: z.string().min(1, '套餐名称不能为空'),
  description: z.string().min(10, '描述至少需要10个字符'),
  ...priceFields,
  duration: z.number().int().positive('时长必须大于0'),
  ...imageFields,
  storeName: z.string().optional().nullable().transform(val => val || ''),
  region: z.string().optional().nullable().transform(val => val || ''),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  availableFrom: z.union([z.string().datetime(), z.literal('')]).optional().nullable().transform(val => val || ''),
  availableUntil: z.union([z.string().datetime(), z.literal('')]).optional().nullable().transform(val => val || ''),
});

// ========== 更新套餐（完整版 v10.2） ==========

export const updatePlanSchema = z.object({
  // 基本信息
  name: z.string().min(1, '套餐名称不能为空'),
  description: z.string().min(10, '描述至少需要10个字符'),
  highlights: z.string().optional().nullable(),

  // 价格信息
  ...priceFields,

  // 计价单位
  pricingUnit: z.enum(['person', 'group']).optional().default('person'),
  unitLabel: z.string().optional().default('人'),
  unitDescription: z.string().optional().nullable(),
  minQuantity: z.number().int().min(1).optional().default(1),
  maxQuantity: z.number().int().min(1).optional().default(10),

  // 时长
  duration: z.number().int().positive().optional(),

  // 组件配置
  merchantComponentIds: z.array(z.string()).max(50).optional(),
  planComponents: z.array(planComponentSchema).max(50).optional(),

  // 升级服务
  planUpgrades: z.array(planUpgradeSchema).max(20).optional(),

  // 图片
  ...imageFields,
  customMapImageUrl: z.union([z.string().url(), z.literal('')]).optional().nullable().transform(val => val || null),

  // 店铺和地区
  storeName: z.string().optional().nullable(),
  region: z.string().optional().nullable(),

  // 主题和标签
  themeId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).max(30).optional(),

  // 时间限制
  availableFrom: z.string().datetime().optional().nullable(),
  availableUntil: z.string().datetime().optional().nullable(),

  // 状态
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean().optional().default(false),
});

// ========== 类型导出 ==========

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type PlanComponentInput = z.infer<typeof planComponentSchema>;
export type PlanUpgradeInput = z.infer<typeof planUpgradeSchema>;
