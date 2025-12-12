import { ComponentType } from "@prisma/client";

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
  upgradeCost?: number | null;
  upgradesTo?: ServiceComponentData[];
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
