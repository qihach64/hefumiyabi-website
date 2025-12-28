"use client";

import { useState } from "react";
import { Plus, Check, ChevronDown, Camera, Palette, Scissors, Clock } from "lucide-react";
import type { SelectedUpgrade } from "@/components/PlanDetailClient";

interface UpgradeOption {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  popular?: boolean;
  highlights?: string[];
}

interface UpgradeServicesProps {
  selectedUpgrades: SelectedUpgrade[];
  onAddUpgrade: (upgrade: SelectedUpgrade) => void;
  onRemoveUpgrade: (upgradeId: string) => void;
}

// 升级选项配置 - 使用 Lucide 图标
const UPGRADE_OPTIONS: UpgradeOption[] = [
  {
    id: "photo",
    name: "专业摄影",
    nameEn: "Professional Photography",
    description: "专业摄影师跟拍 30 分钟，含 20 张精修照片",
    price: 300000,
    icon: <Camera className="w-5 h-5" />,
    popular: true,
    highlights: ["专业摄影师", "30分钟跟拍", "20张精修"],
  },
  {
    id: "makeup",
    name: "专业化妆",
    nameEn: "Professional Makeup",
    description: "资深化妆师全脸妆容，含卸妆",
    price: 250000,
    icon: <Palette className="w-5 h-5" />,
    highlights: ["资深化妆师", "全脸妆容", "含卸妆"],
  },
  {
    id: "premium-hairstyle",
    name: "高级发型",
    nameEn: "Premium Hairstyle",
    description: "复杂盘发造型，含发饰",
    price: 200000,
    icon: <Scissors className="w-5 h-5" />,
    highlights: ["复杂盘发", "精选发饰", "持久定型"],
  },
  {
    id: "extension",
    name: "延长归还",
    nameEn: "Extended Return",
    description: "延长 2 小时归还时间",
    price: 100000,
    icon: <Clock className="w-5 h-5" />,
    highlights: ["额外2小时", "灵活安排", "更多拍照时间"],
  },
];

export default function UpgradeServices({
  selectedUpgrades,
  onAddUpgrade,
  onRemoveUpgrade,
}: UpgradeServicesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isSelected = (id: string) => selectedUpgrades.some((u) => u.id === id);

  const handleToggle = (upgrade: UpgradeOption) => {
    if (isSelected(upgrade.id)) {
      onRemoveUpgrade(upgrade.id);
    } else {
      onAddUpgrade({
        id: upgrade.id,
        name: upgrade.name,
        price: upgrade.price,
        icon: "", // Icon handled by component
      });
    }
  };

  return (
    <section className="py-2">
      {/* Section Header - Wafu Style */}
      <div className="mb-8">
        {/* Decorative line + English label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
            Optional Upgrades
          </span>
        </div>

        {/* Main title - Shippori Mincho */}
        <h3
          className="text-[22px] md:text-[26px] font-mincho tracking-wide mb-2"
          style={{ color: "#3D3A38" }}
        >
          体験をアップグレード
        </h3>
        <p className="text-[14px] text-[#8B7355]">
          精选增值服务，让和服之旅更加完美
        </p>

        {/* Selected summary - subtle indication */}
        {selectedUpgrades.length > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-sakura-50 rounded-full border border-sakura-200">
            <div className="w-4 h-4 rounded-full bg-sakura-500 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-[13px] font-medium text-sakura-700">
              已选 {selectedUpgrades.length} 项
            </span>
            <span className="text-[13px] text-sakura-600">
              +¥{(selectedUpgrades.reduce((sum, u) => sum + u.price, 0) / 100).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Upgrade Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {UPGRADE_OPTIONS.map((upgrade) => {
          const selected = isSelected(upgrade.id);
          const expanded = expandedId === upgrade.id;

          return (
            <div
              key={upgrade.id}
              className={`
                relative bg-white rounded-xl transition-all duration-200
                ${selected
                  ? "bg-sakura-50/50 border border-sakura-300 shadow-sm ring-1 ring-sakura-200"
                  : "border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                }
              `}
            >
              {/* Popular Badge - Subtle */}
              {upgrade.popular && !selected && (
                <div className="absolute -top-2 right-4 z-10">
                  <span className="px-2 py-0.5 bg-sakura-500 text-white text-[10px] font-medium rounded-full shadow-sm">
                    人気
                  </span>
                </div>
              )}

              {/* Card Content */}
              <div className="p-5">
                {/* Top Row: Icon + Info + Price */}
                <div className="flex items-start gap-4">
                  {/* Icon Container */}
                  <div
                    className={`
                      w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                      ${selected
                        ? "bg-sakura-100 text-sakura-600"
                        : "bg-gray-50 text-gray-400"
                      }
                    `}
                  >
                    {upgrade.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name - Serif font */}
                    <h4
                      className={`
                        text-[15px] font-serif tracking-wide mb-0.5 transition-colors
                        ${selected ? "text-sakura-800" : "text-[#3D3A38]"}
                      `}
                    >
                      {upgrade.name}
                    </h4>
                    {/* English name */}
                    <p className="text-[11px] text-gray-400 tracking-wide">
                      {upgrade.nameEn}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`
                        text-[16px] font-semibold transition-colors
                        ${selected ? "text-sakura-600" : "text-[#3D3A38]"}
                      `}
                    >
                      +¥{(upgrade.price / 100).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-gray-400">/ 人</div>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-3 text-[13px] text-[#8B7355] leading-relaxed">
                  {upgrade.description}
                </p>

                {/* Action Row */}
                <div className="mt-4 flex items-center gap-3">
                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggle(upgrade)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                      ${selected
                        ? "bg-sakura-500 text-white hover:bg-sakura-600"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-sakura-300 hover:text-sakura-600"
                      }
                    `}
                  >
                    {selected ? (
                      <>
                        <Check className="w-4 h-4" />
                        已添加
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        添加
                      </>
                    )}
                  </button>

                  {/* Expand Details */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : upgrade.id)}
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center transition-all
                      ${expanded
                        ? "bg-gray-100 text-gray-600"
                        : "bg-transparent text-gray-400 hover:bg-gray-50"
                      }
                    `}
                    aria-label="详情"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                      服务详情
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {upgrade.highlights?.map((h, i) => (
                        <span
                          key={i}
                          className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-[12px]
                            ${selected
                              ? "bg-sakura-100 text-sakura-700"
                              : "bg-gray-50 text-gray-600"
                            }
                          `}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note - Subtle */}
      <div className="mt-6 text-center">
        <p className="text-[12px] text-gray-400">
          增值服务将在预订确认时一并结算
        </p>
      </div>
    </section>
  );
}
