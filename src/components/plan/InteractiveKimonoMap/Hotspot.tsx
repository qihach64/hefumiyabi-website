"use client";

import EditorHotspot from "@/components/shared/EditorHotspot";
import type { HotspotData } from "./types";

interface HotspotProps {
  hotspot: HotspotData;
  onClick: () => void;
  isSelected: boolean;
}

/**
 * 用户展示用的热点组件 - 使用统一的 EditorHotspot 组件
 * 保证编辑器和展示的视觉一致性 (WYSIWYG)
 */
export default function Hotspot({ hotspot, onClick, isSelected }: HotspotProps) {
  const { x, y, labelPosition, component, isIncluded = true } = hotspot;
  const displayName = hotspot.nameOverride || component.name;
  const icon = component.icon || "📍";

  return (
    <EditorHotspot
      hotspot={{
        id: hotspot.id,
        x,
        y,
        labelPosition,
        name: displayName,
        icon,
        isIncluded,
      }}
      onClick={onClick}
      isSelected={isSelected}
      isEditable={false}
    />
  );
}
