"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSearchState } from "@/shared/hooks";
import { ThemeImageSelector } from "./ThemeImageSelector";
import type { Theme } from "@/types";

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
      const themes = data.themes || [];
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
  serverThemes?: Theme[];
  serverCurrentTheme?: Theme | null;
}

export function ClientThemePills({
  serverThemes,
  serverCurrentTheme,
}: ClientThemePillsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // 使用 nuqs 的 useSearchState
  const { theme: urlThemeSlug, setTheme: setUrlTheme, clearAll } = useSearchState();

  // 本地状态
  const [themes, setThemes] = useState<Theme[]>(serverThemes || cachedThemes || []);
  const [isLoading, setIsLoading] = useState(!serverThemes && !cachedThemes);
  const [pendingThemeSlug, setPendingThemeSlug] = useState<string | null | undefined>(undefined);

  // 从 URL 获取当前主题
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
      cachedThemes = serverThemes;
    }
  }, [serverThemes]);

  // 当 URL 与 pending 匹配时，清除 pending 状态
  useEffect(() => {
    if (pendingThemeSlug !== undefined) {
      const currentSlug = currentTheme?.slug || null;
      if (pendingThemeSlug === currentSlug) {
        setPendingThemeSlug(undefined);
      }
    }
  }, [currentTheme, pendingThemeSlug]);

  // 主题切换处理
  const handleThemeChange = (theme: Theme | null) => {
    const newSlug = theme?.slug || null;
    setPendingThemeSlug(newSlug);

    startTransition(async () => {
      // 使用 nuqs 更新 URL
      await setUrlTheme(newSlug);

      // 切换主题时，如果不在 /plans 页面，导航过去
      if (pathname !== '/plans') {
        router.push(newSlug ? `/plans?theme=${newSlug}` : '/plans');
      }
    });
  };

  // 只在 /plans 页面渲染
  if (pathname !== '/plans') {
    return null;
  }

  // 骨架屏
  if (isLoading && themes.length === 0) {
    return (
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container py-4 md:py-6">
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
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="container py-4 md:py-6">
        <ThemeImageSelector
          themes={themes}
          selectedTheme={currentTheme}
          onSelect={handleThemeChange}
          isPending={isPending || pendingThemeSlug !== undefined}
          pendingThemeSlug={pendingThemeSlug}
        />
      </div>
    </div>
  );
}
