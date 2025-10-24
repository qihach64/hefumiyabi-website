"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Save, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const PLAN_CATEGORIES = [
  { value: "LADIES", label: "女士套餐" },
  { value: "MENS", label: "男士套餐" },
  { value: "COUPLE", label: "情侣套餐" },
  { value: "FAMILY", label: "家庭套餐" },
  { value: "GROUP", label: "团体套餐" },
  { value: "SPECIAL", label: "特别套餐" },
];

export default function PlanCreateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 表单状态 - 默认值
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    description: "",
    category: "LADIES",
    price: "",
    originalPrice: "",
    depositAmount: "",
    duration: "240", // 默认4小时
    includes: ["和服租赁", "专业着装服务", "发型设计", "配饰提供"],
    imageUrl: "",
    storeName: "",
    region: "",
    tags: [],
    isActive: true,
    isFeatured: false,
    isLimited: false,
    maxBookings: "",
    availableFrom: "",
    availableUntil: "",
  });

  // 新增项输入
  const [newIncludeItem, setNewIncludeItem] = useState("");
  const [newTag, setNewTag] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/merchant/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: Math.round(Number(formData.price) * 100), // 转换为分
          originalPrice: formData.originalPrice
            ? Math.round(Number(formData.originalPrice) * 100)
            : undefined,
          depositAmount: Math.round(Number(formData.depositAmount) * 100),
          duration: Number(formData.duration),
          maxBookings: formData.maxBookings
            ? Number(formData.maxBookings)
            : undefined,
          availableFrom: formData.availableFrom || undefined,
          availableUntil: formData.availableUntil || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "创建失败");
      }

      // 成功后跳转到套餐列表
      router.push("/merchant/listings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const addIncludeItem = () => {
    if (newIncludeItem.trim()) {
      setFormData({
        ...formData,
        includes: [...formData.includes, newIncludeItem.trim()],
      });
      setNewIncludeItem("");
    }
  };

  const removeIncludeItem = (index: number) => {
    setFormData({
      ...formData,
      includes: formData.includes.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">基本信息</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 套餐名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              套餐名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="例如：经典和服体验套餐"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>

          {/* 英文名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              英文名称
            </label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) =>
                setFormData({ ...formData, nameEn: e.target.value })
              }
              placeholder="Classic Kimono Experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>

          {/* 类别 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              套餐类别 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            >
              {PLAN_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 时长 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              体验时长 (分钟) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              常见时长：120分钟(2小时)、240分钟(4小时)、480分钟(8小时)
            </p>
          </div>

          {/* 店铺名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              店铺名称
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) =>
                setFormData({ ...formData, storeName: e.target.value })
              }
              placeholder="例如：浅草本店"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>

          {/* 地区 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              地区
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              placeholder="例如：东京、京都"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 描述 */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            套餐描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="详细描述您的和服体验套餐，包括特色、适用场景等..."
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            至少10个字符，详细的描述可以帮助客户更好地了解您的套餐
          </p>
        </div>
      </div>

      {/* 价格信息 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">价格信息</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 当前价格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前价格 (¥) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="3980"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
          </div>

          {/* 原价 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原价 (¥)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.originalPrice}
              onChange={(e) =>
                setFormData({ ...formData, originalPrice: e.target.value })
              }
              placeholder="4980 (可选)"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">用于显示折扣</p>
          </div>

          {/* 押金 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              押金 (¥) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.depositAmount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  depositAmount: e.target.value,
                })
              }
              placeholder="1000"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">预订时需支付的押金</p>
          </div>
        </div>
      </div>

      {/* 图片 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">套餐图片</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片URL
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              建议尺寸：800x600像素，支持 JPG、PNG 格式
            </p>
          </div>

          {/* 图片预览 */}
          {formData.imageUrl && (
            <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden">
              <Image
                src={formData.imageUrl}
                alt="套餐图片预览"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* 包含内容 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">包含内容</h2>

        {/* 已添加的项目 */}
        <div className="space-y-2 mb-4">
          {formData.includes.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl"
            >
              <span className="flex-1 text-gray-700">{item}</span>
              <button
                type="button"
                onClick={() => removeIncludeItem(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* 添加新项目 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newIncludeItem}
            onChange={(e) => setNewIncludeItem(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addIncludeItem())
            }
            placeholder="例如：和服租赁、专业着装服务"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
          />
          <Button
            type="button"
            onClick={addIncludeItem}
            variant="secondary"
            size="md"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加
          </Button>
        </div>
      </div>

      {/* 标签 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">标签</h2>

        {/* 已添加的标签 */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.tags.map((tag, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 添加新标签 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="例如：热门、推荐、樱花季"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
          />
          <Button type="button" onClick={addTag} variant="secondary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            添加
          </Button>
        </div>
      </div>

      {/* 高级设置 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">高级设置</h2>

        <div className="space-y-6">
          {/* 状态开关 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-5 h-5 text-sakura-600 border-gray-300 rounded focus:ring-sakura-500"
              />
              <div>
                <p className="font-medium text-gray-900">上架状态</p>
                <p className="text-sm text-gray-600">套餐是否可预订</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData({ ...formData, isFeatured: e.target.checked })
                }
                className="w-5 h-5 text-sakura-600 border-gray-300 rounded focus:ring-sakura-500"
              />
              <div>
                <p className="font-medium text-gray-900">精选套餐</p>
                <p className="text-sm text-gray-600">在首页展示</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.isLimited}
                onChange={(e) =>
                  setFormData({ ...formData, isLimited: e.target.checked })
                }
                className="w-5 h-5 text-sakura-600 border-gray-300 rounded focus:ring-sakura-500"
              />
              <div>
                <p className="font-medium text-gray-900">限量供应</p>
                <p className="text-sm text-gray-600">限制预订数量</p>
              </div>
            </label>
          </div>

          {/* 限量设置 */}
          {formData.isLimited && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大预订数
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxBookings}
                onChange={(e) =>
                  setFormData({ ...formData, maxBookings: e.target.value })
                }
                placeholder="100"
                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
              />
            </div>
          )}

          {/* 时间限制 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始时间
              </label>
              <input
                type="datetime-local"
                value={formData.availableFrom}
                onChange={(e) =>
                  setFormData({ ...formData, availableFrom: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束时间
              </label>
              <input
                type="datetime-local"
                value={formData.availableUntil}
                onChange={(e) =>
                  setFormData({ ...formData, availableUntil: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              发布中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              发布套餐
            </>
          )}
        </Button>

        <Link href="/merchant/listings">
          <Button variant="secondary" size="lg" disabled={isLoading}>
            取消
          </Button>
        </Link>
      </div>
    </form>
  );
}
