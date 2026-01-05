"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
  Clock,
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui";
import ImageUploader from "@/components/ImageUploader";
import CreateCustomServiceModal from "@/components/merchant/CreateCustomServiceModal";

// ==================== 类型定义 ====================

export interface UpgradeConfig {
  merchantComponentId: string;
  priceOverride: number | null;
  isPopular: boolean;
  displayOrder: number;
}

type ApprovalStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

interface AvailableUpgrade {
  id: string;
  templateId: string | null;
  isEnabled: boolean;
  price: number;
  images: string[];
  highlights: string[];
  // 自定义服务字段
  isCustom: boolean;
  approvalStatus: ApprovalStatus;
  adminFeedback: string | null;
  customName: string | null;
  customNameEn: string | null;
  customDescription: string | null;
  customIcon: string | null;
  customBasePrice: number | null;
  // 平台模板
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
  } | null;
}

interface UpgradesTabProps {
  selectedUpgrades: UpgradeConfig[];
  onUpgradesChange: (configs: UpgradeConfig[]) => void;
}

type FilterType = "all" | "platform" | "custom";

// ==================== 审核状态配置 ====================

const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "草稿", color: "bg-gray-100 text-gray-600", icon: <Clock className="w-3 h-3" /> },
  PENDING: { label: "审核中", color: "bg-amber-50 text-amber-600", icon: <Clock className="w-3 h-3" /> },
  APPROVED: { label: "已通过", color: "bg-green-50 text-green-600", icon: <CheckCircle2 className="w-3 h-3" /> },
  REJECTED: { label: "已驳回", color: "bg-red-50 text-red-600", icon: <AlertCircle className="w-3 h-3" /> },
};

// ==================== 辅助函数 ====================

function getUpgradeName(upgrade: AvailableUpgrade): string {
  if (upgrade.isCustom && upgrade.customName) return upgrade.customName;
  return upgrade.template?.name || "未命名服务";
}

function getUpgradeIcon(upgrade: AvailableUpgrade): string {
  if (upgrade.isCustom && upgrade.customIcon) return upgrade.customIcon;
  return upgrade.template?.icon || "✨";
}

function getUpgradeDescription(upgrade: AvailableUpgrade): string {
  if (upgrade.isCustom && upgrade.customDescription) return upgrade.customDescription;
  return upgrade.template?.description || "";
}

