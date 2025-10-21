# 江戸和装工房雅 - 设计系统

> 融合 Airbnb 现代极简风格与和服樱花美学的统一设计系统

---

## 🎨 设计理念

### 核心原则
1. **现代极简** - 受 Airbnb 启发的清爽界面
2. **樱花美学** - 融入日本传统色彩与元素
3. **用户友好** - 直观的交互和清晰的信息层次
4. **一致性** - 统一的视觉语言和组件标准

---

## 🌸 颜色系统

### 主色调 - 樱花粉红

```css
/* 樱花粉红渐变 - 品牌主色 */
--sakura-light: #FFC0D3;      /* 浅樱花粉 */
--sakura: #FF9DB5;             /* 樱花粉 */
--sakura-medium: #FF7A9A;      /* 中樱花粉 */
--sakura-deep: #FF5780;        /* 深樱花粉 */
--sakura-dark: #E63462;        /* 暗樱花粉 */

/* Airbnb风格主色 - 用于强调和CTA */
--primary: #FF385C;            /* Rausch Pink */
--primary-hover: #E31C5F;      /* 悬停状态 */
```

### 中性色系统

```css
/* 灰度系统 - 受 Airbnb 启发 */
--gray-50: #F9FAFB;           /* 背景色 */
--gray-100: #F3F4F6;          /* 次要背景 */
--gray-200: #E5E7EB;          /* 边框 */
--gray-300: #D1D5DB;          /* 分隔线 */
--gray-400: #9CA3AF;          /* 禁用文本 */
--gray-500: #6B7280;          /* 次要文本 */
--gray-600: #4B5563;          /* 主要文本 */
--gray-700: #374151;          /* 标题 */
--gray-800: #1F2937;          /* 深色标题 */
--gray-900: #111827;          /* 最深色 */
```

### 辅助色彩

```css
/* 状态色 */
--success: #10B981;           /* 成功 */
--warning: #F59E0B;           /* 警告 */
--error: #EF4444;             /* 错误 */
--info: #3B82F6;              /* 信息 */

/* 和服传统色 */
--kimono-gold: #D4AF37;       /* 金色装饰 */
--kimono-indigo: #1E3A8A;     /* 蓝染 */
--kimono-red: #DC2626;        /* 红色 */
--kimono-green: #059669;      /* 绿色 */
```

### 渐变系统

```css
/* 品牌渐变 */
--gradient-sakura: linear-gradient(135deg, #FFC0D3 0%, #FF7A9A 100%);
--gradient-sakura-warm: linear-gradient(135deg, #FFB5C5 0%, #FF6B9D 100%);
--gradient-sakura-cool: linear-gradient(135deg, #FFD4E5 0%, #FF8FAB 100%);

/* 功能性渐变 */
--gradient-hero: linear-gradient(135deg, #FFF5F7 0%, #FFE4ED 50%, #FFD4E5 100%);
--gradient-card: linear-gradient(to bottom, #FFFFFF 0%, #FAFAFA 100%);
```

---

## 📝 字体系统

### 字体栈

```css
/* 主字体 - 优先使用系统字体 */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
             'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue',
             Helvetica, Arial, sans-serif;

/* 衬线字体 - 用于装饰性标题 */
--font-serif: 'Noto Serif SC', 'Songti SC', Georgia, serif;

/* 等宽字体 - 用于代码或数字 */
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
```

### 字体大小

```css
/* 受 Airbnb 启发的字体比例系统 */
--text-xs: 0.75rem;      /* 12px - 辅助信息 */
--text-sm: 0.875rem;     /* 14px - 次要文本 */
--text-base: 1rem;       /* 16px - 正文 */
--text-lg: 1.125rem;     /* 18px - 强调文本 */
--text-xl: 1.25rem;      /* 20px - 小标题 */
--text-2xl: 1.5rem;      /* 24px - 卡片标题 */
--text-3xl: 1.875rem;    /* 30px - 页面标题 */
--text-4xl: 2.25rem;     /* 36px - Hero标题 */
--text-5xl: 3rem;        /* 48px - 大型标题 */
```

### 字重

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 行高

```css
--leading-tight: 1.25;    /* 标题 */
--leading-normal: 1.5;    /* 正文 */
--leading-relaxed: 1.75;  /* 长文本 */
```

---

## 📐 间距系统

### 受 Airbnb 启发的间距标准

