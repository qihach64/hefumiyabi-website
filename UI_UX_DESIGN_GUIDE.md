# Kimono One UI/UX设计指南

> **设计理念**：Airbnb极简风格 + 和服樱花美学，打造简洁优雅的用户体验

---

## 🎨 设计系统概览

### 当前状态分析

✅ **已完成的设计要素**：
- 樱花粉红色系（sakura-50 ~ sakura-900）
- Airbnb风格灰度系统
- 圆角系统（8-24px）
- 阴影系统（xs ~ xl）
- 组件库基础（Button、Card、Badge）
- 响应式布局
- 卡片3:4比例（适配和服展示）

✅ **已有设计文档**：
- `DESIGN_SYSTEM.md` - 完整设计系统
- `globals.css` - 全局样式和CSS变量
- 组件库规范（CVA pattern）

### 设计特色

```
┌────────────────────────────────────────────────────┐
│  Airbnb极简        +      樱花美学                  │
│  - 清爽白底        -      温柔粉红                │
│  - 大图展示        -      传统优雅                │
│  - 宽松间距        -      精致细节                │
│  - 毛玻璃效果      -      樱花元素                │
└────────────────────────────────────────────────────┘
```

---

## 🌸 颜色系统

### 主色调 - 樱花粉

```css
/* 优先级使用顺序 */
--sakura-400: #FF7A9A  /* 主要CTA、强调 */
--sakura-500: #FF5780  /* 悬停状态 */
--sakura-600: #E63462  /* 深色文本、品牌色 */
--sakura-200: #FFC0D3  /* 背景、边框 */
--sakura-100: #FFE4ED  /* 浅背景 */
--sakura-50: #FFF5F7   /* 极浅背景 */
```

### 中性色系统

```css
/* 文本层级 */
--gray-900: #111827  /* 主标题 */
--gray-800: #1F2937  /* 重要文本 */
--gray-600: #4B5563  /* 正文 */
--gray-500: #6B7280  /* 次要文本 */
--gray-400: #9CA3AF  /* 占位符、禁用 */
--gray-300: #D1D5DB  /* 分隔线 */

/* 背景层级 */
--gray-50: #F9FAFB   /* 页面背景 */
--gray-100: #F3F4F6  /* 卡片背景 */
--gray-200: #E5E7EB  /* 边框 */
```

### 语义颜色

```css
--rausch-pink: #FF385C      /* Airbnb强调色 */
--success: #10B981           /* 成功状态 */
--warning: #F59E0B           /* 警告状态 */
--destructive: #EF4444       /* 错误状态 */
--info: #3B82F6              /* 信息提示 */
```

---

## 📐 间距系统

### 4px基础单位系统

```css
/* 微间距（组件内部） */
p-1  = 4px   /* 紧密元素 */
p-2  = 8px   /* 紧邻元素 */
p-3  = 12px  /* 相关元素 */
p-4  = 16px  /* 标准间距 */

/* 中间距（卡片内部） */
p-6  = 24px  /* 卡片padding */
p-8  = 32px  /* 大卡片padding */

/* 大间距（区域之间） */
p-12 = 48px  /* 区块间距 */
p-16 = 64px  /* 大区块间距 */
p-24 = 96px  /* 页面section */
```

### 使用原则

```tsx
// ✅ 正确的间距
<div className="p-6 space-y-4">  // 卡片padding + 内容间距
  <h3 className="mb-3">标题</h3>  // 紧挨下一个元素
  <p className="text-gray-600">内容</p>
</div>

// ❌ 错误的间距
<div className="p-5 space-y-3">  // 不是4的倍数
```

---

## 🔲 圆角系统

### Airbnb风格圆角

```css
rounded-sm   = 4px   /* 输入框、小元素 */
rounded-md   = 8px   /* 标准按钮 */
rounded-lg   = 12px  /* 卡片、主要按钮 */
rounded-xl   = 16px  /* 大卡片 */
rounded-2xl  = 24px  /* Hero元素 */
rounded-full = 9999px /* 圆形按钮、头像 */
```

### 使用场景

```tsx
// 按钮：rounded-lg (12px)
<Button className="rounded-lg">点击</Button>

// 卡片：rounded-xl (16px)
<Card className="rounded-xl border">内容</Card>

// 输入框：rounded-lg
<input className="rounded-lg border" />

// 头像：rounded-full
<img className="w-12 h-12 rounded-full" />
```

