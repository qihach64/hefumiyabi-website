"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Check,
  Star,
  X,
  Search,
  Package,
  Settings,
  JapaneseYen,
  Sparkles,
} from "lucide-react";
import ComponentEditModal, { type ComponentData } from "@/components/merchant/ComponentEditModal";

// ==================== 类型定义 ====================

export interface UpgradeConfig {
  merchantComponentId: string;
  priceOverride: number | null;
  isPopular: boolean;
  displayOrder: number;
}

interface AvailableUpgrade {
  id: string;
  templateId: string;
  isEnabled: boolean;
  price: number;
  images: string[];
  highlights: string[];
  template: {
    id: string;
    code: string;
    name: string;
    nameJa: string | null;
    nameEn: string | null;
    description: string | null;
    icon: string | null;
    basePrice: number;
    defaultImages?: string[];
    defaultHighlights?: string[];
  };
}

interface UpgradesTabProps {
  selectedUpgrades: UpgradeConfig[];
  onUpgradesChange: (configs: UpgradeConfig[]) => void;
}

// ==================== 主组件 ====================

export default function UpgradesTab({
  selectedUpgrades,
  onUpgradesChange,
}: UpgradesTabProps) {
  // 数据状态
  const [availableUpgrades, setAvailableUpgrades] = useState<AvailableUpgrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 搜索
  const [searchQuery, setSearchQuery] = useState("");

  // 库编辑 Modal
  const [editingComponent, setEditingComponent] = useState<AvailableUpgrade | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ==================== 数据加载 ====================

  const fetchUpgrades = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant/upgrades");
      if (!res.ok) throw new Error("加载升级服务失败");
      const data = await res.json();
      setAvailableUpgrades(data.upgrades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpgrades();
  }, [fetchUpgrades]);

  // ==================== 计算属性 ====================

  const filteredUpgrades = useMemo(() => {
    if (!searchQuery.trim()) return availableUpgrades;
    const query = searchQuery.toLowerCase();
    return availableUpgrades.filter(
      (u) =>
        u.template.name.toLowerCase().includes(query) ||
        u.template.nameJa?.toLowerCase().includes(query) ||
        u.template.code.toLowerCase().includes(query)
    );
  }, [availableUpgrades, searchQuery]);

  const stats = useMemo(() => {
    const selected = selectedUpgrades.length;
    const popular = selectedUpgrades.filter((u) => u.isPopular).length;
    return { selected, popular };
  }, [selectedUpgrades]);

  // ==================== 辅助函数 ====================

  const isSelected = useCallback(
    (merchantComponentId: string) =>
      selectedUpgrades.some((u) => u.merchantComponentId === merchantComponentId),
    [selectedUpgrades]
  );

  const getConfig = useCallback(
    (merchantComponentId: string) =>
      selectedUpgrades.find((u) => u.merchantComponentId === merchantComponentId),
    [selectedUpgrades]
  );

  // ==================== 套餐配置逻辑 ====================

  const toggleUpgrade = (upgrade: AvailableUpgrade) => {
    if (isSelected(upgrade.id)) {
      onUpgradesChange(selectedUpgrades.filter((u) => u.merchantComponentId !== upgrade.id));
    } else {
      onUpgradesChange([
        ...selectedUpgrades,
        {
          merchantComponentId: upgrade.id,
          priceOverride: null,
          isPopular: false,
          displayOrder: selectedUpgrades.length,
        },
      ]);
    }
  };

  const updateConfig = (merchantComponentId: string, updates: Partial<UpgradeConfig>) => {
    onUpgradesChange(
      selectedUpgrades.map((u) =>
        u.merchantComponentId === merchantComponentId ? { ...u, ...updates } : u
      )
    );
  };

  const togglePopular = (merchantComponentId: string) => {
    const config = getConfig(merchantComponentId);
    if (config) {
      updateConfig(merchantComponentId, { isPopular: !config.isPopular });
    }
  };

  const setPriceOverride = (merchantComponentId: string, price: string) => {
    const numPrice = price ? Math.round(parseFloat(price) * 100) : null;
    updateConfig(merchantComponentId, { priceOverride: numPrice });
  };

  // ==================== 库编辑逻辑 ====================

  const handleSaveToLibrary = async (data: { id: string; images: string[]; highlights: string[] }) => {
    const res = await fetch(`/api/merchant/upgrades/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: data.images,
        highlights: data.highlights,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "保存失败");
    }

    const { upgrade } = await res.json();

    // 更新本地数据
    setAvailableUpgrades((prev) =>
      prev.map((u) =>
        u.id === data.id
          ? { ...u, images: upgrade.images, highlights: upgrade.highlights }
          : u
      )
    );

    setSaveMessage({ type: "success", text: "已保存到组件库" });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // ==================== 渲染 ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-sakura-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[14px] text-gray-500">加载升级服务...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
          <X className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-[14px] text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 rounded-lg text-[14px] text-gray-700 hover:bg-gray-200 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (availableUpgrades.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-[14px] text-gray-600 mb-2">暂无可用的升级服务</p>
        <p className="text-[13px] text-gray-400">请联系平台管理员添加升级服务模板</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==================== 顶部工具栏 ==================== */}
      <div className="flex items-center justify-between gap-4">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索升级服务..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-sakura-400 focus:bg-white transition-all"
          />
        </div>

        {/* 状态统计 */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-sakura-50 text-sakura-600 rounded-lg text-[13px] font-medium">
            {stats.selected} 已选
          </span>
          {stats.popular > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[13px] font-medium flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              {stats.popular} 推荐
            </span>
          )}
        </div>
      </div>

      {/* 保存提示 */}
      {saveMessage && (
        <div
          className={`px-4 py-3 rounded-xl text-[14px] flex items-center gap-2 ${
            saveMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {saveMessage.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {saveMessage.text}
        </div>
      )}

      {/* ==================== 升级服务列表 ==================== */}
      <div className="space-y-3">
        {filteredUpgrades.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-[14px]">
            未找到匹配的升级服务
          </div>
        ) : (
          filteredUpgrades.map((upgrade) => {
            const selected = isSelected(upgrade.id);
            const config = getConfig(upgrade.id);
            const effectivePrice = config?.priceOverride ?? upgrade.price;
            const hasCustomContent = upgrade.images.length > 0 || upgrade.highlights.length > 0;

            return (
              <div
                key={upgrade.id}
                className={`
                  bg-white rounded-xl border overflow-hidden transition-all duration-300
                  ${selected ? "border-sakura-300 shadow-sm" : "border-gray-200 hover:border-gray-300"}
                `}
              >
                <div className="flex">
                  {/* ========== 左侧：库信息（只读） ========== */}
                  <div
                    className={`
                      flex-1 p-4 cursor-pointer transition-colors
                      ${selected ? "bg-sakura-50/30" : "hover:bg-gray-50"}
                    `}
                    onClick={() => toggleUpgrade(upgrade)}
                  >
                    <div className="flex items-center gap-4">
                      {/* 选择框 */}
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${selected
                            ? "bg-sakura-500 border-sakura-500"
                            : "border-gray-300"
                          }
                        `}
                      >
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* 图标/缩略图 */}
                      {upgrade.images.length > 0 ? (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={upgrade.images[0]}
                            alt={upgrade.template.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                          {upgrade.images.length > 1 && (
                            <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/60 text-white text-[9px] rounded">
                              +{upgrade.images.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`
                            w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0
                            ${selected ? "bg-sakura-100" : "bg-gray-100"}
                          `}
                        >
                          {upgrade.template.icon || "✨"}
                        </div>
                      )}

                      {/* 信息区 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[15px] font-medium text-gray-900">
                            {upgrade.template.name}
                          </h4>
                          {hasCustomContent && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">
                              已自定义
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-gray-500 line-clamp-1">
                          {upgrade.highlights.length > 0
                            ? upgrade.highlights.slice(0, 3).join(" · ")
                            : upgrade.template.description || "暂无描述"}
                        </p>
                        <p className="text-[14px] font-medium text-sakura-600 mt-1">
                          ¥{(upgrade.price / 100).toLocaleString()}
                          <span className="text-[12px] text-gray-400 font-normal ml-1">
                            库默认价
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ========== 右侧：套餐配置 + 库编辑 ========== */}
                  <div className="flex items-stretch border-l border-gray-100">
                    {/* 套餐配置区 - 始终显示 */}
                    <div className={`
                      w-48 p-4 flex flex-col justify-center gap-3
                      ${selected ? "bg-sakura-50/50" : "bg-gray-50/50"}
                    `}>
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                        仅此套餐
                      </p>

                      {/* 推荐开关 */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selected) {
                              togglePopular(upgrade.id);
                            } else {
                              // 先选中，再设为推荐
                              onUpgradesChange([
                                ...selectedUpgrades,
                                {
                                  merchantComponentId: upgrade.id,
                                  priceOverride: null,
                                  isPopular: true,
                                  displayOrder: selectedUpgrades.length,
                                },
                              ]);
                            }
                          }}
                          className={`
                            w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                            ${config?.isPopular
                              ? "bg-amber-500 border-amber-500"
                              : "border-gray-300 hover:border-amber-400"
                            }
                          `}
                        >
                          {config?.isPopular && <Star className="w-2.5 h-2.5 text-white fill-white" />}
                        </button>
                        <span className="text-[13px] text-gray-600">设为推荐</span>
                      </label>

                      {/* 价格覆盖 */}
                      <div className="flex items-center gap-2">
                        <JapaneseYen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <input
                          type="number"
                          value={config?.priceOverride ? config.priceOverride / 100 : ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (selected) {
                              setPriceOverride(upgrade.id, e.target.value);
                            } else {
                              // 先选中，再设置价格
                              const numPrice = e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null;
                              onUpgradesChange([
                                ...selectedUpgrades,
                                {
                                  merchantComponentId: upgrade.id,
                                  priceOverride: numPrice,
                                  isPopular: false,
                                  displayOrder: selectedUpgrades.length,
                                },
                              ]);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="覆盖价格"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[13px] text-center
                                   focus:ring-1 focus:ring-sakura-200 focus:border-sakura-400 transition-all
                                   placeholder:text-gray-400"
                        />
                        {config?.priceOverride && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPriceOverride(upgrade.id, "");
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded flex-shrink-0"
                            title="恢复默认"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* 显示生效价格 */}
                      {selected && config?.priceOverride && (
                        <p className="text-[11px] text-sakura-600">
                          套餐价: ¥{(effectivePrice / 100).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* 库编辑按钮 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingComponent(upgrade);
                      }}
                      className="w-12 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors border-l border-gray-100"
                      title="编辑组件库"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* 选中后显示的指示条 */}
                {selected && (
                  <div className="h-1 bg-gradient-to-r from-sakura-400 to-sakura-500" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ==================== 底部说明 ==================== */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-[12px] text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          「仅此套餐」的设置随套餐保存，「⚙️ 编辑库」的修改会影响所有套餐
        </p>
      </div>

      {/* ==================== 库编辑 Modal ==================== */}
      {editingComponent && (
        <ComponentEditModal
          component={{
            id: editingComponent.id,
            name: editingComponent.template.name,
            nameJa: editingComponent.template.nameJa,
            nameEn: editingComponent.template.nameEn,
            icon: editingComponent.template.icon,
            description: editingComponent.template.description,
            images: editingComponent.images,
            highlights: editingComponent.highlights,
            defaultImages: editingComponent.template.defaultImages,
            defaultHighlights: editingComponent.template.defaultHighlights,
          }}
          onClose={() => setEditingComponent(null)}
          onSave={handleSaveToLibrary}
          imageCategory="upgrade"
          title={`编辑「${editingComponent.template.name}」`}
          saveButtonText="保存到组件库"
        />
      )}
    </div>
  );
}
