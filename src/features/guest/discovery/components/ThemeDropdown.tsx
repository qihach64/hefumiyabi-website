"use client";

import { useState, useEffect, useRef } from "react";
import { Palette, ChevronDown, X } from "lucide-react";
import type { Theme } from "@/types";

interface ThemeDropdownProps {
  value: Theme | null;
  onChange: (theme: Theme | null) => void;
}

export function ThemeDropdown({ value, onChange }: ThemeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/themes")
      .then((res) => res.json())
      .then((data) => {
        setThemes(data.themes || []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch themes:", error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (theme: Theme) => {
    onChange(theme);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div data-theme-trigger onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1 cursor-pointer">
          <Palette className="w-4 h-4 text-sakura-500" />
          主题
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${value ? "text-gray-900" : "text-gray-400"}`}>
            {value ? (
              <span className="flex items-center gap-1.5">
                {value.icon && <span>{value.icon}</span>}
                {value.name}
              </span>
            ) : (
              "选择主题"
            )}
          </span>
          {value ? (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="清空主题"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-3 bg-white rounded-2xl overflow-hidden z-50
            shadow-[0_8px_28px_0_rgba(0,0,0,0.12)]
            border border-gray-100/50
            p-3 min-w-[280px]"
          style={{
            animation: "dropdown-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {isLoading ? (
            <div className="px-2 py-3 text-sm text-gray-500 text-center">加载中...</div>
          ) : themes.length === 0 ? (
            <div className="px-2 py-3 text-sm text-gray-500 text-center">暂无主题</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => {
                const isSelected = value?.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelect(theme)}
                    className={`
                      px-3 py-2 rounded-full text-sm font-medium
                      transition-all duration-300 ease-out
                      flex items-center gap-1.5
                      ${
                        isSelected
                          ? "bg-sakura-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102 active:scale-98"
                      }
                    `}
                  >
                    <span className="text-base">{theme.icon || "🎨"}</span>
                    <span>{theme.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
