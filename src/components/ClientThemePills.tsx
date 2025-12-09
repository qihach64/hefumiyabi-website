"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ThemeImageSelector from "./ThemeImageSelector";
import { useSearchState } from "@/contexts/SearchStateContext";
import type { Theme } from "@/types";

// 日本传统色系映射
const themeColorMap: Record<string, string> = {
  'trendy-photo': '#F28B82',
  'formal-ceremony': '#FFCC80',
  'together': '#80CBC4',
  'seasonal': '#AED581',
  'casual-stroll': '#90CAF9',
  'specialty': '#B39DDB',
};

// 全局缓存 themes 数据
let cachedThemes: Theme[] | null = null;
let fetchPromise: Promise<Theme[]> | null = null;

function fetchThemes(): Promise<Theme[]> {
  if (cachedThemes) {
    return Promise.resolve(cachedThemes);
  }
  if (fetchPromise) {
    return fetchPromise;
  }
  fetchPromise = fetch('/api/themes')
    .then(res => res.json())
    .then(data => {
      const themes = (data.themes || []).map((theme: Theme) => ({
        ...theme,
        color: themeColorMap[theme.slug] || theme.color,
      }));
      cachedThemes = themes;
      fetchPromise = null;
      return themes;
    })
    .catch(err => {
      console.error('Failed to fetch themes:', err);
      fetchPromise = null;
      return [];
    });
  return fetchPromise;
}

interface ClientThemePillsProps {
  // 可选的服务端预取数据
  serverThemes?: Theme[];
  serverCurrentTheme?: Theme | null;
}

export default function ClientThemePills({
  serverThemes,
  serverCurrentTheme,
}: ClientThemePillsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSearching, pendingTheme, startSearch, finishSearch } = useSearchState();
  const [isPending, startTransition] = useTransition();

  // 本地状态
  const [themes, setThemes] = useState<Theme[]>(serverThemes || cachedThemes || []);
  const [isLoading, setIsLoading] = useState(!serverThemes && !cachedThemes);

  // 从 URL 获取当前主题
  const urlThemeSlug = searchParams.get('theme');
  const currentTheme = serverCurrentTheme !== undefined
    ? serverCurrentTheme
    : themes.find(t => t.slug === urlThemeSlug) || null;

  // 获取 themes 数据（如果没有服务端数据）
  useEffect(() => {
    if (!serverThemes && !cachedThemes) {
      fetchThemes().then(fetchedThemes => {
        setThemes(fetchedThemes);
        setIsLoading(false);
      });
    } else if (serverThemes && !cachedThemes) {
      // 如果有服务端数据，缓存它
      cachedThemes = serverThemes;
    }
  }, [serverThemes]);

  // 检查 pendingTheme 是否与当前数据匹配（表示加载完成）
  const pendingThemeSlug = pendingTheme?.slug ?? (pendingTheme === null ? null : undefined);
  const isPendingComplete = pendingTheme !== undefined && pendingThemeSlug === (currentTheme?.slug || null);

  // 当 pendingTheme 与服务端数据匹配时，重置搜索状态
  useEffect(() => {
    if (isPendingComplete) {
      finishSearch();
    }
  }, [isPendingComplete, finishSearch]);

  // 主题切换处理
  const handleThemeChange = (theme: Theme | null) => {
    startSearch(theme);

    const params = new URLSearchParams(searchParams.toString());
    if (theme) {
      params.set("theme", theme.slug);
    } else {
      params.delete("theme");
    }
    // 切换主题时重置筛选条件
    params.delete("tags");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("sort");

    const queryString = params.toString();

    startTransition(() => {
      router.push(queryString ? `/plans?${queryString}` : "/plans");
    });
  };

  // URL 不匹配检测（外部导航）
  const isUrlMismatch = urlThemeSlug !== (currentTheme?.slug || null);
  const isLoadingState = isPending || isSearching || isUrlMismatch;

  // 只在 /plans 页面渲染
  if (pathname !== '/plans') {
    return null;
  }

  // 如果正在加载 themes 且没有缓存数据，显示占位
  if (isLoading && themes.length === 0) {
    return (
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container py-4 md:py-6">
          {/* 骨架屏 */}
          <div className="flex gap-6 md:gap-8 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-200 animate-pulse" />
                <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    // Airbnb 风格的图片主题选择器
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="container py-4 md:py-6">
        <ThemeImageSelector
          themes={themes}
          selectedTheme={currentTheme}
          onSelect={handleThemeChange}
          isPending={isLoadingState}
          pendingTheme={pendingTheme}
        />
      </div>
    </div>
  );
}
