"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

export default function MiniCalendar({
  value,
  onChange,
  className = "",
}: MiniCalendarProps) {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    // If value is set, start from that month
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Calendar data generation
  const calendarData = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    // Get first and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week for first day (0=Sunday)
    const startDayOfWeek = firstDay.getDay();

    // Generate calendar grid (42 days = 6 weeks)
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }[] = [];

    // Fill previous month days
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

    // Current month days
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

    // Fill next month days (only complete to 35 or 42 for compact view)
    const totalRows = days.length <= 35 ? 35 : 42;
    const remainingDays = totalRows - days.length;
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
    },
    [onChange, toLocalDateStr]
  );

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Check if prev month button should be disabled
  const isPrevDisabled = useMemo(() => {
    const today = new Date();
    return calendarMonth.getFullYear() === today.getFullYear() &&
           calendarMonth.getMonth() <= today.getMonth();
  }, [calendarMonth]);

  return (
    <div className={`${className}`}>
      {/* Month navigation - Zen style */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-wabi-100"
          aria-label="上个月"
        >
          <ChevronLeft className="w-4 h-4 text-wabi-500" />
        </button>
        <h3 className="text-[13px] font-semibold text-stone-800">{calendarData.monthName}</h3>
        <button
          onClick={handleNextMonth}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-wabi-100"
          aria-label="下个月"
        >
          <ChevronRight className="w-4 h-4 text-wabi-500" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {["日", "一", "二", "三", "四", "五", "六"].map((day, i) => (
          <div
            key={day}
            className={`text-center text-[11px] font-medium py-1.5 ${
              i === 0 || i === 6 ? "text-sakura-400" : "text-wabi-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Date grid - Compact Zen style */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarData.days.map((day, index) => {
          const dateStr = toLocalDateStr(day.date);
          const isSelected = value === dateStr;
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

          return (
            <button
              key={index}
              onClick={() => !day.isPast && day.isCurrentMonth && handleDateSelect(day.date)}
              disabled={day.isPast || !day.isCurrentMonth}
              className={`
                aspect-square rounded-lg text-[13px] font-medium
                transition-all duration-200
                flex items-center justify-center
                ${
                  isSelected
                    ? "bg-sakura-500 text-white shadow-sm"
                    : day.isToday
                      ? "bg-sakura-50 text-sakura-600 ring-1 ring-sakura-200"
                      : day.isCurrentMonth && !day.isPast
                        ? isWeekend
                          ? "text-sakura-500 hover:bg-sakura-50"
                          : "text-stone-700 hover:bg-wabi-100"
                        : "text-wabi-200 cursor-not-allowed"
                }
              `}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Quick select - Zen style */}
      <div className="mt-3 pt-3 border-t border-wabi-100 flex gap-2">
        <button
          onClick={() => handleDateSelect(new Date())}
          className="flex-1 py-1.5 text-[12px] font-medium text-wabi-600 bg-wabi-50 rounded-lg hover:bg-wabi-100 hover:text-sakura-600 transition-colors"
        >
          今天
        </button>
        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            handleDateSelect(tomorrow);
          }}
          className="flex-1 py-1.5 text-[12px] font-medium text-wabi-600 bg-wabi-50 rounded-lg hover:bg-wabi-100 hover:text-sakura-600 transition-colors"
        >
          明天
        </button>
        <button
          onClick={() => {
            const nextWeekend = new Date();
            const daysUntilSaturday = (6 - nextWeekend.getDay() + 7) % 7 || 7;
            nextWeekend.setDate(nextWeekend.getDate() + daysUntilSaturday);
            handleDateSelect(nextWeekend);
          }}
          className="flex-1 py-1.5 text-[12px] font-medium text-wabi-600 bg-wabi-50 rounded-lg hover:bg-wabi-100 hover:text-sakura-600 transition-colors"
        >
          周末
        </button>
      </div>
    </div>
  );
}
