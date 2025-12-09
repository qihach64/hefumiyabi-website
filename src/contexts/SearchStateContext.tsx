"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Theme } from '@/types';

interface SearchState {
  location: string;
  date: string;
  theme: Theme | null;
}

interface SearchStateContextType {
  searchState: SearchState;
  setLocation: (location: string) => void;
  setDate: (date: string) => void;
  setTheme: (theme: Theme | null) => void;
  resetSearchState: () => void;
  // 统一的搜索加载状态管理
  isSearching: boolean;
  pendingTheme: Theme | null | undefined; // undefined = 未在加载, null = 切换到"全部", Theme = 切换到特定主题
  startSearch: (targetTheme: Theme | null) => void; // 开始搜索，设置 pending 状态
  finishSearch: () => void; // 完成搜索，清除 pending 状态
}

const SearchStateContext = createContext<SearchStateContextType | undefined>(undefined);

// 内部组件，使用 useSearchParams
function SearchStateProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();

  const [searchState, setSearchState] = useState<SearchState>(() => ({
    location: searchParams.get('location') || '',
    date: searchParams.get('date') || '',
    theme: null, // 会通过 API 获取完整的 theme 对象
  }));

  // 统一的搜索加载状态
  const [isSearching, setIsSearching] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<Theme | null | undefined>(undefined);

  // 缓存 themes 数据，避免重复请求
  const [cachedThemes, setCachedThemes] = useState<Theme[]>([]);

  // 监听 URL 参数变化，同步 location 和 date
  useEffect(() => {
    const urlLocation = searchParams.get('location') || '';
    const urlDate = searchParams.get('date') || '';

    setSearchState(prev => ({
      ...prev,
      location: urlLocation,
      date: urlDate,
    }));
  }, [searchParams]);

  // 跟踪上一次的 URL theme 参数，避免不必要的同步
  const prevThemeSlugRef = useRef<string | null>(null);

  // 监听 URL 中的 theme 参数变化，同步主题
  // 注意：只在 URL 参数变化时同步，不要覆盖用户通过 setTheme 设置的值
  useEffect(() => {
    const themeSlug = searchParams.get('theme');

    // 如果 URL 参数没有变化，不做任何操作
    if (prevThemeSlugRef.current === themeSlug) {
      return;
    }

    // 记录当前 URL 参数
    prevThemeSlugRef.current = themeSlug;

    // 如果 URL 中没有 theme 参数，清空主题（仅在 URL 显式变化时）
    if (!themeSlug) {
      setSearchState(prev => ({
        ...prev,
        theme: null,
      }));
      return;
    }

    // 如果当前主题已经匹配，不需要更新
    if (searchState.theme?.slug === themeSlug) {
      return;
    }

    // 如果有缓存的 themes，直接使用
    if (cachedThemes.length > 0) {
      const foundTheme = cachedThemes.find((t: Theme) => t.slug === themeSlug);
      if (foundTheme) {
        setSearchState(prev => ({
          ...prev,
          theme: foundTheme,
        }));
      }
      return;
    }

    // 从 API 获取 themes
    fetch('/api/themes')
      .then(res => res.json())
      .then(data => {
        const themes = data.themes || [];
        setCachedThemes(themes);
        const foundTheme = themes.find((t: Theme) => t.slug === themeSlug);
        if (foundTheme) {
          setSearchState(prev => ({
            ...prev,
            theme: foundTheme,
          }));
        }
      })
      .catch(err => {
        console.error('Failed to fetch themes:', err);
      });
  }, [searchParams, cachedThemes, searchState.theme?.slug]);

  const setLocation = (location: string) => {
    setSearchState(prev => ({ ...prev, location }));
  };

  const setDate = (date: string) => {
    setSearchState(prev => ({ ...prev, date }));
  };

  const setTheme = (theme: Theme | null) => {
    setSearchState(prev => ({ ...prev, theme }));
  };

  const resetSearchState = () => {
    setSearchState({
      location: '',
      date: '',
      theme: null,
    });
  };

  // 开始搜索 - 任何组件调用搜索时都应该调用这个
  const startSearch = (targetTheme: Theme | null) => {
    setIsSearching(true);
    setPendingTheme(targetTheme);
    // 同时更新 searchState.theme，保持状态同步
    setTheme(targetTheme);
  };

  // 完成搜索 - SearchClient 在页面加载完成后调用
  const finishSearch = () => {
    setIsSearching(false);
    setPendingTheme(undefined);
  };

  return (
    <SearchStateContext.Provider
      value={{
        searchState,
        setLocation,
        setDate,
        setTheme,
        resetSearchState,
        isSearching,
        pendingTheme,
        startSearch,
        finishSearch,
      }}
    >
      {children}
    </SearchStateContext.Provider>
  );
}

// 外部组件，包裹 Suspense
export function SearchStateProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <SearchStateContext.Provider
        value={{
          searchState: {
            location: '',
            date: '',
            theme: null,
          },
          setLocation: () => {},
          setDate: () => {},
          setTheme: () => {},
          resetSearchState: () => {},
          isSearching: false,
          pendingTheme: undefined,
          startSearch: () => {},
          finishSearch: () => {},
        }}
      >
        {children}
      </SearchStateContext.Provider>
    }>
      <SearchStateProviderInner>
        {children}
      </SearchStateProviderInner>
    </Suspense>
  );
}

export function useSearchState() {
  const context = useContext(SearchStateContext);
  if (context === undefined) {
    throw new Error('useSearchState must be used within a SearchStateProvider');
  }
  return context;
}
