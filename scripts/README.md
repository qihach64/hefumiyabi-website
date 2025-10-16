# 数据爬虫和脚本

这个目录包含用于数据抓取和数据库管理的脚本。

## 📁 文件说明

### `scrape-plans.js` - 官网套餐数据爬虫（手动提取）🆕
从 https://hefumiyabi.com/zh/plan 提取官网套餐数据的脚本。

**功能**:
- 基于 WebFetch API 提取的数据
- 手动整理为结构化格式
- 支持中英文名称
- 包含价格、描述、特色、适用店铺等完整数据
- 自动保存为 JSON 格式

**使用方法**:
```bash
node scripts/scrape-plans.js
```

**输出**:
- `data/scraped-plans-[timestamp].json` - 完整数据（包含元数据和时间戳）
- `data/plans-data.json` - 简化数据（仅套餐数组，便于直接导入）

**抓取的套餐**:
1. 女士日常优惠和服套餐 - ¥3,000（浅草本店、浅草駅前店）
2. 10周年振袖套餐+60分钟摄影 - ¥38,000（浅草3店）
3. 振袖和服套餐 - ¥19,000（浅草3店）
4. 5人团体套餐 - ¥20,000/人（清水寺店）
5. 情侣优惠套餐 - ¥8,999（清水寺店）

**限制**:
- 无法自动解析客户端渲染的内容
- 数据需要手动维护
- 如需自动抓取，请使用 `scrape-plans-puppeteer.js`

---

### `scrape-plans-puppeteer.js` - Puppeteer 爬虫（自动抓取）🆕
使用无头浏览器自动抓取客户端渲染网站的数据。

**功能**:
- 完整浏览器环境，支持 JavaScript 执行
- 自动等待页面加载
- 提取动态内容
- 支持截图调试

**安装依赖**:
```bash
npm install puppeteer
```

**使用方法**:
```bash
node scripts/scrape-plans-puppeteer.js
```

**输出**:
- `data/puppeteer-plans-[timestamp].json` - 自动抓取的数据
- `data/debug-screenshot.png` - 调试截图（如果出错）

**优势**:
- ✅ 支持客户端渲染网站
- ✅ 自动化程度高
- ✅ 可处理复杂交互

**劣势**:
- ❌ 需要下载 Chromium (~170MB)
- ❌ 资源消耗较大
- ❌ 速度相对较慢

📚 详细对比请查看: [docs/SCRAPING_METHODS.md](../docs/SCRAPING_METHODS.md)

### `scraper.ts` - 网站爬虫
从 https://hefumiyabi.com 抓取数据的爬虫脚本。

**功能**:
- 抓取店铺信息（地址、电话、城市）
- 抓取租赁套餐（名称、价格、描述）
- 抓取和服信息（图片、风格）
- 保存数据到 JSON 文件

**使用方法**:
```bash
pnpm scrape
```

**输出**:
- `data/stores.json` - 店铺数据
- `data/plans.json` - 套餐数据
- `data/kimonos.json` - 和服数据

**注意**:
- 需要根据目标网站的实际 HTML 结构调整 CSS 选择器
- 请遵守网站的 robots.txt 和使用条款
- 建议添加适当的延迟以避免过度请求

### `test-db.ts` - 数据库连接测试
测试 Prisma 与 PostgreSQL 的连接。

**使用方法**:
```bash
npx tsx scripts/test-db.ts
```

### `test-db-simple.ts` - 数据库表验证
验证数据库表是否正确创建并统计记录数。

**使用方法**:
```bash
npx tsx scripts/test-db-simple.ts
```

## 🔄 数据工作流

### 方式 1: 使用种子数据（推荐，已完成）

```bash
# 填充预定义的测试数据
pnpm db:seed
```

这会导入：
- 5 个店铺
- 6 个租赁套餐
- 10 套和服
- 1 个测试用户

### 方式 2: 使用爬虫抓取真实数据

```bash
# 1. 运行爬虫抓取数据
pnpm scrape

# 2. 查看抓取的数据
cat data/stores.json
cat data/plans.json
cat data/kimonos.json

# 3. 手动处理数据并更新 prisma/seed.ts

# 4. 导入数据库
pnpm db:seed
```

## 🛠️ 开发新的爬虫功能

如果需要抓取更多数据：

1. 在 `scraper.ts` 中添加新的抓取函数
2. 使用 cheerio 解析 HTML
3. 导出数据到 JSON
4. 更新 `prisma/seed.ts` 导入数据

**示例**:
```typescript
async function scrapeReviews(): Promise<Review[]> {
  const url = "https://hefumiyabi.com/ja/reviews";
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const reviews: Review[] = [];

  $(".review-item").each((_, element) => {
    reviews.push({
      author: $(element).find(".author").text(),
      rating: parseInt($(element).find(".rating").text()),
      comment: $(element).find(".comment").text(),
    });
  });

  return reviews;
}
```

## 📝 注意事项

1. **网站结构变化**: 如果目标网站更新，需要调整 CSS 选择器
2. **速率限制**: 添加延迟避免被封禁
3. **数据验证**: 抓取后验证数据完整性
4. **法律合规**: 确保遵守网站使用条款

## 🤝 贡献

如果发现爬虫失效或有改进建议，欢迎提交 PR！
