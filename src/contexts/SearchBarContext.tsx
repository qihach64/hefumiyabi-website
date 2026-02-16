"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface SearchBarContextType {
  isSearchBarExpanded: boolean; // Header 搜索栏是否展开（大搜索栏）
  setIsSearchBarExpanded: (expanded: boolean) => void;
  expandManually: () => void; // 手动展开搜索栏
  isHeroVisible: boolean; // Hero 是否可见（用于隐藏 Header 搜索栏）
  setIsHeroVisible: (visible: boolean) => void;
  hideSearchBar: boolean; // 完全隐藏搜索栏（如详情页）
  setHideSearchBar: (hide: boolean) => void;
  hideThemeSelector: boolean; // 隐藏主题选择器（如 /plans 页面已有 ThemePills）
  setHideThemeSelector: (hide: boolean) => void;
  isMobileSearchModalOpen: boolean; // 移动端全屏搜索模态框是否打开
  openMobileSearchModal: () => void;
  closeMobileSearchModal: () => void;
}

const SearchBarContext = createContext<SearchBarContextType | undefined>(undefined);

export function SearchBarProvider({ children }: { children: ReactNode }) {
  const [isSearchBarExpanded, setIsSearchBarExpanded] = useState(true); // 初始展开（大搜索栏）
  const [isHeroVisible, setIsHeroVisible] = useState(true); // 默认可见，防止首页 Header 搜索栏 FOUC
  const [hideSearchBar, setHideSearchBar] = useState(false); // 完全隐藏搜索栏
  const [hideThemeSelector, setHideThemeSelector] = useState(false); // 隐藏主题选择器
  const [isMobileSearchModalOpen, setIsMobileSearchModalOpen] = useState(false); // 移动端搜索模态框
  const manuallyExpandedRef = useRef(false); // 记录是否手动展开
  const expandedScrollYRef = useRef(0); // 记录手动展开时的滚动位置

  // 监听滚动事件来控制搜索框的展开/收起
  useEffect(() => {
    const threshold = 100; // 滚动阈值
    const scrollDelta = 50; // 手动展开后需要滚动的距离才能自动收起
    let ticking = false;
    let lastExpanded = isSearchBarExpanded;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // 如果是手动展开的，检查是否滚动超过一定距离
          if (manuallyExpandedRef.current) {
            const scrolledDistance = Math.abs(currentScrollY - expandedScrollYRef.current);
            if (scrolledDistance > scrollDelta) {
              manuallyExpandedRef.current = false;
            } else {
              ticking = false;
              return;
            }
          }

          const shouldExpand = currentScrollY <= threshold;

          // 只在状态真正改变时更新
          if (shouldExpand !== lastExpanded) {
            // 状态变更: shouldExpand=${shouldExpand}, scrollY=${currentScrollY}
            setIsSearchBarExpanded(shouldExpand);
            lastExpanded = shouldExpand;
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isSearchBarExpanded]);

  // 手动展开方法
  const expandManually = () => {
    setIsSearchBarExpanded(true);
    manuallyExpandedRef.current = true;
    expandedScrollYRef.current = window.scrollY;
  };

  // 移动端搜索模态框控制
  const openMobileSearchModal = () => setIsMobileSearchModalOpen(true);
  const closeMobileSearchModal = () => setIsMobileSearchModalOpen(false);

  return (
    <SearchBarContext.Provider
      value={{
        isSearchBarExpanded,
        setIsSearchBarExpanded,
        expandManually,
        isHeroVisible,
        setIsHeroVisible,
        hideSearchBar,
        setHideSearchBar,
        hideThemeSelector,
        setHideThemeSelector,
        isMobileSearchModalOpen,
        openMobileSearchModal,
        closeMobileSearchModal,
      }}
    >
      {children}
    </SearchBarContext.Provider>
  );
}

export function useSearchBar() {
  const context = useContext(SearchBarContext);
  if (context === undefined) {
    throw new Error("useSearchBar must be used within a SearchBarProvider");
  }
  return context;
}
