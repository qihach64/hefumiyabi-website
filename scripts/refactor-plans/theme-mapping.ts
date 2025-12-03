/**
 * CSV主题与现有Theme的映射关系
 */

export const THEME_MAPPING = {
  'SOL-01': {
    id: 'cmioftqib0000yc2hhb2joxda', // trendy-photo 潮流出片
    slug: 'trendy-photo',
    name: '潮流出片',
    csvTheme: 'SOL-01 出片神器'
  },
  'SOL-02': {
    id: 'cmioftr7k0001yc2h0jr28c8a', // formal-ceremony 盛大礼遇
    slug: 'formal-ceremony',
    name: '盛大礼遇',
    csvTheme: 'SOL-02 正式礼遇'
  },
  'SOL-03': {
    id: 'cmioftrws0002yc2hpcyvu8m8', // together 亲友同行
    slug: 'together',
    name: '亲友同行',
    csvTheme: 'SOL-03 双人优享'
  },
  'SOL-04': {
    id: 'cmioftslr0003yc2h1s0nxpgg', // seasonal 季节限定
    slug: 'seasonal',
    name: '季节限定',
    csvTheme: 'SOL-04 季节限定'
  },
  'SOL-05': {
    id: 'cmiofttat0004yc2h4jv7m8r3', // casual-stroll 轻装漫步
    slug: 'casual-stroll',
    name: '轻装漫步',
    csvTheme: 'SOL-05 超值入门'
  },
  'SPECIAL': {
    id: 'cmioftu040005yc2hu2h4jjxz', // specialty 特色套餐
    slug: 'specialty',
    name: '特色套餐',
    csvTheme: '特殊套餐'
  }
} as const;

export type ThemeCode = keyof typeof THEME_MAPPING;

export function getThemeIdByCSVTheme(csvTheme: string): string | null {
  const entry = Object.values(THEME_MAPPING).find(t => t.csvTheme === csvTheme);
  return entry?.id || null;
}

export function getThemeIdByCode(code: ThemeCode): string {
  return THEME_MAPPING[code].id;
}
