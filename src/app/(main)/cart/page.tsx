"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, MapPin } from "lucide-react";

interface Store {
  id: string;
  name: string;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, updateStore, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const [isClearing, setIsClearing] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载店铺列表
  useEffect(() => {
    async function fetchStores() {
      try {
        const response = await fetch("/api/stores");
        const data = await response.json();
        setStores(data);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  // 自动为只有一个可用店铺的套餐选择店铺
  useEffect(() => {
    if (stores.length === 0) return;

    items.forEach((item) => {
      // 如果已经选择了店铺，跳过
      if (item.storeId) return;

      // 获取该套餐的可用店铺列表
      const availableStores = stores.filter((store) => {
        if (item.planStoreName) {
          return store.name === item.planStoreName ||
                 item.planStoreName.includes(store.name) ||
                 store.name.includes(item.planStoreName);
        }
        if (item.applicableStores && item.applicableStores.length > 0) {
          return item.applicableStores.some((storeName) =>
            store.name === storeName ||
            storeName.includes(store.name) ||
            store.name.includes(storeName)
          );
        }
        return true;
      });

      // 如果只有一个可用店铺，自动选择
      if (availableStores.length === 1) {
        updateStore(item.id, availableStores[0].id, availableStores[0].name);
      }
    });
  }, [stores, items, updateStore]);

  const handleClearCart = () => {
    if (confirm("确定要清空购物车吗？")) {
      setIsClearing(true);
      clearCart();
      setTimeout(() => setIsClearing(false), 500);
    }
  };

  const handleStoreChange = (itemId: string, storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      updateStore(itemId, store.id, store.name);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 md:py-24">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">购物车是空的</h1>
            <p className="text-muted-foreground mb-8">
              还没有添加任何套餐到购物车，去看看有哪些精彩套餐吧！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/plans"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
              >
                浏览套餐
              </Link>
              <Link
                href="/campaigns"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-primary text-primary hover:bg-primary/10 h-11 px-8"
              >
                查看优惠活动
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 md:py-12">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              继续浏览
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">购物车</h1>
            <p className="text-muted-foreground mt-2">
              共 {totalItems} 个套餐
            </p>
          </div>
          <button
            onClick={handleClearCart}
            disabled={isClearing}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            清空购物车
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 购物车项目列表 */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg border p-4 md:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* 图片 */}
                  {item.image ? (
                    <div className="relative w-24 h-32 md:w-32 md:h-40 rounded-md overflow-hidden bg-secondary shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 96px, 128px"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-32 md:w-32 md:h-40 rounded-md bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-4xl">👘</span>
                    </div>
                  )}

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.type === "PLAN" ? "常规套餐" : "优惠活动"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2"
                        aria-label="删除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* 店铺选择 */}
                    <div className="mb-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        选择店铺
                      </label>
                      <select
                        value={item.storeId || ""}
                        onChange={(e) => handleStoreChange(item.id, e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">请选择店铺</option>
                        {stores
                          .filter((store) => {
                            // 常规套餐：如果有指定店铺，只显示该店铺
                            if (item.planStoreName) {
                              return store.name === item.planStoreName ||
                                     item.planStoreName.includes(store.name) ||
                                     store.name.includes(item.planStoreName);
                            }
                            // 活动套餐：如果有可用店铺列表，只显示列表中的店铺
                            if (item.applicableStores && item.applicableStores.length > 0) {
                              return item.applicableStores.some((storeName) =>
                                store.name === storeName ||
                                storeName.includes(store.name) ||
                                store.name.includes(storeName)
                              );
                            }
                            // 否则显示所有店铺
                            return true;
                          })
                          .map((store) => (
                            <option key={store.id} value={store.id}>
                              {store.name}
                            </option>
                          ))}
                      </select>
                      {!item.storeId && (
                        <p className="text-xs text-destructive mt-1">
                          请选择店铺后才能预约
                        </p>
                      )}
                      {item.planStoreName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          此套餐仅在 {item.planStoreName} 提供
                        </p>
                      )}
                      {item.applicableStores && item.applicableStores.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          此套餐可在 {item.applicableStores.length} 家店铺使用
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* 数量控制 */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, Math.max(1, item.quantity - 1))
                          }
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-md border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="减少数量"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-md border flex items-center justify-center hover:bg-secondary transition-colors"
                          aria-label="增加数量"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 价格 */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          ¥{((item.price * item.quantity) / 100).toLocaleString()}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-sm text-muted-foreground">
                            ¥{(item.price / 100).toLocaleString()} × {item.quantity}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 附加服务 */}
                    {item.addOns && item.addOns.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          附加服务: {item.addOns.join(", ")}
                        </p>
                      </div>
                    )}

                    {/* 备注 */}
                    {item.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          备注: {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 订单摘要 */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-6">订单摘要</h2>

              <div className="space-y-3 mb-6 pb-6 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">套餐数量</span>
                  <span className="font-medium">{totalItems} 个</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">小计</span>
                  <span className="font-medium">
                    ¥{(totalPrice / 100).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold mb-6">
                <span>总计</span>
                <span className="text-primary">
                  ¥{(totalPrice / 100).toLocaleString()}
                </span>
              </div>

              {/* 检查是否所有项目都选择了店铺 */}
              {items.some((item) => !item.storeId) ? (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">
                    请为所有套餐选择店铺后再进行预约
                  </p>
                </div>
              ) : null}

              <Link
                href="/booking"
                className={`w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-12 px-6 mb-3 ${
                  items.some((item) => !item.storeId)
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                onClick={(e) => {
                  if (items.some((item) => !item.storeId)) {
                    e.preventDefault();
                    alert("请为所有套餐选择店铺");
                  }
                }}
              >
                去预约
              </Link>

              <Link
                href="/plans"
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-primary text-primary hover:bg-primary/10 h-12 px-6"
              >
                继续购物
              </Link>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  提示：预约时需要选择到店日期和时间。每个套餐会在对应的店铺进行服务。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