```css
/* Micro 间距 - 组件内部 */
--spacing-1: 0.25rem;    /* 4px */
--spacing-2: 0.5rem;     /* 8px */
--spacing-3: 0.75rem;    /* 12px */
--spacing-4: 1rem;       /* 16px */
--spacing-5: 1.25rem;    /* 20px */
--spacing-6: 1.5rem;     /* 24px */

/* Macro 间距 - 组件之间 */
--spacing-8: 2rem;       /* 32px */
--spacing-10: 2.5rem;    /* 40px */
--spacing-12: 3rem;      /* 48px */
--spacing-16: 4rem;      /* 64px */
--spacing-20: 5rem;      /* 80px */
```

---

## 🔲 圆角系统

```css
/* 受 Airbnb 启发的圆角等级 */
--radius-sm: 0.25rem;    /* 4px - 小元素 */
--radius-md: 0.5rem;     /* 8px - 按钮 */
--radius-lg: 0.75rem;    /* 12px - 卡片 */
--radius-xl: 1rem;       /* 16px - 大卡片 */
--radius-2xl: 1.5rem;    /* 24px - Hero元素 */
--radius-full: 9999px;   /* 圆形 */
```

---

## 🌑 阴影系统

```css
/* Airbnb 风格的多层级阴影 */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

/* 樱花主题阴影 - 带粉色光晕 */
--shadow-sakura: 0 10px 25px -5px rgba(255, 122, 154, 0.15);
--shadow-sakura-lg: 0 20px 40px -10px rgba(255, 122, 154, 0.2);
```

---

## 🎯 组件标准

### 按钮

#### 主要按钮 (Primary)
```tsx
className="inline-flex items-center justify-center gap-2
           px-6 py-3 rounded-lg font-medium text-base
           bg-gradient-to-r from-pink-400 to-rose-500
           text-white shadow-md hover:shadow-lg
           transition-all duration-200 hover:scale-105
           disabled:opacity-50 disabled:cursor-not-allowed"
```

#### 次要按钮 (Secondary)
```tsx
className="inline-flex items-center justify-center gap-2
           px-6 py-3 rounded-lg font-medium text-base
           border-2 border-gray-300 bg-white
           text-gray-700 hover:bg-gray-50
           transition-colors duration-200"
```

#### 文本按钮 (Text)
```tsx
className="inline-flex items-center gap-1
           px-3 py-2 rounded-md font-medium text-sm
           text-gray-600 hover:text-gray-900
           hover:bg-gray-100 transition-colors"
```

### 卡片

#### 标准卡片
```tsx
className="bg-white rounded-xl border border-gray-200
           shadow-sm hover:shadow-md
           transition-shadow duration-300
           overflow-hidden"
```

#### 交互式卡片
```tsx
className="bg-white rounded-xl border border-gray-200
           shadow-sm hover:shadow-lg
           transition-all duration-300
           hover:scale-[1.02] hover:-translate-y-1
           cursor-pointer overflow-hidden"
```

### 输入框

```tsx
className="w-full px-4 py-3 rounded-lg
           border border-gray-300 bg-white
           text-gray-900 placeholder:text-gray-400
           focus:outline-none focus:ring-2
           focus:ring-pink-400 focus:border-transparent
           transition-colors"
```

### 徽章 (Badge)

```tsx
className="inline-flex items-center gap-1
           px-3 py-1 rounded-full
           text-xs font-semibold
           bg-pink-100 text-pink-700"
```

---

## 📱 响应式断点

```css
/* 受 Airbnb 启发的断点系统 */
--screen-sm: 640px;     /* 小屏手机 */
--screen-md: 768px;     /* 大屏手机/平板 */
--screen-lg: 1024px;    /* 笔记本 */
--screen-xl: 1280px;    /* 桌面 */
--screen-2xl: 1536px;   /* 大屏桌面 */
```

