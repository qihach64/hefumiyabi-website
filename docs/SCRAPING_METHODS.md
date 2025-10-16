# 网站数据抓取方法对比

## 🎯 问题：为什么简单的爬虫无法抓取官网数据？

**答案**：hefumiyabi.com 使用**客户端渲染 (CSR)**，内容由 JavaScript 动态生成。

---

## 📊 技术对比

### 1. 简单 HTTP 请求（现有方案）

**脚本**: `scripts/scrape-plans.js`

**工作原理**:
```
Node.js → HTTP GET → 获取HTML → 解析静态内容
```

**优点**:
- ✅ 速度快
- ✅ 资源消耗少
- ✅ 无需额外依赖
- ✅ 适合服务端渲染 (SSR) 网站

**缺点**:
- ❌ 无法执行 JavaScript
- ❌ 无法抓取客户端渲染内容
- ❌ 无法处理动态加载的数据

**适用场景**:
- 静态 HTML 网站
- 服务端渲染 (SSR) 网站
- API 端点

---

### 2. Puppeteer/Playwright（推荐）

**脚本**: `scripts/scrape-plans-puppeteer.js`

**工作原理**:
```
启动浏览器 → 访问页面 → 等待JS执行 → 提取数据
```

**优点**:
- ✅ 完整浏览器环境
- ✅ 支持客户端渲染
- ✅ 可以等待元素加载
- ✅ 支持截图调试
- ✅ 可以处理复杂交互

**缺点**:
- ❌ 需要安装 Chromium（~170MB）
- ❌ 资源消耗较大
- ❌ 速度较慢

**安装依赖**:
```bash
# Puppeteer (包含 Chromium)
npm install puppeteer

# 或使用 Playwright
npm install playwright
```

**使用方法**:
```bash
node scripts/scrape-plans-puppeteer.js
```

---

### 3. 手动提取（当前使用）

**脚本**: `scripts/scrape-plans.js`（手动数据）

**工作原理**:
```
浏览器手动查看 → 记录数据 → 硬编码到脚本
```

**优点**:
- ✅ 100% 准确
- ✅ 无需网络请求
- ✅ 速度快
- ✅ 可控性强

**缺点**:
- ❌ 需要手动维护
- ❌ 数据更新需要人工操作
- ❌ 不适合大量数据

**当前数据**:
已手动提取 5 个套餐的完整数据，保存在 `data/plans-data.json`

---

### 4. API 端点（最佳方案）

**如果官网提供 API**:

```javascript
// 示例：调用官网 API
const response = await fetch('https://hefumiyabi.com/api/plans');
const plans = await response.json();
```

**优点**:
- ✅ 最快最准确
- ✅ 官方支持
- ✅ 数据结构化
- ✅ 无需解析 HTML

**缺点**:
- ❌ 需要官网提供 API
- ❌ 可能需要认证
- ❌ hefumiyabi.com 目前未公开 API

---

## 🔍 如何检测网站的渲染方式

### 方法 1：查看源代码
```bash
curl https://hefumiyabi.com/zh/plan | grep "套餐"
```

- **有内容** = 服务端渲染 (SSR)
- **无内容/空白** = 客户端渲染 (CSR)

### 方法 2：浏览器检查
1. 右键 → "查看网页源代码"
2. 搜索页面可见内容
3. 找不到 = 客户端渲染

### 方法 3：Network 面板
1. 打开开发者工具 → Network
2. 刷新页面
3. 查看 HTML 文档内容
4. 查看后续的 API 请求

---

## 📝 当前项目的抓取策略

### 现状
我们已经使用**手动提取**的方式获取了官网数据：

- ✅ 5 个套餐
- ✅ 完整的字段（名称、价格、描述、图片、特色）
- ✅ 适用店铺信息
- ✅ 保存为 JSON 格式

**数据文件**: `data/plans-data.json`

### 未来更新策略

**选项 1：继续手动更新**
- 每季度检查官网一次
- 手动更新 `data/plans-data.json`
- 适合数据变化不频繁的场景

**选项 2：使用 Puppeteer**
- 安装依赖: `npm install puppeteer`
- 运行脚本: `node scripts/scrape-plans-puppeteer.js`
- 自动化更新数据

**选项 3：联系官网申请 API**
- 最理想的方案
- 需要和官网技术团队沟通

---

## 🚀 快速开始

### 使用现有数据（推荐）

```bash
# 数据已准备好，直接使用
cat data/plans-data.json

# 导入数据库
node scripts/import-scraped-plans.js
```

### 使用 Puppeteer 重新抓取

```bash
# 1. 安装依赖
npm install puppeteer

# 2. 运行爬虫
node scripts/scrape-plans-puppeteer.js

# 3. 查看结果
ls data/puppeteer-plans-*.json
```

---

## 📚 参考资源

- [Puppeteer 官方文档](https://pptr.dev/)
- [Playwright 官方文档](https://playwright.dev/)
- [Next.js 渲染方式](https://nextjs.org/docs/basic-features/pages)
- [Web Scraping Best Practices](https://www.scraperapi.com/blog/web-scraping-best-practices/)

---

## ⚠️ 法律和道德声明

1. **遵守 robots.txt**
   ```bash
   curl https://hefumiyabi.com/robots.txt
   ```

2. **添加延迟**
   ```javascript
   await page.waitForTimeout(2000); // 等待2秒
   ```

3. **尊重网站条款**
   - 不要频繁请求
   - 不要给服务器造成负担
   - 仅用于学习和个人项目

4. **优先使用官方 API**
   - 如果有公开 API，优先使用
   - 考虑联系官方申请权限

---

## 📧 联系我们

如有问题或建议，请提交 Issue。
