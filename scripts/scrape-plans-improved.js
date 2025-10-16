/**
 * 改进的 Puppeteer 爬虫 - 更好的数据提取
 * 使用方法: node scripts/scrape-plans-improved.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapePlansImproved() {
  console.log('🚀 启动改进的 Puppeteer 爬虫...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    console.log('📡 正在访问: https://hefumiyabi.com/zh/plan\n');

    await page.goto('https://hefumiyabi.com/zh/plan', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('⏳ 等待页面渲染...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔍 提取套餐数据...\n');

    const plans = await page.evaluate(() => {
      const results = [];

      // 尝试找到所有套餐卡片
      const cards = document.querySelectorAll('[data-slot="card"], .card, article, [class*="card"]');

      cards.forEach((card, index) => {
        try {
          // 提取标题
          const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="name"]');
          const title = titleEl ? titleEl.textContent.trim() : '';

          // 跳过空标题
          if (!title || title.length < 3) return;

          // 提取价格 - 多种模式
          let price = '';
          let originalPrice = '';

          // 模式1: 查找所有包含价格的文本
          const priceTexts = Array.from(card.querySelectorAll('*'))
            .map(el => el.textContent)
            .filter(text => /[¥￥]\s*[\d,]+/.test(text));

          if (priceTexts.length > 0) {
            const priceMatches = priceTexts[0].match(/[¥￥]\s*([\d,]+)/g);
            if (priceMatches) {
              price = priceMatches[0].replace(/[¥￥\s]/g, '');
              if (priceMatches.length > 1) {
                originalPrice = priceMatches[1].replace(/[¥￥\s]/g, '');
              }
            }
          }

          // 模式2: 从 span 或 div 中提取
          const priceSpans = card.querySelectorAll('span, div');
          priceSpans.forEach(span => {
            const text = span.textContent;
            if (text.includes('线上预约') || text.includes('線上預約')) {
              const match = text.match(/[¥￥]\s*([\d,]+)/);
              if (match && !price) {
                price = match[1].replace(/,/g, '');
              }
            }
            if (text.includes('原价') || text.includes('原價')) {
              const match = text.match(/[¥￥]\s*([\d,]+)/);
              if (match) {
                originalPrice = match[1].replace(/,/g, '');
              }
            }
          });

          // 提取描述
          const descEl = card.querySelector('p, [class*="description"]');
          const description = descEl ? descEl.textContent.trim() : '';

          // 提取图片
          const imgEl = card.querySelector('img');
          let image = '';
          if (imgEl) {
            image = imgEl.src || imgEl.dataset.src || imgEl.getAttribute('data-src') || '';
          }

          // 提取特色标签
          const tags = [];
          const tagElements = card.querySelectorAll('[class*="tag"], [class*="badge"], span[class*="rounded"]');
          tagElements.forEach(tag => {
            const text = tag.textContent.trim();
            if (text && text.length < 50 && !text.includes('¥') && !text.includes('￥')) {
              tags.push(text);
            }
          });

          // 从标题中提取店铺信息
          let store = '';
          const storePatterns = [
            /浅草本店/,
            /浅草站前店|浅草駅前店/,
            /浅草雅.*プレミアム|浅草.*旗舰店/,
            /清水寺店/,
            /京都.*不染川/
          ];

          storePatterns.forEach(pattern => {
            if (pattern.test(title)) {
              const match = title.match(pattern);
              if (match) store = match[0];
            }
          });

          // 推断地区
          let region = '';
          if (store.includes('浅草') || title.includes('东京') || title.includes('東京')) {
            region = '东京地区';
          } else if (store.includes('清水寺') || store.includes('京都') || title.includes('京都')) {
            region = '京都地区';
          }

          // 自动生成标签
          const autoTags = [];
          if (title.includes('情侣') || title.includes('情侶')) autoTags.push('情侣套餐');
          if (title.includes('男士') || title.includes('武士') || title.includes('袴')) autoTags.push('男士套餐');
          if (title.includes('女士') || title.includes('振袖') || title.includes('访问着') || title.includes('訪問着')) autoTags.push('女士套餐');
          if (title.includes('亲子') || title.includes('親子') || title.includes('儿童')) autoTags.push('亲子套餐');
          if (title.includes('团体') || title.includes('團體') || /\d+人/.test(title)) autoTags.push('团体套餐');
          if (title.includes('蕾丝') || title.includes('蕾絲')) autoTags.push('蕾丝和服');
          if (title.includes('摄影') || title.includes('攝影') || title.includes('拍摄')) autoTags.push('含摄影');
          if (title.includes('10周年') || title.includes('優惠')) autoTags.push('10周年优惠');

          // 合并手动提取的标签和自动生成的标签
          const allTags = [...new Set([...tags, ...autoTags])];

          // 只添加有效数据
          if (title && (price || description || image)) {
            results.push({
              name: title,
              price: price ? parseInt(price) * 1000 : null,  // 价格 x1000
              originalPrice: originalPrice ? parseInt(originalPrice) * 1000 : null,  // 原价 x1000
              description: description.substring(0, 300),
              image,
              store,
              region,
              tags: allTags,
              hasPrice: !!price,
              hasImage: !!image
            });
          }
        } catch (error) {
          console.error(`提取套餐 ${index} 时出错:`, error.message);
        }
      });

      return results;
    });

    console.log(`✅ 成功提取 ${plans.length} 个套餐\n`);

    // 统计信息
    const withPrice = plans.filter(p => p.price).length;
    const withImage = plans.filter(p => p.image).length;
    const stores = [...new Set(plans.filter(p => p.store).map(p => p.store))];

    console.log('📊 统计信息:');
    console.log(`   - 有价格的套餐: ${withPrice}/${plans.length}`);
    console.log(`   - 有图片的套餐: ${withImage}/${plans.length}`);
    console.log(`   - 识别的店铺: ${stores.length} 个`);
    if (stores.length > 0) {
      console.log(`   - 店铺列表: ${stores.join(', ')}`);
    }
    console.log('');

    // 显示前3个套餐
    console.log('📋 前3个套餐示例:\n');
    plans.slice(0, 3).forEach((plan, i) => {
      console.log(`${i + 1}. ${plan.name}`);
      console.log(`   价格: ${plan.price ? '¥' + plan.price : '未知'}`);
      console.log(`   店铺: ${plan.store || '未指定'}`);
      console.log(`   标签: ${plan.tags.join(', ') || '无'}`);
      console.log('');
    });

    // 保存数据
    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `scraped-real-plans-${timestamp}.json`);

    const output = {
      scrapedAt: new Date().toISOString(),
      sourceUrl: 'https://hefumiyabi.com/zh/plan',
      method: 'puppeteer-improved',
      plans,
      metadata: {
        totalPlans: plans.length,
        withPrice,
        withImage,
        stores,
        priceRange: {
          min: Math.min(...plans.filter(p => p.price).map(p => p.price)),
          max: Math.max(...plans.filter(p => p.price).map(p => p.price))
        }
      }
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 完整数据已保存: ${outputFile}\n`);

    // 保存简化版本
    const simpleFile = path.join(outputDir, 'real-plans-data.json');
    fs.writeFileSync(simpleFile, JSON.stringify(plans, null, 2), 'utf-8');
    console.log(`💾 简化数据已保存: ${simpleFile}\n`);

    return plans;

  } catch (error) {
    console.error('❌ 抓取失败:', error.message);

    // 截图调试
    const screenshotPath = path.join(__dirname, '../data/debug-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 调试截图: ${screenshotPath}`);

    throw error;
  } finally {
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }
}

async function main() {
  console.log('=' .repeat(60));
  console.log('  改进的官网数据爬虫 - 完整价格和店铺信息提取');
  console.log('=' .repeat(60));
  console.log('');

  try {
    await scrapePlansImproved();
    console.log('\n✅ 抓取完成！');
  } catch (error) {
    console.error('\n❌ 抓取失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapePlansImproved };
