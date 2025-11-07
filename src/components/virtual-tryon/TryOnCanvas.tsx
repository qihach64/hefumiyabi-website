'use client';

import { useRef } from 'react';
import { Upload, Download, Share2, RotateCcw, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface GeneratedResult {
  kimono: { id: string; name: string; imageUrl: string };
  resultImage: string;
  timestamp: Date;
}

interface TryOnCanvasProps {
  userPhoto: string | null;
  resultImage: string | null;
  isGenerating: boolean;
  error: string | null;
  onPhotoUpload: (dataUrl: string) => void;
  onReset: () => void;
  onPhotoChange: () => void; // 更换照片时清除结果
  generatedResults: GeneratedResult[];
  activeResultIndex: number;
  onResultChange: (index: number) => void;
}

export default function TryOnCanvas({
  userPhoto,
  resultImage,
  isGenerating,
  error,
  onPhotoUpload,
  onReset,
  onPhotoChange,
  generatedResults,
  activeResultIndex,
  onResultChange,
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
      // onPhotoUpload 已经处理了切换到新照片状态
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `kimono-tryon-${Date.now()}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!resultImage) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI 和服试穿效果',
          text: '看看我穿和服的效果！',
          url: window.location.href,
        });
      } catch (err) {
        console.log('分享取消或失败', err);
      }
    } else {
      // 复制链接
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">上传照片</h2>

      {/* Upload or Display */}
      {!userPhoto ? (
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-sakura-400 transition-colors cursor-pointer bg-white"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-16 h-16 bg-sakura-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-sakura-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              点击上传照片
            </h3>
            <p className="text-xs text-gray-500">
              全身照 · 正面 · 简单背景
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Comparison View */}
          <div className="grid grid-cols-2 gap-4">
            {/* User Photo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">
                  原图
                  {generatedResults.length > 0 && activeResultIndex >= 0 && activeResultIndex < generatedResults.length && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      历史记录 #{activeResultIndex + 1}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="text-xs text-sakura-600 hover:text-sakura-700 font-medium flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" />
                  {generatedResults.length > 0 ? '上传新照片' : '更换'}
                </button>
              </div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image
                  src={userPhoto}
                  alt="Your photo"
                  fill
                  className="object-contain"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Result */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-sakura-600">
                试穿效果
                {activeResultIndex >= 0 && generatedResults.length > 0 && (
                  <span className="ml-2 text-xs bg-sakura-100 text-sakura-700 px-1.5 py-0.5 rounded">
                    #{activeResultIndex + 1}
                  </span>
                )}
              </p>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-sakura-400 bg-gray-50">
                {isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-sakura-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-sm text-gray-700 font-medium">生成中</p>
                    <p className="text-xs text-gray-400 mt-1">约 15-20 秒</p>
                  </div>
                ) : resultImage ? (
                  <Image
                    src={resultImage}
                    alt="Try-on result"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <p className="text-sm">选择和服后生成</p>
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

          {/* Results Switcher - 试穿结果对比切换 */}
          {generatedResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">试穿历史 ({generatedResults.length} 个结果)</p>
                <p className="text-xs text-gray-500">点击查看 · 自动保留</p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {generatedResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => onResultChange(index)}
                    className={`
                      flex-shrink-0 space-y-1.5 transition-all
                    `}
                  >
                    <div className={`
                      relative w-24 h-32 rounded-lg overflow-hidden border-2 transition-all
                      ${activeResultIndex === index
                        ? 'border-sakura-600 ring-4 ring-sakura-200 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-sakura-300 hover:shadow-md'
                      }
                    `}>
                      <Image
                        src={result.resultImage}
                        alt={`试穿结果 ${index + 1}`}
                        fill
                        className="object-contain bg-white"
                      />
                      {activeResultIndex === index && (
                        <div className="absolute inset-0 bg-sakura-600/10"></div>
                      )}
                    </div>
                    <p className={`
                      text-xs font-medium text-center truncate w-24
                      ${activeResultIndex === index
                        ? 'text-sakura-600'
                        : 'text-gray-600'
                      }
                    `}>
                      {result.kimono.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {resultImage && (
            <div className="space-y-2">
              {/* 更换照片 - 主要操作 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-white border-2 border-sakura-600 rounded-lg text-sm font-semibold text-sakura-600 hover:bg-sakura-50 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <Upload className="h-5 w-5" />
                更换照片重新试穿
              </button>

              {/* 次要操作 */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  下载
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  分享
                </button>
                <button
                  onClick={onReset}
                  className="flex-1 py-2.5 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  title="清空所有照片和历史记录"
                >
                  <RotateCcw className="h-4 w-4" />
                  清空全部
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
