import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';

// Mock planService before importing the router
vi.mock('@/server/services/plan.service', () => ({
  planService: {
    getList: vi.fn(),
    getById: vi.fn(),
    getFeatured: vi.fn(),
  },
}));

import { planService } from '@/server/services/plan.service';
import { planRouter } from '../plan';

const mockPlanService = planService as {
  getList: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  getFeatured: ReturnType<typeof vi.fn>;
};

// Create a minimal caller for testing
const createCaller = () => {
  return planRouter.createCaller({} as any);
};

describe('planRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('calls planService.getList with input params', async () => {
      const mockResult = {
        plans: [{ id: '1', name: 'Plan A' }],
        total: 1,
        limit: 20,
        offset: 0,
      };
      mockPlanService.getList.mockResolvedValue(mockResult);

      const caller = createCaller();
      const result = await caller.list({
        theme: 'traditional',
        location: '京都',
        limit: 10,
        offset: 5,
      });

      expect(mockPlanService.getList).toHaveBeenCalledWith({
        theme: 'traditional',
        location: '京都',
        limit: 10,
        offset: 5,
      });
      expect(result).toEqual(mockResult);
    });

    it('uses default values for limit and offset', async () => {
      mockPlanService.getList.mockResolvedValue({
        plans: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      const caller = createCaller();
      await caller.list({});

      expect(mockPlanService.getList).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('getById', () => {
    it('returns plan when found', async () => {
      const mockPlan = {
        id: 'plan-123',
        name: 'Deluxe Plan',
        price: 15000,
      };
      mockPlanService.getById.mockResolvedValue(mockPlan);

      const caller = createCaller();
      const result = await caller.getById({ id: 'plan-123' });

      expect(mockPlanService.getById).toHaveBeenCalledWith('plan-123');
      expect(result).toEqual(mockPlan);
    });

    it('throws NOT_FOUND error when plan does not exist', async () => {
      mockPlanService.getById.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.getById({ id: 'non-existent' })).rejects.toThrow(
        TRPCError
      );

      try {
        await caller.getById({ id: 'non-existent' });
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('NOT_FOUND');
        expect((error as TRPCError).message).toBe('Plan not found');
      }
    });
  });

  describe('featured', () => {
    it('returns featured plans with default limit', async () => {
      const mockPlans = [
        { id: '1', name: 'Featured A', isFeatured: true },
        { id: '2', name: 'Featured B', isFeatured: true },
      ];
      mockPlanService.getFeatured.mockResolvedValue(mockPlans);

      const caller = createCaller();
      const result = await caller.featured();

      expect(mockPlanService.getFeatured).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockPlans);
    });

    it('respects custom limit parameter', async () => {
      mockPlanService.getFeatured.mockResolvedValue([]);

      const caller = createCaller();
      await caller.featured({ limit: 4 });

      expect(mockPlanService.getFeatured).toHaveBeenCalledWith(4);
    });
  });
});
