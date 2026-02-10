"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";

// Hook 只要求购物车操作所需的最小字段集
interface CartTogglePlan {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  isCampaign?: boolean;
}

/**
 * 购物车切换逻辑 - 提取自 PlanCard 和 FeaturedPlanCard 的共同代码
 * 包含添加/移除购物车、动画状态管理、toast 提示
 */
export function useCartToggle(plan: CartTogglePlan) {
  const [isAdding, setIsAdding] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const [lastAction, setLastAction] = useState<'add' | 'remove' | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const items = useCartStore((state) => state.items);

  const cartItem = items.find(item => item.planId === plan.id);
  const isInCart = !!cartItem;

  // 切换购物车状态（动态导入 toast 避免首屏加载 sonner）
  const handleToggleCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    const { toast } = await import("sonner");

    if (isInCart && cartItem) {
      removeItem(cartItem.id);
      setLastAction('remove');
      toast.success("已从购物车移除");
    } else {
      addItem({
        type: 'PLAN',
        planId: plan.id,
        name: plan.name,
        nameEn: plan.nameEn,
        price: plan.price,
        originalPrice: plan.originalPrice,
        image: plan.imageUrl,
        addOns: [],
        isCampaign: plan.isCampaign,
      });
      setLastAction('add');
      toast.success("已加入购物车");
    }

    setJustChanged(true);
    setTimeout(() => {
      setIsAdding(false);
      setJustChanged(false);
      setLastAction(null);
    }, 1000);
  };

  return { isInCart, isAdding, justChanged, lastAction, handleToggleCart };
}
