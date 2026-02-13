---
name: ui-design-system
description: |
  创建和优化符合日式 Zen + 樱花美学的前端界面。

  **触发场景** - 当用户说：
  - 写/做/加/改 界面、页面、组件、卡片、按钮
  - 优化/美化/调整 UI、样式、布局、颜色、间距
  - 好看一点、漂亮一点、更日式、更优雅
  - 改颜色、改字体、改间距、改圆角
  - 新建组件、重构页面、设计xxx
  - React/Tailwind/CSS 相关的前端代码
allowed-tools: Read, Edit, Write, Grep, Glob
---

# UI Design System - 日式 Zen + 樱花美学前端设计 Skill

> 🎨 **设计精神**：如同和服本身——看似简单，细节考究。追求优雅与含蓄，让每一个界面都散发宁静之美。

---

## 🎯 触发条件 (Trigger Conditions)

当用户提出以下类型的请求时，**主动使用此 skill**：

### 明确触发

- 写一个 xxx 组件 / 页面 / 卡片
- 优化 / 美化 / 调整 UI
- 改 xxx 的样式 / 颜色 / 布局
- 让 xxx 更好看 / 更日式 / 更优雅
- 新建 / 重构 React 组件

### 隐式触发

- 涉及 Tailwind CSS 类名修改
- 涉及颜色、字体、间距、圆角等视觉属性
- 创建或修改 `.tsx` 文件中的 JSX 结构
- 讨论页面布局或用户体验

### 不触发

- 纯后端 API 逻辑
- 数据库操作
- 非视觉相关的 TypeScript 类型定义

---

## 🎎 和服美学核心哲学

### 设计精神：「雅」(Miyabi)

> 追求优雅与含蓄，避免过度装饰。如同和服本身——看似简单，细节考究。

**三大原则**：

1. **侘寂 (Wabi-Sabi)**：不完美中的美，温暖的米白背景而非冷酷的纯白
2. **間 (Ma)**：留白的艺术，让内容呼吸，避免信息过载
3. **雅 (Miyabi)**：含蓄的优雅，装饰点到为止，功能优先

---

## 🚫 快速查阅：绝对禁止 (Anti-patterns)

**在写任何前端代码前，先检查这些常见错误：**

### 颜色禁区

```tsx
// ❌ 绝对禁止的颜色
bg-rose-*      // 用 sakura-* 代替（认证页常见错误）
bg-pink-*      // 用 sakura-* 代替
bg-purple-*    // 土气！用 sakura-*
bg-violet-*    // 土气！用 sakura-*
bg-indigo-*    // 不协调
from-rose-* to-pink-*     // 认证页常见错误
from-purple-* to-pink-*   // AI slop 渐变
from-blue-* via-purple-*  // AI 聊天框常见错误，用 sakura-*
// ⚠️ blue-* 仅限语义用途（信息提示 bg-blue-50），禁止用于品牌/主题元素
```

### 间距禁区

```tsx
// ❌ 禁止非 4 倍数
gap-5  gap-7  gap-9  p-5  p-7  mb-5  mb-9
// ✅ 只用 4 的倍数
gap-4  gap-6  gap-8  p-4  p-6  mb-4  mb-8
```

### 字号禁区

```tsx
// ❌ 禁止 Tailwind 默认字号
text-sm  text-base  text-lg  text-xl  text-2xl
// ✅ 使用固定像素值
text-[12px]  text-[14px]  text-[15px]  text-[16px]  text-[22px]  text-[26px]
```

### 圆角禁区

```tsx
// ❌ 禁止
rounded-md  rounded-sm  rounded-3xl
// ✅ 只用
rounded-lg (按钮)  rounded-xl (卡片)  rounded-2xl (Hero)  rounded-full (头像)
```

### 动画禁区

```tsx
// ❌ 禁止
duration-100  duration-150  duration-700  duration-1000
animate-bounce  animate-ping  hover:rotate-*  hover:scale-110
// ✅ 只用
duration-200  duration-300  duration-500
hover:scale-105  hover:-translate-y-1
```

