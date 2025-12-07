"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Search, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { getThemeIcon } from "@/lib/themeIcons";

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
}

export default function HeroSearchPanel({ themes, variant = "dark" }: HeroSearchPanelProps) {
  const router = useRouter();
  const themesScrollRef = useRef<HTMLDivElement>(null);
  const isLight = variant === "light";

  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 常用地区
  const popularLocations = ["东京", "京都", "大阪", "浅草", "祇園"];

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

    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : "/search");
  };

  const handleDateClick = () => {
    const dateInput = document.getElementById("hero-date-input") as HTMLInputElement;
    if (dateInput) {
      dateInput.showPicker?.();
    }
  };

  return (
    <div className={`rounded-2xl p-1.5 md:p-2 ${isLight ? "glass-panel-light" : "glass-panel shadow-2xl"}`}>
      {/* 上部：地点 + 日期 + 搜索按钮 */}
      <div className="flex flex-col md:flex-row">
        {/* 地点选择 */}
        <div className="flex-1 relative">
          <div
            className={`px-4 md:px-6 py-3 md:py-4 rounded-xl transition-colors cursor-pointer group ${
              isLight ? "hover:bg-gray-100/50" : "hover:bg-white/5"
            }`}
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          >
            <div className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-1 ${
              isLight ? "text-gray-500" : "text-white/50"
            }`}>
              <MapPin className="w-3.5 h-3.5 text-sakura-500" />
              <span>目的地</span>
            </div>
            <div className={`text-lg md:text-xl font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
              {location || "选择城市"}
            </div>
          </div>

          {/* 地点下拉 */}
          {showLocationDropdown && (
            <div className={`absolute top-full left-0 right-0 mt-2 p-2 rounded-xl z-20 ${
              isLight ? "bg-white shadow-lg border border-gray-100" : "glass-panel"
            }`}>
              <div className="flex flex-wrap gap-2">
                {popularLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocation(loc);
                      setShowLocationDropdown(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      location === loc
                        ? "bg-sakura-500 text-white"
                        : isLight
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className={`hidden md:block w-px my-2 ${isLight ? "bg-gray-200" : "bg-white/10"}`} />

        {/* 日期选择 */}
        <div className="flex-1 relative">
          <div
            className={`px-4 md:px-6 py-3 md:py-4 rounded-xl transition-colors cursor-pointer group ${
              isLight ? "hover:bg-gray-100/50" : "hover:bg-white/5"
            }`}
            onClick={handleDateClick}
          >
            <div className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-1 ${
              isLight ? "text-gray-500" : "text-white/50"
            }`}>
              <Calendar className="w-3.5 h-3.5 text-sakura-500" />
              <span>到店日期</span>
            </div>
            <div className={`text-lg md:text-xl font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
              {date
                ? new Date(date + "T00:00:00").toLocaleDateString("zh-CN", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })
                : "选择日期"}
            </div>
            <input
              id="hero-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute opacity-0 pointer-events-none"
            />
          </div>
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
        <div className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-3 ${
          isLight ? "text-gray-500" : "text-white/50"
        }`}>
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