---

## 🌑 阴影系统

### 深度层级

```css
shadow-sm   /* 轻微阴影 - 卡片基础 */
shadow-md   /* 标准阴影 - 悬停状态 */
shadow-lg   /* 深度阴影 - 选中状态 */
shadow-xl   /* 强阴影 - 模态框 */
shadow-2xl  /* 最强阴影 - 底部栏 */

/* 樱花主题阴影 */
shadow-sakura     /* 粉色光晕效果 */
shadow-sakura-lg  /* 强调悬停 */
```

### 使用场景

```tsx
// 默认卡片
<Card className="shadow-sm">内容</Card>

// 悬停效果
<Card className="shadow-sm hover:shadow-lg">内容</Card>

// 浮动元素
<Button className="shadow-md hover:shadow-xl">点击</Button>

// 特殊强调
<div className="shadow-sakura">樱花主题元素</div>
```

---

## 🎭 组件规范

### 1. 按钮（Button）

#### 主要按钮（Primary）

```tsx
<Button variant="primary" size="lg">
  立即预订
</Button>

/* 样式 */
bg-gradient-to-r from-sakura-400 to-sakura-500
text-white
rounded-lg
shadow-md hover:shadow-lg
hover:scale-105
```

#### 次要按钮（Secondary）

```tsx
<Button variant="secondary">
  了解更多
</Button>

/* 样式 */
border-2 border-gray-300
bg-white
text-gray-700
hover:bg-gray-50
```

### 2. 卡片（Card）

#### 标准卡片

```tsx
<Card variant="default" padding="md">
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>内容</CardContent>
</Card>

/* 样式 */
bg-white
rounded-xl
border border-gray-200
shadow-sm
```

#### 交互式卡片

```tsx
<Card variant="interactive" padding="none">
  {/* 内容 */}
</Card>

/* 样式 */
rounded-xl
border border-gray-200
shadow-sm hover:shadow-lg
hover:scale-[1.02] hover:-translate-y-1
transition-all duration-300
```

### 3. 徽章（Badge）

```tsx
<Badge variant="warning" size="md">
  限时优惠
</Badge>

/* 样式 */
inline-flex items-center gap-1
px-3 py-1 rounded-full
bg-yellow-100 text-yellow-700
text-sm font-semibold
```

---

## 📱 布局规范

### 容器宽度

```css
container    /* Tailwind自动 */
max-w-2xl   /* 768px - 表单、详情 */
max-w-4xl   /* 1024px - 内容区 */
max-w-6xl   /* 1280px - 主要内容 */
max-w-7xl   /* 1536px - 全宽内容 */
```

### Grid布局

```tsx
/* 响应式网格 */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* 卡片 */}
</div>

/* 间距标准 */
gap-3  /* 12px - 移动端紧密 */
gap-4  /* 16px - 移动端标准 */
gap-6  /* 24px - 桌面端标准 */
gap-8  /* 32px - 大间距 */
```

### Flexbox布局

```tsx
/* 居中对齐 */
<div className="flex items-center justify-center gap-4">

/* 两端对齐 */
<div className="flex items-center justify-between">

/* 垂直堆叠 */
<div className="flex flex-col space-y-4">
```

---

## 🎬 动画规范

### 过渡效果

```tsx
/* 标准过渡 */
transition-all duration-300 ease-in-out

/* 快速过渡 */
transition-all duration-200

/* 慢速过渡 */
transition-all duration-500
```

### 悬停效果

```tsx
/* 卡片悬停 */
hover:shadow-lg
hover:scale-[1.02]
hover:-translate-y-1

/* 按钮悬停 */
hover:shadow-lg
hover:scale-105

/* 图片悬停 */
group-hover:scale-105
transition-transform duration-300

/* 文本悬停 */
hover:text-sakura-600
hover:underline
underline-offset-4
```

### 加载动画

```tsx
/* 旋转加载 */
animate-spin border-4 border-sakura-400 border-t-transparent

/* 脉冲骨架 */
animate-pulse bg-gray-200

/* 按钮加载 */
<Button loading>处理中</Button>
```

---

## 📏 组件规格

### 和服卡片（PlanCard）

