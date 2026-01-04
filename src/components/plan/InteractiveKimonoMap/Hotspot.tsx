"use client";

import EditorHotspot from "@/components/shared/EditorHotspot";
import type { HotspotData } from "./types";

interface HotspotProps {
  hotspot: HotspotData;
  onClick: () => void;
  isSelected: boolean;
  isHovered?: boolean;
  showGuide?: boolean;
}

/**
 * 用户展示用的热点组件 - 使用统一的 EditorHotspot 组件
 * 保证编辑器和展示的视觉一致性 (WYSIWYG)
 */
export default function Hotspot({ hotspot, onClick, isSelected, isHovered = false, showGuide = false }: HotspotProps) {
  const { x, y, labelPosition, labelOffsetX, labelOffsetY, component, isIncluded = true } = hotspot;
  // v9.1: 直接使用组件原生名称（不再支持套餐级别名称覆盖）
  const displayName = component.name;
  const icon = component.icon || "📍";

  return (
    <EditorHotspot
      hotspot={{
        id: hotspot.id,
        x,
        y,
        labelPosition,
        labelOffsetX: labelOffsetX ?? undefined,
        labelOffsetY: labelOffsetY ?? undefined,
        name: displayName,
        icon,
        isIncluded,
      }}
      onClick={onClick}
      isSelected={isSelected}
      isEditable={false}
      externalHovered={isHovered}
      showGuide={showGuide}
    />
  );
}
