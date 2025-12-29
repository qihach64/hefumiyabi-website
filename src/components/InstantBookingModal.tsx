"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();

  // Form state for contact info - pre-fill from session if available
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [notes, setNotes] = useState("");

  // Pre-fill user info when session is available
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !name) {
        setName(session.user.name);
      }
      if (session.user.email && !email) {
        setEmail(session.user.email);
      }
    }
  }, [session, name, email]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pricing calculations - upgrades are per unit
  const unitLabel = plan.unitLabel || "人";
  const upgradesPerUnit = selectedUpgrades.reduce((sum, u) => sum + u.price, 0);
  const unitPriceWithUpgrades = plan.price + upgradesPerUnit;
  const balance = subtotal - deposit;

  // Form validation
  const isFormValid = name.trim() && (email.trim() || phone.trim());

  // Format date display (compact)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  // Format time display (compact)
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    return timeStr;
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
              unitPrice: unitPriceWithUpgrades, // Unit price includes upgrades
              totalPrice: subtotal, // subtotal = unitPriceWithUpgrades × quantity
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

      {/* Modal - more compact design */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - compact */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between rounded-t-xl z-10">
            <h2 className="text-[16px] font-semibold text-gray-900">
              确认预约
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content - compact spacing */}
          <div className="px-4 py-3 space-y-4">
            {/* Booking summary - inline style */}
            <div className="bg-gray-50 rounded-lg p-3">
              {/* Plan info row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[14px]">👘</span>
                <span className="text-[14px] font-medium text-gray-900 flex-1 truncate">
                  {plan.name}
                </span>
              </div>

              {/* Meta info - horizontal compact */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sakura-500" />
                  {store.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-sakura-500" />
                  {formatDate(visitDate)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sakura-500" />
                  {formatTime(visitTime)}
                </span>
              </div>
            </div>

            {/* Contact form - compact inputs */}
            <div className="space-y-3">
              <p className="text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                联系信息
              </p>

              {/* Name + Email row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                    <User className="w-3 h-3" />
                    姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="您的姓名"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-sakura-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                    <Mail className="w-3 h-3" />
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="接收确认邮件"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-sakura-400 transition-colors"
                  />
                </div>
              </div>

              {/* Phone row */}
              <div>
                <label className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                  <Phone className="w-3 h-3" />
                  电话 <span className="text-[10px] text-gray-400">(邮箱或电话至少填一项)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="用于预约确认通知"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-sakura-400 transition-colors"
                />
              </div>

              {/* Notes - smaller */}
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">
                  备注 <span className="text-gray-400">(可选)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="特殊要求"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-sakura-400 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Price breakdown - upgrades per unit */}
            <div className="bg-sakura-50/50 rounded-lg p-3 space-y-1.5">
              {/* Unit price breakdown */}
              {selectedUpgrades.length > 0 ? (
                <>
                  {/* Show unit price composition */}
                  <div className="text-[12px] text-gray-500 mb-1">
                    单价：套餐 ¥{(plan.price / 100).toLocaleString()} + 增值 ¥{(upgradesPerUnit / 100).toLocaleString()} = ¥{(unitPriceWithUpgrades / 100).toLocaleString()}/{unitLabel}
                  </div>

                  {/* Upgrades detail */}
                  <div className="text-[11px] text-gray-400 pl-2 border-l border-sakura-200 space-y-0.5 mb-2">
                    {selectedUpgrades.map((upgrade) => (
                      <div key={upgrade.id} className="flex justify-between">
                        <span>{upgrade.icon} {upgrade.name}</span>
                        <span>+¥{(upgrade.price / 100).toLocaleString()}/{unitLabel}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total calculation */}
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-600">
                      ¥{(unitPriceWithUpgrades / 100).toLocaleString()} × {quantity} {unitLabel}
                    </span>
                    <span className="text-gray-900">
                      ¥{(subtotal / 100).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-600">
                    ¥{(plan.price / 100).toLocaleString()} × {quantity} {unitLabel}
                  </span>
                  <span className="text-gray-900">
                    ¥{(subtotal / 100).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Total line */}
              <div className="flex justify-between text-[14px] pt-1.5 border-t border-sakura-200/50">
                <span className="font-medium text-gray-900">合计</span>
                <span className="font-semibold text-sakura-600">
                  ¥{(subtotal / 100).toLocaleString()}
                </span>
              </div>

              {/* Deposit info */}
              {deposit > 0 && (
                <div className="flex justify-between text-[12px] text-gray-500">
                  <span>定金 ¥{(deposit / 100).toLocaleString()}</span>
                  <span>到店支付 ¥{(balance / 100).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-[13px] text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Security notice - inline */}
            <p className="text-[11px] text-gray-400 text-center">
              点击确认即表示同意服务条款，预订前不收费
            </p>
          </div>

          {/* Footer - compact */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 rounded-b-xl">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-sakura-600 hover:bg-sakura-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
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
