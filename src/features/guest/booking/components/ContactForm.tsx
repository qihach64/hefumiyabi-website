"use client";

import { User, Mail, Phone, MessageSquare } from "lucide-react";

export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface ContactFormProps {
  values: ContactFormValues;
  onChange: (values: ContactFormValues) => void;
  errors?: ContactFormErrors;
  /** 紧凑模式 - 用于 Modal */
  compact?: boolean;
  /** 显示标题 */
  showTitle?: boolean;
}

export default function ContactForm({
  values,
  onChange,
  errors,
  compact = false,
  showTitle = true,
}: ContactFormProps) {
  const handleChange = (field: keyof ContactFormValues, value: string) => {
    onChange({ ...values, [field]: value });
  };

  // 统一的输入框样式 - Sakura focus 状态
  const inputClassName = `
    w-full px-4 py-3
    border border-wabi-200
    rounded-lg
    text-[15px] text-gray-900
    bg-white
    placeholder:text-wabi-300
    focus:outline-none focus:border-sakura-400 focus:ring-2 focus:ring-sakura-100
    transition-all duration-300
    ${compact ? "px-3 py-2 text-[14px]" : ""}
  `;

  const labelClassName = `
    flex items-center gap-1
    text-[13px] font-medium text-gray-700
    mb-2
    ${compact ? "text-[12px] mb-1" : ""}
  `;

  const iconClassName = `w-4 h-4 text-sakura-500 ${compact ? "w-3.5 h-3.5" : ""}`;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {showTitle && (
        <h3 className={`font-semibold text-gray-900 ${compact ? "text-[14px]" : "text-[16px]"}`}>
          联系信息
        </h3>
      )}

      {/* 姓名 */}
      <div>
        <label className={labelClassName}>
          <User className={iconClassName} />
          姓名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="请输入您的姓名"
          className={`${inputClassName} ${errors?.name ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
        />
        {errors?.name && (
          <p className="mt-1 text-[12px] text-red-500">{errors.name}</p>
        )}
      </div>

      {/* 邮箱 */}
      <div>
        <label className={labelClassName}>
          <Mail className={iconClassName} />
          邮箱 <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={values.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="example@email.com"
          className={`${inputClassName} ${errors?.email ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
        />
        {errors?.email && (
          <p className="mt-1 text-[12px] text-red-500">{errors.email}</p>
        )}
      </div>

      {/* 电话 */}
      <div>
        <label className={labelClassName}>
          <Phone className={iconClassName} />
          手机号 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={values.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="用于预约确认通知"
          className={`${inputClassName} ${errors?.phone ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}`}
        />
        {errors?.phone && (
          <p className="mt-1 text-[12px] text-red-500">{errors.phone}</p>
        )}
      </div>

      {/* 备注 */}
      <div>
        <label className={labelClassName}>
          <MessageSquare className={iconClassName} />
          备注 <span className="text-wabi-400 font-normal">(可选)</span>
        </label>
        <textarea
          value={values.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="如有特殊要求或备注，请在此处填写..."
          rows={compact ? 2 : 3}
          className={`${inputClassName} resize-none`}
        />
      </div>
    </div>
  );
}
