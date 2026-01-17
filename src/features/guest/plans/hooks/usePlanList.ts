'use client';

import { trpc } from '@/shared/api/trpc';

export interface UsePlanListParams {
  theme?: string | null;
  storeId?: string | null;
  location?: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Hook for fetching a list of plans with optional filters
 * Uses tRPC for type-safe API calls with React Query caching
 */
export function usePlanList(params: UsePlanListParams = {}) {
  return trpc.plan.list.useQuery({
    theme: params.theme ?? undefined,
    storeId: params.storeId ?? undefined,
    location: params.location ?? undefined,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
}

/**
 * Hook for fetching featured plans for homepage display
 */
export function useFeaturedPlans(limit = 8) {
  return trpc.plan.featured.useQuery({ limit });
}
