"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin } from "lucide-react";

interface LocationDropdownProps {
  value: string;
  onChange: (location: string) => void;
  onSelect?: (location: string) => void;
  className?: string;
}

export function LocationDropdown({
  value,
  onChange,
  onSelect,
  className = "",
}: LocationDropdownProps) {
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取所有地区数据
  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (data.locations) {
          setAllLocations(data.locations);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch locations:", error);
      });
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 过滤地区
  const handleInputChange = useCallback(
    (inputValue: string) => {
      onChange(inputValue);
      if (inputValue.trim() === "") {
        setFilteredLocations(allLocations.slice(0, 10));
      } else {
        const filtered = allLocations.filter((loc) =>
          loc.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredLocations(filtered.slice(0, 10));
      }
      setIsOpen(true);
    },
    [allLocations, onChange]
  );

  // 聚焦时显示下拉菜单
  const handleFocus = useCallback(() => {
    if (allLocations.length > 0) {
      if (value.trim() === "") {
        setFilteredLocations(allLocations.slice(0, 10));
      } else {
        const filtered = allLocations.filter((loc) =>
          loc.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredLocations(filtered.slice(0, 10));
      }
      setIsOpen(true);
    }
  }, [allLocations, value]);

  // 选择地区
  const handleSelect = useCallback(
    (selectedLocation: string) => {
      onChange(selectedLocation);
      setIsOpen(false);
      onSelect?.(selectedLocation);
    },
    [onChange, onSelect]
  );

  // 获取地区描述
  const getLocationDescription = (loc: string) => {
    if (loc.includes("京都")) return "人气和服体验地";
    if (loc.includes("东京")) return "东京热门区域";
    return "和服租赁店铺";
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 下拉菜单 - Airbnb 风格 */}
      {isOpen && filteredLocations.length > 0 && (
        <div
          className="absolute top-full left-0 mt-4 bg-white rounded-xl overflow-hidden z-[100] min-w-[320px] max-w-[400px]
            shadow-[0_2px_16px_rgba(0,0,0,0.12)]
            border border-gray-100
            animate-spring-in"
        >
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-[12px] font-semibold text-gray-800 uppercase tracking-wide">
              热门目的地
            </h3>
          </div>
          <div className="px-2 pb-2 max-h-[320px] overflow-y-auto">
            {filteredLocations.map((loc, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(loc);
                }}
                className="w-full px-3 py-3 text-left flex items-center gap-3 rounded-lg
                  transition-all duration-200
                  hover:bg-gray-100 active:bg-gray-200
                  group cursor-pointer"
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center
                  group-hover:bg-gray-200 transition-colors duration-200"
                >
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-gray-900">{loc}</div>
                  <div className="text-[12px] text-gray-500 mt-0.5">
                    {getLocationDescription(loc)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        type="hidden"
        data-location-dropdown
        data-open={isOpen}
        onFocus={handleFocus}
      />
    </div>
  );
}

// 导出 hook 供外部使用
export function useLocationDropdown() {
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (data.locations) {
          setAllLocations(data.locations);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch locations:", error);
      });
  }, []);

  const open = useCallback(
    (currentValue: string) => {
      if (allLocations.length > 0) {
        if (currentValue.trim() === "") {
          setFilteredLocations(allLocations.slice(0, 10));
        } else {
          const filtered = allLocations.filter((loc) =>
            loc.toLowerCase().includes(currentValue.toLowerCase())
          );
          setFilteredLocations(filtered.slice(0, 10));
        }
        setIsOpen(true);
      }
    },
    [allLocations]
  );

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const filter = useCallback(
    (inputValue: string) => {
      if (inputValue.trim() === "") {
        setFilteredLocations(allLocations.slice(0, 10));
      } else {
        const filtered = allLocations.filter((loc) =>
          loc.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredLocations(filtered.slice(0, 10));
      }
      setIsOpen(true);
    },
    [allLocations]
  );

  const getLocationDescription = (loc: string) => {
    if (loc.includes("京都")) return "人气和服体验地";
    if (loc.includes("东京")) return "东京热门区域";
    return "和服租赁店铺";
  };

  return {
    allLocations,
    filteredLocations,
    isOpen,
    open,
    close,
    filter,
    getLocationDescription,
  };
}
