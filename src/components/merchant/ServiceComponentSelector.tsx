"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

interface ServiceComponent {
  id: string;
  code: string;
  name: string;
  nameJa: string | null;
  nameEn: string | null;
  description: string | null;
  type: string;
  icon: string | null;
  isBaseComponent: boolean;
  basePrice: number;
  highlights: string[];
}

interface ComponentCategory {
  type: string;
  label: string;
  icon: string;
  components: ServiceComponent[];
}

interface ServiceComponentSelectorProps {
  selectedComponentIds: string[];
  onChange: (componentIds: string[]) => void;
  className?: string;
}

export default function ServiceComponentSelector({
  selectedComponentIds,
  onChange,
  className = "",
}: ServiceComponentSelectorProps) {
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 加载服务组件
  useEffect(() => {
    async function fetchComponents() {
      try {
        const response = await fetch("/api/service-components");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);

          // 自动展开包含已选组件的分类
          const categoriesToExpand = (data.categories || [])
            .filter((cat: ComponentCategory) =>
              cat.components.some((c) => selectedComponentIds.includes(c.id))
            )
            .map((c: ComponentCategory) => c.type);
          setExpandedCategories(new Set(categoriesToExpand));
        }
      } catch (error) {
        console.error("Failed to fetch service components:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchComponents();
  }, [selectedComponentIds]);

  const toggleCategory = (type: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const toggleComponent = (componentId: string) => {
    const newSelection = selectedComponentIds.includes(componentId)
      ? selectedComponentIds.filter((id) => id !== componentId)
      : [...selectedComponentIds, componentId];
    onChange(newSelection);
  };

  const selectAllInCategory = (components: ServiceComponent[]) => {
    const categoryIds = components.map((c) => c.id);
    const allSelected = categoryIds.every((id) => selectedComponentIds.includes(id));

    if (allSelected) {
      // 取消全选
      onChange(selectedComponentIds.filter((id) => !categoryIds.includes(id)));
    } else {
      // 全选
      const newIds = new Set([...selectedComponentIds, ...categoryIds]);
      onChange(Array.from(newIds));
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">套餐包含内容</h2>
        <div className="text-center py-8 text-gray-500">加载服务组件中...</div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">套餐包含内容</h2>
        <div className="text-center py-8 text-gray-500">
          <p>暂无可用服务组件</p>
          <p className="text-sm mt-2">请联系管理员添加</p>
        </div>
      </div>
    );
  }

  // 获取所有已选组件的详情
  const selectedComponents = categories
    .flatMap((cat) => cat.components)
    .filter((c) => selectedComponentIds.includes(c.id));

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-2">套餐包含内容</h2>
      <p className="text-sm text-gray-600 mb-6">
        选择此套餐包含的服务和配件，已选择 {selectedComponentIds.length} 项
      </p>

      {/* 已选组件预览 */}
      {selectedComponents.length > 0 && (
        <div className="mb-6 p-4 bg-sakura-50 rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-3">已选择的服务：</p>
          <div className="flex flex-wrap gap-2">
            {selectedComponents.map((component) => (
              <span
                key={component.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm text-gray-700 border border-sakura-200"
              >
                {component.icon && <span>{component.icon}</span>}
                {component.name}
                <button
                  type="button"
                  onClick={() => toggleComponent(component.id)}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 分类选择器 */}
      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.type);
          const selectedCount = category.components.filter((c) =>
            selectedComponentIds.includes(c.id)
          ).length;
          const allSelected = selectedCount === category.components.length;

          return (
            <div
              key={category.type}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* 分类标题 */}
              <button
                type="button"
                onClick={() => toggleCategory(category.type)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{category.label}</p>
                    <p className="text-xs text-gray-600">
                      {category.components.length} 项可选
                      {selectedCount > 0 && (
                        <span className="text-sakura-600 font-medium">
                          {" "}· 已选 {selectedCount} 项
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* 组件列表 */}
              {isExpanded && (
                <div className="p-4 bg-white">
                  {/* 全选按钮 */}
                  <button
                    type="button"
                    onClick={() => selectAllInCategory(category.components)}
                    className="mb-3 text-sm text-sakura-600 hover:text-sakura-700 font-medium"
                  >
                    {allSelected ? "取消全选" : "全选此分类"}
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {category.components.map((component) => {
                      const isSelected = selectedComponentIds.includes(component.id);
                      return (
                        <button
                          key={component.id}
                          type="button"
                          onClick={() => toggleComponent(component.id)}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-sakura-500 bg-sakura-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          {/* 选中指示器 */}
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-sakura-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}

                          <div className="flex items-start gap-3">
                            {component.icon && (
                              <span className="text-2xl flex-shrink-0">{component.icon}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium ${
                                  isSelected ? "text-sakura-700" : "text-gray-900"
                                }`}
                              >
                                {component.name}
                              </p>
                              {component.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {component.description}
                                </p>
                              )}
                              {component.basePrice > 0 && (
                                <p className="text-xs text-gray-400 mt-1">
                                  单独购买 ¥{(component.basePrice / 100).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
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
  );
}
