"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  CheckSquare,
  Loader2,
} from "lucide-react";
import type { BookingData } from "../page";

interface Step4Props {
  bookingData: BookingData;
  onPrev: () => void;
}

interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
}

interface RentalPlan {
  id: string;
  name: string;
  price: number;
  description: string;
}

const addOnServices = [
  { id: "photography", name: "专业摄影" },
  { id: "hairstyling", name: "发型设计" },
  { id: "makeup", name: "化妆服务" },
  { id: "accessories", name: "配饰升级" },
];

export default function Step4Confirm({ bookingData, onPrev }: Step4Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [store, setStore] = useState<Store | null>(null);
  const [plan, setPlan] = useState<RentalPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取店铺信息
        const storeRes = await fetch(`/api/stores/${bookingData.storeId}`);
        const storeData = await storeRes.json();
        setStore(storeData);

        // 获取套餐信息
        if (bookingData.planId) {
          const planRes = await fetch(`/api/plans/${bookingData.planId}`);
          if (planRes.ok) {
            const planData = await planRes.json();
            setPlan(planData);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("加载数据失败");
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingData.storeId, bookingData.planId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("请阅读并同意服务条款");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bookingData,
          userId: session?.user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "预约失败");
      }

      // 跳转到成功页面
      router.push(`/booking/success?id=${data.id}`);
    } catch (err: any) {
      console.error("Booking error:", err);
      setError(err.message || "预约失败，请稍后重试");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 mx-auto text-rose-500 animate-spin" />
        <p className="text-gray-600 mt-4">加载中...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">确认预约</h2>
        <p className="text-gray-600">请仔细核对预约信息</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 套餐信息 */}
      {plan && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">套餐信息</h3>
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

      {/* 店铺和日期信息 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 mb-4">预约详情</h3>

        {/* 店铺 */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-gray-500">店铺</p>
            <p className="font-medium text-gray-900">{store?.name}</p>
            <p className="text-sm text-gray-600 mt-1">
              {store?.city} - {store?.address}
            </p>
          </div>
        </div>

        {/* 日期 */}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-gray-500">租赁日期</p>
            <p className="font-medium text-gray-900">
              {bookingData.rentalDate?.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              -{" "}
              {bookingData.returnDate?.toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* 时间 */}
        {(bookingData.pickupTime || bookingData.returnTime) && (
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-gray-500">时间</p>
              <p className="font-medium text-gray-900">
                {bookingData.pickupTime && `取衣: ${bookingData.pickupTime}`}
                {bookingData.pickupTime && bookingData.returnTime && " / "}
                {bookingData.returnTime && `还衣: ${bookingData.returnTime}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 联系信息 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 mb-4">联系信息</h3>

        {session ? (
          <>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">姓名</p>
                <p className="font-medium text-gray-900">{session.user?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium text-gray-900">{session.user?.email}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">姓名</p>
                <p className="font-medium text-gray-900">
                  {bookingData.guestName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium text-gray-900">
                  {bookingData.guestEmail}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">手机</p>
                <p className="font-medium text-gray-900">
                  {bookingData.guestPhone}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 附加服务 */}
      {bookingData.addOns && bookingData.addOns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">附加服务</h3>
          <div className="flex flex-wrap gap-2">
            {bookingData.addOns.map((addOnId) => {
              const service = addOnServices.find((s) => s.id === addOnId);
              return (
                <span
                  key={addOnId}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
                >
                  {service?.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 备注 */}
      {bookingData.notes && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">特殊要求</h3>
          <p className="text-gray-700">{bookingData.notes}</p>
        </div>
      )}

      {/* 服务条款 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-900">
              我已阅读并同意
              <a href="#" className="text-rose-600 hover:text-rose-700 mx-1">
                服务条款
              </a>
              和
              <a href="#" className="text-rose-600 hover:text-rose-700 mx-1">
                取消政策
              </a>
            </p>
            <p className="text-xs text-gray-600 mt-2">
              取消政策：预约日前3天取消可全额退款，3天内取消将扣除30%手续费，当天取消或未到店定金不予退还。
            </p>
          </div>
        </label>
      </div>

      {/* 按钮 */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={submitting}
          className="border-2 border-gray-300 text-gray-700 font-medium py-3 px-8 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一步
        </button>
        <button
          type="submit"
          disabled={submitting || !agreedToTerms}
          className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-lg hover:from-rose-600 hover:to-pink-600 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <CheckSquare className="w-5 h-5" />
              确认预约
            </>
          )}
        </button>
      </div>
    </form>
  );
}
