import Image from "next/image";
import Link from "next/link";
import { SocialPlatform } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface SocialPostCardProps {
  post: {
    id: string;
    platform: SocialPlatform;
    postUrl: string;
    content: string | null;
    images: string[];
    authorName: string;
    authorAvatar: string | null;
    likes: number;
    comments: number;
    shares: number;
    postedAt: Date;
  };
}

// 平台图标和颜色
const platformConfig = {
  INSTAGRAM: {
    name: "Instagram",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: "from-purple-600 to-pink-600",
    textColor: "text-pink-600",
  },
  FACEBOOK: {
    name: "Facebook",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: "from-blue-600 to-blue-700",
    textColor: "text-blue-600",
  },
  WEIBO: {
    name: "微博",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.63 18.36c-2.77 0-5.02-1.78-5.02-3.97 0-2.19 2.25-3.97 5.02-3.97s5.02 1.78 5.02 3.97c0 2.19-2.25 3.97-5.02 3.97zm0-6.5c-1.94 0-3.52 1.12-3.52 2.5s1.58 2.5 3.52 2.5 3.52-1.12 3.52-2.5-1.58-2.5-3.52-2.5zm11.43-2.63c-.55-.28-1.02-.47-1.02-.8 0-.28.3-.49.7-.49.55 0 .96.28 1.02.7h1.05c-.08-.94-.88-1.58-2.07-1.58-1.11 0-2.03.64-2.03 1.58 0 .86.66 1.3 1.52 1.68.63.28 1.19.49 1.19.94 0 .36-.36.64-.86.64-.66 0-1.13-.36-1.19-.86h-1.08c.08 1.08.97 1.74 2.27 1.74 1.27 0 2.16-.72 2.16-1.74 0-.97-.75-1.47-1.66-1.81z"/>
      </svg>
    ),
    color: "from-red-600 to-orange-600",
    textColor: "text-red-600",
  },
};

// 格式化数字（1000+ -> 1K）
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export default function SocialPostCard({ post }: SocialPostCardProps) {
  const config = platformConfig[post.platform];
  const mainImage = post.images[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* 帖子头部 */}
      <div className="p-4 flex items-center gap-3">
        {/* 作者头像 */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {post.authorAvatar ? (
            <Image
              src={post.authorAvatar}
              alt={post.authorName}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          )}
        </div>

        {/* 作者名称和时间 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{post.authorName}</p>
            <div className={`${config.textColor}`}>
              {config.icon}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.postedAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </p>
        </div>
      </div>

      {/* 帖子内容 */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-700 line-clamp-3">
            {post.content}
          </p>
        </div>
      )}

      {/* 图片 */}
      {mainImage && (
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={mainImage}
            alt="Post image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* 多图片指示器 */}
          {post.images.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
              1/{post.images.length}
            </div>
          )}
        </div>
      )}

      {/* 互动数据 */}
      <div className="px-4 py-3 flex items-center gap-4 text-sm text-muted-foreground border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span className="font-medium">{formatNumber(post.likes)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span className="font-medium">{formatNumber(post.comments)}</span>
        </div>
        {post.shares > 0 && (
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            <span className="font-medium">{formatNumber(post.shares)}</span>
          </div>
        )}
      </div>

      {/* 查看原帖链接 */}
      <div className="px-4 pb-4">
        <a
          href={post.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-sm font-medium ${config.textColor} hover:underline`}
        >
          在 {config.name} 上查看
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
