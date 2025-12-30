"use client";

import { useMemo } from "react";

interface TimeSlot {
  value: string;
  label: string;
  period: "morning" | "noon" | "afternoon";
}

interface TimeSlotPickerProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
}

// Time slots data
const TIME_SLOTS: TimeSlot[] = [
  { value: "09:00", label: "9:00", period: "morning" },
  { value: "09:30", label: "9:30", period: "morning" },
  { value: "10:00", label: "10:00", period: "morning" },
  { value: "10:30", label: "10:30", period: "morning" },
  { value: "11:00", label: "11:00", period: "morning" },
  { value: "11:30", label: "11:30", period: "morning" },
  { value: "12:00", label: "12:00", period: "noon" },
  { value: "13:00", label: "13:00", period: "afternoon" },
  { value: "13:30", label: "13:30", period: "afternoon" },
  { value: "14:00", label: "14:00", period: "afternoon" },
  { value: "14:30", label: "14:30", period: "afternoon" },
  { value: "15:00", label: "15:00", period: "afternoon" },
  { value: "15:30", label: "15:30", period: "afternoon" },
  { value: "16:00", label: "16:00", period: "afternoon" },
];

export default function TimeSlotPicker({
  value,
  onChange,
  className = "",
}: TimeSlotPickerProps) {
  // Group time slots by period
  const groupedSlots = useMemo(() => {
    const groups: Record<string, TimeSlot[]> = {
      morning: [],
      noon: [],
      afternoon: [],
    };

    TIME_SLOTS.forEach((slot) => {
      groups[slot.period].push(slot);
    });

    return groups;
  }, []);

  const periodLabels = {
    morning: "上午",
    noon: "中午",
    afternoon: "下午",
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {(["morning", "noon", "afternoon"] as const).map((period) => {
        const slots = groupedSlots[period];
        if (slots.length === 0) return null;

        return (
          <div key={period}>
            {/* Period label */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-medium text-wabi-400 uppercase tracking-wider">
                {periodLabels[period]}
              </span>
              <div className="flex-1 h-px bg-wabi-100" />
            </div>

            {/* Time slots grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((slot) => {
                const isSelected = value === slot.value;

                return (
                  <button
                    key={slot.value}
                    onClick={() => onChange(slot.value)}
                    className={`
                      py-2 px-1 rounded-lg text-[13px] font-medium
                      transition-all duration-200
                      ${
                        isSelected
                          ? "bg-sakura-500 text-white shadow-sm"
                          : "bg-wabi-50 text-stone-600 hover:bg-sakura-50 hover:text-sakura-600"
                      }
                    `}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
