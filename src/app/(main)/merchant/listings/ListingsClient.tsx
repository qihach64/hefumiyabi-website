"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Eye, Edit, Search, Grid, List, MoreVertical,
  Power, Copy, Trash2, Package, TrendingUp, Filter
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import PlanCardManagement from "@/components/PlanCard/PlanCardManagement";
import PlanCardGrid from "@/components/PlanCard/PlanCardGrid";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
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
  planTags: { tag: Tag }[];
}

interface ListingsClientProps {
  plans: Plan[];
  merchantId: string;
}

type ViewMode = "grid" | "list";
type SortBy = "newest" | "price-asc" | "price-desc" | "bookings";
type FilterStatus = "all" | "active" | "inactive";

const CATEGORY_LABELS: Record<string, string> = {
  LADIES: "女士套餐",
  MENS: "男士套餐",
  COUPLE: "情侣套餐",
  FAMILY: "家庭套餐",
  GROUP: "团体套餐",
  SPECIAL: "特别套餐",
};

export default function ListingsClient({ plans, merchantId }: ListingsClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  // 统计数据
  const stats = {
    total: plans.length,
    active: plans.filter(p => p.isActive).length,
    bookings: plans.reduce((sum, p) => sum + p.currentBookings, 0),
  };

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
            <ListView plans={filteredPlans} />
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
function ListView({ plans }: { plans: Plan[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">套餐</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">状态</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">价格</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">预订</th>
            <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {plans.map((plan) => (
            <PlanRow key={plan.id} plan={plan} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 套餐行组件（列表视图）
function PlanRow({ plan }: { plan: Plan }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {plan.imageUrl ? (
              <Image
                src={plan.imageUrl}
                alt={plan.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">{plan.name}</p>
            <p className="text-sm text-gray-600 mb-2">
              {CATEGORY_LABELS[plan.category] || plan.category} · {plan.duration}小时
            </p>

            {/* 标签 */}
            {plan.planTags && plan.planTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {plan.planTags.slice(0, 3).map(({ tag }) => (
                  <Badge key={tag.id} variant="sakura" size="sm">
                    {tag.icon && <span className="mr-1">{tag.icon}</span>}
                    {tag.name}
                  </Badge>
                ))}
                {plan.planTags.length > 3 && (
                  <Badge variant="sakura" size="sm" className="opacity-60">
                    +{plan.planTags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* 包含内容 */}
            {plan.includes && plan.includes.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                包含: {plan.includes.slice(0, 2).join(", ")}
                {plan.includes.length > 2 && ` +${plan.includes.length - 2}项`}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <Badge variant={plan.isActive ? "success-solid" : "secondary-solid"} size="sm">
            {plan.isActive ? "已上架" : "已下架"}
          </Badge>
          {plan.isFeatured && <Badge variant="warning-solid" size="sm">精选</Badge>}
          {plan.isCampaign && <Badge variant="danger-solid" size="sm">活动</Badge>}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-gray-900">
            ¥{(plan.price / 100).toLocaleString()}
          </span>
          {plan.originalPrice && plan.originalPrice > plan.price && (
            <span className="text-sm text-gray-500 line-through">
              ¥{(plan.originalPrice / 100).toLocaleString()}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-gray-700">{plan.currentBookings} 次</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/plans/${plan.slug}`} target="_blank">
            <Button variant="secondary" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              预览
            </Button>
          </Link>
          <Link href={`/merchant/listings/${plan.id}/edit`}>
            <Button variant="primary" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              编辑
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
