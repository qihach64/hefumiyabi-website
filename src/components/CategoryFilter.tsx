"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  icon: string;
  label: string;
  value: string;
}

const categories: Category[] = [
  { id: "all", icon: "🌸", label: "全部", value: "" },
  { id: "ladies", icon: "👩", label: "女士", value: "LADIES" },
  { id: "mens", icon: "👨", label: "男士", value: "MENS" },
  { id: "couple", icon: "💑", label: "情侣", value: "COUPLE" },
  { id: "family", icon: "👨‍👩‍👧‍👦", label: "亲子", value: "FAMILY" },
  { id: "group", icon: "👥", label: "团体", value: "GROUP" },
  { id: "special", icon: "✨", label: "特别", value: "SPECIAL" },
  { id: "ai-tryon", icon: "🤖", label: "AI试穿", value: "AI_TRYON" },
];

export default function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleCategoryClick = (categoryId: string, value: string) => {
    setSelectedCategory(categoryId);

    // 更新 URL 参数（客户端路由）
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set("category", value);
    } else {
      url.searchParams.delete("category");
    }
    window.history.pushState({}, "", url);

    // 触发页面重新加载或筛选逻辑
    // 这里简化处理，实际可以用 React Query 或 SWR
    window.location.href = url.toString();
  };

  return (
    <div className="border-b bg-white sticky top-16 z-40 shadow-sm">
      <div className="container">
        <div className="flex items-center gap-6 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id, category.value)}
              className={cn(
                "flex flex-col items-center gap-2 min-w-fit transition-all group",
                "hover:text-sakura-600",
                selectedCategory === category.id
                  ? "text-sakura-600"
                  : "text-gray-600"
              )}
            >
              {/* 图标 */}
              <div
                className={cn(
                  "text-2xl transition-transform group-hover:scale-110",
                  selectedCategory === category.id && "scale-110"
                )}
              >
                {category.icon}
              </div>

              {/* 标签 */}
              <span className="text-xs font-medium whitespace-nowrap">
                {category.label}
              </span>

              {/* 底部指示器 */}
              <div
                className={cn(
                  "h-0.5 w-full bg-sakura-600 rounded-full transition-all",
                  selectedCategory === category.id
                    ? "opacity-100"
                    : "opacity-0"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
