"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Camera, Users, Sparkles, Scissors, ChevronLeft, ChevronRight, RotateCcw, Grid3X3 } from "lucide-react";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import TryOnModal from "@/components/TryOnModal";
import ImageComparison from "@/components/ImageComparison";
import { useTryOnStore } from "@/store/tryOn";

// Tab 配置
const TABS = [
  { id: "official", label: "官方图片", icon: Camera },
  { id: "customer", label: "买家秀", icon: Users },
  { id: "tryon", label: "AI试穿", icon: Sparkles },
  { id: "hairstyle", label: "发型预览", icon: Scissors },
] as const;

type TabId = typeof TABS[number]["id"];

interface VisualHubProps {
  plan: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string;
    isCampaign?: boolean;
  };
  // Mock data - 后期对接真实数据
  officialImages?: string[];
  customerPhotos?: { url: string; author: string; date: string }[];
  hairstyleImages?: {
    basic: { url: string; name: string }[];
    premium: { url: string; name: string; price: number }[];
  };
}

export default function VisualHub({
  plan,
  officialImages,
  customerPhotos,
  hairstyleImages,
}: VisualHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>("official");
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [mounted, setMounted] = useState(false);

  const getTryOnResult = useTryOnStore((state) => state.getTryOnResult);
  const removeTryOnResult = useTryOnStore((state) => state.removeTryOnResult);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tryOnResult = mounted ? getTryOnResult(plan.id) : null;
  const hasTryOn = !!tryOnResult;

  // 使用真实图片数据，如无则使用主图作为唯一图片
  const mockOfficialImages = officialImages && officialImages.length > 0
    ? officialImages
    : plan.imageUrl
      ? [plan.imageUrl]
      : [];

  const mockCustomerPhotos = customerPhotos || [
    { url: plan.imageUrl || "", author: "小红", date: "2024-12" },
    { url: plan.imageUrl || "", author: "美美", date: "2024-11" },
    { url: plan.imageUrl || "", author: "樱子", date: "2024-11" },
    { url: plan.imageUrl || "", author: "花花", date: "2024-10" },
  ];

  const mockHairstyleImages = hairstyleImages || {
    basic: [
      { url: "/hairstyles/basic-1.jpg", name: "经典盘发" },
      { url: "/hairstyles/basic-2.jpg", name: "侧边编发" },
      { url: "/hairstyles/basic-3.jpg", name: "低马尾" },
    ],
    premium: [
      { url: "/hairstyles/premium-1.jpg", name: "华丽盘髻", price: 2000 },
      { url: "/hairstyles/premium-2.jpg", name: "新娘发型", price: 3000 },
    ],
  };

  // 获取当前 Tab 的图片列表
  const getCurrentImages = (): string[] => {
    switch (activeTab) {
      case "official":
        return mockOfficialImages;
      case "customer":
        return mockCustomerPhotos.map(p => p.url);
      case "hairstyle":
        return [
          ...mockHairstyleImages.basic.map(h => h.url),
          ...mockHairstyleImages.premium.map(h => h.url),
        ];
      case "tryon":
        return tryOnResult ? [tryOnResult.resultPhoto] : [];
      default:
        return [];
    }
  };

  const handleOpenGallery = (index: number) => {
    if (activeTab === "tryon" && hasTryOn) {
      setShowComparison(true);
    } else {
      setGalleryIndex(index);
      setShowGallery(true);
    }
  };

  const handleRetry = () => {
    removeTryOnResult(plan.id);
    setShowTryOnModal(true);
  };

  // Tab 内容渲染
  const renderTabContent = () => {
    switch (activeTab) {
      case "official":
        return (
          <OfficialGallery
            images={mockOfficialImages}
            planName={plan.name}
            onImageClick={handleOpenGallery}
          />
        );

      case "customer":
        return (
          <CustomerPhotos
            photos={mockCustomerPhotos}
            onPhotoClick={handleOpenGallery}
          />
        );

      case "tryon":
        return (
          <TryOnSection
            hasTryOn={hasTryOn}
            tryOnResult={tryOnResult}
            planImageUrl={plan.imageUrl}
            onTryOn={() => setShowTryOnModal(true)}
            onRetry={handleRetry}
            onViewLarge={() => setShowComparison(true)}
          />
        );

      case "hairstyle":
        return (
          <HairstylePreview
            hairstyles={mockHairstyleImages}
            onImageClick={handleOpenGallery}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Modals */}
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

      <ImageGalleryModal
        images={getCurrentImages()}
        initialIndex={galleryIndex}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        planName={plan.name}
      />

      {/* 对比图弹窗 */}
      {showComparison && hasTryOn && tryOnResult && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowComparison(false)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageComparison
              beforeImage={plan.imageUrl || ""}
              afterImage={tryOnResult.resultPhoto}
              beforeLabel="套餐原图"
              afterLabel="试穿效果"
            />
            <button
              onClick={() => setShowComparison(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-[14px] font-semibold transition-all duration-300"
            >
              关闭 ✕
            </button>
          </div>
        </div>
      )}

      {/* 主容器 */}
      <div className="relative">
        {/* Tab 导航 */}
        <div className="flex items-center gap-1 mb-4 bg-wabi-100 rounded-xl p-1 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === "tryon" && hasTryOn;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium
                  transition-all duration-300
                  ${isActive
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sakura-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 内容区 */}
        <div className="relative rounded-xl overflow-hidden bg-wabi-50">
          {renderTabContent()}
        </div>
      </div>
    </>
  );
}

// ============================================
// 子组件：官方图片画廊 - "紧凑型全宽瀑布流" 布局
// 4列瀑布流 + 最多8张 + 底部渐变入口
// ============================================
function OfficialGallery({
  images,
  planName,
  onImageClick
}: {
  images: string[];
  planName: string;
  onImageClick: (index: number) => void;
}) {
  // 最大显示数量
  const MAX_DISPLAY = 8;

  // 空状态
  if (images.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-wabi-50 rounded-2xl">
        <span className="text-8xl opacity-20">👘</span>
      </div>
    );
  }

  // 单图 - 居中限宽展示
  if (images.length === 1) {
    return (
      <div className="flex justify-center">
        <div
          className="cursor-pointer group max-w-md"
          onClick={() => onImageClick(0)}
        >
          <Image
            src={images[0]}
            alt={`${planName} - 主图`}
            width={0}
            height={0}
            sizes="100vw"
            className="w-full h-auto max-h-[500px] object-cover rounded-2xl group-hover:-translate-y-1 group-hover:shadow-lg transition-all duration-300"
            priority
          />
        </div>
      </div>
    );
  }

  // 计算显示的图片
  const displayImages = images.slice(0, MAX_DISPLAY);
  const hasMore = images.length > MAX_DISPLAY;
  const totalCount = images.length;

  return (
    <div className="relative">
      {/* 瀑布流容器 */}
      <div className="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4 lg:gap-4">
        {displayImages.map((img, idx) => (
          <div
            key={idx}
            className="mb-2 sm:mb-3 lg:mb-4 break-inside-avoid cursor-pointer group"
            onClick={() => onImageClick(idx)}
          >
            <Image
              src={img}
              alt={`${planName} - 图片${idx + 1}`}
              width={0}
              height={0}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="w-full h-auto max-h-[500px] object-cover rounded-xl group-hover:-translate-y-1 group-hover:shadow-lg transition-all duration-300"
              priority={idx < 4}
            />
          </div>
        ))}
      </div>

      {/* 底部渐变遮罩 + 查看全部按钮 */}
      {hasMore && (
        <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-t from-wabi-50 to-transparent flex items-end justify-center pb-4 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(0);
            }}
            className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 shadow-md text-gray-900 text-[14px] font-medium rounded-full hover:scale-105 hover:shadow-lg transition-all duration-300"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>查看全部 ({totalCount})</span>
          </button>
        </div>
      )}

      {/* 无更多图片时的底部按钮 */}
      {!hasMore && images.length > 1 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => onImageClick(0)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 shadow-sm text-gray-900 text-[14px] font-medium rounded-full hover:scale-105 hover:shadow-md transition-all duration-300"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>查看全部 ({totalCount})</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 子组件：买家秀
// ============================================
function CustomerPhotos({
  photos,
  onPhotoClick
}: {
  photos: { url: string; author: string; date: string }[];
  onPhotoClick: (index: number) => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
        <Users className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-[15px]">暂无买家秀</p>
        <p className="text-[13px] mt-1">成为第一个分享的用户</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, idx) => (
          <div
            key={idx}
            className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group"
            onClick={() => onPhotoClick(idx)}
          >
            <Image
              src={photo.url || "/placeholder-kimono.jpg"}
              alt={`${photo.author}的买家秀`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* 底部信息 */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-[14px] font-medium">{photo.author}</p>
              <p className="text-white/70 text-[12px]">{photo.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 子组件：AI试穿
// ============================================
function TryOnSection({
  hasTryOn,
  tryOnResult,
  planImageUrl,
  onTryOn,
  onRetry,
  onViewLarge,
}: {
  hasTryOn: boolean;
  tryOnResult: any;
  planImageUrl?: string;
  onTryOn: () => void;
  onRetry: () => void;
  onViewLarge: () => void;
}) {
  if (!hasTryOn) {
    // 未试穿状态
    return (
      <div className="h-[400px] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-sakura-50 to-white">
        <div className="w-20 h-20 rounded-full bg-sakura-100 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-sakura-600" />
        </div>
        <h3 className="text-[22px] font-semibold text-gray-900 mb-2">AI 虚拟试穿</h3>
        <p className="text-[15px] text-gray-600 text-center max-w-md mb-6">
          上传一张您的照片，AI 将为您生成穿着这款和服的效果图
        </p>
        <button
          onClick={onTryOn}
          className="px-8 py-3 bg-sakura-600 hover:bg-sakura-700 text-white rounded-lg font-semibold text-[16px] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
        >
          开始试穿
        </button>
        <p className="text-[13px] text-gray-400 mt-4">
          支持 JPG、PNG 格式，建议正面半身照
        </p>
      </div>
    );
  }

  // 已试穿状态 - 显示对比图
  return (
    <div className="relative h-[400px] md:h-[480px]">
      <div className="grid grid-cols-2 h-full">
        {/* 原图 */}
        <div className="relative">
          <Image
            src={planImageUrl || ""}
            alt="套餐原图"
            fill
            className="object-cover"
          />
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[13px] font-medium text-gray-700">
            套餐原图
          </div>
        </div>

        {/* 试穿效果 */}
        <div className="relative">
          <Image
            src={tryOnResult.resultPhoto}
            alt="试穿效果"
            fill
            className="object-cover"
          />
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-sakura-600 rounded-full text-[13px] font-medium text-white">
            试穿效果
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={onRetry}
          className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 shadow-lg"
          title="重新试穿"
        >
          <RotateCcw className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={onViewLarge}
          className="px-4 py-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-300 shadow-lg text-[14px] font-semibold text-gray-900"
        >
          查看对比
        </button>
      </div>
    </div>
  );
}

// ============================================
// 子组件：发型预览
// ============================================
function HairstylePreview({
  hairstyles,
  onImageClick,
}: {
  hairstyles: {
    basic: { url: string; name: string }[];
    premium: { url: string; name: string; price: number }[];
  };
  onImageClick: (index: number) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<"basic" | "premium">("basic");

  const currentHairstyles = activeCategory === "basic"
    ? hairstyles.basic
    : hairstyles.premium;

  return (
    <div className="p-4">
      {/* 分类切换 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setActiveCategory("basic")}
          className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-all duration-300 ${
            activeCategory === "basic"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          基础发型 (套餐内)
        </button>
        <button
          onClick={() => setActiveCategory("premium")}
          className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-all duration-300 ${
            activeCategory === "premium"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          升级发型 (+费用)
        </button>
      </div>

      {/* 发型列表 */}
      {currentHairstyles.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {currentHairstyles.map((style, idx) => (
            <div
              key={idx}
              className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group bg-gray-200"
              onClick={() => onImageClick(idx)}
            >
              {/* 实际使用时替换为真实图片 */}
              <div className="absolute inset-0 flex items-center justify-center bg-sakura-50">
                <Scissors className="w-8 h-8 text-sakura-300" />
              </div>
              {/* 底部信息 */}
              <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-2.5">
                <p className="text-[13px] font-medium text-gray-900 truncate">{style.name}</p>
                {activeCategory === "premium" && "price" in style && (
                  <p className="text-[12px] text-sakura-600 font-semibold">
                    +¥{((style as any).price / 100).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-gray-400">
          <p className="text-[15px]">暂无发型图片</p>
        </div>
      )}
    </div>
  );
}
