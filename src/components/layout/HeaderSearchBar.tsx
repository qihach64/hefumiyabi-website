"use client";

import {
  useState,
  useEffect,
  useRef,
  useTransition,
  useCallback,
  useMemo,
  Suspense,
  memo,
} from "react";
import {
  Search,
  MapPin,
  X,
  Calendar,
  Palette,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchFormState } from "@/shared/hooks";
import { useSearchBar } from "@/contexts/SearchBarContext";
import { useLocationDropdown } from "@/features/guest/discovery";
import { getThemeIcon } from "@/lib/themeIcons";
import type { Theme } from "@/types";

// 内部组件，使用 useSearchParams
// 使用 memo 防止父组件重渲染导致的不必要更新
const HeaderSearchBarInner = memo(function HeaderSearchBarInner() {
  const router = useRouter();
  const {
    localLocation,
    setLocalLocation,
    localDate,
    setLocalDate,
    selectedTheme,
    themes,
    handleThemeSelect,
    buildSearchUrl,
  } = useSearchFormState();
  const { isSearchBarExpanded, expandManually, hideThemeSelector } = useSearchBar();
  const [isPending, startTransition] = useTransition();

  // 使用共享的 location dropdown hook
  const {
    filteredLocations,
    isOpen: showLocationDropdown,
    open: openLocationDropdown,
    close: closeLocationDropdown,
    filter: filterLocations,
    getLocationDescription,
  } = useLocationDropdown();

  const locationInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);

  // 主题相关状态
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const themeContainerRef = useRef<HTMLDivElement>(null);

  // 日期选择器状态
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const dateContainerRef = useRef<HTMLDivElement>(null);

  // 搜索框容器 ref
  const searchBarRef = useRef<HTMLDivElement>(null);

  // 防止展开动画期间误关闭下拉菜单
  const isExpandingRef = useRef(false);

  // 关闭所有下拉菜单
  const closeAllDropdowns = useCallback(() => {
    closeLocationDropdown();
    setShowThemeDropdown(false);
    setShowDateDropdown(false);
  }, [closeLocationDropdown]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 展开动画期间不处理点击外部事件
      if (isExpandingRef.current) {
        return;
      }

      const target = event.target as Node;

      // 检查 location 下拉菜单
      if (
        showLocationDropdown &&
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(target) &&
        locationContainerRef.current &&
        !locationContainerRef.current.contains(target)
      ) {
        closeLocationDropdown();
      }

      // 检查 theme 下拉菜单
      if (
        showThemeDropdown &&
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(target) &&
        themeContainerRef.current &&
        !themeContainerRef.current.contains(target)
      ) {
        setShowThemeDropdown(false);
      }

      // 检查 date 下拉菜单
      if (
        showDateDropdown &&
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(target) &&
        dateContainerRef.current &&
        !dateContainerRef.current.contains(target)
      ) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLocationDropdown, showThemeDropdown, showDateDropdown, closeLocationDropdown]);

  // ESC 键关闭下拉菜单
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAllDropdowns();
        // 移除输入框焦点
        locationInputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeAllDropdowns]);

  // 滚动时关闭下拉菜单
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      // 展开动画期间不处理滚动事件
      if (isExpandingRef.current) {
        lastScrollY = window.scrollY;
        return;
      }

      // 只有滚动超过一定距离才关闭（防止 header 高度变化触发的微小滚动）
      const scrollDelta = Math.abs(window.scrollY - lastScrollY);
      if (scrollDelta > 10 && (showLocationDropdown || showThemeDropdown || showDateDropdown)) {
        closeAllDropdowns();
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showLocationDropdown, showThemeDropdown, showDateDropdown, closeAllDropdowns]);

  // 主题选择 - 关闭下拉菜单
  const handleThemeSelectAndClose = useCallback(
    (theme: Theme | null) => {
      handleThemeSelect(theme);
      setShowThemeDropdown(false);
    },
    [handleThemeSelect]
  );

  const handleLocationChange = (value: string) => {
    setLocalLocation(value);
    filterLocations(value);
    // 打开 location 时关闭 theme
    setShowThemeDropdown(false);
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocalLocation(selectedLocation);
    closeLocationDropdown();

    // 自动切换到日期选择器
    setTimeout(() => {
      setShowDateDropdown(true);
    }, 100);
  };

  const handleLocationFocus = () => {
    openLocationDropdown(localLocation);
    // 打开 location 时关闭 theme
    setShowThemeDropdown(false);
  };

  const handleExpand = (focusField?: "location" | "date" | "theme" | "none") => {
    // 设置展开锁定标志，防止点击外部事件误关闭下拉菜单
    isExpandingRef.current = true;

    expandManually();

    if (focusField === "none") {
      // 仅展开不聚焦时，短暂锁定后解除
      setTimeout(() => {
        isExpandingRef.current = false;
      }, 350);
      return;
    }

    // 等待展开动画和 DOM 更新完成后再操作
    setTimeout(() => {
      if (focusField === "date") {
        setShowDateDropdown(true);
        closeLocationDropdown();
        setShowThemeDropdown(false);
      } else if (focusField === "theme") {
        setShowThemeDropdown(true);
        closeLocationDropdown();
        setShowDateDropdown(false);
      } else if (focusField === "location") {
        locationInputRef.current?.focus();
        // 触发 focus 会自动打开下拉菜单
      }

      // 操作完成后解除锁定
      setTimeout(() => {
        isExpandingRef.current = false;
      }, 100);
    }, 350); // 等待 header 高度动画 (300ms) + 缓冲
  };

  const handleThemeButtonClick = () => {
    setShowThemeDropdown((prev) => !prev);
    // 打开 theme 时关闭其他
    closeLocationDropdown();
    setShowDateDropdown(false);
  };

  const handleDateButtonClick = () => {
    setShowDateDropdown((prev) => !prev);
    // 打开 date 时关闭其他
    closeLocationDropdown();
    setShowThemeDropdown(false);
  };

  // 日历数据生成
  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 获取第一天是星期几（0=周日）
    const startDayOfWeek = firstDay.getDay();

    // 生成日历网格（42天 = 6周）
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }[] = [];

    // 上个月的天数填充
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: date < new Date(new Date().setHours(0, 0, 0, 0)),
      });
    }

    // 当月的天数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
      });
    }

    // 下个月的天数填充
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
      });
    }

    return {
      year,
      month,
      monthName: calendarMonth.toLocaleDateString("zh-CN", { year: "numeric", month: "long" }),
      days,
    };
  }, [calendarMonth]);

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    setLocalDate(dateStr);
    setShowDateDropdown(false);
  };

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSearch = () => {
    const url = buildSearchUrl();
    closeAllDropdowns();
    startTransition(() => {
      router.push(url);
    });
  };

  // 紧凑模式组件
  const compactSearchBar = (
    <div
      className="flex items-center gap-1.5 md:gap-2 border border-gray-300 rounded-full px-2 md:px-3 py-1.5 md:py-2 bg-white
      hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.1)]
      transition-all duration-300 ease-out
      flex-shrink min-w-0"
    >
      <button
        onClick={() => handleExpand("location")}
        className="flex items-center gap-1 md:gap-1.5 hover:bg-gray-50 px-1.5 md:px-2 py-1 rounded-full transition-colors cursor-pointer min-w-0"
        type="button"
      >
        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-sakura-500 flex-shrink-0" />
        <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-[60px] md:max-w-[80px]">
          {localLocation || "目的地"}
        </span>
      </button>
      <div className="w-px h-5 md:h-6 bg-gray-300 flex-shrink-0"></div>
      <button
        onClick={() => handleExpand("date")}
        className="flex items-center gap-1 md:gap-1.5 hover:bg-gray-50 px-1.5 md:px-2 py-1 rounded-full transition-colors cursor-pointer min-w-0"
        type="button"
      >
        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-sakura-500 flex-shrink-0" />
        <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-[50px] md:max-w-[70px]">
          {localDate
            ? new Date(localDate + "T00:00:00").toLocaleDateString("zh-CN", {
                month: "short",
                day: "numeric",
              })
            : "日期"}
        </span>
      </button>
      {!hideThemeSelector && (
        <>
          <div className="w-px h-5 md:h-6 bg-gray-300 flex-shrink-0 hidden sm:block"></div>
          <button
            onClick={() => handleExpand("theme")}
            className="hidden sm:flex items-center gap-1 md:gap-1.5 hover:bg-gray-50 px-1.5 md:px-2 py-1 rounded-full transition-colors cursor-pointer min-w-0"
            type="button"
          >
            <Palette className="w-3.5 h-3.5 md:w-4 md:h-4 text-sakura-500 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-[50px] md:max-w-[70px]">
              {selectedTheme ? (
                <span className="flex items-center gap-1">
                  {(() => {
                    const IconComponent = getThemeIcon(selectedTheme.icon);
                    return <IconComponent className="w-3.5 h-3.5 md:w-4 md:h-4" />;
                  })()}
                  <span className="truncate">{selectedTheme.name}</span>
                </span>
              ) : (
                "主题"
              )}
            </span>
          </button>
        </>
      )}
      <button
        onClick={() => handleExpand("none")}
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

  // 展开模式组件
  const expandedSearchBar = (
    <div ref={searchBarRef} className="w-full max-w-3xl flex-shrink min-w-0">
      <div
        className="rounded-full p-1.5 gap-1 flex items-center bg-white border border-gray-200
        shadow-[0_8px_24px_0_rgba(0,0,0,0.1)]
        transition-all duration-300 ease-out"
      >
        {/* 目的地 */}
        <div
          ref={locationContainerRef}
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
              value={localLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={handleLocationFocus}
              className="w-full text-xs xl:text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 cursor-text pr-5 truncate"
            />
            {localLocation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalLocation("");
                  closeLocationDropdown();
                }}
                className="absolute right-0 p-0.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                aria-label="清空目的地"
              >
                <X className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Location 下拉菜单 - Airbnb 风格 */}
          {showLocationDropdown && filteredLocations.length > 0 && (
            <div
              ref={locationDropdownRef}
              className="absolute top-full left-0 mt-4 bg-white rounded-xl overflow-hidden z-[100] min-w-[320px] max-w-[400px]
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
        <div className="h-6 xl:h-8 w-px bg-gray-200 flex-shrink-0"></div>

        {/* 日期 */}
        <div
          ref={dateContainerRef}
          className="flex-1 min-w-0 px-3 xl:px-4 py-2 xl:py-3 rounded-full hover:bg-gray-100/50 transition-all duration-200 group cursor-pointer relative"
          onClick={handleDateButtonClick}
        >
          <label className="flex items-center gap-1.5 text-[10px] xl:text-xs font-semibold text-gray-700 mb-0.5 cursor-pointer">
            <Calendar className="w-3 h-3 xl:w-4 xl:h-4 text-sakura-500 flex-shrink-0" />
            <span className="truncate">到店日期</span>
          </label>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs xl:text-sm truncate ${localDate ? "text-gray-900" : "text-gray-400"}`}
            >
              {localDate
                ? new Date(localDate + "T00:00:00").toLocaleDateString("zh-CN", {
                    month: "long",
                    day: "numeric",
                  })
                : "选择日期"}
            </span>
            {localDate ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalDate("");
                }}
                className="p-0.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                aria-label="清空日期"
              >
                <X className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-gray-500" />
              </button>
            ) : (
              <ChevronDown
                className={`w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 transition-transform flex-shrink-0 ${showDateDropdown ? "rotate-180" : ""}`}
              />
            )}
          </div>

          {/* 日期下拉菜单 - Airbnb 风格日历 */}
          {showDateDropdown && (
            <div
              ref={dateDropdownRef}
              className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-4 bg-white rounded-xl overflow-hidden z-[100]
                shadow-[0_2px_16px_rgba(0,0,0,0.12)]
                border border-gray-100
                animate-in fade-in slide-in-from-top-2 duration-200
                max-h-[calc(100dvh-200px)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 w-[min(320px,calc(100vw-2rem))]">
                {/* 月份导航 */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    aria-label="上个月"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h3 className="text-[15px] font-semibold text-gray-900">
                    {calendarData.monthName}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    aria-label="下个月"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* 星期标题 */}
                <div className="grid grid-cols-7 mb-2">
                  {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-[12px] font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 日期网格 */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarData.days.map((day, index) => {
                    const dateStr = day.date.toISOString().split("T")[0];
                    const isSelected = localDate === dateStr;

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          !day.isPast && day.isCurrentMonth && handleDateSelect(day.date)
                        }
                        disabled={day.isPast || !day.isCurrentMonth}
                        className={`
                          w-10 h-10 rounded-full text-[14px] font-medium
                          transition-all duration-200
                          flex items-center justify-center
                          ${
                            isSelected
                              ? "bg-sakura-500 text-white"
                              : day.isToday
                                ? "bg-sakura-50 text-sakura-700 ring-1 ring-sakura-200 font-semibold"
                                : day.isCurrentMonth && !day.isPast
                                  ? "text-gray-900 hover:bg-sakura-50"
                                  : "text-gray-300 cursor-not-allowed"
                          }
                        `}
                      >
                        {day.date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* 快捷选项 */}
                <div className="mt-4 pt-3 border-t border-wabi-100 flex gap-2">
                  <button
                    onClick={() => handleDateSelect(new Date())}
                    className="flex-1 py-2 text-[13px] font-medium text-wabi-700 bg-wabi-50 rounded-lg hover:bg-sakura-50 hover:text-sakura-700 transition-colors"
                  >
                    今天
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      handleDateSelect(tomorrow);
                    }}
                    className="flex-1 py-2 text-[13px] font-medium text-wabi-700 bg-wabi-50 rounded-lg hover:bg-sakura-50 hover:text-sakura-700 transition-colors"
                  >
                    明天
                  </button>
                  <button
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      handleDateSelect(nextWeek);
                    }}
                    className="flex-1 py-2 text-[13px] font-medium text-wabi-700 bg-wabi-50 rounded-lg hover:bg-sakura-50 hover:text-sakura-700 transition-colors"
                  >
                    下周
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 分隔线 + 主题选择 */}
        {!hideThemeSelector && (
          <>
            <div className="h-6 xl:h-8 w-px bg-gray-300 flex-shrink-0"></div>

            {/* 主题 */}
            <div
              ref={themeContainerRef}
              className="flex-1 min-w-0 px-3 xl:px-4 py-2 xl:py-3 rounded-full hover:bg-gray-100/50 transition-all duration-200 group relative cursor-pointer"
              onClick={handleThemeButtonClick}
            >
              <label className="flex items-center gap-1.5 text-[10px] xl:text-xs font-semibold text-gray-700 mb-0.5 cursor-pointer">
                <Palette className="w-3 h-3 xl:w-4 xl:h-4 text-sakura-500 flex-shrink-0" />
                <span className="truncate">主题</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs xl:text-sm truncate ${selectedTheme ? "text-gray-900" : "text-gray-400"}`}
                >
                  {selectedTheme ? (
                    <span className="flex items-center gap-1">
                      {(() => {
                        const IconComponent = getThemeIcon(selectedTheme.icon);
                        return (
                          <IconComponent className="w-3.5 h-3.5 xl:w-4 xl:h-4 flex-shrink-0" />
                        );
                      })()}
                      <span className="truncate">{selectedTheme.name}</span>
                    </span>
                  ) : (
                    "选择主题"
                  )}
                </span>
                {selectedTheme ? (
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
                  <ChevronDown
                    className={`w-3.5 h-3.5 xl:w-4 xl:h-4 text-gray-400 transition-transform flex-shrink-0 ${showThemeDropdown ? "rotate-180" : ""}`}
                  />
                )}
              </div>

              {/* Theme 下拉菜单 - Airbnb 风格 */}
              {showThemeDropdown && (
                <div
                  ref={themeDropdownRef}
                  className="absolute top-full left-0 mt-4 bg-white rounded-xl overflow-hidden z-[100] min-w-[320px]
                    shadow-[0_2px_16px_rgba(0,0,0,0.12)]
                    border border-gray-100
                    animate-in fade-in slide-in-from-top-2 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 标题 */}
                  <div className="px-4 pt-4 pb-2">
                    <h3 className="text-[12px] font-semibold text-gray-800 uppercase tracking-wide">
                      选择体验主题
                    </h3>
                  </div>
                  {/* 选项网格 */}
                  <div className="px-2 pb-3">
                    {themes.length === 0 ? (
                      <div className="px-2 py-4 text-[14px] text-gray-500 text-center">
                        暂无主题
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {themes.map((theme) => {
                          const isSelected = selectedTheme?.id === theme.id;
                          const IconComponent = getThemeIcon(theme.icon);
                          return (
                            <button
                              key={theme.id}
                              onClick={() => handleThemeSelectAndClose(theme)}
                              className={`
                                px-3 py-3 rounded-lg text-left
                                transition-all duration-200
                                flex items-center gap-3
                                ${
                                  isSelected
                                    ? "bg-sakura-500 text-white"
                                    : "bg-gray-50 text-gray-700 hover:bg-sakura-50"
                                }
                              `}
                            >
                              <div
                                className={`
                                w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                                ${isSelected ? "bg-white/20" : "bg-white"}
                              `}
                              >
                                <IconComponent
                                  className="w-5 h-5"
                                  style={{ color: isSelected ? "white" : theme.color || "#D45B47" }}
                                />
                              </div>
                              <span className="text-[14px] font-medium truncate">{theme.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* 清除选择 */}
                  {selectedTheme && (
                    <div className="px-4 pb-3 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => handleThemeSelectAndClose(null)}
                        className="w-full py-2 text-[14px] text-gray-500 hover:text-gray-700 transition-colors text-center"
                      >
                        清除选择
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* 搜索按钮 - 展开模式显示文字 */}
        <button
          onClick={handleSearch}
          disabled={isPending}
          className="flex-shrink-0 h-9 xl:h-11 px-3 xl:px-5 flex items-center justify-center gap-1.5 xl:gap-2 bg-sakura-500 hover:bg-sakura-600 disabled:bg-sakura-400 rounded-full shadow-md hover:shadow-lg active:scale-95 disabled:active:scale-100 transition-all duration-200 cursor-pointer"
          aria-label="搜索"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 xl:w-5 xl:h-5 text-white animate-spin" />
          ) : (
            <Search className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
          )}
          <span className="text-sm xl:text-base font-medium text-white">搜索</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 中等屏幕 (768px-1024px): 始终显示紧凑模式 */}
      <div className="hidden md:flex lg:hidden">{compactSearchBar}</div>

      {/* 大屏幕 (>1024px): 根据状态切换 */}
      <div className="hidden lg:flex">
        {isSearchBarExpanded ? expandedSearchBar : compactSearchBar}
      </div>
    </>
  );
});

// 外部组件，包裹 Suspense 以支持静态页面预渲染
export default function HeaderSearchBar() {
  return (
    <Suspense fallback={null}>
      <HeaderSearchBarInner />
    </Suspense>
  );
}
