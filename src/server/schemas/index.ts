// 集中导出所有 Zod Schema
export {
  createPlanSchema,
  updatePlanSchema,
  planComponentSchema,
  planUpgradeSchema,
  type CreatePlanInput,
  type UpdatePlanInput,
  type PlanComponentInput,
  type PlanUpgradeInput,
} from './plan.schema';

export {
  createBookingSchema,
  type CreateBookingInput,
  type BookingItemInput,
} from './booking.schema';

export {
  createTagSchema,
  createTagCategorySchema,
  type CreateTagInput,
  type CreateTagCategoryInput,
} from './tag.schema';

export {
  merchantRegisterSchema,
  type MerchantRegisterInput,
} from './merchant.schema';

export {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
} from './auth.schema';

export {
  createCheckoutSchema,
  createRefundSchema,
  type CreateCheckoutInput,
  type CreateRefundInput,
} from './payment.schema';
