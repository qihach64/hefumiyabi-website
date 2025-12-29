import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TryOnPhoto {
  originalPhoto: string; // 用户原始照片 (base64 or URL)
  resultPhoto: string; // 试穿结果照片 (URL)
  timestamp: Date; // 试穿时间
  planImageUrl: string; // 对应的套餐图片
}

export interface CartItem {
  id: string; // 唯一ID（自生成）
  type: "PLAN"; // 统一使用 PLAN 类型（包括活动套餐）
  planId: string; // 套餐ID（统一的RentalPlan ID）
  name: string;
  nameEn?: string;
  price: number; // 单价（分）
  originalPrice?: number; // 原价（用于显示优惠）
  image?: string;
  quantity: number;
  addOns: string[]; // 附加服务
  notes?: string; // 备注

  // ========== 店铺信息（必填，从搜索上下文获取）==========
  storeId: string;
  storeName: string;

  // ========== 预约时间（每项独立）==========
  visitDate?: string; // YYYY-MM-DD 格式
  visitTime?: string; // HH:MM 格式

  // ========== 计价单位信息 ==========
  pricingUnit: "person" | "group"; // 按人 or 按组
  unitLabel: string; // "人" | "組" | "套"
  unitDescription?: string; // "2人" | "2大人+1小孩" | null
  minQuantity?: number;
  maxQuantity?: number;

  // ========== 套餐元数据 ==========
  duration?: number; // 时长（小时）
  isCampaign?: boolean; // 是否为活动套餐
  tryOnPhoto?: TryOnPhoto; // AI 试穿照片
}

// 添加到购物车时的输入类型
export type CartItemInput = Omit<CartItem, "id" | "quantity"> & {
  quantity?: number;
};

// 按店铺分组的购物车项
export interface CartItemsByStore {
  storeId: string;
  storeName: string;
  items: CartItem[];
  subtotal: number;
}

interface CartStore {
  items: CartItem[];

  // 添加到购物车（同一套餐+店铺 = 增加数量）
  addItem: (item: CartItemInput) => void;

  // 更新数量
  updateQuantity: (id: string, quantity: number) => void;

  // 移除项目
  removeItem: (id: string) => void;

  // 更新附加服务
  updateAddOns: (id: string, addOns: string[]) => void;

  // 更新备注
  updateNotes: (id: string, notes: string) => void;

  // 更新预约日期
  updateVisitDate: (id: string, date: string) => void;

  // 更新预约时间
  updateVisitTime: (id: string, time: string) => void;

  // 清空购物车
  clearCart: () => void;

  // 获取总价
  getTotalPrice: () => number;

  // 获取商品总数
  getTotalItems: () => number;

  // 按店铺分组获取购物车项
  getItemsByStore: () => CartItemsByStore[];

  // 获取建议的日期时间（基于已有项目）
  getSuggestedDateTime: () => { date?: string; time?: string };

  // 检查是否所有项目都有日期时间
  isReadyForCheckout: () => boolean;

  // 快速预约功能（Amazon模式的"Buy Now"）
  // 注意：这不再清空购物车，而是直接进入即时预约流程
  quickBook: (item: CartItemInput) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        // 检查是否已存在相同的套餐+店铺组合
        const existingIndex = items.findIndex(
          (i) => i.planId === item.planId && i.storeId === item.storeId
        );

        if (existingIndex >= 0) {
          // 已存在，增加数量（但不超过 maxQuantity）
          const newItems = [...items];
          const existing = newItems[existingIndex];
          const maxQty = existing.maxQuantity || 10;
          const newQty = Math.min(existing.quantity + (item.quantity || 1), maxQty);
          newItems[existingIndex] = { ...existing, quantity: newQty };
          set({ items: newItems });
        } else {
          // 不存在，添加新项
          // 如果没有指定日期时间，尝试使用已有项目的日期时间
          const suggested = get().getSuggestedDateTime();
          set({
            items: [
              ...items,
              {
                ...item,
                id: `cart-${Date.now()}-${Math.random()}`,
                quantity: item.quantity || item.minQuantity || 1,
                visitDate: item.visitDate || suggested.date,
                visitTime: item.visitTime || suggested.time,
              } as CartItem,
            ],
          });
        }
      },

      updateQuantity: (id, quantity) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;

        const minQty = item.minQuantity || 1;
        const maxQty = item.maxQuantity || 10;

        if (quantity < minQty) {
          // 数量低于最小值时移除
          get().removeItem(id);
          return;
        }

        // 限制在 min-max 范围内
        const clampedQty = Math.min(Math.max(quantity, minQty), maxQty);

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity: clampedQty } : item
          ),
        });
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      updateAddOns: (id, addOns) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, addOns } : item
          ),
        });
      },

      updateNotes: (id, notes) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, notes } : item
          ),
        });
      },

      updateVisitDate: (id, date) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, visitDate: date } : item
          ),
        });
      },

      updateVisitTime: (id, time) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, visitTime: time } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getItemsByStore: () => {
        const items = get().items;
        const storeMap = new Map<string, CartItemsByStore>();

        for (const item of items) {
          const existing = storeMap.get(item.storeId);
          if (existing) {
            existing.items.push(item);
            existing.subtotal += item.price * item.quantity;
          } else {
            storeMap.set(item.storeId, {
              storeId: item.storeId,
              storeName: item.storeName,
              items: [item],
              subtotal: item.price * item.quantity,
            });
          }
        }

        return Array.from(storeMap.values());
      },

      getSuggestedDateTime: () => {
        const items = get().items;
        // 找到第一个有日期时间的项目
        const itemWithDateTime = items.find((i) => i.visitDate && i.visitTime);
        if (itemWithDateTime) {
          return {
            date: itemWithDateTime.visitDate,
            time: itemWithDateTime.visitTime,
          };
        }
        return {};
      },

      isReadyForCheckout: () => {
        const items = get().items;
        if (items.length === 0) return false;
        return items.every((item) => item.visitDate && item.visitTime);
      },

      // 快速预约功能
      // 现在用于「立即预约」按钮 - 打开确认弹窗前准备数据
      quickBook: (item) => {
        // 清空购物车并添加当前项目
        const newItem = {
          ...item,
          id: `cart-${Date.now()}-${Math.random()}`,
          quantity: item.quantity || item.minQuantity || 1,
        } as CartItem;

        set({ items: [newItem] });
      },
    }),
    {
      name: "cart-storage", // localStorage key
    }
  )
);
