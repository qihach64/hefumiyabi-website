"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Plus, Check, ChevronRight, X, Sparkles, Info, Package } from "lucide-react";
import type { SelectedUpgrade } from "@/components/PlanDetailClient";

// 升级选项类型
interface UpgradeOption {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  detailedDescription: string;
  price: number;
  icon: string;
  category: UpgradeCategory;
  popular?: boolean;
  highlights?: string[];
  images: string[];
}

// 升级分类
type UpgradeCategory = "PHOTOGRAPHY" | "STYLING" | "TIME";

// 分类配置（类似 ServiceMap 的 OUTFIT_CATEGORY_CONFIG）
const UPGRADE_CATEGORY_CONFIG: Record<UpgradeCategory, { label: string; icon: string; order: number }> = {
  PHOTOGRAPHY: { label: "摄影服务", icon: "📸", order: 1 },
  STYLING: { label: "造型服务", icon: "💄", order: 2 },
  TIME: { label: "时间延长", icon: "⏰", order: 3 },
};

interface UpgradeServicesProps {
  selectedUpgrades: SelectedUpgrade[];
  onAddUpgrade: (upgrade: SelectedUpgrade) => void;
  onRemoveUpgrade: (upgradeId: string) => void;
}

// 升级选项数据
const UPGRADE_OPTIONS: UpgradeOption[] = [
  {
    id: "photo",
    name: "专业摄影",
    nameEn: "Professional Photography",
    description: "专业摄影师跟拍 30 分钟，含 20 张精修照片",
    detailedDescription: "由资深摄影师全程跟拍，在清水寺、祇園、花见小路等京都最具代表性的景点为您留下珍贵回忆。我们的摄影师深谙和服之美与京都风情的完美融合，善于捕捉最自然、最动人的瞬间。",
    price: 300000,
    icon: "📷",
    category: "PHOTOGRAPHY",
    popular: true,
    highlights: ["专业摄影师全程跟拍", "30分钟外景拍摄", "20张精修照片", "3个工作日内交付"],
    images: [
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=500&fit=crop",
    ],
  },
  {
    id: "makeup",
    name: "专业化妆",
    nameEn: "Professional Makeup",
    description: "资深化妆师全脸妆容，含卸妆",
    detailedDescription: "由经验丰富的化妆师为您打造与和服完美搭配的精致妆容。根据您选择的和服色系和个人特点，设计最适合的妆面，让您在镜头前更加自信动人。服务包含卸妆，方便您结束体验后的行程。",
    price: 250000,
    icon: "💄",
    category: "STYLING",
    highlights: ["资深化妆师打造", "根据和服配色设计", "全脸精致妆容", "含专业卸妆服务"],
    images: [
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop",
    ],
  },
  {
    id: "premium-hairstyle",
    name: "高级发型",
    nameEn: "Premium Hairstyle",
    description: "复杂盘发造型，含发饰",
    detailedDescription: "专业造型师为您设计复杂精美的传统盘发造型，搭配精选发饰，完美呈现日式典雅之美。使用专业定型产品，确保发型在整个体验过程中保持完美状态，让您尽情享受和服时光。",
    price: 200000,
    icon: "✂️",
    category: "STYLING",
    highlights: ["专业造型师设计", "复杂传统盘发", "精选发饰搭配", "持久定型效果"],
    images: [
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1522338242042-2d1c2c28d392?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop",
    ],
  },
  {
    id: "extension",
    name: "延长归还",
    nameEn: "Extended Return",
    description: "延长 2 小时归还时间",
    detailedDescription: "为您的和服体验增加额外 2 小时的美好时光。无需匆忙赶回，可以更从容地游览景点、拍摄照片，充分享受穿着和服漫步京都的独特体验。适合想要深度体验或前往较远景点的客人。",
    price: 100000,
    icon: "⏰",
    category: "TIME",
    highlights: ["额外2小时体验时间", "更灵活的行程安排", "更多景点拍照时间", "无需匆忙归还"],
    images: [
      "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&h=500&fit=crop",
    ],
  },
];

