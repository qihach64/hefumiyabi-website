"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Eye, Edit, Search, Grid, List, MoreVertical,
  Power, Copy, Trash2, Package, TrendingUp, Filter,
  CheckSquare, Square, Tag, X, Loader2, PowerOff, Check
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { PlanCardManagement } from "@/features/merchant/plans";
import PlanCardGrid from "@/components/PlanCard/PlanCardGrid";

interface PlanTag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Theme {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface TagCategory {
  id: string;
  name: string;
  code: string;
  tags: PlanTag[];
}

interface Plan {
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
  createdAt: Date;
  duration: number;
  includes: string[];
  themeId: string | null;
  theme: { id: string; name: string; icon: string | null; color: string | null } | null;
  planTags: { tag: PlanTag }[];
}

interface ListingsClientProps {
  plans: Plan[];
  merchantId: string;
  themes: Theme[];
  tagCategories: TagCategory[];
}

type ViewMode = "grid" | "list";
type SortBy = "newest" | "price-asc" | "price-desc" | "bookings" | "theme";
type FilterStatus = "all" | "active" | "inactive";

const CATEGORY_LABELS: Record<string, string> = {
  LADIES: "女士套餐",
  MENS: "男士套餐",
  COUPLE: "情侣套餐",
  FAMILY: "家庭套餐",
  GROUP: "团体套餐",
  SPECIAL: "特别套餐",
};

export default function ListingsClient({ plans, merchantId, themes, tagCategories }: ListingsClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list"); // 默认列表视图便于批量操作
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  // 统计数据
  const stats = {
    total: plans.length,
    active: plans.filter(p => p.isActive).length,
    bookings: plans.reduce((sum, p) => sum + p.currentBookings, 0),
  };

  // 批量选择处理
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((planIds: string[]) => {
    setSelectedIds(new Set(planIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 批量更新主题
  const handleBatchThemeUpdate = async (themeId: string | null) => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/merchant/plans/batch-theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planIds: Array.from(selectedIds),
          themeId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      // 刷新页面数据
      router.refresh();
      setSelectedIds(new Set());
      setShowThemeModal(false);
    } catch (error) {
      console.error("Batch update failed:", error);
      alert("更新失败，请重试");
    } finally {
      setIsUpdating(false);
    }
  };

  // 批量更新上下架状态
  const handleBatchStatusUpdate = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/merchant/plans/batch-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planIds: Array.from(selectedIds),
          isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      // 刷新页面数据
      router.refresh();
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Batch status update failed:", error);
      alert("更新失败，请重试");
    } finally {
      setIsUpdating(false);
    }
  };

  // 批量更新标签
  const handleBatchTagsUpdate = async (tagIds: string[], mode: "add" | "remove" | "set") => {
    if (selectedIds.size === 0) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/merchant/plans/batch-tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planIds: Array.from(selectedIds),
          tagIds,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      // 刷新页面数据
      router.refresh();
      setSelectedIds(new Set());
      setShowTagsModal(false);
    } catch (error) {
      console.error("Batch tags update failed:", error);
      alert("更新失败，请重试");
    } finally {
      setIsUpdating(false);
    }
  };

