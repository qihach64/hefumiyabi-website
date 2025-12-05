"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Move, Save, Loader2, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui";

interface HotspotData {
  id: string;
  x: number;
  y: number;
  labelPosition: "left" | "right" | "top" | "bottom";
  displayOrder: number;
  componentName: string;
  componentIcon: string | null;
}

interface HotspotEditorProps {
  templateId: string;
  imageUrl: string;
  hotspots: HotspotData[];
  onSave?: (hotspots: HotspotData[]) => void;
}

export default function HotspotEditor({
  templateId,
  imageUrl,
  hotspots: initialHotspots,
  onSave,
}: HotspotEditorProps) {
  const [hotspots, setHotspots] = useState<HotspotData[]>(initialHotspots);
  const [originalHotspots] = useState<HotspotData[]>(initialHotspots);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检查是否有修改
  const hasChanges = JSON.stringify(hotspots) !== JSON.stringify(originalHotspots);

  // 处理拖拽开始
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, hotspotId: string) => {
      e.preventDefault();
      setSelectedId(hotspotId);
      setIsDragging(true);
    },
    []
  );

  // 处理拖拽移动
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !selectedId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      setHotspots((prev) =>
        prev.map((h) => (h.id === selectedId ? { ...h, x, y } : h))
      );
    },
    [isDragging, selectedId]
  );

  // 处理拖拽结束
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 重置到原始位置
  const handleReset = () => {
    setHotspots(originalHotspots);
    setSelectedId(null);
  };

  // 保存修改
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/admin/map-templates/${templateId}/hotspots`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotspots: hotspots.map((h) => ({
            id: h.id,
            x: h.x,
            y: h.y,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "保存失败");
      }

      setSaveSuccess(true);
      onSave?.(hotspots);

      // 3秒后隐藏成功提示
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 更新标签方向
  const handleLabelPositionChange = (hotspotId: string, position: "left" | "right" | "top" | "bottom") => {
    setHotspots((prev) =>
      prev.map((h) => (h.id === hotspotId ? { ...h, labelPosition: position } : h))
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">热点位置编辑器</h2>
          <p className="text-sm text-gray-500 mt-1">
            拖拽热点标记到正确的位置
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存位置
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 状态提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          保存成功！
        </div>
      )}

      {/* 编辑器区域 */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 左侧：图片和热点 */}
        <div className="lg:w-2/3">
          <div
            ref={containerRef}
            className={`relative bg-gray-100 rounded-xl overflow-hidden aspect-[2/3] ${
              isDragging ? "cursor-grabbing" : "cursor-default"
            }`}
          >
            <Image
              src={imageUrl}
              alt="和服配件图"
              fill
              className="object-contain pointer-events-none"
              unoptimized
            />

            {/* 热点标记 */}
            {hotspots.map((hotspot) => {
              const isSelected = selectedId === hotspot.id;
              return (
                <div
                  key={hotspot.id}
                  className="absolute"
                  style={{
                    left: `${hotspot.x * 100}%`,
                    top: `${hotspot.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: isSelected ? 20 : 10,
                  }}
                >
                  {/* 拖拽手柄 */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, hotspot.id)}
                    onClick={() => setSelectedId(isSelected ? null : hotspot.id)}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      cursor-grab transition-all duration-200
                      ${
                        isSelected
                          ? "bg-sakura-600 ring-4 ring-sakura-200 scale-125"
                          : "bg-sakura-500 hover:bg-sakura-600 hover:scale-110"
                      }
                    `}
                  >
                    <Move className="w-4 h-4 text-white" />
                  </div>

                  {/* 标签预览 */}
                  <div
                    className={`
                      absolute whitespace-nowrap bg-white rounded-lg shadow-lg border border-gray-200
                      px-2 py-1 text-sm pointer-events-none
                      transition-opacity duration-200
                      ${isSelected ? "opacity-100" : "opacity-70"}
                    `}
                    style={{
                      ...(hotspot.labelPosition === "left" && {
                        right: "100%",
                        marginRight: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }),
                      ...(hotspot.labelPosition === "right" && {
                        left: "100%",
                        marginLeft: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }),
                      ...(hotspot.labelPosition === "top" && {
                        bottom: "100%",
                        marginBottom: "12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }),
                      ...(hotspot.labelPosition === "bottom" && {
                        top: "100%",
                        marginTop: "12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                      }),
                    }}
                  >
                    <span className="mr-1">{hotspot.componentIcon || "📍"}</span>
                    {hotspot.componentName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：热点列表 */}
        <div className="lg:w-1/3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">热点列表</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {hotspots.map((hotspot) => {
              const isSelected = selectedId === hotspot.id;
              return (
                <div
                  key={hotspot.id}
                  onClick={() => setSelectedId(isSelected ? null : hotspot.id)}
                  className={`
                    p-3 rounded-xl border cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? "border-sakura-400 bg-sakura-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{hotspot.componentIcon || "📍"}</span>
                    <span className="font-medium text-gray-900 text-sm">
                      {hotspot.componentName}
                    </span>
                  </div>

                  {/* 坐标显示 */}
                  <div className="text-xs text-gray-500 mb-2">
                    坐标: ({(hotspot.x * 100).toFixed(1)}%, {(hotspot.y * 100).toFixed(1)}%)
                  </div>

                  {/* 标签方向选择 */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">标签方向</p>
                      <div className="grid grid-cols-4 gap-1">
                        {(["left", "right", "top", "bottom"] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLabelPositionChange(hotspot.id, pos);
                            }}
                            className={`
                              px-2 py-1 text-xs rounded-lg transition-colors
                              ${
                                hotspot.labelPosition === pos
                                  ? "bg-sakura-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }
                            `}
                          >
                            {pos === "left" && "左"}
                            {pos === "right" && "右"}
                            {pos === "top" && "上"}
                            {pos === "bottom" && "下"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="text-sm font-medium text-gray-700 mb-2">使用说明</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 点击热点可以选中，再次点击取消选中</li>
          <li>• 拖拽热点到图片上的正确位置</li>
          <li>• 选中热点后可以调整标签显示方向</li>
          <li>• 修改后点击「保存位置」按钮保存</li>
        </ul>
      </div>
    </div>
  );
}
