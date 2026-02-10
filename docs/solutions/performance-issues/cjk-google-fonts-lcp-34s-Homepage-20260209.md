---
module: Homepage
date: 2026-02-09
problem_type: performance_issue
component: frontend_stimulus
symptoms:
  - "LCP 34s，Lighthouse Performance 得分 42"
  - "135 个 woff2 字体文件并发请求（17.2MB）"
  - "4 个 render-blocking CSS 额外阻塞 ~5.4s"
  - "FCP 5.4s"
root_cause: config_error
resolution_type: code_fix
severity: critical
tags: [lcp, font, cjk, google-fonts, next-font, performance, woff2]
---

# Troubleshooting: CJK Google Fonts 导致 LCP 34s

## Problem

首页使用 `next/font/google` 加载 3 个 CJK 字体（Noto Sans SC、Noto Serif SC、Shippori Mincho），因 CJK 字符集巨大（数万汉字），自动按 unicode-range 拆分成 446 个 woff2 文件（17.2MB）。浏览器每次访问下载 ~135 个字体文件，严重拥塞网络，阻塞 Hero 图片的 LCP 测量。

## Environment

- Module: Homepage
- Framework: Next.js 15.5 + React 19
- Affected Component: `src/app/layout.tsx` 字体声明 + `src/app/globals.css` 字体栈
- Date: 2026-02-09

## Symptoms

- Lighthouse Performance 得分仅 42 分
- LCP = 34s（远超 2.5s 良好阈值）
- FCP = 5.4s
- 浏览器 Network 面板显示 135 个 woff2 字体请求
- 4 个 render-blocking CSS 资源
- 总页面大小 5,354 KiB

## What Didn't Work

**Direct solution:** 根因分析直接定位到字体文件数量，第一次尝试即解决。

## Solution

**核心策略：** 移除 `next/font/google` CJK 字体，改用系统字体栈。CJK 用户设备上 99% 已预装高质量 CJK 字体（PingFang SC、Hiragino Sans、Microsoft YaHei），不需要下载。

**Code changes:**

```tsx
// src/app/layout.tsx

// Before (broken):
import { Noto_Sans_SC, Noto_Serif_SC, Shippori_Mincho } from "next/font/google";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-sc",
  display: "swap",
});
// ... 另外 2 个字体实例化 ...

<body className={`${notoSansSC.variable} ${notoSerifSC.variable} ${shipporiMincho.variable} font-sans antialiased`}>

// After (fixed):
// 删除所有 Google Font 导入和实例化
<body className="font-sans antialiased">
```

```css
/* src/app/globals.css */

/* Before (broken): */
--font-sans: var(--font-noto-sans-sc), -apple-system, ...;
--font-serif: var(--font-noto-serif-sc), 'Noto Serif SC', ...;
--font-mincho: var(--font-shippori), 'Shippori Mincho', ...;

/* After (fixed): */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
             'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue',
             Helvetica, Arial, sans-serif;
--font-serif: 'Songti SC', 'Noto Serif SC', 'SimSun', Georgia, serif;
--font-mincho: 'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif;
```

## Why This Works

1. **根因：** `next/font/google` 对 CJK 字体按 unicode-range 自动拆分。3 个字体 × 多个 weight = 446 个 woff2 分片。虽然每个仅 ~39KB，但 135 个并发请求严重拖慢页面加载。
2. **系统字体已可用：** macOS/iOS 预装 PingFang SC + Hiragino 系列，Windows 预装 Microsoft YaHei + Yu Mincho，Android 预装 Noto Sans CJK。用户设备上几乎一定有高质量 CJK 字体。
3. **CSS 变量名不变：** `--font-sans`、`--font-serif`、`--font-mincho` 保持不变，所有 Tailwind 类（`font-serif`、`font-mincho`）无需修改。

## Results

| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| Performance 得分 | 42 | 75 | +33 |
| LCP | 34s | 4.4s | -87% |
| FCP | 5.4s | 0.9s | -83% |
| 字体请求数 | 135 | 0 | -100% |
| 页面总大小 | 5,354 KB | 846 KB | -84% |
| Render-blocking | 4 | 1 | -75% |

## Prevention

- **永远不要用 `next/font/google` 加载 CJK 字体。** CJK 字符集巨大，会生成几十到上百个 woff2 分片。
- **CJK 项目首选系统字体栈。** 目标用户的设备上必定有高质量 CJK 字体，无需下载。
- **如需自定义字体，用自托管最小子集。** 用 `pyftsubset` 只包含实际使用的字符，控制在 < 50KB。
- **定期跑 Lighthouse 监控。** 字体问题不易在开发时感知，需要工具检测。

## Related Issues

- See also: [barrel-export-bloats-bundle-Homepage-20260125.md](./barrel-export-bloats-bundle-Homepage-20260125.md) — 同为首页性能优化
