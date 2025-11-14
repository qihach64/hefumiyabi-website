"use client";

import { useState, useRef } from "react";
import { X, Upload, Sparkles, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { useTryOnStore } from "@/store/tryOn";

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    isCampaign?: boolean;
  };
}

export default function TryOnModal({ isOpen, onClose, plan }: TryOnModalProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [resultPhoto, setResultPhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItem = useCartStore((state) => state.addItem);
  const addTryOnResult = useTryOnStore((state) => state.addTryOnResult);

  if (!isOpen) return null;

  // 上传照片
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("照片大小不能超过 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhoto(event.target?.result as string);
      setResultPhoto(null); // 清除之前的结果
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // 生成试穿效果
  const handleGenerate = async () => {
    if (!userPhoto || !plan.imageUrl) {
      setError("缺少必要的照片");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/virtual-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageBase64: userPhoto,
          kimonoImageUrl: plan.imageUrl,
          planId: plan.id,
          mode: "garment",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "生成失败");
      }

      // 替换用户照片为试穿结果
      setResultPhoto(data.imageUrl);

      // 保存试穿结果到 store
      addTryOnResult({
        planId: plan.id,
        planName: plan.name,
        planImageUrl: plan.imageUrl || "",
        originalPhoto: userPhoto,
        resultPhoto: data.imageUrl,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 加入购物车
  const handleAddToCart = () => {
    addItem({
      type: "PLAN",
      planId: plan.id,
      name: plan.name,
      price: plan.price,
      originalPrice: plan.originalPrice,
      image: plan.imageUrl,
      addOns: [],
      isCampaign: plan.isCampaign,
      tryOnPhoto: resultPhoto && userPhoto ? {
        originalPhoto: userPhoto,
        resultPhoto: resultPhoto,
        timestamp: new Date(),
        planImageUrl: plan.imageUrl || "",
      } : undefined,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  // 重新开始
  const handleReset = () => {
    setUserPhoto(null);
    setResultPhoto(null);
    setError(null);
  };

  // 当前显示的照片：试穿结果 > 用户照片 > null
  const displayPhoto = resultPhoto || userPhoto;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-5xl z-50 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in slide-in-from-bottom-4 duration-300">
        {/* 顶部栏 - 樱花主题 */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sakura-50 to-pink-50 border-b border-sakura-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sakura-500 to-pink-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI 和服试穿</h2>
              <p className="text-sm text-gray-600">{plan.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-full transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 成功提示 */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-sakura-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                已加入购物车！
              </h3>
              <p className="text-gray-600">
                试穿照片已保存
              </p>
            </div>
          </div>
        )}

        {/* 主内容区域 - 并排布局 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 左侧：和服套餐原图 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-sakura-500">👘</span>
                  和服套餐
                </h3>
              </div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                {plan.imageUrl ? (
                  <Image
                    src={plan.imageUrl}
                    alt={plan.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-20">👘</span>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：用户照片 → 试穿结果 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-sakura-500">
                    {resultPhoto ? '✨' : displayPhoto ? '📸' : '⬆️'}
                  </span>
                  {resultPhoto ? '试穿效果' : displayPhoto ? '您的照片' : '上传照片'}
                </h3>
                {displayPhoto && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-sakura-600 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    重新上传
                  </button>
                )}
              </div>

              {/* 照片显示区域 */}
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-sakura-50 to-pink-50 border-2 border-dashed border-sakura-300">
                {displayPhoto ? (
                  <>
                    <Image
                      src={displayPhoto}
                      alt={resultPhoto ? "试穿效果" : "您的照片"}
                      fill
                      className="object-cover"
                    />
                    {/* 生成成功标记 */}
                    {resultPhoto && (
                      <div className="absolute top-4 left-4 px-4 py-2 bg-sakura-500 text-white rounded-full font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 duration-500">
                        <Sparkles className="w-4 h-4" />
                        生成成功
                      </div>
                    )}
                    {/* 生成中遮罩 */}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-white font-semibold">
                          AI 正在生成试穿效果...
                        </div>
                        <div className="text-white/80 text-sm">
                          大约需要 15 秒
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // 上传提示
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 group cursor-pointer"
                    >
                      <div className="w-20 h-20 bg-sakura-100 rounded-full flex items-center justify-center group-hover:bg-sakura-200 group-hover:scale-110 transition-all">
                        <Upload className="w-10 h-10 text-sakura-500" />
                      </div>
                      <div className="text-center px-6">
                        <p className="font-semibold text-gray-900 mb-2 text-lg">
                          点击上传照片
                        </p>
                        <p className="text-sm text-gray-600">
                          支持 JPG、PNG，最大 5MB
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          建议上传全身或半身照
                        </p>
                      </div>
                    </button>
                  </>
                )}
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="mt-6 flex gap-3">
            {userPhoto && !resultPhoto && !isGenerating && (
              <button
                onClick={handleGenerate}
                className="flex-1 py-4 bg-gradient-to-r from-sakura-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:from-sakura-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                生成试穿效果
              </button>
            )}

            {resultPhoto && (
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-sakura-600 text-white rounded-xl font-semibold text-lg hover:bg-sakura-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                喜欢！立即预约
              </button>
            )}
          </div>

          {/* 使用提示 */}
          {!userPhoto && (
            <div className="mt-6 p-4 bg-gradient-to-br from-sakura-50 to-pink-50 rounded-xl border border-sakura-200">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                <span className="text-sakura-500">💡</span>
                拍照小贴士
              </h4>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-sakura-400">•</span>
                  <span>光线充足的环境效果最佳</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sakura-400">•</span>
                  <span>背景简洁，避免杂乱</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sakura-400">•</span>
                  <span>全身或半身照都可以</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