```tsx
<div className="group block">
  {/* 图片容器 - 3:4比例 */}
  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
    <Image fill className="object-cover group-hover:scale-105" />
    
    {/* 收藏按钮 */}
    <button className="absolute top-3 right-3 p-2 rounded-full bg-white/90">
      <Heart />
    </button>
    
    {/* 优惠标签 */}
    <Badge className="absolute top-3 left-3">-20%</Badge>
  </div>
  
  {/* 信息区域 */}
  <div className="mt-3 space-y-1">
    <h3 className="font-semibold text-gray-900 line-clamp-2">套餐名称</h3>
    <p className="text-sm text-gray-600">女士 · 3小时</p>
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-semibold text-gray-900">¥3,000</span>
      <span className="text-sm text-gray-600">/ 人</span>
    </div>
  </div>
</div>
```

### 搜索栏（HeroSearchBar）

```tsx
/* 桌面端 - 横向展开 */
<div className="bg-white rounded-full shadow-xl p-2 gap-2">
  <div className="flex-1 px-6 py-3 rounded-full hover:bg-gray-50">
    <label className="block text-xs font-semibold text-gray-700">目的地</label>
    <input className="text-sm text-gray-900" />
  </div>
  <Button variant="primary" className="rounded-full px-8">
    <Search /> 搜索
  </Button>
</div>

/* 移动端 - 底部抽屉 */
```

### 预订卡片（BookingCard）

```tsx
<div className="sticky top-24 bg-white rounded-2xl shadow-xl p-6">
  {/* 价格区域 */}
  <div className="mb-6">
    <span className="text-2xl font-bold">¥3,000</span>
    <span className="text-gray-600">/ 人</span>
  </div>
  
  {/* 预订表单 */}
  <div className="space-y-4 mb-6">
    <div className="border border-gray-300 rounded-xl p-3">
      <input type="date" />
    </div>
    {/* 更多字段 */}
  </div>
  
  {/* CTA按钮 */}
  <Button variant="primary" size="lg" fullWidth>
    立即预订
  </Button>
</div>
```

---

## 🎨 视觉层次

### 字体大小层级

```css
/* 标题 */
text-5xl  /* 48px - Hero大标题 */
text-4xl  /* 36px - 页面标题 */
text-3xl  /* 30px - Section标题 */
text-2xl  /* 24px - 卡片标题 */
text-xl   /* 20px - 小标题 */

/* 正文 */
text-lg   /* 18px - 强调文本 */
text-base /* 16px - 正文 */
text-sm   /* 14px - 次要文本 */
text-xs   /* 12px - 辅助信息 */
```

### 字重层级

```css
font-bold     /* 700 - 最重要 */
font-semibold /* 600 - 强调 */
font-medium   /* 500 - 次强调 */
font-normal   /* 400 - 标准 */
```

### 颜色层级

```css
/* 文本颜色 */
text-gray-900  /* 最重要标题 */
text-gray-700  /* 正文 */
text-gray-600  /* 次要文本 */
text-gray-500  /* 弱化文本 */
text-gray-400  /* 占位符 */

/* 强调颜色 */
text-sakura-600  /* 品牌强调 */
text-sakura-700  /* 深色强调 */
```

---

## 📱 响应式断点

### 标准断点

```css
sm: 640px   /* 大屏手机 */
md: 768px   /* 平板 */
lg: 1024px  /* 笔记本 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏桌面 */
```

### 响应式模式

```tsx
/* 隐藏/显示 */
<div className="hidden md:block">桌面显示</div>
<div className="md:hidden">移动显示</div>

/* 网格响应式 */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

/* 文本大小响应式 */
<h1 className="text-2xl md:text-4xl lg:text-5xl">

/* 间距响应式 */
<div className="p-4 md:p-6 lg:p-8">
```

---

## ✨ 特殊效果

### 毛玻璃效果（Airbnb导航栏）

```tsx
<header className="backdrop-blur supports-[backdrop-filter]:bg-white/80">
```

### 渐变背景

```tsx
/* 樱花渐变 */
<div className="bg-gradient-to-br from-sakura-50 to-sakura-100">

/* Hero渐变 */
<div className="bg-hero-gradient">

/* 文字渐变 */
<div className="text-sakura-gradient">
```

### 圆形头像

```tsx
<div className="w-10 h-10 rounded-full bg-sakura-200">
  <img src="avatar.jpg" className="rounded-full" />
</div>
```

### 图片优化

