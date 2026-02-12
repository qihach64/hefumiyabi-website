import { z } from 'zod';

// 创建标签
export const createTagSchema = z.object({
  categoryId: z.string().min(1, '分类ID不能为空'),
  code: z.string().min(1, '标签代码不能为空').max(50),
  name: z.string().min(1, '标签名称不能为空').max(50),
  nameEn: z.string().max(50).optional(),
  icon: z.string().max(20).optional(),
  color: z.string().max(20).optional(),
  order: z.number().int().nonnegative().optional().default(0),
});

// 创建标签分类
export const createTagCategorySchema = z.object({
  code: z.string().min(1, '分类代码不能为空').max(50),
  name: z.string().min(1, '分类名称不能为空').max(50),
  nameEn: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  icon: z.string().max(20).optional(),
  color: z.string().max(20).optional(),
  order: z.number().int().nonnegative().optional().default(0),
  showInFilter: z.boolean().optional().default(true),
  filterOrder: z.number().int().nonnegative().optional().default(0),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateTagCategoryInput = z.infer<typeof createTagCategorySchema>;
