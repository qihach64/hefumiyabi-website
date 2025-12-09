"use client";

import { useState } from "react";
import { Plus, ChevronDown, Sparkles } from "lucide-react";
import InteractiveKimonoMap from "../InteractiveKimonoMap";
import type { MapData } from "../InteractiveKimonoMap/types";

interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  price: number; // 分为单位
  icon: string;
  popular?: boolean;
}

interface ServiceMapProps {
  includes: string[];
  mapData?: MapData | null;
  // Mock data - 后期对接真实数据
  upgradeOptions?: UpgradeOption[];
}

// 默认升级选项 (Mock)
const DEFAULT_UPGRADES: UpgradeOption[] = [
  {
    id: "photo",
    name: "专业摄影",
    description: "专业摄影师跟拍 30 分钟，含 20 张精修照片",
    price: 300000,
    icon: "📷",
    popular: true,
  },
  {
    id: "makeup",
    name: "专业化妆",
    description: "资深化妆师全脸妆容，含卸妆",
    price: 250000,
    icon: "💄",
  },
  {
    id: "premium-hairstyle",
    name: "高级发型",
    description: "复杂盘发造型，含发饰",
    price: 200000,
    icon: "💇",
  },
  {
    id: "extension",
    name: "延长归还",
    description: "延长 2 小时归还时间",
    price: 100000,
    icon: "⏰",
  },
];

export default function ServiceMap({
  includes,
  mapData,
  upgradeOptions = DEFAULT_UPGRADES,
}: ServiceMapProps) {
  const [expandedUpgrade, setExpandedUpgrade] = useState<string | null>(null);

  // 如果没有 mapData 也没有升级选项，不渲染
  if (!mapData && upgradeOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 区块标题 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-px bg-sakura-300" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-sakura-500 font-medium">
          What's Included
        </span>
      </div>

      {/* 和服配件交互图 + 升级选项 整合容器 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* 和服配件交互图 - 全宽展示，使用水平布局 */}
        {mapData && (
          <div className="p-6 md:p-8">
            <InteractiveKimonoMap mapData={mapData} layout="horizontal" />
          </div>
        )}

        {/* 无 mapData 时的简化视图 */}
        {!mapData && (
          <div className="p-8 text-center bg-gray-50/30">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-sakura-500" />
            </div>
            <h4 className="text-[16px] font-semibold text-gray-900 mb-2">
              精选和服套餐
            </h4>
            <p className="text-[14px] text-gray-500 max-w-md mx-auto">
              我们精心挑选了高品质和服及配件，确保您获得完美的和服体验
            </p>
          </div>
        )}

        {/* 升级选项 - 紧邻热图下方 */}
        {upgradeOptions.length > 0 && (
          <div className="border-t border-gray-200">
            {/* 标题 */}
            <div className="px-6 py-4 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-sakura-500" />
                <div>
                  <h3 className="text-[16px] font-semibold text-gray-900">
                    升级服务
                  </h3>
                  <p className="text-[12px] text-gray-500">
                    可在预订时选择添加
                  </p>
                </div>
              </div>
            </div>

            {/* 升级选项列表 - 更紧凑 */}
            <div className="divide-y divide-gray-100">
              {upgradeOptions.map((option) => {
                const isExpanded = expandedUpgrade === option.id;

                return (
                  <div key={option.id} className="relative">
                    <button
                      onClick={() => setExpandedUpgrade(isExpanded ? null : option.id)}
                      className="w-full px-6 py-3 flex items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
                    >
                      {/* 图标 */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                        {option.icon}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-gray-900">
                            {option.name}
                          </span>
                          {option.popular && (
                            <span className="px-1.5 py-0.5 bg-sakura-100 text-sakura-700 text-[10px] font-semibold rounded">
                              人气
                            </span>
                          )}
                        </div>
                        {!isExpanded && (
                          <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">
                            {option.description}
                          </p>
                        )}
                      </div>

                      {/* 价格 */}
                      <span className="text-[14px] font-bold text-sakura-600 flex-shrink-0">
                        +¥{(option.price / 100).toLocaleString()}
                      </span>

                      {/* 展开指示 */}
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* 展开详情 */}
                    {isExpanded && (
                      <div className="px-6 pb-3 bg-gray-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="pl-13 ml-10">
                          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">
                            {option.description}
                          </p>
                          <button className="px-3 py-1.5 bg-sakura-600 text-white text-[12px] font-semibold rounded-lg hover:bg-sakura-700 transition-colors">
                            添加到预订
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
