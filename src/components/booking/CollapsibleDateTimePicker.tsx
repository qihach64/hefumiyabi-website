"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, ChevronDown } from "lucide-react";
import MiniCalendar from "./MiniCalendar";
import TimeSlotPicker from "./TimeSlotPicker";

interface CollapsibleDateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  dateAutoFilled?: boolean;
}

type ExpandedSection = "date" | "time" | null;

export default function CollapsibleDateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateAutoFilled = false,
}: CollapsibleDateTimePickerProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpandedSection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const weekday = weekdays[d.getDay()];
    return `${month}月${day}日 ${weekday}`;
  };

  // Format time for display
  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return null;
    const [hour] = timeStr.split(":");
    const h = parseInt(hour);
    const period = h < 12 ? "上午" : h === 12 ? "中午" : "下午";
    return `${period} ${timeStr}`;
  };

  const handleDateSelect = (newDate: string) => {
    onDateChange(newDate);
    // Auto advance to time selection if no time selected
    if (!time) {
      setExpandedSection("time");
    } else {
      setExpandedSection(null);
    }
  };

  const handleTimeSelect = (newTime: string) => {
    onTimeChange(newTime);
    setExpandedSection(null);
  };

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div ref={containerRef} className="rounded-xl border border-wabi-200 overflow-hidden hover:border-sakura-300 transition-colors duration-300">
      {/* Date Section */}
      <div className="border-b border-wabi-200">
        {/* Collapsed Header */}
        <button
          type="button"
          onClick={() => toggleSection("date")}
          className={`w-full p-4 flex items-center justify-between transition-colors ${
            expandedSection === "date" ? "bg-sakura-50/50" : "hover:bg-wabi-50/50"
          } ${date && dateAutoFilled ? "bg-green-50/30" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              expandedSection === "date" ? "bg-sakura-100" : "bg-wabi-100"
            }`}>
              <Calendar className={`w-4 h-4 ${
                expandedSection === "date" ? "text-sakura-600" : "text-sakura-500"
              }`} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-gray-500">到店日期</span>
                {date && dateAutoFilled && (
                  <span className="text-[10px] text-green-600 font-medium">✓ 已预填</span>
                )}
              </div>
              <span className={`text-[15px] font-medium ${date ? "text-gray-900" : "text-wabi-400"}`}>
                {formatDateDisplay(date) || "请选择日期"}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-wabi-400 transition-transform duration-200 ${
            expandedSection === "date" ? "rotate-180" : ""
          }`} />
        </button>

        {/* Expanded Calendar */}
        <div className={`overflow-hidden transition-all duration-300 ease-out ${
          expandedSection === "date" ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="px-4 pb-4">
            <MiniCalendar
              value={date}
              onChange={handleDateSelect}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Time Section */}
      <div>
        {/* Collapsed Header */}
        <button
          type="button"
          onClick={() => toggleSection("time")}
          className={`w-full p-4 flex items-center justify-between transition-colors ${
            expandedSection === "time" ? "bg-sakura-50/50" : "hover:bg-wabi-50/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              expandedSection === "time" ? "bg-sakura-100" : "bg-wabi-100"
            }`}>
              <Clock className={`w-4 h-4 ${
                expandedSection === "time" ? "text-sakura-600" : "text-sakura-500"
              }`} />
            </div>
            <div className="text-left">
              <span className="text-[12px] font-medium text-gray-500 block">到店时间</span>
              <span className={`text-[15px] font-medium ${time ? "text-gray-900" : "text-wabi-400"}`}>
                {formatTimeDisplay(time) || "请选择时间"}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-wabi-400 transition-transform duration-200 ${
            expandedSection === "time" ? "rotate-180" : ""
          }`} />
        </button>

        {/* Expanded Time Slots */}
        <div className={`overflow-hidden transition-all duration-300 ease-out ${
          expandedSection === "time" ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="px-4 pb-4">
            <TimeSlotPicker
              value={time}
              onChange={handleTimeSelect}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