### 行为禁区

```tsx
// ❌ 内部链接禁止新窗口打开（电商体验差）
<Link href="/plans/[id]" target="_blank">  // ❌ 绝对禁止

// ❌ 禁止 emoji 作为专业页面的占位图
<span className="text-6xl">👘</span>       // ❌ 用 Lucide 图标或 SVG 装饰代替

// ❌ 禁止在组件中留调试代码
console.log(...)                            // ❌ 生产组件中不允许
let renderCount = 0                         // ❌ 调试计数器
performance.now()                           // ❌ 非必要的性能测量

// ❌ 禁止用 /logo.png 图片作 Logo — 全站统一用 CSS 家纹
<Image src="/logo.png" />                   // ❌ 用下方「品牌家纹」组件
```

---

## 🏯 品牌家纹组件（Brand Kamon）

全站统一的 CSS 家纹 Logo，**禁止使用 /logo.png 图片**。

### 标准家纹（3 种尺寸）

```tsx
// 尺寸映射
const kamonSizes = {
  sm: "w-8 h-8", // Footer、次要位置
  md: "w-10 h-10", // Header（默认）
  lg: "w-14 h-14", // Auth 页面、独立页面
};

// ✅ 标准家纹 JSX（以 md 为例）
<div className="relative w-10 h-10 shrink-0">
  <div className="absolute inset-0 rounded-full border-2 border-sakura-500" />
  <div
    className="absolute inset-1 rounded-full border border-sakura-400/50"
    style={{
      background:
        "repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(236, 72, 153, 0.06) 30deg 60deg)",
    }}
  />
  <div className="absolute inset-[6px] rounded-full bg-white" />
  <div className="absolute inset-0 flex items-center justify-center">
    <span
      className="font-serif text-[14px] font-medium text-sakura-600 select-none"
      style={{ fontFamily: '"Noto Serif JP", "Source Han Serif", serif' }}
    >
      一
    </span>
  </div>
</div>;
```

### 品牌名排版（家纹旁边）

```tsx
// ✅ Header/Footer 品牌名
<div className="flex flex-col leading-none">
  <span className="font-serif text-[18px] text-sakura-600">
    <span className="italic font-medium">Kimono</span>
    <span className="font-light ml-1">One</span>
  </span>
  <span className="text-[10px] tracking-[0.25em] mt-1 font-medium text-sakura-500/70">
    着物レンタル
  </span>
</div>
```

### 使用场景

| 场景         | 尺寸      | 背景色         | 注意                        |
| ------------ | --------- | -------------- | --------------------------- |
| Header       | md (w-10) | `bg-white`     | 支持 hover/transparent 切换 |
| Footer       | sm (w-10) | `bg-[#FDFBF7]` | 内圈背景色匹配 Footer 背景  |
| Auth 页面    | lg (w-14) | `bg-white`     | 居中展示，无需 hover 效果   |
| About/独立页 | lg+       | 按需           | 可放大用作装饰性图案        |

---

## 🔤 字体系统（Typography）

### 字体家族

| 用途     | 字体类名      | 字体栈                   | 示例文本                       |
| -------- | ------------- | ------------------------ | ------------------------------ |
| 日文标题 | `font-mincho` | Shippori Mincho          | 「一の着物」「京都・和服体験」 |
| 中文标题 | `font-serif`  | Noto Serif SC (思源宋体) | 套餐详情、限时优惠             |
| 正文内容 | `font-sans`   | Noto Sans SC             | 描述文字、按钮文案             |

### 使用规范

