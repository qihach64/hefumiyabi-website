'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import TryOnCanvas from './TryOnCanvas';
import KimonoSelector from './KimonoSelector';
import { KimonoItem } from '@/types/virtual-tryon';

export default function VirtualTryOnApp() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedKimono, setSelectedKimono] = useState<KimonoItem | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!userPhoto || !selectedKimono) {
      setError('请先上传照片并选择和服');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/virtual-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImageBase64: userPhoto,
          kimonoImageUrl: selectedKimono.imageUrl,
          planId: selectedKimono.planId,
          mode: 'garment',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '生成失败');
      }

      setResultImage(data.imageUrl);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Airbnb 简洁风格 */}
      <div className="border-b border-gray-200 bg-white sticky top-14 md:top-16 z-10">
        <div className="container py-4 md:py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sakura-50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-sakura-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                AI 和服试穿
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                上传照片，选择和服，立即查看效果
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Container 布局 */}
      <div className="container py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left: Canvas */}
          <TryOnCanvas
            userPhoto={userPhoto}
            resultImage={resultImage}
            isGenerating={isGenerating}
            error={error}
            onPhotoUpload={setUserPhoto}
            onGenerate={handleGenerate}
            canGenerate={!!userPhoto && !!selectedKimono && !isGenerating}
          />

          {/* Right: Kimono Selector */}
          <KimonoSelector
            selectedKimono={selectedKimono}
            onSelect={setSelectedKimono}
          />
        </div>
      </div>
    </div>
  );
}
