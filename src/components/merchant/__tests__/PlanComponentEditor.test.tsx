/**
 * @vitest-environment jsdom
 *
 * 测试 PlanComponentEditor 的热点显示逻辑
 */
import { describe, it, expect, vi } from 'vitest';

// 类型定义
interface ComponentConfig {
  componentId: string;
  isIncluded: boolean;
  enabledUpgrades: string[];
  hotmapX?: number | null;
  hotmapY?: number | null;
  hotmapLabelPosition?: string;
}

interface ServiceComponent {
  id: string;
  type: string;
  name: string;
  icon: string | null;
}

// 模拟 PlanComponentEditor 中的核心逻辑函数
describe('PlanComponentEditor 热点显示逻辑', () => {
  // 模拟 getAllComponents 返回的数据
  const mockComponents: ServiceComponent[] = [
    { id: 'comp-1', type: 'OUTFIT', name: '基础和服', icon: '👘' },
    { id: 'comp-2', type: 'OUTFIT', name: '基础腰带', icon: '🎀' },
    { id: 'comp-3', type: 'ADDON', name: '基础跟拍', icon: '📷' },
    { id: 'comp-4', type: 'KIMONO', name: '振袖', icon: '👘' }, // 旧类型
  ];

  // 复制自 PlanComponentEditor 的核心逻辑
  const getAllComponents = () => mockComponents;

  const isHotmapEligible = (componentId: string): boolean => {
    const component = getAllComponents().find(c => c.id === componentId);
    // 如果组件数据还没加载完，假设已有坐标的组件是可放置的
    if (!component) return true;
    const hotmapTypes = ['OUTFIT', 'KIMONO', 'STYLING', 'ACCESSORY'];
    return hotmapTypes.includes(component.type);
  };

  const isHotmapEligibleStrict = (componentId: string): boolean => {
    const component = getAllComponents().find(c => c.id === componentId);
    if (!component) return false;
    const hotmapTypes = ['OUTFIT', 'KIMONO', 'STYLING', 'ACCESSORY'];
    return hotmapTypes.includes(component.type);
  };

  const getConfig = (configs: ComponentConfig[], componentId: string) => {
    return configs.find((c) => c.componentId === componentId);
  };

  const isPlacedOnMap = (configs: ComponentConfig[], componentId: string): boolean => {
    const config = getConfig(configs, componentId);
    return config?.hotmapX != null && config?.hotmapY != null;
  };

  // 获取已放置到图片上的组件
  const getPlacedComponents = (configs: ComponentConfig[], selectedComponentIds: string[]) => {
    return configs.filter(c =>
      c.hotmapX != null &&
      c.hotmapY != null &&
      selectedComponentIds.includes(c.componentId)
    );
  };

  // 获取未放置的组件
  const getUnplacedComponents = (configs: ComponentConfig[], selectedComponentIds: string[]) => {
    return selectedComponentIds.filter(id =>
      isHotmapEligibleStrict(id) && !isPlacedOnMap(configs, id)
    );
  };

  describe('isHotmapEligible', () => {
    it('OUTFIT 类型组件应该可以放置在热图上', () => {
      expect(isHotmapEligible('comp-1')).toBe(true);
      expect(isHotmapEligible('comp-2')).toBe(true);
    });

    it('ADDON 类型组件不应该可以放置在热图上', () => {
      expect(isHotmapEligible('comp-3')).toBe(false);
    });

    it('旧类型 KIMONO 应该可以放置在热图上（兼容）', () => {
      expect(isHotmapEligible('comp-4')).toBe(true);
    });

    it('未知组件（数据未加载）应该返回 true（宽松检查）', () => {
      expect(isHotmapEligible('unknown-id')).toBe(true);
    });
  });

  describe('isHotmapEligibleStrict', () => {
    it('未知组件应该返回 false（严格检查）', () => {
      expect(isHotmapEligibleStrict('unknown-id')).toBe(false);
    });

    it('OUTFIT 类型应该返回 true', () => {
      expect(isHotmapEligibleStrict('comp-1')).toBe(true);
    });

    it('ADDON 类型应该返回 false', () => {
      expect(isHotmapEligibleStrict('comp-3')).toBe(false);
    });
  });

  describe('getPlacedComponents', () => {
    it('应该返回有坐标且被选中的组件', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'comp-1', isIncluded: true, enabledUpgrades: [], hotmapX: 0.3, hotmapY: 0.4 },
        { componentId: 'comp-2', isIncluded: true, enabledUpgrades: [], hotmapX: 0.5, hotmapY: 0.5 },
        { componentId: 'comp-3', isIncluded: true, enabledUpgrades: [], hotmapX: null, hotmapY: null },
      ];
      const selectedIds = ['comp-1', 'comp-2', 'comp-3'];

      const placed = getPlacedComponents(configs, selectedIds);

      expect(placed).toHaveLength(2);
      expect(placed.map(c => c.componentId)).toContain('comp-1');
      expect(placed.map(c => c.componentId)).toContain('comp-2');
      expect(placed.map(c => c.componentId)).not.toContain('comp-3');
    });

    it('未选中的组件不应该在已放置列表中', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'comp-1', isIncluded: true, enabledUpgrades: [], hotmapX: 0.3, hotmapY: 0.4 },
        { componentId: 'comp-2', isIncluded: true, enabledUpgrades: [], hotmapX: 0.5, hotmapY: 0.5 },
      ];
      const selectedIds = ['comp-1']; // 只选中 comp-1

      const placed = getPlacedComponents(configs, selectedIds);

      expect(placed).toHaveLength(1);
      expect(placed[0].componentId).toBe('comp-1');
    });

    it('即使组件数据未加载，有坐标的组件也应该在已放置列表中', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'unknown-comp', isIncluded: true, enabledUpgrades: [], hotmapX: 0.3, hotmapY: 0.4 },
      ];
      const selectedIds = ['unknown-comp'];

      const placed = getPlacedComponents(configs, selectedIds);

      // 关键测试：即使 unknown-comp 不在 mockComponents 中，也应该返回
      expect(placed).toHaveLength(1);
      expect(placed[0].componentId).toBe('unknown-comp');
    });
  });

  describe('getUnplacedComponents', () => {
    it('应该返回已选中但未放置的 OUTFIT 类型组件', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'comp-1', isIncluded: true, enabledUpgrades: [], hotmapX: 0.3, hotmapY: 0.4 },
        { componentId: 'comp-2', isIncluded: true, enabledUpgrades: [], hotmapX: null, hotmapY: null },
      ];
      const selectedIds = ['comp-1', 'comp-2'];

      const unplaced = getUnplacedComponents(configs, selectedIds);

      expect(unplaced).toHaveLength(1);
      expect(unplaced[0]).toBe('comp-2');
    });

    it('ADDON 类型组件不应该在未放置列表中', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'comp-3', isIncluded: true, enabledUpgrades: [], hotmapX: null, hotmapY: null },
      ];
      const selectedIds = ['comp-3'];

      const unplaced = getUnplacedComponents(configs, selectedIds);

      expect(unplaced).toHaveLength(0);
    });

    it('未知组件（数据未加载）不应该在未放置列表中（严格检查）', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'unknown-comp', isIncluded: true, enabledUpgrades: [], hotmapX: null, hotmapY: null },
      ];
      const selectedIds = ['unknown-comp'];

      const unplaced = getUnplacedComponents(configs, selectedIds);

      // 严格检查：未知组件不显示在未放置列表
      expect(unplaced).toHaveLength(0);
    });
  });

  describe('热点渲染逻辑', () => {
    it('渲染热点时，应该能找到组件数据并显示', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'comp-1', isIncluded: true, enabledUpgrades: [], hotmapX: 0.3, hotmapY: 0.4, hotmapLabelPosition: 'right' },
      ];
      const selectedIds = ['comp-1'];

      const placed = getPlacedComponents(configs, selectedIds);

      // 模拟渲染逻辑
      const renderedHotspots = placed.map(config => {
        const component = getAllComponents().find(c => c.id === config.componentId);
        // 这是 bug 所在：如果 component 是 undefined，热点不会渲染
        if (!component || config.hotmapX == null || config.hotmapY == null) {
          return null;
        }
        return {
          id: config.componentId,
          x: config.hotmapX,
          y: config.hotmapY,
          name: component.name,
          icon: component.icon,
        };
      }).filter(Boolean);

      expect(renderedHotspots).toHaveLength(1);
      expect(renderedHotspots[0]).toEqual({
        id: 'comp-1',
        x: 0.3,
        y: 0.4,
        name: '基础和服',
        icon: '👘',
      });
    });

    it('BUG: 组件数据未加载时，热点不会渲染', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'unknown-comp', isIncluded: true, enabledUpgrades: [], hotmapX: 0.3, hotmapY: 0.4, hotmapLabelPosition: 'right' },
      ];
      const selectedIds = ['unknown-comp'];

      const placed = getPlacedComponents(configs, selectedIds);
      expect(placed).toHaveLength(1); // 配置数据存在

      // 模拟当前的渲染逻辑（有 bug）
      const renderedHotspotsWithBug = placed.map(config => {
        const component = getAllComponents().find(c => c.id === config.componentId);
        if (!component || config.hotmapX == null || config.hotmapY == null) {
          return null; // BUG: 组件未找到时返回 null
        }
        return { id: config.componentId, x: config.hotmapX, y: config.hotmapY };
      }).filter(Boolean);

      // 当前 bug 行为：热点不会渲染
      expect(renderedHotspotsWithBug).toHaveLength(0);
    });

    it('修复后: 组件数据未加载时，应该使用占位符渲染热点', () => {
      const configs: ComponentConfig[] = [
        { componentId: 'unknown-comp', isIncluded: true, enabledUpgrades: [], hotmapX: 0.3, hotmapY: 0.4, hotmapLabelPosition: 'right' },
      ];
      const selectedIds = ['unknown-comp'];

      const placed = getPlacedComponents(configs, selectedIds);

      // 修复后的渲染逻辑：使用占位符
      const renderedHotspotsFixed = placed.map(config => {
        const component = getAllComponents().find(c => c.id === config.componentId);
        if (config.hotmapX == null || config.hotmapY == null) {
          return null;
        }
        return {
          id: config.componentId,
          x: config.hotmapX,
          y: config.hotmapY,
          name: component?.name ?? '加载中...',
          icon: component?.icon ?? '📍',
        };
      }).filter(Boolean);

      // 修复后应该能渲染
      expect(renderedHotspotsFixed).toHaveLength(1);
      expect(renderedHotspotsFixed[0]).toEqual({
        id: 'unknown-comp',
        x: 0.3,
        y: 0.4,
        name: '加载中...',
        icon: '📍',
      });
    });
  });
});