```tsx
// ✅ 日文标题 - 用明朝体
<h1 className="font-mincho text-[42px]">一の着物</h1>
<span className="font-mincho text-sm">伝統と現代の融合</span>

// ✅ 中文标题 - 用思源宋体
<h2 className="font-serif text-[26px]">套餐详情</h2>
<h3 className="font-serif text-[22px]">包含内容</h3>

// ✅ 正文内容 - 用黑体（默认）
<p className="text-[16px]">描述正文...</p>
<button className="font-medium">立即预订</button>

// ❌ 禁止混用
<h1 className="font-sans">一の着物</h1>  // ❌ 日文不要用黑体
<p className="font-serif">正文内容</p>    // ❌ 正文不要用宋体
```

### 字体使用场景速查

| 场景         | 字体                          | 示例                |
| ------------ | ----------------------------- | ------------------- |
| Hero 主标题  | `font-mincho`                 | 一の着物            |
| 竖排装饰文字 | `font-mincho`                 | 京都・和服体験      |
| 区块标题     | `font-serif`                  | 套餐详情            |
| 卡片标题     | `font-sans` + `font-semibold` | 经典女士套餐        |
| 正文描述     | `font-sans`                   | 包含专业着装服务... |
| 按钮/标签    | `font-sans` + `font-medium`   | 立即预订            |

---

## 🏠 页面氛围系统（Page Atmosphere）

### 背景色规范

| 页面类型   | 背景色 | CSS 类         | 氛围描述                              |
| ---------- | ------ | -------------- | ------------------------------------- |
| 高能量页   | 纯白   | `bg-white`     | 首页、搜索结果 - 明亮开放，激发探索欲 |
| 沉浸体验页 | 米白   | `bg-[#FDFBF7]` | 详情页、预览页 - 温暖宁静，如宣纸质感 |
| 功能操作页 | 浅灰   | `bg-gray-50`   | 结账、表单、后台 - 中性专业，减少干扰 |

```tsx
// ✅ 首页 - 明亮白色
<div className="min-h-screen bg-white">

// ✅ 详情页 - 温暖米白（Zen 纸张质感）
<div className="min-h-screen bg-[#FDFBF7]">

// ✅ 结账页 - 中性灰
<div className="min-h-screen bg-gray-50">

// ❌ 禁止
<div className="min-h-screen bg-gray-100">  // ❌ 太冷
<div className="min-h-screen bg-sakura-50"> // ❌ 大面积粉色太刺眼
```

---

## ✨ 装饰元素系统（Decorative Elements）

### 1. 水平装饰线（全站统一使用）

用于区块标题前的装饰，增加日式仪式感：

```tsx
// ✅ 标准装饰线 + 英文小标题
<div className="flex items-center gap-3 mb-4">
  <div className="w-10 h-px bg-gradient-to-r from-sakura-400 to-transparent" />
  <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500 font-medium">
    Package Contents
  </span>
</div>

// ✅ 主题色装饰线（动态）
<div
  className="w-10 h-px"
  style={{ background: `linear-gradient(to right, ${themeColor}, transparent)` }}
/>
```

### 2. 竖排日文装饰（仅首页 Hero）

```tsx
// ✅ 仅在首页 Hero 使用
<div
  className="writing-vertical text-[#B8A89A]/50 text-sm tracking-[0.5em] font-mincho"
  style={{ writingMode: "vertical-rl" }}
>
  京都・和服体験
</div>

// ❌ 禁止在内容区域使用（可读性差）
```

### 3. 渐变分割线

```tsx
// ✅ 区块之间的柔和分割
<div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

// ✅ 主题色分割线
<div
  className="h-px"
  style={{ background: `linear-gradient(to right, transparent, ${themeColor}30, transparent)` }}
/>
```

---

## 🎬 动效哲学（Animation Philosophy）

### 核心原则

> **「静中有动」**：动效应该像和服上的暗纹，不喧宾夺主，但细看有惊喜。

### Framer Motion 使用范围

