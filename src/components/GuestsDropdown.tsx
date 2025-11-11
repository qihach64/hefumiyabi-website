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
  className?: string;
}

export default function GuestsDropdown({ value, onChange, onDetailChange, className = "" }: GuestsDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [men, setMen] = useState(0);
  const [women, setWomen] = useState(1);
  const [children, setChildren] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // 从 value 初始化人数
  useEffect(() => {
    if (value > 0) {
      // 简单策略：默认假设是女士
      setWomen(value);
      setMen(0);
      setChildren(0);
    }
  }, []);

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 更新总人数
  const updateTotal = (newMen: number, newWomen: number, newChildren: number) => {
    const total = newMen + newWomen + newChildren;
    onChange(total);

    // 传递详细信息
    if (onDetailChange) {
      onDetailChange({
        total,
        men: newMen,
        women: newWomen,
        children: newChildren,
      });
    }
  };

  // 男士
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

  // 女士
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

  // 儿童
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
  const hasGuests = totalGuests > 0;

  return (
    <div className={`relative ${className}`}>
      {/* 触发按钮 */}
      <div
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="cursor-pointer"
      >
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
          <Users className="w-4 h-4 text-sakura-500" />
          人数
        </label>
        <div className="text-sm text-gray-900">
          {totalGuests} 位客人
        </div>
      </div>

      {/* 下拉面板 - Airbnb 风格 */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 w-80 p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* 男士 */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">👨 男士</div>
              <div className="text-xs text-gray-500 mt-0.5">13岁及以上</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={decrementMen}
                disabled={men <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-gray-900">
                {men}
              </span>
              <button
                onClick={incrementMen}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 女士 */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">👩 女士</div>
              <div className="text-xs text-gray-500 mt-0.5">13岁及以上</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={decrementWomen}
                disabled={women <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-gray-900">
                {women}
              </span>
              <button
                onClick={incrementWomen}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 儿童 */}
          <div className="flex items-center justify-between py-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">👶 儿童</div>
              <div className="text-xs text-gray-500 mt-0.5">2-12岁</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={decrementChildren}
                disabled={children <= 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-8 text-center text-sm font-medium text-gray-900">
                {children}
              </span>
              <button
                onClick={incrementChildren}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-2 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              至少选择1位客人，最多可预约10位
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
