# UI/UX 设计指南

> **目标**：创建一个美观、易用、一致的用户界面

---

## 🎨 设计系统概览

基于 **Airbnb 设计语言** + **樱花美学**，我们的设计系统强调：
- ✨ 简洁优雅
- 🌸 温暖亲和
- 🎯 清晰直观
- 📱 响应式设计

---

## 🎨 颜色系统

### 主色调 - 樱花粉

```css
--sakura-50:  #FFF5F7;  /* 背景、容器 */
--sakura-100: #FFE4E9;  /* 浅色背景 */
--sakura-200: #FFC9D4;  /* 边框、分隔 */
--sakura-300: #FFADBF;  /* 禁用状态 */
--sakura-400: #FF7A9A;  /* 品牌主色 */
--sakura-500: #FF5580;  /* 交互元素 */
--sakura-600: #E63462;  /* 强调、悬停 */
--sakura-700: #C72753;  /* 按下状态 */
--sakura-800: #A81D43;  /* 深色文字 */
--sakura-900: #8A1634;  /* 最深阴影 */
```

### Airbnb 灰度系统

```css
--gray-50:  #F9FAFB;  /* 最浅背景 */
--gray-100: #F3F4F6;  /* 卡片背景 */
--gray-200: #E5E7EB;  /* 边框 */
--gray-300: #D1D5DB;  /* 分隔线 */
--gray-400: #9CA3AF;  /* 图标 */
--gray-500: #6B7280;  /* 辅助文字 */
--gray-600: #4B5563;  /* 正文 */
--gray-700: #374151;  /* 副标题 */
--gray-800: #1F2937;  /* 标题 */
--gray-900: #111827;  /* 最深文字 */
```

### 语义化颜色

```css
/* 成功 */
--success: #10B981;

/* 警告 */
--warning: #F59E0B;

/* 错误 */
--error: #EF4444;

/* 信息 */
--info: #3B82F6;
```

### 颜色使用规范

| 元素 | 颜色 | 使用场景 |
|------|------|---------|
| 主要按钮 | sakura-400 ~ sakura-600 | CTA、确认操作 |
| 次要按钮 | gray-200 ~ gray-300 | 取消、返回 |
| 链接 | sakura-600 | 文字链接 |
| 标题 | gray-900 | H1-H6 |
| 正文 | gray-700 | 段落文字 |
| 辅助文字 | gray-600 | 说明、时间 |
| 图标 | sakura-500 | 装饰图标 |
| 边框 | gray-200 | 卡片、分隔线 |
| 背景 | gray-50 | 页面背景 |

---

## 📐 间距系统

### Spacing Scale (基于 4px)

```css
--spacing-1:  0.25rem;  /*  4px */
--spacing-2:  0.5rem;   /*  8px */
--spacing-3:  0.75rem;  /* 12px */
--spacing-4:  1rem;     /* 16px */
--spacing-5:  1.25rem;  /* 20px */
--spacing-6:  1.5rem;   /* 24px */
--spacing-8:  2rem;     /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
```

### Macro Spacing (章节间距)

| 层级 | 间距 | 使用场景 |
|------|------|---------|
| 页面 | py-16 md:py-24 | Section 上下间距 |
| 区块 | mb-12 md:mb-16 | 大模块之间 |
| 组件 | gap-8 | 卡片网格 |
| 元素 | gap-4 | 小组件间距 |

### Micro Spacing (组件内间距)

| 层级 | 间距 | 使用场景 |
|------|------|---------|
| 容器 | p-8 | 卡片内边距 |
| 内容 | p-6 | 小卡片内边距 |
| 按钮 | px-6 py-3 | 标准按钮 |
| 图标 | gap-2 | 图标与文字 |

---

## 🔲 圆角系统

```css
--radius-sm:  0.25rem;  /*  4px - 小元素 */
--radius-md:  0.5rem;   /*  8px - 按钮、徽章 */
--radius-lg:  0.75rem;  /* 12px - 输入框 */
--radius-xl:  1rem;     /* 16px - 卡片 */
--radius-2xl: 1.5rem;   /* 24px - 大卡片 */
--radius-full: 9999px;  /* 圆形 */
```

### 使用场景

| 元素 | 圆角 | Tailwind Class |
|------|------|---------------|
| 按钮 | 8px | rounded-lg |
| 卡片 | 16px | rounded-xl |
| 徽章 | 全圆 | rounded-full |
| 输入框 | 12px | rounded-lg |
| 图片 | 12px | rounded-lg |
| 头像 | 全圆 | rounded-full |

---

## 🎭 阴影系统

```css
/* 扁平阴影 - Airbnb 风格 */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* 樱花主题阴影 */
--shadow-sakura: 0 10px 25px -5px rgb(255 122 154 / 0.15);
```

### 交互状态阴影

```
静态:        shadow-sm
悬停:        shadow-lg
按下:        shadow-sm (回落)
浮动元素:    shadow-xl
```

---

## 📝 字体系统

### 字体栈

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Noto Sans CJK SC', 'Noto Sans SC', 'Microsoft YaHei',
             sans-serif;
```

### 字体大小 (Type Scale)

| 用途 | 大小 | Line Height | Tailwind |
|------|------|-------------|----------|
| Hero 标题 | 48-64px | 1.1 | text-5xl/text-6xl |
| H1 | 36-48px | 1.2 | text-4xl |
| H2 | 30-36px | 1.3 | text-3xl |
| H3 | 24px | 1.4 | text-2xl |
| H4 | 20px | 1.5 | text-xl |
| Body Large | 18px | 1.6 | text-lg |
| Body | 16px | 1.6 | text-base |
| Small | 14px | 1.5 | text-sm |
| Tiny | 12px | 1.4 | text-xs |

### 字重

```css
--font-normal:  400;  /* 正文 */
--font-medium:  500;  /* 强调 */
--font-semibold: 600; /* 小标题 */
--font-bold:    700;  /* 大标题 */
```

---

## 🧩 组件设计规范

### Button 组件

#### Variants
```tsx
// Primary - 主要操作
<Button variant="primary">预约和服</Button>

