'use client';

/**
 * New Merchant Page
 *
 * Platform admin only - create a new merchant
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { useAdminSession } from '@/features/auth/contexts/AdminSessionContext';

export default function NewMerchantPage() {
  const router = useRouter();
  const { isPlatformAdmin } = useAdminSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    confirmPassword: '',
    theme_color: '#ec4899',
    api_quota: 1000,
    is_active: true,
    is_platform_admin: false,
    use_default_library: true,
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 密码验证
    if (!formData.password) {
      setError('请输入密码');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少需要 6 个字符');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      // 提交时排除 confirmPassword
      const { confirmPassword: _confirmPassword, ...submitData } = formData;

      const response = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const json = await response.json();
      // 统一 API 响应格式: { success, data, meta } 或 { success: false, error: {...} }
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to create merchant');
      }

      router.push('/admin/merchants');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create merchant');
    } finally {
      setLoading(false);
    }
  };

  if (!isPlatformAdmin) {
    return (
      <div className="p-8 text-center">
        <Shield className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">访问受限</h1>
        <p className="text-gray-600">只有平台管理员可以创建商户</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/merchants"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          返回商户列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">添加新商户</h1>
        <p className="text-gray-600 mt-1">创建一个新的商户账户</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商户名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="例如：和服みやび"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  pattern="^[a-z0-9-]+$"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="例如：hefumiyabi"
                />
                <p className="mt-1 text-xs text-gray-500">
                  只能包含小写字母、数字和连字符，用于 URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="例如：admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="至少 6 个字符"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">确认密码 *</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="再次输入密码"
                />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">外观设置</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">主题颜色</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.theme_color}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      theme_color: e.target.value,
                    }))
                  }
                  className="h-10 w-20 border border-gray-200 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.theme_color}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      theme_color: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">API 设置</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API 配额</label>
              <input
                type="number"
                value={formData.api_quota}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    api_quota: parseInt(e.target.value, 10) || 0,
                  }))
                }
                min={0}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500">每月可用的 API 调用次数</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">状态</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">启用商户</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_platform_admin}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      is_platform_admin: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  平台管理员权限
                  <span className="text-xs text-gray-500 ml-1">(可管理所有商户和公共素材)</span>
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.use_default_library}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      use_default_library: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  使用公共素材库
                  <span className="text-xs text-gray-500 ml-1">
                    (可访问平台公共和服款式和场景图)
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/merchants"
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {loading ? '创建中...' : '创建商户'}
          </button>
        </div>
      </form>
    </div>
  );
}
