"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Check, ChevronLeft, ChevronRight, Camera, Palette, Scissors, Clock, ArrowRight } from "lucide-react";
import type { SelectedUpgrade } from "@/components/PlanDetailClient";

interface UpgradeOption {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  detailedDescription: string;
  price: number;
  icon: React.ReactNode;
  iconType: "camera" | "palette" | "scissors" | "clock";
  popular?: boolean;
  highlights?: string[];
  images: string[];
  serviceFlow: string[];
}

interface UpgradeServicesProps {
  selectedUpgrades: SelectedUpgrade[];
  onAddUpgrade: (upgrade: SelectedUpgrade) => void;
  onRemoveUpgrade: (upgradeId: string) => void;
}

// 升级选项配置 - 扩展数据
const UPGRADE_OPTIONS: UpgradeOption[] = [
  {
    id: "photo",
    name: "专业摄影",
    nameEn: "Professional Photography",
    description: "专业摄影师跟拍 30 分钟，含 20 张精修照片",
    detailedDescription: "由资深摄影师全程跟拍，在清水寺、祇園、花见小路等京都最具代表性的景点为您留下珍贵回忆。我们的摄影师深谙和服之美与京都风情的完美融合，善于捕捉最自然、最动人的瞬间。",
    price: 300000,
    icon: <Camera className="w-5 h-5" />,
    iconType: "camera",
    popular: true,
    highlights: ["专业摄影师", "30分钟跟拍", "20张精修", "3日内交付"],
    images: [
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    ],
    serviceFlow: ["店铺出发", "景点选择", "30分钟拍摄", "精修交付"],
  },
  {
    id: "makeup",
    name: "专业化妆",
    nameEn: "Professional Makeup",
    description: "资深化妆师全脸妆容，含卸妆",
    detailedDescription: "由经验丰富的化妆师为您打造与和服完美搭配的精致妆容。根据您选择的和服色系和个人特点，设计最适合的妆面，让您在镜头前更加自信动人。服务包含卸妆，方便您结束体验后的行程。",
    price: 250000,
    icon: <Palette className="w-5 h-5" />,
    iconType: "palette",
    highlights: ["资深化妆师", "全脸妆容", "和服配色", "含卸妆"],
    images: [
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&q=80",
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    ],
    serviceFlow: ["肤质分析", "底妆打造", "眼妆唇妆", "定妆完成"],
  },
  {
    id: "premium-hairstyle",
    name: "高级发型",
    nameEn: "Premium Hairstyle",
    description: "复杂盘发造型，含发饰",
    detailedDescription: "专业造型师为您设计复杂精美的传统盘发造型，搭配精选发饰，完美呈现日式典雅之美。使用专业定型产品，确保发型在整个体验过程中保持完美状态，让您尽情享受和服时光。",
    price: 200000,
    icon: <Scissors className="w-5 h-5" />,
    iconType: "scissors",
    highlights: ["复杂盘发", "精选发饰", "持久定型", "专业造型师"],
    images: [
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80",
      "https://images.unsplash.com/photo-1522338242042-2d1c2c28d392?w=800&q=80",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80",
    ],
    serviceFlow: ["发型咨询", "盘发造型", "发饰搭配", "定型完成"],
  },
  {
    id: "extension",
    name: "延长归还",
    nameEn: "Extended Return",
    description: "延长 2 小时归还时间",
    detailedDescription: "为您的和服体验增加额外 2 小时的美好时光。无需匆忙赶回，可以更从容地游览景点、拍摄照片，充分享受穿着和服漫步京都的独特体验。适合想要深度体验或前往较远景点的客人。",
    price: 100000,
    icon: <Clock className="w-5 h-5" />,
    iconType: "clock",
    highlights: ["额外2小时", "灵活安排", "更多拍照时间", "无需匆忙"],
    images: [
      "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=800&q=80",
      "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800&q=80",
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80",
    ],
    serviceFlow: ["原定归还", "延长确认", "继续游览", "新时间归还"],
  },
];

