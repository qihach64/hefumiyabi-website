import { ComponentType } from "@prisma/client";

// v10.1: 简化的组件数据（移除了升级系统）
export interface ServiceComponentData {
  id: string;
  code: string;
  name: string;
  nameJa?: string | null;
  nameEn?: string | null;
  description?: string | null;
  type: ComponentType;
  icon?: string | null;
  highlights: string[];
  images: string[];
  isBaseComponent: boolean;
}

export interface HotspotData {
  id: string;
  x: number;
  y: number;
  labelPosition: "left" | "right" | "top" | "bottom";
  displayOrder: number;
  component: ServiceComponentData;
  // Plan-specific config (v9.1 simplified)
  isIncluded?: boolean;
  quantity?: number;
}

export interface MapData {
  imageUrl: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  hotspots: HotspotData[];
}

export interface InteractiveKimonoMapProps {
  mapData: MapData;
  onHotspotClick?: (hotspot: HotspotData) => void;
  className?: string;
  /** Layout mode: 'horizontal' (default) or 'vertical' for narrow containers */
  layout?: "horizontal" | "vertical";
}