| 场景         | 是否使用  | 原因                   |
| ------------ | --------- | ---------------------- |
| 首页 Hero    | ✅ 使用   | 品牌展示，需要仪式感   |
| 页面入场     | ❌ 不使用 | 避免拖慢感知速度       |
| 详情页内容   | ❌ 不使用 | 用户需要快速浏览信息   |
| Modal/Drawer | ✅ 使用   | 状态转换需要平滑过渡   |
| 卡片 Hover   | ❌ 不使用 | 用 CSS transition 即可 |

### CSS Transition 规范

```tsx
// ✅ 标准过渡（最常用）
className = "transition-all duration-300";

// ✅ 缓慢优雅过渡（Zen 感）
className = "transition-all duration-500";

// ✅ 卡片 hover
className = "hover:shadow-lg hover:-translate-y-1 transition-all duration-300";

// ✅ 图片 hover
className = "group-hover:scale-105 transition-transform duration-700 ease-out";

// ❌ 禁止
className = "duration-100"; // ❌ 太快，感觉廉价
className = "duration-1000"; // ❌ 太慢，感觉拖沓
className = "animate-bounce"; // ❌ 太活泼，不符合 Zen
```

---

## 🌏 文化语境规范（Cultural Context）

### 多语言使用场景

| 场景           | 日文    | 中文    | 英文    |
| -------------- | ------- | ------- | ------- |
| Hero 主标题    | ✅ 首选 | —       | —       |
| Hero 副标题    | ✅ 可选 | —       | —       |
| 区块小标题标签 | —       | —       | ✅ 大写 |
| 区块主标题     | —       | ✅ 首选 | —       |
| 正文内容       | —       | ✅ 首选 | —       |
| 按钮文案       | —       | ✅ 首选 | —       |
| 状态标签       | —       | ✅ 首选 | —       |
| 占位符提示     | —       | ✅ 首选 | —       |

```tsx
// ✅ 正确的多语言组合
<header>
  <span className="text-[12px] uppercase tracking-[0.25em] text-sakura-500">
    Package Contents  {/* 英文小标签 */}
  </span>
  <h2 className="font-serif text-[26px] text-gray-900">
    套餐包含  {/* 中文主标题 */}
  </h2>
</header>

// ✅ Hero 日文标题
<h1 className="font-mincho text-[42px]">一の着物</h1>
<p className="font-mincho text-sm">伝統と現代の融合</p>
```

---

## 🍂 侘寂色系（Wabi-Sabi Colors）

### 日式 Zen 中性色

区别于冷灰色系，侘寂色系带有温暖的褐调，如同老宣纸、茶室木材的自然色泽。

| Token      | 色值      | 日文名 | 用途            |
| ---------- | --------- | ------ | --------------- |
| `wabi-50`  | `#FDFBF7` | 宣纸   | 沉浸页面背景    |
| `wabi-100` | `#F5F0E8` | 绢白   | 卡片背景、hover |
| `wabi-200` | `#E8E2DC` | 枯草   | 分割线、边框    |
| `wabi-300` | `#D4CCC2` | 灰梅   | 深边框          |
| `wabi-400` | `#B8A89A` | 墨淡   | 装饰文字、图标  |
| `wabi-500` | `#8B7355` | 路考茶 | 次要图标        |
| `wabi-600` | `#5C5854` | 鼠灰   | 次要正文        |
| `wabi-700` | `#3D3A38` | 墨鼠   | 正文            |
| `wabi-800` | `#2D2A26` | 漆黑   | 标题            |
| `wabi-900` | `#1A1816` | 玄黑   | 最深色          |

### 使用场景

```tsx
// ✅ 页面背景
<div className="bg-wabi-50">  // 详情页

// ✅ 装饰元素
<span className="text-wabi-400 font-mincho">京都・和服体験</span>

// ✅ 分割线
<div className="h-px bg-wabi-200" />

// ✅ Hero 标题
<h1 className="text-wabi-800 font-mincho">一の着物</h1>

// ❌ 禁止混用
<h1 className="text-gray-900">一の着物</h1>  // ❌ Hero 标题用 wabi-800
<div className="bg-gray-50">详情页</div>     // ❌ 详情页用 wabi-50
```

