"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SearchBarContextType {
  isSearchBarVisible: boolean;
  isSearchBarExpanded: boolean;
  showSearchBar: () => void;
  hideSearchBar: () => void;
  expandSearchBar: () => void;
  collapseSearchBar: () => void;
}

const SearchBarContext = createContext<SearchBarContextType | undefined>(undefined);

export function SearchBarProvider({ children }: { children: ReactNode }) {
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(true);
  const [isSearchBarExpanded, setIsSearchBarExpanded] = useState(false);

  // 监听滚动事件来控制搜索框的显示/隐藏
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const threshold = 100; // 滚动阈值

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > threshold) {
        // 向下滚动超过阈值时隐藏
        if (currentScrollY > lastScrollY) {
          setIsSearchBarVisible(false);
        }
      } else {
        // 回到顶部时显示
        setIsSearchBarVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const showSearchBar = () => setIsSearchBarVisible(true);
  const hideSearchBar = () => setIsSearchBarVisible(false);
  const expandSearchBar = () => {
    setIsSearchBarExpanded(true);
    // 滚动到顶部以显示完整的搜索框
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const collapseSearchBar = () => setIsSearchBarExpanded(false);

  return (
    <SearchBarContext.Provider
      value={{
        isSearchBarVisible,
        isSearchBarExpanded,
        showSearchBar,
        hideSearchBar,
        expandSearchBar,
        collapseSearchBar,
      }}
    >
      {children}
    </SearchBarContext.Provider>
  );
}

export function useSearchBar() {
  const context = useContext(SearchBarContext);
  if (context === undefined) {
    throw new Error('useSearchBar must be used within a SearchBarProvider');
  }
  return context;
}
