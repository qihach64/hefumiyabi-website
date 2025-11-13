"use client";

import { useState, useRef } from "react";
import { X, Upload, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cart";

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

  if (!isOpen) return null;

  // 上传照片
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError("照片大小不能超过 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhoto(event.target?.result as string);
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

      setResultPhoto(data.imageUrl);
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 加入购物车（带试穿照片）
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
      // 扩展字段：试穿照片
      tryOnPhoto: resultPhoto && userPhoto ? {
        originalPhoto: userPhoto,
        resultPhoto: resultPhoto,
        timestamp: new Date(),
        planImageUrl: plan.imageUrl || "",
      } : undefined,
    });

    // 显示成功动画
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  // 重置状态
  const handleReset = () => {
    setUserPhoto(null);
    setResultPhoto(null);
    setError(null);
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-50 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI 试穿</h2>
              <p className="text-sm text-gray-600">{plan.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 成功提示 */}
          {showSuccess && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
              <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
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

          {/* 步骤 1: 上传照片 */}
          {!userPhoto && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  上传您的照片
                </h3>
                <p className="text-sm text-gray-600">
                  上传一张清晰的全身或半身照，AI 将为您生成试穿效果
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-purple-500" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 mb-1">
                    点击上传照片
                  </p>
                  <p className="text-sm text-gray-500">
                    支持 JPG、PNG 格式，最大 5MB
                  </p>
                </div>
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* 步骤 2: 生成中 */}
          {userPhoto && !resultPhoto && (
            <div className="space-y-6">
              {/* 预览照片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    您的照片
                  </h4>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={userPhoto}
                      alt="User photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    试穿套餐
                  </h4>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
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
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  重新上传
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium text-white hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      生成中... (约15秒)
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      生成试穿效果
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* 步骤 3: 结果展示 */}
          {resultPhoto && (
            <div className="space-y-6">
              {/* Before/After 对比 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    原照片
                  </h4>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={userPhoto}
                      alt="Before"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    试穿效果
                  </h4>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={resultPhoto}
                      alt="After"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  重新试穿
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium text-white hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  喜欢！立即预约
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
