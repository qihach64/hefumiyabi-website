"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui";
import { Store, Building2, FileText, CreditCard, Hash, Upload, CheckCircle } from "lucide-react";

export default function MerchantRegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // 表单数据
  const [formData, setFormData] = useState({
    businessName: "",
    legalName: "",
    description: "",
    logo: "",
    bankAccount: "",
    taxId: "",
  });

  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 检查登录状态
  useEffect(() => {
    if (status === "unauthenticated") {
      // 未登录，重定向到登录页面，并带上回调URL
      router.push("/login?callbackUrl=/merchant/register");
    }
  }, [status, router]);

  // 加载中显示
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sakura-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录则不渲染内容（会被重定向）
  if (!session) {
    return null;
  }

  // 处理输入变化
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 验证当前步骤
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = "请输入商户名称";
      }
      if (!formData.description.trim()) {
        newErrors.description = "请输入商户简介";
      }
    }

    if (step === 2) {
      if (!formData.taxId.trim()) {
        newErrors.taxId = "请输入税号";
      }
      if (!formData.bankAccount.trim()) {
        newErrors.bankAccount = "请输入银行账户";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 下一步
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // 上一步
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/merchant/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // 注册成功，跳转到审核等待页面
        router.push("/merchant/pending");
      } else {
        const error = await response.json();
        alert(error.message || "注册失败，请重试");
      }
    } catch (error) {
      alert("网络错误，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sakura-50 via-white to-sakura-100">
      <div className="container py-8 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* 标题区域 */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              成为和服商家
            </h1>
            <p className="text-lg text-gray-600">
              加入我们的平台，让更多客户发现您的和服体验
            </p>
          </div>

          {/* 进度指示器 */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step < currentStep
                        ? "bg-sakura-500 text-white"
                        : step === currentStep
                        ? "bg-sakura-500 text-white ring-4 ring-sakura-200"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="w-6 h-6" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-16 md:w-24 h-1 mx-2 transition-colors ${
                        step < currentStep ? "bg-sakura-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-3 text-xs md:text-sm text-gray-600">
              <span>基本信息</span>
              <span>财务信息</span>
              <span>确认提交</span>
            </div>
          </div>

          {/* 表单卡片 */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
            {/* 步骤 1: 基本信息 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Store className="w-6 h-6 text-sakura-500" />
                  商户基本信息
                </h2>

                {/* 商户名称 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    商户名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleChange("businessName", e.target.value)}
                    placeholder="例如：江戸和装工房雅"
                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-colors ${
                      errors.businessName
                        ? "border-red-500"
                        : "border-gray-300 focus:border-sakura-500"
                    }`}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-500 mt-1">{errors.businessName}</p>
                  )}
                </div>

                {/* 法律名称 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    法律注册名称（可选）
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => handleChange("legalName", e.target.value)}
                    placeholder="例如：江戸和装工房雅株式会社"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-sakura-500 transition-colors"
                  />
                </div>

                {/* 商户简介 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    商户简介 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="介绍您的和服店铺，包括特色、服务等..."
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-xl outline-none transition-colors resize-none ${
                      errors.description
                        ? "border-red-500"
                        : "border-gray-300 focus:border-sakura-500"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    建议200-500字，详细描述您的服务特色
                  </p>
                </div>

                {/* Logo上传 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    商户Logo（可选）
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-sakura-500 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">点击上传或拖拽文件</p>
                    <p className="text-xs text-gray-500">支持 JPG、PNG，建议尺寸 500x500px</p>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 2: 财务信息 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-sakura-500" />
                  财务信息
                </h2>

                {/* 税号 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    税号 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleChange("taxId", e.target.value)}
                      placeholder="例如：123-45-67890"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-colors ${
                        errors.taxId
                          ? "border-red-500"
                          : "border-gray-300 focus:border-sakura-500"
                      }`}
                    />
                  </div>
                  {errors.taxId && (
                    <p className="text-sm text-red-500 mt-1">{errors.taxId}</p>
                  )}
                </div>

                {/* 银行账户 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    银行账户 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.bankAccount}
                      onChange={(e) => handleChange("bankAccount", e.target.value)}
                      placeholder="银行名称 + 账户号码"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-colors ${
                        errors.bankAccount
                          ? "border-red-500"
                          : "border-gray-300 focus:border-sakura-500"
                      }`}
                    />
                  </div>
                  {errors.bankAccount && (
                    <p className="text-sm text-red-500 mt-1">{errors.bankAccount}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    用于接收平台分账款项
                  </p>
                </div>

                {/* 提示信息 */}
                <div className="bg-sakura-50 border border-sakura-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-sakura-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-sakura-800">
                      <p className="font-semibold mb-1">关于佣金</p>
                      <p className="leading-relaxed">
                        平台将收取每笔订单 15% 的服务费用于维护平台运营、营销推广和客户服务。
                        收入将在客户完成体验后的7个工作日内结算到您的账户。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 3: 确认提交 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-sakura-500" />
                  确认信息
                </h2>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">基本信息</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">商户名称：</span>
                        <span className="text-gray-900 font-medium">{formData.businessName}</span>
                      </div>
                      {formData.legalName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">法律名称：</span>
                          <span className="text-gray-900 font-medium">{formData.legalName}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-gray-600">商户简介：</span>
                        <p className="text-gray-900 mt-1 leading-relaxed">
                          {formData.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">财务信息</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">税号：</span>
                        <span className="text-gray-900 font-medium">{formData.taxId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">银行账户：</span>
                        <span className="text-gray-900 font-medium">{formData.bankAccount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 服务条款 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      className="w-5 h-5 rounded border-gray-300 text-sakura-500 focus:ring-sakura-500 mt-0.5"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      我已阅读并同意《商家服务协议》和《平台使用条款》，
                      理解平台将收取15%的服务费用，并承诺提供真实准确的信息和优质的服务体验。
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  上一步
                </Button>
              )}

              <div className="flex-1" />

              {currentStep < 3 ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                >
                  下一步
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? "提交中..." : "提交申请"}
                </Button>
              )}
            </div>
          </div>

          {/* 帮助信息 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              提交后，我们将在 2-3 个工作日内审核您的申请
            </p>
            <p className="text-sm text-gray-600 mt-1">
              如有疑问，请联系客服：
              <a href="mailto:merchant@hefumiyabi.com" className="text-sakura-500 hover:underline ml-1">
                merchant@hefumiyabi.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
