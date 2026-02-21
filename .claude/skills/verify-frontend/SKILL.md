---
name: verify-frontend
description: |
  使用 Playwright MCP 验证前端修改效果。修改完前端代码后打开浏览器截图验证，支持桌面端和移动端双视口，支持视觉截图和功能交互验证。

  **触发场景** - 当用户说：
  - 验证一下 / 看看效果 / 截图看看
  - 检查一下页面 / 确认修改正确
  - 帮我测试一下这个页面
  - 或者在完成前端代码修改后，主动提议验证
---

# 前端验证 Workflow (Playwright MCP)

修改前端代码后，使用 Playwright MCP 工具打开浏览器验证效果。

---

## 前置条件

### 确保开发服务器运行

验证前先检查 `localhost:3000` 是否可用：

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

- 返回 `200`：服务器正常，继续验证
- 返回非 200 或超时：提示用户先运行 `pnpm dev`

### 加载 Playwright MCP 工具

使用 `ToolSearch` 加载所需的 Playwright 工具。常用工具：

- `mcp__plugin_playwright_playwright__browser_navigate` — 导航到 URL
- `mcp__plugin_playwright_playwright__browser_resize` — 调整视口大小
- `mcp__plugin_playwright_playwright__browser_take_screenshot` — 截图
- `mcp__plugin_playwright_playwright__browser_click` — 点击元素
- `mcp__plugin_playwright_playwright__browser_snapshot` — 获取 DOM 快照
- `mcp__plugin_playwright_playwright__browser_evaluate` — 执行 JS
- `mcp__plugin_playwright_playwright__browser_console_messages` — 查看控制台
- `mcp__plugin_playwright_playwright__browser_fill_form` — 填写表单
- `mcp__plugin_playwright_playwright__browser_press_key` — 键盘操作

---

## 验证流程

### 第 1 步：确定验证页面

根据修改的文件，推断需要验证的页面 URL：

| 修改的文件路径                                       | 验证 URL                  |
| ---------------------------------------------------- | ------------------------- |
| `src/app/(main)/page.tsx` 或 `src/components/home/*` | `/`                       |
| `src/app/(main)/plans/*`                             | `/plans` 或 `/plans/[id]` |
| `src/components/layout/Header.tsx`                   | `/`（Header 全站可见）    |
| `src/components/layout/BottomNav.tsx`                | `/`（移动端视口）         |
| `src/components/layout/Footer.tsx`                   | `/`（滚动到底部）         |
| `src/components/layout/MobileSearchBar.tsx`          | `/`（移动端视口）         |
| 其他页面组件                                         | 根据路由结构推断          |

如果不确定，询问用户要验证哪个页面。

### 第 2 步：桌面端验证

1. **导航到目标页面**：`browser_navigate` → `http://localhost:3000{path}`
2. **调整为桌面视口**：`browser_resize` → `width: 1280, height: 800`
3. **截图确认布局**：`browser_take_screenshot`

检查项：

- 页面整体布局是否正常
- Header 是否正确显示
- 修改的组件是否按预期渲染

### 第 3 步：移动端验证

1. **调整为移动端视口**：`browser_resize` → `width: 375, height: 812`
2. **截图确认移动端布局**：`browser_take_screenshot`

检查项：

- 响应式布局是否正常
- BottomNav 是否正确显示
- 移动端特有元素（MobileSearchBar 等）是否正常

### 第 4 步：功能交互验证（按需）

如果修改涉及交互功能：

- **点击按钮/链接**：`browser_click`
- **填写表单**：`browser_fill_form`
- **键盘操作**：`browser_press_key`
- **滚动页面**：`browser_evaluate` → `window.scrollTo(0, document.body.scrollHeight)`
- **检查 DOM**：`browser_snapshot`
- **检查控制台错误**：`browser_console_messages`

交互验证后再次截图确认状态变化。

### 第 5 步：报告结果

向用户报告验证结果：

```
**验证结果**

桌面端 (1280x800)：
- [通过/问题] 描述

移动端 (375x812)：
- [通过/问题] 描述

交互验证：（如有）
- [通过/问题] 描述

发现的问题：（如有）
- 问题描述 + 建议修复方向
```

---

## 常用视口尺寸

| 设备            | 宽度 | 高度 |
| --------------- | ---- | ---- |
| 桌面端          | 1280 | 800  |
| 移动端 (iPhone) | 375  | 812  |
| 平板 (iPad)     | 768  | 1024 |

---

## 注意事项

- 截图前等待页面加载完毕，必要时用 `browser_evaluate` 检查加载状态
- 验证 sticky/fixed 定位元素时，先滚动页面再截图
- 如果页面有动画，截图前等待动画完成
- 发现控制台错误时主动报告
- 修改了全局组件（Header/Footer/BottomNav）时，建议验证至少 2 个不同页面
