# 数据爬虫和脚本

这个目录包含用于数据抓取和数据库管理的脚本。

## 📁 文件说明

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
