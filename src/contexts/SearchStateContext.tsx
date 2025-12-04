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

  // 只在组件挂载时从 URL 初始化主题
  // 使用 ref 追踪是否已经初始化，避免重复获取
  const initializedRef = useState({ done: false })[0];

  useEffect(() => {
    // 只在首次挂载时从 URL 同步主题
    if (initializedRef.done) return;

    const themeSlug = searchParams.get('theme');

    if (themeSlug) {
      // 从 API 获取 theme 详情
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

  return (
    <SearchStateContext.Provider
      value={{
        searchState,
        setLocation,
        setDate,
        setTheme,
        resetSearchState,
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
