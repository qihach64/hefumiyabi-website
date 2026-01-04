"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Plus,
  Check,
  Star,
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ImageIcon,
  Tag,
  JapaneseYen,
  Search,
  Package,
} from "lucide-react";
import ImageUploader from "@/components/ImageUploader";

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
  };
}

interface EditState {
  images: string[];
  highlights: string[];
  price: number | null;
  isDirty: boolean;
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

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 高亮编辑
  const [newHighlight, setNewHighlight] = useState("");

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

  // ==================== 选择逻辑 ====================

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
    if (config) updateConfig(merchantComponentId, { isPopular: !config.isPopular });
  };

  const setPriceOverride = (merchantComponentId: string, price: string) => {
    const numPrice = price ? Math.round(parseFloat(price) * 100) : null;
    updateConfig(merchantComponentId, { priceOverride: numPrice });
  };

  // ==================== 编辑逻辑 ====================

  const startEditing = (upgrade: AvailableUpgrade) => {
    setEditingId(upgrade.id);
    setEditState({
      images: [...upgrade.images],
      highlights: [...upgrade.highlights],
      price: upgrade.price === upgrade.template.basePrice ? null : upgrade.price,
      isDirty: false,
    });
    setSaveMessage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditState(null);
    setNewHighlight("");
    setSaveMessage(null);
  };

  const updateEditState = (updates: Partial<EditState>) => {
    setEditState((prev) => (prev ? { ...prev, ...updates, isDirty: true } : null));
  };

  const addHighlight = () => {
    if (!newHighlight.trim() || !editState) return;
    const trimmed = newHighlight.trim();
    if (editState.highlights.includes(trimmed)) return;
    updateEditState({ highlights: [...editState.highlights, trimmed] });
    setNewHighlight("");
  };

  const removeHighlight = (index: number) => {
    if (!editState) return;
    updateEditState({ highlights: editState.highlights.filter((_, i) => i !== index) });
  };

  const saveEditing = async () => {
    if (!editingId || !editState) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/merchant/upgrades/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: editState.images,
          highlights: editState.highlights,
          price: editState.price,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "保存失败");
      }

      const { upgrade } = await res.json();

      setAvailableUpgrades((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? { ...u, images: upgrade.images, highlights: upgrade.highlights, price: upgrade.price }
            : u
        )
      );

      setSaveMessage({ type: "success", text: "保存成功" });
      setEditState((prev) => (prev ? { ...prev, isDirty: false } : null));

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async (upgradeId: string) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/merchant/upgrades/${upgradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [], highlights: [], price: null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "重置失败");
      }

      await fetchUpgrades();

      if (editingId === upgradeId) {
        setEditState({ images: [], highlights: [], price: null, isDirty: false });
      }

      setSaveMessage({ type: "success", text: "已重置为默认" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "重置失败" });
    } finally {
      setIsSaving(false);
    }
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
              {stats.popular} 人气
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
            const isEditing = editingId === upgrade.id;
            const effectivePrice = config?.priceOverride ?? upgrade.price;
            const hasCustomContent = upgrade.images.length > 0 || upgrade.highlights.length > 0;

            return (
              <div
                key={upgrade.id}
                className={`
                  bg-white rounded-xl border overflow-hidden transition-all duration-300
                  ${selected ? "border-sakura-300 shadow-sm" : "border-gray-200 hover:border-gray-300"}
                  ${isEditing ? "ring-2 ring-sakura-200" : ""}
                `}
              >
                {/* ========== 主行 ========== */}
                <div className="flex items-center gap-4 p-4">
                  {/* 选择框 */}
                  <button
                    type="button"
                    onClick={() => toggleUpgrade(upgrade)}
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${selected
                        ? "bg-sakura-500 border-sakura-500"
                        : "border-gray-300 hover:border-sakura-400"
                      }
                    `}
                  >
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </button>

                  {/* 图标/缩略图 */}
                  {upgrade.images.length > 0 ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={upgrade.images[0]}
                        alt={upgrade.template.name}
                        fill
                        className="object-cover"
                        sizes="48px"
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
                        w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0
                        ${selected ? "bg-sakura-50" : "bg-gray-100"}
                      `}
                    >
                      {upgrade.template.icon || "✨"}
                    </div>
                  )}

                  {/* 信息区 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-[15px] font-medium text-gray-900 truncate">
                        {upgrade.template.name}
                      </h4>
                      {config?.isPopular && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          人気
                        </span>
                      )}
                      {hasCustomContent && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">
                          已自定义
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-500 line-clamp-1">
                      {upgrade.highlights.length > 0
                        ? upgrade.highlights.slice(0, 3).join(" · ")
                        : upgrade.template.description || "点击展开编辑"}
                    </p>
                  </div>

                  {/* 价格 */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[15px] font-semibold text-sakura-600">
                      ¥{(effectivePrice / 100).toLocaleString()}
                    </span>
                    {config?.priceOverride && (
                      <p className="text-[11px] text-gray-400 line-through">
                        ¥{(upgrade.price / 100).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* 展开/收起按钮 */}
                  <button
                    type="button"
                    onClick={() => (isEditing ? cancelEditing() : startEditing(upgrade))}
                    className={`
                      p-2 rounded-lg transition-all flex-shrink-0
                      ${isEditing
                        ? "bg-sakura-100 text-sakura-600"
                        : "bg-gray-100 text-gray-500 hover:bg-sakura-50 hover:text-sakura-600"
                      }
                    `}
                    title={isEditing ? "收起" : "展开编辑"}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${isEditing ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {/* ========== 已选配置（快捷操作） ========== */}
                {selected && !isEditing && (
                  <div className="px-4 pb-3 flex items-center gap-4 border-t border-gray-100 pt-3 bg-gray-50/50">
                    {/* 人气标记 */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => togglePopular(upgrade.id)}
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
                      <span className="text-[13px] text-gray-600">人气推荐</span>
                    </label>

                    {/* 套餐价格覆盖 */}
                    <div className="flex items-center gap-2">
                      <JapaneseYen className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[13px] text-gray-600">套餐价：</span>
                      <input
                        type="number"
                        value={config?.priceOverride ? config.priceOverride / 100 : ""}
                        onChange={(e) => setPriceOverride(upgrade.id, e.target.value)}
                        placeholder={(upgrade.price / 100).toString()}
                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-[13px] text-center
                                 focus:ring-1 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
                      />
                      {config?.priceOverride && (
                        <button
                          type="button"
                          onClick={() => setPriceOverride(upgrade.id, "")}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="恢复默认"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ========== 编辑面板 ========== */}
                {isEditing && editState && (
                  <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
                    <div className="p-6 space-y-6">
                      {/* 图片编辑区 */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
                          <span className="text-[11px] uppercase tracking-[0.2em] text-sakura-500 font-medium flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Service Images
                          </span>
                        </div>
                        <ImageUploader
                          category="upgrade"
                          entityId={upgrade.id}
                          purpose="gallery"
                          multiple
                          maxFiles={6}
                          value={editState.images}
                          onChange={(urls) => updateEditState({ images: urls })}
                          aspectRatio="4:3"
                        />
                        <p className="text-[12px] text-gray-400 mt-2">
                          支持批量上传，最多 6 张，建议尺寸 800×600
                        </p>
                      </div>

                      {/* 亮点编辑区 */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
                          <span className="text-[11px] uppercase tracking-[0.2em] text-sakura-500 font-medium flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Service Highlights
                          </span>
                        </div>

                        {/* 已有标签 */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editState.highlights.map((highlight, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sakura-50 text-sakura-700 rounded-lg text-[13px] group"
                            >
                              <ChevronRight className="w-3 h-3 text-sakura-400" />
                              {highlight}
                              <button
                                type="button"
                                onClick={() => removeHighlight(index)}
                                className="p-0.5 hover:bg-sakura-200 rounded-full transition-colors ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {editState.highlights.length === 0 && (
                            <span className="text-[13px] text-gray-400 italic">
                              暂无亮点，添加一些服务特色吧
                            </span>
                          )}
                        </div>

                        {/* 添加新标签 */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newHighlight}
                            onChange={(e) => setNewHighlight(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addHighlight();
                              }
                            }}
                            placeholder="输入亮点，按回车添加"
                            maxLength={20}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-[14px]
                                     focus:ring-2 focus:ring-sakura-100 focus:border-sakura-400 transition-all"
                          />
                          <button
                            type="button"
                            onClick={addHighlight}
                            disabled={!newHighlight.trim()}
                            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-[14px] font-medium
                                     hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 价格编辑区 */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
                          <span className="text-[11px] uppercase tracking-[0.2em] text-sakura-500 font-medium flex items-center gap-1.5">
                            <JapaneseYen className="w-3.5 h-3.5" />
                            Default Price
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">
                              ¥
                            </span>
                            <input
                              type="number"
                              value={editState.price !== null ? editState.price / 100 : ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateEditState({
                                  price: val ? Math.round(parseFloat(val) * 100) : null,
                                });
                              }}
                              placeholder={(upgrade.template.basePrice / 100).toString()}
                              className="w-32 pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-[14px]
                                       focus:ring-2 focus:ring-sakura-100 focus:border-sakura-400 transition-all"
                            />
                          </div>
                          <div className="text-[13px] text-gray-500">
                            <span className="text-gray-400">平台建议价：</span>
                            <span className="font-medium">¥{(upgrade.template.basePrice / 100).toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="text-[12px] text-gray-400 mt-2">
                          留空则使用平台建议价，此价格为所有套餐的默认价格
                        </p>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => resetToDefaults(upgrade.id)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700
                                   text-[14px] transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-100"
                        >
                          <RotateCcw className="w-4 h-4" />
                          重置为默认
                        </button>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className="px-5 py-2 border border-gray-200 text-gray-700 rounded-xl text-[14px] font-medium
                                     hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={saveEditing}
                            disabled={isSaving || !editState.isDirty}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-sakura-500 text-white rounded-xl text-[14px] font-medium
                                     hover:bg-sakura-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                保存中...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                保存修改
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ==================== 底部提示 ==================== */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-[12px] text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          编辑的内容会应用到所有使用该升级服务的套餐
        </p>
      </div>
    </div>
  );
}
