"use client";

import { useState } from "react";
import {
  Check,
  X,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Sparkles,
  ImageIcon,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui";

type ApprovalStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

interface CustomService {
  id: string;
  isCustom: boolean;
  approvalStatus: ApprovalStatus;
  adminFeedback: string | null;
  customName: string | null;
  customNameEn: string | null;
  customDescription: string | null;
  customIcon: string | null;
  customBasePrice: number | null;
  images: string[];
  highlights: string[];
  price: number | null;
  isEnabled: boolean;
  createdAt: Date;
  merchant: {
    id: string;
    businessName: string;
    owner: {
      name: string | null;
      email: string | null;
    };
  };
}

interface ServiceReviewListProps {
  services: CustomService[];
}

const STATUS_CONFIG = {
  DRAFT: {
    label: "草稿",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Clock,
  },
  PENDING: {
    label: "待审核",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  APPROVED: {
    label: "已批准",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: Check,
  },
  REJECTED: {
    label: "已拒绝",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: X,
  },
};

export default function ServiceReviewList({ services }: ServiceReviewListProps) {
  const [filter, setFilter] = useState<ApprovalStatus | "ALL">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 筛选服务
  const filteredServices =
    filter === "ALL"
      ? services
      : services.filter((s) => s.approvalStatus === filter);

  // 推断服务类型（BASE 或 ADDON）
  const inferServiceType = (service: CustomService) => {
    // 有价格且价格 > 0 的是 ADDON，否则是 BASE
    return service.customBasePrice && service.customBasePrice > 0 ? "ADDON" : "BASE";
  };

  // 审核操作
  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/services/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "操作失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert("请填写拒绝理由");
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/services/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "操作失败");
      }
    } catch {
      alert("操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* 筛选按钮 */}
      <div className="flex gap-2 mb-6">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-all ${
              filter === status
                ? "bg-sakura-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-sakura-300"
            }`}
          >
            {status === "ALL"
              ? "全部"
              : STATUS_CONFIG[status]?.label || status}
            {status !== "ALL" && (
              <span className="ml-1.5 opacity-70">
                ({services.filter((s) => s.approvalStatus === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 服务列表 */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">暂无服务</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((service) => {
            const isExpanded = expandedId === service.id;
            const statusConfig = STATUS_CONFIG[service.approvalStatus];
            const StatusIcon = statusConfig.icon;
            const serviceType = inferServiceType(service);

            return (
              <div
                key={service.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* 头部信息 */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : service.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* 图标 */}
                    <div className="w-12 h-12 bg-sakura-50 rounded-xl flex items-center justify-center text-2xl">
                      {service.customIcon || (serviceType === "ADDON" ? "✨" : "📦")}
                    </div>

                    {/* 基本信息 */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {service.customName || "未命名服务"}
                        </h3>
                        {/* 类型标签 */}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            serviceType === "ADDON"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {serviceType === "ADDON" ? (
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              升级服务
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              包含服务
                            </span>
                          )}
                        </span>
                        {/* 状态标签 */}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1 ${statusConfig.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-500 mt-0.5">
                        商户: {service.merchant.businessName} ·
                        {service.customBasePrice
                          ? ` ¥${(service.customBasePrice / 100).toLocaleString()}`
                          : " 免费"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-gray-400">
                      {new Date(service.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <div className="grid grid-cols-2 gap-6">
                      {/* 左侧：详细信息 */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[12px] text-gray-500 uppercase tracking-wider">
                            服务名称
                          </label>
                          <p className="text-[15px] text-gray-900 mt-1">
                            {service.customName}
                            {service.customNameEn && (
                              <span className="text-gray-500 ml-2">
                                ({service.customNameEn})
                              </span>
                            )}
                          </p>
                        </div>

                        <div>
                          <label className="text-[12px] text-gray-500 uppercase tracking-wider">
                            服务描述
                          </label>
                          <p className="text-[14px] text-gray-700 mt-1">
                            {service.customDescription || "无描述"}
                          </p>
                        </div>

                        <div>
                          <label className="text-[12px] text-gray-500 uppercase tracking-wider">
                            价格
                          </label>
                          <p className="text-[15px] text-gray-900 mt-1">
                            {service.customBasePrice
                              ? `¥${(service.customBasePrice / 100).toLocaleString()}`
                              : "免费 / 包含在套餐内"}
                          </p>
                        </div>

                        {/* 服务亮点 */}
                        {service.highlights.length > 0 && (
                          <div>
                            <label className="text-[12px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              服务亮点
                            </label>
                            <ul className="mt-2 space-y-1">
                              {service.highlights.map((h, i) => (
                                <li
                                  key={i}
                                  className="text-[13px] text-gray-700 flex items-center gap-2"
                                >
                                  <span className="text-sakura-500">•</span>
                                  {h}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 商户信息 */}
                        <div className="pt-4 border-t border-gray-200">
                          <label className="text-[12px] text-gray-500 uppercase tracking-wider">
                            提交商户
                          </label>
                          <p className="text-[14px] text-gray-900 mt-1">
                            {service.merchant.businessName}
                          </p>
                          <p className="text-[13px] text-gray-500">
                            {service.merchant.owner.name} · {service.merchant.owner.email}
                          </p>
                        </div>
                      </div>

                      {/* 右侧：图片 */}
                      <div>
                        <label className="text-[12px] text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                          <ImageIcon className="w-3 h-3" />
                          服务图片
                        </label>
                        {service.images.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {service.images.map((url, i) => (
                              <div
                                key={i}
                                className="aspect-square rounded-lg overflow-hidden border border-gray-200"
                              >
                                <img
                                  src={url}
                                  alt={`图片 ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-[13px] text-gray-400">暂无图片</p>
                          </div>
                        )}

                        {/* 已拒绝显示拒绝理由 */}
                        {service.approvalStatus === "REJECTED" && service.adminFeedback && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <label className="text-[12px] text-red-600 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              拒绝理由
                            </label>
                            <p className="text-[13px] text-red-700 mt-1">
                              {service.adminFeedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {service.approvalStatus === "PENDING" && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-end gap-4">
                          {/* 拒绝理由输入 */}
                          <div className="flex-1">
                            <label className="text-[12px] text-gray-500 mb-1 block">
                              拒绝理由（拒绝时必填）
                            </label>
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="例如：图片不清晰、描述不准确..."
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:ring-2 focus:ring-sakura-200 focus:border-sakura-400"
                            />
                          </div>

                          {/* 按钮 */}
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => handleReject(service.id)}
                              disabled={actionLoading === service.id}
                              className="!bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
                            >
                              <X className="w-4 h-4 mr-1" />
                              拒绝
                            </Button>
                            <Button
                              variant="primary"
                              onClick={() => handleApprove(service.id)}
                              disabled={actionLoading === service.id}
                              className="!bg-green-600 hover:!bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              批准
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
