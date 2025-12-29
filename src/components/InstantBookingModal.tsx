"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Check,
  Loader2,
  Shield,
  AlertCircle,
} from "lucide-react";
import type { SelectedUpgrade } from "@/components/PlanDetailClient";

interface InstantBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    duration: number;
    depositAmount: number;
    isCampaign?: boolean;
    imageUrl?: string;
    pricingUnit?: "person" | "group";
    unitLabel?: string;
    unitDescription?: string;
  };
  store: {
    id: string;
    name: string;
  };
  quantity: number;
  visitDate: string;
  visitTime: string;
  phone: string;
  selectedUpgrades: SelectedUpgrade[];
  subtotal: number;
  deposit: number;
}

export default function InstantBookingModal({
  isOpen,
  onClose,
  plan,
  store,
  quantity,
  visitDate,
  visitTime,
  phone: initialPhone,
  selectedUpgrades,
  subtotal,
  deposit,
}: InstantBookingModalProps) {
  const router = useRouter();

  // Form state for contact info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [notes, setNotes] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pricing unit info
  const unitLabel = plan.unitLabel || "人";
  const balance = subtotal - deposit;

  // Form validation
  const isFormValid = name.trim() && (email.trim() || phone.trim());

  // Format date display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  // Format time display
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [hour] = timeStr.split(":");
    const hourNum = parseInt(hour);
    if (hourNum < 12) return `上午 ${timeStr}`;
    if (hourNum === 12) return `中午 ${timeStr}`;
    return `下午 ${timeStr}`;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Guest info
          guestName: name,
          guestEmail: email || null,
          guestPhone: phone || null,
          specialRequests: notes || null,

          // Booking details
          visitDate,
          visitTime,
          totalAmount: subtotal,
          depositAmount: deposit,

          // Items
          items: [
            {
              type: "PLAN",
              planId: plan.id,
              storeId: store.id,
              quantity,
              unitPrice: plan.price,
              totalPrice: plan.price * quantity,
              addOns: selectedUpgrades.map((u) => u.id),
            },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "预订失败，请稍后重试");
      }

      const { id: bookingId } = await response.json();

      // Redirect to success page
      router.push(`/booking/success?id=${bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "预订失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-[18px] font-semibold text-gray-900">
              确认预约
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Booking summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="text-[14px] font-semibold text-gray-900 mb-3">
                预约详情
              </h3>

              {/* Plan name */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sakura-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[14px]">👘</span>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-gray-900">
                    {plan.name}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {quantity} {unitLabel} × ¥
                    {(plan.price / 100).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Store */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-[14px] text-gray-700">{store.name}</p>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-[14px] text-gray-700">
                  {formatDate(visitDate)}
                </p>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
                <p className="text-[14px] text-gray-700">
                  {formatTime(visitTime)}
                </p>
              </div>

              {/* Selected upgrades */}
              {selectedUpgrades.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-[12px] text-gray-500 mb-2">已选增值服务</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUpgrades.map((upgrade) => (
                      <span
                        key={upgrade.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-sakura-50 text-sakura-700 rounded-full text-[12px]"
                      >
                        {upgrade.icon} {upgrade.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact form */}
            <div className="space-y-4">
              <h3 className="text-[14px] font-semibold text-gray-900">
                联系信息
              </h3>

              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 text-sakura-500" />
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入您的姓名"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-[14px] focus:outline-none focus:border-sakura-500 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 text-sakura-500" />
                  邮箱
                  <span className="text-[12px] text-gray-400 font-normal">
                    (邮箱或电话至少填一项)
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="用于接收预约确认邮件"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-[14px] focus:outline-none focus:border-sakura-500 transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 text-sakura-500" />
                  电话
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="用于预约确认通知"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-[14px] focus:outline-none focus:border-sakura-500 transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 mb-2">
                  备注
                  <span className="text-[12px] text-gray-400 font-normal">
                    (可选)
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="有任何特殊要求请在此说明"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-[14px] focus:outline-none focus:border-sakura-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Price summary */}
            <div className="bg-sakura-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-[14px]">
                <span className="text-gray-600">小计</span>
                <span className="text-gray-900 font-medium">
                  ¥{(subtotal / 100).toLocaleString()}
                </span>
              </div>
              {deposit > 0 && (
                <>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-gray-600">定金</span>
                    <span className="text-gray-900">
                      ¥{(deposit / 100).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[14px] pt-2 border-t border-sakura-200">
                    <span className="font-semibold text-gray-900">
                      到店支付
                    </span>
                    <span className="font-semibold text-sakura-600">
                      ¥{(balance / 100).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-[14px] text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Security notice */}
            <div className="flex items-start gap-2 text-[12px] text-gray-500">
              <Shield className="w-4 h-4 text-sakura-500 flex-shrink-0 mt-0.5" />
              <p>
                点击确认预约即表示您同意我们的服务条款和隐私政策。预订前不会收取任何费用。
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-sakura-600 hover:bg-sakura-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  确认预约
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