### 与 Gray 色系的区别

| 场景       | 使用 Wabi              | 使用 Gray              |
| ---------- | ---------------------- | ---------------------- |
| 详情页背景 | ✅ `wabi-50`           | ❌                     |
| 结账页背景 | ❌                     | ✅ `gray-50`           |
| 日式装饰   | ✅ `wabi-400`          | ❌                     |
| 正文文本   | ❌                     | ✅ `gray-700`          |
| 分割线     | ✅ `wabi-200` (详情页) | ✅ `gray-200` (其他页) |

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
text - gray - 900; // 主标题、重要文本
text - gray - 800; // 二级标题
text - gray - 700; // 正文文本
text - gray - 600; // 次要文本
text - gray - 500; // 占位符、禁用状态
text - gray - 400; // 辅助信息

// ❌ 禁止使用
text - black; // 太硬，不柔和
text - gray - 950; // 不在设计系统中
text - slate - 600; // 不要使用 slate
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

## 🌸 主题配色系统 - 日本传统色 (Nippon Colors)

### 设计哲学："灰度共鸣"

为了与主品牌色（樱花粉 `#FF7A9A`）高度协调，我们采用**日本传统色系**作为主题配色。核心逻辑是：所有辅助色都加入适量的灰度和白度，使得它们在视觉重量上与樱花粉保持一致，形成**"和而不同"的高级感**。

> 🎨 **视觉效果**：如同欣赏一套高级和服布料样本 —— 多彩，但和谐统一。

### 主题色映射表

| 主题 Slug         | 颜色值    | 色名   | 日文          | 感觉描述                       |
| ----------------- | --------- | ------ | ------------- | ------------------------------ |
| `trendy-photo`    | `#F28B82` | 薄红   | Usu-beni      | 柔和的珊瑚调，像少女脸颊的红晕 |
| `formal-ceremony` | `#B39DDB` | 藤紫   | Fuji-murasaki | 紫藤花的颜色，优雅高贵         |
| `together`        | `#80CBC4` | 青磁   | Seiji         | 清透的薄荷青，粉色的完美互补   |
| `seasonal`        | `#AED581` | 萌黄   | Moegi         | 春天新芽的嫩绿，充满生机       |
| `casual-stroll`   | `#90CAF9` | 勿忘草 | Wasurenagusa  | 通透的天空蓝，轻盈自在         |
| `specialty`       | `#FFCC80` | 杏色   | Anzu          | 温暖的淡橙色，亲切包容         |

### 代码实现

```tsx
// ✅ 前端主题色映射（覆盖数据库颜色）
const themeColorMap: Record<string, string> = {
  "trendy-photo": "#F28B82", // 薄红
  "formal-ceremony": "#B39DDB", // 藤紫
  together: "#80CBC4", // 青磁
  seasonal: "#AED581", // 萌黄
  "casual-stroll": "#90CAF9", // 勿忘草
  specialty: "#FFCC80", // 杏色
};

// 使用方式
const themeColor = themeColorMap[theme.slug] || theme.color || "#FF7A9A";
```

### 主题色使用规范

```tsx
// ✅ 正确使用 - 主题色作为点缀
<div style={{ backgroundColor: `${themeColor}08` }}>  // 极淡背景 (8% 透明度)
<div style={{ backgroundColor: `${themeColor}15` }}>  // 浅背景 (15% 透明度)
<div style={{ border: `1px solid ${themeColor}30` }}> // 边框 (30% 透明度)
<div style={{ color: themeColor }}>                   // 图标/文字强调

// ✅ 正确使用 - 渐变背景
style={{
  background: `linear-gradient(to bottom, ${themeColor}08 0%, transparent 100%)`
}}

// ❌ 禁止使用 - 高饱和度/过于鲜艳的颜色
'#FF6B6B'  // ❌ 太亮的红
'#9B59B6'  // ❌ 太深的紫
'#E91E63'  // ❌ Material Design 粉
'#4CAF50'  // ❌ 安卓绿
'#00BCD4'  // ❌ 亮青色
'#FF9800'  // ❌ 亮橙色
```

