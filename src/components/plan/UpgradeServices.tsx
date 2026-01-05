"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { Plus, Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
    // 自定义服务字段
    isCustom?: boolean;
    customName?: string | null;
    customNameEn?: string | null;
    customDescription?: string | null;
    customIcon?: string | null;
    customBasePrice?: number | null;
    // 平台模板（自定义服务时为 null）
    template: {
      id: string;
      code: string;
      name: string;
      nameEn: string | null;
      description: string | null;
      icon: string | null;
    } | null;
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 将 planUpgrades 转换为内部 UpgradeOption 格式
  const upgradeOptions: UpgradeOption[] = useMemo(() => {
    if (!planUpgrades || planUpgrades.length === 0) return [];

    return planUpgrades.map((pu) => {
      const mc = pu.merchantComponent;
      const template = mc.template;

      // 自定义服务使用 custom* 字段，平台服务使用 template 字段
      const name = template?.name || mc.customName || "未命名服务";
      const nameEn = template?.nameEn || mc.customNameEn || name;
      const description = template?.description || mc.customDescription || "";
      const icon = template?.icon || mc.customIcon || "✨";

      return {
        id: pu.merchantComponentId,
        name,
        nameEn,
        description,
        price: pu.priceOverride ?? mc.price ?? mc.customBasePrice ?? 0,
        icon,
        popular: pu.isPopular,
        highlights: mc.highlights || [],
        images: mc.images || [],
      };
    });
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

  const openGallery = (images: string[], index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setGalleryImages(images);
    setGalleryIndex(index);
    setShowGallery(true);
  };

  // 滚动控制
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  // 已选中的升级服务数量和总价
  const selectedCount = selectedUpgrades.length;
  const selectedTotal = selectedUpgrades.reduce((sum, u) => sum + u.price, 0);

  return (
    <section className="space-y-6">
      {/* ========================================
          区块标题 - 日式极简 + 已选摘要
      ======================================== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
          <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
            Upgrade Your Experience
          </span>
        </div>

        {/* 已选摘要 */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sakura-50 rounded-full border border-sakura-100">
            <div className="w-4 h-4 rounded-full bg-sakura-500 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-[13px] font-medium text-sakura-700">
              {selectedCount} 项
            </span>
            <span className="text-[13px] text-sakura-500">
              +¥{(selectedTotal / 100).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* ========================================
          横向滚动卡片 - Airbnb 风格
      ======================================== */}
      <div className="relative group/scroll">
        {/* 左箭头 */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* 右箭头 */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hover:scale-105"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* 滚动容器 */}
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollButtons}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-4 px-4"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {upgradeOptions.map((option) => {
            const added = isSelected(option.id);
            const hasImages = option.images.length > 0;
            const displayImage = hasImages ? option.images[0] : null;

            return (
              <div
                key={option.id}
                className="flex-shrink-0 w-[220px] md:w-[260px]"
                style={{ scrollSnapAlign: "start" }}
              >
                <div
                  className={`
                    group relative bg-white rounded-xl overflow-hidden cursor-pointer
                    transition-all duration-300
                    ${added
                      ? "ring-2 ring-sakura-400 shadow-lg shadow-sakura-100"
                      : "border border-gray-200 hover:shadow-lg hover:-translate-y-1"
                    }
                  `}
                >
                  {/* 图片区域 */}
                  <div
                    className="relative aspect-[4/3] bg-wabi-100 overflow-hidden"
                    onClick={(e) => hasImages && openGallery(option.images, 0, e)}
                  >
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={option.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 220px, 260px"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[48px]">{option.icon}</span>
                      </div>
                    )}

                    {/* 人気 徽章 */}
                    {option.popular && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-sakura-500 to-sakura-600 text-white text-[11px] font-medium rounded-full shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        <span>人気 No.1</span>
                      </div>
                    )}

                    {/* 已选标记 */}
                    {added && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-sakura-500 flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* 图片数量指示 */}
                    {hasImages && option.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[11px] text-white">
                        1/{option.images.length}
                      </div>
                    )}
                  </div>

                  {/* 信息区域 */}
                  <div className="p-4">
                    {/* 标题 + 英文 */}
                    <h4 className="text-[15px] font-semibold text-gray-900 mb-1">
                      {option.name}
                    </h4>
                    {option.nameEn && option.nameEn !== option.name && (
                      <p className="text-[12px] text-gray-400 mb-2">
                        {option.nameEn}
                      </p>
                    )}

                    {/* 描述 */}
                    {option.description && (
                      <p className="text-[13px] text-gray-500 line-clamp-2 mb-3">
                        {option.description}
                      </p>
                    )}

                    {/* 亮点标签 (最多显示2个) */}
                    {option.highlights && option.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {option.highlights.slice(0, 2).map((h, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-wabi-100 text-[11px] text-gray-600 rounded"
                          >
                            <Check className="w-2.5 h-2.5 text-sakura-500" />
                            {h}
                          </span>
                        ))}
                        {option.highlights.length > 2 && (
                          <span className="px-2 py-0.5 text-[11px] text-gray-400">
                            +{option.highlights.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 价格 + 添加按钮 */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-[16px] font-semibold text-sakura-600">
                        +¥{(option.price / 100).toLocaleString()}
                      </span>
                      <button
                        onClick={(e) => handleToggle(option, e)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium
                          transition-all duration-200
                          ${added
                            ? "bg-sakura-500 text-white hover:bg-sakura-600"
                            : "bg-gray-100 text-gray-700 hover:bg-sakura-50 hover:text-sakura-600"
                          }
                        `}
                      >
                        {added ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            已添加
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            添加
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部说明 */}
      <p className="text-center text-[12px] text-wabi-400">
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