### 容器宽度

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1400px;   /* 最大宽度 */
```

---

## 🎨 设计模式

### Hero 区域

- **背景**: 樱花渐变背景 (`gradient-hero`)
- **高度**: 屏幕 60-80vh
- **文字**: 居中对齐，大标题 + 副标题
- **CTA**: 主要按钮 + 次要按钮
- **装饰**: 微妙的樱花图案 SVG

### 产品卡片网格

- **布局**: 响应式网格 (sm:2列, lg:3列, xl:4列)
- **间距**: gap-6 或 gap-8
- **卡片比例**: 图片 3:4，内容区域自适应
- **悬停**: 阴影加深 + 轻微上移

### 导航栏

- **样式**: sticky + backdrop-blur (毛玻璃效果)
- **高度**: 64px (h-16)
- **Logo**: 左对齐
- **导航**: 中间对齐 (桌面) / 隐藏 (移动)
- **操作**: 右对齐 (购物车、用户菜单)

### 页脚

- **背景**: 深灰色 (gray-900)
- **文字**: 浅色 (gray-300)
- **分栏**: 响应式 (1-4列)
- **社交图标**: 悬停显示樱花粉色

---

## 🎭 动画和过渡

### 标准过渡

```css
/* 通用过渡 */
transition: all 0.2s ease-in-out;

/* 颜色过渡 */
transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;

/* 阴影过渡 */
transition: box-shadow 0.2s ease-in-out;

/* 缩放过渡 */
transition: transform 0.2s ease-in-out;
```

### 悬停效果

```css
/* 卡片悬停 */
hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1

/* 按钮悬停 */
hover:shadow-md hover:scale-105

/* 链接悬停 */
hover:text-pink-500 hover:underline
```

### 加载动画

```css
/* 骨架屏 */
animate-pulse bg-gray-200

/* 旋转加载 */
animate-spin border-4 border-pink-500 border-t-transparent
```

---

## 🌸 樱花元素库

### SVG 装饰图案

```svg
<!-- 樱花花瓣 -->
<svg viewBox="0 0 60 60">
  <g fill="#f4a5b9" fill-opacity="0.05">
    <path d="M36 16c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zm-4 28c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
  </g>
</svg>

<!-- 樱花分支 -->
<!-- 可用于背景装饰 -->
```

### 图标库

使用 Lucide React 图标库，搭配樱花粉色：

```tsx
import { Cherry, Sparkles, Heart } from 'lucide-react';

<Cherry className="w-6 h-6 text-pink-400" />
<Sparkles className="w-5 h-5 text-pink-500" />
<Heart className="w-4 h-4 text-rose-500" />
```

---

## 📖 使用指南

### 1. 新建页面

```tsx
export default function NewPage() {
  return (
    <div className="flex flex-col">
      {/* Hero 区域 */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="container py-24">
          <h1 className="text-5xl font-bold mb-4">页面标题</h1>
          <p className="text-xl text-gray-600">副标题描述</p>
        </div>
      </section>

      {/* 内容区域 */}
      <section className="py-16 bg-white">
        <div className="container">
          {/* 内容 */}
        </div>
      </section>
    </div>
  );
}
```

### 2. 创建卡片组件

```tsx
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      {/* 图片 */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* 内容 */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-4">{product.description}</p>

        {/* 价格 */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-pink-500">
            ¥{product.price}
          </span>
          <button className="px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-lg hover:shadow-md transition-shadow">
            查看详情
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. 表单组件

```tsx
export function BookingForm() {
  return (
    <form className="space-y-6 bg-white rounded-xl shadow-md p-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          姓名
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="请输入您的姓名"
        />
      </div>

      <button className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
        提交预约
      </button>
    </form>
  );
}
```

---

## ✅ 设计检查清单

在创建新页面或组件时，确保：

- [ ] 使用樱花粉色作为主色调
- [ ] 遵循 Airbnb 风格的圆角系统 (8-16px)
- [ ] 添加适当的阴影层次
- [ ] 实现平滑的悬停过渡效果
- [ ] 确保响应式布局适配所有屏幕
- [ ] 使用系统化的间距 (4的倍数)
- [ ] 保持清晰的视觉层次
- [ ] 添加适当的 loading 和 empty 状态
- [ ] 确保可访问性 (ARIA 标签、键盘导航)
- [ ] 测试深色模式兼容性 (可选)

---

## 🚀 下一步行动

1. 更新 `tailwind.config.ts` 以包含自定义颜色和间距
2. 创建可复用的组件库 (`/src/components/ui/`)
3. 逐步更新现有页面以符合新设计系统
4. 创建 Storybook 以展示组件库 (可选)
5. 编写组件使用文档

---

*设计系统版本: v1.0*
*最后更新: 2025-10-21*
*基于 Airbnb 设计语言 + 日本樱花美学*
