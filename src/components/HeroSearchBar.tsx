"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import ThemeDropdown from "@/components/ThemeDropdown";
import { useSearchState } from "@/contexts/SearchStateContext";

export default function HeroSearchBar() {
  const router = useRouter();
  const { searchState, setLocation, setDate, setTheme } = useSearchState();

  const [mobileExpanded, setMobileExpanded] = useState(false);

  // 自动补全相关状态
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const themeButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 监听点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 过滤地区
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

  // 选择地区
  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);

    setIsClosing(true);
    setTimeout(() => {
      setShowDropdown(false);
      setIsClosing(false);
    }, 300);

    // 自动切换到日期选择器
    setTimeout(() => {
      dateInputRef.current?.click();
      try {
        dateInputRef.current?.showPicker?.();
      } catch {
        dateInputRef.current?.focus();
      }
    }, 400);
  };

  // 聚焦时显示下拉菜单
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

  const handleSearch = () => {
    // 构建查询参数
    const params = new URLSearchParams();
    if (searchState.location) params.set("location", searchState.location);
    if (searchState.date) params.set("date", searchState.date);
    if (searchState.theme) params.set("theme", searchState.theme.slug);

    const queryString = params.toString();

    // 跳转到搜索结果页
    router.push(queryString ? `/search?${queryString}` : '/search');
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        {/* 桌面端：横向展开搜索框 - Airbnb 风格 */}
        <div className="hidden md:flex rounded-full p-2 gap-2 items-center bg-white border border-gray-200
          shadow-[0_8px_24px_0_rgba(0,0,0,0.1)]
          hover:shadow-[0_12px_32px_0_rgba(0,0,0,0.15)]
          transition-all duration-300 ease-out relative">
          {/* 目的地 */}
          <div
            className="flex-1 px-6 py-3 rounded-full hover:bg-gray-100/50 transition-all duration-200 cursor-pointer relative group"
            onClick={() => locationInputRef.current?.focus()}
          >
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1 cursor-pointer">
              <MapPin className="w-4 h-4 text-sakura-500" />
              目的地
            </label>
            <div className="relative flex items-center">
              <input
                ref={locationInputRef}
                type="text"
                placeholder="东京、京都..."
                value={searchState.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={handleLocationFocus}
                className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 cursor-text pr-6"
              />
              {searchState.location && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('');
                    setShowDropdown(false);
                  }}
                  className="absolute right-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="清空目的地"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* 下拉菜单 */}
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
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center
                        group-hover:bg-sakura-50 transition-all duration-200
                        group-hover:scale-110 group-active:scale-95">
                        <MapPin className="w-5 h-5 text-gray-400 group-hover:text-sakura-500 transition-colors duration-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-gray-950 transition-colors duration-200">
                          {loc}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {loc.includes('京都') ? '人气和服体验地' :
                           loc.includes('东京') ? '东京热门区域' : '和服租赁店铺'}
                        </div>
                      </div>
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
          <div className="h-8 w-px bg-gray-200"></div>

          {/* 日期 */}
          <div
            className="flex-1 px-6 py-3 rounded-full hover:bg-gray-100/50 transition-all duration-200 cursor-pointer group relative"
            onClick={(e) => {
              if (e.target !== dateInputRef.current) {
                dateInputRef.current?.click();
                try {
                  dateInputRef.current?.showPicker?.();
                } catch {
                  dateInputRef.current?.focus();
                }
              }
            }}
          >
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1 cursor-pointer">
              <Calendar className="w-4 h-4 text-sakura-500" />
              到店日期
            </label>
            <div className="text-sm text-gray-900">
              {searchState.date ? new Date(searchState.date + 'T00:00:00').toLocaleDateString('zh-CN', {
                month: 'long',
                day: 'numeric'
              }) : '选择日期'}
            </div>
            <input
              ref={dateInputRef}
              type="date"
              value={searchState.date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute opacity-0 pointer-events-none"
            />
          </div>

          {/* 分隔线 */}
          <div className="h-8 w-px bg-gray-200"></div>

          {/* 主题 */}
          <div
            ref={themeButtonRef}
            className="flex-1 px-6 py-3 rounded-full hover:bg-gray-100/50 transition-all duration-200 group relative cursor-pointer"
          >
            <ThemeDropdown
              value={searchState.theme}
              onChange={setTheme}
            />
          </div>

          {/* 搜索按钮 */}
          <button
            onClick={handleSearch}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-sakura-600 hover:bg-sakura-700 rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="搜索"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 移动端：紧凑搜索按钮 */}
        <div className="md:hidden">
          {!mobileExpanded ? (
            <button
              onClick={() => setMobileExpanded(true)}
              className="w-full rounded-full shadow-lg p-3 flex items-center gap-3 active:scale-[0.98] transition-all duration-200 hover:shadow-xl"
              style={{
                background: 'linear-gradient(180deg, #ffffff 39.9%, #f8f8f8 100%)',
                border: '1px solid #e5e5e5'
              }}
            >
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-gray-900">搜索和服体验</div>
                <div className="text-xs text-gray-500">目的地 · 日期 · 主题</div>
              </div>
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-4 space-y-3">
              {/* 关闭按钮 */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">搜索和服体验</h3>
                <button
                  onClick={() => setMobileExpanded(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 目的地 */}
              <div className="relative">
                <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl focus-within:border-sakura-500 focus-within:ring-2 focus-within:ring-sakura-100 transition-all duration-200">
                  <MapPin className="w-5 h-5 text-sakura-500 flex-shrink-0" />
                  <div className="flex-1 relative">
                    <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                      目的地
                    </label>
                    <input
                      type="text"
                      placeholder="东京、京都..."
                      value={searchState.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={handleLocationFocus}
                      className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0 pr-6"
                    />
                    {searchState.location && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation('');
                          setShowDropdown(false);
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                        aria-label="清空目的地"
                      >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>

                {showDropdown && filteredLocations.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-60 overflow-y-auto">
                    {filteredLocations.map((loc, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(loc)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-sakura-50 hover:shadow-sm active:bg-sakura-100 transition-all duration-200 flex items-center gap-3 border-b border-gray-100 last:border-b-0 rounded-lg cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-sakura-500 flex-shrink-0" />
                        <span>{loc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 日期 */}
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl focus-within:border-sakura-500 focus-within:ring-2 focus-within:ring-sakura-100 transition-all duration-200">
                <Calendar className="w-5 h-5 text-sakura-500 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    到店日期
                  </label>
                  <input
                    type="date"
                    value={searchState.date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* 主题 */}
              <div className="p-4 border border-gray-200 rounded-xl hover:border-sakura-500 hover:ring-2 hover:ring-sakura-100 transition-all duration-200">
                <ThemeDropdown
                  value={searchState.theme}
                  onChange={setTheme}
                />
              </div>

              {/* 搜索按钮 */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm cursor-pointer"
              >
                <Search className="w-4 h-4" />
                搜索
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
