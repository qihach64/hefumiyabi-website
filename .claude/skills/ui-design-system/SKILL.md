---
name: ui-design-system
description: 当编写、修改或审查前端 UI 代码时使用此 skill。确保所有 React 组件、Tailwind CSS 类名和设计决策严格遵循项目的 Airbnb + 樱花美学设计系统。
allowed-tools: Read, Edit, Write, Grep, Glob
---

# UI Design System - 前端设计规范 Skill

**使命**：确保每一行前端代码都符合项目的设计系统，保持视觉一致性和用户体验的连贯性。

> 🎨 **设计理念**：Airbnb 极简风格 + 和服樱花美学 = 简洁优雅的用户体验

---

## 🚨 核心原则（必须遵守）

### 1. 永远不要随意修改现有设计风格
- ❌ 不要引入新的颜色值（除非在设计系统中已定义）
- ❌ 不要使用非标准的间距（必须是 4 的倍数）
- ❌ 不要改变已有组件的圆角、阴影、字体大小
- ❌ 不要创建与现有风格不一致的新组件

### 2. 优先使用现有组件和模式
- ✅ 查找 `src/components/` 中是否已有类似组件
- ✅ 复用 `UI_UX_DESIGN_GUIDE.md` 中定义的样式
- ✅ 参考现有页面的布局模式

### 3. 保持设计系统的完整性
- ✅ 所有新样式必须在 `UI_UX_DESIGN_GUIDE.md` 中有依据
- ✅ 使用设计 token（CSS 变量）而非硬编码值
- ✅ 遵循 Airbnb 的视觉语言

---

## 🎨 颜色系统（严格遵守）

### 主色调 - 樱花粉（Sakura）

**使用优先级**：
```tsx
// ✅ 正确使用 - ONLY Sakura 主题色
bg-sakura-50     // 极浅背景（卡片背景、浅色区域）
bg-sakura-100    // 浅背景（hover 状态、渐变）
bg-sakura-200    // 边框、分割线
bg-sakura-400    // 主要 CTA 按钮、渐变起点
bg-sakura-500    // 悬停状态、渐变终点
bg-sakura-600    // 深色按钮、品牌色、强调元素
bg-sakura-700    // 按钮 hover、深色文本
text-sakura-600  // 强调文本、图标
text-sakura-700  // 深色强调文本

// ⚠️ Sakura 渐变（推荐）
bg-gradient-to-r from-sakura-50 to-sakura-100    // 浅色渐变
bg-gradient-to-r from-sakura-400 to-sakura-500   // 按钮渐变

// ❌ 严格禁止使用 - 这些颜色会破坏主题一致性！
bg-pink-500           // ❌ 不要使用 Tailwind 默认的 pink
bg-rose-400           // ❌ 不要使用 rose
bg-purple-600         // ❌ 绝对禁止！土气！
bg-violet-500         // ❌ 绝对禁止！
bg-indigo-600         // ❌ 绝对禁止！
from-purple-600       // ❌ 渐变也不行！
to-pink-600           // ❌ 渐变也不行！
text-purple-600       // ❌ 文本也不行！
border-purple-500     // ❌ 边框也不行！
#FF69B4               // ❌ 不要使用硬编码颜色
#9333EA               // ❌ 不要使用硬编码紫色
```

**🚨 特别警告：AI 功能相关元素**
```tsx
// ❌ 错误示例（土气、不一致）
<div className="bg-gradient-to-r from-purple-600 to-pink-600">
  AI 生成
</div>
<button className="bg-gray-900">查看大图</button>

// ✅ 正确示例（符合 Sakura 主题）
<div className="bg-sakura-600">
  AI 生成
</div>
<button className="bg-sakura-600 hover:bg-sakura-700">查看大图</button>
```

### 中性色系统

**文本层级**（严格遵守）：
```tsx
// ✅ 正确的文本颜色
text-gray-900    // 主标题、重要文本
text-gray-800    // 二级标题
text-gray-700    // 正文文本
text-gray-600    // 次要文本
text-gray-500    // 占位符、禁用状态
text-gray-400    // 辅助信息

// ❌ 禁止使用
text-black       // 太硬，不柔和
text-gray-950    // 不在设计系统中
text-slate-600   // 不要使用 slate
```

### 语义颜色（仅用于状态提示）

```tsx
// ✅ 状态颜色（仅限状态提示，不用于主题元素）
bg-green-50 text-green-700    // 成功状态
bg-yellow-50 text-yellow-700  // 警告状态
bg-red-50 text-red-700        // 错误状态
bg-blue-50 text-blue-700      // 信息提示

// ❌ 禁止
bg-emerald-50    // ❌ 使用 green
bg-amber-50      // ❌ 使用 yellow
bg-purple-50     // ❌ 绝对禁止！如需主题色用 sakura-50
bg-indigo-50     // ❌ 绝对禁止！
```

**🚨 重要**：语义颜色仅用于状态提示（成功/警告/错误），**不要用于品牌元素、按钮、卡片等主题相关的地方**。所有品牌相关元素必须使用 **sakura** 色系！

---

