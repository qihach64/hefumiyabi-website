"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Loader2,
  ImagePlus,
  Trash2,
  GripVertical,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui";
import ImageUploader from "@/components/ImageUploader";

interface MerchantComponentData {
  id: string;
  templateId: string;
  code: string;
  name: string;
  nameJa: string | null;
  type: string;
  icon: string | null;
  basePrice: number;
  description: string | null;
  images: string[];
  highlights: string[];
  price: number | null;
  isEnabled: boolean;
  effectivePrice: number;
  // 用于区分是自定义还是默认值
  hasCustomImages?: boolean;
  hasCustomHighlights?: boolean;
  defaultImages?: string[];
  defaultHighlights?: string[];
}

interface ComponentEditModalProps {
  component: MerchantComponentData;
  onClose: () => void;
  onSave: (data: {
    id: string;
    images: string[];
    highlights: string[];
  }) => Promise<void>;
}

export default function ComponentEditModal({
  component,
  onClose,
  onSave,
}: ComponentEditModalProps) {
  const [images, setImages] = useState<string[]>(component.images || []);
  const [highlights, setHighlights] = useState<string[]>(
    component.highlights || []
  );
  const [newHighlight, setNewHighlight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);

  // 拖拽排序状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 保存
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        id: component.id,
        images,
        highlights,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 添加亮点
  const addHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  // 删除亮点
  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  // 删除图片
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // 图片拖拽开始
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // 图片拖拽结束
  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newImages = [...images];
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(dragOverIndex, 0, removed);
      setImages(newImages);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 图片拖拽进入
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // 恢复默认值
  const resetToDefaults = () => {
    if (component.defaultImages) {
      setImages(component.defaultImages);
    }
    if (component.defaultHighlights) {
      setHighlights(component.defaultHighlights);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sakura-50 flex items-center justify-center">
              <span className="text-xl">{component.icon || "📦"}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{component.name}</h2>
              {component.nameJa && (
                <p className="text-sm text-gray-500">{component.nameJa}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 图片管理 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                组件图片
                <span className="text-gray-400 text-xs ml-2">
                  拖拽排序，第一张为主图
                </span>
              </label>
              <button
                onClick={() => setShowImageUploader(!showImageUploader)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-sakura-600 hover:bg-sakura-50 rounded-lg transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                上传图片
              </button>
            </div>

            {/* 图片上传器 */}
            {showImageUploader && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <ImageUploader
                  category="merchant"
                  purpose="gallery"
                  multiple={true}
                  maxFiles={10}
                  value={images}
                  onChange={(newImages) => {
                    setImages(newImages);
                    if (newImages.length > 0) {
                      setShowImageUploader(false);
                    }
                  }}
                />
              </div>
            )}

            {/* 图片列表 */}
            {images.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {images.map((url, index) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    className={`
                      relative aspect-square rounded-xl overflow-hidden group cursor-move
                      ${draggedIndex === index ? "opacity-50" : ""}
                      ${dragOverIndex === index ? "ring-2 ring-sakura-400" : ""}
                      ${index === 0 ? "ring-2 ring-sakura-500" : "border border-gray-200"}
                    `}
                  >
                    <Image
                      src={url}
                      alt={`图片 ${index + 1}`}
                      fill
                      className="object-cover"
                    />

                    {/* 主图标记 */}
                    {index === 0 && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-sakura-500 text-white text-[10px] font-medium rounded">
                        主图
                      </div>
                    )}

                    {/* 拖拽手柄 */}
                    <div className="absolute top-1 right-1 p-1 bg-black/30 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3 h-3 text-white" />
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute bottom-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无图片，点击上方按钮上传</p>
              </div>
            )}
          </div>

          {/* 亮点管理 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              组件亮点
              <span className="text-gray-400 text-xs ml-2">
                突出展示的特点（如：100%正绢、手工染色）
              </span>
            </label>

            {/* 已有亮点 */}
            <div className="space-y-2 mb-3">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group"
                >
                  <span className="text-sakura-500">•</span>
                  <span className="flex-1 text-sm text-gray-700">{highlight}</span>
                  <button
                    onClick={() => removeHighlight(index)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* 添加新亮点 */}
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                           focus:ring-2 focus:ring-sakura-400/50 focus:border-sakura-400
                           transition-all"
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

          {/* 恢复默认按钮 */}
          {(component.defaultImages || component.defaultHighlights) && (
            <button
              onClick={resetToDefaults}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              恢复平台默认内容
            </button>
          )}
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  保存修改
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
