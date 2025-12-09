// Background & Pose Types for Virtual Try-On V2

/**
 * 背景分类
 */
export type BackgroundCategory = 'girl' | 'boy' | 'kid';

/**
 * 背景/姿势参考项
 */
export interface BackgroundPoseItem {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 分类 */
  category: BackgroundCategory;
  /** 原图URL（包含人物，用于姿势参考） */
  imageUrl: string;
  /** 反抠像URL（移除人物后的背景，人物位置为空洞/透明） */
  cleanBackgroundUrl?: string;
  /** 缩略图URL（可选，用于列表展示） */
  thumbnailUrl?: string;
  /** 姿势描述（如"站姿-双手合十"） */
  poseDescription?: string;
  /** 场景描述（如"神社鸟居前"） */
  sceneDescription?: string;
}

/**
 * 背景库结构
 */
export interface BackgroundLibrary {
  girl: BackgroundPoseItem[];
  boy: BackgroundPoseItem[];
  kid: BackgroundPoseItem[];
}

/**
 * 背景选择状态
 */
export interface BackgroundSelection {
  /** 是否使用原图背景 */
  useOriginalBackground: boolean;
  /** 选中的背景参考项（当 useOriginalBackground 为 false 时有效） */
  selectedBackground: BackgroundPoseItem | null;
}

/**
 * 背景分类标签配置
 */
export const CATEGORY_LABELS: Record<BackgroundCategory, string> = {
  girl: '女生',
  boy: '男生',
  kid: '儿童',
};

/**
 * 获取分类显示名称
 */
export function getCategoryLabel(category: BackgroundCategory): string {
  return CATEGORY_LABELS[category];
}
