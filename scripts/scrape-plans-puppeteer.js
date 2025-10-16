/**
 * 使用 Puppeteer 抓取江戸和装工房雅官网套餐数据
 * 支持客户端渲染的网站
 *
 * 安装依赖: npm install puppeteer
 * 使用方法: node scripts/scrape-plans-puppeteer.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapePlansWithPuppeteer() {
  console.log('🚀 启动 Puppeteer 浏览器...\n');

  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: true, // 无头模式
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  // 设置用户代理
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('📡 正在访问: https://hefumiyabi.com/zh/plan\n');

    // 访问页面 - 增加超时时间和更宽松的等待条件
    await page.goto('https://hefumiyabi.com/zh/plan', {
      waitUntil: 'domcontentloaded', // 等待DOM加载完成即可
      timeout: 60000 // 增加到60秒
    });

    console.log('⏳ 等待页面内容加载...\n');

    // 等待套餐卡片渲染
    await page.waitForSelector('[data-slot="card"], .plan-card, .card', {
      timeout: 10000
    }).catch(() => {
      console.log('⚠️  未找到标准选择器，尝试其他方法...');
    });

    // 额外等待确保内容完全加载
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🔍 开始提取套餐数据...\n');

    // 在浏览器上下文中执行代码，提取数据
    const plans = await page.evaluate(() => {
      const planElements = [];

      // 尝试多种可能的选择器
      const selectors = [
        '[data-slot="card"]',
        '.plan-card',
        '.card',
        '[class*="plan"]',
        'article',
        '.grid > div'
      ];

      let elements = [];
      for (const selector of selectors) {
        elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`找到 ${elements.length} 个元素，使用选择器: ${selector}`);
          break;
        }
      }

      // 提取每个套餐的数据
      elements.forEach((element, index) => {
        try {
          // 提取名称
          const nameEl = element.querySelector('h2, h3, h4, [class*="title"], [class*="name"]');
          const name = nameEl ? nameEl.textContent.trim() : `套餐 ${index + 1}`;

          // 提取价格
          const priceElements = element.querySelectorAll('[class*="price"], strong, b');
          const prices = Array.from(priceElements)
            .map(el => el.textContent.match(/¥\s*([0-9,]+)/))
            .filter(match => match !== null)
            .map(match => match[1].replace(/,/g, ''));

          // 提取描述
          const descEl = element.querySelector('p, [class*="description"]');
          const description = descEl ? descEl.textContent.trim() : '';

          // 提取图片
          const imgEl = element.querySelector('img');
          const image = imgEl ? imgEl.src || imgEl.dataset.src : '';

          // 提取特色列表
          const features = [];
          const featureElements = element.querySelectorAll('li, [class*="feature"]');
          featureElements.forEach(li => {
            const text = li.textContent.trim();
            if (text && text.length < 100) {
              features.push(text);
            }
          });

          // 只添加有实际内容的套餐
          if (name && (prices.length > 0 || description || image)) {
            planElements.push({
              name,
              price: prices[0] || '',
              originalPrice: prices[1] || prices[0] || '',
              description: description.substring(0, 200),
              image,
              features: features.slice(0, 5),
              rawHTML: element.innerHTML.substring(0, 300)
            });
          }
        } catch (error) {
          console.error(`提取套餐 ${index} 时出错:`, error.message);
        }
      });

      return planElements;
    });

    console.log(`✅ 成功提取 ${plans.length} 个套餐\n`);

    // 打印每个套餐的摘要
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   价格: ${plan.price ? '¥' + plan.price : '未知'}`);
      console.log(`   描述: ${plan.description.substring(0, 50)}...`);
      console.log('');
    });

    // 保存数据
    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `puppeteer-plans-${timestamp}.json`);

    const output = {
      scrapedAt: new Date().toISOString(),
      sourceUrl: 'https://hefumiyabi.com/zh/plan',
      method: 'puppeteer',
      plans,
      metadata: {
        totalPlans: plans.length,
        browser: 'chromium',
        hasImages: plans.filter(p => p.image).length
      }
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 数据已保存到: ${outputFile}\n`);

    return plans;

  } catch (error) {
    console.error('❌ 抓取失败:', error.message);

    // 截图用于调试
    const screenshotPath = path.join(__dirname, '../data/debug-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 已保存调试截图: ${screenshotPath}`);

    throw error;

  } finally {
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }
}

// 主函数
async function main() {
  console.log('🌐 使用 Puppeteer 抓取客户端渲染网站\n');
  console.log('=' .repeat(50) + '\n');

  try {
    await scrapePlansWithPuppeteer();
    console.log('\n✅ 抓取完成！');
  } catch (error) {
    console.error('\n❌ 抓取失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapePlansWithPuppeteer };
