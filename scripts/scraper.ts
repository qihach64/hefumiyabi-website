/**
 * 江戸和装工房雅网站爬虫
 * 从 https://hefumiyabi.com 抓取和服、店铺、套餐数据
 */

import * as cheerio from "cheerio";

interface Store {
  name: string;
  address: string;
  phone: string;
  city: string;
}

interface Plan {
  name: string;
  price: string;
  description: string;
  category: string;
}

interface Kimono {
  name: string;
  style: string;
  imageUrl: string;
}

/**
 * 抓取店铺信息
 */
async function scrapeStores(): Promise<Store[]> {
  const url = "https://hefumiyabi.com/ja/shop";
  console.log(`📍 抓取店铺信息: ${url}`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const stores: Store[] = [];

    // 根据实际网站结构调整选择器
    $(".store-item").each((_, element) => {
      const store: Store = {
        name: $(element).find(".store-name").text().trim(),
        address: $(element).find(".store-address").text().trim(),
        phone: $(element).find(".store-phone").text().trim(),
        city: $(element).find(".store-city").text().trim(),
      };
      stores.push(store);
    });

    console.log(`✅ 找到 ${stores.length} 个店铺`);
    return stores;
  } catch (error) {
    console.error("❌ 抓取店铺失败:", error);
    return [];
  }
}

/**
 * 抓取租赁套餐
 */
async function scrapePlans(): Promise<Plan[]> {
  const url = "https://hefumiyabi.com/ja/plan";
  console.log(`📋 抓取租赁套餐: ${url}`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const plans: Plan[] = [];

    // 根据实际网站结构调整选择器
    $(".plan-item").each((_, element) => {
      const plan: Plan = {
        name: $(element).find(".plan-name").text().trim(),
        price: $(element).find(".plan-price").text().trim(),
        description: $(element).find(".plan-description").text().trim(),
        category: $(element).find(".plan-category").text().trim(),
      };
      plans.push(plan);
    });

    console.log(`✅ 找到 ${plans.length} 个套餐`);
    return plans;
  } catch (error) {
    console.error("❌ 抓取套餐失败:", error);
    return [];
  }
}

/**
 * 抓取和服图片和信息
 */
async function scrapeKimonos(): Promise<Kimono[]> {
  const url = "https://hefumiyabi.com/ja/plan";
  console.log(`👘 抓取和服信息: ${url}`);

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const kimonos: Kimono[] = [];

    // 根据实际网站结构调整选择器
    $(".kimono-item img").each((_, element) => {
      const kimono: Kimono = {
        name: $(element).attr("alt") || "未命名和服",
        style: "和服",
        imageUrl: $(element).attr("src") || "",
      };
      if (kimono.imageUrl) {
        kimonos.push(kimono);
      }
    });

    console.log(`✅ 找到 ${kimonos.length} 套和服`);
    return kimonos;
  } catch (error) {
    console.error("❌ 抓取和服失败:", error);
    return [];
  }
}

/**
 * 保存数据到 JSON 文件
 */
async function saveToJson(data: any, filename: string) {
  const fs = await import("fs/promises");
  const path = await import("path");

  const outputDir = path.join(process.cwd(), "data");
  await fs.mkdir(outputDir, { recursive: true });

  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");

  console.log(`💾 数据已保存到: ${filepath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log("🕷️  开始爬取 hefumiyabi.com 数据...\n");

  // 抓取店铺
  const stores = await scrapeStores();
  if (stores.length > 0) {
    await saveToJson(stores, "stores.json");
  }

  console.log("");

  // 抓取套餐
  const plans = await scrapePlans();
  if (plans.length > 0) {
    await saveToJson(plans, "plans.json");
  }

  console.log("");

  // 抓取和服
  const kimonos = await scrapeKimonos();
  if (kimonos.length > 0) {
    await saveToJson(kimonos, "kimonos.json");
  }

  console.log("\n🎉 爬取完成！");
  console.log("\n📊 统计:");
  console.log(`   - 店铺: ${stores.length} 个`);
  console.log(`   - 套餐: ${plans.length} 个`);
  console.log(`   - 和服: ${kimonos.length} 套`);
  console.log("\n💡 提示: 数据已保存到 data/ 目录");
  console.log("   运行 'pnpm db:seed' 将数据导入数据库");
}

// 运行爬虫
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ 爬虫运行失败:", error);
    process.exit(1);
  });
}

export { scrapeStores, scrapePlans, scrapeKimonos };
