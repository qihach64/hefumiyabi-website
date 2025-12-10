import { Suspense } from "react";
import BookingSuccessClient from "./BookingSuccessClient";

// 禁用静态生成，避免 useSearchParams 在构建时报错
export const dynamic = "force-dynamic";

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">加载中...</div>
        </div>
      }
    >
      <BookingSuccessClient />
    </Suspense>
  );
}
