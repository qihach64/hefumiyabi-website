/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock useQuery result
const mockUseQuery = vi.fn();

// Track the parameters passed to useQuery
let lastQueryInput: unknown = null;
let lastQueryOptions: unknown = null;

// Mock the tRPC client before importing the hook
vi.mock('@/shared/api/trpc', () => ({
  trpc: {
    plan: {
      getById: {
        useQuery: (input: unknown, options: unknown) => {
          lastQueryInput = input;
          lastQueryOptions = options;
          return mockUseQuery(input, options);
        },
      },
    },
  },
}));

import { usePlanDetail } from '../usePlanDetail';

describe('usePlanDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastQueryInput = null;
    lastQueryOptions = null;
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
  });

  describe('parameter handling', () => {
    it('calls trpc.plan.getById.useQuery with correct id parameter', () => {
      const testId = 'plan-123';
      renderHook(() => usePlanDetail(testId));

      expect(lastQueryInput).toEqual({ id: testId });
    });

    it('passes the id to the query input', () => {
      const testId = 'plan-abc-456';
      renderHook(() => usePlanDetail(testId));

      expect(lastQueryInput).toEqual({ id: 'plan-abc-456' });
    });

    it('handles different id formats correctly', () => {
      const uuidId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      renderHook(() => usePlanDetail(uuidId));

      expect(lastQueryInput).toEqual({ id: uuidId });
    });
  });

  describe('enabled state handling', () => {
    it('is disabled when id is undefined', () => {
      renderHook(() => usePlanDetail(undefined));

      expect(lastQueryOptions).toMatchObject({ enabled: false });
    });

    it('is enabled when id is provided', () => {
      renderHook(() => usePlanDetail('plan-123'));

      expect(lastQueryOptions).toMatchObject({ enabled: true });
    });

    it('is disabled when id is an empty string (falsy value)', () => {
      renderHook(() => usePlanDetail(''));

      expect(lastQueryOptions).toMatchObject({ enabled: false });
    });

    it('is enabled when id is a non-empty string', () => {
      renderHook(() => usePlanDetail('any-valid-id'));

      expect(lastQueryOptions).toMatchObject({ enabled: true });
    });
  });

  describe('return value', () => {
    it('returns the useQuery result object', () => {
      const mockPlanData = {
        id: 'plan-123',
        name: '経典女士套餐',
        price: 880000,
        duration: 4,
        includes: ['和服租赁', '专业着装', '发型设计'],
        category: 'LADIES',
        isActive: true,
        isCampaign: false,
        isFeatured: true,
      };
      const mockResult = {
        data: mockPlanData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isSuccess: true,
      };
      mockUseQuery.mockReturnValue(mockResult);

      const { result } = renderHook(() => usePlanDetail('plan-123'));

      expect(result.current).toBe(mockResult);
    });

    it('returns loading state when query is in progress', () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isSuccess: false,
      });

      const { result } = renderHook(() => usePlanDetail('plan-123'));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it('returns error state when query fails', () => {
      const mockError = new Error('Plan not found');
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        isSuccess: false,
      });

      const { result } = renderHook(() => usePlanDetail('non-existent-plan'));

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('returns success state with data when query succeeds', () => {
      const mockPlanData = {
        id: 'plan-456',
        name: '情侣套餐',
        price: 1500000,
        pricingUnit: 'group',
        unitLabel: '組',
        unitDescription: '2人',
      };
      mockUseQuery.mockReturnValue({
        data: mockPlanData,
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      const { result } = renderHook(() => usePlanDetail('plan-456'));

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBe(mockPlanData);
      expect(result.current.error).toBeNull();
    });
  });

  describe('query behavior when id changes', () => {
    it('updates query input when id changes', () => {
      const { rerender } = renderHook(
        ({ id }) => usePlanDetail(id),
        { initialProps: { id: 'plan-1' as string | undefined } }
      );

      expect(lastQueryInput).toEqual({ id: 'plan-1' });

      rerender({ id: 'plan-2' });

      expect(lastQueryInput).toEqual({ id: 'plan-2' });
    });

    it('disables query when id becomes undefined', () => {
      const { rerender } = renderHook(
        ({ id }) => usePlanDetail(id),
        { initialProps: { id: 'plan-1' as string | undefined } }
      );

      expect(lastQueryOptions).toMatchObject({ enabled: true });

      rerender({ id: undefined });

      expect(lastQueryOptions).toMatchObject({ enabled: false });
    });

    it('enables query when id is provided after being undefined', () => {
      const { rerender } = renderHook(
        ({ id }) => usePlanDetail(id),
        { initialProps: { id: undefined as string | undefined } }
      );

      expect(lastQueryOptions).toMatchObject({ enabled: false });

      rerender({ id: 'plan-new' });

      expect(lastQueryOptions).toMatchObject({ enabled: true });
      expect(lastQueryInput).toEqual({ id: 'plan-new' });
    });
  });
});
