"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X, Calendar, Palette, Sparkles } from "lucide-react";
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

export default function MobileSearchBar() {
  const router = useRouter();
  const { searchState, setLocation, setDate, setTheme } = useSearchState();
  const { isHeroVisible } = useSearchBar();
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);

  // 主题相关状态
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);

  // 获取主题列表
  useEffect(() => {
    if (isMobileModalOpen && themes.length === 0) {
      setIsLoadingThemes(true);
      fetch('/api/themes')
        .then(res => res.json())
        .then(data => {
          setThemes(data.themes || []);
          setIsLoadingThemes(false);
        })
        .catch(error => {
          console.error('Failed to fetch themes:', error);
          setIsLoadingThemes(false);
        });
    }
  }, [isMobileModalOpen, themes.length]);

  // 获取所有地区数据
  const fetchLocations = async () => {
    if (allLocations.length > 0) return;

    try {
      const response = await fetch('/api/locations');
      const data = await response.json();
      if (data.locations) {
        setAllLocations(data.locations);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

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
    const params = new URLSearchParams();
    if (searchState.location) params.set("location", searchState.location);
    if (searchState.date) params.set("date", searchState.date);
    if (searchState.theme) params.set("theme", searchState.theme.slug);

    const queryString = params.toString();

    // 跳转到搜索结果页
    router.push(queryString ? `/search?${queryString}` : '/search');
  };

  // 生成按钮文本 - 只显示已选中的值
  const getButtonText = () => {
    const parts: string[] = [];

    if (searchState.location) {
      parts.push(searchState.location);
    }

    if (searchState.date) {
      const dateObj = new Date(searchState.date + 'T00:00:00');
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      parts.push(`${month}月${day}日`);
    }

    if (searchState.theme) {
      parts.push(searchState.theme.name);
    }

    // 如果没有选择任何值，显示"开始搜索"
    if (parts.length === 0) {
      return "开始搜索";
    }

    // 用 · 分隔已选择的值
    return parts.join(' · ');
  };

  const handleOpenModal = async () => {
    await fetchLocations();
    setIsMobileModalOpen(true);
  };

  return (
    <>
      {/* 移动端搜索按钮 - 在 Header 下方显示，Hero 可见时隐藏 */}
      <div
        className={`md:hidden sticky top-16 z-40 bg-white border-b border-gray-200 px-4 py-3 transition-all duration-300 ${
          isHeroVisible ? "opacity-0 pointer-events-none -translate-y-full" : "opacity-100 translate-y-0"
        }`}
      >
        <button
          onClick={handleOpenModal}
          className="w-full flex items-center gap-3 bg-white border border-gray-300 rounded-full px-4 py-3 shadow-sm active:scale-[0.98] transition-all"
        >
          <Search className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <span className="text-sm text-gray-900 font-medium flex-1 text-left truncate">
            {getButtonText()}
          </span>
        </button>
      </div>

      {/* 移动端全屏搜索模态框 */}
      {isMobileModalOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {/* 顶部栏 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">搜索和服体验</h2>
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 搜索表单 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 目的地 */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-sakura-500" />
                目的地
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="东京、京都..."
                  value={searchState.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={handleLocationFocus}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-sakura-500 focus:ring-2 focus:ring-sakura-100 outline-none transition-all"
                />
                {searchState.location && (
                  <button
                    onClick={() => {
                      setLocation('');
                      setShowDropdown(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* 移动端下拉菜单 */}
              {showDropdown && filteredLocations.length > 0 && (
                <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                  {filteredLocations.map((loc, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setLocation(loc);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-sakura-50 active:bg-sakura-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 text-sakura-500 flex-shrink-0" />
                      <span className="text-sm text-gray-900">{loc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 日期 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-sakura-500" />
                到店日期
              </label>
              {searchState.date ? (
                <div className="relative">
                  <input
                    type="date"
                    value={searchState.date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:border-sakura-500 focus:ring-2 focus:ring-sakura-100 outline-none transition-all text-gray-900 [&::-webkit-calendar-picker-indicator]:hidden [&::-moz-calendar-picker-indicator]:hidden"
                  />
                  <button
                    onClick={() => setDate('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // 创建一个临时的 date input 并触发选择器
                    const input = document.createElement('input');
                    input.type = 'date';
                    input.style.position = 'absolute';
                    input.style.opacity = '0';
                    input.style.pointerEvents = 'none';
                    document.body.appendChild(input);

                    input.onchange = (event) => {
                      const target = event.target as HTMLInputElement;
                      if (target.value) {
                        setDate(target.value);
                      }
                      document.body.removeChild(input);
                    };

                    input.onblur = () => {
                      setTimeout(() => {
                        if (document.body.contains(input)) {
                          document.body.removeChild(input);
                        }
                      }, 100);
                    };

                    input.click();
                    try {
                      input.showPicker?.();
                    } catch {
                      input.focus();
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left text-sm text-gray-400 hover:border-sakura-500 hover:bg-sakura-50/30 transition-all"
                >
                  选择日期
                </button>
              )}
            </div>

            {/* 主题选择 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Palette className="w-4 h-4 text-sakura-500" />
                主题
              </label>
              <div className="border border-gray-300 rounded-xl p-3">
                {isLoadingThemes ? (
                  <div className="text-sm text-gray-500 py-2">加载中...</div>
                ) : themes.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">暂无主题</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {/* 全部选项 */}
                    <button
                      onClick={() => setTheme(null)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                        !searchState.theme
                          ? 'bg-sakura-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      全部
                    </button>
                    {themes.map((theme) => {
                      const IconComponent = getThemeIcon(theme.icon);
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setTheme(theme)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                            searchState.theme?.id === theme.id
                              ? 'bg-sakura-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          {theme.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 底部搜索按钮 */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={() => {
                handleSearch();
                setIsMobileModalOpen(false);
              }}
              className="w-full bg-sakura-500 hover:bg-sakura-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Search className="w-5 h-5" />
              搜索
            </button>
          </div>
        </div>
      )}
    </>
  );
}
