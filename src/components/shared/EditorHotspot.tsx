"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Move, X } from "lucide-react";

export interface EditorHotspotData {
  id: string;
  x: number;
  y: number;
  labelPosition: "left" | "right" | "top" | "bottom";
  labelOffsetX?: number; // 标签相对于热点的 X 偏移（像素）
  labelOffsetY?: number; // 标签相对于热点的 Y 偏移（像素）
  name: string;
  icon: string;
  isIncluded?: boolean;
}

interface EditorHotspotProps {
  hotspot: EditorHotspotData;
  isEditable?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
  onRemove?: () => void;
  onClick?: (source: "hotspot" | "label") => void;
  onLabelOffsetChange?: (offsetX: number, offsetY: number) => void; // 标签位置变化回调
  isSelected?: boolean;
  externalHovered?: boolean;
  showGuide?: boolean;
}

/**
 * 热点组件 - 黑色直线连接热点和标签
 * 标签位置由用户拖拽决定，不自动调整
 */
export default function EditorHotspot({
  hotspot,
  isEditable = false,
  isDragging = false,
  onDragStart,
  onRemove,
  onClick,
  onLabelOffsetChange,
  isSelected = false,
  externalHovered = false,
}: EditorHotspotProps) {
  const [isHoveredInternal, setIsHoveredInternal] = useState(false);
  const [isLabelDragging, setIsLabelDragging] = useState(false);
  const [tempLabelOffset, setTempLabelOffset] = useState<{ x: number; y: number } | null>(null);

  const hotspotRef = useRef<HTMLButtonElement>(null);

  const isHovered = isHoveredInternal || externalHovered;
  const { x, y, labelPosition, labelOffsetX, labelOffsetY, name, icon, isIncluded = true } = hotspot;

  // 获取标签偏移（优先使用自定义偏移，否则使用默认值）
  const getLabelOffset = useCallback(() => {
    // 拖拽中使用临时偏移
    if (isLabelDragging && tempLabelOffset) {
      return tempLabelOffset;
    }

    // 使用已保存的偏移
    if (labelOffsetX !== undefined && labelOffsetY !== undefined) {
      return { x: labelOffsetX, y: labelOffsetY };
    }

    // 默认偏移（根据 labelPosition）
    const defaultOffset = 80;
    switch (labelPosition) {
      case "left":
        return { x: -defaultOffset, y: 0 };
      case "right":
        return { x: defaultOffset, y: 0 };
      case "top":
        return { x: 0, y: -60 };
      case "bottom":
        return { x: 0, y: 60 };
      default:
        return { x: defaultOffset, y: 0 };
    }
  }, [isLabelDragging, tempLabelOffset, labelOffsetX, labelOffsetY, labelPosition]);

  const currentOffset = getLabelOffset();
  const isOnLeft = currentOffset.x < 0;

  // 标签拖拽开始
  const handleLabelDragStart = useCallback((e: React.MouseEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();

    setIsLabelDragging(true);
    setTempLabelOffset(getLabelOffset());
  }, [isEditable, getLabelOffset]);

  // 标签拖拽中
  const handleLabelDragMove = useCallback((e: MouseEvent) => {
    if (!isLabelDragging || !hotspotRef.current) return;

    const rect = hotspotRef.current.getBoundingClientRect();
    const hotspotCenterX = rect.left + rect.width / 2;
    const hotspotCenterY = rect.top + rect.height / 2;

    let offsetX = e.clientX - hotspotCenterX;
    let offsetY = e.clientY - hotspotCenterY;

    // 限制最小距离（避免重叠）
    const minDistance = 50;
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    if (distance < minDistance) {
      const scale = minDistance / distance;
      offsetX *= scale;
      offsetY *= scale;
    }

    // 限制最大距离
    const maxDistance = 250;
    if (distance > maxDistance) {
      const scale = maxDistance / distance;
      offsetX *= scale;
      offsetY *= scale;
    }

    setTempLabelOffset({ x: offsetX, y: offsetY });
  }, [isLabelDragging]);

  // 标签拖拽结束
  const handleLabelDragEnd = useCallback(() => {
    if (!isLabelDragging || !tempLabelOffset) return;

    // 通知父组件保存新的偏移位置
    onLabelOffsetChange?.(tempLabelOffset.x, tempLabelOffset.y);

    setIsLabelDragging(false);
    setTempLabelOffset(null);
  }, [isLabelDragging, tempLabelOffset, onLabelOffsetChange]);

  // 绑定/解绑标签拖拽事件
  useEffect(() => {
    if (isLabelDragging) {
      window.addEventListener("mousemove", handleLabelDragMove);
      window.addEventListener("mouseup", handleLabelDragEnd);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
      return () => {
        window.removeEventListener("mousemove", handleLabelDragMove);
        window.removeEventListener("mouseup", handleLabelDragEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isLabelDragging, handleLabelDragMove, handleLabelDragEnd]);

  const showExpanded = isHovered || isSelected || isDragging || isLabelDragging;

  return (
    <div
      className="absolute group"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging || isLabelDragging ? 30 : isSelected ? 20 : 10,
      }}
    >
      {/* 热点圆点 */}
      <button
        ref={hotspotRef}
        type="button"
        onClick={() => onClick?.("hotspot")}
        onMouseEnter={() => setIsHoveredInternal(true)}
        onMouseLeave={() => setIsHoveredInternal(false)}
        onMouseDown={isEditable ? onDragStart : undefined}
        className={`
          relative z-10 w-7 h-7 rounded-full
          flex items-center justify-center
          transition-all duration-300
          ${isDragging
            ? "bg-sakura-600 scale-150 shadow-lg ring-4 ring-sakura-200/60 cursor-grabbing"
            : isSelected
              ? "bg-sakura-600 scale-125 shadow-lg ring-3 ring-sakura-300/50"
              : isHovered
                ? "bg-sakura-500 scale-105 shadow-md"
                : isIncluded
                  ? "bg-sakura-400 hover:bg-sakura-500 hover:scale-105 shadow-sm"
                  : "bg-gray-400 hover:bg-gray-500 hover:scale-105"
          }
        `}
        style={{
          boxShadow: isSelected || isDragging
            ? "0 4px 12px -2px rgba(255, 122, 154, 0.4)"
            : undefined,
        }}
        aria-label={isEditable ? `拖拽调整 ${name} 位置` : `查看 ${name} 详情`}
      >
        <span className="text-white text-[11px]">{icon}</span>
        {isEditable && !isDragging && !isSelected && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Move className="w-2.5 h-2.5 text-gray-500" />
          </div>
        )}
      </button>

      {/* 脉冲动画圈 */}
      {!isSelected && !isDragging && isIncluded && !isEditable && !isHovered && (
        <div
          className="absolute inset-0 rounded-full bg-sakura-300 opacity-50 animate-pulse"
          style={{ animationDuration: "2.5s" }}
        />
      )}

      {/* 连接线 - 日式优雅风格 */}
      {(() => {
        const lineLength = Math.sqrt(currentOffset.x ** 2 + currentOffset.y ** 2);
        const angle = Math.atan2(currentOffset.y, currentOffset.x) * (180 / Math.PI);

        // 根据选中状态决定颜色
        const lineColor = isSelected || isLabelDragging
          ? "rgba(255, 122, 154, 0.6)"  // sakura-400 with opacity
          : "rgba(180, 168, 154, 0.5)"; // wabi-400 (#B8A89A) with opacity

        const dotColor = isSelected || isLabelDragging
          ? "rgb(255, 122, 154)"  // sakura-400
          : "rgb(180, 168, 154)"; // wabi-400

        return (
          <>
            {/* 连接线 - 渐变效果 */}
            <div
              className={`absolute pointer-events-none ${isLabelDragging ? "" : "transition-all duration-300"}`}
              style={{
                width: lineLength,
                height: 1,
                left: "50%",
                top: "50%",
                transformOrigin: "0 50%",
                transform: `rotate(${angle}deg)`,
                background: `linear-gradient(to right, ${lineColor}, transparent)`,
                zIndex: 4,
              }}
            />
            {/* 终点小圆点 - 标签连接处 */}
            <div
              className={`absolute rounded-full pointer-events-none ${isLabelDragging ? "" : "transition-all duration-300"}`}
              style={{
                width: 5,
                height: 5,
                left: `calc(50% + ${currentOffset.x}px)`,
                top: `calc(50% + ${currentOffset.y}px)`,
                transform: "translate(-50%, -50%)",
                backgroundColor: dotColor,
                zIndex: 5,
              }}
            />
          </>
        );
      })()}

      {/* 标签卡片 */}
      <div
        className={`
          absolute whitespace-nowrap
          ${isLabelDragging ? "" : "transition-all duration-200"}
          ${showExpanded ? "opacity-100" : "opacity-90"}
        `}
        style={{
          left: `calc(50% + ${currentOffset.x}px)`,
          top: `calc(50% + ${currentOffset.y}px)`,
          transform: isOnLeft ? "translate(-100%, -50%)" : "translate(0%, -50%)",
        }}
      >
        <div
          onClick={() => onClick?.("label")}
          onMouseEnter={() => setIsHoveredInternal(true)}
          onMouseLeave={() => setIsHoveredInternal(false)}
          onMouseDown={isEditable ? handleLabelDragStart : undefined}
          className={`
            bg-white rounded-xl border px-3 py-2
            transition-all duration-300
            ${isEditable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
            ${isLabelDragging
              ? "shadow-xl border-sakura-400 ring-2 ring-sakura-200/50 scale-105"
              : isSelected
                ? "shadow-lg border-sakura-300 ring-2 ring-sakura-200/50"
                : showExpanded
                  ? "shadow-md border-gray-200 hover:border-sakura-200"
                  : "shadow-sm border-gray-200"
            }
          `}
          style={{
            boxShadow: isSelected || isLabelDragging
              ? "0 4px 16px -4px rgba(255, 122, 154, 0.25)"
              : undefined,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px]">{icon}</span>
            <span
              className={`
                text-[14px] font-medium
                ${isSelected ? "text-sakura-700" : isIncluded ? "text-gray-800" : "text-gray-500"}
              `}
            >
              {name}
            </span>
            {isIncluded && !isEditable && (
              <span className="text-sakura-500 text-[12px]">✓</span>
            )}

            {isEditable && onRemove && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="w-5 h-5 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors"
                  title="移除组件"
                >
                  <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
