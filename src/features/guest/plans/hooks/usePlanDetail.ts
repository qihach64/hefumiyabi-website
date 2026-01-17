'use client';

import { trpc } from '@/shared/api/trpc';

/**
 * Hook for fetching a single plan's details by ID
 * Uses tRPC for type-safe API calls with React Query caching
 *
 * @param id - The plan ID to fetch. Query is disabled if undefined.
 */
export function usePlanDetail(id: string | undefined) {
  return trpc.plan.getById.useQuery(
    { id: id! },
    { enabled: !!id }
  );
}
