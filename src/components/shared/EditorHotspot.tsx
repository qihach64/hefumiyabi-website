"use client";

import { useState } from "react";
import { Move, X } from "lucide-react";

export interface EditorHotspotData {
  id: string;
  x: number;
  y: number;
  labelPosition: "left" | "right" | "top" | "bottom";
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
  onClick?: () => void;
  isSelected?: boolean;
  externalHovered?: boolean; // 外部控制的 hover 状态（用于列表联动）
  showGuide?: boolean; // 显示引导动画
}

/**
 * 统一的热点组件 - 用于编辑器和用户展示
 * 设计风格: Japanese Modernism
 * 颜色语义:
 * - sakura-500: 已选中/已包含的服务
 * - gray-400: 未包含的服务
 */
export default function EditorHotspot({
  hotspot,
  isEditable = false,
  isDragging = false,
  onDragStart,
  onRemove,
  onClick,
  isSelected = false,
  externalHovered = false,
  showGuide = false,
}: EditorHotspotProps) {
  const [isHoveredInternal, setIsHoveredInternal] = useState(false);

  // 合并内部和外部的 hover 状态
  const isHovered = isHoveredInternal || externalHovered;

  const { x, y, labelPosition, name, icon, isIncluded = true } = hotspot;

  // 计算标签偏移
  const getLabelOffset = () => {
    const baseOffset = 48; // px
    switch (labelPosition) {
      case "left":
        return { left: `-${baseOffset}px`, transform: "translateX(-100%)" };
      case "right":
        return { left: `${baseOffset}px` };
      case "top":
        return { top: `-${baseOffset}px`, transform: "translateY(-100%)" };
      case "bottom":
        return { top: `${baseOffset}px` };
      default:
        return { left: `${baseOffset}px` };
    }
  };

  // 计算连接线的位置
  const getLineStyle = () => {
    const lineLength = 32; // px
    switch (labelPosition) {
      case "left":
        return {
          width: `${lineLength}px`,
          height: "1px",
          left: `-${lineLength}px`,
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          width: `${lineLength}px`,
          height: "1px",
          left: "100%",
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "top":
        return {
          width: "1px",
          height: `${lineLength}px`,
          left: "50%",
          top: `-${lineLength}px`,
          transform: "translateX(-50%)",
        };
      case "bottom":
        return {
          width: "1px",
          height: `${lineLength}px`,
          left: "50%",
          top: "100%",
          transform: "translateX(-50%)",
        };
      default:
        return {};
    }
  };

  const showExpanded = isHovered || isSelected || isDragging;

  return (
    <div
      className="absolute group"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging ? 30 : isSelected ? 20 : 10,
      }}
    >
      {/* 热点圆点 */}
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHoveredInternal(true)}
        onMouseLeave={() => setIsHoveredInternal(false)}
        onMouseDown={isEditable ? onDragStart : undefined}
        className={`
          relative z-10 w-6 h-6 rounded-full
          flex items-center justify-center
          transition-all duration-300
          ${isDragging
            ? "bg-sakura-600 scale-150 shadow-lg ring-4 ring-sakura-300 cursor-grabbing"
            : isSelected
              ? "bg-sakura-600 scale-125 shadow-lg ring-2 ring-sakura-300"
              : isHovered
                ? "bg-sakura-600 scale-110 shadow-lg"
                : isIncluded
                  ? "bg-sakura-500 hover:bg-sakura-600 hover:scale-110"
                  : "bg-gray-400 hover:bg-gray-500 hover:scale-110"
          }
          ${isEditable && !isDragging ? "cursor-grab" : "cursor-pointer"}
        `}
        aria-label={isEditable ? `拖拽调整 ${name} 位置` : `查看 ${name} 详情`}
      >
        <span className="text-white text-[10px]">{icon}</span>
        {/* 编辑模式下的拖拽提示 */}
        {isEditable && !isDragging && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Move className="w-2.5 h-2.5 text-gray-500" />
          </div>
        )}
      </button>

      {/* 脉冲动画圈 - 引导模式或默认脉冲 */}
      {!isSelected && !isDragging && isIncluded && !isEditable && (showGuide || !isHovered) && (
        <div
          className={`absolute inset-0 rounded-full bg-sakura-400 ${showGuide ? 'opacity-70 animate-ping' : 'opacity-40 animate-pulse'}`}
          style={{ animationDuration: showGuide ? "1s" : "2s" }}
        />
      )}

      {/* 连接线 */}
      <div
        className={`
          absolute bg-gray-300
          transition-all duration-300
          ${showExpanded ? "opacity-100" : "opacity-60"}
        `}
        style={getLineStyle()}
      />

      {/* 标签 */}
      <div
        className={`
          absolute whitespace-nowrap
          pointer-events-none
          transition-all duration-300
          ${showExpanded ? "opacity-100" : "opacity-80"}
        `}
        style={{
          ...getLabelOffset(),
          top: labelPosition === "top" || labelPosition === "bottom" ? undefined : "50%",
          ...(labelPosition !== "top" &&
            labelPosition !== "bottom" && { transform: `translateY(-50%) ${getLabelOffset().transform || ""}` }),
        }}
      >
        <div
          className={`
            bg-white rounded-lg shadow-lg border border-gray-200
            px-3 py-2
            transition-all duration-300
            ${showExpanded ? "shadow-xl scale-105" : ""}
            ${isEditable ? "pointer-events-auto" : ""}
          `}
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px]">{icon}</span>
            <span
              className={`
                text-[14px] font-medium
                ${isIncluded ? "text-gray-900" : "text-gray-500"}
              `}
            >
              {name}
            </span>
            {isIncluded && (
              <span className="text-sakura-600 text-[12px]">✓</span>
            )}
            {/* 编辑模式下的移除按钮 */}
            {isEditable && onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="ml-1 w-5 h-5 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
