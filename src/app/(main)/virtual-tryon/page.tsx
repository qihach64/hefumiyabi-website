"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Sparkles, Download, Share2, RotateCcw, Check } from "lucide-react";
import Image from "next/image";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface Kimono {
  id: string;
  name: string;
  images: string[];
  color: string | null;
  pattern: string | null;
  season: string | null;
}

const steps: Step[] = [
  { id: 1, title: "上传照片", description: "上传您的正面照片" },
  { id: 2, title: "选择和服", description: "挑选心仪的和服款式" },
  { id: 3, title: "AI 生成", description: "等待 AI 处理" },
  { id: 4, title: "查看效果", description: "预览试穿效果" },
];

export default function VirtualTryOnPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedKimono, setSelectedKimono] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [kimonos, setKimonos] = useState<Kimono[]>([]);
  const [isLoadingKimonos, setIsLoadingKimonos] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取和服数据
  useEffect(() => {
    async function fetchKimonos() {
      try {
        const response = await fetch("/api/kimonos/featured");
        if (response.ok) {
          const data = await response.json();
          setKimonos(data);
        }
      } catch (error) {
        console.error("Failed to fetch kimonos:", error);
      } finally {
        setIsLoadingKimonos(false);
      }
    }
    fetchKimonos();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setCurrentStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKimonoSelect = (kimonoId: string) => {
    setSelectedKimono(kimonoId);
  };

  const handleGenerate = async () => {
    setCurrentStep(3);
    setIsProcessing(true);
    setProcessingProgress(0);

    // 模拟 AI 处理过程
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setCurrentStep(4);
          // Demo: 使用选中的和服图片作为结果（实际应该是 AI 生成的图片）
          const kimono = kimonos.find((k) => k.id === selectedKimono);
          setResultImage(kimono?.images[0] || uploadedImage);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setUploadedImage(null);
    setSelectedKimono(null);
    setResultImage(null);
    setProcessingProgress(0);
  };

  const handleDownload = () => {
    // 实际实现中应该下载生成的图片
    alert("下载功能（Demo）");
  };

  const handleShare = () => {
    alert("分享功能（Demo）");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI 技术驱动
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI 虚拟试穿
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              使用人工智能技术，让您在预约前就能看到穿上和服的效果
            </p>
          </div>

          {/* Progress Steps */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        currentStep > step.id
                          ? "bg-green-500 text-white"
                          : currentStep === step.id
                          ? "bg-purple-500 text-white ring-4 ring-purple-200"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            {/* Step 1: Upload Photo */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">上传您的照片</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    请上传一张正面清晰的照片，确保光线充足，背景简单
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
                  >
                    选择照片
                  </button>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    <div className="p-4 border-2 border-dashed rounded-lg">
                      <div className="text-green-600 text-2xl mb-2">✓</div>
                      <p className="text-sm font-medium">正面清晰</p>
                      <p className="text-xs text-muted-foreground">
                        面向镜头，五官清晰
                      </p>
                    </div>
                    <div className="p-4 border-2 border-dashed rounded-lg">
                      <div className="text-green-600 text-2xl mb-2">✓</div>
                      <p className="text-sm font-medium">光线充足</p>
                      <p className="text-xs text-muted-foreground">
                        自然光或明亮环境
                      </p>
                    </div>
                    <div className="p-4 border-2 border-dashed rounded-lg">
                      <div className="text-green-600 text-2xl mb-2">✓</div>
                      <p className="text-sm font-medium">背景简单</p>
                      <p className="text-xs text-muted-foreground">
                        纯色或简洁背景
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Kimono */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">选择和服款式</h2>
                  <p className="text-muted-foreground">
                    从以下款式中选择您喜欢的和服
                  </p>
                </div>

                {isLoadingKimonos ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-muted-foreground">加载和服款式中...</p>
                  </div>
                ) : kimonos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">暂无可用的和服款式</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {kimonos.map((kimono) => (
                      <div
                        key={kimono.id}
                        onClick={() => handleKimonoSelect(kimono.id)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
                          selectedKimono === kimono.id
                            ? "border-purple-500 ring-4 ring-purple-200"
                            : "border-transparent hover:border-purple-300"
                        }`}
                      >
                        <div className="aspect-[3/4] relative bg-gray-100">
                          {kimono.images.length > 0 && (
                            <Image
                              src={kimono.images[0]}
                              alt={kimono.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                        {selectedKimono === kimono.id && (
                          <div className="absolute top-2 right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="p-3 bg-white">
                          <p className="font-medium text-sm truncate">{kimono.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {kimono.color || kimono.pattern || "和服"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition-all"
                  >
                    重新上传
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedKimono}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    开始生成
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Processing */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-xl p-12">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">AI 正在生成试穿效果</h2>
                  <p className="text-muted-foreground mb-8">
                    正在使用人工智能技术为您生成专属的试穿效果图...
                  </p>

                  <div className="max-w-md mx-auto mb-6">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {processingProgress}% 完成
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                    <div className="flex items-center gap-2 justify-center text-muted-foreground">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      人体姿态检测
                    </div>
                    <div className="flex items-center gap-2 justify-center text-muted-foreground">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      和服图层叠加
                    </div>
                    <div className="flex items-center gap-2 justify-center text-muted-foreground">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                      效果优化渲染
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Result */}
            {currentStep === 4 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center">
                  <h2 className="text-2xl font-bold mb-2">✨ 试穿效果生成成功！</h2>
                  <p className="text-purple-100">
                    这就是您穿上{" "}
                    {kimonos.find((k) => k.id === selectedKimono)?.name}{" "}
                    的效果
                  </p>
                </div>

                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* 原始照片 */}
                    <div>
                      <p className="text-sm font-medium mb-3 text-muted-foreground">
                        原始照片
                      </p>
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 bg-gray-100">
                        {uploadedImage && (
                          <Image
                            src={uploadedImage}
                            alt="Original"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                    </div>

                    {/* AI 生成结果 */}
                    <div>
                      <p className="text-sm font-medium mb-3 text-purple-600">
                        AI 试穿效果 ✨
                      </p>
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-4 border-purple-500 shadow-lg bg-gray-100">
                        {resultImage && (
                          <Image
                            src={resultImage}
                            alt="Result"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                        <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500 text-white text-xs rounded-full">
                          AI 生成
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      下载图片
                    </button>
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-semibold hover:bg-pink-600 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      分享
                    </button>
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重新试穿
                    </button>
                  </div>

                  {/* Next Steps */}
                  <div className="mt-8 p-6 bg-purple-50 rounded-xl">
                    <p className="font-semibold mb-3 text-center">
                      喜欢这个效果吗？
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <a
                        href="/plans"
                        className="px-6 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-all"
                      >
                        立即预约
                      </a>
                      <a
                        href="/kimonos"
                        className="px-6 py-2 border-2 border-purple-600 text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-all"
                      >
                        浏览更多和服
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">AI 试穿的优势</h2>
            <p className="text-muted-foreground">
              先进的人工智能技术，让您更轻松地做出选择
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">AI 智能生成</h3>
              <p className="text-sm text-muted-foreground">
                使用最新的深度学习技术，精准还原穿着效果
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">节省时间</h3>
              <p className="text-sm text-muted-foreground">
                无需到店试穿，在家就能看到效果
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">保存分享</h3>
              <p className="text-sm text-muted-foreground">
                下载图片，与朋友家人分享您的选择
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">常见问题</h2>

            <div className="space-y-4">
              <details className="group bg-white rounded-lg border p-6">
                <summary className="font-semibold cursor-pointer">
                  AI 试穿准确吗？
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  我们的 AI
                  技术经过大量训练，能够较为准确地模拟试穿效果。但实际效果可能会因光线、角度等因素略有差异，建议结合店内试穿做最终决定。
                </p>
              </details>

              <details className="group bg-white rounded-lg border p-6">
                <summary className="font-semibold cursor-pointer">
                  我的照片会被保存吗？
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  我们非常重视您的隐私。上传的照片仅用于生成试穿效果，不会被永久存储或用于其他用途。
                </p>
              </details>

              <details className="group bg-white rounded-lg border p-6">
                <summary className="font-semibold cursor-pointer">
                  生成需要多长时间？
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  通常只需要 10-30 秒。处理时间可能因服务器负载而略有不同。
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
