"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Search, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { getThemeIcon } from "@/lib/themeIcons";
import { useSearchState } from "@/contexts/SearchStateContext";
import { useLocationDropdown } from "@/components/search/LocationDropdown";
import DateDropdown, { useDateDropdown } from "@/components/search/DateDropdown";

interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface HeroSearchPanelProps {
  themes: Theme[];
  variant?: "dark" | "light";
  onDropdownOpenChange?: (isOpen: boolean) => void; // 下拉菜单打开状态变化时通知父组件
}

export default function HeroSearchPanel({ themes, variant = "dark", onDropdownOpenChange }: HeroSearchPanelProps) {
  const router = useRouter();
  // 使用全局搜索状态，与 Header 搜索栏同步
  const { searchState, setLocation, setDate, setTheme, startSearch } = useSearchState();
  const themesScrollRef = useRef<HTMLDivElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const dateContainerRef = useRef<HTMLDivElement>(null);
  const isLight = variant === "light";

  // 从全局状态读取
  const location = searchState.location;
  const date = searchState.date;
  const selectedTheme = searchState.theme;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 设置主题的包装函数（用于主题选择按钮）
  const setSelectedTheme = (theme: Theme | null) => {
    setTheme(theme);
  };

  // 使用共享的 location dropdown hook
  const {
    filteredLocations,
    isOpen: showLocationDropdown,
    open: openLocationDropdown,
    close: closeLocationDropdown,
    filter: filterLocations,
    getLocationDescription,
  } = useLocationDropdown();

  // 使用共享的 date dropdown hook
  const {
    isOpen: showDateDropdown,
    open: openDateDropdown,
    close: closeDateDropdown,
    toggle: toggleDateDropdown,
  } = useDateDropdown();

  // 通知父组件下拉菜单状态变化
  useEffect(() => {
    const isAnyDropdownOpen = showLocationDropdown || showDateDropdown;
    onDropdownOpenChange?.(isAnyDropdownOpen);
  }, [showLocationDropdown, showDateDropdown, onDropdownOpenChange]);

  // 点击外部关闭 location 下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        showLocationDropdown &&
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(target) &&
        locationContainerRef.current &&
        !locationContainerRef.current.contains(target)
      ) {
        closeLocationDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLocationDropdown, closeLocationDropdown]);

  // 检查主题滚动状态
  const checkScrollButtons = () => {
    if (themesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = themesScrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, [themes]);

  const scrollThemes = (direction: "left" | "right") => {
    if (themesScrollRef.current) {
      const scrollAmount = 150;
      themesScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (date) params.set("date", date);
    if (selectedTheme) params.set("theme", selectedTheme.slug);

    // 设置全局搜索状态，让 /plans 页面的 ThemePills 立即显示选中状态
    startSearch(selectedTheme);

    const queryString = params.toString();
    router.push(queryString ? `/plans?${queryString}` : "/plans");
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    filterLocations(value);
  };

  const handleLocationFocus = () => {
    openLocationDropdown(location);
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    closeLocationDropdown();
    // 自动打开日期选择器
    setTimeout(() => {
      openDateDropdown();
    }, 100);
  };

  const handleDateSelect = (selectedDate: string) => {
    setDate(selectedDate);
  };

  return (
    <div className={`rounded-2xl p-1.5 md:p-2 ${isLight ? "glass-panel-light" : "glass-panel shadow-2xl"}`}>
      {/* 上部：地点 + 日期 + 搜索按钮 */}
      <div className="flex flex-col md:flex-row">
        {/* 地点选择 */}
        <div ref={locationContainerRef} className="flex-1 relative">
          <div
            className={`px-4 md:px-6 py-3 md:py-4 rounded-xl transition-colors cursor-pointer group ${
              isLight ? "hover:bg-gray-100/50" : "hover:bg-white/5"
            }`}
            onClick={() => handleLocationFocus()}
          >
            <div
              className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-1 ${
                isLight ? "text-gray-500" : "text-white/50"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-sakura-500" />
              <span>目的地</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="选择城市"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={handleLocationFocus}
                className={`flex-1 bg-transparent border-none outline-none text-lg md:text-xl font-medium placeholder-opacity-50 ${
                  isLight
                    ? "text-gray-900 placeholder-gray-400"
                    : "text-white placeholder-white/50"
                }`}
              />
              {location && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation("");
                    closeLocationDropdown();
                  }}
                  className={`p-1 rounded-full transition-colors ${
                    isLight ? "hover:bg-gray-200" : "hover:bg-white/20"
                  }`}
                  aria-label="清空目的地"
                >
                  <X className={`w-4 h-4 ${isLight ? "text-gray-500" : "text-white/70"}`} />
                </button>
              )}
            </div>
          </div>

          {/* 地点下拉菜单 - 使用 Airbnb 风格 */}
          {showLocationDropdown && filteredLocations.length > 0 && (
            <div
              ref={locationDropdownRef}
              className="absolute top-full left-0 mt-2 bg-white rounded-xl overflow-hidden z-[100] min-w-[300px] w-full max-w-[400px]
                shadow-[0_2px_16px_rgba(0,0,0,0.12)]
                border border-gray-100
                animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* 标题 */}
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-[12px] font-semibold text-gray-800 uppercase tracking-wide">
                  热门目的地
                </h3>
              </div>
              {/* 选项列表 */}
              <div className="px-2 pb-2 max-h-[320px] overflow-y-auto">
                {filteredLocations.map((loc, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLocationSelect(loc);
                    }}
                    className="w-full px-3 py-3 text-left flex items-center gap-3 rounded-lg
                      transition-all duration-200
                      hover:bg-gray-100 active:bg-gray-200
                      group cursor-pointer"
                  >
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center
                      group-hover:bg-gray-200 transition-colors duration-200"
                    >
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-gray-900">{loc}</div>
                      <div className="text-[12px] text-gray-500 mt-0.5">
                        {getLocationDescription(loc)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className={`hidden md:block w-px my-2 ${isLight ? "bg-gray-200" : "bg-white/10"}`} />

        {/* 日期选择 */}
        <div ref={dateContainerRef} className="flex-1 relative">
          <div
            className={`px-4 md:px-6 py-3 md:py-4 rounded-xl transition-colors cursor-pointer group ${
              isLight ? "hover:bg-gray-100/50" : "hover:bg-white/5"
            }`}
            onClick={toggleDateDropdown}
          >
            <div
              className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-1 ${
                isLight ? "text-gray-500" : "text-white/50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-sakura-500" />
              <span>到店日期</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg md:text-xl font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
                {date
                  ? new Date(date + "T00:00:00").toLocaleDateString("zh-CN", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })
                  : "选择日期"}
              </span>
              {date && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDate("");
                  }}
                  className={`p-1 rounded-full transition-colors ${
                    isLight ? "hover:bg-gray-200" : "hover:bg-white/20"
                  }`}
                  aria-label="清空日期"
                >
                  <X className={`w-4 h-4 ${isLight ? "text-gray-500" : "text-white/70"}`} />
                </button>
              )}
            </div>
          </div>

          {/* 日期下拉菜单 - 使用共享组件 */}
          <DateDropdown
            value={date}
            onChange={setDate}
            onSelect={handleDateSelect}
            isOpen={showDateDropdown}
            onClose={closeDateDropdown}
          />
        </div>

        {/* 分隔线 */}
        <div className={`hidden md:block w-px my-2 ${isLight ? "bg-gray-200" : "bg-white/10"}`} />

        {/* 搜索按钮 */}
        <div className="flex items-center px-2 md:px-4">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 md:py-4 bg-sakura-500 hover:bg-sakura-600 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-lg shadow-sakura-500/30"
          >
            <Search className="w-5 h-5" />
            <span className="md:hidden lg:inline">开始探索</span>
          </button>
        </div>
      </div>

      {/* 分隔线 */}
      <div className={`h-px mx-4 my-2 ${isLight ? "bg-gray-200" : "bg-white/10"}`} />

      {/* 下部：主题选择 */}
      <div className="px-4 py-2">
        <div
          className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-3 ${
            isLight ? "text-gray-500" : "text-white/50"
          }`}
        >
          <span>主题</span>
        </div>

        <div className="relative">
          {/* 左滚动按钮 */}
          {canScrollLeft && (
            <button
              onClick={() => scrollThemes("left")}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isLight
                  ? "bg-white shadow-md text-gray-600 hover:text-gray-900"
                  : "bg-black/50 text-white/80 hover:text-white"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* 主题 Pills */}
          <div
            ref={themesScrollRef}
            onScroll={checkScrollButtons}
            className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-1"
          >
            {/* 全部选项 */}
            <button
              onClick={() => setSelectedTheme(null)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !selectedTheme
                  ? "bg-sakura-500 text-white shadow-md"
                  : isLight
                    ? "bg-white/80 text-gray-700 hover:bg-sakura-50 hover:text-sakura-700"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
              style={!selectedTheme ? { boxShadow: "0 4px 14px rgba(255, 87, 128, 0.3)" } : undefined}
            >
              <Sparkles className="w-4 h-4" />
              全部
            </button>

            {themes.map((theme) => {
              const IconComponent = getThemeIcon(theme.icon);
              const isSelected = selectedTheme?.id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(isSelected ? null : theme)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "bg-sakura-500 text-white shadow-md"
                      : isLight
                        ? "bg-white/80 text-gray-700 hover:bg-sakura-50 hover:text-sakura-700"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                  style={isSelected ? { boxShadow: "0 4px 14px rgba(255, 87, 128, 0.3)" } : undefined}
                >
                  <IconComponent className="w-4 h-4" />
                  {theme.name}
                </button>
              );
            })}
          </div>

          {/* 右滚动按钮 */}
          {canScrollRight && (
            <button
              onClick={() => scrollThemes("right")}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isLight
                  ? "bg-white shadow-md text-gray-600 hover:text-gray-900"
                  : "bg-black/50 text-white/80 hover:text-white"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
