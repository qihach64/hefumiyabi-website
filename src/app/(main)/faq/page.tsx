import Link from "next/link";
import { ChevronDown } from "lucide-react";
import EmbeddedChatbot from "@/components/EmbeddedChatbot";
import { Button } from "@/components/ui";

// FAQ 数据结构
const faqCategories = [
  {
    id: "dressing",
    title: "关于着装",
    icon: "👘",
    faqs: [
      {
        question: "着装通常需要多长时间？",
        answer:
          "女士和服着装大约需要30分钟，男士约需20分钟。如果需要发型设计服务，女士额外需要20-30分钟。我们建议您在预约时间提前15分钟到店，以确保有充足的时间完成着装。",
      },
      {
        question: "孕妇可以体验和服着装吗？",
        answer:
          "可以的。我们有经验丰富的着装师，可以根据孕妇的身体状况调整着装方式，确保舒适安全。建议选择宽松一些的和服款式，并在预约时告知我们您的孕期情况，以便我们做好准备。",
      },
      {
        question: "如果我自己带衣服或配饰，还能接受着装服务吗？",
        answer:
          "可以的。如果您有自己的和服、腰带或其他配饰，我们的专业着装师可以帮您穿戴。但请注意，自带物品的着装服务可能需要额外收费。建议提前联系我们确认。",
      },
      {
        question: "有发饰可以租赁吗？",
        answer:
          "有的。我们提供多种发饰供您选择，包括簪子、花簪、蝴蝶结等。部分套餐已包含发饰，如需额外租赁其他发饰，可能需要支付少量费用。我们的发型师会根据您的和服风格推荐合适的发饰。",
      },
      {
        question: "儿童服装有哪些尺寸？",
        answer:
          "我们的儿童和服适合3-12岁的儿童，提供多个尺寸选择。具体尺寸包括：S（3-5岁）、M（6-8岁）、L（9-12岁）。我们的工作人员会根据孩子的身高体型推荐合适的尺寸。",
      },
      {
        question: "有特殊的尺寸限制吗？",
        answer:
          "我们提供从XS到XXL的多种尺寸，适合身高145cm-185cm、体重40kg-100kg的客人。如果您的体型比较特殊，建议提前联系我们确认是否有合适的和服。我们也可以根据需要准备特殊尺寸。",
      },
    ],
  },
  {
    id: "return",
    title: "关于归还",
    icon: "🔄",
    faqs: [
      {
        question: "如果租赁的和服或配件被弄脏或损坏怎么办？",
        answer:
          "正常使用过程中的轻微污渍（如灰尘、少量汗渍）无需额外赔偿，我们会进行专业清洗。但如果出现严重污渍（如油渍、墨渍）或损坏（如撕裂、破洞），可能需要支付清洗费或赔偿金。建议购买我们的损坏保险（500日元），可以免除大部分赔偿责任。",
      },
      {
        question: "如果不能按时归还或希望保留到第二天怎么办？",
        answer:
          "如需延长租赁时间，请在归还前联系店铺工作人员。延长费用根据套餐类型计算，通常为原价的30-50%/天。部分店铺提供次日归还服务，需在预约时说明。如果未经允许延迟归还，可能会收取额外费用。",
      },
    ],
  },
  {
    id: "rental",
    title: "关于租赁",
    icon: "📝",
    faqs: [
      {
        question: "租赁期限是多久？",
        answer:
          "标准租赁期限为8小时，从您完成着装离店开始计算。例如，如果您早上10点完成着装，需要在当日18点前归还。我们也提供全天租赁（至闭店时间）和次日归还等选项，具体请在预约时确认。",
      },
      {
        question: "接待时间到几点？",
        answer:
          "我们的营业时间为周一至周五 9:00-18:00，周末和节假日 9:00-19:00。最后入店时间为闭店前1小时。建议预约上午时段，这样可以有充足的时间游览。旺季（樱花季、红叶季）建议提前2周预约。",
      },
      {
        question: "可以寄存衣物和行李吗？",
        answer:
          "可以的。我们为所有租赁客户提供免费行李寄存服务。您可以将随身行李、换下的衣物等寄存在店内，归还和服时取回。贵重物品请随身携带，我们不对寄存物品的丢失负责。",
      },
      {
        question: "可以使用信用卡或其他电子货币吗？",
        answer:
          "可以。我们支持多种支付方式，包括：现金、信用卡（Visa、MasterCard、JCB、American Express）、支付宝、微信支付、PayPay等。在线预约时也可以提前支付定金。",
      },
      {
        question: "可以空手来吗？",
        answer:
          "完全可以！这正是我们服务的优势。我们提供和服、腰带、足袋、草履、包袋等全套配件，您无需携带任何东西。只需带上相机，记录美好时刻即可。建议穿着方便穿脱的衣物到店。",
      },
    ],
  },
  {
    id: "others",
    title: "其他需求",
    icon: "💡",
    faqs: [
      {
        question: "毕业袴的预约注意事项",
        answer:
          "毕业季（1-3月）是袴租赁的高峰期，建议至少提前2-3个月预约。我们提供专业的毕业袴套装，包括振袖、袴、腰带等全套配件。可以选择到店试穿，确保找到最合适的款式。毕业袴通常需要支付30%定金。",
      },
      {
        question: "成人式振袖的预约注意事项",
        answer:
          "成人式（1月第二个周一）的振袖预约非常火爆，建议提前半年到一年预约。我们提供华丽的振袖和服，包含专业化妆、发型设计和摄影服务的套餐。可以提前预约试穿，确保在成人式当天呈现最美的样子。",
      },
      {
        question: "如果已付款或预约，计划有变可以退款吗？",
        answer:
          "退款政策如下：\n- 预约日前7天以上取消：全额退款\n- 预约日前3-7天取消：退还70%\n- 预约日前1-3天取消：退还50%\n- 预约日当天取消或未到店：不予退款\n如需改期，请至少提前3天联系我们，可免费改期一次。因天气等不可抗力因素，我们会灵活处理。",
      },
      {
        question: "冬季穿和服有什么注意事项吗？",
        answer:
          "冬季（12-2月）穿和服需要注意保暖。我们建议：\n1. 内穿保暖内衣（避免高领，以免露出）\n2. 租赁羽织（和服外套）增加保暖，费用约1000-2000日元\n3. 使用暖宝宝贴（可在店内购买）\n4. 选择较厚的和服材质\n5. 穿着保暖袜子（在足袋内）\n即使在冬季，和服体验依然很受欢迎，京都雪景配和服更是别有韵味！",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col">
      {/* Hero 区域 - AI 客服 + Airbnb 风格 */}
      <section className="relative bg-hero-gradient overflow-hidden">
        {/* 樱花装饰图案 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGE1YjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

        <div className="container relative py-16 md:py-20">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
              常见问题 & AI 客服
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              快速解答您的疑问，提供24/7智能服务
            </p>
          </div>

          {/* AI 聊天机器人 */}
          <EmbeddedChatbot />
        </div>
      </section>

      {/* FAQ 分类导航 - Airbnb 风格 */}
      <section className="py-8 bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-4">
            {faqCategories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-sakura-50 hover:border-sakura-400 transition-colors text-sm font-medium text-gray-700 hover:text-sakura-600"
              >
                <span className="text-lg">{category.icon}</span>
                {category.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 内容 - Airbnb 风格卡片 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-16">
            {faqCategories.map((category, categoryIndex) => (
              <div key={category.id} id={category.id}>
                {/* 分类标题 */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-full bg-sakura-100 flex items-center justify-center text-2xl">
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {category.title}
                    </h2>
                    <p className="text-sm text-gray-600">{category.faqs.length} 个问题</p>
                  </div>
                </div>

                {/* FAQ 列表 */}
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => (
                    <details
                      key={faqIndex}
                      className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                        <h3 className="font-semibold pr-4 flex-1 text-gray-900">
                          <span className="text-sakura-600 mr-2">Q.</span>
                          {faq.question}
                        </h3>
                        <ChevronDown className="w-5 h-5 text-gray-600 group-open:rotate-180 transition-transform shrink-0" />
                      </summary>
                      <div className="px-6 pb-6 motion-safe:animate-[faqExpand_200ms_ease-out]">
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                            <span className="text-sakura-600 font-semibold mr-2">A.</span>
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 找不到答案 - 使用 Button 组件 */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">还有其他问题？</h2>
            <p className="text-gray-700 mb-8">
              如果您没有找到想要的答案，欢迎随时联系我们的客服团队
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button variant="primary" size="lg" className="w-full sm:w-auto min-w-[160px]">
                  联系我们
                </Button>
              </Link>
              <Link href="/booking">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[160px]">
                  立即预约
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 快速链接 - Airbnb 风格卡片 */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">相关资源</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Link
              href="/plans"
              className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="text-3xl mb-3">📋</div>
              <h3 className="font-semibold mb-2 text-gray-900">查看套餐</h3>
              <p className="text-sm text-gray-600">了解不同的租赁套餐和价格</p>
            </Link>

            <Link
              href="/stores"
              className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-semibold mb-2 text-gray-900">店铺位置</h3>
              <p className="text-sm text-gray-600">查找离您最近的店铺</p>
            </Link>

            <Link
              href="/plans"
              className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="text-3xl mb-3">👘</div>
              <h3 className="font-semibold mb-2 text-gray-900">和服图库</h3>
              <p className="text-sm text-gray-600">浏览精美的和服款式</p>
            </Link>

            <Link
              href="/about"
              className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="text-3xl mb-3">ℹ️</div>
              <h3 className="font-semibold mb-2 text-gray-900">关于我们</h3>
              <p className="text-sm text-gray-600">了解我们的服务和理念</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
