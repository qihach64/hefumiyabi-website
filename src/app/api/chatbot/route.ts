import { NextRequest, NextResponse } from "next/server";

// FAQ 数据（从FAQ页面复制）
const faqData = [
  {
    category: "关于着装",
    faqs: [
      {
        question: "着装通常需要多长时间？",
        answer:
          "女士和服着装大约需要30分钟，男士约需20分钟。如果需要发型设计服务，女士额外需要20-30分钟。我们建议您在预约时间提前15分钟到店，以确保有充足的时间完成着装。",
        keywords: ["着装", "时间", "多久", "多长", "需要"],
      },
      {
        question: "孕妇可以体验和服着装吗？",
        answer:
          "可以的。我们有经验丰富的着装师，可以根据孕妇的身体状况调整着装方式，确保舒适安全。建议选择宽松一些的和服款式，并在预约时告知我们您的孕期情况，以便我们做好准备。",
        keywords: ["孕妇", "怀孕", "孕期"],
      },
      {
        question: "儿童服装有哪些尺寸？",
        answer:
          "我们的儿童和服适合3-12岁的儿童，提供多个尺寸选择。具体尺寸包括：S（3-5岁）、M（6-8岁）、L（9-12岁）。我们的工作人员会根据孩子的身高体型推荐合适的尺寸。",
        keywords: ["儿童", "孩子", "小孩", "尺寸", "大小"],
      },
      {
        question: "有特殊的尺寸限制吗？",
        answer:
          "我们提供从XS到XXL的多种尺寸，适合身高145cm-185cm、体重40kg-100kg的客人。如果您的体型比较特殊，建议提前联系我们确认是否有合适的和服。",
        keywords: ["尺寸", "大小", "身高", "体重", "限制"],
      },
    ],
  },
  {
    category: "关于归还",
    faqs: [
      {
        question: "如果租赁的和服或配件被弄脏或损坏怎么办？",
        answer:
          "正常使用过程中的轻微污渍（如灰尘、少量汗渍）无需额外赔偿，我们会进行专业清洗。但如果出现严重污渍（如油渍、墨渍）或损坏（如撕裂、破洞），可能需要支付清洗费或赔偿金。建议购买我们的损坏保险（500日元），可以免除大部分赔偿责任。",
        keywords: ["弄脏", "损坏", "赔偿", "清洗", "保险"],
      },
      {
        question: "如果不能按时归还或希望保留到第二天怎么办？",
        answer:
          "如需延长租赁时间，请在归还前联系店铺工作人员。延长费用根据套餐类型计算，通常为原价的30-50%/天。部分店铺提供次日归还服务，需在预约时说明。如果未经允许延迟归还，可能会收取额外费用。",
        keywords: ["延长", "归还", "延期", "第二天", "次日"],
      },
    ],
  },
  {
    category: "关于租赁",
    faqs: [
      {
        question: "租赁期限是多久？",
        answer:
          "标准租赁期限为8小时，从您完成着装离店开始计算。例如，如果您早上10点完成着装，需要在当日18点前归还。我们也提供全天租赁（至闭店时间）和次日归还等选项，具体请在预约时确认。",
        keywords: ["租赁", "期限", "多久", "时间"],
      },
      {
        question: "接待时间到几点？",
        answer:
          "我们的营业时间为周一至周五 9:00-18:00，周末和节假日 9:00-19:00。最后入店时间为闭店前1小时。建议预约上午时段，这样可以有充足的时间游览。旺季（樱花季、红叶季）建议提前2周预约。",
        keywords: ["营业", "时间", "几点", "开门", "关门"],
      },
      {
        question: "可以寄存衣物和行李吗？",
        answer:
          "可以的。我们为所有租赁客户提供免费行李寄存服务。您可以将随身行李、换下的衣物等寄存在店内，归还和服时取回。贵重物品请随身携带，我们不对寄存物品的丢失负责。",
        keywords: ["寄存", "行李", "衣物", "存放"],
      },
      {
        question: "可以使用信用卡或其他电子货币吗？",
        answer:
          "可以。我们支持多种支付方式，包括：现金、信用卡（Visa、MasterCard、JCB、American Express）、支付宝、微信支付、PayPay等。在线预约时也可以提前支付定金。",
        keywords: ["支付", "付款", "信用卡", "支付宝", "微信"],
      },
      {
        question: "和服租赁的价格是多少？",
        answer:
          "我们提供多种套餐选择，价格从3000日元到20000日元不等。基础套餐约3000-5000日元，包含和服、腰带、足袋、草履等全套配件。高级套餐包含发型设计、摄影服务等。具体价格请查看我们的套餐页面或联系客服咨询。",
        keywords: ["价格", "多少钱", "费用", "收费"],
      },
    ],
  },
  {
    category: "关于预约",
    faqs: [
      {
        question: "如何预约和服租赁？",
        answer:
          "您可以通过我们的官网在线预约，或直接致电店铺预约。在线预约步骤：1) 选择套餐 2) 选择日期和时间 3) 填写个人信息 4) 确认预约。预约后会收到确认邮件。建议提前1-2周预约，旺季建议提前1个月。",
        keywords: ["预约", "怎么", "如何", "方法"],
      },
      {
        question: "如果已付款或预约，计划有变可以退款吗？",
        answer:
          "退款政策如下：\n- 预约日前7天以上取消：全额退款\n- 预约日前3-7天取消：退还70%\n- 预约日前1-3天取消：退还50%\n- 预约日当天取消或未到店：不予退款\n如需改期，请至少提前3天联系我们，可免费改期一次。因天气等不可抗力因素，我们会灵活处理。",
        keywords: ["退款", "取消", "改期", "退订"],
      },
    ],
  },
];

