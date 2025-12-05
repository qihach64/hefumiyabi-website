/**
 * 交互式和服配件映射图 - 种子数据脚本
 *
 * 创建：
 * 1. ServiceComponent - 标准配件库
 * 2. MapTemplate - 默认地图模板
 * 3. MapHotspot - 热点定义
 *
 * 运行：
 * DATABASE_URL="..." pnpm tsx scripts/seed-kimono-map.ts
 */

import { PrismaClient, ComponentType, ComponentStatus } from "@prisma/client";

const prisma = new PrismaClient();

// 参考图片 URL
const DEFAULT_MAP_IMAGE =
  "https://ewha-yifu.com/zh-tw/wp-content/themes/rikawafuku_Chinese_3.0/img/front/service_detail.webp";

// ============================================
// ServiceComponent 定义
// ============================================

interface ComponentDef {
  code: string;
  name: string;
  nameJa?: string;
  nameEn?: string;
  description?: string;
  type: ComponentType;
  icon: string;
  highlights: string[];
  isBaseComponent: boolean;
  upgradeFromCode?: string; // 用于建立升级链
  upgradeCost?: number;
  basePrice?: number;
  displayOrder: number;
}

const SERVICE_COMPONENTS: ComponentDef[] = [
  // ========== 基础配件 (ACCESSORY) ==========
  {
    code: "HAIR_ACCESSORY",
    name: "女性髮飾",
    nameJa: "髪飾り",
    nameEn: "Hair Accessory",
    description: "精选超过100种款式的髮飾，专业人员为您搭配",
    type: ComponentType.ACCESSORY,
    icon: "💮",
    highlights: ["超过100种以上可供选择", "专业搭配建议"],
    isBaseComponent: true,
    displayOrder: 1,
  },
  {
    code: "JUBAN",
    name: "襦袢",
    nameJa: "襦袢",
    nameEn: "Juban (Undergarment)",
    description: "和服内衬，素色到花样款式齐全",
    type: ComponentType.ACCESSORY,
    icon: "👘",
    highlights: ["素色到花样款式齐全", "舒适透气材质"],
    isBaseComponent: true,
    displayOrder: 2,
  },
  {
    code: "HADAGI",
    name: "内衣",
    nameJa: "肌着",
    nameEn: "Hadagi (Inner Wear)",
    description: "柔软舒适的和服专用内衣",
    type: ComponentType.ACCESSORY,
    icon: "👕",
    highlights: ["柔软且穿起来舒适的材质", "卫生独立包装"],
    isBaseComponent: true,
    displayOrder: 3,
  },
  {
    code: "OBI",
    name: "腰带",
    nameJa: "帯",
    nameEn: "Obi (Belt)",
    description: "工作人员搭配的和服套组可爱腰带",
    type: ComponentType.ACCESSORY,
    icon: "🎀",
    highlights: ["工作人员搭配的和服套组可爱腰带", "多种系法可选"],
    isBaseComponent: true,
    displayOrder: 4,
  },
  {
    code: "BAG",
    name: "包包",
    nameJa: "バッグ",
    nameEn: "Bag",
    description: "各式束口袋、藤编包、和服包、珍珠包等",
    type: ComponentType.ACCESSORY,
    icon: "👜",
    highlights: ["各式束口袋、藤编包", "和服包、珍珠包等", "免费束口袋提供"],
    isBaseComponent: true,
    displayOrder: 5,
  },
  {
    code: "TABI",
    name: "足袋",
    nameJa: "足袋",
    nameEn: "Tabi (Split-toe Socks)",
    description: "传统分趾袜，方案包含提供",
    type: ComponentType.ACCESSORY,
    icon: "🧦",
    highlights: ["传统分趾袜", "方案包含提供"],
    isBaseComponent: true,
    displayOrder: 6,
  },
  {
    code: "ZORI",
    name: "草履",
    nameJa: "草履",
    nameEn: "Zori (Sandals)",
    description: "种类众多的传统草履",
    type: ComponentType.ACCESSORY,
    icon: "👡",
    highlights: ["种类众多", "舒适好走"],
    isBaseComponent: true,
    displayOrder: 7,
  },

  // ========== 和服本体 (KIMONO) ==========
  {
    code: "KIMONO",
    name: "和服",
    nameJa: "着物",
    nameEn: "Kimono",
    description: "如果您不知如何选择，专业人员将为您提供搭配建议",
    type: ComponentType.KIMONO,
    icon: "👘",
    highlights: ["如果您不知如何选择", "专业人员将为您提供搭配建议"],
    isBaseComponent: true,
    displayOrder: 10,
  },
  {
    code: "KIMONO_LACE",
    name: "蕾丝和服",
    nameJa: "レース着物",
    nameEn: "Lace Kimono",
    description: "精美蕾丝装饰，网红拍照首选",
    type: ComponentType.KIMONO,
    icon: "👘",
    highlights: ["精美蕾丝装饰", "网红拍照首选", "温柔仙女风格"],
    isBaseComponent: false,
    upgradeFromCode: "KIMONO",
    upgradeCost: 2000,
    displayOrder: 11,
  },
  {
    code: "KIMONO_HOUMON",
    name: "访问着",
    nameJa: "訪問着",
    nameEn: "Houmongi (Visiting Kimono)",
    description: "正式场合适用的高级和服",
    type: ComponentType.KIMONO,
    icon: "👘",
    highlights: ["正式场合适用", "高级面料", "优雅大方"],
    isBaseComponent: false,
    upgradeFromCode: "KIMONO_LACE",
    upgradeCost: 5000,
    displayOrder: 12,
  },
  {
    code: "KIMONO_FURISODE",
    name: "振袖",
    nameJa: "振袖",
    nameEn: "Furisode (Long-sleeved Kimono)",
    description: "成人式/毕业典礼专用的最高级别和服",
    type: ComponentType.KIMONO,
    icon: "👘",
    highlights: ["成人式/毕业典礼专用", "最高级别和服", "华丽袖长"],
    isBaseComponent: false,
    upgradeFromCode: "KIMONO_HOUMON",
    upgradeCost: 15000,
    displayOrder: 13,
  },

  // ========== 造型服务 (STYLING) ==========
  {
    code: "HAIR_STYLING",
    name: "专业发型",
    nameJa: "ヘアセット",
    nameEn: "Hair Styling",
    description: "专业造型师为您设计最适合的发型",
    type: ComponentType.STYLING,
    icon: "💇",
    highlights: ["专业造型师", "多种风格可选", "持久定型"],
    isBaseComponent: true,
    displayOrder: 20,
  },
  {
    code: "MAKEUP",
    name: "专业化妆",
    nameJa: "メイク",
    nameEn: "Makeup",
    description: "专业彩妆服务，持久不脱妆",
    type: ComponentType.STYLING,
    icon: "💄",
    highlights: ["专业彩妆", "持久不脱妆", "适合各种场合"],
    isBaseComponent: true,
    basePrice: 3000,
    displayOrder: 21,
  },

  // ========== 升级配件 ==========
  {
    code: "OBI_TAIKO",
    name: "太鼓结腰带",
    nameJa: "太鼓帯",
    nameEn: "Taiko Obi (Drum Knot)",
    description: "华丽的太鼓结系法，展现传统美",
    type: ComponentType.ACCESSORY,
    icon: "🎀",
    highlights: ["华丽太鼓结", "专业手工系结", "传统优雅"],
    isBaseComponent: false,
    upgradeFromCode: "OBI",
    upgradeCost: 800,
    displayOrder: 30,
  },

  // ========== 增值体验 (EXPERIENCE) ==========
  {
    code: "PHOTO_BASIC",
    name: "基础跟拍",
    nameJa: "基本撮影",
    nameEn: "Basic Photography",
    description: "30分钟跟拍服务，精修5张",
    type: ComponentType.EXPERIENCE,
    icon: "📷",
    highlights: ["30分钟跟拍", "精修5张", "专业摄影师"],
    isBaseComponent: true,
    basePrice: 8000,
    displayOrder: 40,
  },
  {
    code: "PHOTO_PREMIUM",
    name: "豪华跟拍",
    nameJa: "プレミアム撮影",
    nameEn: "Premium Photography",
    description: "60分钟跟拍服务，精修15张，含Vlog",
    type: ComponentType.EXPERIENCE,
    icon: "📷",
    highlights: ["60分钟跟拍", "精修15张", "含Vlog短片"],
    isBaseComponent: false,
    upgradeFromCode: "PHOTO_BASIC",
    upgradeCost: 10000,
    displayOrder: 41,
  },
  {
    code: "NEXT_DAY_RETURN",
    name: "隔日归还",
    nameJa: "翌日返却",
    nameEn: "Next Day Return",
    description: "次日12点前归还，尽情享受",
    type: ComponentType.EXPERIENCE,
    icon: "🌙",
    highlights: ["次日12点前归还", "尽情享受夜景", "不赶时间"],
    isBaseComponent: true,
    basePrice: 1000,
    displayOrder: 42,
  },
];

