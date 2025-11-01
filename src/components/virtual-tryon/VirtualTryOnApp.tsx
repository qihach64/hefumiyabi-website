'use client';

import { useState } from 'react';
import TryOnCanvas from './TryOnCanvas';
import KimonoSelector from './KimonoSelector';
import { KimonoItem } from '@/types/virtual-tryon';

interface GeneratedResult {
  kimono: KimonoItem;
  resultImage: string;
  timestamp: Date;
}

export default function VirtualTryOnApp() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedKimono, setSelectedKimono] = useState<KimonoItem | null>(null);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(0);
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

      // 添加到结果历史
      const newResult: GeneratedResult = {
        kimono: selectedKimono,
        resultImage: data.imageUrl,
        timestamp: new Date(),
      };
      setGeneratedResults(prev => [...prev, newResult]);
      setActiveResultIndex(generatedResults.length);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setUserPhoto(null);
    setSelectedKimono(null);
    setGeneratedResults([]);
    setActiveResultIndex(0);
    setError(null);
  };

  const handlePhotoChange = () => {
    // 更换照片时清除生成结果，显示 CTA
    setGeneratedResults([]);
    setActiveResultIndex(0);
    setError(null);
  };

  const activeResult = generatedResults[activeResultIndex];

  return (
    <div className="min-h-screen bg-white">
      {/* 极简标题 */}
      <div className="border-b border-gray-200">
        <div className="container py-4">
          <h1 className="text-2xl font-semibold text-gray-900 text-center">
            AI 和服试穿
          </h1>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container py-8 md:py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Canvas + CTA */}
          <div className="space-y-4">
            <TryOnCanvas
              userPhoto={userPhoto}
              resultImage={activeResult?.resultImage || null}
              isGenerating={isGenerating}
              error={error}
              onPhotoUpload={setUserPhoto}
              onReset={handleReset}
              onPhotoChange={handlePhotoChange}
              generatedResults={generatedResults}
              activeResultIndex={activeResultIndex}
              onResultChange={setActiveResultIndex}
            />

            {/* 生成按钮 - 在对比图下方 */}
            {userPhoto && (!activeResult || selectedKimono?.id !== activeResult.kimono.id) && (
              <button
                onClick={handleGenerate}
                disabled={!selectedKimono || isGenerating}
                className={`
                  w-full py-4 rounded-xl font-semibold text-lg
                  transition-all duration-200
                  ${selectedKimono && !isGenerating
                    ? 'bg-sakura-600 text-white hover:bg-sakura-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>生成中...</span>
                  </span>
                ) : activeResult ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">✨</span>
                    <span>生成新和服效果</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-xl">✨</span>
                    <span>生成试穿效果</span>
                  </span>
                )}
              </button>
            )}
          </div>

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
