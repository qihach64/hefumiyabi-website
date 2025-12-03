/**
 * 基于CSV文件定义的完整标签体系
 * 来源: Miyabi套餐方案_重构版.xlsx - 标签体系.csv
 */

export interface TagDefinition {
  code: string;           // 英文code,用于系统内部
  name: string;          // 显示名称(中文)
  nameEn?: string;       // 英文名称
  category: string;      // 所属分类code
  description?: string;  // 描述
  isAutomatic: boolean;  // 是否自动打标签
  requiresAuth: boolean; // 是否需要认证
}

export interface TagCategoryDefinition {
  code: string;
  name: string;
  nameEn?: string;
  icon: string;
  order: number;
  showInFilter: boolean;
}

/**
 * 标签分类定义
 */
export const TAG_CATEGORIES: TagCategoryDefinition[] = [
  {
    code: 'audience',
    name: '人群',
    nameEn: 'Audience',
    icon: '👥',
    order: 1,
    showInFilter: true
  },
  {
    code: 'scene',
    name: '场景',
    nameEn: 'Scene',
    icon: '🎆',
    order: 2,
    showInFilter: true
  },
  {
    code: 'style',
    name: '风格',
    nameEn: 'Style',
    icon: '💎',
    order: 3,
    showInFilter: true
  },
  {
    code: 'service',
    name: '服务',
    nameEn: 'Service',
    icon: '📦',
    order: 4,
    showInFilter: true
  },
  {
    code: 'marketing',
    name: '营销',
    nameEn: 'Marketing',
    icon: '💰',
    order: 5,
    showInFilter: false
  },
  {
    code: 'season',
    name: '季节',
    nameEn: 'Season',
    icon: '🏷️',
    order: 6,
    showInFilter: true
  },
  {
    code: 'location',
    name: '地理',
    nameEn: 'Location',
    icon: '📍',
    order: 7,
    showInFilter: true
  },
  {
    code: 'certification',
    name: '认证',
    nameEn: 'Certification',
    icon: '⭐',
    order: 8,
    showInFilter: true
  },
  {
    code: 'convenience',
    name: '便利',
    nameEn: 'Convenience',
    icon: '🛎️',
    order: 9,
    showInFilter: false
  }
];

/**
 * 标签定义
 */