// ============================================
// MapHotspot 定义（基于参考图片坐标）
// ============================================

interface HotspotDef {
  componentCode: string;
  x: number;
  y: number;
  labelPosition: "left" | "right" | "top" | "bottom";
  displayOrder: number;
}

// 坐标基于参考图片的相对位置（百分比 0-1）
const MAP_HOTSPOTS: HotspotDef[] = [
  // 女性髮飾 - 头部右上
  {
    componentCode: "HAIR_ACCESSORY",
    x: 0.72,
    y: 0.06,
    labelPosition: "right",
    displayOrder: 1,
  },
  // 襦袢 - 左上（脖子位置）
  {
    componentCode: "JUBAN",
    x: 0.28,
    y: 0.14,
    labelPosition: "left",
    displayOrder: 2,
  },
  // 内衣 - 右侧（胸口位置）
  {
    componentCode: "HADAGI",
    x: 0.72,
    y: 0.22,
    labelPosition: "right",
    displayOrder: 3,
  },
  // 腰带 - 左侧（腰部位置）
  {
    componentCode: "OBI",
    x: 0.22,
    y: 0.35,
    labelPosition: "left",
    displayOrder: 4,
  },
  // 和服 - 右侧（主体位置）
  {
    componentCode: "KIMONO",
    x: 0.72,
    y: 0.50,
    labelPosition: "right",
    displayOrder: 5,
  },
  // 包包 - 左下
  {
    componentCode: "BAG",
    x: 0.18,
    y: 0.62,
    labelPosition: "left",
    displayOrder: 6,
  },
  // 足袋 - 右下
  {
    componentCode: "TABI",
    x: 0.68,
    y: 0.82,
    labelPosition: "right",
    displayOrder: 7,
  },
  // 草履 - 左下（脚部位置）
  {
    componentCode: "ZORI",
    x: 0.28,
    y: 0.90,
    labelPosition: "left",
    displayOrder: 8,
  },
];

