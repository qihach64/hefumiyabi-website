"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui";

// v10.1 商户组件数据结构
interface MerchantComponentData {
  id: string;
  templateId: string;
  // 模板信息
  code: string;
  name: string;
  nameJa: string | null;
  type: string;
  icon: string | null;
  basePrice: number;
  description: string | null;
  // 商户自定义内容
  images: string[];
  highlights: string[];
  // 商户配置
  price: number | null;
  isEnabled: boolean;
  effectivePrice: number;
}

interface ComponentsClientProps {
  components: MerchantComponentData[];
  merchantId: string;
}

// v10.1 组件类型标签映射
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  OUTFIT: { label: "着装项目", color: "bg-sakura-100 text-sakura-700" },
  ADDON: { label: "增值服务", color: "bg-amber-100 text-amber-700" },
};

// 单个组件行
function ComponentRow({
  component,
  editingId,
  editPrice,
  onEditStart,
  onEditCancel,
  onEditSave,
  onPriceChange,
  onToggle,
  isSaving,
}: {
  component: MerchantComponentData;
  editingId: string | null;
  editPrice: string;
  onEditStart: (id: string, currentPrice: number | null) => void;
  onEditCancel: () => void;
  onEditSave: (id: string) => void;
  onPriceChange: (value: string) => void;
  onToggle: (id: string, newEnabled: boolean) => void;
  isSaving: boolean;
}) {
  const isEditing = editingId === component.id;
  const typeInfo = TYPE_LABELS[component.type] || { label: "其他", color: "bg-gray-100 text-gray-700" };
  const hasCustomPrice = component.price !== null;

  return (
    <div
      className={`
        flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl transition-all
        ${component.isEnabled ? "bg-white" : "bg-gray-50 opacity-60"}
        ${isEditing ? "ring-2 ring-sakura-400" : ""}
      `}
    >
      {/* 左侧：图标 + 名称 */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* 启用/禁用开关 */}
        <button
          onClick={() => onToggle(component.id, !component.isEnabled)}
          disabled={isSaving}
          className="flex-shrink-0"
        >
          {component.isEnabled ? (
            <ToggleRight className="w-8 h-8 text-sakura-500" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-gray-400" />
          )}
        </button>

        {/* 图标 */}
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">{component.icon || "?"}</span>
        </div>

        {/* 名称信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-gray-900 truncate">
              {component.name}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
          </div>
          {component.nameJa && (
            <span className="text-xs text-gray-500">{component.nameJa}</span>
          )}
        </div>
      </div>

      {/* 右侧：价格编辑 */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* 平台建议价 */}
        <div className="text-right">
          <div className="text-[10px] text-gray-400 mb-0.5">平台建议价</div>
          <div className="text-sm text-gray-600">
            ¥{(component.basePrice / 100).toLocaleString()}
          </div>
        </div>

        {/* 箭头 */}
        <div className="text-gray-300">→</div>

        {/* 您的价格 */}
        <div className="min-w-[120px]">
          <div className="text-[10px] text-gray-400 mb-0.5">您的价格</div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => onPriceChange(e.target.value)}
                  className="w-24 pl-6 pr-2 py-1 border border-sakura-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sakura-400"
                  placeholder="留空使用建议价"
                  autoFocus
                />
              </div>
              <button
                onClick={() => onEditSave(component.id)}
                disabled={isSaving}
                className="p-1.5 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onEditCancel}
                className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onEditStart(component.id, component.price)}
              className="flex items-center gap-1 text-sm font-medium hover:text-sakura-600 transition-colors"
              disabled={!component.isEnabled}
            >
              {hasCustomPrice ? (
                <>
                  <span className="text-sakura-600">
                    ¥{(component.price! / 100).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-sakura-400">(自定义)</span>
                </>
              ) : (
                <>
                  <span className="text-gray-600">
                    ¥{(component.basePrice / 100).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400">(使用建议价)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ComponentsClient({
  components: initialComponents,
  merchantId,
}: ComponentsClientProps) {
  const [components, setComponents] = useState(initialComponents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 按类型分组
  const groupedComponents = components.reduce((acc, component) => {
    const type = component.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(component);
    return acc;
  }, {} as Record<string, MerchantComponentData[]>);

  // 开始编辑
  const handleEditStart = useCallback((id: string, currentPrice: number | null) => {
    setEditingId(id);
    setEditPrice(currentPrice !== null ? String(currentPrice / 100) : "");
  }, []);

  // 取消编辑
  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditPrice("");
  }, []);

  // 保存价格 (v10.1 - 使用 MerchantComponent ID)
  const handleEditSave = useCallback(async (mcId: string) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const priceInCents = editPrice.trim() === "" ? null : Math.round(parseFloat(editPrice) * 100);

      const response = await fetch("/api/merchant/component-overrides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mcId, // v10.1: 使用 MerchantComponent ID
          price: priceInCents,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      // 更新本地状态
      setComponents(prev =>
        prev.map(c =>
          c.id === mcId
            ? {
                ...c,
                price: priceInCents,
                effectivePrice: priceInCents ?? c.basePrice,
              }
            : c
        )
      );

      setSaveMessage({ type: "success", text: "价格已更新" });
      setEditingId(null);
      setEditPrice("");
    } catch (error) {
      setSaveMessage({ type: "error", text: "保存失败，请重试" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [editPrice]);

  // 切换启用状态 (v10.1 - 使用 MerchantComponent ID)
  const handleToggle = useCallback(async (mcId: string, newEnabled: boolean) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/merchant/component-overrides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mcId, // v10.1: 使用 MerchantComponent ID
          isEnabled: newEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle");
      }

      // 更新本地状态
      setComponents(prev =>
        prev.map(c =>
          c.id === mcId
            ? { ...c, isEnabled: newEnabled }
            : c
        )
      );

      setSaveMessage({
        type: "success",
        text: newEnabled ? "已启用该组件" : "已禁用该组件",
      });
    } catch (error) {
      setSaveMessage({ type: "error", text: "操作失败，请重试" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, []);

  // 统计
  const enabledCount = components.filter(c => c.isEnabled).length;
  const customPriceCount = components.filter(c => c.price !== null).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-5xl">
        {/* 返回按钮 */}
        <Link
          href="/merchant/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回控制台
        </Link>

        {/* 标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sakura-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-sakura-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">服务组件配置</h1>
          </div>
          <p className="text-gray-600">
            配置您提供的服务组件和价格。这些设置将影响您所有套餐的组件显示。
          </p>
        </div>

        {/* 提示卡片 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">配置说明</p>
              <ul className="space-y-1 text-blue-600">
                <li>• <strong>启用/禁用</strong>：控制该组件是否在您的套餐中显示</li>
                <li>• <strong>自定义价格</strong>：点击价格可修改，留空则使用平台建议价</li>
                <li>• 组件启用后，创建套餐时可选择包含该组件</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 统计栏 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Badge variant="info" size="md">
            共 {components.length} 个组件
          </Badge>
          <Badge variant="success" size="md">
            已启用 {enabledCount} 个
          </Badge>
          <Badge variant="warning" size="md">
            自定义价格 {customPriceCount} 个
          </Badge>
        </div>

        {/* 保存消息 */}
        {saveMessage && (
          <div
            className={`
              fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2
              ${saveMessage.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}
            `}
          >
            {saveMessage.type === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {saveMessage.text}
          </div>
        )}

        {/* 组件列表（按类型分组） */}
        <div className="space-y-8">
          {Object.entries(groupedComponents).map(([type, typeComponents]) => {
            const typeInfo = TYPE_LABELS[type] || { label: "其他", color: "bg-gray-100 text-gray-700" };

            return (
              <div key={type}>
                {/* 分组标题 */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    {typeComponents.length} 个组件
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* 组件卡片 */}
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {typeComponents.map(component => (
                    <ComponentRow
                      key={component.id}
                      component={component}
                      editingId={editingId}
                      editPrice={editPrice}
                      onEditStart={handleEditStart}
                      onEditCancel={handleEditCancel}
                      onEditSave={handleEditSave}
                      onPriceChange={setEditPrice}
                      onToggle={handleToggle}
                      isSaving={isSaving}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {components.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              暂无可配置的组件
            </h3>
            <p className="text-gray-600">
              平台组件正在准备中，请稍后再来查看。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
