'use client';

import { useRef } from 'react';
import { Upload, Sparkles, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface TryOnCanvasProps {
  userPhoto: string | null;
  resultImage: string | null;
  isGenerating: boolean;
  error: string | null;
  onPhotoUpload: (dataUrl: string) => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

export default function TryOnCanvas({
  userPhoto,
  resultImage,
  isGenerating,
  error,
  onPhotoUpload,
  onGenerate,
  canGenerate,
}: TryOnCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onPhotoUpload(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          试穿效果
        </h2>
        {userPhoto && (
          <button
            onClick={() => {
              onPhotoUpload(null as any);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors"
          >
            更换照片
          </button>
        )}
      </div>

      {/* Upload or Display */}
      {!userPhoto ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 md:p-12 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            上传您的照片
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            建议使用全身照，站立姿势，清晰背景
          </p>
          <div className="inline-flex px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
            选择照片
          </div>
        </div>
      ) : (
        <>
          {/* Comparison View */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {/* User Photo */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">
                您的照片
              </p>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={userPhoto}
                  alt="Your photo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Result */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-sakura-600">
                试穿效果
              </p>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-sakura-200 bg-gray-50">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-sakura-50">
                    <div className="w-12 h-12 border-4 border-sakura-200 border-t-sakura-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-gray-700 font-medium">
                      AI 生成中...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      约需 15-20 秒
                    </p>
                  </div>
                ) : resultImage ? (
                  <Image
                    src={resultImage}
                    alt="Try-on result"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Sparkles className="h-12 w-12 mb-2" />
                    <p className="text-xs">等待生成</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">生成失败</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`
              w-full py-3.5 rounded-xl font-semibold text-base
              transition-all duration-200
              ${canGenerate
                ? 'bg-sakura-600 text-white hover:bg-sakura-700 active:scale-98 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>生成中...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>生成试穿效果</span>
              </span>
            )}
          </button>
        </>
      )}

      {/* Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          拍照小贴士
        </h4>
        <ul className="text-xs text-gray-600 space-y-1.5">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>全身照效果最佳（从头到脚）</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>站立姿势，正面面对镜头</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>选择简单干净的背景</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>光线充足，避免背光</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
