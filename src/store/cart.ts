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
  storeId?: string; // 用户选择的店铺ID
  storeName?: string; // 用户选择的店铺名称
  planStoreName?: string; // 套餐所属的店铺名称
  isCampaign?: boolean; // 是否为活动套餐
  tryOnPhoto?: TryOnPhoto; // AI 试穿照片
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

  // 更新店铺
  updateStore: (id: string, storeId: string, storeName: string) => void;

  // 清空购物车
  clearCart: () => void;

  // 获取总价
  getTotalPrice: () => number;

  // 获取商品总数
  getTotalItems: () => number;

  // 快速预约功能（Amazon模式的"Buy Now"）
  quickBook: (item: Omit<CartItem, "id" | "quantity">) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        // 检查是否已存在相同的套餐（不考虑 addOns 和 notes）
        const existingIndex = items.findIndex(
          (i) => i.planId === item.planId
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

      updateStore: (id, storeId, storeName) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, storeId, storeName } : item
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

      // 快速预约功能（Amazon模式的"Buy Now"）
      quickBook: (item) => {
        // 1. 清空购物车
        set({ items: [] });
        
        // 2. 添加当前项目到购物车
        const newItem = {
          ...item,
          id: `cart-${Date.now()}-${Math.random()}`,
          quantity: 1,
        };
        
        set({ items: [newItem] });
      },
    }),
    {
      name: "cart-storage", // localStorage key
    }
  )
);
