"use client";

import { cn } from "@/lib/utils";
import { useSearchState } from "@/shared/hooks";

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

export function CategoryFilter() {
  const { category, setCategory } = useSearchState();

  const handleCategoryClick = async (value: string) => {
    await setCategory(value || null);
  };

  const selectedId = categories.find((c) => c.value === category)?.id || "all";

  return (
    <div className="border-b bg-white sticky top-16 z-40 shadow-sm">
      <div className="container">
        <div className="flex items-center gap-6 overflow-x-auto py-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.value)}
              className={cn(
                "flex flex-col items-center gap-2 min-w-fit transition-all group",
                "hover:text-sakura-600",
                selectedId === cat.id ? "text-sakura-600" : "text-gray-600"
              )}
            >
              <div
                className={cn(
                  "text-2xl transition-transform group-hover:scale-110",
                  selectedId === cat.id && "scale-110"
                )}
              >
                {cat.icon}
              </div>
              <span className="text-xs font-medium whitespace-nowrap">{cat.label}</span>
              <div
                className={cn(
                  "h-0.5 w-full bg-sakura-600 rounded-full transition-all",
                  selectedId === cat.id ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
