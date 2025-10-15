"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import StepIndicator from "./components/StepIndicator";
import Step1SelectStore from "./components/Step1SelectStore";
import Step2PersonalInfo from "./components/Step2PersonalInfo";
import Step3AddOns from "./components/Step3AddOns";
import Step4Confirm from "./components/Step4Confirm";

export interface BookingData {
  planId?: string;
  campaignPlanId?: string;
  storeId: string;
  rentalDate: Date | null;
  returnDate: Date | null;
  pickupTime?: string;
  returnTime?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  addOns: string[];
  notes?: string;
}

function BookingContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const planId = searchParams.get("planId");
  const campaignPlanId = searchParams.get("campaignPlanId");
  const storeId = searchParams.get("storeId");

  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    planId: planId || undefined,
    campaignPlanId: campaignPlanId || undefined,
    storeId: storeId || "",
    rentalDate: null,
    returnDate: null,
    pickupTime: undefined,
    returnTime: undefined,
    guestName: session?.user?.name || "",
    guestEmail: session?.user?.email || "",
    guestPhone: "",
    addOns: [],
    notes: "",
  });

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 步骤指示器 */}
        <StepIndicator currentStep={currentStep} />

        {/* 当前步骤内容 */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {currentStep === 1 && (
            <Step1SelectStore
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <Step2PersonalInfo
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={handleNext}
              onPrev={handlePrev}
              session={session}
            />
          )}
          {currentStep === 3 && (
            <Step3AddOns
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
          {currentStep === 4 && (
            <Step4Confirm
              bookingData={bookingData}
              onPrev={handlePrev}
            />
          )}
        </div>

        {/* 温馨提示 */}
        <div className="mt-6 bg-rose-50 border border-rose-200 rounded-lg p-4">
          <p className="text-sm text-rose-800">
            <strong>温馨提示：</strong>
            预约成功后，您将收到确认邮件。请在预约时间前15分钟到店，我们将为您准备好一切。
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">加载中...</div>
    </div>}>
      <BookingContent />
    </Suspense>
  );
}