### 固定颜色元素（不随主题变化）

某些元素使用固定颜色以保持一致性：

```tsx
// ✅ 精选标签 - 固定金色渐变（代表品质）
style={{
  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
}}

// ✅ 省钱标签 - 固定红色（语义明确）
className="bg-red-50 text-red-600"

// ✅ 地区/时长图标 - 随主题色变化
<MapPin style={{ color: themeColor }} />
<Clock style={{ color: themeColor }} />
```

### 配色选择原则

1. **低饱和度**：避免刺眼，与樱花粉协调
2. **高明度**：保持轻盈感，不沉重
3. **灰度统一**：所有颜色的灰度接近，视觉重量一致
4. **日本传统**：参考日本传统色名，富有文化底蕴

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

**图片比例规范（根据场景选择）**：

```tsx
// ✅ 首页/搜索页：使用 1:1 比例（高信息密度，展示更多套餐）
<div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
  <Image
    src={imageUrl}
    alt={name}
    fill
    className="object-cover group-hover:scale-105 transition-transform duration-300"
  />
</div>

// ✅ 主题页：使用 4:3 比例（套餐少、空间多，参考 Airbnb）
<div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
  <Image ... />
</div>

// ❌ 禁止使用的比例
<div className="relative aspect-video">         // ❌ 16:9 - 和服图片不适合
<div className="relative h-64 w-full">          // ❌ 固定高度 - 响应式差
```

**比例选择指南**：
| 场景 | 比例 | 原因 |
|------|------|------|
| 首页精选 | 1:1 | 高密度网格，快速浏览 |
| 搜索结果 | 1:1 | 大量结果，信息密度优先 |
| 主题套餐页 | 4:3 | 套餐数量少，视觉展示优先 |
| 详情页相关推荐 | 1:1 | 辅助内容，不抢主视觉 |

### 5. 卡片变体系统 (Card Variants)

根据使用场景选择合适的卡片样式：

