"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ImageComparison({
  beforeImage,
  afterImage,
  beforeLabel = "原图",
  afterLabel = "试穿效果",
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"before" | "after">("after");

  // 处理滑块拖动（桌面端）
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <>
      {/* 桌面端：滑块对比 */}
      <div className="hidden md:block relative aspect-square overflow-hidden rounded-xl bg-gray-100">
        <div
          className="relative w-full h-full cursor-ew-resize select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          {/* Before 图片（底层，完整显示） */}
          <div className="absolute inset-0">
            <Image
              src={beforeImage}
              alt={beforeLabel}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-xs font-semibold rounded-full">
              {beforeLabel}
            </div>
          </div>

          {/* After 图片（顶层，通过 clip-path 裁剪） */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            }}
          >
            <Image
              src={afterImage}
              alt={afterLabel}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 text-white text-xs font-semibold rounded-full">
              {afterLabel}
            </div>
          </div>

          {/* 滑块指示器 */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
            style={{ left: `${sliderPosition}%` }}
          >
            {/* 圆形拖动手柄 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-4 bg-gray-400 rounded-full" />
                <div className="w-1 h-4 bg-gray-400 rounded-full" />
              </div>
            </div>
          </div>

          {/* 提示文字 */}
          {!isDragging && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 text-white text-xs font-medium rounded-full pointer-events-none">
              ← 拖动滑块查看对比 →
            </div>
          )}
        </div>
      </div>

      {/* 移动端：Tab 切换 */}
      <div className="md:hidden">
        {/* Tab 按钮 */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setActiveTab("before")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === "before"
                ? "bg-sakura-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {beforeLabel}
          </button>
          <button
            onClick={() => setActiveTab("after")}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === "after"
                ? "bg-sakura-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {afterLabel}
          </button>
        </div>

        {/* 图片显示 */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={activeTab === "before" ? beforeImage : afterImage}
            alt={activeTab === "before" ? beforeLabel : afterLabel}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      </div>
    </>
  );
}
