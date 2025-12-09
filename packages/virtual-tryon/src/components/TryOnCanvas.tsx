'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, Share2, RotateCcw, Sparkles, MoveHorizontal, Instagram, ZoomIn, ZoomOut, Maximize2, X, Move, Sun, User, Eye, Ban } from 'lucide-react';
import type { GeneratedResult } from '../types';

// 和服文化小知识库
const KIMONO_TIPS = [
  {
    title: "穿着礼仪",
    text: "穿和服时切记“左襟在上”（左前右后），这才是生者的正确穿法哦。"
  },
  {
    title: "拍照技巧",
    text: "尝试微微侧身回眸，能完美展现和服颈部（项）的优美线条。"
  },
  {
    title: "仪态美学",
    text: "穿着和服时步幅要小，走内八字（Uchimata）会更有古典韵味。"
  },
  {
    title: "季节搭配",
    text: "樱花季适合粉色系振袖，而红叶季则推荐深红或金色的古典花纹。"
  },
  {
    title: "配饰点缀",
    text: "发饰（Kanzashi）是点睛之笔，选择与和服花色呼应的头饰最加分。"
  }
];

interface TryOnCanvasProps {
  userPhoto: string | null;
  resultImage: string | null;
  isGenerating: boolean;
  error: string | null;
  onPhotoUpload: (dataUrl: string) => void;
  onReset: () => void;
  onPhotoChange: () => void;
  generatedResults: GeneratedResult[];
  activeResultIndex: number;
  onResultChange: (index: number) => void;
  ImageComponent?: React.ComponentType<{
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
  }>;
  uploadHint?: string;
}

