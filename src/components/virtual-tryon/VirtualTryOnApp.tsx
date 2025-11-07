'use client';

import { useState } from 'react';
import TryOnCanvas from './TryOnCanvas';
import KimonoSelector from './KimonoSelector';
import PromptEditor from './PromptEditor';
import DebugPanel, { DebugInfo } from './DebugPanel';
import { KimonoItem } from '@/types/virtual-tryon';
import { DEFAULT_PROMPT } from '@/lib/virtual-tryon-prompts';

interface GeneratedResult {
  kimono: KimonoItem;
  resultImage: string;
  timestamp: Date;
  userPhoto: string; // 保存对应的原始照片
}

export default function VirtualTryOnApp() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedKimono, setSelectedKimono] = useState<KimonoItem | null>(null);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(-1); // -1 表示不在查看历史
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prompt 和 Debug 状态
  const [customPrompt, setCustomPrompt] = useState<string>(DEFAULT_PROMPT);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [lastDuration, setLastDuration] = useState<number | undefined>(undefined);

  const handleGenerate = async () => {
    if (!userPhoto || !selectedKimono) {
      setError('请先上传照片并选择和服');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDebugInfo(null);

    try {
      const response = await fetch('/api/virtual-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImageBase64: userPhoto,
          kimonoImageUrl: selectedKimono.imageUrl,
          planId: selectedKimono.planId,
          mode: 'garment',
          customPrompt: customPrompt !== DEFAULT_PROMPT ? customPrompt : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '生成失败');
      }

      // 保存 debug 信息
      if (data.debugInfo) {
        setDebugInfo(data.debugInfo);
      }
      if (data.duration) {
        setLastDuration(data.duration);
      }

      // 添加到结果历史
      const newResult: GeneratedResult = {
        kimono: selectedKimono,
        resultImage: data.imageUrl,
        timestamp: new Date(),
        userPhoto: userPhoto, // 保存当前使用的照片
      };
      setGeneratedResults(prev => {
        const updated = [...prev, newResult];
        setActiveResultIndex(updated.length - 1); // 设置为新结果的索引
        return updated;
      });
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
    setActiveResultIndex(-1);
    setError(null);
  };

  const handlePhotoChange = () => {
    // 更换照片时不清除历史记录，但切换到"新上传"状态
    setActiveResultIndex(-1); // 显示新上传的照片
    setError(null);
  };

  const handlePhotoUpload = (dataUrl: string) => {
    setUserPhoto(dataUrl);
    setActiveResultIndex(-1); // 上传新照片后，显示新照片而不是历史
  };

  const activeResult = generatedResults[activeResultIndex];

  return (
    <div className="min-h-screen bg-white">
      {/* 极简标题 */}
      <div className="border-b border-gray-200">
        <div className="container py-4">
          <h1 className="text-2xl font-semibold text-gray-900 text-center">
            AI 和服试穿 - Debug Mode
          </h1>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container py-8 md:py-12 max-w-[1800px]">
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr_1.5fr] gap-6">
          {/* Left: Canvas + Generate Button (更大的空间) */}
          <div className="space-y-4">
            <TryOnCanvas
              userPhoto={activeResultIndex >= 0 && activeResult ? activeResult.userPhoto : userPhoto}
              resultImage={activeResultIndex >= 0 && activeResult ? activeResult.resultImage : null}
              isGenerating={isGenerating}
              error={error}
              onPhotoUpload={handlePhotoUpload}
              onReset={handleReset}
              onPhotoChange={handlePhotoChange}
              generatedResults={generatedResults}
              activeResultIndex={activeResultIndex}
              onResultChange={setActiveResultIndex}
            />

            {/* 生成按钮 - 在对比图下方 */}
            {userPhoto && (
              activeResultIndex < 0 || // 新上传的照片
              !activeResult ||
              selectedKimono?.id !== activeResult.kimono.id ||
              activeResult.userPhoto !== userPhoto
            ) && (
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

            {/* Debug 信息 */}
            <div className="text-center text-sm space-y-2">
              {lastDuration && (
                <div className="text-gray-600">
                  ⏱️ 生成耗时: <span className="font-semibold">{lastDuration}s</span>
                </div>
              )}
              {/* 状态指示 */}
              <div className="text-xs">
                {activeResultIndex >= 0 ? (
                  <span className="text-blue-600 font-medium">
                    📋 查看历史记录 #{activeResultIndex + 1}/{generatedResults.length}
                  </span>
                ) : userPhoto ? (
                  <span className="text-green-600 font-medium">
                    ✅ 新照片已上传 - 选择和服生成
                  </span>
                ) : (
                  <span className="text-gray-400">
                    等待上传照片...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Kimono Selector */}
          <div>
            <KimonoSelector
              selectedKimono={selectedKimono}
              onSelect={setSelectedKimono}
            />
          </div>

          {/* Right: Prompt Editor & Debug Panel */}
          <div className="space-y-4">
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <PromptEditor
                prompt={customPrompt}
                onPromptChange={setCustomPrompt}
              />
            </div>

            <DebugPanel
              debugInfo={debugInfo}
              duration={lastDuration}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
