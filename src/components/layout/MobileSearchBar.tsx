"use client";

import { useCallback, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, MapPin, X, Calendar, Palette, Sparkles } from "lucide-react";
import { useSearchFormState } from "@/shared/hooks";
import { useSearchBar } from "@/contexts/SearchBarContext";
import { useLocationDropdown } from "@/features/guest/discovery";
import { getThemeIcon } from "@/lib/themeIcons";

// 内部组件，使用 useSearchParams
function MobileSearchBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const { isHeroVisible, isMobileSearchModalOpen, openMobileSearchModal, closeMobileSearchModal } =
    useSearchBar();

  // 使用共享的搜索表单状态（延迟加载主题）
  const {
    localLocation,
    setLocalLocation,
    localDate,
    setLocalDate,
    selectedTheme,
    themes,
    isLoadingThemes,
    handleThemeSelect,
    buildSearchUrl,
  } = useSearchFormState({ lazyLoadThemes: true, lazyLoadTrigger: isMobileSearchModalOpen });

  // 使用共享的 location dropdown hook
  const {
    filteredLocations,
    isOpen: showDropdown,
    open: openLocationDropdown,
    close: closeLocationDropdown,
    filter: filterLocations,
  } = useLocationDropdown();

  // 搜索栏只在首页显示
  const shouldHide = pathname !== "/";

  const handleLocationChange = (value: string) => {
    setLocalLocation(value);
    filterLocations(value);
  };

  const handleLocationFocus = () => {
    openLocationDropdown(localLocation);
  };

  const handleSearch = () => {
    router.push(buildSearchUrl());
  };

  // 生成按钮文本 - 只显示已选中的值
  const getButtonText = () => {
    const parts: string[] = [];

    if (localLocation) {
      parts.push(localLocation);
    }

    if (localDate) {
      const dateObj = new Date(localDate + "T00:00:00");
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      parts.push(`${month}月${day}日`);
    }

    if (selectedTheme) {
      parts.push(selectedTheme.name);
    }

    // 如果没有选择任何值，显示"开始搜索"
    if (parts.length === 0) {
      return "开始搜索";
    }

    // 用 · 分隔已选择的值
    return parts.join(" · ");
  };

  const handleOpenModal = () => {
    openMobileSearchModal();
  };

  // 非首页不渲染
  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* 移动端搜索按钮 - 在 Header 下方显示，Hero 可见时隐藏 */}
      <div
        className={`md:hidden sticky top-16 z-40 transition-all duration-300 ${
          isHeroVisible
            ? "max-h-0 overflow-hidden opacity-0 pointer-events-none"
            : "max-h-20 bg-white border-b border-gray-200 px-4 py-3 opacity-100"
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
      {isMobileSearchModalOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {/* 顶部栏 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">搜索和服体验</h2>
            <button
              onClick={closeMobileSearchModal}
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
                  value={localLocation}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={handleLocationFocus}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-sakura-500 focus:ring-2 focus:ring-sakura-100 outline-none transition-all"
                />
                {localLocation && (
                  <button
                    onClick={() => {
                      setLocalLocation("");
                      closeLocationDropdown();
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
                        setLocalLocation(loc);
                        closeLocationDropdown();
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
              {localDate ? (
                <div className="relative">
                  <input
                    type="date"
                    value={localDate}
                    onChange={(e) => setLocalDate(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:border-sakura-500 focus:ring-2 focus:ring-sakura-100 outline-none transition-all text-gray-900 [&::-webkit-calendar-picker-indicator]:hidden [&::-moz-calendar-picker-indicator]:hidden"
                  />
                  <button
                    onClick={() => setLocalDate("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // 创建一个临时的 date input 并触发选择器
                    const input = document.createElement("input");
                    input.type = "date";
                    input.style.position = "absolute";
                    input.style.opacity = "0";
                    input.style.pointerEvents = "none";
                    document.body.appendChild(input);

                    input.onchange = (event) => {
                      const target = event.target as HTMLInputElement;
                      if (target.value) {
                        setLocalDate(target.value);
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
                      onClick={() => handleThemeSelect(null)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                        !selectedTheme
                          ? "bg-sakura-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                          onClick={() => handleThemeSelect(theme)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                            selectedTheme?.id === theme.id
                              ? "bg-sakura-500 text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                closeMobileSearchModal();
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

// 外部组件，包裹 Suspense 以支持静态页面预渲染
export default function MobileSearchBar() {
  return (
    <Suspense fallback={null}>
      <MobileSearchBarInner />
    </Suspense>
  );
}
