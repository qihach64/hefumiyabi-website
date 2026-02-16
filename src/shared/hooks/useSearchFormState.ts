"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchState } from "./useSearchState";
import type { Theme } from "@/types";

interface UseSearchFormStateOptions {
  /** 通过 props 传入的主题列表（如 HeroSearchPanel） */
  themes?: Theme[];
  /** 延迟加载主题（模态框打开时才加载） */
  lazyLoadThemes?: boolean;
  /** 延迟加载触发条件 */
  lazyLoadTrigger?: boolean;
}

/**
 * 搜索表单共享状态 hook
 *
 * 统一管理三个搜索组件（HeroSearchPanel、HeaderSearchBar、MobileSearchBar）的：
 * - 本地状态（location、date、selectedTheme）
 * - URL → 本地状态同步
 * - 主题数据加载（支持 props 传入 / 自动加载 / 延迟加载）
 * - handleThemeSelect：只更新状态，不触发导航
 * - buildSearchUrl：构建搜索跳转 URL
 */
export function useSearchFormState(options?: UseSearchFormStateOptions) {
  const {
    location: urlLocation,
    date: urlDate,
    theme: themeSlug,
    setLocation: setUrlLocation,
    setDate: setUrlDate,
    setTheme: setThemeSlug,
  } = useSearchState();

  // 本地状态
  const [localLocation, setLocalLocation] = useState(urlLocation || "");
  const [localDate, setLocalDate] = useState(urlDate || "");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  // 主题数据（自动加载时使用）
  const [fetchedThemes, setFetchedThemes] = useState<Theme[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);

  // 优先使用 props 传入的 themes
  const themes = options?.themes ?? fetchedThemes;

  // 自动加载主题
  useEffect(() => {
    if (options?.themes) return; // props 传入，不需要加载
    if (options?.lazyLoadThemes && !options?.lazyLoadTrigger) return; // 延迟加载但未触发
    if (fetchedThemes.length > 0) return; // 已加载

    setIsLoadingThemes(true);
    fetch("/api/themes")
      .then((res) => res.json())
      .then((data) => {
        setFetchedThemes(data.themes || []);
      })
      .catch((error) => {
        console.error("Failed to fetch themes:", error);
      })
      .finally(() => {
        setIsLoadingThemes(false);
      });
  }, [options?.themes, options?.lazyLoadThemes, options?.lazyLoadTrigger, fetchedThemes.length]);

  // 同步 URL → 本地
  useEffect(() => {
    setLocalLocation(urlLocation || "");
  }, [urlLocation]);

  useEffect(() => {
    setLocalDate(urlDate || "");
  }, [urlDate]);

  useEffect(() => {
    if (themeSlug && themes.length > 0) {
      const found = themes.find((t) => t.slug === themeSlug);
      setSelectedTheme(found || null);
    } else {
      setSelectedTheme(null);
    }
  }, [themeSlug, themes]);

  // 主题选择 - 只更新状态，不导航
  const handleThemeSelect = useCallback((theme: Theme | null) => {
    setSelectedTheme(theme);
  }, []);

  // 构建搜索 URL
  const buildSearchUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (localLocation) params.set("location", localLocation);
    if (localDate) params.set("date", localDate);
    if (selectedTheme) params.set("theme", selectedTheme.slug);
    const queryString = params.toString();
    return queryString ? `/plans?${queryString}` : "/plans";
  }, [localLocation, localDate, selectedTheme]);

  return {
    // 状态
    localLocation,
    setLocalLocation,
    localDate,
    setLocalDate,
    selectedTheme,
    themes,
    isLoadingThemes,
    // URL setters（HeroSearchPanel 需要）
    setUrlLocation,
    setUrlDate,
    setThemeSlug,
    // 行为
    handleThemeSelect,
    buildSearchUrl,
  };
}
