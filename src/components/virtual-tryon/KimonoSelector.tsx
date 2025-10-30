'use client';

import { useState, useRef } from 'react';
import { Upload, Check } from 'lucide-react';
import Image from 'next/image';
import { KimonoItem } from '@/types/virtual-tryon';

interface KimonoSelectorProps {
  selectedKimono: KimonoItem | null;
  onSelect: (kimono: KimonoItem) => void;
}

// 默认的6张和服套餐图（来自真实套餐数据）
const DEFAULT_KIMONOS: KimonoItem[] = [
  {
    id: 'cmgvcwzic002cgy6jiyq4id30',
    name: '染川豪华振袖',
    imageUrl: 'https://cdn.sanity.io/images/u9jvdp7a/staging/870d812c77d11d10776185c8808e8739fc9c022f-1836x1172.jpg?fm=webp&fit=crop&w=800',
    planId: 'cmgvcwzic002cgy6jiyq4id30',
    source: 'plan',
  },
  {
    id: 'cmgvcwzbs002agy6jxe1z3adb',
    name: '京都不染川高级访问服',
    imageUrl: 'https://cdn.sanity.io/images/u9jvdp7a/staging/2eeaa46801f76c38ec0c3cb648a7c6840c5d65cb-1856x1634.jpg?fm=webp&fit=crop&w=800',
    planId: 'cmgvcwzbs002agy6jxe1z3adb',
    source: 'plan',
  },
  {
    id: 'cmgvcwz510028gy6j90eqr5dd',
    name: '京都雅豪华振袖',
    imageUrl: 'https://cdn.sanity.io/images/u9jvdp7a/staging/ad7aef37510c62923a8342a9838dc3de658e1b8f-3204x2136.jpg?fm=webp&fit=crop&w=800',
    planId: 'cmgvcwz510028gy6j90eqr5dd',
    source: 'plan',
  },
  {
    id: 'cmgvcwyye0026gy6jq70owwqy',
    name: '京都雅高级訪問着',
    imageUrl: 'https://cdn.sanity.io/images/u9jvdp7a/staging/d1fca2445dae7d629110bb663082d9335e4d350b-1206x1510.jpg?fm=webp&fit=crop&w=800',
    planId: 'cmgvcwyye0026gy6jq70owwqy',
    source: 'plan',
  },
  {
    id: 'cmgvcwyrs0024gy6jc1i375tw',
    name: '京都不染川正絹振袖',
    imageUrl: 'https://cdn.sanity.io/images/u9jvdp7a/staging/e0b5996961173100efafa7a0f7bc2e752250e2b8-1080x714.jpg?fm=webp&fit=crop&w=800',
    planId: 'cmgvcwyrs0024gy6jc1i375tw',
    source: 'plan',
  },
  {
    id: 'cmgvcwyl50022gy6jh66g5z49',
    name: '京都雅訪問着',
    imageUrl: 'https://cdn.sanity.io/images/u9jvdp7a/staging/a0c450b07e897b55982345da50b36c28af0f6f0e-600x400.jpg?fm=webp&fit=crop&w=800',
    planId: 'cmgvcwyl50022gy6jh66g5z49',
    source: 'plan',
  },
];

export default function KimonoSelector({ selectedKimono, onSelect }: KimonoSelectorProps) {
  const [customKimonos, setCustomKimonos] = useState<KimonoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
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
      setActiveTab('custom');
      onSelect(newKimono);
    };
    reader.readAsDataURL(file);
  };

  const allKimonos = activeTab === 'default' ? DEFAULT_KIMONOS : customKimonos;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-900">
        选择和服
      </h2>

      {/* Tabs - Airbnb 风格 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('default')}
          className={`
            px-4 py-2.5 text-sm font-medium transition-colors relative
            ${activeTab === 'default'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          套餐和服
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`
            px-4 py-2.5 text-sm font-medium transition-colors relative
            ${activeTab === 'custom'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          上传和服
          {customKimonos.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
              {customKimonos.length}
            </span>
          )}
        </button>
      </div>

      {/* Upload Button (for custom tab) */}
      {activeTab === 'custom' && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors flex items-center justify-center gap-2 text-gray-700 font-medium bg-gray-50"
        >
          <Upload className="h-5 w-5" />
          <span>上传和服图片</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomUpload}
            className="hidden"
          />
        </button>
      )}

      {/* Kimono Grid - Airbnb 风格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
        {allKimonos.length === 0 ? (
          <div className="col-span-2 sm:col-span-3 text-center py-12 text-gray-500">
            <p className="text-sm">还没有上传的和服</p>
            <p className="text-xs mt-1 text-gray-400">点击上方按钮上传</p>
          </div>
        ) : (
          allKimonos.map((kimono) => (
            <button
              key={kimono.id}
              onClick={() => onSelect(kimono)}
              className={`
                group relative aspect-[3/4] rounded-xl overflow-hidden
                transition-all duration-200
                ${selectedKimono?.id === kimono.id
                  ? 'ring-2 ring-sakura-600 shadow-lg'
                  : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md'
                }
              `}
            >
              <Image
                src={kimono.imageUrl}
                alt={kimono.name}
                fill
                className={`
                  object-cover transition-transform duration-300
                  ${selectedKimono?.id === kimono.id ? '' : 'group-hover:scale-105'}
                `}
              />

              {/* Selection Indicator - Airbnb 风格 */}
              {selectedKimono?.id === kimono.id && (
                <div className="absolute top-2 right-2 w-7 h-7 bg-sakura-600 rounded-full flex items-center justify-center shadow-md">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Name Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2.5">
                <p className="text-white text-xs font-medium truncate">
                  {kimono.name}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-900 mb-2">
          💡 选择提示
        </p>
        <ul className="text-xs text-gray-600 space-y-1.5">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>纯和服照片</strong>效果最佳（无人物）</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>清晰展示和服的颜色和图案</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>避免过度遮挡或折叠</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
