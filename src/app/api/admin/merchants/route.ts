import { NextRequest } from 'next/server';
import { createAdminClient } from '@/shared/lib/supabase/server';
import { requirePlatformAdmin } from '@/features/auth/services/permissions';
import { apiSuccess, apiCreated } from '@/shared/lib/api/response';
import { AppError } from '@/shared/lib/errors/AppError';
import { ErrorCode } from '@/shared/lib/errors/codes';
import { withErrorHandler, composeMiddleware } from '@/shared/lib/errors/handler';
import { withRateLimit } from '@/shared/lib/rate-limit';
import { createApiLogger } from '@/shared/lib/logger';
import { merchantCreateSchema, paginationSchema } from '@/shared/lib/validation/schemas';

// ============================================================================
// LOGGER
// ============================================================================

const logger = createApiLogger('/api/admin/merchants');

// ============================================================================
// GET /api/admin/merchants
// ============================================================================

/**
 * List all merchants (platform admin only)
 *
 * Features:
 * - Pagination with configurable page size
 * - Search by name, slug, or email
 * - Filter by is_active and is_platform_admin
 */
async function handleGet(request: NextRequest) {
  // Check platform admin permission
  const errorResponse = await requirePlatformAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  const timer = logger.startTimer();
  const adminClient = createAdminClient();

  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const isActive = searchParams.get('is_active');
  const isPlatformAdmin = searchParams.get('is_platform_admin');

  // Validate pagination params
  const paginationResult = paginationSchema.safeParse({
    page: searchParams.get('page') || '1',
    pageSize: searchParams.get('pageSize') || '20',
  });

  if (!paginationResult.success) {
    throw AppError.validation('Invalid pagination parameters', paginationResult.error.issues);
  }

  const { page, pageSize } = paginationResult.data;

  // Build query
  let query = adminClient.from('merchants').select('*', { count: 'exact' });

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%`);
  }

  // Apply is_active filter
  if (isActive !== null && isActive !== undefined && isActive !== '') {
    query = query.eq('is_active', isActive === 'true');
  }

  // Apply is_platform_admin filter
  if (isPlatformAdmin !== null && isPlatformAdmin !== undefined && isPlatformAdmin !== '') {
    query = query.eq('is_platform_admin', isPlatformAdmin === 'true');
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data: merchants, error, count } = await query;

  if (error) {
    logger.error('Database query failed', error, { search, isActive, isPlatformAdmin });
    throw AppError.internal('Failed to fetch merchants');
  }

  timer.done('Merchants listed', {
    count: merchants?.length,
    total: count,
  });

  return apiSuccess({
    data: merchants,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  });
}

// ============================================================================
// POST /api/admin/merchants
// ============================================================================

/**
 * Create a new merchant (platform admin only)
 *
 * 创建流程：
 * 1. 验证参数 (使用 Zod schema)
 * 2. 检查 slug/email 唯一性
 * 3. 创建 Supabase Auth 用户
 * 4. 创建 merchants 表记录并关联 auth_user_id
 * 5. 如果 merchant 创建失败，回滚删除 Auth 用户
 */
async function handlePost(request: NextRequest) {
  // Check platform admin permission
  const errorResponse = await requirePlatformAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  const timer = logger.startTimer();

  // Parse and validate request body
  const body = await request.json();
  const validationResult = merchantCreateSchema.safeParse(body);

  if (!validationResult.success) {
    throw AppError.validation('Invalid merchant data', validationResult.error.issues);
  }

  const {
    name,
    slug,
    email,
    password,
    theme_color,
    api_quota,
    is_active,
    is_platform_admin,
    use_default_library,
  } = validationResult.data;

  const adminClient = createAdminClient();

  // Check if slug already exists
  const { data: existingSlug } = await adminClient
    .from('merchants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existingSlug) {
    throw AppError.duplicate('Merchant', 'slug');
  }

  // Check if email already exists in merchants table
  const { data: existingEmail } = await adminClient
    .from('merchants')
    .select('id')
    .eq('email', email)
    .single();

  if (existingEmail) {
    throw AppError.duplicate('Merchant', 'email');
  }

  // Check if email already exists in Auth system
  const { data: authUsers } = await adminClient.auth.admin.listUsers();
  const existingAuthUser = authUsers?.users?.find(u => u.email === email);
  if (existingAuthUser) {
    throw new AppError(ErrorCode.DUPLICATE_RESOURCE, '该邮箱已在认证系统中注册', 409);
  }

  // Step 1: Create Auth user
  logger.debug('Creating auth user', { email });
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData?.user) {
    logger.error('Failed to create auth user', authError, { email });
    throw AppError.internal(`创建认证用户失败: ${authError?.message || 'Unknown error'}`);
  }

  const authUserId = authData.user.id;
  logger.debug('Auth user created', { authUserId });

  // Step 2: Create merchant with auth_user_id
  const { data: merchant, error: merchantError } = await adminClient
    .from('merchants')
    .insert({
      name,
      slug,
      email,
      auth_user_id: authUserId,
      theme_color: theme_color || '#ec4899',
      api_quota: api_quota || 1000,
      is_active: is_active !== false,
      is_platform_admin: is_platform_admin === true,
      use_default_library: use_default_library !== false,
    })
    .select()
    .single();

  if (merchantError) {
    // Rollback: Delete the auth user we just created
    logger.warn('Merchant creation failed, rolling back auth user', { authUserId });
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(authUserId);
    if (deleteError) {
      logger.error('Failed to rollback auth user', deleteError, { authUserId });
    }

    logger.error('Failed to create merchant', merchantError, { slug, email });
    throw AppError.internal(`创建商户记录失败: ${merchantError.message}`);
  }

  timer.done('Merchant created', {
    merchantId: merchant.id,
    slug: merchant.slug,
  });

  return apiCreated(merchant);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Apply middleware: rate limiting + error handling
export const GET = composeMiddleware(withRateLimit, withErrorHandler)(handleGet);

export const POST = composeMiddleware(withRateLimit, withErrorHandler)(handlePost);
