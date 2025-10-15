"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock } from "lucide-react";
import type { BookingData } from "../page";

interface Step1Props {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
  slug: string;
}

interface RentalPlan {
  id: string;
  name: string;
  price: number;
  description: string;
}

export default function Step1SelectStore({
  bookingData,
  updateBookingData,
  onNext,
}: Step1Props) {
  const [stores, setStores] = useState<Store[]>([]);
  const [plan, setPlan] = useState<RentalPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取店铺列表
        const storesRes = await fetch("/api/stores");
        const storesData = await storesRes.json();
        setStores(storesData);

        // 如果有 planId 或 campaignPlanId，获取套餐信息
        const planIdToFetch = bookingData.planId || bookingData.campaignPlanId;
        if (planIdToFetch) {
          const planRes = await fetch(`/api/plans/${planIdToFetch}`);
          if (planRes.ok) {
            const planData = await planRes.json();
            setPlan(planData);
          } else {
            console.error("Failed to fetch plan:", planRes.status);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("加载数据失败，请刷新页面重试");
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingData.planId, bookingData.campaignPlanId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证
    if (!bookingData.storeId) {
      setError("请选择店铺");
      return;
    }
    if (!bookingData.rentalDate) {
      setError("请选择租赁日期");
      return;
    }
    if (!bookingData.returnDate) {
      setError("请选择归还日期");
      return;
    }
    if (bookingData.returnDate <= bookingData.rentalDate) {
      setError("归还日期必须晚于租赁日期");
      return;
    }

    onNext();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">选择店铺和日期</h2>
        <p className="text-gray-600">请选择您想要租赁和服的店铺和时间</p>
      </div>

      {/* 套餐信息（如果从套餐页进入） */}
      {plan && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">已选套餐</h3>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{plan.name}</p>
              <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            </div>
            <p className="text-lg font-bold text-rose-600">
              ¥{(plan.price / 100).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 选择店铺 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <MapPin className="w-4 h-4 inline mr-1" />
          选择店铺 <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-3">
          {stores.map((store) => (
            <label
              key={store.id}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${
                  bookingData.storeId === store.id
                    ? "border-rose-500 bg-rose-50"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <input
                type="radio"
                name="storeId"
                value={store.id}
                checked={bookingData.storeId === store.id}
                onChange={(e) => updateBookingData({ storeId: e.target.value })}
                className="sr-only"
              />
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{store.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{store.city}</p>
                  <p className="text-xs text-gray-500 mt-1">{store.address}</p>
                </div>
                {bookingData.storeId === store.id && (
                  <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 选择日期 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            租赁日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={bookingData.rentalDate?.toISOString().split("T")[0] || ""}
            onChange={(e) =>
              updateBookingData({
                rentalDate: e.target.value ? new Date(e.target.value) : null,
              })
            }
            min={new Date().toISOString().split("T")[0]}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            归还日期 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={bookingData.returnDate?.toISOString().split("T")[0] || ""}
            onChange={(e) =>
              updateBookingData({
                returnDate: e.target.value ? new Date(e.target.value) : null,
              })
            }
            min={
              bookingData.rentalDate?.toISOString().split("T")[0] ||
              new Date().toISOString().split("T")[0]
            }
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* 选择时间（可选） */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            取衣时间（可选）
          </label>
          <input
            type="time"
            value={bookingData.pickupTime || ""}
            onChange={(e) => updateBookingData({ pickupTime: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            还衣时间（可选）
          </label>
          <input
            type="time"
            value={bookingData.returnTime || ""}
            onChange={(e) => updateBookingData({ returnTime: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* 按钮 */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-lg hover:from-rose-600 hover:to-pink-600 transition shadow-md hover:shadow-lg"
        >
          下一步
        </button>
      </div>
    </form>
  );
}
