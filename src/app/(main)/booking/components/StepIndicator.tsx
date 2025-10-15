import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: "选择店铺" },
  { number: 2, title: "个人信息" },
  { number: 3, title: "附加服务" },
  { number: 4, title: "确认订单" },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* 步骤圆圈 */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  transition-all duration-300
                  ${
                    currentStep > step.number
                      ? "bg-green-500 text-white"
                      : currentStep === step.number
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }
                `}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <p
                className={`
                  mt-2 text-xs md:text-sm font-medium whitespace-nowrap
                  ${
                    currentStep >= step.number
                      ? "text-gray-900"
                      : "text-gray-500"
                  }
                `}
              >
                {step.title}
              </p>
            </div>

            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 md:mx-4">
                <div
                  className={`
                    h-full transition-all duration-300
                    ${
                      currentStep > step.number
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }
                  `}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