// Secondary - 次要操作
<Button variant="secondary">了解更多</Button>

// Outline - 边框按钮
<Button variant="outline">取消</Button>

// Ghost - 幽灵按钮
<Button variant="ghost">返回</Button>
```

#### Sizes
```tsx
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>  // 默认
<Button size="lg">大按钮</Button>
<Button size="xl">超大按钮</Button>
```

#### States
```
Default:  默认状态
Hover:    scale(1.02) + shadow-lg
Active:   scale(0.98) + shadow-sm
Disabled: opacity-50 + cursor-not-allowed
Loading:  spinner + 禁用点击
```

### Card 组件

#### 标准卡片
```tsx
<Card variant="default" className="p-6">
  <CardHeader>
    <CardTitle>套餐名称</CardTitle>
    <CardDescription>套餐描述</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 内容 */}
  </CardContent>
  <CardFooter>
    {/* 操作按钮 */}
  </CardFooter>
</Card>
```

#### 交互卡片
```tsx
<Card variant="interactive" className="hover:scale-[1.01]">
  {/* 带悬停效果的卡片 */}
</Card>
```

### Badge 组件

```tsx
<Badge variant="sakura">樱花季</Badge>
<Badge variant="success">已确认</Badge>
<Badge variant="warning">待支付</Badge>
<Badge variant="info">已付定金</Badge>
```

---

## 📐 布局规范

### Container 宽度

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 0 2rem;
  }
}
```

### Grid 系统

```tsx
// 2 列网格
<div className="grid md:grid-cols-2 gap-8">
  {/* 内容 */}
</div>

// 3 列网格
<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">
  {/* 内容 */}
</div>

// 4 列网格
<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 内容 */}
</div>
```

### 响应式断点

```css
sm:  640px   /* 小屏幕手机 */
md:  768px   /* 平板 */
lg:  1024px  /* 笔记本 */
xl:  1280px  /* 桌面 */
2xl: 1536px  /* 大屏 */
```

---

## 🎬 动画和过渡

### Transition Duration

```css
transition-all duration-200  /* 快速 - 按钮 */
transition-all duration-300  /* 标准 - 卡片 */
transition-all duration-500  /* 慢速 - 大元素 */
```

### 常用动画

#### 悬停缩放
```tsx
className="hover:scale-[1.02] transition-all duration-300"
```

#### 悬停上移
```tsx
className="hover:-translate-y-1 transition-all duration-300"
```

#### 旋转动画
```tsx
className="group-open:rotate-180 transition-transform"
```

#### 淡入动画
```tsx
className="animate-in fade-in duration-300"
```

---

## 🖼️ 图片处理规范

### Next.js Image 组件

```tsx
<Image
  src="/path/to/image.jpg"
  alt="描述文字"
  width={800}
  height={600}
  className="rounded-lg"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 图片比例

| 用途 | 比例 | 尺寸示例 |
|------|------|---------|
| 和服图片 | 3:4 | 600x800 |
| 横幅图 | 16:9 | 1920x1080 |
| 正方形 | 1:1 | 800x800 |
| 店铺照片 | 4:3 | 800x600 |

---

## ♿ 可访问性规范

### 颜色对比度

- 正文文字：至少 4.5:1
- 大文字 (18px+)：至少 3:1
- 图标：至少 3:1

### 键盘导航

```tsx
// 所有交互元素支持 Tab 键
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  点击
</button>
```

### ARIA 标签

```tsx
<button aria-label="关闭对话框">
  <X className="w-4 h-4" />
</button>

<img src="..." alt="浅草寺前穿和服的女孩" />
```

---

## 📱 移动端优化

### Touch Target

所有可点击元素最小 44x44px

```tsx
className="min-h-[44px] min-w-[44px]"
```

### 移动端适配

```tsx
// 移动端全宽按钮
<Button className="w-full sm:w-auto">
  预约
</Button>

// 移动端隐藏文字
<span className="hidden sm:inline">
  了解更多
</span>
```

---

## 🎨 实用工具类

### 背景渐变

```css
/* 樱花渐变 */
.bg-hero-gradient {
  background: linear-gradient(135deg,
    var(--sakura-50) 0%,
    var(--sakura-100) 50%,
    #FFD4E5 100%
  );
}

/* Airbnb 渐变 */
.bg-airbnb-gradient {
  background: linear-gradient(to right,
    var(--sakura-400),
    var(--sakura-500)
  );
}
```

### 玻璃态效果

```css
.glass-effect {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);
}
```

### 卡片悬停

```css
.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

---

## 📋 设计检查清单

在发布新页面前，请确保：

- [ ] 使用统一的颜色系统
- [ ] 间距符合 4px 倍数规范
- [ ] 圆角使用预定义值
- [ ] 阴影使用设计系统
- [ ] 字体大小和行高正确
- [ ] 响应式设计完整
- [ ] 悬停/点击状态清晰
- [ ] 颜色对比度达标
- [ ] 键盘导航可用
- [ ] 图片优化和 lazy loading
- [ ] ARIA 标签完整

---

**最后更新**: 2025-10-20
**参考**: Airbnb Design Language System