export default function TryOnCanvas({
  userPhoto,
  resultImage,
  isGenerating,
  error,
  onPhotoUpload,
  onReset,
  generatedResults,
  activeResultIndex,
  onResultChange,
  ImageComponent,
  uploadHint = '建议上传半身/全身照，保持面部清晰',
}: TryOnCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zoom/Pan State (Inspection Mode)
  const [isInspectionMode, setIsInspectionMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Tips state
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tips rotation
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setShowTip(false);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % KIMONO_TIPS.length);
        setShowTip(true);
      }, 500); // Wait for fade out
    }, 4000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle slider drag
  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleTouchStart = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

  // Handle Pan Drag
  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isInspectionMode) return;
    setIsPanning(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartPan({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handlePanMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isPanning || !isInspectionMode) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPan({
      x: clientX - startPan.x,
      y: clientY - startPan.y
    });
  }, [isPanning, isInspectionMode, startPan]);

  const handlePanEnd = () => setIsPanning(false);

  // Slider Global Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove]);

  // Pan Global Listeners
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handlePanMove);
      window.addEventListener('touchmove', handlePanMove, { passive: false });
      window.addEventListener('mouseup', handlePanEnd);
      window.addEventListener('touchend', handlePanEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handlePanMove);
      window.removeEventListener('touchmove', handlePanMove);
      window.removeEventListener('mouseup', handlePanEnd);
      window.removeEventListener('touchend', handlePanEnd);
    };
  }, [isPanning, handlePanMove]);

  // Use custom Image component or fallback to img
  const Img = ImageComponent || (({ src, alt, className }: { src: string; alt: string; fill?: boolean; className?: string }) => (
    <img src={src} alt={alt} className={`absolute inset-0 w-full h-full ${className || ''}`} />
  ));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => onPhotoUpload(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const downloadImage = async () => {
    if (!resultImage) return;
    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kimono-one-HD-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return blob; // Return blob for sharing
    } catch (err) {
      console.error('Download failed', err);
      // Fallback
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `kimono-one-HD-${Date.now()}.png`;
      link.click();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSocialShare = async (platform: string) => {
    if (!resultImage) return;

    // Mobile Native Share (if supported)
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await downloadImage();
        if (blob) {
          const file = new File([blob], 'kimono-share.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
             await navigator.share({
               files: [file],
               title: '我的和服试穿照',
               text: '这是我在 Kimono One 生成的和服试穿照，太好看了！ #KimonoOne #和服试穿',
             });
             return;
          }
        }
      } catch (err) {
        console.log('Native share failed, falling back', err);
      }
    }

    // Fallback: Download + Toast Guide
    await downloadImage();
    const appName = platform === 'xhs' ? '小红书' : platform === 'ig' ? 'Instagram' : '社交平台';
    showToast(`✨ 图片已保存！快打开${appName}发布吧`);
  };

  // Reset zoom on mode exit
  const toggleInspectionMode = () => {
    if (isInspectionMode) {
      // Exit
      setIsInspectionMode(false);
      setScale(1);
      setPan({ x: 0, y: 0 });
    } else {
      // Enter
      setIsInspectionMode(true);
      setScale(1.5); // Start with a bit of zoom
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 rounded-3xl overflow-hidden shadow-2xl shadow-stone-200 border border-white relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Canvas Area */}
      <div 
        className="flex-1 relative min-h-[400px] lg:min-h-0 group overflow-hidden"
        onMouseDown={handlePanStart}
        onTouchStart={handlePanStart}
      >
        
        {/* State 1: Empty - Upload with Visual Guide */}
        {!userPhoto && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100/50 transition-colors p-6"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500">
              <Upload className="w-8 h-8 text-stone-800" />
            </div>
            <h3 className="text-xl font-serif text-stone-900 mb-2">上传您的照片</h3>
            
            {/* 🆕 Visual Guide */}
            <div className="mt-8 bg-white/60 backdrop-blur rounded-2xl p-4 border border-stone-200 w-full max-w-md">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest text-center mb-4">最佳效果指南</p>
              <div className="flex justify-between gap-2 text-center">
                 <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-stone-600 font-medium">正面半身</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <Sun className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-stone-600 font-medium">光线充足</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                      <Ban className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-stone-600 font-medium">无遮挡</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Preview / Comparison / Inspection */}
        {userPhoto && (
          <div 
            ref={containerRef}
            className={`absolute inset-0 select-none overflow-hidden bg-stone-100 transition-cursor ${isInspectionMode && scale > 1 ? 'cursor-move' : ''}`}
          >
            {/* 
                Image Container Layer 
                Applies Transform for Zoom/Pan
            */}
            <div 
              className="absolute inset-0 w-full h-full transition-transform duration-75 ease-out origin-center"
              style={{
                transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`
              }}
            >
              {/* Layer A: Original Photo (Always visible in background) */}
              <Img
                src={userPhoto}
                alt="Original"
                fill
                className="object-contain"
              />
              
              {/* Layer B: Result Photo (Clipped or Full) */}
              {resultImage && !isGenerating && (
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ 
                    // In Inspection Mode: Show Full Image (Clip 0%)
                    // In Slider Mode: Clip based on sliderPosition
                    clipPath: isInspectionMode ? 'none' : `inset(0 ${100 - sliderPosition}% 0 0)` 
                  }}
                >
                  <Img
                    src={resultImage}
                    alt="Result"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            {/* --- Overlays UI (Not Zoomed) --- */}

            {/* Slider UI Elements (Only visible when NOT in inspection mode) */}
            {!isInspectionMode && resultImage && !isGenerating && (
              <>
                {/* Labels */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold tracking-wider text-stone-900 shadow-sm z-20">
                  AFTER
                </div>
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold tracking-wider text-white shadow-sm z-20">
                  BEFORE
                </div>

                {/* Slider Handle */}
                <div 
                  className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                  style={{ left: `${sliderPosition}%` }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-stone-100">
                    <MoveHorizontal className="w-5 h-5 text-stone-600" />
                  </div>
                </div>
              </>
            )}

            {/* Inspection Controls (Floating) */}
            {resultImage && !isGenerating && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                 {/* Mode Toggle / Zoom Controls */}
                 {isInspectionMode ? (
                   <div className="flex items-center bg-stone-900 text-white rounded-full p-1.5 shadow-xl animate-in slide-in-from-bottom-2 gap-1">
                      <button 
                        onClick={() => setScale(s => Math.max(1, s - 0.5))}
                        className="p-2 hover:bg-stone-700 rounded-full transition-colors"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                      <button 
                        onClick={() => setScale(s => Math.min(3, s + 0.5))}
                        className="p-2 hover:bg-stone-700 rounded-full transition-colors"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-stone-700 mx-1"></div>
                      <button 
                        onClick={toggleInspectionMode}
                        className="p-2 hover:bg-stone-700 rounded-full transition-colors bg-stone-800"
                        title="退出查看"
                      >
                        <X className="w-4 h-4" />
                      </button>
                   </div>
                 ) : (
                   <button 
                     onClick={toggleInspectionMode}
                     className="flex items-center gap-2 bg-white/90 backdrop-blur border border-stone-200 px-4 py-2 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform text-stone-800"
                   >
                     <Maximize2 className="w-4 h-4" />
                     查看细节
                   </button>
                 )}
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-30 flex flex-col items-center justify-center px-8 text-center">
                 <div className="relative mb-8">
                   <div className="w-20 h-20 border-2 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Sparkles className="w-6 h-6 text-pink-500 animate-pulse" />
                   </div>
                 </div>
                 
                 <p className="font-serif text-lg text-stone-800 mb-8 animate-pulse">正在为您量身定制...</p>
                 
                 {/* Tips Card */}
                 <div className={`
                   max-w-xs bg-white p-5 rounded-xl shadow-lg border border-stone-100
                   transition-all duration-500 transform
                   ${showTip ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                 `}>
                    <div className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-2">
                      💡 Kimono Tips · {KIMONO_TIPS[currentTipIndex].title}
                    </div>
                    <p className="text-stone-600 text-sm leading-relaxed font-serif">
                      {KIMONO_TIPS[currentTipIndex].text}
                    </p>
                 </div>
              </div>
            )}
            
            {/* Error Overlay */}
            {error && (
              <div className="absolute top-6 left-6 right-6 bg-red-50/90 backdrop-blur border border-red-100 p-4 rounded-xl text-red-800 text-sm z-40 flex items-start gap-3 shadow-lg animate-in slide-in-from-top-2">
                <span className="text-lg">⚠️</span>
                <div>
                   <p className="font-bold">出错了</p>
                   <p>{error}</p>
                </div>
              </div>
            )}

            {/* Toast Notification */}
            {toastMessage && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-stone-900/90 text-white px-6 py-3 rounded-full text-sm font-medium shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-4 z-50 flex items-center gap-2 pointer-events-none">
                <Check className="w-4 h-4 text-green-400" />
                {toastMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Toolbar */}
      <div className="bg-white border-t border-stone-100 p-4 flex flex-wrap items-center justify-between gap-4 relative z-10">
        {userPhoto ? (
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">更换照片</span>
            </button>
            
            {resultImage && !isGenerating && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Main Action: Download HD */}
                <button 
                  onClick={() => downloadImage()}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载高清原图
                </button>

                {/* Divider */}
                <div className="w-px h-8 bg-stone-200 hidden sm:block mx-1"></div>

                {/* Social Actions */}
                <div className="flex gap-1">
                   {/* Xiaohongshu (Style) */}
                   <button 
                     onClick={() => handleSocialShare('xhs')}
                     className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors relative group"
                     title="保存并分享到小红书"
                   >
                     <span className="font-bold text-xs tracking-tighter">小红书</span>
                     {/* Tooltip */}
                     <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                       发小红书
                     </span>
                   </button>

                   {/* Instagram */}
                   <button 
                     onClick={() => handleSocialShare('ig')}
                     className="p-2.5 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors relative group"
                     title="保存并分享到 Instagram"
                   >
                     <Instagram className="w-5 h-5" />
                     <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-stone-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                       发 INS
                     </span>
                   </button>

                   {/* Native Share / More */}
                   <button 
                     onClick={() => handleSocialShare('native')}
                     className="p-2.5 rounded-xl bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors relative group"
                     title="更多分享选项"
                   >
                     <Share2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div /> 
        )}

        {/* History Thumbs */}
        {generatedResults.length > 0 && (
          <div className="flex gap-2 overflow-x-auto max-w-full sm:max-w-[200px] scrollbar-hide py-1">
             {generatedResults.map((res, idx) => (
               <button
                 key={idx}
                 onClick={() => onResultChange(idx)}
                 className={`
                   relative w-10 h-10 rounded-lg overflow-hidden border transition-all flex-shrink-0
                   ${activeResultIndex === idx ? 'border-stone-800 ring-1 ring-stone-800' : 'border-stone-200 opacity-60 hover:opacity-100'}
                 `}
               >
                 <Img src={res.resultImage} alt="" fill className="object-cover" />
               </button>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple Check Icon for Toast
function Check({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
