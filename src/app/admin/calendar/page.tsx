"use client";

import { useState, useEffect } from "react";

interface Booking {
  id: string;
  visitDate: string;
  visitTime: string;
  guestName: string | null;
  guestPhone: string | null;
  status: string;
  totalAmount: number;
  items: {
    id: string;
    store: {
      name: string;
    };
    plan: {
      name: string;
    } | null;
  }[];
}

interface DayBooking {
  date: Date;
  bookings: Booking[];
  count: number;
}

interface StoreInventory {
  storeId: string;
  storeName: string;
  totalKimonos: number;
  availableKimonos: number;
  bookedKimonos: number;
  utilizationRate: number;
}

export default function AdminCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inventory, setInventory] = useState<StoreInventory[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取当月的预约数据
  useEffect(() => {
    fetchMonthlyBookings();
    fetchInventory();
  }, [currentMonth]);

  async function fetchMonthlyBookings() {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const response = await fetch(
        `/api/admin/bookings?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInventory() {
    try {
      const response = await fetch(`/api/admin/inventory`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    }
  }

  // 生成日历天数
  function generateCalendarDays(): DayBooking[] {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: DayBooking[] = [];

    // 前置空白天
    for (let i = 0; i < startDayOfWeek; i++) {
      const date = new Date(year, month, -startDayOfWeek + i + 1);
      days.push({
        date,
        bookings: [],
        count: 0,
      });
    }

    // 当月天数
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.visitDate);
        return bookingDate.toDateString() === date.toDateString();
      }).sort((a, b) => {
        // 按时间排序
        return a.visitTime.localeCompare(b.visitTime);
      });

      days.push({
        date,
        bookings: dayBookings,
        count: dayBookings.length,
      });
    }

    return days;
  }

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }

  function selectDate(day: DayBooking) {
    setSelectedDate(day.date);
  }

  const calendarDays = generateCalendarDays();
  const selectedDayBookings = selectedDate
    ? bookings.filter((b) => {
        const bookingDate = new Date(b.visitDate);
        return bookingDate.toDateString() === selectedDate.toDateString();
      }).sort((a, b) => a.visitTime.localeCompare(b.visitTime))
    : [];

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statusNames: Record<string, string> = {
    PENDING: "待确认",
    CONFIRMED: "已确认",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">预约日历 & 实时库存</h1>
        <p className="text-muted-foreground">可视化管理每日预约和库存状态</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：日历视图 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border p-6">
            {/* 月份导航 */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h2 className="text-xl font-semibold">
                {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
              </h2>

              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* 日历格子 */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.date.getMonth() === currentMonth.getMonth();
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                const maxVisible = 3; // 最多显示3个预约
                const visibleBookings = day.bookings.slice(0, maxVisible);
                const remainingCount = Math.max(0, day.bookings.length - maxVisible);

                return (
                  <div
                    key={index}
                    onClick={() => selectDate(day)}
                    className={`
                      relative p-2 rounded-lg border-2 transition-all min-h-[140px] cursor-pointer
                      ${!isCurrentMonth ? "bg-gray-50 text-gray-400" : "hover:bg-gray-50 bg-white"}
                      ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}
                      ${isSelected ? "ring-2 ring-blue-500" : ""}
                    `}
                  >
                    {/* 日期数字 */}
                    <div className={`text-sm font-semibold mb-2 ${isToday ? "text-blue-600" : ""}`}>
                      {day.date.getDate()}
                    </div>

                    {/* 预约列表 */}
                    {visibleBookings.length > 0 && (
                      <div className="space-y-1">
                        {visibleBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className={`
                              text-xs px-1.5 py-1 rounded truncate
                              ${statusColors[booking.status] || "bg-gray-100 text-gray-800"}
                            `}
                            title={`${booking.visitTime} - ${booking.guestName || "游客"}`}
                          >
                            <div className="font-medium truncate">
                              {booking.visitTime} {booking.guestName || "游客"}
                            </div>
                          </div>
                        ))}

                        {/* 显示剩余数量 */}
                        {remainingCount > 0 && (
                          <div className="text-xs text-center text-blue-600 font-semibold mt-1">
                            +{remainingCount} 个
                          </div>
                        )}
                      </div>
                    )}

                    {/* 空状态 */}
                    {day.bookings.length === 0 && isCurrentMonth && (
                      <div className="text-xs text-gray-400 text-center mt-2">-</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 图例 */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50"></div>
                  <span className="text-muted-foreground">今天</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-100"></div>
                  <span className="text-muted-foreground">待确认</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100"></div>
                  <span className="text-muted-foreground">已确认</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100"></div>
                  <span className="text-muted-foreground">已完成</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100"></div>
                  <span className="text-muted-foreground">已取消</span>
                </div>
              </div>
            </div>
          </div>

          {/* 选中日期的预约详情 */}
          {selectedDate && (
            <div className="mt-6 bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日的预约
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedDayBookings.length} 个预约)
                </span>
              </h3>

              {selectedDayBookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{booking.visitTime}</span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                statusColors[booking.status] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {statusNames[booking.status] || booking.status}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>👤 {booking.guestName || "游客"}</p>
                            <p>📞 {booking.guestPhone || "-"}</p>
                            {booking.items[0] && (
                              <>
                                <p>🏪 {booking.items[0].store.name}</p>
                                <p>👘 {booking.items[0].plan?.name || "未知套餐"}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">¥{(booking.totalAmount / 100).toFixed(0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">当天暂无预约</p>
              )}
            </div>
          )}
        </div>

        {/* 右侧：实时库存 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-6 sticky top-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📦 实时库存状态
            </h3>

            {inventory.length > 0 ? (
              <div className="space-y-4">
                {inventory.map((store) => (
                  <div key={store.storeId} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{store.storeName}</h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">总库存:</span>
                        <span className="font-semibold">{store.totalKimonos} 件</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">可用:</span>
                        <span className="font-semibold text-green-600">{store.availableKimonos} 件</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">已预订:</span>
                        <span className="font-semibold text-blue-600">{store.bookedKimonos} 件</span>
                      </div>
                    </div>

                    {/* 使用率进度条 */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">使用率</span>
                        <span className="font-semibold">{store.utilizationRate}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            store.utilizationRate > 80
                              ? "bg-red-500"
                              : store.utilizationRate > 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${store.utilizationRate}%` }}
                        />
                      </div>
                    </div>

                    {/* 库存预警 */}
                    {store.utilizationRate > 80 && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                        ⚠️ 库存紧张，建议限制新预约
                      </div>
                    )}
                    {store.utilizationRate > 60 && store.utilizationRate <= 80 && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚡ 库存适中，接近繁忙
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无库存数据</p>
            )}

            {/* 总览统计 */}
            {inventory.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground">全店总览</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>总库存:</span>
                    <span className="font-bold">
                      {inventory.reduce((sum, s) => sum + s.totalKimonos, 0)} 件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>总可用:</span>
                    <span className="font-bold text-green-600">
                      {inventory.reduce((sum, s) => sum + s.availableKimonos, 0)} 件
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>总预订:</span>
                    <span className="font-bold text-blue-600">
                      {inventory.reduce((sum, s) => sum + s.bookedKimonos, 0)} 件
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