```tsx
<Image
  src="/kimono.jpg"
  alt="和服"
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

## 🎯 设计检查清单

开发新页面或组件时，请确保：

### 颜色
- [ ] 使用樱花粉作为主色
- [ ] 文本层级清晰（900 > 700 > 600 > 500）
- [ ] 对比度符合可访问性标准

### 间距
- [ ] 所有间距都是4px的倍数
- [ ] 使用space-y或gap统一间距
- [ ] 大元素之间间距足够（48px+）

### 圆角
- [ ] 按钮：rounded-lg (12px)
- [ ] 卡片：rounded-xl (16px)
- [ ] 输入框：rounded-lg (12px)

### 阴影
- [ ] 卡片默认：shadow-sm
- [ ] 悬停效果：shadow-lg
- [ ] 模态框：shadow-2xl

### 响应式
- [ ] 移动端：单列布局
- [ ] 平板：2列布局
- [ ] 桌面：3-4列布局

### 动画
- [ ] 添加transition-all
- [ ] 悬停效果平滑（scale/shadows）
- [ ] 加载状态清晰

### 组件规范
- [ ] 使用统一组件库（Button/Card/Badge）
- [ ] 遵循命名规范
- [ ] 添加适当ARIA标签

---

## 📚 代码示例

### 完整页面结构

```tsx
export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero区域 */}
      <section className="bg-white border-b border-gray-100">
        <div className="container py-16">
          <h1 className="text-4xl font-bold mb-4">套餐列表</h1>
          <p className="text-lg text-gray-600">选择您的和服体验</p>
        </div>
      </section>

      {/* 内容区域 */}
      <section className="py-12">
        <div className="container">
          {/* 筛选器 */}
          <div className="mb-8">
            <FilterSidebar />
          </div>

          {/* 卡片网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

### 标准卡片列表

```tsx
<div className="space-y-6">
  {items.map(item => (
    <Card key={item.id} variant="interactive" className="cursor-pointer">
      <div className="flex gap-4">
        {/* 图片 */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
          <Image src={item.image} fill className="object-cover" />
        </div>
        
        {/* 内容 */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="sakura">热门</Badge>
            <span className="text-sm text-gray-500">¥{item.price}</span>
          </div>
        </div>
      </div>
    </Card>
  ))}
</div>
```

### 表单结构

```tsx
<form className="space-y-6">
  {/* 输入组 */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      姓名
    </label>
    <input
      type="text"
      className="w-full px-4 py-3 rounded-lg border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-sakura-400
                transition-colors"
      placeholder="请输入姓名"
    />
  </div>

  {/* 按钮组 */}
  <div className="flex gap-4">
    <Button variant="secondary" fullWidth>取消</Button>
    <Button variant="primary" fullWidth>提交</Button>
  </div>
</form>
```

---

## 🚀 实施指南

### 开发新页面的步骤

1. **规划布局**
   - 确定页面结构（Hero + Content + Footer）
   - 规划响应式断点

2. **选择组件**
   - 复用已有组件（Button/Card/Badge）
   - 遵循组件API设计

3. **应用样式**
   - 使用Tailwind工具类
   - 遵循间距系统（4px倍数）
   - 应用圆角和阴影

4. **添加交互**
   - 添加hover效果
   - 实现加载状态
   - 优化动画过渡

5. **响应式测试**
   - 测试各断点显示
   - 优化移动端体验
   - 确保触摸友好

6. **可访问性**
   - 添加ARIA标签
   - 确保键盘导航
   - 检查对比度

---

## 📖 参考资料

### 内部文档
- `DESIGN_SYSTEM.md` - 完整设计系统
- `globals.css` - 全局样式定义
- `/src/components/ui/` - 组件库

### 设计参考
- Airbnb - 极简设计和卡片布局
- Notion - 清爽的空白空间
- Linear - 微交互和动画
- Stripe - 专业的表单设计

### 工具
- Tailwind CSS 4 - 样式框架
- Lucide React - 图标库
- Next.js Image - 图片优化

---

## 🎓 设计原则总结

### 核心理念

```
简洁 > 华丽
空白 > 拥挤
清晰 > 炫酷
一致 > 多变
```

### 实现准则

1. **少即是多** - 移除不必要的装饰
2. **层次分明** - 用大小、颜色、间距表达重要性
3. **呼吸空间** - 慷慨使用空白
4. **平滑交互** - 所有操作都有视觉反馈
5. **移动优先** - 从小屏开始设计

---

*设计指南版本: v1.0*
*最后更新: 2025-01-21*
*维护者: Kimono One团队*

