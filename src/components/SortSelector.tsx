"use client";

interface SortSelectorProps {
  defaultSort?: string;
}

export default function SortSelector({ defaultSort = "recommended" }: SortSelectorProps) {
  const handleSortChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value === "recommended") {
      url.searchParams.delete("sort");
    } else {
      url.searchParams.set("sort", value);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-600">
        排序:
      </label>
      <select
        id="sort"
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 transition-colors cursor-pointer"
        defaultValue={defaultSort}
        onChange={(e) => handleSortChange(e.target.value)}
      >
        <option value="recommended">推荐排序</option>
        <option value="price_asc">价格从低到高</option>
        <option value="price_desc">价格从高到低</option>
      </select>
    </div>
  );
}
