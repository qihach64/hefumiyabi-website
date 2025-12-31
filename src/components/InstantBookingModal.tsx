"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { SelectedUpgrade } from "@/components/PlanDetailClient";
import ContactForm, {
  type ContactFormValues,
  type ContactFormErrors,
} from "@/components/booking/ContactForm";
import PriceBreakdown, {
  type UpgradeItem,
} from "@/components/booking/PriceBreakdown";

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

  // Form state - unified with ContactFormValues
  const [formValues, setFormValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    phone: initialPhone,
    notes: "",
  });
  const [formErrors, setFormErrors] = useState<ContactFormErrors>({});

  // Pre-fill user info when session is available
  useEffect(() => {
    if (session?.user) {
      setFormValues((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || "",
        email: prev.email || session.user?.email || "",
      }));
    }
  }, [session]);

  // Sync initial phone when it changes
  useEffect(() => {
    if (initialPhone && !formValues.phone) {
      setFormValues((prev) => ({ ...prev, phone: initialPhone }));
    }
  }, [initialPhone, formValues.phone]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pricing calculations
  const unitLabel = plan.unitLabel || "人";
  const upgradesPerUnit = selectedUpgrades.reduce((sum, u) => sum + u.price, 0);
  const unitPriceWithUpgrades = plan.price + upgradesPerUnit;

  // Form validation
  const validateForm = (): boolean => {
    const errors: ContactFormErrors = {};

    if (!formValues.name.trim()) {
      errors.name = "请填写姓名";
    }

    if (!formValues.email.trim() && !formValues.phone.trim()) {
      errors.email = "邮箱或电话至少填一项";
      errors.phone = "邮箱或电话至少填一项";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = formValues.name.trim() && (formValues.email.trim() || formValues.phone.trim());

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

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

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
          guestName: formValues.name,
          guestEmail: formValues.email || null,
          guestPhone: formValues.phone || null,
          specialRequests: formValues.notes || null,

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
              unitPrice: unitPriceWithUpgrades,
              totalPrice: subtotal,
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

  // Convert selectedUpgrades to UpgradeItem format
  const upgrades: UpgradeItem[] = selectedUpgrades.map((u) => ({
    id: u.id,
    name: u.name,
    icon: u.icon,
    price: u.price,
  }));

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - compact design */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - compact */}
          <div className="sticky top-0 bg-white border-b border-wabi-100 px-4 py-3 flex items-center justify-between rounded-t-xl z-10">
            <h2 className="text-[16px] font-semibold text-gray-900">
              确认预约
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-wabi-50 transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content - compact spacing */}
          <div className="px-4 py-3 space-y-4">
            {/* Booking summary - inline style */}
            <div className="bg-wabi-50 rounded-lg p-3">
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
                  {visitTime}
                </span>
              </div>
            </div>

            {/* Contact form - using shared component in compact mode */}
            <ContactForm
              values={formValues}
              onChange={setFormValues}
              errors={formErrors}
              compact
              showTitle
            />

            {/* Price breakdown - using shared component in single mode */}
            <PriceBreakdown
              mode="single"
              planName={plan.name}
              planPrice={plan.price}
              quantity={quantity}
              unitLabel={unitLabel}
              upgrades={upgrades}
              deposit={deposit}
              compact
            />

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
          <div className="sticky bottom-0 bg-white border-t border-wabi-100 px-4 py-3 rounded-b-xl">
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
