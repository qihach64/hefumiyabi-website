"use client";

import { useSearchState } from "@/shared/hooks";

export function SortSelector() {
  const { sort, setSort } = useSearchState();

  const handleSortChange = async (value: string) => {
    await setSort(value === "recommended" ? null : value);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-600">
        排序:
      </label>
      <select
        id="sort"
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 transition-colors cursor-pointer"
        value={sort || "recommended"}
        onChange={(e) => handleSortChange(e.target.value)}
      >
        <option value="recommended">推荐排序</option>
        <option value="price_asc">价格从低到高</option>
        <option value="price_desc">价格从高到低</option>
      </select>
    </div>
  );
}
