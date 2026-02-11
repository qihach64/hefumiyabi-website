"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateDropdownProps {
  value: string;
  onChange: (date: string) => void;
  onSelect?: (date: string) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function DateDropdown({
  value,
  onChange,
  onSelect,
  isOpen,
  onClose,
  className = "",
}: DateDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // 日历数据生成
  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }[] = [];

    // 上个月的天数填充
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: date < new Date(new Date().setHours(0, 0, 0, 0)),
      });
    }

    // 当月的天数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
      });
    }

    // 下个月的天数填充（动态行数，不强制 6 行）
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingDays = totalCells - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
      });
    }

    return {
      year,
      month,
      monthName: calendarMonth.toLocaleDateString("zh-CN", { year: "numeric", month: "long" }),
      days,
    };
  }, [calendarMonth]);

  // 本地日期字符串，避免 toISOString() 的 UTC 时区偏移
  const toLocalDateStr = useCallback(
    (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    []
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
      const dateStr = toLocalDateStr(date);
      onChange(dateStr);
      onClose();
      onSelect?.(dateStr);
    },
    [onChange, onClose, onSelect, toLocalDateStr]
  );

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-4 bg-white rounded-xl overflow-hidden z-[100]
        shadow-[0_2px_16px_rgba(0,0,0,0.12)]
        border border-gray-100
        animate-spring-in
        max-h-[calc(100dvh-200px)] overflow-y-auto
        ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 w-[min(320px,calc(100vw-2rem))]">
        {/* 月份导航 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="上个月"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-[15px] font-semibold text-gray-900">{calendarData.monthName}</h3>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="下个月"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 mb-2">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="text-center text-[12px] font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.days.map((day, index) => {
            const dateStr = toLocalDateStr(day.date);
            const isSelected = value === dateStr;

            return (
              <button
                key={index}
                onClick={() => !day.isPast && day.isCurrentMonth && handleDateSelect(day.date)}
                disabled={day.isPast || !day.isCurrentMonth}
                className={`
                  w-9 h-9 rounded-full text-[13px] font-medium
                  transition-all duration-200
                  flex items-center justify-center
                  ${
                    isSelected
                      ? "bg-sakura-500 text-white"
                      : day.isToday
                        ? "bg-gray-100 text-gray-900 font-semibold"
                        : day.isCurrentMonth && !day.isPast
                          ? "text-gray-900 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
                  }
                `}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>

        {/* 快捷选项 */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => handleDateSelect(new Date())}
            className="flex-1 py-2 text-[13px] font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            今天
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              handleDateSelect(tomorrow);
            }}
            className="flex-1 py-2 text-[13px] font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            明天
          </button>
          <button
            onClick={() => {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              handleDateSelect(nextWeek);
            }}
            className="flex-1 py-2 text-[13px] font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            下周
          </button>
        </div>
      </div>
    </div>
  );
}

// 导出 hook 供外部使用
export function useDateDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
