import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { createTagSchema, createTagCategorySchema } from '@/server/schemas';
import { tagService } from '@/server/services/tag.service';

export const tagRouter = router({
  // ========== 标签 ==========
  list: adminProcedure
    .input(z.object({ categoryId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return tagService.listTags(ctx.prisma, input?.categoryId);
    }),

  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return tagService.getTag(ctx.prisma, input.id);
    }),

  create: adminProcedure
    .input(createTagSchema)
    .mutation(async ({ ctx, input }) => {
      return tagService.createTag(ctx.prisma, input);
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        code: z.string().optional(),
        name: z.string().optional(),
        nameEn: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        order: z.number().int().optional(),
        isActive: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return tagService.updateTag(ctx.prisma, input.id, input.data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await tagService.deleteTag(ctx.prisma, input.id);
      return { success: true };
    }),

  // ========== 标签分类 ==========
  category: router({
    list: adminProcedure.query(async ({ ctx }) => {
      return tagService.listCategories(ctx.prisma);
    }),

    get: adminProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return tagService.getCategory(ctx.prisma, input.id);
      }),

    create: adminProcedure
      .input(createTagCategorySchema)
      .mutation(async ({ ctx, input }) => {
        return tagService.createCategory(ctx.prisma, input);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          code: z.string().optional(),
          name: z.string().optional(),
          nameEn: z.string().optional(),
          description: z.string().optional(),
          icon: z.string().optional(),
          color: z.string().optional(),
          order: z.number().int().optional(),
          isActive: z.boolean().optional(),
          showInFilter: z.boolean().optional(),
          filterOrder: z.number().int().optional(),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        return tagService.updateCategory(ctx.prisma, input.id, input.data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await tagService.deleteCategory(ctx.prisma, input.id);
        return { success: true };
      }),
  }),
});
