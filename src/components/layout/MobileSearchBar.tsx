"use client";

import { useState } from "react";
import { Search, MapPin, X, Calendar, Users, Minus, Plus } from "lucide-react";
import { useSearchState } from "@/contexts/SearchStateContext";
import type { GuestsDetail } from "@/components/GuestsDropdown";

export default function MobileSearchBar() {
  const { searchState, setLocation, setDate, setGuests, setGuestsDetail } = useSearchState();
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);

  // 本地人数状态（用于模态框内的编辑）
  const [localMen, setLocalMen] = useState(searchState.guestsDetail.men);
  const [localWomen, setLocalWomen] = useState(searchState.guestsDetail.women);
  const [localChildren, setLocalChildren] = useState(searchState.guestsDetail.children);

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
    if (searchState.guests > 0) {
      params.set("guests", searchState.guests.toString());
      params.set("men", searchState.guestsDetail.men.toString());
      params.set("women", searchState.guestsDetail.women.toString());
      params.set("children", searchState.guestsDetail.children.toString());
    }

    const queryString = params.toString();
    window.location.href = queryString ? `/?${queryString}` : '/';
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

    if (searchState.guests > 1) {
      parts.push(`${searchState.guests}位`);
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
    // 同步本地人数状态
    setLocalMen(searchState.guestsDetail.men);
    setLocalWomen(searchState.guestsDetail.women);
    setLocalChildren(searchState.guestsDetail.children);
    setIsMobileModalOpen(true);
  };

  // 更新人数的辅助函数
  const updateGuestsCount = (men: number, women: number, children: number) => {
    const total = men + women + children;
    setGuests(total);
    setGuestsDetail({
      total,
      men,
      women,
      children,
    });
  };

  return (
    <>
      {/* 移动端搜索按钮 - 在 Header 下方显示 */}
      <div className="md:hidden sticky top-16 z-40 bg-white border-b border-gray-200 px-4 py-3">
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
                  onClick={(e) => {
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
                    } catch (error) {
                      input.focus();
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left text-sm text-gray-400 hover:border-sakura-500 hover:bg-sakura-50/30 transition-all"
                >
                  选择日期
                </button>
              )}
            </div>

            {/* 人数 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 text-sakura-500" />
                人数选择
              </label>
              <div className="border border-gray-300 rounded-xl p-4 space-y-4">
                {/* 男士 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">👨 男士</div>
                    <div className="text-xs text-gray-500 mt-0.5">13岁及以上</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (localMen > 0) {
                          const newMen = localMen - 1;
                          setLocalMen(newMen);
                          updateGuestsCount(newMen, localWomen, localChildren);
                        }
                      }}
                      disabled={localMen <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                        hover:border-sakura-500 hover:bg-sakura-50/50
                        active:scale-95
                        transition-all duration-200
                        disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium text-gray-900">
                      {localMen}
                    </span>
                    <button
                      onClick={() => {
                        const newMen = localMen + 1;
                        setLocalMen(newMen);
                        updateGuestsCount(newMen, localWomen, localChildren);
                      }}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                        hover:border-sakura-500 hover:bg-sakura-50/50
                        active:scale-95
                        transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* 女士 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">👩 女士</div>
                    <div className="text-xs text-gray-500 mt-0.5">13岁及以上</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (localWomen > 0) {
                          const newWomen = localWomen - 1;
                          setLocalWomen(newWomen);
                          updateGuestsCount(localMen, newWomen, localChildren);
                        }
                      }}
                      disabled={localWomen <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                        hover:border-sakura-500 hover:bg-sakura-50/50
                        active:scale-95
                        transition-all duration-200
                        disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium text-gray-900">
                      {localWomen}
                    </span>
                    <button
                      onClick={() => {
                        const newWomen = localWomen + 1;
                        setLocalWomen(newWomen);
                        updateGuestsCount(localMen, newWomen, localChildren);
                      }}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                        hover:border-sakura-500 hover:bg-sakura-50/50
                        active:scale-95
                        transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* 儿童 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">👶 儿童</div>
                    <div className="text-xs text-gray-500 mt-0.5">2-12岁</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (localChildren > 0) {
                          const newChildren = localChildren - 1;
                          setLocalChildren(newChildren);
                          updateGuestsCount(localMen, localWomen, newChildren);
                        }
                      }}
                      disabled={localChildren <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                        hover:border-sakura-500 hover:bg-sakura-50/50
                        active:scale-95
                        transition-all duration-200
                        disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium text-gray-900">
                      {localChildren}
                    </span>
                    <button
                      onClick={() => {
                        const newChildren = localChildren + 1;
                        setLocalChildren(newChildren);
                        updateGuestsCount(localMen, localWomen, newChildren);
                      }}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                        hover:border-sakura-500 hover:bg-sakura-50/50
                        active:scale-95
                        transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    💡 至少选择1位客人，最多可预约10位
                  </p>
                </div>
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
              className="w-full bg-sakura-600 hover:bg-sakura-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
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