// 分类分组
interface CategoryGroup {
  key: UpgradeCategory;
  label: string;
  icon: string;
  items: UpgradeOption[];
}

export default function UpgradeServices({
  selectedUpgrades,
  onAddUpgrade,
  onRemoveUpgrade,
}: UpgradeServicesProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "detail">("list");

  // Refs for scroll-into-view
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 自动选中第一个选项
  useEffect(() => {
    if (!selectedItemId && UPGRADE_OPTIONS.length > 0) {
      setSelectedItemId(UPGRADE_OPTIONS[0].id);
    }
  }, [selectedItemId]);

  const isSelected = (id: string) => selectedUpgrades.some((u) => u.id === id);

  const handleToggle = useCallback((option: UpgradeOption) => {
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
  }, [selectedUpgrades, onAddUpgrade, onRemoveUpgrade]);

  // 点击选项
  const handleItemClick = useCallback((item: UpgradeOption) => {
    setSelectedItemId(item.id);
    setActiveTab("detail");
    setShowMobileDetail(true);
  }, []);

  // 按分类分组
  const categoryGroups: CategoryGroup[] = Object.entries(UPGRADE_CATEGORY_CONFIG)
    .map(([key, config]) => ({
      key: key as UpgradeCategory,
      label: config.label,
      icon: config.icon,
      items: UPGRADE_OPTIONS.filter(item => item.category === key),
    }))
    .filter(group => group.items.length > 0)
    .sort((a, b) => UPGRADE_CATEGORY_CONFIG[a.key].order - UPGRADE_CATEGORY_CONFIG[b.key].order);

  // 当前选中的选项
  const selectedItem = UPGRADE_OPTIONS.find(item => item.id === selectedItemId);

  // 已选中的升级服务数量和总价
  const selectedCount = selectedUpgrades.length;
  const selectedTotal = selectedUpgrades.reduce((sum, u) => sum + u.price, 0);

  return (
    <div className="space-y-6">
      {/* 区块标题 - 与 ServiceMap 一致 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
        <span className="text-[11px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
          Optional Upgrades
        </span>
      </div>

      {/* 主容器 - 与 ServiceMap 布局一致 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* 已选摘要 - 只在有选择时显示 */}
        {selectedCount > 0 && (
          <div className="px-6 py-2.5 bg-sakura-50 border-b border-sakura-100 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-sakura-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-medium text-sakura-700">
              已选 {selectedCount} 项
            </span>
            <span className="text-[13px] text-sakura-600">
              +¥{(selectedTotal / 100).toLocaleString()}
            </span>
          </div>
        )}

        {/* ==================== 桌面端布局 ==================== */}
        <div className="hidden lg:flex h-[500px]">
          {/* Tab 切换区域 - 与 ServiceMap 右侧布局一致 */}
          <div className="w-full flex flex-col">
            {/* Tab 标签栏 */}
            <div className="h-12 px-2 bg-gray-50/80 border-b border-gray-100 flex items-center gap-1">
              <button
                onClick={() => setActiveTab("list")}
                className={`
                  flex-1 h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-200
                  ${activeTab === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Package className="w-4 h-4" />
                  升级选项
                </span>
              </button>
              <button
                onClick={() => setActiveTab("detail")}
                className={`
                  flex-1 h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-200
                  ${activeTab === "detail"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }
                  ${selectedItem ? "" : "opacity-50 cursor-not-allowed"}
                `}
                disabled={!selectedItem}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Info className="w-4 h-4" />
                  详情
                  {selectedItem && (
                    <span className="w-2 h-2 rounded-full bg-sakura-500" />
                  )}
                </span>
              </button>
            </div>

            {/* Tab 内容区域 */}
            <div className="flex-1 overflow-hidden">
              {/* Tab 1: 升级选项列表 */}
              <div className={`h-full overflow-y-auto ${activeTab === "list" ? "block" : "hidden"}`}>
                <div className="p-4">
                  <div className="space-y-4">
                    {categoryGroups.map((group) => (
                      <div key={group.key}>
                        {/* 分类小标题 */}
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className="text-[14px]">{group.icon}</span>
                          <span className="text-[12px] text-gray-500 font-medium">{group.label}</span>
                          <span className="text-[11px] text-gray-400">({group.items.length})</span>
                        </div>

                        {/* 选项按钮 - 网格布局 */}
                        <div className="grid grid-cols-2 gap-2">
                          {group.items.map((item) => {
                            const added = isSelected(item.id);
                            return (
                              <button
                                key={item.id}
                                ref={(el) => {
                                  if (el) itemRefs.current.set(item.id, el);
                                }}
                                onClick={() => handleItemClick(item)}
                                onMouseEnter={() => setHoveredItemId(item.id)}
                                onMouseLeave={() => setHoveredItemId(null)}
                                className={`
                                  relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150
                                  ${selectedItemId === item.id
                                    ? "bg-sakura-100 ring-1 ring-sakura-400"
                                    : hoveredItemId === item.id
                                      ? "bg-sakura-50"
                                      : "bg-gray-50 hover:bg-gray-100"
                                  }
                                `}
                              >
                                {/* 人气标签 */}
                                {item.popular && (
                                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 bg-sakura-500 text-white text-[9px] font-medium rounded-full">
                                    人気
                                  </span>
                                )}

                                <span className="text-[16px]">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[12px] font-medium text-gray-700 block truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-[11px] text-sakura-600 font-medium">
                                    +¥{(item.price / 100).toLocaleString()}
                                  </span>
                                </div>
                                {added && (
                                  <div className="w-5 h-5 rounded-full bg-sakura-500 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tab 2: 详情面板 */}
              <div className={`h-full flex flex-col ${activeTab === "detail" ? "block" : "hidden"}`}>
                {selectedItem ? (
                  <>
                    {/* 详情头部 */}
                    <div className="p-5 border-b border-gray-100 bg-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-sakura-100">
                          {selectedItem.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[16px] font-semibold text-gray-900 mb-0.5">
                            {selectedItem.name}
                          </h3>
                          <p className="text-[11px] text-gray-400 mb-1">{selectedItem.nameEn}</p>
                          <span className="text-[14px] font-semibold text-sakura-600">
                            +¥{(selectedItem.price / 100).toLocaleString()}
                            <span className="text-[11px] font-normal text-gray-400 ml-1">/ 人</span>
                          </span>
                        </div>
                        {/* 添加按钮 */}
                        <button
                          onClick={() => handleToggle(selectedItem)}
                          className={`
                            px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center gap-1.5
                            ${isSelected(selectedItem.id)
                              ? "bg-sakura-500 text-white hover:bg-sakura-600"
                              : "bg-white border border-sakura-300 text-sakura-600 hover:bg-sakura-50"
                            }
                          `}
                        >
                          {isSelected(selectedItem.id) ? (
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
                      </div>
                    </div>

                    {/* 详情内容 */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                      {/* 图片画廊 */}
                      {selectedItem.images && selectedItem.images.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            服务展示
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedItem.images.slice(0, 3).map((img, i) => (
                              <button
                                key={i}
                                onClick={() => setLightboxImage(img)}
                                className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-sakura-400 transition-all group"
                              >
                                <Image
                                  src={img}
                                  alt={`${selectedItem.name} 图片 ${i + 1}`}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="150px"
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-4 h-4 text-gray-700" />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 描述 */}
                      <div>
                        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          服务简介
                        </h4>
                        <p className="text-[14px] text-gray-600 leading-relaxed">
                          {selectedItem.detailedDescription}
                        </p>
                      </div>

                      {/* 亮点 */}
                      {selectedItem.highlights && selectedItem.highlights.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            服务亮点
                          </h4>
                          <div className="space-y-2">
                            {selectedItem.highlights.map((h, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 px-3 py-2.5 bg-gray-50 rounded-lg"
                              >
                                <ChevronRight className="w-4 h-4 text-sakura-400 flex-shrink-0 mt-0.5" />
                                <span className="text-[13px] text-gray-700 leading-relaxed">{h}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* 未选中状态 */
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-[13px] text-gray-500 mb-1">请先选择一个选项</p>
                      <p className="text-[12px] text-gray-400">点击列表项查看详情</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 移动端布局 ==================== */}
        <div className="lg:hidden">
          {/* 选项列表 */}
          <div className="p-4">
            <div className="space-y-3">
              {categoryGroups.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[14px]">{group.icon}</span>
                    <span className="text-[11px] text-gray-500">{group.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const added = isSelected(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`
                            relative flex flex-col items-center p-3 rounded-xl transition-all duration-200
                            ${selectedItemId === item.id
                              ? "bg-sakura-50 ring-2 ring-sakura-400"
                              : "bg-gray-50 hover:bg-gray-100"
                            }
                          `}
                        >
                          {item.popular && (
                            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-sakura-500 text-white text-[9px] font-medium rounded-full">
                              人気
                            </span>
                          )}
                          <span className="text-xl mb-1">{item.icon}</span>
                          <span className="text-[11px] font-medium text-gray-700 text-center line-clamp-1">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-sakura-600 font-medium mt-0.5">
                            +¥{(item.price / 100).toLocaleString()}
                          </span>
                          {added && (
                            <div className="absolute -top-1 -left-1 w-5 h-5 bg-sakura-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 移动端底部抽屉 - 与 ServiceMap 一致 */}
        {showMobileDetail && selectedItem && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* 遮罩 */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMobileDetail(false)}
            />

            {/* 抽屉内容 */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
              {/* 拖拽指示 */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* 头部 */}
              <div className="flex items-start justify-between px-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-sakura-100">
                    {selectedItem.icon}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-gray-900">
                      {selectedItem.name}
                    </h3>
                    <span className="text-[14px] font-semibold text-sakura-600">
                      +¥{(selectedItem.price / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* 内容 */}
              <div className="px-5 pb-5 space-y-4 overflow-y-auto max-h-[45vh]">
                {/* 图片画廊 - 移动端 */}
                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {selectedItem.images.slice(0, 3).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setShowMobileDetail(false);
                          setLightboxImage(img);
                        }}
                        className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100"
                      >
                        <Image
                          src={img}
                          alt={`${selectedItem.name} 图片 ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[14px] text-gray-600 leading-relaxed">
                  {selectedItem.detailedDescription}
                </p>

                {selectedItem.highlights && selectedItem.highlights.length > 0 && (
                  <div className="space-y-1.5">
                    {selectedItem.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                      >
                        <ChevronRight className="w-4 h-4 text-sakura-400" />
                        <span className="text-[13px] text-gray-700">{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部添加按钮 */}
              <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleToggle(selectedItem);
                  }}
                  className={`
                    w-full py-3 rounded-xl text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2
                    ${isSelected(selectedItem.id)
                      ? "bg-sakura-500 text-white"
                      : "bg-sakura-500 text-white"
                    }
                  `}
                >
                  {isSelected(selectedItem.id) ? (
                    <>
                      <Check className="w-5 h-5" />
                      已添加 · 点击移除
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
      </div>

      {/* ==================== Lightbox 图片查看器 ==================== */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxImage}
              alt="放大查看"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 80vw"
              priority
              unoptimized
            />
          </div>

          {selectedItem && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-full">
              <p className="text-white text-sm font-medium">
                {selectedItem.icon} {selectedItem.name}
              </p>
            </div>
          )}

          <p className="absolute bottom-4 right-4 text-white/50 text-xs">
            点击任意处关闭
          </p>
        </div>
      )}

      {/* 底部说明 */}
      <p className="text-center text-[12px] text-gray-400">
        增值服务将在预订确认时一并结算
      </p>
    </div>
  );
}
