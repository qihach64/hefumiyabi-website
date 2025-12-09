'use client';

import { Check } from 'lucide-react';
import type {
  BackgroundPoseItem,
  BackgroundSelection
} from '../types/background';
import {
  getBackgroundLibrary,
} from '../lib/backgroundLibrary';

interface BackgroundPoseSelectorProps {
  selection: BackgroundSelection;
  onSelectionChange: (selection: BackgroundSelection) => void;
  ImageComponent?: React.ComponentType<{
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
  }>;
}

export default function BackgroundPoseSelector({
  selection,
  onSelectionChange,
  ImageComponent,
}: BackgroundPoseSelectorProps) {
  const library = getBackgroundLibrary();
  const allBackgrounds: BackgroundPoseItem[] = [
    ...library.girl,
    ...library.boy,
    ...library.kid,
  ];

  const handleSelectBackground = (bg: BackgroundPoseItem) => {
    onSelectionChange({
      useOriginalBackground: false,
      selectedBackground: bg,
    });
  };

  const Img = ImageComponent || (({ src, alt, className }: { src: string; alt: string; fill?: boolean; className?: string }) => (
    <img src={src} alt={alt} className={`absolute inset-0 w-full h-full ${className || ''}`} />
  ));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {allBackgrounds.map((bg) => {
          const isSelected = selection.selectedBackground?.id === bg.id;
          return (
            <button
              key={bg.id}
              onClick={() => handleSelectBackground(bg)}
              className={`
                group relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-100
                transition-all duration-300
                ${isSelected ? 'ring-2 ring-stone-900 ring-offset-2' : 'hover:shadow-lg hover:-translate-y-1'}
              `}
            >
              <Img
                src={bg.cleanBackgroundUrl || bg.imageUrl}
                alt={bg.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Overlay */}
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
                <p className="text-white text-xs font-medium truncate">{bg.name}</p>
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
