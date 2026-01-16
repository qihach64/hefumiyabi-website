"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Minus, Plus } from "lucide-react";

export interface GuestsDetail {
  total: number;
  men: number;
  women: number;
  children: number;
}

interface GuestsDropdownProps {
  value: number;
  onChange: (value: number) => void;
  onDetailChange?: (detail: GuestsDetail) => void;
  initialDetail?: GuestsDetail;
  className?: string;
  dropdownClassName?: string;
}

export function GuestsDropdown({
  value,
  onChange,
  onDetailChange,
  initialDetail,
  className = "",
  dropdownClassName = "",
}: GuestsDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [men, setMen] = useState(initialDetail?.men || 0);
  const [women, setWomen] = useState(initialDetail?.women || 1);
  const [children, setChildren] = useState(initialDetail?.children || 0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // 监听点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 更新总人数
  const updateTotal = (newMen: number, newWomen: number, newChildren: number) => {
    const total = newMen + newWomen + newChildren;
    onChange(total);

    if (onDetailChange) {
      onDetailChange({
        total,
        men: newMen,
        women: newWomen,
        children: newChildren,
      });
    }
  };

  const incrementMen = () => {
    const newMen = men + 1;
    setMen(newMen);
    updateTotal(newMen, women, children);
  };

  const decrementMen = () => {
    if (men > 0) {
      const newMen = men - 1;
      setMen(newMen);
      updateTotal(newMen, women, children);
    }
  };

  const incrementWomen = () => {
    const newWomen = women + 1;
    setWomen(newWomen);
    updateTotal(men, newWomen, children);
  };

  const decrementWomen = () => {
    if (women > 0) {
      const newWomen = women - 1;
      setWomen(newWomen);
      updateTotal(men, newWomen, children);
    }
  };

  const incrementChildren = () => {
    const newChildren = children + 1;
    setChildren(newChildren);
    updateTotal(men, women, newChildren);
  };

  const decrementChildren = () => {
    if (children > 0) {
      const newChildren = children - 1;
      setChildren(newChildren);
      updateTotal(men, women, newChildren);
    }
  };

  const totalGuests = men + women + children;

  return (
    <>
      {/* 触发按钮 */}
      <div
        ref={buttonRef}
        data-guests-trigger
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className={`cursor-pointer ${className}`}
      >
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1 cursor-pointer">
          <Users className="w-4 h-4 text-sakura-500" />
          人数
        </label>
        <div className="text-sm text-gray-900">{totalGuests} 位客人</div>
      </div>

      {/* 下拉面板 */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute top-full mt-3 bg-white rounded-3xl overflow-hidden z-50 w-80 p-5
            shadow-[0_8px_28px_0_rgba(0,0,0,0.12)]
            border border-gray-100/50
            dropdown-scrollbar ${dropdownClassName || "right-0"}`}
          style={{
            animation: "dropdown-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* 男士 */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100/80">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">男士</div>
              <div className="text-xs text-gray-500 mt-0.5">13岁及以上</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrementMen();
                }}
                disabled={men <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                  hover:border-sakura-500 hover:bg-sakura-50/50
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-10 text-center text-sm font-medium text-gray-900">{men}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  incrementMen();
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                  hover:border-sakura-500 hover:bg-sakura-50/50
                  active:scale-95
                  transition-all duration-200"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 女士 */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100/80">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">女士</div>
              <div className="text-xs text-gray-500 mt-0.5">13岁及以上</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrementWomen();
                }}
                disabled={women <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                  hover:border-sakura-500 hover:bg-sakura-50/50
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-10 text-center text-sm font-medium text-gray-900">{women}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  incrementWomen();
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                  hover:border-sakura-500 hover:bg-sakura-50/50
                  active:scale-95
                  transition-all duration-200"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 儿童 */}
          <div className="flex items-center justify-between py-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">儿童</div>
              <div className="text-xs text-gray-500 mt-0.5">2-12岁</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrementChildren();
                }}
                disabled={children <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                  hover:border-sakura-500 hover:bg-sakura-50/50
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-10 text-center text-sm font-medium text-gray-900">{children}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  incrementChildren();
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center
                  hover:border-sakura-500 hover:bg-sakura-50/50
                  active:scale-95
                  transition-all duration-200"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-2 pt-4 border-t border-gray-100/80">
            <p className="text-xs text-gray-500">至少选择1位客人，最多可预约10位</p>
          </div>
        </div>
      )}
    </>
  );
}
