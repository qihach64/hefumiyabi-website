"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Calendar, Users, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import GuestsDropdown, { GuestsDetail } from "@/components/GuestsDropdown";

export default function HeroSearchBar() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [guestsDetail, setGuestsDetail] = useState<GuestsDetail>({
    total: 1,
    men: 0,
    women: 1,
    children: 0,
  });
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // 自动补全相关状态
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
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
      setFilteredLocations(allLocations.slice(0, 10)); // 显示前10个
    } else {
      const filtered = allLocations.filter((loc) =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered.slice(0, 10)); // 最多显示10个匹配结果
    }
    setShowDropdown(true);
  };

  // 选择地区
  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setShowDropdown(false);
  };

  // 聚焦时显示下拉菜单
  const handleLocationFocus = () => {
    if (allLocations.length > 0) {
      if (location.trim() === '') {
        setFilteredLocations(allLocations.slice(0, 10));
      } else {
        const filtered = allLocations.filter((loc) =>
          loc.toLowerCase().includes(location.toLowerCase())
        );
        setFilteredLocations(filtered.slice(0, 10));
      }
      setShowDropdown(true);
    }
  };

  const handleSearch = () => {
    // 构建查询参数
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (date) params.set("date", date);
    if (guests > 0) {
      params.set("guests", guests.toString());
      // 传递详细的性别和年龄信息
      params.set("men", guestsDetail.men.toString());
      params.set("women", guestsDetail.women.toString());
      params.set("children", guestsDetail.children.toString());
    }

    // 跳转到套餐列表页
    router.push(`/plans?${params.toString()}`);
    setMobileExpanded(false); // 关闭移动端展开状态
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 桌面端：横向展开搜索框 */}
      <div className="hidden md:flex bg-white rounded-full shadow-xl p-2 gap-2 items-center hover:shadow-2xl transition-shadow">
        {/* 目的地 */}
        <div className="flex-1 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors cursor-pointer relative">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            目的地
          </label>
          <input
            ref={locationInputRef}
            type="text"
            placeholder="东京、京都..."
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            onFocus={handleLocationFocus}
            className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
          />

          {/* 下拉菜单 */}
          {showDropdown && filteredLocations.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-80 overflow-y-auto"
            >
              {filteredLocations.map((loc, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(loc)}
                  className="w-full px-6 py-3 text-left text-sm text-gray-900 hover:bg-sakura-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                >
                  <MapPin className="w-4 h-4 text-sakura-500 flex-shrink-0" />
                  <span>{loc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 分隔线 */}
        <div className="h-8 w-px bg-gray-200"></div>

        {/* 日期 */}
        <div className="flex-1 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            到店日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
          />
        </div>

        {/* 分隔线 */}
        <div className="h-8 w-px bg-gray-200"></div>

        {/* 人数 */}
        <div className="flex-1 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors">
          <GuestsDropdown value={guests} onChange={setGuests} onDetailChange={setGuestsDetail} />
        </div>

        {/* 搜索按钮 */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSearch}
          className="rounded-full px-8 flex items-center gap-2 shadow-md"
        >
          <Search className="w-5 h-5" />
          搜索
        </Button>
      </div>

      {/* 移动端：紧凑搜索按钮 */}
      <div className="md:hidden">
        {!mobileExpanded ? (
          // 紧凑搜索按钮
          <button
            onClick={() => setMobileExpanded(true)}
            className="w-full bg-white rounded-full shadow-lg p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-gray-900">搜索和服体验</div>
              <div className="text-xs text-gray-500">目的地 • 日期 • 人数</div>
            </div>
          </button>
        ) : (
          // 展开的搜索表单
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
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl focus-within:border-sakura-500 transition-colors">
                <MapPin className="w-5 h-5 text-sakura-500 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">
                    目的地
                  </label>
                  <input
                    type="text"
                    placeholder="东京、京都..."
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onFocus={handleLocationFocus}
                    className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
                  />
                </div>
              </div>

              {/* 下拉菜单 */}
              {showDropdown && filteredLocations.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-60 overflow-y-auto">
                  {filteredLocations.map((loc, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(loc)}
                      className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-sakura-50 active:bg-sakura-100 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 text-sakura-500 flex-shrink-0" />
                      <span>{loc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 日期 */}
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl focus-within:border-sakura-500 transition-colors">
              <Calendar className="w-5 h-5 text-sakura-500 flex-shrink-0" />
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-0.5">
                  到店日期
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
                />
              </div>
            </div>

            {/* 人数 */}
            <div className="p-4 border border-gray-200 rounded-xl hover:border-sakura-500 transition-colors">
              <GuestsDropdown value={guests} onChange={setGuests} onDetailChange={setGuestsDetail} />
            </div>

            {/* 搜索按钮 */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              <Search className="w-4 h-4" />
              搜索
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
