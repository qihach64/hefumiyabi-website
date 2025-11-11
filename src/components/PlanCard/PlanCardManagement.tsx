"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Edit, MoreVertical, Power, Copy, Trash2, Package, TrendingUp } from "lucide-react";
import { Button, Badge } from "@/components/ui";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface PlanCardManagementProps {
  plan: {
    id: string;
    slug: string;
    name: string;
    category: string;
    price: number;
    originalPrice: number | null;
    imageUrl: string | null;
    isActive: boolean;
    isFeatured: boolean;
    isCampaign: boolean;
    currentBookings: number;
    duration: number;
    includes: string[];
    planTags?: { tag: Tag }[];
  };
  onToggleStatus?: (planId: string) => void;
  onCopy?: (planId: string) => void;
  onDelete?: (planId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  LADIES: "女士套餐",
  MENS: "男士套餐",
  COUPLE: "情侣套餐",
  FAMILY: "家庭套餐",
  GROUP: "团体套餐",
  SPECIAL: "特别套餐",
};

// 快速操作菜单组件
function QuickMenu({
  plan,
  onClose,
  onToggleStatus,
  onCopy,
  onDelete,
}: {
  plan: PlanCardManagementProps['plan'];
  onClose: () => void;
  onToggleStatus?: (planId: string) => void;
  onCopy?: (planId: string) => void;
  onDelete?: (planId: string) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
        <button
          onClick={() => {
            onToggleStatus?.(plan.id);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <Power className="w-4 h-4" />
          {plan.isActive ? "下架套餐" : "上架套餐"}
        </button>
        <button
          onClick={() => {
            onCopy?.(plan.id);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          复制套餐
        </button>
        <hr className="my-2 border-gray-200" />
        <button
          onClick={() => {
            onDelete?.(plan.id);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          删除套餐
        </button>
      </div>
    </>
  );
}

export default function PlanCardManagement({
  plan,
  onToggleStatus,
  onCopy,
  onDelete,
}: PlanCardManagementProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
      {/* 套餐图片 - 正方形比例（参考 Airbnb） */}
      <div className="relative aspect-square bg-gray-100">
        {plan.imageUrl ? (
          <Image
            src={plan.imageUrl}
            alt={plan.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* 状态标签 */}
        <div className="absolute top-1.5 left-1.5 flex gap-0.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
            plan.isActive
              ? 'bg-green-500 text-white'
              : 'bg-gray-400 text-white'
          }`}>
            {plan.isActive ? "上架" : "下架"}
          </span>
          {plan.isFeatured && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-500 text-white">精选</span>
          )}
          {plan.isCampaign && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-red-500 text-white">活动</span>
          )}
        </div>

        {/* 快速操作菜单 */}
        <div className="absolute top-1.5 right-1.5">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full bg-white/90 hover:bg-white shadow-md transition-all"
          >
            <MoreVertical className="w-3.5 h-3.5 text-gray-700" />
          </button>
          {showMenu && (
            <QuickMenu
              plan={plan}
              onClose={() => setShowMenu(false)}
              onToggleStatus={onToggleStatus}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>

      {/* 套餐信息 - 超紧凑版 */}
      <div className="p-2">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-[11px] leading-tight">
          {plan.name}
        </h3>

        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="text-sm font-bold text-gray-900">
            ¥{(plan.price / 100).toLocaleString()}
          </span>
          {plan.originalPrice && plan.originalPrice > plan.price && (
            <span className="text-[9px] text-gray-500 line-through">
              ¥{(plan.originalPrice / 100).toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[9px] text-gray-600 mb-1.5">
          <span className="flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" />
            {plan.currentBookings} 次
          </span>
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-medium">
            {CATEGORY_LABELS[plan.category] || plan.category}
          </span>
        </div>

        {/* 标签 - 只显示前2个 */}
        {plan.planTags && plan.planTags.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mb-1.5">
            {plan.planTags.slice(0, 2).map(({ tag }) => (
              <span key={tag.id} className="px-1.5 py-0.5 bg-sakura-50 text-sakura-700 rounded text-[9px]">
                {tag.icon && <span className="mr-0.5">{tag.icon}</span>}
                {tag.name}
              </span>
            ))}
            {plan.planTags.length > 2 && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px]">
                +{plan.planTags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-1">
          <Link href={`/plans/${plan.slug}`} target="_blank" className="flex-1">
            <Button variant="secondary" size="sm" fullWidth className="h-6 text-[10px] px-2">
              <Eye className="w-2.5 h-2.5 mr-0.5" />
              预览
            </Button>
          </Link>
          <Link href={`/merchant/listings/${plan.id}/edit`} className="flex-1">
            <Button variant="primary" size="sm" fullWidth className="h-6 text-[10px] px-2">
              <Edit className="w-2.5 h-2.5 mr-0.5" />
              编辑
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
