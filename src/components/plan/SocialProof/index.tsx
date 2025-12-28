"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ThumbsUp, Camera, ChevronDown } from "lucide-react";
import ImageGalleryModal from "@/components/ImageGalleryModal";

interface Review {
  id: string;
  author: string;
  authorType?: string; // "情侣" | "家庭" | "首次" 等
  rating: number;
  content: string;
  date: string;
  photos?: string[];
  tags?: string[];
  helpful?: number;
}

interface SocialProofProps {
  rating?: number;
  reviewCount?: number;
  recommendRate?: number;
  // Mock data - 后期对接真实数据
  reviews?: Review[];
}

// Mock 评价数据
const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    author: "小红",
    authorType: "情侣",
    rating: 5,
    content: "非常棒的体验！和服很精美，工作人员很专业，拍照效果超好！选了粉色系的振袖，店员帮忙搭配了很好看的帯和配饰。强烈推荐给第一次体验和服的朋友！",
    date: "2024-12-01",
    photos: ["/reviews/review-1-1.jpg", "/reviews/review-1-2.jpg", "/reviews/review-1-3.jpg"],
    tags: ["情侣", "粉色系", "摄影友好"],
    helpful: 23,
  },
  {
    id: "2",
    author: "美美",
    authorType: "首次体验",
    rating: 5,
    content: "第一次穿和服，感觉很新奇！店员非常耐心地帮我选择款式，还教我怎么走路和拍照姿势。整个过程大约1小时就完成了，比想象中快很多。",
    date: "2024-11-28",
    photos: ["/reviews/review-2-1.jpg"],
    tags: ["首次", "服务好"],
    helpful: 15,
  },
  {
    id: "3",
    author: "张女士",
    authorType: "家庭",
    rating: 4,
    content: "带孩子一起来体验的，店里有儿童和服可选。服务一流，和服款式多样，帮忙化妆和盘发的小姐姐手艺很好。就是周末人有点多，等了20分钟。",
    date: "2024-11-20",
    tags: ["家庭", "儿童友好"],
    helpful: 8,
  },
  {
    id: "4",
    author: "樱子",
    authorType: "摄影达人",
    rating: 5,
    content: "作为摄影爱好者，这家店的和服品质和搭配都非常出片！光线也很好，在店内就能拍出好看的照片。强烈推荐下午来，光线最美。",
    date: "2024-11-15",
    photos: ["/reviews/review-4-1.jpg", "/reviews/review-4-2.jpg"],
    tags: ["摄影达人", "出片"],
    helpful: 31,
  },
];

// 所有可能的标签
const ALL_TAGS = ["全部", "有图", "情侣", "首次", "家庭", "摄影达人", "粉色系"];

export default function SocialProof({
  rating = 4.8,
  reviewCount = 128,
  recommendRate = 96,
  reviews = MOCK_REVIEWS,
}: SocialProofProps) {
  const [activeTag, setActiveTag] = useState("全部");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const openGallery = (photos: string[], index: number) => {
    setGalleryImages(photos);
    setGalleryIndex(index);
    setShowGallery(true);
  };

  // 根据标签筛选评价
  const filteredReviews = reviews.filter((review) => {
    if (activeTag === "全部") return true;
    if (activeTag === "有图") return review.photos && review.photos.length > 0;
    return review.tags?.includes(activeTag) || review.authorType === activeTag;
  });

  // 计算有图的评价数量
  const withPhotoCount = reviews.filter((r) => r.photos && r.photos.length > 0).length;

  // 计算各标签数量
  const getTagCount = (tag: string): number => {
    if (tag === "全部") return reviews.length;
    if (tag === "有图") return withPhotoCount;
    return reviews.filter((r) => r.tags?.includes(tag) || r.authorType === tag).length;
  };

  // 显示的评价列表
  const visibleReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 区块标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
        <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
          Reviews
        </span>
      </div>

      {/* 评分卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          {/* 综合评分 */}
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 fill-gray-900 text-gray-900" />
            <span className="text-[32px] font-bold text-gray-900">{rating}</span>
          </div>

          {/* 分隔线 */}
          <div className="hidden sm:block w-px h-12 bg-gray-200" />

          {/* 统计数据 */}
          <div className="flex items-center gap-6 text-[14px]">
            <div>
              <span className="font-semibold text-gray-900">{reviewCount}</span>
              <span className="text-gray-500 ml-1">条评价</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{recommendRate}%</span>
              <span className="text-gray-500 ml-1">推荐</span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{withPhotoCount}</span>
              <span className="text-gray-500 ml-1">张买家秀</span>
            </div>
          </div>
        </div>

        {/* 标签筛选 */}
        <div className="mt-5 pt-5 border-t border-wabi-200">
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((tag) => {
              const count = getTagCount(tag);
              if (count === 0 && tag !== "全部") return null;

              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`
                    px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200
                    ${activeTag === tag
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  {tag}
                  {count > 0 && (
                    <span className={`ml-1.5 ${activeTag === tag ? "text-gray-300" : "text-gray-400"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 评价列表 */}
      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            {/* 头部：用户信息 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* 头像 */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sakura-400 to-sakura-600 flex items-center justify-center text-white font-semibold text-[14px]">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[14px] text-gray-900">
                      {review.author}
                    </span>
                    {review.authorType && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded-full">
                        {review.authorType}
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-gray-400">{review.date}</span>
                </div>
              </div>

              {/* 评分 */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < review.rating
                        ? "fill-gray-900 text-gray-900"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 评价内容 */}
            <p className="text-[14px] text-gray-700 leading-relaxed mb-3">
              {review.content}
            </p>

            {/* 买家秀图片 */}
            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-2 mb-3">
                {review.photos.slice(0, 4).map((photo, idx) => (
                  <button
                    key={idx}
                    className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
                    onClick={() => openGallery(review.photos!, idx)}
                  >
                    {/* 实际使用时替换为真实图片 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-300" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    {/* 更多图片提示 */}
                    {idx === 3 && review.photos!.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-[13px] font-semibold">
                          +{review.photos!.length - 4}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 标签 + 有用 */}
            <div className="flex items-center justify-between">
              {/* 标签 */}
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {review.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] text-sakura-600 bg-sakura-50 px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 有用按钮 */}
              {review.helpful !== undefined && review.helpful > 0 && (
                <button className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>有用 ({review.helpful})</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 查看更多按钮 */}
      {filteredReviews.length > 4 && (
        <button
          onClick={() => setShowAllReviews(!showAllReviews)}
          className="w-full py-3 border border-gray-300 rounded-xl text-[14px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          {showAllReviews ? (
            <>收起评价</>
          ) : (
            <>
              查看全部 {filteredReviews.length} 条评价
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* 图片画廊 */}
      <ImageGalleryModal
        images={galleryImages}
        initialIndex={galleryIndex}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        planName="买家秀"
      />
    </div>
  );
}
