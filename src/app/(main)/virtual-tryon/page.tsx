import { Suspense } from 'react';
import VirtualTryOnApp from '@/components/virtual-tryon/VirtualTryOnApp';

export const metadata = {
  title: 'AI 和服虚拟试穿 | 江戸和装工房雅',
  description: '使用 AI 技术在线试穿和服，上传您的照片，选择喜欢的和服，立即查看试穿效果',
};

export default function VirtualTryOnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <VirtualTryOnApp />
    </Suspense>
  );
}