// 计算文本相似度（简单的关键词匹配）
function calculateScore(query: string, faq: any): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // 问题完全匹配
  if (faq.question.toLowerCase().includes(queryLower)) {
    score += 100;
  }

  // 答案匹配
  if (faq.answer.toLowerCase().includes(queryLower)) {
    score += 50;
  }

  // 关键词匹配
  faq.keywords?.forEach((keyword: string) => {
    if (queryLower.includes(keyword) || keyword.includes(queryLower)) {
      score += 30;
    }
  });

  return score;
}

// 查找最匹配的FAQ
function findBestMatch(query: string) {
  let bestMatch = null;
  let bestScore = 0;
  const allMatches: any[] = [];

  for (const category of faqData) {
    for (const faq of category.faqs) {
      const score = calculateScore(query, faq);
      if (score > 0) {
        allMatches.push({ ...faq, category: category.category, score });
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { ...faq, category: category.category };
      }
    }
  }

  return { bestMatch, bestScore, allMatches: allMatches.sort((a, b) => b.score - a.score) };
}

// 生成回复
function generateReply(query: string) {
  const { bestMatch, bestScore, allMatches } = findBestMatch(query);

  // 如果找到了很好的匹配
  if (bestScore > 50 && bestMatch) {
    const suggestions = allMatches.slice(1, 4).map((m) => m.question);

    return {
      reply: `关于"${bestMatch.question}"：\n\n${bestMatch.answer}\n\n您还想了解其他问题吗？`,
      suggestions,
    };
  }

  // 如果有一些匹配但不太确定
  if (bestScore > 0 && allMatches.length > 0) {
    const topMatches = allMatches.slice(0, 3);
    const matchList = topMatches.map((m, i) => `${i + 1}. ${m.question}`).join("\n");

    return {
      reply: `我理解您可能想了解以下问题：\n\n${matchList}\n\n请点击下方按钮选择，或者换个方式描述您的问题。`,
      suggestions: topMatches.map((m) => m.question),
    };
  }

  // 完全没有匹配
  return {
    reply: `抱歉，我没有找到相关的问题解答。\n\n您可以：\n1. 换个方式描述您的问题\n2. 浏览下方的常见问题\n3. 联系人工客服获取帮助\n\n我们的客服电话：03-XXXX-XXXX`,
    suggestions: ["和服租赁多少钱？", "如何预约？", "营业时间是什么时候？"],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const response = generateReply(message);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