function getUpgradeBasePrice(upgrade: AvailableUpgrade): number {
  if (upgrade.isCustom && upgrade.customBasePrice != null) return upgrade.customBasePrice;
  return upgrade.template?.basePrice || 0;
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

  // UI 状态
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [leftPanelWidth] = useState(320);

  // 右侧面板编辑状态
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editHighlights, setEditHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 创建自定义服务模态框
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 图片拖拽排序
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 自动保存追踪
  const previousSelectedIdRef = useRef<string | null>(null);
  const pendingChangesRef = useRef<{ id: string; images: string[]; highlights: string[] } | null>(null);

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

  // 自动保存到组件库
  const saveToLibrary = useCallback(async (id: string, images: string[], highlights: string[]) => {
    try {
      const res = await fetch(`/api/merchant/upgrades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, highlights }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "保存失败");
      }

      const { upgrade } = await res.json();

      // 更新本地数据
      setAvailableUpgrades((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, images: upgrade.images, highlights: upgrade.highlights }
            : u
        )
      );

      setSaveMessage({ type: "success", text: "已自动保存" });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "保存失败" });
    }
  }, []);

  // 当选中项变化时，保存前一个的修改，然后加载新的
  useEffect(() => {
    const prevId = previousSelectedIdRef.current;

    // 如果有前一个选中项，检查是否有未保存的修改
    if (prevId && pendingChangesRef.current && pendingChangesRef.current.id === prevId) {
      const prevUpgrade = availableUpgrades.find((u) => u.id === prevId);
      if (prevUpgrade) {
        const { images, highlights } = pendingChangesRef.current;
        const imagesChanged = JSON.stringify(images) !== JSON.stringify(prevUpgrade.images);
        const highlightsChanged = JSON.stringify(highlights) !== JSON.stringify(prevUpgrade.highlights);

        if (imagesChanged || highlightsChanged) {
          // 静默保存修改
          saveToLibrary(prevId, images, highlights);
        }
      }
      pendingChangesRef.current = null;
    }

    // 加载新选中项的数据
    if (selectedId) {
      const upgrade = availableUpgrades.find((u) => u.id === selectedId);
      if (upgrade) {
        setEditImages(upgrade.images || []);
        setEditHighlights(upgrade.highlights || []);
      }
    }

    previousSelectedIdRef.current = selectedId;
  }, [selectedId, availableUpgrades, saveToLibrary]);

  // 追踪编辑状态变化
  useEffect(() => {
    if (selectedId) {
      pendingChangesRef.current = {
        id: selectedId,
        images: editImages,
        highlights: editHighlights,
      };
    }
  }, [selectedId, editImages, editHighlights]);

  // ==================== 计算属性 ====================

  const filteredUpgrades = useMemo(() => {
    let result = availableUpgrades;

    // 类型筛选
    if (filterType === "platform") {
      result = result.filter((u) => !u.isCustom);
    } else if (filterType === "custom") {
      result = result.filter((u) => u.isCustom);
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((u) => {
        const name = getUpgradeName(u).toLowerCase();
        const code = u.template?.code?.toLowerCase() || "";
        return name.includes(query) || code.includes(query);
      });
    }

    return result;
  }, [availableUpgrades, filterType, searchQuery]);

  const selectedUpgrade = useMemo(() => {
    if (!selectedId) return null;
    return availableUpgrades.find((u) => u.id === selectedId) || null;
  }, [selectedId, availableUpgrades]);

  const selectedConfig = useMemo(() => {
    if (!selectedId) return null;
    return selectedUpgrades.find((u) => u.merchantComponentId === selectedId) || null;
  }, [selectedId, selectedUpgrades]);

  const stats = useMemo(() => {
    const selected = selectedUpgrades.length;
    const popular = selectedUpgrades.filter((u) => u.isPopular).length;
    const pending = availableUpgrades.filter((u) => u.isCustom && u.approvalStatus === "PENDING").length;
    return { selected, popular, pending };
  }, [selectedUpgrades, availableUpgrades]);

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
    // 如果还未选中，先选中
    if (!isSelected(merchantComponentId)) {
      onUpgradesChange([
        ...selectedUpgrades,
        {
          merchantComponentId,
          priceOverride: updates.priceOverride ?? null,
          isPopular: updates.isPopular ?? false,
          displayOrder: selectedUpgrades.length,
        },
      ]);
    } else {
      onUpgradesChange(
        selectedUpgrades.map((u) =>
          u.merchantComponentId === merchantComponentId ? { ...u, ...updates } : u
        )
      );
    }
  };

  // ==================== 库编辑逻辑 ====================

  // 图片排序
  const handleImageDragStart = (index: number) => setDraggedIndex(index);
  const handleImageDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newImages = [...editImages];
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, removed);
      setEditImages(newImages);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // 亮点管理
  const addHighlight = () => {
    if (newHighlight.trim()) {
      setEditHighlights([...editHighlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };
  const removeHighlight = (index: number) => {
    setEditHighlights(editHighlights.filter((_, i) => i !== index));
  };

  // 恢复默认
  const resetToDefaults = () => {
    if (selectedUpgrade?.template) {
      setEditImages(selectedUpgrade.template.defaultImages || []);
      setEditHighlights(selectedUpgrade.template.defaultHighlights || []);
    }
  };

  // ==================== 渲染 ====================

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-sakura-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[14px] text-gray-500">加载升级服务...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 h-[600px] flex items-center justify-center">
        <div className="text-center">
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
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-[600px] flex flex-col">
      {/* ==================== 工具栏 ==================== */}
      <div className="h-11 px-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`p-1.5 rounded transition-colors ${
              isLeftCollapsed ? "text-sakura-600 bg-sakura-50" : "text-gray-500 hover:bg-gray-200"
            }`}
            title={isLeftCollapsed ? "展开服务库" : "收起服务库"}
          >
            {isLeftCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1.5 text-gray-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-[13px] font-medium">升级服务</span>
          </div>

          <div className="h-4 w-px bg-gray-300" />

          <div className="flex items-center gap-1.5 text-[12px]">
            <span className="px-1.5 py-0.5 bg-sakura-100 text-sakura-600 rounded">
              {stats.selected} 已选
            </span>
            {stats.popular > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-current" />
                {stats.popular}
              </span>
            )}
            {stats.pending > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {stats.pending} 待审核
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==================== 主体：左右分栏 ==================== */}
      <div className="flex flex-1 min-h-0">
        {/* ========== 左侧：服务库 ========== */}
        <div
          className={`flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-200 ${
            isLeftCollapsed ? "w-0 overflow-hidden border-r-0" : ""
          }`}
          style={{ width: isLeftCollapsed ? 0 : leftPanelWidth }}
        >
          {/* 搜索 + 筛选 */}
          <div className="p-3 space-y-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索服务..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-sakura-400"
              />
            </div>

            {/* 筛选标签 */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              {(["all", "platform", "custom"] as FilterType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-1 text-[12px] rounded-lg transition-colors ${
                    filterType === type
                      ? "bg-sakura-100 text-sakura-600 font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {type === "all" ? "全部" : type === "platform" ? "平台模板" : "我的自定义"}
                </button>
              ))}
            </div>
          </div>

          {/* 服务列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredUpgrades.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-[13px]">
                {searchQuery ? "未找到匹配的服务" : "暂无可用服务"}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUpgrades.map((upgrade) => {
                  const selected = isSelected(upgrade.id);
                  const isActive = selectedId === upgrade.id;
                  const name = getUpgradeName(upgrade);
                  const icon = getUpgradeIcon(upgrade);
                  const basePrice = getUpgradeBasePrice(upgrade);
                  const config = getConfig(upgrade.id);

                  return (
                    <div
                      key={upgrade.id}
                      className={`
                        group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all
                        ${isActive
                          ? "bg-sakura-100 border-2 border-sakura-400 shadow-sm"
                          : selected
                            ? "bg-sakura-50 border border-sakura-200"
                            : "hover:bg-white border border-transparent"
                        }
                      `}
                      onClick={() => setSelectedId(upgrade.id)}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUpgrade(upgrade);
                        }}
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

                      {/* 图标 */}
                      {upgrade.images.length > 0 ? (
                        <div className={`relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ${selected ? "ring-2 ring-sakura-300" : "bg-gray-100"}`}>
                          <Image
                            src={upgrade.images[0]}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${selected ? "bg-sakura-100" : "bg-gray-100"}`}>
                          {icon}
                        </div>
                      )}

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[13px] font-medium truncate ${selected ? "text-sakura-700" : "text-gray-900"}`}>{name}</span>
                          {selected && (
                            <span className="px-1.5 py-0.5 bg-sakura-500 text-white text-[10px] rounded font-medium">
                              已加入
                            </span>
                          )}
                          {upgrade.isCustom && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded ${APPROVAL_STATUS_CONFIG[upgrade.approvalStatus].color}`}>
                              {APPROVAL_STATUS_CONFIG[upgrade.approvalStatus].icon}
                              {APPROVAL_STATUS_CONFIG[upgrade.approvalStatus].label}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-gray-500">
                          ¥{(basePrice / 100).toLocaleString()}
                          {config?.priceOverride && (
                            <span className="ml-1 text-sakura-600">→ ¥{(config.priceOverride / 100).toLocaleString()}</span>
                          )}
                        </p>
                      </div>

                      {/* 推荐标记 */}
                      {config?.isPopular && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 底部：创建自定义服务 */}
          <div className="p-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-dashed border-gray-300 rounded-xl text-[13px] text-gray-600 hover:border-sakura-400 hover:text-sakura-600 hover:bg-sakura-50/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建自定义服务
            </button>
          </div>
        </div>

        {/* 创建自定义服务模态框 */}
        <CreateCustomServiceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchUpgrades(); // 刷新列表
            setSaveMessage({ type: "success", text: "自定义服务已提交审核" });
            setTimeout(() => setSaveMessage(null), 3000);
          }}
          serviceType="ADDON"
        />

        {/* ========== 右侧：配置面板 ========== */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {selectedUpgrade ? (
            <>
              {/* 头部 */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {selectedUpgrade.images.length > 0 ? (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={selectedUpgrade.images[0]}
                        alt={getUpgradeName(selectedUpgrade)}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-sakura-50 flex items-center justify-center text-2xl">
                      {getUpgradeIcon(selectedUpgrade)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold text-gray-900">
                      {getUpgradeName(selectedUpgrade)}
                    </h3>
                    <p className="text-[13px] text-gray-500">
                      {selectedUpgrade.isCustom ? "自定义服务" : "平台模板"}
                      {selectedUpgrade.isCustom && (
                        <span className={`ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded ${APPROVAL_STATUS_CONFIG[selectedUpgrade.approvalStatus].color}`}>
                          {APPROVAL_STATUS_CONFIG[selectedUpgrade.approvalStatus].label}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* 选中/取消选中按钮 */}
                  <button
                    type="button"
                    onClick={() => toggleUpgrade(selectedUpgrade)}
                    className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isSelected(selectedUpgrade.id)
                        ? "bg-sakura-100 text-sakura-600 hover:bg-sakura-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {isSelected(selectedUpgrade.id) ? (
                      <>
                        <Check className="w-4 h-4 inline mr-1" />
                        已加入套餐
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 inline mr-1" />
                        加入套餐
                      </>
                    )}
                  </button>
                </div>

                {/* 审核中提示 */}
                {selectedUpgrade.isCustom && selectedUpgrade.approvalStatus === "PENDING" && (
                  <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[13px] text-amber-700 flex items-start gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>此服务正在审核中，包含此服务的套餐暂时无法发布。</span>
                  </div>
                )}

                {/* 驳回提示 */}
                {selectedUpgrade.isCustom && selectedUpgrade.approvalStatus === "REJECTED" && (
                  <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">审核未通过</p>
                      {selectedUpgrade.adminFeedback && (
                        <p className="mt-1 text-red-600">{selectedUpgrade.adminFeedback}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 内容区域 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ========== 区块 A：套餐专属配置 ========== */}
                <div className="bg-sakura-50/30 rounded-xl p-4 border border-sakura-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 text-sakura-500" />
                    <h4 className="text-[14px] font-medium text-gray-900">套餐专属配置</h4>
                    <span className="text-[11px] text-gray-400">仅影响当前套餐</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* 价格覆盖 */}
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1.5">套餐价格</label>
                      <div className="relative">
                        <JapaneseYen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={selectedConfig?.priceOverride ? selectedConfig.priceOverride / 100 : ""}
                          onChange={(e) => {
                            const numPrice = e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null;
                            updateConfig(selectedUpgrade.id, { priceOverride: numPrice });
                          }}
                          placeholder={`默认 ${(getUpgradeBasePrice(selectedUpgrade) / 100).toLocaleString()}`}
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:ring-1 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* 排序 */}
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1.5">显示顺序</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={selectedConfig?.displayOrder ?? 0}
                          onChange={(e) => {
                            updateConfig(selectedUpgrade.id, { displayOrder: parseInt(e.target.value) || 0 });
                          }}
                          min={0}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-center focus:ring-1 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
                        />
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => updateConfig(selectedUpgrade.id, { displayOrder: (selectedConfig?.displayOrder ?? 0) - 1 })}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateConfig(selectedUpgrade.id, { displayOrder: (selectedConfig?.displayOrder ?? 0) + 1 })}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 推荐开关 */}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-gray-700">设为人气推荐</p>
                      <p className="text-[11px] text-gray-400">在详情页显示"人气 No.1"标签</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig(selectedUpgrade.id, { isPopular: !selectedConfig?.isPopular })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                        ${selectedConfig?.isPopular ? "bg-amber-500" : "bg-gray-200"}
                      `}
                    >
                      <div
                        className={`
                          absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                          ${selectedConfig?.isPopular ? "translate-x-7" : "translate-x-1"}
                        `}
                      />
                    </button>
                  </div>
                </div>

                {/* ========== 区块 B：服务本身详情 ========== */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <h4 className="text-[14px] font-medium text-gray-900">服务详情</h4>
                    </div>
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[11px] rounded-lg flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      修改影响所有套餐
                    </span>
                  </div>

                  {/* 图片管理 */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[13px] font-medium text-gray-700">
                        服务图片
                        <span className="text-gray-400 text-[11px] ml-2">拖拽排序，第一张为主图</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowImageUploader(!showImageUploader)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-sakura-600 hover:bg-sakura-50 rounded-lg transition-colors"
                      >
                        <ImagePlus className="w-4 h-4" />
                        上传
                      </button>
                    </div>

                    {showImageUploader && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <ImageUploader
                          category="upgrade"
                          purpose="gallery"
                          multiple={true}
                          maxFiles={10}
                          value={editImages}
                          onChange={(newImages) => {
                            setEditImages(newImages);
                            if (newImages.length > 0) setShowImageUploader(false);
                          }}
                        />
                      </div>
                    )}

                    {editImages.length > 0 ? (
                      <div className="grid grid-cols-5 gap-2">
                        {editImages.map((url, index) => (
                          <div
                            key={url}
                            draggable
                            onDragStart={() => handleImageDragStart(index)}
                            onDragEnd={handleImageDragEnd}
                            onDragOver={(e) => handleImageDragOver(e, index)}
                            className={`
                              relative aspect-square rounded-lg overflow-hidden group cursor-move
                              ${draggedIndex === index ? "opacity-50" : ""}
                              ${dragOverIndex === index ? "ring-2 ring-sakura-400" : ""}
                              ${index === 0 ? "ring-2 ring-sakura-500" : "border border-gray-200"}
                            `}
                          >
                            <Image src={url} alt={`图片 ${index + 1}`} fill className="object-cover" unoptimized />
                            {index === 0 && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-sakura-500 text-white text-[9px] font-medium rounded">
                                主图
                              </div>
                            )}
                            <div className="absolute top-1 right-1 p-0.5 bg-black/30 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVertical className="w-3 h-3 text-white" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditImages(editImages.filter((_, i) => i !== index))}
                              className="absolute bottom-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-[12px] text-gray-500">暂无图片，点击上方按钮上传</p>
                      </div>
                    )}
                  </div>

                  {/* 亮点标签 */}
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-3">
                      服务亮点
                      <span className="text-gray-400 text-[11px] ml-2">如：30分钟拍摄、含后期修图</span>
                    </label>

                    <div className="space-y-2 mb-3">
                      {editHighlights.map((highlight, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group">
                          <span className="text-sakura-500">•</span>
                          <span className="flex-1 text-[13px] text-gray-700">{highlight}</span>
                          <button
                            type="button"
                            onClick={() => removeHighlight(index)}
                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

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
                        placeholder="输入亮点描述，按回车添加"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addHighlight}
                        disabled={!newHighlight.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 恢复默认 */}
                  {!selectedUpgrade.isCustom && selectedUpgrade.template && (
                    <button
                      type="button"
                      onClick={resetToDefaults}
                      className="mt-4 text-[12px] text-gray-500 hover:text-gray-700 underline"
                    >
                      恢复平台默认内容
                    </button>
                  )}
                </div>
              </div>

              {/* 底部状态栏 */}
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                {saveMessage ? (
                  <div
                    className={`px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-2 ${
                      saveMessage.type === "success"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {saveMessage.type === "success" ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {saveMessage.text}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">
                    「套餐专属配置」随套餐保存・「服务详情」切换时自动保存
                  </p>
                )}
              </div>
            </>
          ) : (
            /* 空状态 */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-[16px] font-medium text-gray-700 mb-2">选择一个升级服务</h3>
                <p className="text-[13px] text-gray-400 max-w-xs">
                  从左侧服务库中选择一个升级服务，然后在这里配置套餐专属设置或编辑服务详情
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
