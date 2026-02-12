import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, type CartItemInput } from '../cart';

// 辅助函数：创建测试用的购物车项目
function makeItem(overrides: Partial<CartItemInput> = {}): CartItemInput {
  return {
    type: 'PLAN',
    planId: 'plan-1',
    name: '经典和服套餐',
    price: 500000, // 5000 元（分）
    image: '/img/plan1.jpg',
    addOns: [],
    storeId: 'store-1',
    storeName: '京都本店',
    pricingUnit: 'person',
    unitLabel: '人',
    ...overrides,
  };
}

describe('useCartStore', () => {
  beforeEach(() => {
    // 每个测试前重置 store
    useCartStore.setState({ items: [] });
  });

  // ==================== addItem ====================
  describe('addItem', () => {
    it('添加新项目到空购物车', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].planId).toBe('plan-1');
      expect(items[0].name).toBe('经典和服套餐');
      expect(items[0].quantity).toBe(1);
      expect(items[0].id).toMatch(/^cart-/);
    });

    it('相同套餐+店铺时合并数量', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());
      addItem(makeItem());

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('不同套餐或不同店铺时分开存储', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ planId: 'plan-1', storeId: 'store-1' }));
      addItem(makeItem({ planId: 'plan-2', storeId: 'store-1' }));
      addItem(makeItem({ planId: 'plan-1', storeId: 'store-2' }));

      expect(useCartStore.getState().items).toHaveLength(3);
    });

    it('合并时不超过 maxQuantity', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ maxQuantity: 3, quantity: 2 }));
      addItem(makeItem({ maxQuantity: 3, quantity: 2 }));

      const items = useCartStore.getState().items;
      expect(items[0].quantity).toBe(3);
    });

    it('默认 maxQuantity 为 10', () => {
      const { addItem } = useCartStore.getState();
      for (let i = 0; i < 15; i++) {
        addItem(makeItem());
      }

      expect(useCartStore.getState().items[0].quantity).toBe(10);
    });

    it('新项目自动填充已有项目的日期时间', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ visitDate: '2025-03-01', visitTime: '10:00' }));
      addItem(makeItem({ planId: 'plan-2' }));

      const items = useCartStore.getState().items;
      expect(items[1].visitDate).toBe('2025-03-01');
      expect(items[1].visitTime).toBe('10:00');
    });

    it('有指定日期时间时不被覆盖', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ visitDate: '2025-03-01', visitTime: '10:00' }));
      addItem(makeItem({ planId: 'plan-2', visitDate: '2025-04-01', visitTime: '14:00' }));

      const items = useCartStore.getState().items;
      expect(items[1].visitDate).toBe('2025-04-01');
      expect(items[1].visitTime).toBe('14:00');
    });

    it('默认 quantity 使用 minQuantity', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ minQuantity: 2 }));

      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });
  });

  // ==================== updateQuantity ====================
  describe('updateQuantity', () => {
    it('正常更新数量', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().updateQuantity(id, 5);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('低于 minQuantity 时自动移除', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ minQuantity: 2 }));

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().updateQuantity(id, 1);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('clamp 到 maxQuantity', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ maxQuantity: 5 }));

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().updateQuantity(id, 100);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('数量为 0 时移除（默认 minQuantity=1）', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().updateQuantity(id, 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('不存在的 id 不影响 store', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      useCartStore.getState().updateQuantity('non-existent', 5);
      expect(useCartStore.getState().items).toHaveLength(1);
    });
  });

  // ==================== removeItem ====================
  describe('removeItem', () => {
    it('移除指定项', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ planId: 'plan-1' }));
      addItem(makeItem({ planId: 'plan-2' }));

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().removeItem(id);

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].planId).toBe('plan-2');
    });
  });

  // ==================== updateAddOns ====================
  describe('updateAddOns', () => {
    it('更新附加服务', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().updateAddOns(id, ['发型设计', '化妆']);

      expect(useCartStore.getState().items[0].addOns).toEqual(['发型设计', '化妆']);
    });
  });

  // ==================== updateNotes ====================
  describe('updateNotes', () => {
    it('更新备注', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().updateNotes(id, '请准备大号');

      expect(useCartStore.getState().items[0].notes).toBe('请准备大号');
    });
  });

  // ==================== updateVisitDate / updateVisitTime ====================
  describe('updateVisitDate / updateVisitTime', () => {
    it('更新预约日期', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().updateVisitDate(id, '2025-06-01');

      expect(useCartStore.getState().items[0].visitDate).toBe('2025-06-01');
    });

    it('更新预约时间', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      const id = useCartStore.getState().items[0].id;
      useCartStore.getState().updateVisitTime(id, '14:30');

      expect(useCartStore.getState().items[0].visitTime).toBe('14:30');
    });
  });

  // ==================== clearCart ====================
  describe('clearCart', () => {
    it('清空购物车', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ planId: 'plan-1' }));
      addItem(makeItem({ planId: 'plan-2' }));

      useCartStore.getState().clearCart();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  // ==================== getTotalPrice ====================
  describe('getTotalPrice', () => {
    it('计算总价（分）', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ price: 100000, quantity: 2 }));
      addItem(makeItem({ planId: 'plan-2', price: 200000, quantity: 1 }));

      expect(useCartStore.getState().getTotalPrice()).toBe(400000);
    });

    it('空购物车返回 0', () => {
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
    });
  });

  // ==================== getTotalItems ====================
  describe('getTotalItems', () => {
    it('返回商品总数', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ quantity: 3 }));
      addItem(makeItem({ planId: 'plan-2', quantity: 2 }));

      expect(useCartStore.getState().getTotalItems()).toBe(5);
    });

    it('空购物车返回 0', () => {
      expect(useCartStore.getState().getTotalItems()).toBe(0);
    });
  });

  // ==================== getItemsByStore ====================
  describe('getItemsByStore', () => {
    it('按店铺分组', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ planId: 'p1', storeId: 'store-1', storeName: '京都本店', price: 100000 }));
      addItem(makeItem({ planId: 'p2', storeId: 'store-1', storeName: '京都本店', price: 200000 }));
      addItem(makeItem({ planId: 'p3', storeId: 'store-2', storeName: '大阪店', price: 150000 }));

      const groups = useCartStore.getState().getItemsByStore();
      expect(groups).toHaveLength(2);

      const kyotoGroup = groups.find((g) => g.storeId === 'store-1')!;
      expect(kyotoGroup.storeName).toBe('京都本店');
      expect(kyotoGroup.items).toHaveLength(2);
      expect(kyotoGroup.subtotal).toBe(300000);

      const osakaGroup = groups.find((g) => g.storeId === 'store-2')!;
      expect(osakaGroup.items).toHaveLength(1);
      expect(osakaGroup.subtotal).toBe(150000);
    });

    it('subtotal 考虑数量', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ price: 100000, quantity: 3 }));

      const groups = useCartStore.getState().getItemsByStore();
      expect(groups[0].subtotal).toBe(300000);
    });
  });

  // ==================== getSuggestedDateTime ====================
  describe('getSuggestedDateTime', () => {
    it('返回第一个有日期时间的项', () => {
      const { addItem } = useCartStore.getState();
      // 直接设置 items 避免 addItem 自动填充
      useCartStore.setState({
        items: [
          { ...makeItem(), id: 'c1', quantity: 1 } as any,
          { ...makeItem({ planId: 'p2', visitDate: '2025-05-01', visitTime: '09:00' }), id: 'c2', quantity: 1 } as any,
        ],
      });

      const suggested = useCartStore.getState().getSuggestedDateTime();
      expect(suggested.date).toBe('2025-05-01');
      expect(suggested.time).toBe('09:00');
    });

    it('没有项目时返回空对象', () => {
      const suggested = useCartStore.getState().getSuggestedDateTime();
      expect(suggested).toEqual({});
    });

    it('所有项目都没有日期时间时返回空对象', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      const suggested = useCartStore.getState().getSuggestedDateTime();
      expect(suggested).toEqual({});
    });
  });

  // ==================== isReadyForCheckout ====================
  describe('isReadyForCheckout', () => {
    it('空购物车返回 false', () => {
      expect(useCartStore.getState().isReadyForCheckout()).toBe(false);
    });

    it('缺日期时间返回 false', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem());

      expect(useCartStore.getState().isReadyForCheckout()).toBe(false);
    });

    it('部分项目缺日期时间返回 false', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ visitDate: '2025-03-01', visitTime: '10:00' }));
      // 第二项手动设置无日期时间
      useCartStore.setState((state) => ({
        items: [
          ...state.items,
          { ...makeItem({ planId: 'p2' }), id: 'c2', quantity: 1 } as any,
        ],
      }));

      expect(useCartStore.getState().isReadyForCheckout()).toBe(false);
    });

    it('全部齐全返回 true', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ visitDate: '2025-03-01', visitTime: '10:00' }));
      addItem(makeItem({ planId: 'p2', visitDate: '2025-03-01', visitTime: '14:00' }));

      expect(useCartStore.getState().isReadyForCheckout()).toBe(true);
    });
  });

  // ==================== quickBook ====================
  describe('quickBook', () => {
    it('清空购物车并添加单项', () => {
      const { addItem } = useCartStore.getState();
      addItem(makeItem({ planId: 'old-plan' }));
      addItem(makeItem({ planId: 'old-plan-2' }));

      useCartStore.getState().quickBook(makeItem({ planId: 'quick-plan', price: 300000 }));

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].planId).toBe('quick-plan');
      expect(items[0].price).toBe(300000);
      expect(items[0].id).toMatch(/^cart-/);
    });

    it('默认数量使用 minQuantity', () => {
      useCartStore.getState().quickBook(makeItem({ minQuantity: 2 }));

      expect(useCartStore.getState().items[0].quantity).toBe(2);
    });
  });
});