| 变体          | 用途          | 视觉特点                              |
| ------------- | ------------- | ------------------------------------- |
| `default`     | 通用列表卡片  | 白色背景、微阴影、hover 加深阴影      |
| `interactive` | 可点击卡片    | default + 悬停上浮 + 轻微放大         |
| `sakura`      | 品牌强调卡片  | 樱花粉边框、品牌阴影                  |
| `zen`         | 高端/传统套餐 | 温暖米色背景(#FDFBF7)、hover 时淡边框 |
| `glass`       | Hero 叠加区域 | 毛玻璃效果、半透明                    |
| `soft`        | 精选/推荐卡片 | 大圆角(3xl)、柔和长阴影               |

```tsx
// ✅ 变体样式定义
const cardVariants = {
  // 默认白卡片
  default:
    "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300",

  // 交互式卡片（带上浮效果）
  interactive:
    "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300",

  // 樱花主题卡片
  sakura:
    "bg-white rounded-xl border-2 border-sakura-200 shadow-[0_4px_20px_-4px_rgba(236,72,153,0.15)]",

  // 和风卡片（温暖高端）
  zen: "bg-[#FDFBF7] rounded-xl border border-transparent hover:border-sakura-200/50 transition-all duration-300",

  // 毛玻璃卡片（用于图片叠加）
  glass: "bg-white/30 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg",

  // 柔和卡片（大阴影、大圆角）
  soft: "bg-white rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]",
};

// ❌ 禁止混合使用不同变体的样式
<div className="bg-[#FDFBF7] backdrop-blur-md rounded-3xl shadow-lg">
  {/* 混合了 zen + glass + soft 的样式，视觉混乱 */}
</div>;
```

### 6. 卡片 Hover 动画规范

```tsx
// ✅ 标准卡片 hover 效果
className = "transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1";

// ✅ 图片 hover 效果
className = "transition-transform duration-300 group-hover:scale-105";

// ✅ 按钮 hover 效果（浮动按钮）
className = "transition-all duration-200 hover:scale-110 hover:shadow-md";

// ❌ 禁止的动画
className = "hover:scale-110"; // ❌ 放大幅度过大（最大 1.05）
className = "hover:rotate-3"; // ❌ 不符合风格
className = "hover:-translate-y-3"; // ❌ 上浮幅度过大（最大 -1）
className = "duration-100"; // ❌ 太快，感觉生硬
className = "duration-700"; // ❌ 太慢，感觉拖沓
```

### 7. 卡片内容层次

```tsx
// ✅ 正确的卡片内容结构
<div className="group block">
  {/* 1. 图片区域 */}
  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
    <Image ... />
    {/* 左上角：状态徽章（限时优惠、省¥XX） */}
    <Badge className="absolute top-3 left-3" />
    {/* 右上角：操作按钮（试穿、收藏） */}
    <button className="absolute top-3 right-3" />
    {/* 右下角：购物车按钮 */}
    <button className="absolute bottom-3 right-3" />
  </div>

  {/* 2. 信息区域 */}
  <div className="mt-3 space-y-1">
    {/* 标题 */}
    <h3 className="font-semibold text-[15px] text-gray-900 line-clamp-2">{name}</h3>
    {/* 副标题（可选） */}
    <p className="text-[13px] text-gray-500">{merchantName}</p>
    {/* 价格 - 最醒目 */}
    <p className="flex items-baseline gap-1.5">
      <span className="text-[17px] font-bold text-gray-900">¥{price}</span>
      <span className="text-[12px] text-gray-400 line-through">¥{originalPrice}</span>
    </p>
    {/* 标签（可选，最多 3 个） */}
    <div className="flex flex-wrap gap-1">
      <Badge variant="sakura" size="sm">{tag}</Badge>
    </div>
  </div>
</div>
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
className = "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300";

// ✅ 按钮 hover
className = "hover:shadow-lg hover:scale-105 transition-all duration-300";

// ✅ 图片 hover
className = "group-hover:scale-105 transition-transform duration-300";

// ❌ 禁止过度动画
className = "hover:scale-110"; // ❌ 缩放太大
className = "hover:rotate-6"; // ❌ 不符合风格
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
font - semibold; // 600 - 标题、强调
font - medium; // 500 - 次要标题
font - normal; // 400 - 正文

// ❌ 禁止使用
font - bold; // ❌ 太重，使用 font-semibold
font - light; // ❌ 太轻，使用 font-normal
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

## 🏗️ 页面级模板（Page-Level Patterns）

### 认证页面（Login / Register）

认证页面必须保持 sakura 品牌一致性，**禁止 rose/pink**。

```tsx
// ✅ 认证页标准结构
<div
  className="min-h-screen bg-gradient-to-br from-[#FFF5F7]/60 via-white to-[#FFF5F7]/30
  flex items-center justify-center px-4 py-12"
>
  {/* 品牌区 — 居中 lg 家纹 */}
  <div className="flex items-center gap-3 mb-8">
    {/* lg 家纹 (w-14 h-14) */}
    {/* + "Kimono One" + "着物レンタル" */}
  </div>

  {/* 表单卡片 */}
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 w-full max-w-md">
    <h1 className="text-[22px] font-semibold text-gray-900 text-center mb-6">欢迎回来</h1>
    {/* 输入框: focus:ring-sakura-500 focus:border-sakura-500 */}
    {/* 主按钮: bg-gradient-to-r from-sakura-500 to-sakura-600 */}
    {/* 链接: text-sakura-600 hover:text-sakura-700 */}
  </div>
</div>
```

### Footer 模板

Footer 必须包含品牌标识，使用 wabi-50 背景。

```tsx
// ✅ Footer 标准结构
<footer className="w-full bg-[#FDFBF7]">
  {/* 顶部装饰线 */}
  <div className="h-px bg-gradient-to-r from-transparent via-sakura-300 to-transparent" />

  <div className="container py-12 md:py-16">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
      {/* 品牌区 (md:col-span-4) — 家纹 + 品牌名 + tagline + 社交图标 */}
      {/* 快速链接 (md:col-span-2) */}
      {/* 客户服务 + 合作伙伴 (md:col-span-2) */}
      {/* 联系方式 (md:col-span-2) */}
    </div>

    {/* 版权 */}
    <div className="mt-12 pt-8">
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />
      <p className="text-center text-[12px] text-gray-400">
        &copy; {new Date().getFullYear()} Kimono One. All rights reserved.
      </p>
    </div>
  </div>
</footer>
```

**Footer 必须包含：**

- CSS 家纹 Logo + 品牌名 (Kimono One + 着物レンタル)
- 品牌描述 + 日文 tagline（伝統の美、現代の心）
- 社交图标（Instagram / Twitter / Youtube，用 Lucide 图标 + sakura 圆形按钮）
- 渐变装饰线分隔

### 手风琴动画（FAQ details/summary）

```css
/* globals.css — FAQ 展开动画 */
@keyframes faqExpand {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

```tsx
// ✅ FAQ 手风琴内容区
<details>
  <summary>问题标题</summary>
  <div className="motion-safe:animate-[faqExpand_200ms_ease-out]">答案内容</div>
</details>
```

### 图标替代 Emoji 规范

专业页面禁止用 emoji 做占位图，改用 Lucide 图标 + sakura 背景：

```tsx
// ❌ 禁止
<span className="text-6xl">👘</span>;

// ✅ 正确 — Lucide 图标 + 装饰背景
import { Scissors, Sparkles, Camera } from "lucide-react";

<div className="w-16 h-16 rounded-2xl bg-sakura-50 flex items-center justify-center">
  <Scissors className="w-8 h-8 text-sakura-600" />
</div>;
```

---

## 📋 检查清单

在提交代码前，确保：

**颜色与设计系统**

- [ ] 所有颜色值都在设计系统中定义（sakura-_ / gray-_ / wabi-\* / 语义色）
- [ ] 没有 rose-_ / pink-_ / purple-_ / violet-_ / indigo-\*
- [ ] blue-\* 仅用于语义提示（bg-blue-50），不用于品牌元素
- [ ] 没有硬编码的颜色值（`#hex` 或 `rgb()`）

**间距与排版**

- [ ] 所有间距都是 4 的倍数
- [ ] 使用 `text-[Npx]` 而非 `text-lg/xl`
- [ ] 按钮使用 `rounded-lg`，卡片使用 `rounded-xl`

**品牌一致性**

- [ ] Logo 使用 CSS 家纹，不用 /logo.png 图片
- [ ] 认证页用 sakura 色系，不用 rose/pink
- [ ] 专业页面无 emoji 占位（用 Lucide 图标）

**行为规范**

- [ ] 内部链接无 `target="_blank"`
- [ ] 无 console.log / 调试代码
- [ ] Hover 效果包含 `transition-all duration-300`

**组件复用**

- [ ] 复用了现有组件而非重新创建
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
4. **品牌形象**：日式 Zen + 樱花美学的独特定位

---

## 🌸 Final Directive - 最终指引

> **记住**：你正在创造的不仅仅是一个网站，而是一个让用户沉浸在和服文化中的数字空间。
>
> 每一个组件都应该像和服上的一针一线——精确、优雅、有意义。
>
> 设计系统不是限制创造力的枷锁，而是让你在统一的美学框架内自由创作的画布。
>
> **追求「雅」(Miyabi)**：让简洁成为力量，让留白成为语言，让樱花色成为情感的触点。
>
> 现在，去创造令人难忘的和服体验吧！🌸
