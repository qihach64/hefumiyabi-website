"use client";

import { useState } from "react";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function HeroSearchBar() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");

  const handleSearch = () => {
    // 构建查询参数
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (date) params.set("date", date);
    if (guests) params.set("guests", guests);

    // 跳转到套餐列表页
    router.push(`/plans?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 桌面端：横向展开搜索框 */}
      <div className="hidden md:flex bg-white rounded-full shadow-xl p-2 gap-2 items-center hover:shadow-2xl transition-shadow">
        {/* 目的地 */}
        <div className="flex-1 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            目的地
          </label>
          <input
            type="text"
            placeholder="东京、京都..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
          />
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
        <div className="flex-1 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            人数
          </label>
          <input
            type="number"
            min="1"
            placeholder="几人"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
          />
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

      {/* 移动端：堆叠式搜索框 */}
      <div className="md:hidden bg-white rounded-2xl shadow-xl p-4 space-y-3">
        {/* 目的地 */}
        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
          <MapPin className="w-5 h-5 text-sakura-500 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              目的地
            </label>
            <input
              type="text"
              placeholder="东京、京都..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
            />
          </div>
        </div>

        {/* 日期 */}
        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
          <Calendar className="w-5 h-5 text-sakura-500 flex-shrink-0" />
          <div className="flex-1">
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
        </div>

        {/* 人数 */}
        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
          <Users className="w-5 h-5 text-sakura-500 flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              人数
            </label>
            <input
              type="number"
              min="1"
              placeholder="几人"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
            />
          </div>
        </div>

        {/* 搜索按钮 */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSearch}
          className="w-full flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          搜索和服体验
        </Button>
      </div>
    </div>
  );
}
