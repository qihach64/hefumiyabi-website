"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const quickQuestions = [
  "和服租赁多少钱？",
  "着装需要多长时间？",
  "可以寄存行李吗？",
  "如何取消预约？",
  "营业时间是什么时候？",
];

export default function EmbeddedChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "您好！我是江户和装工房雅的AI助手 🤖\n\n我可以帮您解答关于和服租赁的各种问题，比如：\n• 租赁流程和价格\n• 着装和归还\n• 预约和取消政策\n• 店铺信息\n\n请在下方输入您的问题，或点击快捷问题开始对话！",
      timestamp: new Date(),
      suggestions: quickQuestions.slice(0, 4),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // 使用 setTimeout 确保 DOM 已更新
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 0);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // 模拟思考延迟
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    try {
      // 调用API获取回复
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "抱歉，我遇到了一些问题。请稍后再试，或直接联系我们的人工客服。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI 智能客服</h2>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              24/7 在线服务
            </div>
          </div>
        </div>
        <p className="text-center text-white/80 text-sm">有任何关于和服租赁的问题，随时问我！</p>
      </div>

      {/* 消息区域 */}
      <div
        ref={messagesContainerRef}
        className="h-[400px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white scroll-smooth"
      >
        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            <div
              className={`flex items-start gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* 头像 */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === "user"
                    ? "bg-blue-500"
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* 消息气泡 */}
              <div
                className={`max-w-[75%] px-5 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-tr-none shadow-md"
                    : "bg-white border-2 border-gray-200 rounded-tl-none shadow-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              </div>
            </div>

            {/* 建议按钮 */}
            {message.role === "assistant" && message.suggestions && (
              <div className="flex flex-wrap gap-2 pl-13">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(suggestion)}
                    className="text-sm px-4 py-2 bg-white border-2 border-blue-200 rounded-full hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 正在输入 */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border-2 border-gray-200 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-6 bg-white border-t-2 border-gray-100">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题..."
            className="flex-1 px-5 py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 text-sm transition-colors"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          💡 AI助手可能会出错，重要信息请联系人工客服确认
        </p>
      </div>
    </div>
  );
}
