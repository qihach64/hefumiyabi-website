"use client";

import { useState } from "react";
import {
  X,
  Sparkles,
  Package,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui";
import ImageUploader from "@/components/ImageUploader";

export type ServiceType = "BASE" | "ADDON";

interface CreateCustomServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceType: ServiceType;
}

const SERVICE_TYPE_CONFIG = {
  BASE: {
    title: "创建自定义包含服务",
    description: "添加套餐内包含的基础服务项目",
    icon: <Package className="w-5 h-5" />,
    placeholder: {
      name: "例如：专属管家服务",
      description: "例如：全程专属管家陪同，提供贴心服务",
    },
    priceLabel: "建议价格（可选）",
    priceNote: "此价格仅供参考，不影响套餐总价",
  },
  ADDON: {
    title: "创建自定义升级服务",
    description: "添加可选的付费增值服务",
    icon: <Sparkles className="w-5 h-5" />,
    placeholder: {
      name: "例如：VIP 化妆服务",
      description: "例如：资深造型师一对一服务，含高端化妆品",
    },
    priceLabel: "服务价格",
    priceNote: "顾客选择此服务需额外支付的费用",
  },
};

export default function CreateCustomServiceModal({
  isOpen,
  onClose,
  onSuccess,
  serviceType,
}: CreateCustomServiceModalProps) {
  const config = SERVICE_TYPE_CONFIG[serviceType];

  // 表单状态
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [price, setPrice] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");
  const [showImageUploader, setShowImageUploader] = useState(false);

  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setNameEn("");
    setDescription("");
    setIcon("");
    setPrice("");
    setImages([]);
    setHighlights([]);
    setNewHighlight("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addHighlight = () => {
    if (newHighlight.trim() && highlights.length < 10) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // 验证
    if (!name.trim()) {
      setError("请填写服务名称");
      return;
    }

    if (serviceType === "ADDON" && !price) {
      setError("请填写服务价格");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/merchant/custom-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: serviceType,
          customName: name.trim(),
          customNameEn: nameEn.trim() || null,
          customDescription: description.trim() || null,
          customIcon: icon.trim() || (serviceType === "ADDON" ? "✨" : "📦"),
          customBasePrice: price ? Math.round(parseFloat(price) * 100) : 0,
          images,
          highlights,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "创建失败");
      }

      // 成功
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sakura-50 flex items-center justify-center text-sakura-600">
              {config.icon}
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-gray-900">
                {config.title}
              </h2>
              <p className="text-[12px] text-gray-500">{config.description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 审核提示 */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-700">
            自定义服务需要平台审核后才能使用。审核通常在 1-2 个工作日内完成。
          </p>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 错误提示 */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* 服务名称 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              服务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config.placeholder.name}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] focus:ring-2 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
              maxLength={100}
            />
          </div>

          {/* 英文名称（可选） */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              英文名称 <span className="text-gray-400 text-[11px]">可选</span>
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="English name (optional)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] focus:ring-2 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
              maxLength={100}
            />
          </div>

          {/* 服务图标 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              图标 Emoji <span className="text-gray-400 text-[11px]">可选</span>
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={serviceType === "ADDON" ? "✨" : "📦"}
              className="w-20 px-4 py-2.5 border border-gray-200 rounded-xl text-[18px] text-center focus:ring-2 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
              maxLength={10}
            />
          </div>

          {/* 服务描述 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              服务描述 <span className="text-gray-400 text-[11px]">可选</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={config.placeholder.description}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] resize-none focus:ring-2 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
              maxLength={500}
            />
          </div>

          {/* 价格 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              {config.priceLabel}{" "}
              {serviceType === "ADDON" && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                ¥
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-[14px] focus:ring-2 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">{config.priceNote}</p>
          </div>

          {/* 服务亮点 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              服务亮点 <span className="text-gray-400 text-[11px]">可选，最多10条</span>
            </label>
            {highlights.length > 0 && (
              <div className="space-y-2 mb-3">
                {highlights.map((h, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group"
                  >
                    <span className="text-sakura-500">•</span>
                    <span className="flex-1 text-[13px] text-gray-700">{h}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(index)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:ring-1 focus:ring-sakura-200 focus:border-sakura-400 transition-all"
                maxLength={100}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addHighlight}
                disabled={!newHighlight.trim() || highlights.length >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 图片上传 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-medium text-gray-700">
                服务图片 <span className="text-gray-400 text-[11px]">可选，最多10张</span>
              </label>
              <button
                type="button"
                onClick={() => setShowImageUploader(!showImageUploader)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-sakura-600 hover:bg-sakura-50 rounded-lg transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                {showImageUploader ? "收起" : "上传"}
              </button>
            </div>

            {showImageUploader && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <ImageUploader
                  category="custom-service"
                  purpose="gallery"
                  multiple={true}
                  maxFiles={10}
                  value={images}
                  onChange={(newImages) => {
                    setImages(newImages);
                    if (newImages.length > 0) setShowImageUploader(false);
                  }}
                />
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((url, index) => (
                  <div
                    key={url}
                    className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200"
                  >
                    <img
                      src={url}
                      alt={`图片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                提交中...
              </>
            ) : (
              "提交审核"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
