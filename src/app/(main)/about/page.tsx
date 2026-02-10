import Link from "next/link";
import { Heart, Award, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero 区域 - Airbnb 风格 + 樱花美学 */}
      <section className="relative bg-hero-gradient overflow-hidden">
        {/* 樱花装饰图案 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
              关于江戸和装工房雅
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              传承和服文化，让每一位游客都能体验日本传统之美
            </p>
          </div>
        </div>
      </section>

      {/* 公司介绍 - Airbnb 风格 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  我们的故事
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    江戸和装工房雅成立于2010年，是一家专注于和服租赁服务的专业公司。我们在东京浅草和京都清水寺附近设有多家店铺，为来自世界各地的游客提供优质的和服体验服务。
                  </p>
                  <p>
                    我们相信，和服不仅仅是一件衣服，更是日本文化的重要载体。通过穿着和服游览东京浅草寺、京都清水寺等名胜古迹，您可以更深入地感受日本的传统文化和历史韵味。
                  </p>
                  <p>
                    多年来，我们已经服务了超过10,000名来自世界各地的客户，收获了无数好评。我们将继续秉承"专业、用心、创新"的理念，为每一位客户提供难忘的和服体验。
                  </p>
                </div>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sakura-50 border border-gray-200 shadow-sm">
                <div className="flex h-full items-center justify-center text-gray-600">
                  {/* 占位符 - 可以替换为实际图片 */}
                  <div className="text-center p-8">
                    <span className="text-6xl mb-4 block">👘</span>
                    <p className="text-sm font-medium">和服文化传承</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 核心价值 - 樱花主题 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">我们的价值观</h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              专业、用心、创新是我们的核心理念
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
                <Heart className="w-8 h-8 text-sakura-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">用心服务</h3>
              <p className="text-sm text-gray-600">
                每一位客户都是我们的贵宾，我们用心对待每一个细节
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
                <Award className="w-8 h-8 text-sakura-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">专业品质</h3>
              <p className="text-sm text-gray-600">
                专业的着装团队，严格的品质把控，确保最佳体验
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
                <Users className="w-8 h-8 text-sakura-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">文化传承</h3>
              <p className="text-sm text-gray-600">
                传承和服文化，让更多人了解和喜爱日本传统服饰
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
                <Globe className="w-8 h-8 text-sakura-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">国际视野</h3>
              <p className="text-sm text-gray-600">
                提供多语言服务，让全世界的游客都能轻松体验
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 服务特色 - Airbnb 风格卡片 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">服务特色</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">丰富款式</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                超过100款精美和服供您选择，从传统古典到现代时尚，从素雅简约到华丽精致，总有一款适合您。
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">💇</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">专业着装</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                经验丰富的着装师和发型师团队，为您提供专业的和服着装和发型设计服务，让您的体验更加完美。
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">便利位置</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                东京浅草和京都清水寺附近的便利位置，让您可以轻松游览周边的名胜古迹，拍摄美丽的照片。
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">多语言服务</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                提供中文、英语、日语等多语言服务，工作人员热情友好，消除语言障碍，让您的体验更加顺畅。
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">优惠价格</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                在线预订享受优惠价格，多种套餐可选，满足不同预算需求。情侣、团体套餐更加实惠。
              </p>
            </div>

            <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-4xl mb-4">🎒</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">免费寄存</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                提供免费行李寄存服务，让您可以轻装游览，无需担心行李负担，尽情享受和服体验之旅。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 团队介绍 - 樱花主题 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">专业团队</h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              我们的团队由经验丰富的和服专家组成
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
                <span className="text-4xl">👔</span>
              </div>
              <h3 className="text-lg font-semibold mb-1 text-gray-900">着装师</h3>
              <p className="text-sm text-gray-600 mb-2">
                10年以上经验
              </p>
              <p className="text-xs text-gray-600">
                专业的和服着装技术，确保每一件和服都穿着得体舒适
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
                <span className="text-4xl">💅</span>
              </div>
              <h3 className="text-lg font-semibold mb-1 text-gray-900">发型师</h3>
              <p className="text-sm text-gray-600 mb-2">
                专业美发资格
              </p>
              <p className="text-xs text-gray-600">
                根据和服风格设计搭配的发型，让您的整体造型更加完美
              </p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-sakura-100 flex items-center justify-center">
                <span className="text-4xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold mb-1 text-gray-900">摄影师</h3>
              <p className="text-sm text-gray-600 mb-2">
                专业摄影团队
              </p>
              <p className="text-xs text-gray-600">
                部分高级套餐包含专业摄影服务，为您留下珍贵的回忆
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - 樱花渐变 */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary/90 to-accent/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTZjMCAyLjIxLTEuNzkgNC00IDRzLTQtMS43OS00LTQgMS43OS00IDQtNCA0IDEuNzkgNCA0em0tNCAyOGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="container text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            准备开始您的和服体验了吗？
          </h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            立即预约，让我们为您打造难忘的日本文化体验
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90 shadow-lg w-full sm:w-auto min-w-[160px]">
                立即预约
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white/10 w-full sm:w-auto min-w-[160px]">
                浏览和服
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
