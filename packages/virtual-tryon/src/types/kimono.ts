/**
 * 和服库类型定义
 * 复用 background&pose 素材作为和服款式参考
 */

/**
 * 和服分类
 * - female: 女性和服（源自 girl background）
 * - male: 男性和服（源自 boy background）
 * - child: 儿童和服（源自 kid background）
 */
export type KimonoCategory = 'female' | 'male' | 'child';

/**
 * 和服库项目
 */
export interface KimonoLibraryItem {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 和服分类 */
  category: KimonoCategory;
  /** 图片URL（复用背景图，用于UI展示） */
  imageUrl: string;
  /** 处理后的纯和服图片URL（用于AI生成，移除了人物和背景） */
  cleanImageUrl?: string;
  /** 可选标签 */
  tags?: string[];
}

/**
 * 和服库结构
 */
export interface KimonoLibrary {
  female: KimonoLibraryItem[];
  male: KimonoLibraryItem[];
  child: KimonoLibraryItem[];
}

/**
 * 和服分类标签映射
 */
export const KIMONO_CATEGORY_LABELS: Record<KimonoCategory, string> = {
  female: '女性',
  male: '男性',
  child: '儿童',
};

/**
 * 所有和服分类
 */
export const KIMONO_CATEGORIES: KimonoCategory[] = ['female', 'male', 'child'];
