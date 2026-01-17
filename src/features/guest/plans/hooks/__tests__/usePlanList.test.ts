/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock useQuery result
const mockUseQuery = vi.fn();

// Track the parameters passed to useQuery
let lastListQueryInput: unknown = null;
let lastFeaturedQueryInput: unknown = null;

// Mock the tRPC client before importing the hooks
vi.mock('@/shared/api/trpc', () => ({
  trpc: {
    plan: {
      list: {
        useQuery: (input: unknown) => {
          lastListQueryInput = input;
          return mockUseQuery(input);
        },
      },
      featured: {
        useQuery: (input: unknown) => {
          lastFeaturedQueryInput = input;
          return mockUseQuery(input);
        },
      },
    },
  },
}));

import { usePlanList, useFeaturedPlans } from '../usePlanList';

describe('usePlanList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastListQueryInput = null;
    lastFeaturedQueryInput = null;
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
  });

  describe('parameter handling', () => {
    it('calls trpc.plan.list.useQuery with default parameters when no params provided', () => {
      renderHook(() => usePlanList());

      expect(lastListQueryInput).toEqual({
        theme: undefined,
        storeId: undefined,
        location: undefined,
        limit: 20,
        offset: 0,
      });
    });

    it('uses default limit of 20', () => {
      renderHook(() => usePlanList({}));

      expect(lastListQueryInput).toMatchObject({
        limit: 20,
      });
    });

    it('uses default offset of 0', () => {
      renderHook(() => usePlanList({}));

      expect(lastListQueryInput).toMatchObject({
        offset: 0,
      });
    });

    it('passes custom limit parameter', () => {
      renderHook(() => usePlanList({ limit: 50 }));

      expect(lastListQueryInput).toMatchObject({
        limit: 50,
      });
    });

    it('passes custom offset parameter', () => {
      renderHook(() => usePlanList({ offset: 10 }));

      expect(lastListQueryInput).toMatchObject({
        offset: 10,
      });
    });
  });

  describe('filter handling', () => {
    it('passes theme filter when provided', () => {
      renderHook(() => usePlanList({ theme: 'traditional' }));

      expect(lastListQueryInput).toMatchObject({
        theme: 'traditional',
      });
    });

    it('passes storeId filter when provided', () => {
      renderHook(() => usePlanList({ storeId: 'store-123' }));

      expect(lastListQueryInput).toMatchObject({
        storeId: 'store-123',
      });
    });

    it('passes location filter when provided', () => {
      renderHook(() => usePlanList({ location: '京都' }));

      expect(lastListQueryInput).toMatchObject({
        location: '京都',
      });
    });

    it('passes all filters together with pagination', () => {
      renderHook(() =>
        usePlanList({
          theme: 'modern',
          storeId: 'store-456',
          location: '東京',
          limit: 30,
          offset: 15,
        })
      );

      expect(lastListQueryInput).toEqual({
        theme: 'modern',
        storeId: 'store-456',
        location: '東京',
        limit: 30,
        offset: 15,
      });
    });
  });

  describe('null value handling', () => {
    it('converts null theme to undefined', () => {
      renderHook(() => usePlanList({ theme: null }));

      expect(lastListQueryInput).toMatchObject({
        theme: undefined,
      });
    });

    it('converts null storeId to undefined', () => {
      renderHook(() => usePlanList({ storeId: null }));

      expect(lastListQueryInput).toMatchObject({
        storeId: undefined,
      });
    });

    it('converts null location to undefined', () => {
      renderHook(() => usePlanList({ location: null }));

      expect(lastListQueryInput).toMatchObject({
        location: undefined,
      });
    });

    it('converts all null filters to undefined', () => {
      renderHook(() =>
        usePlanList({
          theme: null,
          storeId: null,
          location: null,
        })
      );

      expect(lastListQueryInput).toEqual({
        theme: undefined,
        storeId: undefined,
        location: undefined,
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('return value', () => {
    it('returns the useQuery result object', () => {
      const mockResult = {
        data: { plans: [{ id: '1', name: 'Test Plan' }], total: 1 },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
      mockUseQuery.mockReturnValue(mockResult);

      const { result } = renderHook(() => usePlanList());

      expect(result.current).toBe(mockResult);
    });

    it('returns loading state when query is in progress', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => usePlanList());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('returns error state when query fails', () => {
      const mockError = new Error('Network error');
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => usePlanList());

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useFeaturedPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastListQueryInput = null;
    lastFeaturedQueryInput = null;
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
  });

  describe('parameter handling', () => {
    it('calls trpc.plan.featured.useQuery with default limit of 8', () => {
      renderHook(() => useFeaturedPlans());

      expect(lastFeaturedQueryInput).toEqual({ limit: 8 });
    });

    it('passes custom limit parameter', () => {
      renderHook(() => useFeaturedPlans(12));

      expect(lastFeaturedQueryInput).toEqual({ limit: 12 });
    });

    it('accepts limit of 1', () => {
      renderHook(() => useFeaturedPlans(1));

      expect(lastFeaturedQueryInput).toEqual({ limit: 1 });
    });

    it('accepts larger limit values', () => {
      renderHook(() => useFeaturedPlans(100));

      expect(lastFeaturedQueryInput).toEqual({ limit: 100 });
    });
  });

  describe('return value', () => {
    it('returns the useQuery result object', () => {
      const mockResult = {
        data: [
          { id: '1', name: 'Featured Plan A', isFeatured: true },
          { id: '2', name: 'Featured Plan B', isFeatured: true },
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
      mockUseQuery.mockReturnValue(mockResult);

      const { result } = renderHook(() => useFeaturedPlans());

      expect(result.current).toBe(mockResult);
    });

    it('returns loading state when query is in progress', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useFeaturedPlans());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('returns error state when query fails', () => {
      const mockError = new Error('Failed to fetch featured plans');
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useFeaturedPlans());

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
