'use client';

import { useState } from 'react';
import { Settings, Sparkles, Shirt, Image as ImageIcon, Menu, X, ChevronRight } from 'lucide-react';
import TryOnCanvas from './TryOnCanvas';
import KimonoSelector from './KimonoSelector';
import BackgroundPoseSelector from './BackgroundPoseSelector';
import PromptEditor from './PromptEditor';
import DebugPanel from './DebugPanel';
import { UNIFIED_TRYON_PROMPT } from '../lib/prompts';
import type { KimonoItem, GeneratedResult, DebugInfo, TryOnResponse } from '../types';
import type { BackgroundSelection, BackgroundPoseItem } from '../types/background';
import { getBackgroundLibrary } from '../lib/backgroundLibrary';

interface VirtualTryOnAppProps {
  apiEndpoint?: string;
  externalKimonos?: KimonoItem[];
  showDefaults?: boolean;
  ImageComponent?: React.ComponentType<{
    src: string;
    alt: string;
    fill?: boolean;
    className?: string;
  }>;
  onSuccess?: (result: TryOnResponse) => void;
  onError?: (error: Error) => void;
  header?: React.ReactNode;
  primaryColor?: string;
}

type Tab = 'kimono' | 'background';

export default function VirtualTryOnApp({
  apiEndpoint = '/api/virtual-tryon',
  externalKimonos = [],
  showDefaults = true,
  ImageComponent,
  onSuccess,
  onError,
  header,
}: VirtualTryOnAppProps) {
  // State
  const [activeTab, setActiveTab] = useState<Tab>('kimono');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedKimono, setSelectedKimono] = useState<KimonoItem | null>(null);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Background selection
  const [backgroundSelection, setBackgroundSelection] = useState<BackgroundSelection>(() => {
    const library = getBackgroundLibrary();
    const all = [...library.girl, ...library.boy, ...library.kid];
    return {
      useOriginalBackground: false,
      selectedBackground: all[0] || null,
    };
  });

  // Advanced options
  const [customPrompt, setCustomPrompt] = useState<string>(UNIFIED_TRYON_PROMPT);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [lastDuration, setLastDuration] = useState<number | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Helper: Image Compression
  const compressBase64Image = async (base64: string, w: number, h: number, q: number) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > w || height > h) {
          const ratio = Math.min(w / width, h / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', q));
        } else {
          reject(new Error('Canvas context failed'));
        }
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  const compressUrl = async (url: string, w: number, h: number, q: number) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return compressBase64Image(URL.createObjectURL(blob), w, h, q);
  };

  const handleGenerate = async () => {
    if (!userPhoto || !selectedKimono || !backgroundSelection.selectedBackground) {
      setError('请确保已上传照片，并选择了和服与背景');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDebugInfo(null);

    try {
      const compressedUser = await compressBase64Image(userPhoto, 1024, 1024, 0.8);
      
      // 优先使用 cleanImageUrl (无背景和服)
      const kimonoUrl = selectedKimono.cleanImageUrl || selectedKimono.imageUrl;
      let compressedKimono: string;
      if (kimonoUrl.startsWith('data:')) {
        compressedKimono = await compressBase64Image(kimonoUrl, 1024, 1024, 0.8);
      } else {
        compressedKimono = await compressUrl(kimonoUrl, 1024, 1024, 0.8);
      }

      const bg = backgroundSelection.selectedBackground;
      const bgUrl = bg.cleanBackgroundUrl || bg.imageUrl;
      const compressedBg = await compressUrl(bgUrl, 1024, 1024, 0.8);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceImageBase64: compressedUser,
          kimonoImageUrl: compressedKimono,
          cleanBackgroundUrl: compressedBg,
          backgroundPoseRef: { category: bg.category },
          options: { preserveExpression: false },
          customPrompt: customPrompt !== UNIFIED_TRYON_PROMPT ? customPrompt : undefined,
          planId: selectedKimono.planId,
        }),
      });

      const data: TryOnResponse = await response.json();
      if (!response.ok) throw new Error(data.message || '生成失败');

      if (data.debugInfo) setDebugInfo(data.debugInfo);
      if (data.duration) setLastDuration(data.duration);
      if (data.imageUrl) {
        setGeneratedResults(prev => [...prev, {
          kimono: selectedKimono,
          resultImage: data.imageUrl!,
          timestamp: new Date(),
          userPhoto: userPhoto,
        }]);
        setActiveResultIndex(generatedResults.length);
      }
      onSuccess?.(data);

    } catch (err: any) {
      console.error(err);
      setError(err.message || '生成失败');
      onError?.(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = userPhoto && selectedKimono && backgroundSelection.selectedBackground;
  const activeResult = generatedResults[activeResultIndex];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-stone-50 font-sans text-stone-900 overflow-hidden">
      
      {/* ---------------- Left Column: Canvas (45%) ---------------- */}
      <div className="lg:w-[45%] flex flex-col h-full border-r border-stone-200 relative z-10 bg-white">
        {/* Header - Mobile Only or Minimal Desktop */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-stone-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">👘</span>
            <span className="font-bold text-lg tracking-tight">ZEN STUDIO</span>
          </div>
          {/* Mobile Menu Toggle (Simplified for this demo) */}
        </div>

        {/* Canvas Container - Grows to fill space */}
        <div className="flex-1 p-6 lg:p-10 overflow-hidden flex flex-col">
          <TryOnCanvas
            userPhoto={activeResult?.userPhoto || userPhoto}
            resultImage={activeResult?.resultImage || null}
            isGenerating={isGenerating}
            error={error}
            onPhotoUpload={(url) => { setUserPhoto(url); setActiveResultIndex(-1); }}
            onReset={() => { setUserPhoto(null); setGeneratedResults([]); }}
            onPhotoChange={() => {}}
            generatedResults={generatedResults}
            activeResultIndex={activeResultIndex}
            onResultChange={setActiveResultIndex}
            ImageComponent={ImageComponent}
          />
        </div>

        {/* Floating Action Button / Bottom Bar */}
        <div className="p-6 lg:p-10 pt-0 bg-white">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={`
              w-full h-14 rounded-2xl font-bold text-lg tracking-wide shadow-xl
              flex items-center justify-center gap-3 transition-all duration-300
              ${canGenerate && !isGenerating
                ? 'bg-stone-900 text-white hover:bg-stone-800 hover:scale-[1.01] hover:-translate-y-1'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }
            `}
          >
             {isGenerating ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <Sparkles className="w-5 h-5" />
             )}
             <span>{isGenerating ? 'GENERATING...' : activeResult ? 'REGENERATE LOOK' : 'GENERATE LOOK'}</span>
          </button>
          
          {/* Status Line */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-400 font-medium uppercase tracking-wider">
             {!userPhoto && <span>1. Upload Photo</span>}
             {userPhoto && !selectedKimono && <span>2. Select Kimono</span>}
             {userPhoto && selectedKimono && !backgroundSelection.selectedBackground && <span>3. Select Background</span>}
             {canGenerate && <span>Ready to Create</span>}
          </div>
        </div>
      </div>


      {/* ---------------- Right Column: Resources (55%) ---------------- */}
      <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden relative">
        
        {/* Tabs */}
        <div className="h-16 flex items-center px-6 gap-8 border-b border-stone-200 bg-white/50 backdrop-blur sticky top-0 z-20">
          <button
            onClick={() => setActiveTab('kimono')}
            className={`
              h-full flex items-center gap-2 text-sm font-bold tracking-wide border-b-2 transition-all px-2
              ${activeTab === 'kimono' 
                ? 'border-stone-900 text-stone-900' 
                : 'border-transparent text-stone-400 hover:text-stone-600'
              }
            `}
          >
            <Shirt className="w-4 h-4" />
            KIMONO
          </button>

          <button
            onClick={() => setActiveTab('background')}
            className={`
              h-full flex items-center gap-2 text-sm font-bold tracking-wide border-b-2 transition-all px-2
              ${activeTab === 'background' 
                ? 'border-stone-900 text-stone-900' 
                : 'border-transparent text-stone-400 hover:text-stone-600'
              }
            `}
          >
            <ImageIcon className="w-4 h-4" />
            SCENE
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Settings Toggle */}
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2 rounded-full hover:bg-stone-200 transition-colors ${showAdvanced ? 'bg-stone-200 text-stone-900' : 'text-stone-400'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">
          
          {/* Tab Content */}
          <div className={activeTab === 'kimono' ? 'block' : 'hidden'}>
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-stone-900 mb-2">Select Your Style</h2>
              <p className="text-stone-500">Choose from our curated collection of authentic kimonos.</p>
            </div>
            <KimonoSelector
              selectedKimono={selectedKimono}
              onSelect={setSelectedKimono}
              externalKimonos={externalKimonos}
              showDefaults={showDefaults}
              ImageComponent={ImageComponent}
            />
          </div>

          <div className={activeTab === 'background' ? 'block' : 'hidden'}>
            <div className="mb-6">
              <h2 className="text-2xl font-serif text-stone-900 mb-2">Set the Scene</h2>
              <p className="text-stone-500">Place yourself in beautiful Japanese landmarks.</p>
            </div>
            <BackgroundPoseSelector
              selection={backgroundSelection}
              onSelectionChange={setBackgroundSelection}
              ImageComponent={ImageComponent}
            />
          </div>

          {/* Advanced Panel (Overlay or Bottom) */}
          {showAdvanced && (
             <div className="mt-8 pt-8 border-t border-stone-200 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-sm font-bold uppercase text-stone-400 mb-4">Developer Settings</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-xl border border-stone-200">
                    <PromptEditor prompt={customPrompt} onPromptChange={setCustomPrompt} readOnly={false} />
                  </div>
                  <DebugPanel debugInfo={debugInfo} duration={lastDuration} error={error} />
                </div>
             </div>
          )}
          
          {/* Bottom Padding for scroll */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}
