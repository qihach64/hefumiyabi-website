"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MapPin, Clock, Users, Star, Shield, Check, Heart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";
import BookingCard from "@/components/BookingCard";
import TryOnResultCard from "@/components/TryOnResultCard";
import TryOnModal from "@/components/TryOnModal";
import ImageComparison from "@/components/ImageComparison";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import { useTryOnStore } from "@/store/tryOn";

interface Campaign {
  id: string;
  slug: string;
  title: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  duration: number;
  depositAmount: number;
  description?: string;
  includes: string[];
  imageUrl?: string;
  region?: string;
  isCampaign?: boolean;
  availableUntil?: Date;
  campaign?: Campaign;
}

interface PlanDetailClientProps {
  plan: Plan;
}

export default function PlanDetailClient({ plan }: PlanDetailClientProps) {
  const [mounted, setMounted] = useState(false);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [showLargeImage, setShowLargeImage] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const getTryOnResult = useTryOnStore((state) => state.getTryOnResult);
  const removeTryOnResult = useTryOnStore((state) => state.removeTryOnResult);

  // 客户端挂载标记
  useEffect(() => {
    setMounted(true);
  }, []);

  // 检查是否有试穿记录（只在客户端挂载后读取）
  const tryOnResult = mounted ? getTryOnResult(plan.id) : null;
  const hasTryOn = !!tryOnResult;

  // 分类标签
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      LADIES: "女士",
      MENS: "男士",
      COUPLE: "情侣",
      FAMILY: "亲子",
      GROUP: "团体",
      SPECIAL: "特别",
    };
    return labels[category] || "套餐";
  };

  // 模拟多张图片（实际应该从数据库获取）
  const images = plan.imageUrl
    ? [plan.imageUrl, plan.imageUrl, plan.imageUrl, plan.imageUrl, plan.imageUrl]
    : [];

  // 打开试穿弹窗
  const handleTryOn = () => {
    setShowTryOnModal(true);
  };

  // 重新试穿（不删除旧记录，让 TryOnModal 在成功生成后自动替换）
  const handleRetry = () => {
    setShowTryOnModal(true);
  };

  // 查看大图
  const handleViewLarge = () => {
    setShowLargeImage(true);
  };

  // 打开图片画廊
  const handleOpenGallery = (index: number) => {
    setGalleryIndex(index);
    setShowGallery(true);
  };

  return (
    <>
      {/* 试穿弹窗 */}
      <TryOnModal
        isOpen={showTryOnModal}
        onClose={() => setShowTryOnModal(false)}
        plan={{
          id: plan.id,
          name: plan.name,
          price: plan.price,
          originalPrice: plan.originalPrice,
          imageUrl: plan.imageUrl,
          isCampaign: plan.isCampaign,
        }}
      />

      {/* 图片画廊 Modal */}
      <ImageGalleryModal
        images={images}
        initialIndex={galleryIndex}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        planName={plan.name}
      />

      {/* 大图弹窗（对比图） */}
      {showLargeImage && hasTryOn && tryOnResult && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowLargeImage(false)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageComparison
              beforeImage={plan.imageUrl || ''}
              afterImage={tryOnResult.resultPhoto}
              beforeLabel="套餐原图"
              afterLabel="试穿效果"
            />
            <button
              onClick={() => setShowLargeImage(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-[14px] font-semibold transition-all duration-300"
            >
              关闭 ✕
            </button>
          </div>
        </div>
      )}

      <div className="bg-white min-h-screen">
        {/* 顶部容器 - 最大宽度 1280px */}
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 lg:px-20 pt-6 pb-12">

          {/* 标题区域 */}
          <div className="mb-6">
            <h1 className="text-[26px] md:text-[32px] font-semibold text-gray-900 mb-2 leading-tight">
              {plan.name}
            </h1>

            <div className="flex items-center gap-2 flex-wrap">
              {/* 评分 */}
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                <span className="font-semibold text-[15px]">4.8</span>
                <span className="text-[15px] text-gray-600 underline cursor-pointer">(128条评价)</span>
              </div>

              <span className="text-gray-400">·</span>

              {/* 地区 */}
              {plan.region && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] text-gray-900 underline cursor-pointer font-semibold">
                      {plan.region}
                    </span>
                  </div>
                </>
              )}

              {/* 限时优惠标签 */}
              {plan.isCampaign && (
                <>
                  <span className="text-gray-400">·</span>
                  <Badge variant="error" size="sm">
                    限时优惠
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* 图片画廊 - Airbnb 风格 2大3小网格 */}
          <div className="relative mb-12">
            {images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 h-[400px] md:h-[480px] rounded-xl overflow-hidden">
                {/* 左侧大图 - 始终显示原图 */}
                <div className="col-span-4 md:col-span-2 row-span-2 relative group cursor-pointer">
                  <div
                    className="relative w-full h-full"
                    onClick={() => handleOpenGallery(0)}
                  >
                    <Image
                      src={images[0]}
                      alt={`${plan.name} - 图片1`}
                      fill
                      className="object-cover group-hover:brightness-95 transition-all duration-300"
                      priority
                    />
                  </div>
                  {/* 如果未试穿，显示试穿按钮 */}
                  {!hasTryOn && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all duration-300 flex items-center justify-center pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTryOn();
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 px-6 py-3 bg-white/95 hover:bg-white rounded-full shadow-xl flex items-center gap-2 pointer-events-auto"
                      >
                        <Sparkles className="w-5 h-5 text-sakura-600" />
                        <span className="font-semibold text-gray-900">AI 试穿看看</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 右侧4小图 */}
                {images.slice(1, 5).map((img, idx) => (
                  <div
                    key={idx}
                    className="col-span-2 md:col-span-1 relative cursor-pointer group"
                    onClick={() => handleOpenGallery(idx + 1)}
                  >
                    <Image
                      src={img}
                      alt={`${plan.name} - 图片${idx + 2}`}
                      fill
                      className="object-cover group-hover:brightness-95 transition-all duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[400px] md:h-[480px] rounded-xl bg-sakura-50 flex items-center justify-center">
                <span className="text-9xl opacity-20">👘</span>
              </div>
            )}

            {/* 查看全部照片按钮 */}
            <button
              onClick={() => handleOpenGallery(0)}
              className="absolute bottom-6 right-6 px-4 py-2 bg-white border border-gray-900 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-all duration-300 shadow-md"
            >
              显示所有照片
            </button>
          </div>

          {/* 两栏布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-24">
            {/* 左侧主内容区 - 占 2/3 */}
            <div className="lg:col-span-2">

              {/* 基础信息 */}
              <div className="pb-8 border-b border-gray-200">
                <h2 className="text-[22px] font-semibold text-gray-900 mb-6">
                  {getCategoryLabel(plan.category)}套餐 · {plan.duration}小时体验
                </h2>

                <div className="flex items-center gap-6 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{plan.duration} 小时</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>最多10人</span>
                  </div>
                </div>
              </div>

              {/* 套餐描述 */}
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-[22px] font-semibold text-gray-900 mb-4">套餐介绍</h2>
                <p className="text-[16px] text-gray-700 leading-relaxed whitespace-pre-line">
                  {plan.description}
                </p>
              </div>

              {/* 套餐包含项目 */}
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-[22px] font-semibold text-gray-900 mb-6">套餐包含</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.includes.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-gray-900 flex-shrink-0 mt-0.5" />
                      <span className="text-[16px] text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 活动信息 */}
              {plan.campaign && (
                <div className="py-8 border-b border-gray-200">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-2xl">🎊</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[18px] font-semibold text-amber-900 mb-2">
                          {plan.campaign.title}
                        </h3>
                        <p className="text-[15px] text-amber-800 leading-relaxed">
                          {plan.campaign.description}
                        </p>
                        {plan.availableUntil && (
                          <p className="text-[14px] text-amber-700 mt-3 font-medium">
                            活动截止：{new Date(plan.availableUntil).toLocaleDateString('zh-CN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 预订须知 */}
              <div className="py-8 border-b border-gray-200">
                <h2 className="text-[22px] font-semibold text-gray-900 mb-6">预订须知</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Shield className="w-6 h-6 text-gray-700 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-[16px] text-gray-900 mb-2">取消政策</h3>
                      <p className="text-[15px] text-gray-600 leading-relaxed">
                        到店日期前7天可免费取消，7天内取消将扣除定金
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-gray-700 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-[16px] text-gray-900 mb-2">营业时间</h3>
                      <p className="text-[15px] text-gray-600 leading-relaxed">
                        每天 09:00 - 18:00（最晚入店时间16:00）
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Users className="w-6 h-6 text-gray-700 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-[16px] text-gray-900 mb-2">人数限制</h3>
                      <p className="text-[15px] text-gray-600 leading-relaxed">
                        单次预订最多10人，团体预订请提前联系客服
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 评价区域 */}
              <div className="py-8">
                <div className="flex items-center gap-2 mb-8">
                  <Star className="w-7 h-7 fill-gray-900 text-gray-900" />
                  <h2 className="text-[22px] font-semibold text-gray-900">
                    4.8 · 128条评价
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                  {[
                    {
                      name: "小红",
                      date: "2024年10月",
                      rating: 5,
                      comment: "非常棒的体验！和服很精美，工作人员很专业，拍照效果超好！强烈推荐！"
                    },
                    {
                      name: "张女士",
                      date: "2024年10月",
                      rating: 5,
                      comment: "服务一流，和服款式多样，帮忙化妆和盘发的小姐姐手艺很好，整体体验超出预期！"
                    },
                    {
                      name: "李先生",
                      date: "2024年9月",
                      rating: 4,
                      comment: "不错的体验，和服质量很好，价格也合理。就是周末人有点多，需要等待。"
                    },
                    {
                      name: "王小姐",
                      date: "2024年9月",
                      rating: 5,
                      comment: "第二次来了，依然很满意！和服保养得很好，服务态度也一如既往的好。"
                    }
                  ].map((review, index) => (
                    <div key={index}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-semibold">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[15px] text-gray-900">{review.name}</p>
                          <p className="text-[14px] text-gray-600">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-gray-900 text-gray-900" />
                        ))}
                      </div>
                      <p className="text-[15px] text-gray-700 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>

                <button className="mt-10 px-6 py-3 border border-gray-900 rounded-lg text-[16px] font-semibold hover:bg-gray-50 transition-colors">
                  显示全部128条评价
                </button>
              </div>
            </div>

            {/* 右侧预订卡片 - 占 1/3，Sticky定位 */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* 试穿效果卡片（如果有试穿记录） */}
                {hasTryOn && tryOnResult && (
                  <TryOnResultCard
                    tryOnResult={tryOnResult}
                    onRetry={handleRetry}
                    onViewLarge={handleViewLarge}
                  />
                )}

                {/* 预订卡片 */}
                <BookingCard plan={plan} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
