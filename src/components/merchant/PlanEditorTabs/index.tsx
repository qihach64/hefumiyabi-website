"use client";

import { FileText, CircleDollarSign, Puzzle, Tags, Settings } from "lucide-react";

export type TabId = "basic" | "pricing" | "components" | "tags" | "advanced";

export interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

export const TABS: TabItem[] = [
  { id: "basic", label: "基本信息", icon: <FileText className="w-4 h-4" /> },
  { id: "pricing", label: "价格设置", icon: <CircleDollarSign className="w-4 h-4" /> },
  { id: "components", label: "服务组件", icon: <Puzzle className="w-4 h-4" /> },
  { id: "tags", label: "分类标签", icon: <Tags className="w-4 h-4" /> },
  { id: "advanced", label: "高级设置", icon: <Settings className="w-4 h-4" /> },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabErrors?: Partial<Record<TabId, boolean>>;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  tabErrors = {},
}: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-1 px-2" aria-label="Tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const hasError = tabErrors[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                transition-all duration-200 rounded-t-lg
                ${
                  isActive
                    ? "text-[#8B4513] bg-white border-t border-l border-r border-gray-200 -mb-px"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <span
                className={`
                  transition-colors
                  ${isActive ? "text-[#D4A5A5]" : "text-gray-400 group-hover:text-gray-500"}
                `}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>

              {/* 错误指示器 */}
              {hasError && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}

              {/* 激活状态下划线 */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#D4A5A5] to-[#E8B4B8]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
