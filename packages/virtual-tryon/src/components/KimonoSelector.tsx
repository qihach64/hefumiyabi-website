'use client';

import { useState, useRef } from 'react';
import { Upload, Check, Plus } from 'lucide-react';
import type { KimonoItem } from '../types';
import type { KimonoCategory, KimonoLibraryItem } from '../types/kimono';
import { KIMONO_CATEGORIES, KIMONO_CATEGORY_LABELS } from '../types/kimono';
import { getKimonosByCategory, getKimonoCounts } from '../lib/kimonoLibrary';

interface KimonoSelectorProps {
  selectedKimono: KimonoItem | null;
  onSelect: (kimono: KimonoItem) => void;
  externalKimonos?: KimonoItem[];
  showDefaults?: boolean;
  defaultCategory?: KimonoCategory;
  ImageComponent?: React.ComponentType<{
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
  }>;
}

function toKimonoItem(item: KimonoLibraryItem): KimonoItem {
  return {
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    cleanImageUrl: item.cleanImageUrl, // 确保传递 cleanImageUrl
    source: 'plan',
  };
}

export default function KimonoSelector({
  selectedKimono,
  onSelect,
  externalKimonos = [],
  showDefaults = true,
  defaultCategory = 'female',
  ImageComponent,
}: KimonoSelectorProps) {
  const [customKimonos, setCustomKimonos] = useState<KimonoItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<KimonoCategory>(defaultCategory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

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

  const libraryKimonos = showDefaults ? getKimonosByCategory(activeCategory).map(toKimonoItem) : [];
  const kimonoCounts = getKimonoCounts();
  const displayKimonos = [...externalKimonos, ...libraryKimonos, ...(activeCategory === 'female' ? customKimonos : [])];

  const Img = ImageComponent || (({ src, alt, className }: { src: string; alt: string; fill?: boolean; className?: string }) => (
    <img src={src} alt={alt} className={`absolute inset-0 w-full h-full ${className || ''}`} />
  ));

  return (
    <div className="space-y-6">
      {/* Categories - Minimalist Pills */}
      {showDefaults && (
        <div className="flex flex-wrap gap-2">
          {KIMONO_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`
                px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all
                ${activeCategory === category
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-800'
                }
              `}
            >
              {KIMONO_CATEGORY_LABELS[category]}
              <span className="ml-2 opacity-50 text-[10px]">{kimonoCounts[category]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Grid - Clean & Minimal */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Upload Card */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[3/4] rounded-xl border border-dashed border-stone-300 hover:border-stone-900 hover:bg-stone-50 transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
            <Plus className="w-5 h-5 text-stone-600" />
          </div>
          <span className="text-xs font-bold text-stone-500 uppercase">Upload Custom</span>
        </button>

        {displayKimonos.map((kimono) => {
          const isSelected = selectedKimono?.id === kimono.id;
          return (
            <button
              key={kimono.id}
              onClick={() => onSelect(kimono)}
              className={`
                group relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-100
                transition-all duration-300
                ${isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : 'hover:shadow-lg hover:-translate-y-1'}
              `}
            >
              <Img
                src={kimono.imageUrl}
                alt={kimono.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay on Hover/Select */}
              <div className={`
                absolute inset-0 bg-black/20 transition-opacity duration-300
                ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `} />

              {/* Name Tag */}
              <div className={`
                absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent
                transition-opacity duration-300
                ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `}>
                <p className="text-white text-xs font-medium truncate">{kimono.name}</p>
              </div>

              {/* Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
