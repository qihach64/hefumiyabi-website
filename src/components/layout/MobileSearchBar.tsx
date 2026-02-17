"use client";

import { useState, useEffect, useLayoutEffect, useRef, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, MapPin, X, Sparkles } from "lucide-react";
import { useSearchFormState } from "@/shared/hooks";
import { useSearchBar } from "@/contexts/SearchBarContext";
import { useLocationDropdown, DateDropdown } from "@/features/guest/discovery";
import { getThemeIcon } from "@/lib/themeIcons";

type AccordionSection = "location" | "date" | "theme";

// 收起态卡片
function CollapsedCard({
  label,
  value,
  placeholder,
  onClick,
}: {
  label: string;
  value: string;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl px-5 py-4 flex items-center justify-between shadow-sm border border-gray-200 transition-colors active:bg-gray-50"
    >
      <span className="text-[14px] font-semibold text-gray-500">{label}</span>
      <span className={`text-[14px] font-medium ${value ? "text-gray-900" : "text-gray-400"}`}>
        {value || placeholder}
      </span>
    </button>
  );
}

function MobileSearchBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobileSearchModalOpen, openMobileSearchModal, closeMobileSearchModal } = useSearchBar();

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

  const {
    allLocations,
    filteredLocations,
    open: openLocationDropdown,
    close: closeLocationDropdown,
    filter: filterLocations,
    getLocationDescription,
  } = useLocationDropdown();

  // 手风琴当前展开区块
  const [activeSection, setActiveSection] = useState<AccordionSection>("location");
  // 保存打开模态框前的滚动位置
  const savedScrollY = useRef(0);

  // 锁定背景滚动（iOS Safari 兼容）
  useLayoutEffect(() => {
    if (isMobileSearchModalOpen) {
      savedScrollY.current = window.scrollY || savedScrollY.current;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";

      // 拦截 touchmove —— iOS Safari 最终保障
      const preventScroll = (e: TouchEvent) => e.preventDefault();
      document.addEventListener("touchmove", preventScroll, { passive: false });

      return () => {
        document.removeEventListener("touchmove", preventScroll);
        const scrollY = savedScrollY.current;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobileSearchModalOpen]);

  // 模态框打开时重置手风琴到目的地
  useEffect(() => {
    if (isMobileSearchModalOpen) {
      setActiveSection("location");
    }
  }, [isMobileSearchModalOpen]);

  // 当目的地区块展开且城市数据已加载时，显示城市列表
  useEffect(() => {
    if (isMobileSearchModalOpen && activeSection === "location" && allLocations.length > 0) {
      openLocationDropdown(localLocation);
    }
  }, [
    isMobileSearchModalOpen,
    activeSection,
    allLocations.length,
    openLocationDropdown,
    localLocation,
  ]);

  const handleLocationChange = (value: string) => {
    setLocalLocation(value);
    filterLocations(value);
  };

  const handleLocationSelect = (loc: string) => {
    setLocalLocation(loc);
    closeLocationDropdown();
    setActiveSection("date");
  };

  const handleSearch = () => {
    router.push(buildSearchUrl());
    closeMobileSearchModal();
  };

  const handleClearAll = () => {
    setLocalLocation("");
    setLocalDate("");
    handleThemeSelect(null);
    setActiveSection("location");
    openLocationDropdown("");
  };

  const hasAnySelection = localLocation || localDate || selectedTheme;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr + "T00:00:00");
    return `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  };

  // 搜索栏只在首页显示
  if (pathname !== "/") return null;

  return (
    <>
      {/* Airbnb 风格大搜索栏按钮 */}
      <div className="md:hidden sticky top-16 z-40 bg-white/80 backdrop-blur-md px-4 py-2">
        <button
          onClick={() => {
            savedScrollY.current = window.scrollY;
            openMobileSearchModal();
          }}
          className="w-full rounded-full shadow-sm border border-gray-200 bg-white px-5 py-3 flex items-center gap-3 active:scale-[0.98] transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-sakura-500 flex items-center justify-center flex-shrink-0">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-medium text-gray-800">搜索和服体验</span>
        </button>
      </div>

      {/* 全屏搜索模态框 */}
      {isMobileSearchModalOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-50 z-50 flex flex-col overflow-hidden overscroll-contain">
          {/* 顶部栏 */}
          <div className="flex items-center px-4 pt-4 pb-2">
            <button
              onClick={closeMobileSearchModal}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full active:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* 手风琴区域 */}
          <div className="flex-1 overflow-hidden px-4 pb-4 space-y-3">
            {/* === 目的地 === */}
            {activeSection === "location" ? (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-[22px] font-semibold text-gray-900 mb-4">去哪里？</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索目的地"
                    value={localLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    // 不自动聚焦，避免移动端弹出键盘影响布局
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-[16px] focus:border-sakura-500 focus:ring-2 focus:ring-sakura-100 outline-none transition-all"
                  />
                  {localLocation && (
                    <button
                      onClick={() => {
                        setLocalLocation("");
                        filterLocations("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 active:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>

                {/* 城市列表 */}
                {filteredLocations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {filteredLocations.map((loc, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(loc)}
                        className="w-full px-3 py-3 text-left flex items-center gap-3 rounded-xl transition-all duration-200 active:bg-gray-100"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
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
                )}
              </div>
            ) : (
              <CollapsedCard
                label="目的地"
                value={localLocation}
                placeholder="搜索目的地"
                onClick={() => {
                  setActiveSection("location");
                  openLocationDropdown(localLocation);
                }}
              />
            )}

            {/* === 日期 === */}
            {activeSection === "date" ? (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-[22px] font-semibold text-gray-900 mb-4">什么时候？</h3>
                <DateDropdown
                  value={localDate}
                  onChange={(date) => setLocalDate(date)}
                  onSelect={() => setActiveSection("theme")}
                  isOpen={true}
                  onClose={() => {}}
                  className="!static !mt-0 !shadow-none !border-0 !max-h-none !min-w-0 !animate-none w-full"
                />
              </div>
            ) : (
              <CollapsedCard
                label="到店日期"
                value={localDate ? formatDate(localDate) : ""}
                placeholder="选择日期"
                onClick={() => setActiveSection("date")}
              />
            )}

            {/* === 主题 === */}
            {activeSection === "theme" ? (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="text-[22px] font-semibold text-gray-900 mb-4">选择主题</h3>
                {isLoadingThemes ? (
                  <div className="text-[14px] text-gray-500 py-2">加载中...</div>
                ) : themes.length === 0 ? (
                  <div className="text-[14px] text-gray-500 py-2">暂无主题</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleThemeSelect(null)}
                      className={`px-3 py-2 rounded-full text-[14px] font-medium transition-all duration-300 flex items-center gap-1.5 ${
                        !selectedTheme
                          ? "bg-sakura-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 active:bg-gray-200"
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
                          className={`px-3 py-2 rounded-full text-[14px] font-medium transition-all duration-300 flex items-center gap-1.5 ${
                            selectedTheme?.id === theme.id
                              ? "bg-sakura-500 text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 active:bg-gray-200"
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
            ) : (
              <CollapsedCard
                label="主题"
                value={selectedTheme?.name ?? ""}
                placeholder="选择主题"
                onClick={() => setActiveSection("theme")}
              />
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
            {hasAnySelection ? (
              <button
                onClick={handleClearAll}
                className="text-[14px] font-semibold underline text-gray-900"
              >
                清除全部
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleSearch}
              className="bg-sakura-500 hover:bg-sakura-600 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 active:scale-95 transition-all"
            >
              <Search className="w-4 h-4" />
              搜索
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// 骨架屏 — 与大搜索栏按钮尺寸一致，消除 CLS
function MobileSearchBarSkeleton() {
  return (
    <div className="md:hidden sticky top-16 z-40 bg-white/80 backdrop-blur-md px-4 py-2">
      <div className="h-14 rounded-full bg-gray-100 animate-pulse" />
    </div>
  );
}

// 外部组件，包裹 Suspense 以支持静态页面预渲染
export default function MobileSearchBar() {
  return (
    <Suspense fallback={<MobileSearchBarSkeleton />}>
      <MobileSearchBarInner />
    </Suspense>
  );
}