## 📐 间距系统（4px 基础单位）

### 标准间距值

**必须使用**：
```tsx
// ✅ 正确的间距（4 的倍数）
gap-1  gap-2  gap-3  gap-4     // 微间距（4-16px）
gap-6  gap-8                   // 中间距（24-32px）
gap-12 gap-16 gap-24           // 大间距（48-96px）

p-3  p-4  p-6  p-8             // 内边距
mb-3 mb-4 mb-6 mb-8            // 外边距

// ❌ 禁止使用（不是 4 的倍数）
gap-5  gap-7  gap-9  gap-11
p-5    p-7    p-9
space-y-5  space-y-7
```

### 间距使用场景

```tsx
// ✅ 正确示例
<div className="p-6 space-y-4">        // 卡片：24px padding + 16px 内容间距
<div className="grid gap-4 md:gap-6">  // 网格：移动 16px，桌面 24px
<div className="mb-3">                 // 标题与内容：12px

// ❌ 错误示例
<div className="p-5 space-y-3">        // ❌ 5 和 3 不是标准值
<div className="grid gap-5">           // ❌ 5 不符合规范
```

---

## 🔲 圆角系统（Airbnb 风格）

### 标准圆角值

```tsx
// ✅ 正确使用
rounded-lg       // 12px - 按钮、输入框（最常用）
rounded-xl       // 16px - 卡片（最常用）
rounded-2xl      // 24px - Hero 元素、大卡片
rounded-full     // 圆形 - 头像、图标按钮

// ❌ 禁止使用
rounded-md       // ❌ 使用 rounded-lg 代替
rounded-3xl      // ❌ 太大，不符合 Airbnb 风格
rounded-sm       // ❌ 太小，除非特殊情况
```

### 使用场景

```tsx
// ✅ 正确
<Button className="rounded-lg">      // 按钮
<Card className="rounded-xl">        // 卡片
<Image className="rounded-xl">       // 图片
<Avatar className="rounded-full">    // 头像

// ❌ 错误
<Button className="rounded-md">      // ❌ 应该用 rounded-lg
<Card className="rounded-lg">        // ❌ 应该用 rounded-xl
```

---

## 🎭 组件规范

### 1. Badge（徽章）组件

**必须使用 variant 属性**：

```tsx
// ✅ 正确使用
<Badge variant="error" size="sm">限时优惠</Badge>
<Badge variant="warning" size="md">热门</Badge>
<Badge variant="success" size="sm">已完成</Badge>
<Badge variant="sakura" size="sm">樱花季</Badge>

// ❌ 禁止自定义样式
<div className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
  限时优惠
</div>
```

### 2. Button（按钮）组件

**标准样式**：

```tsx
// ✅ 主要按钮
<Button variant="primary" size="lg" className="rounded-lg">
  立即预订
</Button>
// 样式：bg-sakura-600 hover:bg-sakura-700

// ✅ 次要按钮
<Button variant="secondary" className="rounded-lg">
  了解更多
</Button>
// 样式：border-2 border-gray-300 bg-white

// ❌ 禁止自定义按钮样式
<button className="bg-blue-500 text-white px-4 py-2">
  点击
</button>
```

### 3. Card（卡片）组件

**标准卡片模式**：

```tsx
// ✅ 正确的卡片结构
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-3">标题</h3>
  <p className="text-gray-600">内容</p>
</div>

// ✅ 交互式卡片（带 hover）
<div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
  {/* 内容 */}
</div>

// ❌ 禁止使用非标准样式
<div className="bg-gray-100 rounded-md shadow p-4">  // ❌ 错误的背景、圆角、间距
```

### 4. 套餐卡片（PlanCard）

**必须使用 3:4 比例**：

```tsx
// ✅ 正确的图片容器
<div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
  <Image
    src={imageUrl}
    alt={name}
    fill
    className="object-cover group-hover:scale-105 transition-transform duration-300"
  />
</div>

// ❌ 禁止使用其他比例
<div className="relative aspect-square">        // ❌ 1:1
<div className="relative aspect-video">         // ❌ 16:9
<div className="relative h-64 w-full">          // ❌ 固定高度
```

---

## 📱 响应式布局规范

### Grid 布局模式

```tsx
// ✅ 标准响应式网格
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
  {/* 卡片 */}
</div>

// ✅ 两栏布局
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// ❌ 禁止不规则的网格
<div className="grid grid-cols-3 lg:grid-cols-5">  // ❌ 跳过 md 断点
```

### 容器宽度

```tsx
// ✅ 标准容器
max-w-[1280px]   // 主内容区（Airbnb 标准）
max-w-6xl        // 1280px
max-w-4xl        // 1024px（表单、详情）

// ❌ 禁止随意宽度
max-w-[1400px]   // ❌ 非标准值
max-w-screen-2xl // ❌ 太宽
```

---

## 🎬 动画和过渡

### 标准过渡时长

```tsx
// ✅ 正确的动画时长
transition-all duration-300   // 标准（最常用）
transition-all duration-200   // 快速
transition-all duration-500   // 慢速

// ❌ 禁止随意时长
transition-all duration-150   // ❌ 太快
transition-all duration-700   // ❌ 太慢
```

