"use client";

import { useState, useEffect } from "react";
import { PlanFormData } from "@/store/planDraft";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { getThemeIcon } from "@/lib/themeIcons";

interface Tag {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  categoryId: string;
}

interface TagCategory {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  tags: Tag[];
}

interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
}

// 分类中文名映射
const CATEGORY_NAMES: Record<string, string> = {
  LADIES: "女士套餐",
  MENS: "男士套餐",
  COUPLE: "情侣套餐",
  FAMILY: "家庭套餐",
  GROUP: "团体套餐",
  SPECIAL: "特色套餐",
};

interface CategoryTagsTabProps {
  formData: PlanFormData;
  onFormChange: <K extends keyof PlanFormData>(field: K, value: PlanFormData[K]) => void;
}

export default function CategoryTagsTab({
  formData,
  onFormChange,
}: CategoryTagsTabProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // 加载主题和标签
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [themesRes, tagsRes] = await Promise.all([
          fetch("/api/themes"),
          fetch("/api/tags/categories"),
        ]);

        if (themesRes.ok) {
          const themesData = await themesRes.json();
          setThemes(themesData.themes || []);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTagCategories(tagsData.categories || []);
          // 默认展开第一个分类
          if (tagsData.categories?.length > 0) {
            setExpandedCategories(new Set([tagsData.categories[0].id]));
          }
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const toggleTag = (tagId: string) => {
    const newTagIds = formData.selectedTagIds.includes(tagId)
      ? formData.selectedTagIds.filter((id) => id !== tagId)
      : [...formData.selectedTagIds, tagId];
    onFormChange("selectedTagIds", newTagIds);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A5A5]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 套餐分类（只读） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          套餐分类
          <span className="text-gray-400 text-xs ml-2">创建后不可修改</span>
        </label>
        <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600">
          {CATEGORY_NAMES[formData.category] || formData.category || "未设置"}
        </div>
      </div>

      {/* 套餐主题 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">套餐主题</label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((theme) => {
            const isSelected = formData.themeId === theme.id;
            const ThemeIcon = getThemeIcon(theme.icon);

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onFormChange("themeId", isSelected ? null : theme.id)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${
                    isSelected
                      ? "border-[#D4A5A5] bg-[#FDFBF7]"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }
                `}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: theme.color ? `${theme.color}20` : "#f3f4f6" }}
                >
                  <ThemeIcon
                    className="w-5 h-5"
                    style={{ color: theme.color || "#6b7280" }}
                  />
                </div>
                <span
                  className={`text-sm font-medium ${
                    isSelected ? "text-[#8B4513]" : "text-gray-700"
                  }`}
                >
                  {theme.name}
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#D4A5A5] absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 分隔线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* 套餐标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          套餐标签
          <span className="text-gray-400 text-xs ml-2">
            已选 {formData.selectedTagIds.length} 个
          </span>
        </label>

        <div className="space-y-3">
          {tagCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const selectedCount = category.tags.filter((tag) =>
              formData.selectedTagIds.includes(tag.id)
            ).length;

            return (
              <div
                key={category.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* 分类标题 */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon || "🏷️"}</span>
                    <span className="font-medium text-gray-700">{category.name}</span>
                    {selectedCount > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-[#D4A5A5] text-white rounded-full">
                        {selectedCount}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* 标签列表 */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="flex flex-wrap gap-2">
                      {category.tags.map((tag) => {
                        const isSelected = formData.selectedTagIds.includes(tag.id);

                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`
                              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                              border transition-all
                              ${
                                isSelected
                                  ? "border-[#D4A5A5] bg-[#FDFBF7] text-[#8B4513]"
                                  : "border-gray-200 hover:border-gray-300 text-gray-600"
                              }
                            `}
                          >
                            {tag.icon && <span>{tag.icon}</span>}
                            <span>{tag.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
