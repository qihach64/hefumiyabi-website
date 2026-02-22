import { Suspense } from "react";
import BookingStatusClient from "./BookingStatusClient";

export const dynamic = "force-dynamic";

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">加载中...</div>
        </div>
      }
    >
      <BookingStatusClient />
    </Suspense>
  );
}