// 图标渲染组件
function UpgradeIcon({ type, className }: { type: UpgradeOption["iconType"]; className?: string }) {
  const iconClass = className || "w-5 h-5";
  switch (type) {
    case "camera":
      return <Camera className={iconClass} />;
    case "palette":
      return <Palette className={iconClass} />;
    case "scissors":
      return <Scissors className={iconClass} />;
    case "clock":
      return <Clock className={iconClass} />;
  }
}

export default function UpgradeServices({
  selectedUpgrades,
  onAddUpgrade,
  onRemoveUpgrade,
}: UpgradeServicesProps) {
  // Tab 状态: "overview" | "details"
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");
  // 详情 Tab 中当前选中的选项
  const [detailOptionId, setDetailOptionId] = useState<string>(UPGRADE_OPTIONS[0].id);
  // 图片轮播当前索引
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isSelected = (id: string) => selectedUpgrades.some((u) => u.id === id);

  const handleToggle = (upgrade: UpgradeOption) => {
    if (isSelected(upgrade.id)) {
      onRemoveUpgrade(upgrade.id);
    } else {
      onAddUpgrade({
        id: upgrade.id,
        name: upgrade.name,
        price: upgrade.price,
        icon: "",
      });
    }
  };

  // 切换到详情 Tab 并定位到指定选项
  const goToDetails = (optionId: string) => {
    setDetailOptionId(optionId);
    setCurrentImageIndex(0);
    setActiveTab("details");
  };

  // 获取当前详情选项
  const currentDetailOption = UPGRADE_OPTIONS.find((o) => o.id === detailOptionId) || UPGRADE_OPTIONS[0];

  // 图片轮播控制
  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === currentDetailOption.images.length - 1 ? 0 : prev + 1
    );
  };
  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? currentDetailOption.images.length - 1 : prev - 1
    );
  };

  return (
    <section className="py-2">
      {/* Section Header - Wafu Style */}
      <div className="mb-6">
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

        {/* Selected summary */}
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

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-50 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("overview")}
          className={`
            px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200
            ${activeTab === "overview"
              ? "bg-white text-[#3D3A38] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          一覧
          <span className="ml-1.5 text-[11px] text-gray-400">Overview</span>
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`
            px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200
            ${activeTab === "details"
              ? "bg-white text-[#3D3A38] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }
          `}
        >
          詳細
          <span className="ml-1.5 text-[11px] text-gray-400">Details</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        /* ===== 一覧 Tab: Compact Card Grid ===== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {UPGRADE_OPTIONS.map((upgrade) => {
            const selected = isSelected(upgrade.id);

            return (
              <div
                key={upgrade.id}
                className={`
                  relative bg-white rounded-xl transition-all duration-200 p-4
                  ${selected
                    ? "bg-sakura-50/50 border border-sakura-300 shadow-sm"
                    : "border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }
                `}
              >
                {/* Popular Badge */}
                {upgrade.popular && !selected && (
                  <div className="absolute -top-2 right-3 z-10">
                    <span className="px-2 py-0.5 bg-sakura-500 text-white text-[10px] font-medium rounded-full shadow-sm">
                      人気
                    </span>
                  </div>
                )}

                {/* Card Content - Compact */}
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                      ${selected ? "bg-sakura-100 text-sakura-600" : "bg-gray-50 text-gray-400"}
                    `}
                  >
                    {upgrade.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`
                        text-[14px] font-medium tracking-wide transition-colors
                        ${selected ? "text-sakura-800" : "text-[#3D3A38]"}
                      `}
                    >
                      {upgrade.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 truncate">
                      {upgrade.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div
                    className={`
                      text-[15px] font-semibold flex-shrink-0 transition-colors
                      ${selected ? "text-sakura-600" : "text-[#3D3A38]"}
                    `}
                  >
                    +¥{(upgrade.price / 100).toLocaleString()}
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-3 flex items-center gap-2">
                  {/* Add/Remove Button */}
                  <button
                    onClick={() => handleToggle(upgrade)}
                    className={`
                      flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-200
                      ${selected
                        ? "bg-sakura-500 text-white hover:bg-sakura-600"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-sakura-300 hover:text-sakura-600"
                      }
                    `}
                  >
                    {selected ? (
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

                  {/* View Details Button */}
                  <button
                    onClick={() => goToDetails(upgrade.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] text-gray-500 hover:text-sakura-600 hover:bg-gray-50 transition-all"
                  >
                    详情
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== 詳細 Tab: Image Gallery + Full Description ===== */
        <div>
          {/* Option Selector - Icon Pills */}
          <div className="flex gap-2 mb-6 pb-4 border-b border-gray-100">
            {UPGRADE_OPTIONS.map((upgrade) => {
              const isActive = detailOptionId === upgrade.id;
              const selected = isSelected(upgrade.id);

              return (
                <button
                  key={upgrade.id}
                  onClick={() => {
                    setDetailOptionId(upgrade.id);
                    setCurrentImageIndex(0);
                  }}
                  className={`
                    relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? "bg-sakura-50 border border-sakura-200"
                      : "bg-white border border-gray-100 hover:border-gray-200"
                    }
                  `}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                      ${isActive ? "bg-sakura-100 text-sakura-600" : "bg-gray-50 text-gray-400"}
                    `}
                  >
                    <UpgradeIcon type={upgrade.iconType} className="w-4 h-4" />
                  </div>
                  <span
                    className={`
                      text-[11px] font-medium transition-colors
                      ${isActive ? "text-sakura-700" : "text-gray-500"}
                    `}
                  >
                    {upgrade.name}
                  </span>
                  {/* Selected indicator */}
                  {selected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sakura-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail Content */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Image Gallery */}
            <div className="relative aspect-[16/9] bg-gray-100">
              <Image
                src={currentDetailOption.images[currentImageIndex]}
                alt={currentDetailOption.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />

              {/* Image Navigation */}
              {currentDetailOption.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* Image Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {currentDetailOption.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`
                          w-2 h-2 rounded-full transition-all
                          ${idx === currentImageIndex
                            ? "bg-white w-4"
                            : "bg-white/60 hover:bg-white/80"
                          }
                        `}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Popular Badge */}
              {currentDetailOption.popular && (
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-sakura-500 text-white text-[11px] font-medium rounded-full shadow-sm">
                    人気 No.1
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-[18px] font-mincho tracking-wide text-[#3D3A38] mb-1">
                    {currentDetailOption.name}
                  </h4>
                  <p className="text-[12px] text-gray-400 tracking-wide">
                    {currentDetailOption.nameEn}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[20px] font-semibold text-[#3D3A38]">
                    +¥{(currentDetailOption.price / 100).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400">/ 人</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[14px] text-[#5C5854] leading-[1.8] mb-6">
                {currentDetailOption.detailedDescription}
              </p>

              {/* Service Flow */}
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-3">
                  服务流程
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {currentDetailOption.serviceFlow.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                        <span className="w-5 h-5 rounded-full bg-sakura-100 text-sakura-600 text-[11px] font-medium flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[12px] text-gray-600">{step}</span>
                      </div>
                      {idx < currentDetailOption.serviceFlow.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-3">
                  服务亮点
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentDetailOption.highlights?.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sakura-50 text-sakura-700 rounded-full text-[12px]"
                    >
                      <Check className="w-3 h-3" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleToggle(currentDetailOption)}
                className={`
                  w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-medium transition-all duration-200
                  ${isSelected(currentDetailOption.id)
                    ? "bg-sakura-500 text-white hover:bg-sakura-600"
                    : "bg-white border-2 border-sakura-400 text-sakura-600 hover:bg-sakura-50"
                  }
                `}
              >
                {isSelected(currentDetailOption.id) ? (
                  <>
                    <Check className="w-5 h-5" />
                    已添加到套餐
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    添加到套餐
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-6 text-center">
        <p className="text-[12px] text-gray-400">
          增值服务将在预订确认时一并结算
        </p>
      </div>
    </section>
  );
}
