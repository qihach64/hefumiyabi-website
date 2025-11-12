"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SearchBarContextType {
  isHeaderSearchVisible: boolean;  // Header 中的小搜索框
  isMainSearchVisible: boolean;     // 页面主搜索框
  isSearchBarExpanded: boolean;
  expandSearchBar: () => void;
}

const SearchBarContext = createContext<SearchBarContextType | undefined>(undefined);

export function SearchBarProvider({ children }: { children: ReactNode }) {
  const [isHeaderSearchVisible, setIsHeaderSearchVisible] = useState(false); // 初始隐藏
  const [isMainSearchVisible, setIsMainSearchVisible] = useState(true);      // 初始显示
  const [isSearchBarExpanded, setIsSearchBarExpanded] = useState(false);

  // 监听滚动事件来控制搜索框的显示/隐藏
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const threshold = 100; // 滚动阈值

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > threshold) {
        // 向下滚动超过阈值时
        if (currentScrollY > lastScrollY) {
          // 继续向下滚动：隐藏主搜索框，显示Header搜索框
          setIsMainSearchVisible(false);
          setIsHeaderSearchVisible(true);
        }
      } else {
        // 回到顶部时：显示主搜索框，隐藏Header搜索框
        setIsMainSearchVisible(true);
        setIsHeaderSearchVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const expandSearchBar = () => {
    setIsSearchBarExpanded(true);
    // 滚动到顶部以显示完整的搜索框
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <SearchBarContext.Provider
      value={{
        isHeaderSearchVisible,
        isMainSearchVisible,
        isSearchBarExpanded,
        expandSearchBar,
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