  // 更新套餐名称
  const handleNameUpdate = useCallback(async (id: string, newName: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/merchant/plans/${id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "更新失败");
        return false;
      }

      // 刷新页面数据
      router.refresh();
      return true;
    } catch (error) {
      console.error("Name update failed:", error);
      alert("更新失败，请重试");
      return false;
    }
  }, [router]);

  // 筛选和排序
  const filteredPlans = plans
    .filter(plan => {
      // 搜索筛选
      if (searchQuery && !plan.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 状态筛选
      if (filterStatus === "active" && !plan.isActive) return false;
      if (filterStatus === "inactive" && plan.isActive) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "bookings":
          return b.currentBookings - a.currentBookings;
        case "theme":
          // 按主题名称排序，无主题的排在最后
          const themeA = a.theme?.name || "\uffff"; // 无主题放最后
          const themeB = b.theme?.name || "\uffff";
          return themeA.localeCompare(themeB, "zh-CN");
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* 标题区域 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">套餐管理</h1>
              <p className="text-gray-600">管理您的和服租赁套餐</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/merchants/${merchantId}`} target="_blank">
                <Button variant="secondary" size="lg">
                  <Eye className="w-5 h-5 mr-2" />
                  预览公开页面
                </Button>
              </Link>
              <Link href="/merchant/listings/new">
                <Button variant="primary" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  发布新套餐
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 统计卡片 - 简化为3个关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">全部套餐</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-sakura-50 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-sakura-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">已上架</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% 上架率
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Power className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总预订</p>
                <p className="text-3xl font-bold text-blue-600">{stats.bookings}</p>
                <p className="text-xs text-gray-500 mt-1">
                  平均 {stats.total > 0 ? (stats.bookings / stats.total).toFixed(1) : 0} 次/套餐
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 工具栏 - 搜索、筛选、排序、视图切换 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索套餐名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 状态筛选 */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-sakura-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterStatus === "active"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                已上架
              </button>
              <button
                onClick={() => setFilterStatus("inactive")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterStatus === "inactive"
                    ? "bg-gray-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                已下架
              </button>
            </div>

            {/* 排序 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            >
              <option value="newest">最新发布</option>
              <option value="price-asc">价格升序</option>
              <option value="price-desc">价格降序</option>
              <option value="bookings">预订最多</option>
              <option value="theme">按主题分组</option>
            </select>

            {/* 视图切换 */}
            <div className="flex gap-2 border border-gray-300 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-sakura-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-sakura-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 批量操作栏 */}
        {selectedIds.size > 0 && (
          <div className="bg-sakura-50 border border-sakura-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sakura-700 font-medium">
                已选择 {selectedIds.size} 个套餐
              </span>
              <button
                onClick={clearSelection}
                className="text-sakura-600 hover:text-sakura-800 text-sm underline"
              >
                取消选择
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBatchStatusUpdate(true)}
                disabled={isUpdating}
              >
                <Power className="w-4 h-4 mr-1.5" />
                上架
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBatchStatusUpdate(false)}
                disabled={isUpdating}
              >
                <PowerOff className="w-4 h-4 mr-1.5" />
                下架
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowThemeModal(true)}
                disabled={isUpdating}
              >
                <Tag className="w-4 h-4 mr-1.5" />
                主题
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTagsModal(true)}
                disabled={isUpdating}
              >
                <Tag className="w-4 h-4 mr-1.5" />
                标签
              </Button>
            </div>
          </div>
        )}

        {/* 主题选择模态框 */}
        {showThemeModal && (
          <ThemeSelectionModal
            themes={themes}
            selectedCount={selectedIds.size}
            isUpdating={isUpdating}
            onSelect={handleBatchThemeUpdate}
            onClose={() => setShowThemeModal(false)}
          />
        )}

        {/* 标签选择模态框 */}
        {showTagsModal && (
          <TagsSelectionModal
            tagCategories={tagCategories}
            selectedCount={selectedIds.size}
            isUpdating={isUpdating}
            onUpdate={handleBatchTagsUpdate}
            onClose={() => setShowTagsModal(false)}
          />
        )}

        {/* 结果提示 */}
        {searchQuery && (
          <div className="mb-4 text-sm text-gray-600">
            找到 <span className="font-semibold text-gray-900">{filteredPlans.length}</span> 个套餐
          </div>
        )}

        {/* 套餐列表 */}
        {filteredPlans.length > 0 ? (
          viewMode === "grid" ? (
            <GridView plans={filteredPlans} />
          ) : (
            <ListView
              plans={filteredPlans}
              themes={themes}
              tagCategories={tagCategories}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onSelectAll={() => selectAll(filteredPlans.map(p => p.id))}
              onClearSelection={clearSelection}
              onNameUpdate={handleNameUpdate}
              onRefresh={() => router.refresh()}
            />
          )
        ) : (
          <EmptyState searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}

// 网格视图组件
function GridView({ plans }: { plans: Plan[] }) {
  return (
    <PlanCardGrid variant="grid-3">
      {plans.map((plan) => (
        <PlanCardManagement key={plan.id} plan={plan} />
      ))}
    </PlanCardGrid>
  );
}

// 列表视图组件
function ListView({
  plans,
  themes,
  tagCategories,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onNameUpdate,
  onRefresh,
}: {
  plans: Plan[];
  themes: Theme[];
  tagCategories: TagCategory[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onNameUpdate: (id: string, newName: string) => Promise<boolean>;
  onRefresh: () => void;
}) {
  const allSelected = plans.length > 0 && plans.every(p => selectedIds.has(p.id));
  const someSelected = plans.some(p => selectedIds.has(p.id));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="w-12 px-4 py-4">
              <button
                onClick={() => allSelected ? onClearSelection() : onSelectAll()}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-sakura-600" />
                ) : someSelected ? (
                  <div className="w-5 h-5 border-2 border-sakura-400 rounded bg-sakura-100" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </th>
            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">套餐</th>
            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">主题</th>
            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">标签</th>
            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">状态</th>
            <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700">价格</th>
            <th className="text-right px-4 py-4 text-sm font-semibold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {plans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              isSelected={selectedIds.has(plan.id)}
              onToggleSelect={() => onToggleSelect(plan.id)}
              onNameUpdate={onNameUpdate}
              themes={themes}
              tagCategories={tagCategories}
              onRefresh={onRefresh}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 套餐行组件（列表视图）
function PlanRow({
  plan,
  isSelected,
  onToggleSelect,
  onNameUpdate,
  themes,
  tagCategories,
  onRefresh,
}: {
  plan: Plan;
  isSelected: boolean;
  onToggleSelect: () => void;
  onNameUpdate: (id: string, newName: string) => Promise<boolean>;
  themes: Theme[];
  tagCategories: TagCategory[];
  onRefresh: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(plan.name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 主题编辑状态
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isThemeSaving, setIsThemeSaving] = useState(false);

  // 标签编辑状态
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [isTagsSaving, setIsTagsSaving] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(plan.planTags?.map(pt => pt.tag.id) || [])
  );

  // 进入编辑模式时聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 同步标签状态
  useEffect(() => {
    setSelectedTagIds(new Set(plan.planTags?.map(pt => pt.tag.id) || []));
  }, [plan.planTags]);

  const handleStartEdit = () => {
    setEditName(plan.name);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditName(plan.name);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName === plan.name) {
      handleCancelEdit();
      return;
    }

    setIsSaving(true);
    const success = await onNameUpdate(plan.id, trimmedName);
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // 更新主题
  const handleThemeChange = async (themeId: string | null) => {
    setIsThemeSaving(true);
    try {
      const response = await fetch(`/api/merchant/plans/${plan.id}/theme`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || "更新失败");
      }
    } catch (error) {
      console.error("Theme update failed:", error);
      alert("更新失败，请重试");
    } finally {
      setIsThemeSaving(false);
      setShowThemeDropdown(false);
    }
  };

  // 切换标签选中状态
  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  // 保存标签
  const handleTagsSave = async () => {
    setIsTagsSaving(true);
    try {
      const response = await fetch(`/api/merchant/plans/${plan.id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: Array.from(selectedTagIds) }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || "更新失败");
      }
    } catch (error) {
      console.error("Tags update failed:", error);
      alert("更新失败，请重试");
    } finally {
      setIsTagsSaving(false);
      setShowTagsDropdown(false);
    }
  };

  // 删除单个标签
  const handleRemoveTag = async (tagId: string) => {
    const newTagIds = new Set(selectedTagIds);
    newTagIds.delete(tagId);
    setSelectedTagIds(newTagIds);

    setIsTagsSaving(true);
    try {
      const response = await fetch(`/api/merchant/plans/${plan.id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: Array.from(newTagIds) }),
      });

      if (response.ok) {
        onRefresh();
      } else {
        // 恢复状态
        setSelectedTagIds(new Set(plan.planTags?.map(pt => pt.tag.id) || []));
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Tag remove failed:", error);
      setSelectedTagIds(new Set(plan.planTags?.map(pt => pt.tag.id) || []));
      alert("删除失败，请重试");
    } finally {
      setIsTagsSaving(false);
    }
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-sakura-50" : ""}`}>
      <td className="w-12 px-4 py-4">
        <button
          onClick={onToggleSelect}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-sakura-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {plan.imageUrl ? (
              <Image
                src={plan.imageUrl}
                alt={plan.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSave}
                  disabled={isSaving}
                  className="w-full max-w-[220px] px-2 py-1 text-sm font-semibold border border-sakura-300 rounded-lg focus:ring-2 focus:ring-sakura-500 focus:border-transparent disabled:opacity-50"
                  placeholder="输入套餐名称..."
                />
                {isSaving && <Loader2 className="w-4 h-4 text-sakura-500 animate-spin" />}
              </div>
            ) : (
              <button
                onClick={handleStartEdit}
                className="group text-left w-full"
                title="点击编辑名称"
              >
                <p className="font-semibold text-gray-900 mb-1 truncate max-w-[200px] group-hover:text-sakura-600 group-hover:underline transition-colors cursor-text">
                  {plan.name}
                </p>
              </button>
            )}
            <p className="text-sm text-gray-600">
              {CATEGORY_LABELS[plan.category] || plan.category} · {plan.duration}小时
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="relative">
          {plan.theme ? (
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              disabled={isThemeSaving}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-sakura-300 transition-all disabled:opacity-50"
              style={{
                backgroundColor: plan.theme.color ? `${plan.theme.color}20` : "#f3f4f6",
                color: plan.theme.color || "#6b7280",
              }}
              title="点击更换主题"
            >
              {plan.theme.icon && <span>{plan.theme.icon}</span>}
              {plan.theme.name}
              {isThemeSaving && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </button>
          ) : (
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              disabled={isThemeSaving}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-sakura-600 hover:text-sakura-700 hover:bg-sakura-50 rounded-full transition-colors disabled:opacity-50"
              title="添加主题"
            >
              <Plus className="w-3 h-3" />
              添加主题
              {isThemeSaving && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
            </button>
          )}

          {/* 主题选择下拉框 */}
          {showThemeDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemeDropdown(false)} />
              <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
                {plan.theme && (
                  <button
                    onClick={() => handleThemeChange(null)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    移除主题
                  </button>
                )}
                {plan.theme && <div className="border-t border-gray-100 my-1" />}
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                      plan.theme?.id === theme.id ? "bg-sakura-50" : ""
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: theme.color ? `${theme.color}20` : "#f3f4f6" }}
                    >
                      {theme.icon || "📦"}
                    </span>
                    <span className="flex-1">{theme.name}</span>
                    {plan.theme?.id === theme.id && <Check className="w-4 h-4 text-sakura-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
            {plan.planTags && plan.planTags.length > 0 ? (
              <>
                {plan.planTags.slice(0, 3).map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="group inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs cursor-pointer hover:ring-1 hover:ring-red-300 transition-all"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}15` : "#f3f4f6",
                      color: tag.color || "#6b7280",
                    }}
                    onClick={() => handleRemoveTag(tag.id)}
                    title="点击删除"
                  >
                    {tag.icon && <span>{tag.icon}</span>}
                    {tag.name}
                    <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" />
                  </span>
                ))}
                {plan.planTags.length > 3 && (
                  <span className="text-xs text-gray-400">+{plan.planTags.length - 3}</span>
                )}
              </>
            ) : null}
            <button
              onClick={() => setShowTagsDropdown(!showTagsDropdown)}
              disabled={isTagsSaving}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-sakura-600 hover:text-sakura-700 hover:bg-sakura-50 rounded transition-colors disabled:opacity-50"
              title="管理标签"
            >
              <Plus className="w-3 h-3" />
              {isTagsSaving && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
          </div>

          {/* 标签选择下拉框 */}
          {showTagsDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTagsDropdown(false)} />
              <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-80 overflow-hidden">
                <div className="p-3 max-h-64 overflow-y-auto">
                  {tagCategories.map((category) => (
                    <div key={category.id} className="mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1.5">{category.name}</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.tags.map((tag) => {
                          const isSelected = selectedTagIds.has(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => toggleTagSelection(tag.id)}
                              className={`inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs transition-all ${
                                isSelected ? "ring-2 ring-sakura-500" : "hover:ring-1 hover:ring-gray-300"
                              }`}
                              style={{
                                backgroundColor: tag.color ? `${tag.color}15` : "#f3f4f6",
                                color: tag.color || "#6b7280",
                              }}
                            >
                              {tag.icon && <span>{tag.icon}</span>}
                              {tag.name}
                              {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                  <button
                    onClick={() => setShowTagsDropdown(false)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleTagsSave}
                    disabled={isTagsSaving}
                    className="px-3 py-1 text-xs bg-sakura-500 text-white rounded hover:bg-sakura-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isTagsSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                    保存
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-1">
          <Badge variant={plan.isActive ? "success-solid" : "secondary-solid"} size="sm">
            {plan.isActive ? "上架" : "下架"}
          </Badge>
          {plan.isFeatured && <Badge variant="warning-solid" size="sm">精选</Badge>}
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="font-medium text-gray-900">
          ¥{(plan.price / 100).toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/plans/${plan.slug}`} target="_blank">
            <Button variant="secondary" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Link href={`/merchant/listings/${plan.id}/edit`}>
            <Button variant="primary" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            {showMenu && (
              <QuickMenu plan={plan} onClose={() => setShowMenu(false)} />
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// 快速操作菜单（用于列表视图）
function QuickMenu({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
          <Power className="w-4 h-4" />
          {plan.isActive ? "下架套餐" : "上架套餐"}
        </button>
        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
          <Copy className="w-4 h-4" />
          复制套餐
        </button>
        <hr className="my-2 border-gray-200" />
        <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          删除套餐
        </button>
      </div>
    </>
  );
}

// 空状态组件
function EmptyState({ searchQuery }: { searchQuery: string }) {
  if (searchQuery) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          未找到匹配的套餐
        </h2>
        <p className="text-gray-600">
          试试其他搜索关键词或筛选条件
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        还没有套餐
      </h2>
      <p className="text-gray-600 mb-6">
        发布您的第一个和服租赁套餐，开始接待客户
      </p>
      <Link href="/merchant/listings/new">
        <Button variant="primary" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          发布新套餐
        </Button>
      </Link>
    </div>
  );
}

// 主题选择模态框
function ThemeSelectionModal({
  themes,
  selectedCount,
  isUpdating,
  onSelect,
  onClose,
}: {
  themes: Theme[];
  selectedCount: number;
  isUpdating: boolean;
  onSelect: (themeId: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 模态框内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              批量修改主题
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              将 {selectedCount} 个套餐分配到指定主题
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isUpdating}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 主题选项列表 */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {/* 清除主题选项 */}
          <button
            onClick={() => onSelect(null)}
            disabled={isUpdating}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700">清除主题</p>
              <p className="text-sm text-gray-500">移除套餐的主题分类</p>
            </div>
          </button>

          <div className="my-3 border-t border-gray-100" />

          {/* 主题列表 */}
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              disabled={isUpdating}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors text-left disabled:opacity-50"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{
                  backgroundColor: theme.color ? `${theme.color}20` : "#f3f4f6",
                }}
              >
                {theme.icon || "📦"}
              </div>
              <div>
                <p className="font-medium text-gray-900">{theme.name}</p>
                <p className="text-sm text-gray-500">{theme.slug}</p>
              </div>
            </button>
          ))}
        </div>

        {/* 加载状态 */}
        {isUpdating && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="flex items-center gap-3 text-sakura-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-medium">正在更新...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 标签选择模态框
function TagsSelectionModal({
  tagCategories,
  selectedCount,
  isUpdating,
  onUpdate,
  onClose,
}: {
  tagCategories: TagCategory[];
  selectedCount: number;
  isUpdating: boolean;
  onUpdate: (tagIds: string[], mode: "add" | "remove" | "set") => void;
  onClose: () => void;
}) {
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selectedTagIds.size === 0 && mode !== "set") return;
    onUpdate(Array.from(selectedTagIds), mode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 模态框内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              批量修改标签
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              为 {selectedCount} 个套餐修改标签
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isUpdating}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 操作模式选择 */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("add")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "add"
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              添加标签
            </button>
            <button
              onClick={() => setMode("remove")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "remove"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              移除标签
            </button>
            <button
              onClick={() => setMode("set")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "set"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              替换全部
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {mode === "add" && "将选中的标签添加到套餐（保留现有标签）"}
            {mode === "remove" && "从套餐中移除选中的标签"}
            {mode === "set" && "用选中的标签替换套餐的所有标签"}
          </p>
        </div>

        {/* 标签选项列表 */}
        <div className="p-4 max-h-[350px] overflow-y-auto">
          {tagCategories.map((category) => (
            <div key={category.id} className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {category.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {category.tags.map((tag) => {
                  const isSelected = selectedTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      disabled={isUpdating}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50 ${
                        isSelected
                          ? "ring-2 ring-offset-1 ring-sakura-500"
                          : "hover:ring-1 hover:ring-gray-300"
                      }`}
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : "#f3f4f6",
                        color: tag.color || "#6b7280",
                      }}
                    >
                      {tag.icon && <span>{tag.icon}</span>}
                      {tag.name}
                      {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {tagCategories.length === 0 && (
            <p className="text-center text-gray-500 py-8">暂无可用标签</p>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            已选择 {selectedTagIds.size} 个标签
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isUpdating}>
              取消
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={isUpdating || (selectedTagIds.size === 0 && mode !== "set")}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  更新中...
                </>
              ) : (
                "确认修改"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
