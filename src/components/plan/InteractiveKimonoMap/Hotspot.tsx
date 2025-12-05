"use client";

import { useState } from "react";
import type { HotspotData } from "./types";

interface HotspotProps {
  hotspot: HotspotData;
  onClick: () => void;
  isSelected: boolean;
}

export default function Hotspot({ hotspot, onClick, isSelected }: HotspotProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { x, y, labelPosition, component, isIncluded = true } = hotspot;
  const displayName = hotspot.nameOverride || component.name;
  const icon = component.icon || "📍";

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

  return (
    <div
      className="absolute"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* 热点圆点 */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative z-10 w-6 h-6 rounded-full
          flex items-center justify-center
          transition-all duration-300
          ${
            isSelected
              ? "bg-sakura-600 scale-125 shadow-lg"
              : isIncluded
                ? "bg-sakura-500 hover:bg-sakura-600 hover:scale-110"
                : "bg-gray-400 hover:bg-gray-500 hover:scale-110"
          }
          ${!isSelected && "animate-pulse"}
        `}
        aria-label={`查看 ${displayName} 详情`}
      >
        <span className="text-white text-[10px]">{icon}</span>
      </button>

      {/* 脉冲动画圈 */}
      {!isSelected && isIncluded && (
        <div
          className="absolute inset-0 rounded-full bg-sakura-400 opacity-50 animate-ping"
          style={{ animationDuration: "2s" }}
        />
      )}

      {/* 连接线 */}
      <div
        className={`
          absolute bg-gray-300
          transition-all duration-300
          ${isHovered || isSelected ? "opacity-100" : "opacity-60"}
        `}
        style={getLineStyle()}
      />

      {/* 标签 */}
      <div
        className={`
          absolute whitespace-nowrap
          pointer-events-none
          transition-all duration-300
          ${isHovered || isSelected ? "opacity-100" : "opacity-80"}
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
            ${isHovered || isSelected ? "shadow-xl scale-105" : ""}
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
              {displayName}
            </span>
            {isIncluded && (
              <span className="text-sakura-600 text-[12px]">✓</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
