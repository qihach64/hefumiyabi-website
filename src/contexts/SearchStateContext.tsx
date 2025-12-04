"use client";

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

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

  // 只在组件挂载时从 URL 初始化主题
  const initializedRef = useState({ done: false })[0];

  useEffect(() => {
    if (initializedRef.done) return;

    const themeSlug = searchParams.get('theme');

    if (themeSlug) {
      fetch('/api/themes')
        .then(res => res.json())
        .then(data => {
          const themes = data.themes || [];
          const foundTheme = themes.find((t: Theme) => t.slug === themeSlug);
          if (foundTheme) {
            setSearchState(prev => ({
              ...prev,
              theme: foundTheme,
            }));
          }
          initializedRef.done = true;
        })
        .catch(err => {
          console.error(err);
          initializedRef.done = true;
        });
    } else {
      initializedRef.done = true;
    }
  }, [searchParams, initializedRef]);

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
