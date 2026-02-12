import { describe, it, expect, beforeEach } from 'vitest';
import {
  usePlanDraftStore,
  defaultFormData,
  type PlanFormData,
  type ComponentConfig,
  type UpgradeConfig,
} from '../planDraft';

// 辅助函数
function makeFormData(overrides: Partial<PlanFormData> = {}): PlanFormData {
  return { ...defaultFormData, ...overrides };
}

function makeComponentConfigs(): ComponentConfig[] {
  return [{ merchantComponentId: 'comp-1' }];
}

function makeUpgradeConfigs(): UpgradeConfig[] {
  return [{ merchantComponentId: 'upgrade-1', priceOverride: null, isPopular: false, displayOrder: 0 }];
}

describe('usePlanDraftStore', () => {
  beforeEach(() => {
    usePlanDraftStore.setState({ drafts: {} });
  });

  // ==================== saveDraft ====================
  describe('saveDraft', () => {
    it('保存草稿', () => {
      const formData = makeFormData({ name: '测试套餐' });
      usePlanDraftStore.getState().saveDraft('plan-1', formData, makeComponentConfigs(), ['comp-1']);

      const draft = usePlanDraftStore.getState().drafts['plan-1'];
      expect(draft).toBeDefined();
      expect(draft.formData.name).toBe('测试套餐');
      expect(draft.isDirty).toBe(false);
      expect(draft.lastSaved).toBeDefined();
    });

    it('保存时包含升级服务配置', () => {
      usePlanDraftStore.getState().saveDraft(
        'plan-1', makeFormData(), makeComponentConfigs(), ['comp-1'], makeUpgradeConfigs()
      );

      const draft = usePlanDraftStore.getState().drafts['plan-1'];
      expect(draft.upgradeConfigs).toHaveLength(1);
      expect(draft.upgradeConfigs[0].merchantComponentId).toBe('upgrade-1');
    });

    it('不传 upgradeConfigs 默认为空数组', () => {
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData(), [], []);

      expect(usePlanDraftStore.getState().drafts['plan-1'].upgradeConfigs).toEqual([]);
    });

    it('覆盖已有草稿', () => {
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData({ name: 'v1' }), [], []);
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData({ name: 'v2' }), [], []);

      expect(usePlanDraftStore.getState().drafts['plan-1'].formData.name).toBe('v2');
    });
  });

  // ==================== getDraft ====================
  describe('getDraft', () => {
    it('获取已有草稿', () => {
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData({ name: '和服A' }), [], []);

      const draft = usePlanDraftStore.getState().getDraft('plan-1');
      expect(draft).not.toBeNull();
      expect(draft!.formData.name).toBe('和服A');
    });

    it('不存在时返回 null', () => {
      expect(usePlanDraftStore.getState().getDraft('non-existent')).toBeNull();
    });
  });

  // ==================== clearDraft ====================
  describe('clearDraft', () => {
    it('清除指定草稿', () => {
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData(), [], []);
      usePlanDraftStore.getState().saveDraft('plan-2', makeFormData(), [], []);

      usePlanDraftStore.getState().clearDraft('plan-1');

      expect(usePlanDraftStore.getState().getDraft('plan-1')).toBeNull();
      expect(usePlanDraftStore.getState().getDraft('plan-2')).not.toBeNull();
    });

    it('清除不存在的草稿不报错', () => {
      usePlanDraftStore.getState().clearDraft('non-existent');
      expect(usePlanDraftStore.getState().drafts).toEqual({});
    });
  });

  // ==================== markDirty ====================
  describe('markDirty', () => {
    it('标记为脏', () => {
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData(), [], []);
      expect(usePlanDraftStore.getState().drafts['plan-1'].isDirty).toBe(false);

      usePlanDraftStore.getState().markDirty('plan-1');
      expect(usePlanDraftStore.getState().drafts['plan-1'].isDirty).toBe(true);
    });

    it('不存在的草稿不报错', () => {
      usePlanDraftStore.getState().markDirty('non-existent');
      expect(usePlanDraftStore.getState().drafts).toEqual({});
    });
  });

  // ==================== markSaved ====================
  describe('markSaved', () => {
    it('标记为已保存，isDirty 变 false，lastSaved 更新', () => {
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData(), [], []);

      usePlanDraftStore.getState().markDirty('plan-1');
      expect(usePlanDraftStore.getState().drafts['plan-1'].isDirty).toBe(true);

      usePlanDraftStore.getState().markSaved('plan-1');

      const draft = usePlanDraftStore.getState().drafts['plan-1'];
      expect(draft.isDirty).toBe(false);
      expect(draft.lastSaved).toBeDefined();
    });

    it('不存在的草稿不报错', () => {
      usePlanDraftStore.getState().markSaved('non-existent');
      expect(usePlanDraftStore.getState().drafts).toEqual({});
    });
  });

  // ==================== hasDraft ====================
  describe('hasDraft', () => {
    it('有草稿返回 true', () => {
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData(), [], []);
      expect(usePlanDraftStore.getState().hasDraft('plan-1')).toBe(true);
    });

    it('无草稿返回 false', () => {
      expect(usePlanDraftStore.getState().hasDraft('plan-1')).toBe(false);
    });
  });

  // ==================== getLastSaved ====================
  describe('getLastSaved', () => {
    it('返回 Date 对象', () => {
      usePlanDraftStore.getState().saveDraft('plan-1', makeFormData(), [], []);

      const lastSaved = usePlanDraftStore.getState().getLastSaved('plan-1');
      expect(lastSaved).toBeInstanceOf(Date);
    });

    it('无草稿返回 null', () => {
      expect(usePlanDraftStore.getState().getLastSaved('non-existent')).toBeNull();
    });
  });

  // ==================== 多 planId 独立存储 ====================
  describe('多 planId 独立存储', () => {
    it('不同 planId 的草稿互不影响', () => {
      usePlanDraftStore.getState().saveDraft('plan-A', makeFormData({ name: '套餐A' }), [], []);
      usePlanDraftStore.getState().saveDraft('plan-B', makeFormData({ name: '套餐B' }), [], []);

      usePlanDraftStore.getState().markDirty('plan-A');

      expect(usePlanDraftStore.getState().drafts['plan-A'].isDirty).toBe(true);
      expect(usePlanDraftStore.getState().drafts['plan-B'].isDirty).toBe(false);

      usePlanDraftStore.getState().clearDraft('plan-A');
      expect(usePlanDraftStore.getState().getDraft('plan-A')).toBeNull();
      expect(usePlanDraftStore.getState().getDraft('plan-B')).not.toBeNull();
    });
  });
});
