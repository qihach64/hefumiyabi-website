"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Phone,
  Clock,
  Copy,
  Navigation,
  Check,
  Train,
} from "lucide-react";
import { toast } from "sonner";

interface StoreLocationCardProps {
  store: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
    addressEn?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string | null;
    openingHours?: unknown;
  };
}

export default function StoreLocationCard({ store }: StoreLocationCardProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  // 5秒超时后显示 fallback（中国大陆用户可能无法加载 Google Maps）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mapLoaded) {
        setShowFallback(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [mapLoaded]);

  // 构建 Google Maps Embed URL（免费版，无需 API Key）
  // 使用经纬度定位 + 地址作为标记名称
  const getMapEmbedUrl = useCallback(() => {
    if (store.latitude && store.longitude && store.address) {
      // 使用 place 模式：经纬度定位，地址作为标签
      return `https://maps.google.com/maps?q=${encodeURIComponent(store.name + ' ' + store.address)}&ll=${store.latitude},${store.longitude}&z=17&output=embed`;
    } else if (store.address) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(store.address)}&z=16&output=embed`;
    } else if (store.latitude && store.longitude) {
      return `https://maps.google.com/maps?q=${store.latitude},${store.longitude}&z=16&output=embed`;
    }
    return null;
  }, [store.latitude, store.longitude, store.address, store.name]);

  // 构建 Google Maps 导航链接
  // 优先使用经纬度（导航更精确）
  const getGoogleMapsLink = useCallback(() => {
    if (store.latitude && store.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    } else if (store.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`;
    }
    return null;
  }, [store.latitude, store.longitude, store.address]);

  // 复制地址
  const handleCopyAddress = async () => {
    const addressText = store.addressEn
      ? `${store.address}\n${store.addressEn}`
      : store.address;

    if (addressText) {
      try {
        await navigator.clipboard.writeText(addressText);
        setCopied(true);
        toast.success("地址已复制");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("复制失败");
      }
    }
  };

  // 解析营业时间
  const formatOpeningHours = () => {
    if (!store.openingHours) return null;
    if (typeof store.openingHours === "string") {
      return store.openingHours;
    }
    const hours = store.openingHours as Record<string, string>;
    return hours.default || hours.weekday || "10:00 - 18:00";
  };

  const mapUrl = getMapEmbedUrl();
  const mapsLink = getGoogleMapsLink();
  const openingHoursText = formatOpeningHours();

  if (!store.address && !store.latitude) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* 区块标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
        <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
          Store Location
        </span>
      </div>

      {/* 主内容区 - 地图叠加信息卡片 */}
      <div className="relative rounded-xl overflow-hidden">
        {/* 地图背景 */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] bg-wabi-100">
          {/* Google Maps iframe */}
          {mapUrl && !showFallback && (
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setMapLoaded(true)}
              className={`absolute inset-0 transition-opacity duration-500 ${
                mapLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}

          {/* 加载状态 */}
          {!mapLoaded && !showFallback && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <MapPin className="w-8 h-8 text-wabi-300" />
                <div className="h-2 w-20 bg-wabi-200 rounded" />
              </div>
            </div>
          )}

          {/* 自定义标记 - 地图中心点 */}
          {mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative -mt-6">
                {/* 阴影 */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full blur-sm" />
                {/* Pin */}
                <div className="w-8 h-8 bg-sakura-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                {/* 尖角 */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-sakura-500" />
              </div>
            </div>
          )}

          {/* Fallback - 优雅的静态展示 */}
          {showFallback && (
            <div className="absolute inset-0 bg-gradient-to-br from-wabi-50 via-sakura-50/30 to-wabi-100">
              {/* 装饰性网格线 */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, currentColor 1px, transparent 1px),
                    linear-gradient(to bottom, currentColor 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px",
                }}
              />
              {/* 中心装饰 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute -inset-8 bg-sakura-100/50 rounded-full blur-2xl" />
                  <MapPin className="relative w-12 h-12 text-sakura-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 浮动信息卡片 - 毛玻璃效果 */}
        <div className="absolute top-4 left-4 right-4 md:left-6 md:right-auto md:max-w-sm">
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/50 shadow-lg p-4">
            {/* 店铺名称 */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">
                  {store.name}
                </h3>
                {store.city && (
                  <span className="text-[12px] text-gray-500">{store.city}</span>
                )}
              </div>
              {/* 快速导航按钮 */}
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-sakura-500 hover:bg-sakura-600 text-white flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-md"
                  title="导航"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* 信息列表 - 紧凑布局 */}
            <div className="space-y-2 text-[13px]">
              {/* 地址 */}
              {store.address && (
                <button
                  onClick={handleCopyAddress}
                  className="w-full flex items-start gap-2.5 text-left group"
                >
                  <MapPin className="w-4 h-4 text-sakura-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 leading-snug group-hover:text-sakura-600 transition-colors">
                      {store.address}
                    </p>
                    {store.addressEn && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {store.addressEn}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </span>
                </button>
              )}

              {/* 营业时间 & 电话 - 横向排列 */}
              <div className="flex items-center gap-4 pt-1">
                {openingHoursText && (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-sakura-400" />
                    <span>{openingHoursText}</span>
                  </div>
                )}
                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-sakura-600 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-sakura-400" />
                    <span>{store.phone}</span>
                  </a>
                )}
              </div>

              {/* 交通提示 */}
              <div className="flex items-center gap-1.5 pt-1 text-[12px] text-wabi-500">
                <Train className="w-3.5 h-3.5" />
                <span>距离最近车站步行约 5 分钟</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
