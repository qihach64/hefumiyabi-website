import { describe, it, expect } from 'vitest';

import { healthRouter } from '../health';

const createCaller = () => healthRouter.createCaller({} as any);

describe('healthRouter', () => {
  describe('check', () => {
    it('返回 ok 状态和时间戳', async () => {
      const caller = createCaller();
      const result = await caller.check();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      // 验证时间戳是有效的 ISO 格式
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });
});
