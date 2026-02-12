import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTryOnStore, type TryOnResult } from '../tryOn';

// 辅助函数
function makeResult(overrides: Partial<TryOnResult> = {}): TryOnResult {
  return {
    planId: 'plan-1',
    planName: '经典和服',
    planImageUrl: '/img/plan1.jpg',
    resultPhoto: '/result/photo1.jpg',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('useTryOnStore', () => {
  beforeEach(() => {
    useTryOnStore.setState({ tryOnCache: {} });
  });

  // ==================== addTryOnResult ====================
  describe('addTryOnResult', () => {
    it('添加试穿结果', () => {
      useTryOnStore.getState().addTryOnResult(makeResult());

      const result = useTryOnStore.getState().tryOnCache['plan-1'];
      expect(result).toBeDefined();
      expect(result.planName).toBe('经典和服');
    });

    it('同一 planId 覆盖旧结果', () => {
      useTryOnStore.getState().addTryOnResult(makeResult({ resultPhoto: '/old.jpg' }));
      useTryOnStore.getState().addTryOnResult(makeResult({ resultPhoto: '/new.jpg' }));

      expect(useTryOnStore.getState().tryOnCache['plan-1'].resultPhoto).toBe('/new.jpg');
      expect(Object.keys(useTryOnStore.getState().tryOnCache)).toHaveLength(1);
    });

    it('超过 10 条时删除最老的记录', () => {
      // 添加 10 条记录
      for (let i = 0; i < 10; i++) {
        useTryOnStore.getState().addTryOnResult(
          makeResult({ planId: `plan-${i}`, timestamp: 1000 + i })
        );
      }
      expect(Object.keys(useTryOnStore.getState().tryOnCache)).toHaveLength(10);

      // 添加第 11 条，应该删除 timestamp 最小的（plan-0）
      useTryOnStore.getState().addTryOnResult(
        makeResult({ planId: 'plan-new', timestamp: 2000 })
      );

      const cache = useTryOnStore.getState().tryOnCache;
      expect(Object.keys(cache)).toHaveLength(10);
      expect(cache['plan-0']).toBeUndefined();
      expect(cache['plan-new']).toBeDefined();
    });

    it('更新已有 planId 不触发删除（不超过限制）', () => {
      for (let i = 0; i < 10; i++) {
        useTryOnStore.getState().addTryOnResult(
          makeResult({ planId: `plan-${i}`, timestamp: 1000 + i })
        );
      }

      // 更新已存在的 plan-5，不应删除其他记录
      useTryOnStore.getState().addTryOnResult(
        makeResult({ planId: 'plan-5', timestamp: 9999 })
      );

      expect(Object.keys(useTryOnStore.getState().tryOnCache)).toHaveLength(10);
      expect(useTryOnStore.getState().tryOnCache['plan-0']).toBeDefined();
    });
  });

  // ==================== getTryOnResult ====================
  describe('getTryOnResult', () => {
    it('获取存在的结果', () => {
      useTryOnStore.getState().addTryOnResult(makeResult());

      const result = useTryOnStore.getState().getTryOnResult('plan-1');
      expect(result).not.toBeNull();
      expect(result!.planName).toBe('经典和服');
    });

    it('不存在时返回 null', () => {
      expect(useTryOnStore.getState().getTryOnResult('non-existent')).toBeNull();
    });
  });

  // ==================== removeTryOnResult ====================
  describe('removeTryOnResult', () => {
    it('删除指定试穿结果', () => {
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'plan-1' }));
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'plan-2' }));

      useTryOnStore.getState().removeTryOnResult('plan-1');

      expect(useTryOnStore.getState().tryOnCache['plan-1']).toBeUndefined();
      expect(useTryOnStore.getState().tryOnCache['plan-2']).toBeDefined();
    });
  });

  // ==================== clearAllTryOns ====================
  describe('clearAllTryOns', () => {
    it('清空所有缓存', () => {
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'plan-1' }));
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'plan-2' }));

      useTryOnStore.getState().clearAllTryOns();

      expect(useTryOnStore.getState().tryOnCache).toEqual({});
    });
  });

  // ==================== clearExpiredTryOns ====================
  describe('clearExpiredTryOns', () => {
    it('清理 30 天前的过期记录', () => {
      const now = Date.now();
      const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'expired', timestamp: thirtyOneDaysAgo }));
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'valid', timestamp: tenDaysAgo }));

      useTryOnStore.getState().clearExpiredTryOns();

      const cache = useTryOnStore.getState().tryOnCache;
      expect(cache['expired']).toBeUndefined();
      expect(cache['valid']).toBeDefined();
    });

    it('全部未过期时不删除', () => {
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'p1', timestamp: Date.now() }));
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'p2', timestamp: Date.now() }));

      useTryOnStore.getState().clearExpiredTryOns();

      expect(Object.keys(useTryOnStore.getState().tryOnCache)).toHaveLength(2);
    });

    it('全部过期时清空', () => {
      const oldTimestamp = Date.now() - 60 * 24 * 60 * 60 * 1000; // 60 天前
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'p1', timestamp: oldTimestamp }));
      useTryOnStore.getState().addTryOnResult(makeResult({ planId: 'p2', timestamp: oldTimestamp }));

      useTryOnStore.getState().clearExpiredTryOns();

      expect(useTryOnStore.getState().tryOnCache).toEqual({});
    });
  });
});