### Hover 效果模式

```tsx
// ✅ 卡片 hover（Airbnb 风格）
className="hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"

// ✅ 按钮 hover
className="hover:shadow-lg hover:scale-105 transition-all duration-300"

// ✅ 图片 hover
className="group-hover:scale-105 transition-transform duration-300"

// ❌ 禁止过度动画
className="hover:scale-110"          // ❌ 缩放太大
className="hover:rotate-6"           // ❌ 不符合风格
```

---

## 🔤 字体规范

### 字号系统

**使用固定像素值（Airbnb 风格）**：

```tsx
// ✅ 正确的字号
text-[32px]  // 大标题
text-[26px]  // 标题
text-[22px]  // 小标题
text-[18px]  // 大正文
text-[16px]  // 正文（最常用）
text-[15px]  // 次要文本
text-[14px]  // 辅助文本
text-[12px]  // 极小文本

// ❌ 禁止使用 Tailwind 默认值
text-4xl     // ❌ 使用 text-[32px]
text-2xl     // ❌ 使用 text-[26px]
text-xl      // ❌ 使用 text-[22px]
text-lg      // ❌ 使用 text-[18px]
text-base    // ❌ 使用 text-[16px]
text-sm      // ❌ 使用 text-[15px]
```

### 字重规范

```tsx
// ✅ 正确使用
font-semibold    // 600 - 标题、强调
font-medium      // 500 - 次要标题
font-normal      // 400 - 正文

// ❌ 禁止使用
font-bold        // ❌ 太重，使用 font-semibold
font-light       // ❌ 太轻，使用 font-normal
```

---

## 🚀 实施流程

### 编写新组件时

1. **检查是否有现有组件可复用**
   ```bash
   # 搜索类似组件
   ls src/components/ | grep -i "card\|button\|badge"
   ```

2. **阅读设计指南**
   ```bash
   # 查看完整设计系统
   cat UI_UX_DESIGN_GUIDE.md
   ```

3. **使用设计 token**
   ```tsx
   // ✅ 使用 Tailwind 类名
   <div className="bg-sakura-50 text-gray-900">

   // ❌ 不要硬编码
   <div style={{ backgroundColor: '#FFF5F7', color: '#111827' }}>
   ```

### 修改现有组件时

1. **保持原有风格**
   - 不要改变圆角大小
   - 不要调整间距
   - 不要修改颜色

2. **增量改进**
   - 只修改必要的部分
   - 保持其他样式不变

3. **验证一致性**
   - 对比类似组件
   - 确保视觉统一

---

## ⚠️ 常见错误和修正

### 错误 1：使用非标准间距

```tsx
// ❌ 错误
<div className="p-5 gap-7 mb-9">

// ✅ 正确
<div className="p-6 gap-8 mb-8">
```

### 错误 2：混用字号系统

```tsx
// ❌ 错误
<h1 className="text-3xl">标题</h1>
<p className="text-base">内容</p>

// ✅ 正确
<h1 className="text-[26px]">标题</h1>
<p className="text-[16px]">内容</p>
```

### 错误 3：自定义按钮样式

```tsx
// ❌ 错误
<button className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-md">
  点击
</button>

// ✅ 正确
<Button variant="primary" size="lg" className="rounded-lg">
  点击
</Button>
```

### 错误 4：破坏 Airbnb 风格

```tsx
// ❌ 错误（Material Design 风格）
<Card className="shadow-2xl rounded-sm">

// ✅ 正确（Airbnb 风格）
<Card className="shadow-sm hover:shadow-lg rounded-xl">
```

---

## 📋 检查清单

在提交代码前，确保：

- [ ] 所有颜色值都在设计系统中定义
- [ ] 所有间距都是 4 的倍数
- [ ] 使用 `text-[Npx]` 而非 `text-lg/xl`
- [ ] 按钮使用 `rounded-lg`
- [ ] 卡片使用 `rounded-xl`
- [ ] 套餐卡片图片使用 `aspect-[3/4]`
- [ ] Hover 效果包含 `transition-all duration-300`
- [ ] 没有硬编码的颜色值（`#hex` 或 `rgb()`）
- [ ] 复用了现有的组件而非重新创建
- [ ] 阅读了相关的设计指南章节

---

## 📚 参考资源

**项目文档**：
- `UI_UX_DESIGN_GUIDE.md` - 完整设计系统
- `src/components/ui/` - 基础组件库
- `src/app/globals.css` - 全局样式和 CSS 变量

**外部参考**：
- Airbnb Design Language
- Tailwind CSS 文档
- 和服美学配色

---

## 🎯 目标

通过严格遵守这些规范，我们确保：

1. **视觉一致性**：所有页面看起来像一个产品
2. **开发效率**：减少重复代码，快速复用组件
3. **维护性**：设计系统集中管理，易于更新
4. **品牌形象**：Airbnb 极简 + 樱花美学的独特定位

**记住**：设计系统不是限制创造力，而是让我们在统一的框架内高效创作！🎨
