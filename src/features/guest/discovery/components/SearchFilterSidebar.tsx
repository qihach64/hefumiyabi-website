"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X, RotateCcw } from "lucide-react";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface TagCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  tags: Tag[];
}

interface SearchFilterSidebarProps {
  categories: TagCategory[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  maxPrice: number;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onReset: () => void;
}

// 标签分类优先级配置
const CATEGORY_PRIORITY: Record<string, number> = {
  audience: 1,
  scene: 1,
  style: 2,
  service: 2,
  service_level: 2,
  season: 3,
  location: 3,
  certification: 3,
};

export function SearchFilterSidebar({
  categories,
  selectedTags,
  onTagsChange,
  priceRange,
  onPriceChange,
  maxPrice,
  sortBy,
  onSortChange,
  onReset,
}: SearchFilterSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initialExpanded = new Set<string>();
    categories.forEach((cat) => {
      const priority = CATEGORY_PRIORITY[cat.code] || 3;
      if (priority === 1) {
        initialExpanded.add(cat.id);
      }
    });
    setExpandedCategories(initialExpanded);
  }, [categories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleTag = (tagCode: string) => {
    if (selectedTags.includes(tagCode)) {
      onTagsChange(selectedTags.filter((t) => t !== tagCode));
    } else {
      onTagsChange([...selectedTags, tagCode]);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const priorityA = CATEGORY_PRIORITY[a.code] || 99;
    const priorityB = CATEGORY_PRIORITY[b.code] || 99;
    return priorityA - priorityB;
  });

  const activeFiltersCount =
    selectedTags.length + (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">筛选条件</h3>
        {activeFiltersCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-sakura-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {/* 排序选项 */}
        <div className="px-5 py-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">排序方式</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "recommended", label: "推荐" },
              { value: "price_asc", label: "价格低到高" },
              { value: "price_desc", label: "价格高到低" },
              { value: "rating", label: "评分最高" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
                  sortBy === option.value
                    ? "bg-sakura-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 价格区间 */}
        <div className="px-5 py-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">价格区间</h4>
          <PriceRangeSlider
            min={0}
            max={maxPrice}
            value={priceRange}
            onChange={onPriceChange}
          />
        </div>

        {/* 标签分类 */}
        {sortedCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const selectedInCategory = category.tags.filter((t) =>
            selectedTags.includes(t.code)
          ).length;

          return (
            <div key={category.id} className="px-5 py-4">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-base">{category.icon}</span>}
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  {selectedInCategory > 0 && (
                    <span className="bg-sakura-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {selectedInCategory}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {category.tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.code);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.code)}
                        className={`
                          px-3 py-1.5 rounded-full text-sm transition-all
                          flex items-center gap-1.5
                          ${
                            isSelected
                              ? "bg-sakura-500 text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }
                        `}
                      >
                        {tag.icon && <span>{tag.icon}</span>}
                        {tag.name}
                        {isSelected && <X className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 已选标签摘要 */}
      {selectedTags.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">已选 {selectedTags.length} 个条件</span>
            <button
              onClick={() => onTagsChange([])}
              className="text-xs text-sakura-600 hover:text-sakura-700"
            >
              清空标签
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tagCode) => {
              const tag = categories.flatMap((c) => c.tags).find((t) => t.code === tagCode);
              if (!tag) return null;
              return (
                <span
                  key={tagCode}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-gray-700 border border-gray-200"
                >
                  {tag.icon && <span>{tag.icon}</span>}
                  {tag.name}
                  <button onClick={() => toggleTag(tagCode)} className="hover:text-sakura-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 价格区间滑块组件
function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (newMin: number) => {
    const clamped = Math.min(newMin, localValue[1] - 100);
    setLocalValue([Math.max(min, clamped), localValue[1]]);
  };

  const handleMaxChange = (newMax: number) => {
    const clamped = Math.max(newMax, localValue[0] + 100);
    setLocalValue([localValue[0], Math.min(max, clamped)]);
  };

  const handleCommit = () => {
    onChange(localValue);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000) {
      return `¥${(price / 10000).toFixed(1)}万`;
    }
    return `¥${price.toLocaleString()}`;
  };

  const minPercent = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-900 font-medium">{formatPrice(localValue[0])}</span>
        <span className="text-gray-400">—</span>
        <span className="text-gray-900 font-medium">
          {localValue[1] >= max ? `${formatPrice(max)}+` : formatPrice(localValue[1])}
        </span>
      </div>

      <div className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-full bg-sakura-500 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={localValue[0]}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute w-full h-full appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-sakura-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-sakura-500
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />

        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={localValue[1]}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute w-full h-full appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-sakura-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-sakura-500
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "¥0-500", range: [0, 500] as [number, number] },
          { label: "¥500-1000", range: [500, 1000] as [number, number] },
          { label: "¥1000-3000", range: [1000, 3000] as [number, number] },
          { label: "¥3000+", range: [3000, max] as [number, number] },
        ].map((option) => {
          const isActive =
            localValue[0] === option.range[0] && localValue[1] === option.range[1];
          return (
            <button
              key={option.label}
              onClick={() => {
                setLocalValue(option.range);
                onChange(option.range);
              }}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                isActive
                  ? "bg-sakura-100 text-sakura-700 border border-sakura-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
