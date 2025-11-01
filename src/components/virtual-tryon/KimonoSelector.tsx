'use client';

import { useState, useRef } from 'react';
import { Upload, Check } from 'lucide-react';
import Image from 'next/image';
import { KimonoItem } from '@/types/virtual-tryon';

interface KimonoSelectorProps {
  selectedKimono: KimonoItem | null;
  onSelect: (kimono: KimonoItem) => void;
}

// 默认的3张和服套餐图
const DEFAULT_KIMONOS: KimonoItem[] = [
  {
    id: 'kimono-1',
    name: '经典振袖和服',
    imageUrl: 'https://rakuraku-kimono.com/cdn/shop/files/3b87af7a616c53c1f242c08ff47b8077_17902940-ec9f-4a03-9dae-679ed520a205.jpg?v=1728712120&width=1000',
    source: 'plan',
  },
  {
    id: 'kimono-2',
    name: '优雅访问着',
    imageUrl: 'https://rakuraku-kimono.com/cdn/shop/files/48d1b96f20bac05a2b32d6cebe530aee.jpg?v=1720753466&width=1000',
    source: 'plan',
  },
  {
    id: 'kimono-3',
    name: '传统和服',
    imageUrl: 'https://rakuraku-kimono.com/cdn/shop/files/be1d873dddd226877dd6f621a9f25c37.jpg?v=1721895122&width=1000',
    source: 'plan',
  },
];

export default function KimonoSelector({ selectedKimono, onSelect }: KimonoSelectorProps) {
  const [customKimonos, setCustomKimonos] = useState<KimonoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newKimono: KimonoItem = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: dataUrl,
        source: 'upload',
      };
      setCustomKimonos(prev => [...prev, newKimono]);
      onSelect(newKimono);
    };
    reader.readAsDataURL(file);
  };

  // 合并默认和服 + 自定义和服 + 上传卡片
  const allKimonos = [...DEFAULT_KIMONOS, ...customKimonos];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">选择和服</h2>
        {selectedKimono && (
          <p className="text-xs text-gray-500 mt-1">
            已选择：{selectedKimono.name}
          </p>
        )}
      </div>

      {/* Kimono Grid - 包含上传卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
        {allKimonos.map((kimono) => (
          <button
            key={kimono.id}
            onClick={() => onSelect(kimono)}
            className={`
              group relative aspect-[3/4] rounded-xl overflow-hidden
              transition-all duration-200
              ${selectedKimono?.id === kimono.id
                ? 'ring-4 ring-sakura-600 shadow-2xl scale-[1.02]'
                : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-sakura-300 hover:shadow-lg'
              }
            `}
          >
            <Image
              src={kimono.imageUrl}
              alt={kimono.name}
              fill
              className={`
                object-cover transition-all duration-300
                ${selectedKimono?.id === kimono.id
                  ? 'brightness-100'
                  : 'brightness-95 group-hover:brightness-100 group-hover:scale-105'
                }
              `}
            />

            {/* Selection Indicator - 更明显 */}
            {selectedKimono?.id === kimono.id && (
              <div className="absolute top-2 right-2 w-8 h-8 bg-sakura-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
                <Check className="h-5 w-5 text-white stroke-[3]" />
              </div>
            )}

            {/* Selected Overlay */}
            {selectedKimono?.id === kimono.id && (
              <div className="absolute inset-0 bg-sakura-600/10 border-2 border-sakura-600/50 rounded-xl"></div>
            )}

            {/* Name Overlay */}
            <div className={`
              absolute inset-x-0 bottom-0 p-2
              ${selectedKimono?.id === kimono.id
                ? 'bg-gradient-to-t from-sakura-600 via-sakura-500/70 to-transparent'
                : 'bg-gradient-to-t from-black/70 via-black/40 to-transparent'
              }
            `}>
              <p className="text-white text-xs font-medium truncate">
                {kimono.name}
              </p>
            </div>
          </button>
        ))}

        {/* Upload Card */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 hover:border-sakura-400 transition-colors flex flex-col items-center justify-center gap-2 bg-white"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomUpload}
            className="hidden"
          />
          <div className="w-10 h-10 bg-sakura-50 rounded-full flex items-center justify-center">
            <Upload className="h-5 w-5 text-sakura-600" />
          </div>
          <p className="text-xs font-medium text-gray-700">上传和服</p>
          {customKimonos.length > 0 && (
            <span className="text-xs text-gray-400">
              已上传 {customKimonos.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
