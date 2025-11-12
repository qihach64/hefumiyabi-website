"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HeaderSearchBar() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    // 点击后跳转到首页，让用户使用完整的搜索栏
    router.push('/');
  };

  return (
    <button
      onClick={handleClick}
      className="hidden md:flex items-center gap-3 border border-gray-300 rounded-full px-4 py-2 hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
    >
      <span className="text-sm font-medium text-gray-700">目的地</span>
      <div className="w-px h-6 bg-gray-300"></div>
      <span className="text-sm font-medium text-gray-700">日期</span>
      <div className="w-px h-6 bg-gray-300"></div>
      <span className="text-sm font-medium text-gray-700">人数</span>
      <div className="w-8 h-8 bg-sakura-500 rounded-full flex items-center justify-center ml-2">
        <Search className="w-4 h-4 text-white" />
      </div>
    </button>
  );
}