// ============================================
// 主函数
// ============================================

async function main() {
  console.log("🎌 开始创建交互式和服地图种子数据...\n");

  // 1. 创建 ServiceComponent
  console.log("📦 创建服务组件...");

  // 首先创建所有基础组件
  const baseComponents = SERVICE_COMPONENTS.filter((c) => c.isBaseComponent);
  const upgradeComponents = SERVICE_COMPONENTS.filter((c) => !c.isBaseComponent);

  // 用于存储 code -> id 的映射
  const componentIdMap: Record<string, string> = {};

  // 创建基础组件
  for (const comp of baseComponents) {
    const created = await prisma.serviceComponent.upsert({
      where: { code: comp.code },
      create: {
        code: comp.code,
        name: comp.name,
        nameJa: comp.nameJa,
        nameEn: comp.nameEn,
        description: comp.description,
        type: comp.type,
        icon: comp.icon,
        highlights: comp.highlights,
        isBaseComponent: true,
        basePrice: comp.basePrice || 0,
        displayOrder: comp.displayOrder,
        status: ComponentStatus.APPROVED,
        isActive: true,
      },
      update: {
        name: comp.name,
        nameJa: comp.nameJa,
        nameEn: comp.nameEn,
        description: comp.description,
        icon: comp.icon,
        highlights: comp.highlights,
        basePrice: comp.basePrice || 0,
        displayOrder: comp.displayOrder,
      },
    });
    componentIdMap[comp.code] = created.id;
    console.log(`  ✅ ${comp.icon} ${comp.name} (${comp.code})`);
  }

  // 创建升级组件（需要先建立 upgradeFromId）
  for (const comp of upgradeComponents) {
    const upgradeFromId = comp.upgradeFromCode
      ? componentIdMap[comp.upgradeFromCode]
      : null;

    const created = await prisma.serviceComponent.upsert({
      where: { code: comp.code },
      create: {
        code: comp.code,
        name: comp.name,
        nameJa: comp.nameJa,
        nameEn: comp.nameEn,
        description: comp.description,
        type: comp.type,
        icon: comp.icon,
        highlights: comp.highlights,
        isBaseComponent: false,
        upgradeFromId,
        upgradeCost: comp.upgradeCost,
        basePrice: comp.basePrice || 0,
        displayOrder: comp.displayOrder,
        status: ComponentStatus.APPROVED,
        isActive: true,
      },
      update: {
        name: comp.name,
        nameJa: comp.nameJa,
        nameEn: comp.nameEn,
        description: comp.description,
        icon: comp.icon,
        highlights: comp.highlights,
        upgradeFromId,
        upgradeCost: comp.upgradeCost,
        basePrice: comp.basePrice || 0,
        displayOrder: comp.displayOrder,
      },
    });
    componentIdMap[comp.code] = created.id;
    console.log(
      `  ✅ ${comp.icon} ${comp.name} (${comp.code}) [升级自 ${comp.upgradeFromCode}]`
    );
  }

  console.log(`\n  总计: ${SERVICE_COMPONENTS.length} 个组件\n`);

  // 2. 创建默认 MapTemplate
  console.log("🗺️  创建默认地图模板...");

  const defaultTemplate = await prisma.mapTemplate.upsert({
    where: { id: "default-female-kimono-template" },
    create: {
      id: "default-female-kimono-template",
      name: "女性和服标准模板",
      imageUrl: DEFAULT_MAP_IMAGE,
      imageWidth: 800,
      imageHeight: 1200,
      isDefault: true,
      isActive: true,
    },
    update: {
      name: "女性和服标准模板",
      imageUrl: DEFAULT_MAP_IMAGE,
      imageWidth: 800,
      imageHeight: 1200,
      isDefault: true,
    },
  });

  console.log(`  ✅ ${defaultTemplate.name}`);
  console.log(`  📍 图片: ${DEFAULT_MAP_IMAGE}\n`);

  // 3. 创建 MapHotspot
  console.log("📍 创建热点定义...");

  // 先删除该模板的所有热点（避免重复）
  await prisma.mapHotspot.deleteMany({
    where: { templateId: defaultTemplate.id },
  });

  for (const hotspot of MAP_HOTSPOTS) {
    const componentId = componentIdMap[hotspot.componentCode];
    if (!componentId) {
      console.log(`  ⚠️ 跳过 ${hotspot.componentCode}（组件不存在）`);
      continue;
    }

    await prisma.mapHotspot.create({
      data: {
        templateId: defaultTemplate.id,
        componentId,
        x: hotspot.x,
        y: hotspot.y,
        labelPosition: hotspot.labelPosition,
        displayOrder: hotspot.displayOrder,
      },
    });

    const comp = SERVICE_COMPONENTS.find(
      (c) => c.code === hotspot.componentCode
    );
    console.log(
      `  ✅ ${comp?.icon || "📍"} ${comp?.name} @ (${(hotspot.x * 100).toFixed(0)}%, ${(hotspot.y * 100).toFixed(0)}%) [${hotspot.labelPosition}]`
    );
  }

  console.log(`\n  总计: ${MAP_HOTSPOTS.length} 个热点\n`);

  // 4. 统计输出
  const stats = {
    components: await prisma.serviceComponent.count(),
    templates: await prisma.mapTemplate.count(),
    hotspots: await prisma.mapHotspot.count(),
  };

  console.log("📊 数据统计:");
  console.log(`  • 服务组件: ${stats.components}`);
  console.log(`  • 地图模板: ${stats.templates}`);
  console.log(`  • 热点定义: ${stats.hotspots}`);

  console.log("\n🎉 种子数据创建完成！");
}

main()
  .catch((e) => {
    console.error("❌ 错误:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
