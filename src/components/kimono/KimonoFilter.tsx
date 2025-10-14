"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const categories = [
  { value: "", label: "全部" },
  { value: "WOMEN", label: "女士" },
  { value: "MEN", label: "男士" },
  { value: "CHILDREN", label: "儿童" },
];

const styles = [
  "振袖",
  "访问着",
  "留袖",
  "小纹",
  "付下",
  "羽织",
  "黒紋付",
  "袴",
  "儿童着物",
];

const colors = [
  "粉色",
  "红色",
  "紫色",
  "蓝色",
  "绿色",
  "黑色",
  "白色",
  "金色",
];

export default function KimonoFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [selectedStyle, setSelectedStyle] = useState(
    searchParams.get("style") || ""
  );
  const [selectedColor, setSelectedColor] = useState(
    searchParams.get("color") || ""
  );
  const [availableOnly, setAvailableOnly] = useState(
    searchParams.get("isAvailable") === "true"
  );

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedStyle) params.set("style", selectedStyle);
    if (selectedColor) params.set("color", selectedColor);
    if (availableOnly) params.set("isAvailable", "true");

    router.push(`/kimonos?${params.toString()}`);
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedStyle("");
    setSelectedColor("");
    setAvailableOnly(false);
    router.push("/kimonos");
  };

  return (
    <div className="bg-card rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">筛选条件</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          重置
        </button>
      </div>

      {/* 分类 */}
      <div>
        <label className="block text-sm font-medium mb-2">分类</label>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.value} className="flex items-center">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={selectedCategory === cat.value}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 风格 */}
      <div>
        <label className="block text-sm font-medium mb-2">风格</label>
        <select
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部风格</option>
          {styles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      {/* 颜色 */}
      <div>
        <label className="block text-sm font-medium mb-2">颜色</label>
        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">全部颜色</option>
          {colors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>

      {/* 仅显示可租赁 */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">仅显示可租赁</span>
        </label>
      </div>

      {/* 应用按钮 */}
      <button
        onClick={applyFilters}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
      >
        应用筛选
      </button>
    </div>
  );
}