export const TAGS: TagDefinition[] = [
  // 👥 人群 (10个)
  { code: 'solo', name: '单人', category: 'audience', isAutomatic: true, requiresAuth: false },
  { code: 'couple', name: '情侣', category: 'audience', isAutomatic: true, requiresAuth: false },
  { code: 'besties', name: '闺蜜', category: 'audience', isAutomatic: true, requiresAuth: false },
  { code: 'family', name: '家庭', category: 'audience', isAutomatic: true, requiresAuth: false },
  { code: 'parent-child', name: '亲子', category: 'audience', isAutomatic: true, requiresAuth: false },
  { code: 'group', name: '团体', category: 'audience', isAutomatic: true, requiresAuth: false, description: '10人以上' },
  { code: 'men-only', name: '男士专享', category: 'audience', isAutomatic: true, requiresAuth: false },
  { code: 'student-only', name: '学生专享', category: 'audience', isAutomatic: true, requiresAuth: false },
  { code: 'children-only', name: '儿童专属', category: 'audience', isAutomatic: true, requiresAuth: false },

  // 🎆 场景 (7个)
  { code: 'formal-occasion', name: '正式场合', category: 'scene', isAutomatic: true, requiresAuth: false },
  { code: 'graduation', name: '毕业季', category: 'scene', isAutomatic: false, requiresAuth: false },
  { code: 'coming-of-age', name: '成人式', category: 'scene', isAutomatic: false, requiresAuth: false },
  { code: 'fireworks-festival', name: '花火大会', category: 'scene', isAutomatic: false, requiresAuth: false },
  { code: 'cherry-blossom', name: '樱花巡礼', category: 'scene', isAutomatic: false, requiresAuth: false },
  { code: 'autumn-leaves', name: '枫叶巡礼', category: 'scene', isAutomatic: false, requiresAuth: false },
  { code: 'character-theme', name: '角色应援', category: 'scene', isAutomatic: false, requiresAuth: false },

  // 💎 风格 (5个)
  { code: 'photo-ready', name: '出片神器', category: 'style', isAutomatic: false, requiresAuth: false },
  { code: 'trendy-modern', name: '时尚新潮', category: 'style', isAutomatic: false, requiresAuth: false },
  { code: 'vintage-classic', name: '复古经典', category: 'style', isAutomatic: false, requiresAuth: false },
  { code: 'luxurious-elegant', name: '华丽精致', category: 'style', isAutomatic: false, requiresAuth: false },
  { code: 'simple-elegant', name: '简约素雅', category: 'style', isAutomatic: false, requiresAuth: false },

  // 📦 服务 (10个)
  { code: 'hair-styling', name: '含发型', category: 'service', isAutomatic: true, requiresAuth: false },
  { code: 'makeup', name: '含化妆', category: 'service', isAutomatic: true, requiresAuth: false },
  { code: 'photography', name: '含摄影', category: 'service', isAutomatic: true, requiresAuth: false },
  { code: 'accessory-package', name: '含配件套装', category: 'service', isAutomatic: true, requiresAuth: false },
  { code: 'vlog-shooting', name: '跟拍Vlog', category: 'service', isAutomatic: true, requiresAuth: false },
  { code: 'unlimited-selection', name: '全场任选', category: 'service', isAutomatic: true, requiresAuth: true, description: '需验证库存' },
  { code: 'all-inclusive', name: '一价全包', category: 'service', isAutomatic: true, requiresAuth: false },
  { code: 'retouched-photos', name: '赠精修合影', category: 'service', isAutomatic: true, requiresAuth: false },
  { code: 'overnight-rental', name: '过夜租赁', category: 'service', isAutomatic: true, requiresAuth: false },
  { code: 'extended-return', name: '延时归还', category: 'service', isAutomatic: true, requiresAuth: false },

  // 💰 营销 (9个)
  { code: 'value-entry', name: '超值入门', category: 'marketing', isAutomatic: false, requiresAuth: false },
  { code: 'lowest-price', name: '最低价格', category: 'marketing', isAutomatic: false, requiresAuth: false },
  { code: 'special-offer', name: '特惠价', category: 'marketing', isAutomatic: false, requiresAuth: false },
  { code: 'first-timer', name: '新人必选', category: 'marketing', isAutomatic: false, requiresAuth: false },
  { code: 'top-popular', name: '人气TOP', category: 'marketing', isAutomatic: false, requiresAuth: true, description: '需销量数据' },
  { code: 'recommended', name: '店长推荐', category: 'marketing', isAutomatic: false, requiresAuth: false },
  { code: 'flash-sale', name: '限时抢购', category: 'marketing', isAutomatic: false, requiresAuth: false },
  { code: 'group-discount', name: '团体优惠', category: 'marketing', isAutomatic: true, requiresAuth: false },
  { code: 'duo-discount', name: '双人同行', category: 'marketing', isAutomatic: true, requiresAuth: false },

  // 🏷️ 季节 (5个)
  { code: 'summer-limited', name: '夏季限定', category: 'season', isAutomatic: true, requiresAuth: false },
  { code: 'spring-limited', name: '春季限定', category: 'season', isAutomatic: false, requiresAuth: false },
  { code: 'autumn-limited', name: '秋季限定', category: 'season', isAutomatic: false, requiresAuth: false },
  { code: 'all-year', name: '全年可用', category: 'season', isAutomatic: true, requiresAuth: false },
  { code: 'once-a-year', name: '错过等一年', category: 'season', isAutomatic: false, requiresAuth: false },

  // 📍 地理 (3个)
  { code: 'multi-store', name: '多店通用', category: 'location', isAutomatic: true, requiresAuth: false },
  { code: 'kyoto-only', name: '京都限定', category: 'location', isAutomatic: true, requiresAuth: false },
  { code: 'asakusa-only', name: '浅草限定', category: 'location', isAutomatic: true, requiresAuth: false },

  // ⭐ 认证 (5个)
  { code: 'influencer-shop', name: '网红店铺', category: 'certification', isAutomatic: false, requiresAuth: true, description: '需社媒审核' },
  { code: 'century-old', name: '百年老店', category: 'certification', isAutomatic: false, requiresAuth: true, description: '需资质审核' },
  { code: 'pure-silk', name: '正绢材质', category: 'certification', isAutomatic: false, requiresAuth: true, description: '需材质证明' },
  { code: 'formal-wear', name: '礼服系列', category: 'certification', isAutomatic: true, requiresAuth: false },
  { code: 'premium-formal', name: '高端礼服', category: 'certification', isAutomatic: false, requiresAuth: true },

  // 🛎️ 便利 (3个)
  { code: 'chinese-service', name: '中文服务', category: 'convenience', isAutomatic: true, requiresAuth: false },
  { code: 'free-storage', name: '免费寄存', category: 'convenience', isAutomatic: true, requiresAuth: false },
  { code: 'flexible-hours', name: '灵活时段', category: 'convenience', isAutomatic: false, requiresAuth: false }
];

/**
 * 根据CSV标签名称获取tag code
 */
export function getTagCodeByName(tagName: string): string | null {
  // 去除#号
  const cleanName = tagName.replace(/^#/, '');
  const tag = TAGS.find(t => t.name === cleanName);
  return tag?.code || null;
}

/**
 * 解析CSV的标签字符串(如 "#含发型 #全场任选 #中文服务")
 */
export function parseCSVTags(tagString: string): string[] {
  if (!tagString) return [];

  return tagString
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.startsWith('#'))
    .map(t => getTagCodeByName(t))
    .filter((code): code is string => code !== null);
}
