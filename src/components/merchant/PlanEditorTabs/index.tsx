"use client";

import { FileText, CircleDollarSign, Puzzle, Tags, Settings, Eye } from "lucide-react";

export type TabId = "basic" | "pricing" | "components" | "tags" | "advanced" | "preview";

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
  { id: "preview", label: "预览", icon: <Eye className="w-4 h-4" /> },
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
    <nav className="flex gap-1" aria-label="Tabs">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const hasError = tabErrors[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group relative flex items-center gap-1.5 px-3 lg:px-4 py-3
              text-[13px] lg:text-[14px] font-medium transition-all duration-300
              ${
                isActive
                  ? "text-sakura-700 border-b-2 border-sakura-500"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              }
            `}
          >
            <span
              className={`
                transition-colors duration-300
                ${isActive ? "text-sakura-500" : "text-gray-400 group-hover:text-gray-500"}
              `}
            >
              {tab.icon}
            </span>
            <span className="hidden sm:inline">{tab.label}</span>

            {/* 错误指示器 */}
            {hasError && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
