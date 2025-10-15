import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // 唯一ID（自生成）
  type: "PLAN" | "CAMPAIGN";
  planId?: string;
  campaignPlanId?: string;
  name: string;
  nameEn?: string;
  price: number; // 单价（分）
  originalPrice?: number; // 原价（活动套餐）
  image?: string;
  quantity: number;
  addOns: string[]; // 附加服务
  notes?: string; // 备注
}

interface CartStore {
  items: CartItem[];

  // 添加到购物车
  addItem: (item: Omit<CartItem, "id" | "quantity">) => void;

  // 更新数量
  updateQuantity: (id: string, quantity: number) => void;

  // 移除项目
  removeItem: (id: string) => void;

  // 更新附加服务
  updateAddOns: (id: string, addOns: string[]) => void;

  // 更新备注
  updateNotes: (id: string, notes: string) => void;

  // 清空购物车
  clearCart: () => void;

  // 获取总价
  getTotalPrice: () => number;

  // 获取商品总数
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        // 检查是否已存在相同的套餐（不考虑 addOns 和 notes）
        const existingIndex = items.findIndex(
          (i) =>
            i.type === item.type &&
            (item.type === "PLAN"
              ? i.planId === item.planId
              : i.campaignPlanId === item.campaignPlanId)
        );

        if (existingIndex >= 0) {
          // 已存在，增加数量
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          // 不存在，添加新项
          set({
            items: [
              ...items,
              {
                ...item,
                id: `cart-${Date.now()}-${Math.random()}`,
                quantity: 1,
              },
            ],
          });
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          // 数量为0时移除
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
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
    }),
    {
      name: "cart-storage", // localStorage key
    }
  )
);
