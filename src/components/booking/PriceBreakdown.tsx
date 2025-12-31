"use client";

export interface UpgradeItem {
  id: string;
  name: string;
  icon?: string;
  price: number; // 分
}

export interface CartItem {
  id: string;
  name: string;
  image?: string;
  price: number; // 分
  quantity: number;
  storeName?: string;
}

// 单商品模式 (详情页直接预约)
interface SingleItemProps {
  mode: "single";
  planName: string;
  planPrice: number; // 分
  quantity: number;
  unitLabel: string;
  upgrades?: UpgradeItem[];
  deposit?: number; // 分
}

// 多商品模式 (购物车结算)
interface MultiItemProps {
  mode: "multi";
  items: CartItem[];
  deposit?: number; // 分
}

type PriceBreakdownProps = (SingleItemProps | MultiItemProps) & {
  /** 紧凑模式 - 用于 Modal */
  compact?: boolean;
};

export default function PriceBreakdown(props: PriceBreakdownProps) {
  const { compact = false, deposit = 0 } = props;

  // 计算总价
  let subtotal = 0;
  if (props.mode === "single") {
    const upgradesPerUnit = props.upgrades?.reduce((sum, u) => sum + u.price, 0) || 0;
    const unitPriceWithUpgrades = props.planPrice + upgradesPerUnit;
    subtotal = unitPriceWithUpgrades * props.quantity;
  } else {
    subtotal = props.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  const balance = subtotal - deposit;

  // 格式化价格
  const formatPrice = (cents: number) => `¥${(cents / 100).toLocaleString()}`;

  return (
    <div className={`bg-sakura-50/50 rounded-xl ${compact ? "p-3" : "p-4"}`}>
      {/* 单商品模式 */}
      {props.mode === "single" && (
        <>
          {/* 增值服务明细 */}
          {props.upgrades && props.upgrades.length > 0 ? (
            <>
              {/* 单价构成 */}
              <div className={`text-gray-500 mb-2 ${compact ? "text-[12px]" : "text-[13px]"}`}>
                单价：套餐 {formatPrice(props.planPrice)} + 增值 {formatPrice(props.upgrades.reduce((sum, u) => sum + u.price, 0))} = {formatPrice(props.planPrice + props.upgrades.reduce((sum, u) => sum + u.price, 0))}/{props.unitLabel}
              </div>

              {/* 增值服务列表 */}
              <div className={`pl-3 border-l-2 border-sakura-200 space-y-1 mb-3 ${compact ? "text-[11px]" : "text-[12px]"} text-gray-400`}>
                {props.upgrades.map((upgrade) => (
                  <div key={upgrade.id} className="flex justify-between">
                    <span>{upgrade.icon} {upgrade.name}</span>
                    <span>+{formatPrice(upgrade.price)}/{props.unitLabel}</span>
                  </div>
                ))}
              </div>

              {/* 数量计算 */}
              <div className={`flex justify-between ${compact ? "text-[13px]" : "text-[14px]"}`}>
                <span className="text-gray-600">
                  {formatPrice(props.planPrice + props.upgrades.reduce((sum, u) => sum + u.price, 0))} × {props.quantity} {props.unitLabel}
                </span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
            </>
          ) : (
            /* 无增值服务 - 简单显示 */
            <div className={`flex justify-between ${compact ? "text-[13px]" : "text-[14px]"}`}>
              <span className="text-gray-600">
                {formatPrice(props.planPrice)} × {props.quantity} {props.unitLabel}
              </span>
              <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
            </div>
          )}
        </>
      )}

      {/* 多商品模式 */}
      {props.mode === "multi" && (
        <div className={`space-y-2 ${compact ? "text-[13px]" : "text-[14px]"}`}>
          {/* 商品数量 */}
          <div className="flex justify-between text-gray-600">
            <span>套餐总数</span>
            <span className="font-medium text-gray-900">
              {props.items.reduce((sum, item) => sum + item.quantity, 0)} 个
            </span>
          </div>

          {/* 小计 */}
          <div className="flex justify-between text-gray-600">
            <span>小计</span>
            <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
          </div>
        </div>
      )}

      {/* 分割线 + 合计 */}
      <div className={`flex justify-between pt-3 mt-3 border-t border-sakura-200/50 ${compact ? "text-[14px]" : "text-[16px]"}`}>
        <span className="font-semibold text-gray-900">合计</span>
        <span className="font-semibold text-sakura-600">{formatPrice(subtotal)}</span>
      </div>

      {/* 定金/尾款信息 */}
      {deposit > 0 && (
        <div className={`flex justify-between mt-2 text-gray-500 ${compact ? "text-[11px]" : "text-[12px]"}`}>
          <span>定金 {formatPrice(deposit)}</span>
          <span>到店支付 {formatPrice(balance)}</span>
        </div>
      )}
    </div>
  );
}
