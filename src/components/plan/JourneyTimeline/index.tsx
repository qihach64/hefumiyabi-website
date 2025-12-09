"use client";

import { useState } from "react";
import {
  MapPin,
  Shirt,
  Scissors,
  Camera as CameraIcon,
  Footprints,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface FAQ {
  q: string;
  a: string;
}

interface JourneyStep {
  id: string;
  time: string;
  title: string;
  titleEn: string;
  description: string;
  icon: "arrival" | "styling" | "hairstyle" | "photo" | "stroll" | "return";
  highlight?: string;
  faqs?: FAQ[];
}

interface BookingNote {
  type: "success" | "warning" | "info";
  content: string;
}

interface JourneyTimelineProps {
  duration?: number; // 小时
  // Mock data - 后期对接真实数据
  journeySteps?: JourneyStep[];
  bookingNotes?: BookingNote[];
  cancelPolicy?: string;
}

// 图标映射
const ICONS = {
  arrival: MapPin,
  styling: Shirt,
  hairstyle: Scissors,
  photo: CameraIcon,
  stroll: Footprints,
  return: RotateCcw,
};

// 默认旅程步骤
const DEFAULT_JOURNEY: JourneyStep[] = [
  {
    id: "1",
    time: "09:00",
    title: "到店签到",
    titleEn: "Arrival",
    description: "准时到店，工作人员会引导您开始体验",
    icon: "arrival",
    highlight: "距离最近车站步行 5 分钟",
    faqs: [
      { q: "可以提前到吗？", a: "可以提前 10 分钟到，但可能需要等待前一批客人完成" },
      { q: "迟到怎么办？", a: "请提前联系我们，迟到 30 分钟以上可能影响您的体验时间" },
    ],
  },
  {
    id: "2",
    time: "09:15",
    title: "选衣换装",
    titleEn: "Styling",
    description: "在 500+ 款式中挑选您心仪的和服，专业人员协助穿着",
    icon: "styling",
    highlight: "约 30-45 分钟",
    faqs: [
      { q: "可以自带和服吗？", a: "可以，但需提前告知，我们可提供配饰搭配服务" },
      { q: "选择困难怎么办？", a: "工作人员会根据您的肤色、身形推荐最适合的款式" },
    ],
  },
  {
    id: "3",
    time: "09:45",
    title: "发型设计",
    titleEn: "Hairstyle",
    description: "专业发型师为您设计与和服搭配的发型",
    icon: "hairstyle",
    highlight: "约 15-20 分钟",
    faqs: [
      { q: "短发可以做造型吗？", a: "可以，我们有多种短发造型方案" },
      { q: "可以保留自己的发型吗？", a: "可以，告知工作人员即可" },
    ],
  },
  {
    id: "4",
    time: "10:30",
    title: "自由漫步",
    titleEn: "Stroll",
    description: "穿着和服自由探索周边景点，拍照留念",
    icon: "stroll",
    highlight: "推荐：清水寺、花见小路、八坂神社",
    faqs: [
      { q: "可以去远的地方吗？", a: "可以，但请注意归还时间，建议选择附近景点" },
      { q: "下雨怎么办？", a: "我们提供免费雨伞，和服可正常穿着" },
    ],
  },
  {
    id: "5",
    time: "17:30",
    title: "归还",
    titleEn: "Return",
    description: "返回店铺归还和服和配饰",
    icon: "return",
    highlight: "请于 18:00 前归还",
    faqs: [
      { q: "归还时需要换回自己的衣服吗？", a: "是的，我们提供更衣室" },
      { q: "迟归会怎样？", a: "超时归还收取 ¥1,000/小时 的延时费" },
    ],
  },
];

// 默认预订须知
const DEFAULT_NOTES: BookingNote[] = [
  { type: "success", content: "前一天 18:00 前可免费取消" },
  { type: "warning", content: "当天取消收取 50% 费用" },
  { type: "info", content: "身高限制: 145-180cm｜鞋码限制: 22-27cm" },
];

export default function JourneyTimeline({
  duration = 8,
  journeySteps = DEFAULT_JOURNEY,
  bookingNotes = DEFAULT_NOTES,
  cancelPolicy = "预订后可随时联系客服修改日期",
}: JourneyTimelineProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
    setExpandedFaq(null);
  };

  const toggleFaq = (faqKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFaq(expandedFaq === faqKey ? null : faqKey);
  };

  return (
    <div className="space-y-8">
      {/* 区块标题 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-px bg-sakura-300" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-sakura-500 font-medium">
          Experience Journey
        </span>
      </div>

      {/* 当日体验时间轴 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-semibold text-gray-900">
              当日体验流程
            </h4>
            <div className="flex items-center gap-1.5 text-[13px] text-gray-500">
              <Clock className="w-4 h-4" />
              <span>全程约 {duration} 小时</span>
            </div>
          </div>
        </div>

        {/* 时间轴 */}
        <div className="relative">
          {journeySteps.map((step, idx) => {
            const Icon = ICONS[step.icon];
            const isExpanded = expandedStep === step.id;
            const isLast = idx === journeySteps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* 连接线 */}
                {!isLast && (
                  <div className="absolute left-[39px] top-[60px] bottom-0 w-0.5 bg-gray-100" />
                )}

                {/* 步骤内容 */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`
                    w-full px-5 py-4 flex items-start gap-4 text-left
                    transition-all duration-200
                    ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50/50"}
                  `}
                >
                  {/* 时间 + 图标 */}
                  <div className="flex flex-col items-center">
                    <span className="text-[12px] font-mono text-gray-400 mb-2">
                      {step.time}
                    </span>
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-200
                        ${isExpanded
                          ? "bg-sakura-500 text-white"
                          : "bg-sakura-100 text-sakura-600"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0 pt-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[15px] font-semibold text-gray-900">
                        {step.title}
                      </span>
                      <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                        {step.titleEn}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-500 mb-1">
                      {step.description}
                    </p>
                    {step.highlight && (
                      <p className="text-[12px] text-sakura-600 font-medium">
                        📍 {step.highlight}
                      </p>
                    )}
                  </div>

                  {/* 展开指示 */}
                  {step.faqs && step.faqs.length > 0 && (
                    <div className="pt-5">
                      <div
                        className={`
                          flex items-center gap-1 px-2 py-1 rounded-full text-[11px]
                          ${isExpanded
                            ? "bg-sakura-100 text-sakura-700"
                            : "bg-gray-100 text-gray-500"
                          }
                        `}
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>FAQ</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  )}
                </button>

                {/* 展开的 FAQ */}
                {isExpanded && step.faqs && step.faqs.length > 0 && (
                  <div className="px-5 pb-4 bg-gray-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="ml-14 pl-4 border-l-2 border-sakura-200 space-y-2">
                      {step.faqs.map((faq, faqIdx) => {
                        const faqKey = `${step.id}-${faqIdx}`;
                        const isFaqExpanded = expandedFaq === faqKey;

                        return (
                          <div key={faqKey}>
                            <button
                              onClick={(e) => toggleFaq(faqKey, e)}
                              className="w-full flex items-start gap-2 text-left py-2 group"
                            >
                              <HelpCircle className="w-4 h-4 text-sakura-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-[13px] text-gray-700 font-medium group-hover:text-sakura-600 transition-colors">
                                  {faq.q}
                                </span>
                                {isFaqExpanded && (
                                  <p className="mt-1.5 text-[13px] text-gray-500 leading-relaxed animate-in fade-in duration-200">
                                    {faq.a}
                                  </p>
                                )}
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                  isFaqExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 预订须知 - 整合预订流程 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 标题 */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h4 className="text-[16px] font-semibold text-gray-900">
            预订须知
          </h4>
        </div>

        <div className="p-5 space-y-5">
          {/* 预订流程 - 紧凑横向布局 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-gray-700">预订流程</span>
              <span className="text-[11px] text-sakura-600 font-medium">约 2 分钟完成</span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              {[
                { num: 1, label: "选择日期" },
                { num: 2, label: "填写信息" },
                { num: 3, label: "完成预订" },
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-sakura-100 border border-sakura-300 flex items-center justify-center text-sakura-700 font-bold text-[11px]">
                      {step.num}
                    </div>
                    <span className="text-[12px] text-gray-600">{step.label}</span>
                  </div>
                  {idx < 2 && (
                    <div className="w-6 h-px bg-sakura-200 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 须知列表 */}
          <div className="space-y-2">
            {bookingNotes.map((note, idx) => {
              const icons = {
                success: CheckCircle2,
                warning: AlertCircle,
                info: HelpCircle,
              };
              const colors = {
                success: "text-green-600 bg-green-50",
                warning: "text-amber-600 bg-amber-50",
                info: "text-blue-600 bg-blue-50",
              };
              const Icon = icons[note.type];

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg ${colors[note.type].split(" ")[1]}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors[note.type].split(" ")[0]}`} />
                  <span className="text-[13px] text-gray-700">{note.content}</span>
                </div>
              );
            })}
          </div>

          {/* 取消政策 */}
          {cancelPolicy && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-[12px] text-gray-500">
                💡 {cancelPolicy}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
