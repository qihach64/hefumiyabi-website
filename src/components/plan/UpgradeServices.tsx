"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Plus, Check, ChevronDown } from "lucide-react";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import type { SelectedUpgrade } from "@/components/PlanDetailClient";

// 从 API 获取的升级服务类型
interface PlanUpgrade {
  id: string;
  merchantComponentId: string;
  priceOverride: number | null;
  isPopular: boolean;
  displayOrder: number;
  merchantComponent: {
    id: string;
    price: number;
    images: string[];
    highlights: string[];
    template: {
      id: string;
      code: string;
      name: string;
      nameEn: string | null;
      description: string | null;
      icon: string | null;
    };
  };
}

// 内部使用的升级选项类型
interface UpgradeOption {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  icon: string;
  popular?: boolean;
  highlights?: string[];
  images: string[];
}

interface UpgradeServicesProps {
  planUpgrades?: PlanUpgrade[];
  selectedUpgrades: SelectedUpgrade[];
  onAddUpgrade: (upgrade: SelectedUpgrade) => void;
  onRemoveUpgrade: (upgradeId: string) => void;
}

export default function UpgradeServices({
  planUpgrades,
  selectedUpgrades,
  onAddUpgrade,
  onRemoveUpgrade,
}: UpgradeServicesProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // 将 planUpgrades 转换为内部 UpgradeOption 格式
  const upgradeOptions: UpgradeOption[] = useMemo(() => {
    if (!planUpgrades || planUpgrades.length === 0) return [];

    return planUpgrades.map((pu) => ({
      id: pu.merchantComponentId,
      name: pu.merchantComponent.template.name,
      nameEn: pu.merchantComponent.template.nameEn || pu.merchantComponent.template.name,
      description: pu.merchantComponent.template.description || "",
      price: pu.priceOverride ?? pu.merchantComponent.price,
      icon: pu.merchantComponent.template.icon || "🎁",
      popular: pu.isPopular,
      highlights: pu.merchantComponent.highlights || [],
      images: pu.merchantComponent.images || [],
    }));
  }, [planUpgrades]);

  const isSelected = (id: string) => selectedUpgrades.some((u) => u.id === id);

  // 如果没有升级服务，不渲染此区块
  if (upgradeOptions.length === 0) {
    return null;
  }

  const handleToggle = (option: UpgradeOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected(option.id)) {
      onRemoveUpgrade(option.id);
    } else {
      onAddUpgrade({
        id: option.id,
        name: option.name,
        price: option.price,
        icon: option.icon,
      });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openGallery = (images: string[], index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setGalleryImages(images);
    setGalleryIndex(index);
    setShowGallery(true);
  };

  // 已选中的升级服务数量和总价
  const selectedCount = selectedUpgrades.length;
  const selectedTotal = selectedUpgrades.reduce((sum, u) => sum + u.price, 0);

  return (
    <section className="space-y-4">
      {/* ========================================
          区块标题 - 日式极简
      ======================================== */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
        <span className="text-[11px] uppercase tracking-[0.3em] text-sakura-500 font-medium">
          Optional Upgrades
        </span>
      </div>

      {/* 已选摘要 */}
      {selectedCount > 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sakura-50/50 rounded-full border border-sakura-100">
          <div className="w-4 h-4 rounded-full bg-sakura-500 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[13px] font-medium text-sakura-700">
            已选 {selectedCount} 项
          </span>
          <span className="text-[13px] text-sakura-500">
            +¥{(selectedTotal / 100).toLocaleString()}
          </span>
        </div>
      )}

      {/* ========================================
          升级选项列表 - Wabi-Sabi 卡片
      ======================================== */}
      <div className="space-y-3">
        {upgradeOptions.map((option) => {
          const added = isSelected(option.id);
          const expanded = expandedId === option.id;
          const hasImages = option.images.length > 0;

          return (
            <div
              key={option.id}
              onClick={() => toggleExpand(option.id)}
              className={`
                group bg-white rounded-xl border overflow-hidden cursor-pointer
                transition-all duration-300
                ${added
                  ? "border-sakura-300 bg-sakura-50/30"
                  : "border-wabi-200 hover:border-sakura-200 hover:shadow-md"
                }
              `}
            >
              {/* 主行：缩略图/图标 + 信息 + 价格 + 添加按钮 + 展开箭头 */}
              <div className="flex items-center gap-3 p-4">
                {/* 缩略图或图标容器 */}
                {hasImages ? (
                  <div
                    className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-wabi-100"
                    onClick={(e) => openGallery(option.images, 0, e)}
                  >
                    <Image
                      src={option.images[0]}
                      alt={option.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className={`
                      w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0
                      ${added ? "bg-sakura-100" : "bg-wabi-100"}
                    `}
                  >
                    <span className={added ? "" : "grayscale-[30%]"}>{option.icon}</span>
                  </div>
                )}

                {/* 信息区 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-medium text-stone-800 truncate">
                      {option.name}
                    </h4>
                    {option.popular && (
                      <span className="px-1.5 py-0.5 bg-sakura-500 text-white text-[9px] font-medium rounded tracking-wider flex-shrink-0">
                        人気
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-stone-500 mt-0.5 line-clamp-1">
                    {option.description}
                  </p>
                </div>

                {/* 价格 */}
                <span className="text-[15px] font-semibold text-sakura-600 flex-shrink-0">
                  +¥{(option.price / 100).toLocaleString()}
                </span>

                {/* 添加按钮 */}
                <button
                  onClick={(e) => handleToggle(option, e)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0
                    ${added
                      ? "bg-sakura-500 text-white hover:bg-sakura-600 shadow-sm"
                      : "bg-stone-100 text-stone-500 hover:bg-sakura-100 hover:text-sakura-600"
                    }
                  `}
                >
                  {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>

                {/* 展开箭头 - 独立在最右侧 */}
                <ChevronDown
                  className={`
                    w-4 h-4 text-stone-400 transition-transform duration-300 flex-shrink-0
                    ${expanded ? "rotate-180" : ""}
                    group-hover:text-stone-500
                  `}
                />
              </div>

              {/* ========================================
                  展开内容 - 与卡片融合
              ======================================== */}
              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${expanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}
                `}
              >
                <div className="px-4 pb-4 pt-1 space-y-3">
                  {/* 图片画廊 */}
                  {hasImages && (
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                      {option.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={(e) => openGallery(option.images, i, e)}
                          className="relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-wabi-100 hover:ring-2 hover:ring-sakura-300 transition-all"
                        >
                          <Image
                            src={img}
                            alt={`${option.name} ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="96px"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 详细描述 */}
                  <p className="text-[13px] text-stone-500 leading-relaxed">
                    {option.detailedDescription}
                  </p>

                  {/* 亮点标签 */}
                  {option.highlights && (
                    <div className="flex flex-wrap gap-1.5">
                      {option.highlights.map((h, i) => (
                        <span
                          key={i}
                          className={`
                            inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px]
                            ${added
                              ? "bg-sakura-100/80 text-sakura-700"
                              : "bg-wabi-100 text-stone-600"
                            }
                          `}
                        >
                          <Check className="w-3 h-3" />
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部说明 */}
      <p className="text-center text-[12px] text-wabi-400 pt-2">
        增值服务将在预订确认时一并结算
      </p>

      {/* 图片画廊 Modal */}
      <ImageGalleryModal
        images={galleryImages}
        initialIndex={galleryIndex}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        planName="升级服务"
      />
    </section>
  );
}
