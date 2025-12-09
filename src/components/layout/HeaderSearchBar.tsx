"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { Search, MapPin, X, Calendar, Palette, ChevronDown, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchState } from "@/contexts/SearchStateContext";
import { useSearchBar } from "@/contexts/SearchBarContext";
import { getThemeIcon } from "@/lib/themeIcons";

interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export default function HeaderSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchState, setLocation, setDate, startSearch, isSearching } = useSearchState();
  const { isSearchBarExpanded, expandManually, hideThemeSelector } = useSearchBar();
  const [isPending, startTransition] = useTransition();

  // 主题选择立即导航到 /plans
  const handleThemeSelect = useCallback((theme: Theme | null) => {
    const params = new URLSearchParams(searchParams.toString());

    // 保留当前的 location 和 date（优先使用 searchState 中的最新值）
    if (searchState.location) {
      params.set('location', searchState.location);
    }
    if (searchState.date) {
      params.set('date', searchState.date);
    }

    // 设置或清除主题
    if (theme) {
      params.set('theme', theme.slug);
    } else {
      params.delete('theme');
    }

    const queryString = params.toString();
    const url = queryString ? `/plans?${queryString}` : '/plans';

    // 设置全局加载状态
    startSearch(theme);

    // 导航
    startTransition(() => {
      router.push(url);
    });
  }, [searchParams, searchState.location, searchState.date, startSearch, router]);

  // 自动补全相关
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const themeButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 主题相关状态
  const [themes, setThemes] = useState<Theme[]>([]);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // 获取所有地区数据
  useEffect(() => {
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        if (data.locations) {
          setAllLocations(data.locations);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch locations:', error);
      });
  }, []);

  // 获取主题列表
  useEffect(() => {
    fetch('/api/themes')
      .then(res => res.json())
      .then(data => {
        setThemes(data.themes || []);
      })
      .catch(error => {
        console.error('Failed to fetch themes:', error);
      });
  }, []);

  // 点击外部关闭主题下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target as Node) &&
        themeButtonRef.current &&
        !themeButtonRef.current.contains(event.target as Node)
      ) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.trim() === '') {
      setFilteredLocations(allLocations.slice(0, 10));
    } else {
      const filtered = allLocations.filter((loc) =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 10));
    }
    setShowDropdown(true);
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);

    // 先播放关闭动画
    setIsClosing(true);

    // 等待动画完成后再关闭下拉菜单
    setTimeout(() => {
      setShowDropdown(false);
      setIsClosing(false);
    }, 300);

    // 自动切换到日期选择器（Airbnb风格）
    setTimeout(() => {
      dateInputRef.current?.click();
      try {
        dateInputRef.current?.showPicker?.();
      } catch {
        dateInputRef.current?.focus();
      }
    }, 400); // 等待下拉菜单关闭动画完成 (300ms) + 一点缓冲
  };

  const handleLocationFocus = () => {
    if (allLocations.length > 0) {
      if (searchState.location.trim() === '') {
        setFilteredLocations(allLocations.slice(0, 10));
      } else {
        const filtered = allLocations.filter((loc) =>
          loc.toLowerCase().includes(searchState.location.toLowerCase())
        );
        setFilteredLocations(filtered.slice(0, 10));
      }
      setShowDropdown(true);
    }
  };

  const handleExpand = (focusField?: 'location' | 'date' | 'theme' | 'none') => {
    // 手动展开搜索栏（会设置锁定标志，防止滚动自动收起）
    expandManually();

    // 根据点击的字段，聚焦到对应的输入框
    if (focusField === 'none') {
      // 只展开，不聚焦任何字段
      return;
    }

    setTimeout(() => {
      if (focusField === 'date') {
        dateInputRef.current?.click();
        try {
          dateInputRef.current?.showPicker?.();
        } catch {
          dateInputRef.current?.focus();
        }
      } else if (focusField === 'theme') {
        setShowThemeDropdown(true);
      } else if (focusField === 'location') {
        // 聚焦到目的地
        locationInputRef.current?.focus();
      }
    }, 100);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchState.location) params.set("location", searchState.location);
    if (searchState.date) params.set("date", searchState.date);
    if (searchState.theme) params.set("theme", searchState.theme.slug);

    const queryString = params.toString();
    const url = queryString ? `/plans?${queryString}` : '/plans';

    // 使用统一的 startSearch 设置全局加载状态
    startSearch(searchState.theme);

    // 使用 startTransition 让按钮显示 loading 状态
    startTransition(() => {
      router.push(url);
    });
  };

  // 紧凑模式组件 - Airbnb 风格胶囊
  const compactSearchBar = (
    <div className="flex items-center gap-1.5 md:gap-2 border border-gray-300 rounded-full px-2 md:px-3 py-1.5 md:py-2 bg-white
      hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.1)]
      transition-all duration-300 ease-out
      flex-shrink min-w-0">
      <button
        onClick={() => handleExpand('location')}
        className="flex items-center gap-1 md:gap-1.5 hover:bg-gray-50 px-1.5 md:px-2 py-1 rounded-full transition-colors cursor-pointer min-w-0"
        type="button"
      >
        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-sakura-500 flex-shrink-0" />
        <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-[60px] md:max-w-[80px]">
          {searchState.location || '目的地'}
        </span>
      </button>
      <div className="w-px h-5 md:h-6 bg-gray-300 flex-shrink-0"></div>
      <button
        onClick={() => handleExpand('date')}
        className="flex items-center gap-1 md:gap-1.5 hover:bg-gray-50 px-1.5 md:px-2 py-1 rounded-full transition-colors cursor-pointer min-w-0"
        type="button"
      >
        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-sakura-500 flex-shrink-0" />
        <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-[50px] md:max-w-[70px]">
          {searchState.date
            ? new Date(searchState.date + 'T00:00:00').toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
            : '日期'}
        </span>
      </button>
      {!hideThemeSelector && (
        <>
          <div className="w-px h-5 md:h-6 bg-gray-300 flex-shrink-0 hidden sm:block"></div>
          <button
            onClick={() => handleExpand('theme')}
            className="hidden sm:flex items-center gap-1 md:gap-1.5 hover:bg-gray-50 px-1.5 md:px-2 py-1 rounded-full transition-colors cursor-pointer min-w-0"
            type="button"
          >
            <Palette className="w-3.5 h-3.5 md:w-4 md:h-4 text-sakura-500 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-[50px] md:max-w-[70px]">
              {searchState.theme ? (
                <span className="flex items-center gap-1">
                  {(() => {
                    const IconComponent = getThemeIcon(searchState.theme.icon);
                    return <IconComponent className="w-3.5 h-3.5 md:w-4 md:h-4" />;
                  })()}
                  <span className="truncate">{searchState.theme.name}</span>
                </span>
              ) : '主题'}
            </span>
          </button>
        </>
      )}
      <button
        onClick={() => handleExpand('none')}
        className="w-7 h-7 md:w-8 md:h-8 bg-sakura-500 rounded-full flex items-center justify-center ml-1 md:ml-2 flex-shrink-0
          hover:bg-sakura-600 transition-all duration-200
          hover:scale-110 active:scale-95 cursor-pointer"
        type="button"
        aria-label="展开搜索"
      >
        <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
      </button>
    </div>
  );

  // 展开模式组件 - 完整搜索框
  const expandedSearchBar = (
    <div className="w-full max-w-3xl flex-shrink min-w-0">
      {/* 展开的搜索框 - Airbnb 风格优化 */}
      <div className="rounded-full p-1.5 gap-1 flex items-center bg-white border border-gray-200
        shadow-[0_8px_24px_0_rgba(0,0,0,0.1)]
        transition-all duration-300 ease-out">
        {/* 目的地 */}
        <div
          className="flex-1 min-w-0 px-3 xl:px-4 py-2 xl:py-3 rounded-full hover:bg-gray-100/50 transition-all duration-200 relative group cursor-pointer"
          onClick={() => locationInputRef.current?.focus()}
        >
          <label className="flex items-center gap-1.5 text-[10px] xl:text-xs font-semibold text-gray-700 mb-0.5 cursor-pointer">
            <MapPin className="w-3 h-3 xl:w-4 xl:h-4 text-sakura-500 flex-shrink-0" />
            <span className="truncate">目的地</span>
          </label>
          <div className="relative flex items-center">
            <input
              ref={locationInputRef}
              type="text"
              placeholder="东京、京都..."
              value={searchState.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={handleLocationFocus}
              className="w-full text-xs xl:text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 cursor-text pr-5 truncate"
            />
            {/* 清空按钮 */}
            {searchState.location && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation('');
                  setShowDropdown(false);
                }}
                className="absolute right-0 p-0.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                aria-label="清空目的地"
              >
                <X className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-gray-500" />
              </button>
            )}
          </div>

          {/* 下拉菜单 - Airbnb 风格优化 */}
          {showDropdown && filteredLocations.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl overflow-hidden z-50 max-h-[400px] overflow-y-auto
                shadow-[0_8px_28px_0_rgba(0,0,0,0.12)]
                border border-gray-100/50
                dropdown-scrollbar"
              style={{
                animation: isClosing
                  ? 'dropdown-disappear 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  : 'dropdown-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="py-2">
                {filteredLocations.map((loc, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(loc)}
                    className="w-full px-5 py-3.5 text-left flex items-center gap-4
                      transition-all duration-200 ease-out
                      hover:bg-sakura-50/60 hover:shadow-md active:bg-sakura-100/80 active:scale-[0.98]
                      group relative rounded-2xl cursor-pointer"
                  >
                    {/* 图标容器 - 添加悬停动画 */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center
                      group-hover:bg-sakura-50 transition-all duration-200
                      group-hover:scale-110 group-active:scale-95">
                      <MapPin className="w-5 h-5 text-gray-400 group-hover:text-sakura-500 transition-colors duration-200" />
                    </div>

                    {/* 文字内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-gray-950 transition-colors duration-200">
                        {loc}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {loc.includes('京都') ? '人气和服体验地' :
                         loc.includes('东京') ? '东京热门区域' : '和服租赁店铺'}
                      </div>
                    </div>

                    {/* 悬停时显示的箭头指示器 */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="h-6 xl:h-8 w-px bg-gray-200 flex-shrink-0"></div>

        {/* 日期 */}
        <div
          className="flex-1 min-w-0 px-3 xl:px-4 py-2 xl:py-3 rounded-full hover:bg-gray-100/50 transition-all duration-200 group cursor-pointer relative"
          onClick={(e) => {
            // 如果点击的不是 input 本身，则触发 input 的点击
            if (e.target !== dateInputRef.current) {
              dateInputRef.current?.click();
              // 尝试使用 showPicker API（如果支持）
              try {
                dateInputRef.current?.showPicker?.();
              } catch {
                // 某些浏览器不支持 showPicker，降级到 focus
                dateInputRef.current?.focus();
              }
            }
          }}
        >
          <label className="flex items-center gap-1.5 text-[10px] xl:text-xs font-semibold text-gray-700 mb-0.5 cursor-pointer">
            <Calendar className="w-3 h-3 xl:w-4 xl:h-4 text-sakura-500 flex-shrink-0" />
            <span className="truncate">到店日期</span>
          </label>
          {/* 显示层 */}
          <div className="text-xs xl:text-sm text-gray-900 truncate">
            {searchState.date ? new Date(searchState.date + 'T00:00:00').toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric'
            }) : '选择日期'}
          </div>
          {/* 隐藏的 input */}
          <input
            ref={dateInputRef}
            type="date"
            value={searchState.date}
            onChange={(e) => setDate(e.target.value)}
            className="absolute opacity-0 pointer-events-none"
          />
        </div>

        {/* 分隔线 + 主题选择 - 在 /plans 页面隐藏 */}
        {!hideThemeSelector && (
          <>
            <div className="h-6 xl:h-8 w-px bg-gray-300 flex-shrink-0"></div>

            {/* 主题 */}
            <div
              ref={themeButtonRef}
              className="flex-1 min-w-0 px-3 xl:px-4 py-2 xl:py-3 rounded-full hover:bg-gray-100/50 transition-all duration-200 group relative cursor-pointer"
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            >
              <label className="flex items-center gap-1.5 text-[10px] xl:text-xs font-semibold text-gray-700 mb-0.5 cursor-pointer">
                <Palette className="w-3 h-3 xl:w-4 xl:h-4 text-sakura-500 flex-shrink-0" />
                <span className="truncate">主题</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs xl:text-sm truncate ${searchState.theme ? 'text-gray-900' : 'text-gray-400'}`}>
                  {searchState.theme ? (
                    <span className="flex items-center gap-1">
                      {(() => {
                        const IconComponent = getThemeIcon(searchState.theme.icon);
                        return <IconComponent className="w-3.5 h-3.5 xl:w-4 xl:h-4 flex-shrink-0" />;
                      })()}
                      <span className="truncate">{searchState.theme.name}</span>
                    </span>
                  ) : (
                    '选择主题'
                  )}
                </span>
                {searchState.theme ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThemeSelect(null);
                    }}
                    className="p-0.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                    aria-label="清空主题"
                  >
                    <X className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-gray-500" />
                  </button>
                ) : (
                  <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 transition-transform flex-shrink-0 ${showThemeDropdown ? 'rotate-180' : ''}`} />
                )}
              </div>

              {/* 主题下拉菜单 - Pills 网格布局 */}
              {showThemeDropdown && (
                <div
                  ref={themeDropdownRef}
                  className="absolute top-full left-0 mt-3 bg-white rounded-2xl overflow-hidden z-50
                    shadow-[0_8px_28px_0_rgba(0,0,0,0.12)]
                    border border-gray-100/50
                    p-3 min-w-[280px]"
                  style={{
                    animation: 'dropdown-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {themes.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-gray-500 text-center">暂无主题</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {themes.map((theme) => {
                        const isSelected = searchState.theme?.id === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowThemeDropdown(false);
                              handleThemeSelect(theme);
                            }}
                            className={`
                              px-3 py-2 rounded-full text-sm font-medium
                              transition-all duration-300 ease-out
                              flex items-center gap-1.5
                              ${isSelected
                                ? 'bg-sakura-500 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102 active:scale-98'
                              }
                            `}
                          >
                            {(() => {
                              const IconComponent = getThemeIcon(theme.icon);
                              return <IconComponent className="w-4 h-4" />;
                            })()}
                            <span>{theme.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* 搜索按钮 */}
        <button
          onClick={handleSearch}
          disabled={isPending || isSearching}
          className="flex-shrink-0 w-9 h-9 xl:w-11 xl:h-11 flex items-center justify-center bg-sakura-500 hover:bg-sakura-600 disabled:bg-sakura-400 rounded-full shadow-md hover:shadow-lg active:scale-95 disabled:active:scale-100 transition-all duration-200 cursor-pointer"
          aria-label="搜索"
        >
          {isPending || isSearching ? (
            <Loader2 className="w-4 h-4 xl:w-5 xl:h-5 text-white animate-spin" />
          ) : (
            <Search className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/*
        响应式策略:
        - md (768px-1024px): 始终显示紧凑模式
        - lg+ (>1024px): 根据 isSearchBarExpanded 切换
      */}

      {/* 中等屏幕 (768px-1024px): 始终显示紧凑模式 */}
      <div className="hidden md:flex lg:hidden">
        {compactSearchBar}
      </div>

      {/* 大屏幕 (>1024px): 根据状态切换 */}
      <div className="hidden lg:flex">
        {isSearchBarExpanded ? expandedSearchBar : compactSearchBar}
      </div>
    </>
  );
}
