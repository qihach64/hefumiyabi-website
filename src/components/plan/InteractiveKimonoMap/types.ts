import { ComponentType, OutfitCategory } from "@prisma/client";

// v10.2: 组件数据（含 OUTFIT 分类）
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
  outfitCategory?: OutfitCategory | null; // v10.2: OUTFIT 分类
}

export interface HotspotData {
  id: string;
  x: number;
  y: number;
  labelPosition: "left" | "right" | "top" | "bottom";
  labelOffsetX?: number | null; // 标签 X 偏移（像素）
  labelOffsetY?: number | null; // 标签 Y 偏移（像素）
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
