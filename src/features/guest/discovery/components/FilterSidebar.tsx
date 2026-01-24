"use client";

import { useMemo, useState } from "react";
import { Filter, MapPin, Store as StoreIcon, X } from "lucide-react";
import type { HomepageStore, HomepageTagCategory } from "@/types/homepage";

interface FilterSidebarProps {
  stores: HomepageStore[];
  tagCategories: HomepageTagCategory[];
  regions: string[];
  selectedStoreId: string | null;
  setSelectedStoreId: (id: string | null) => void;
  selectedRegion: string | null;
  setSelectedRegion: (region: string | null) => void;
  selectedTagIds: string[];
  toggleTag: (tagId: string) => void;
  clearFilters: () => void;
}

export function FilterSidebar({
  stores,
  tagCategories,
  regions,
  selectedStoreId,
  setSelectedStoreId,
  selectedRegion,
  setSelectedRegion,
  selectedTagIds,
  toggleTag,
  clearFilters,
}: FilterSidebarProps) {
  // 分类展开状态
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(tagCategories.map((c) => c.id))
  );
  const [isStoreExpanded, setIsStoreExpanded] = useState(true);
  const [isRegionExpanded, setIsRegionExpanded] = useState(true);

  // 使用 Set 优化 O(1) 查找
  const tagIdSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const hasActiveFilters = !!(
    selectedStoreId ||
    selectedRegion ||
    selectedTagIds.length > 0
  );

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="bg-white rounded-xl border border-wabi-200 p-6 space-y-6">
        {/* 筛选器标题 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-stone-900">
            <Filter className="w-5 h-5 text-stone-500" />
            筛选条件
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-wabi-500 hover:text-sakura-600 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              清除
            </button>
          )}
        </div>

        {/* 店铺筛选 */}
        {stores.length > 0 && (
          <div>
            <button
              onClick={() => setIsStoreExpanded(!isStoreExpanded)}
              className="w-full text-sm font-semibold mb-3 flex items-center justify-between text-stone-700 hover:text-stone-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-sakura-500" />
                <span>选择店铺</span>
                {selectedStoreId && (
                  <span className="text-xs bg-sakura-500 text-white px-2 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </div>
              <span className="text-wabi-400 text-xs">
                {isStoreExpanded ? "▼" : "▶"}
              </span>
            </button>

            {isStoreExpanded && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedStoreId(null)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${
                      !selectedStoreId
                        ? "bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300"
                        : "bg-wabi-100 text-wabi-700 hover:bg-wabi-200"
                    }
                  `}
                >
                  全部店铺
                </button>
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                      ${
                        selectedStoreId === store.id
                          ? "bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300"
                          : "bg-wabi-100 text-wabi-700 hover:bg-wabi-200"
                      }
                    `}
                  >
                    {store.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 地区筛选 */}
        {regions.length > 0 && (
          <div>
            <button
              onClick={() => setIsRegionExpanded(!isRegionExpanded)}
              className="w-full text-sm font-semibold mb-3 flex items-center justify-between text-stone-700 hover:text-stone-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sakura-500" />
                <span>选择地区</span>
                {selectedRegion && (
                  <span className="text-xs bg-sakura-500 text-white px-2 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </div>
              <span className="text-wabi-400 text-xs">
                {isRegionExpanded ? "▼" : "▶"}
              </span>
            </button>

            {isRegionExpanded && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedRegion(null)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${
                      !selectedRegion
                        ? "bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300"
                        : "bg-wabi-100 text-wabi-700 hover:bg-wabi-200"
                    }
                  `}
                >
                  全部地区
                </button>
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                      ${
                        selectedRegion === region
                          ? "bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300"
                          : "bg-wabi-100 text-wabi-700 hover:bg-wabi-200"
                      }
                    `}
                  >
                    {region}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 标签筛选 */}
        {tagCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const selectedCount = category.tags.filter((tag) =>
            tagIdSet.has(tag.id)
          ).length;

          return (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full text-sm font-semibold mb-3 flex items-center justify-between text-stone-700 hover:text-stone-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {category.icon && (
                    <span className="text-base">{category.icon}</span>
                  )}
                  <span>{category.name}</span>
                  {selectedCount > 0 && (
                    <span className="text-xs bg-sakura-500 text-white px-2 py-0.5 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <span className="text-wabi-400 text-xs">
                  {isExpanded ? "▼" : "▶"}
                </span>
              </button>

              {isExpanded && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {category.tags.map((tag) => {
                    const isSelected = tagIdSet.has(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                          ${
                            isSelected
                              ? "bg-sakura-100 text-sakura-700 ring-2 ring-sakura-300"
                              : "bg-wabi-100 text-wabi-700 hover:bg-wabi-200"
                          }
                        `}
                      >
                        {tag.icon && <span className="mr-1">{tag.icon}</span>}
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
