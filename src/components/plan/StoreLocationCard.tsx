"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Phone, Clock, Copy, ExternalLink, Check } from "lucide-react";
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
  const getMapEmbedUrl = useCallback(() => {
    if (store.latitude && store.longitude) {
      // 优先使用经纬度
      return `https://maps.google.com/maps?q=${store.latitude},${store.longitude}&z=16&output=embed`;
    } else if (store.address) {
      // 备选使用地址搜索
      return `https://maps.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`;
    }
    return null;
  }, [store.latitude, store.longitude, store.address]);

  // 构建 Google Maps 导航链接
  const getGoogleMapsLink = useCallback(() => {
    if (store.latitude && store.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
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
    // 假设 openingHours 是简单字符串或 JSON
    if (typeof store.openingHours === "string") {
      return store.openingHours;
    }
    // 如果是 JSON 对象，提取默认时间
    const hours = store.openingHours as Record<string, string>;
    return hours.default || hours.weekday || "10:00 - 18:00";
  };

  const mapUrl = getMapEmbedUrl();
  const mapsLink = getGoogleMapsLink();
  const openingHoursText = formatOpeningHours();

  // 如果没有地址信息，不显示组件
  if (!store.address && !store.latitude) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl border border-wabi-200 overflow-hidden">
      {/* 标题区域 */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
          <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
            Store Location
          </span>
        </div>
        <h3 className="text-[18px] font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sakura-500" />
          {store.name}
          {store.city && (
            <span className="text-[14px] font-normal text-gray-500">
              · {store.city}
            </span>
          )}
        </h3>
      </div>

      {/* 地图区域 */}
      <div className="px-6">
        <div className="relative aspect-[16/9] md:aspect-[2/1] rounded-xl overflow-hidden bg-wabi-100">
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

          {/* 加载状态 - Skeleton */}
          {!mapLoaded && !showFallback && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-wabi-200" />
                <div className="h-3 w-24 bg-wabi-200 rounded" />
              </div>
            </div>
          )}

          {/* Fallback - 精美地址卡片 */}
          {showFallback && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sakura-50 to-wabi-50 p-6">
              <div className="text-center max-w-sm">
                {/* 日本地图装饰 */}
                <div className="text-[48px] mb-4 opacity-30">🗾</div>

                {/* 店铺名称 */}
                <h4 className="text-[16px] font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                  <span className="text-sakura-500">✦</span>
                  {store.name}
                </h4>

                {/* 地址 */}
                <div className="space-y-1 mb-4">
                  <p className="text-[14px] text-gray-700 leading-relaxed">
                    {store.address}
                  </p>
                  {store.addressEn && (
                    <p className="text-[12px] text-gray-500">
                      {store.addressEn}
                    </p>
                  )}
                </div>

                {/* 复制地址按钮 */}
                <button
                  onClick={handleCopyAddress}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-wabi-200 text-[13px] text-gray-600 hover:border-sakura-300 hover:text-sakura-600 transition-all duration-300"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      复制地址
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 店铺信息区域 */}
      <div className="px-6 py-4 space-y-3">
        {/* 地址 */}
        {store.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-sakura-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[14px] text-gray-700 leading-relaxed">
                {store.address}
              </p>
              {store.addressEn && (
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {store.addressEn}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 电话 */}
        {store.phone && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-sakura-500 flex-shrink-0" />
            <a
              href={`tel:${store.phone}`}
              className="text-[14px] text-gray-700 hover:text-sakura-600 transition-colors"
            >
              {store.phone}
            </a>
          </div>
        )}

        {/* 营业时间 */}
        {openingHoursText && (
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-sakura-500 flex-shrink-0" />
            <span className="text-[14px] text-gray-700">{openingHoursText}</span>
          </div>
        )}
      </div>

      {/* 导航按钮 */}
      {mapsLink && (
        <div className="px-6 pb-6">
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-sakura-600 hover:bg-sakura-700 text-white text-[14px] font-medium transition-all duration-300 hover:shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            在 Google Maps 中打开
          </a>
        </div>
      )}
    </section>
  );
}
