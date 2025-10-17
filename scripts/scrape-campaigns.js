/**
 * Campaign 活动套餐爬虫
 * 使用方法: node scripts/scrape-campaigns.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeCampaigns() {
  console.log('🚀 启动 Campaign 爬虫...\n');

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
    console.log('📡 正在访问: https://hefumiyabi.com/zh/campaign\n');

    await page.goto('https://hefumiyabi.com/zh/campaign', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('⏳ 等待页面渲染...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔍 提取活动套餐数据...\n');

    const campaigns = await page.evaluate(() => {
      const results = [];

      // 尝试找到所有活动卡片
      const cards = document.querySelectorAll('[data-slot="card"], .card, article, [class*="card"]');

      cards.forEach((card, index) => {
        try {
          // 提取标题
          const titleEl = card.querySelector('h1, h2, h3, h4, h5, [class*="title"], [class*="name"]');
          const title = titleEl ? titleEl.textContent.trim() : '';

          // 跳过空标题或太短的标题
          if (!title || title.length < 3) return;

          // 提取价格 - Campaign 通常有原价和优惠价
          let campaignPrice = '';
          let originalPrice = '';

          // 查找所有包含价格的文本
          const priceTexts = Array.from(card.querySelectorAll('*'))
            .map(el => el.textContent)
            .filter(text => /[¥￥]\s*[\d,]+/.test(text));

          if (priceTexts.length > 0) {
            // 提取所有价格
            const allPrices = [];
            priceTexts.forEach(text => {
              const matches = text.match(/[¥￥]\s*([\d,]+)/g);
              if (matches) {
                matches.forEach(match => {
                  const price = match.replace(/[¥￥\s,]/g, '');
                  allPrices.push(parseInt(price));
                });
              }
            });

            // 去重并排序
            const uniquePrices = [...new Set(allPrices)].sort((a, b) => a - b);

            if (uniquePrices.length >= 2) {
              // 假设较低的是活动价，较高的是原价
              campaignPrice = uniquePrices[0].toString();
              originalPrice = uniquePrices[uniquePrices.length - 1].toString();
            } else if (uniquePrices.length === 1) {
              campaignPrice = uniquePrices[0].toString();
            }
          }

          // 尝试从特定文本识别价格类型
          const priceSpans = card.querySelectorAll('span, div, p');
          priceSpans.forEach(span => {
            const text = span.textContent;

            // 识别活动价/优惠价
            if ((text.includes('线上预约') || text.includes('線上預約') ||
                 text.includes('优惠') || text.includes('優惠') ||
                 text.includes('活动') || text.includes('活動')) &&
                text.includes('¥')) {
              const match = text.match(/[¥￥]\s*([\d,]+)/);
              if (match) {
                campaignPrice = match[1].replace(/,/g, '');
              }
            }

            // 识别原价
            if ((text.includes('原价') || text.includes('原價') ||
                 text.includes('定价') || text.includes('定價')) &&
                text.includes('¥')) {
              const match = text.match(/[¥￥]\s*([\d,]+)/);
              if (match) {
                originalPrice = match[1].replace(/,/g, '');
              }
            }
          });

          // 提取描述
          const descEl = card.querySelector('p, [class*="description"], [class*="desc"]');
          let description = descEl ? descEl.textContent.trim() : '';

          // 如果描述太短，尝试找更多段落
          if (description.length < 20) {
            const allParagraphs = card.querySelectorAll('p');
            const descriptions = Array.from(allParagraphs)
              .map(p => p.textContent.trim())
              .filter(text => text.length > 10 && !text.includes('¥'));
            if (descriptions.length > 0) {
              description = descriptions.join(' ');
            }
          }

          // 提取所有图片
          const images = [];
          const imgElements = card.querySelectorAll('img');
          imgElements.forEach(img => {
            const src = img.src || img.dataset.src || img.getAttribute('data-src') || '';
            if (src && !src.includes('icon') && !src.includes('logo')) {
              images.push(src);
            }
          });

          // 提取服务内容/包含项
          const includes = [];

          // 查找列表项
          const listItems = card.querySelectorAll('li, [class*="list"], [class*="item"]');
          listItems.forEach(item => {
            const text = item.textContent.trim();
            if (text && text.length > 2 && text.length < 100 &&
                !text.includes('¥') && !text.includes('￥')) {
              includes.push(text);
            }
          });

          // 如果没找到列表项，尝试从描述中提取
          if (includes.length === 0) {
            const commonIncludes = [
              '和服租赁', '着装服务', '发型设计', '专业摄影',
              '全套配饰', '蕾丝和服', '振袖和服'
            ];
            commonIncludes.forEach(service => {
              if (title.includes(service) || description.includes(service)) {
                includes.push(service);
              }
            });
          }

          // 提取适用店铺
          const applicableStores = [];

          // 店铺模式
          const storePatterns = [
            { pattern: /浅草本店|淺草本店/, name: '浅草本店' },
            { pattern: /浅草站前店|浅草駅前店|淺草站前店/, name: '浅草站前店' },
            { pattern: /浅草雅.*プレミアム|浅草.*旗舰店/, name: '浅草雅旗舰店' },
            { pattern: /清水寺店/, name: '京都清水寺店' },
            { pattern: /不染川/, name: '京都不染川店' }
          ];

          const fullText = title + ' ' + description;
          storePatterns.forEach(({ pattern, name }) => {
            if (pattern.test(fullText)) {
              applicableStores.push(name);
            }
          });

          // 如果没有明确店铺，检查是否有"全店通用"等字样
          if (applicableStores.length === 0) {
            if (fullText.includes('全店') || fullText.includes('所有店铺') ||
                fullText.includes('全部店铺')) {
              applicableStores.push('浅草本店', '浅草站前店', '京都清水寺店');
            }
          }

          // 提取标签
          const tags = [];
          const tagElements = card.querySelectorAll('[class*="tag"], [class*="badge"], [class*="chip"], span[class*="rounded"]');
          tagElements.forEach(tag => {
            const text = tag.textContent.trim();
            if (text && text.length < 30 && !text.includes('¥') && !text.includes('￥')) {
              tags.push(text);
            }
          });

          // 自动生成标签
          if (title.includes('限定') || title.includes('限時') || title.includes('限时')) tags.push('限时优惠');
          if (title.includes('周年') || title.includes('週年')) tags.push('周年活动');
          if (title.includes('情侣') || title.includes('情侶')) tags.push('情侣套餐');
          if (title.includes('团体') || title.includes('團體')) tags.push('团体优惠');
          if (title.includes('蕾丝') || title.includes('蕾絲')) tags.push('蕾丝和服');
          if (title.includes('振袖')) tags.push('振袖');
          if (title.includes('摄影') || title.includes('攝影')) tags.push('含摄影');

          // 去重标签
          const uniqueTags = [...new Set(tags)];

          // 只添加有效数据
          if (title && (campaignPrice || description || images.length > 0)) {
            results.push({
              name: title,
              description: description.substring(0, 500),
              originalPrice: originalPrice ? parseInt(originalPrice) : null, // 日元价格
              campaignPrice: campaignPrice ? parseInt(campaignPrice) : null, // 日元价格
              images: images.slice(0, 5), // 最多5张图片
              includes: includes.slice(0, 10), // 最多10项服务
              applicableStores,
              tags: uniqueTags,
              hasPrice: !!campaignPrice,
              hasImages: images.length > 0,
              hasStores: applicableStores.length > 0
            });
          }
        } catch (error) {
          console.error(`提取活动 ${index} 时出错:`, error.message);
        }
      });

      return results;
    });

    console.log(`✅ 成功提取 ${campaigns.length} 个活动套餐\n`);

    // 统计信息
    const withPrice = campaigns.filter(c => c.campaignPrice).length;
    const withImages = campaigns.filter(c => c.images.length > 0).length;
    const withStores = campaigns.filter(c => c.applicableStores.length > 0).length;
    const allStores = [...new Set(campaigns.flatMap(c => c.applicableStores))];

    console.log('📊 统计信息:');
    console.log(`   - 有价格的活动: ${withPrice}/${campaigns.length}`);
    console.log(`   - 有图片的活动: ${withImages}/${campaigns.length}`);
    console.log(`   - 有店铺信息的活动: ${withStores}/${campaigns.length}`);
    console.log(`   - 识别的店铺: ${allStores.length} 个`);
    if (allStores.length > 0) {
      console.log(`   - 店铺列表: ${allStores.join(', ')}`);
    }
    console.log('');

    // 显示前3个活动
    console.log('📋 前3个活动示例:\n');
    campaigns.slice(0, 3).forEach((campaign, i) => {
      console.log(`${i + 1}. ${campaign.name}`);
      console.log(`   活动价: ${campaign.campaignPrice ? '¥' + campaign.campaignPrice : '未知'}`);
      console.log(`   原价: ${campaign.originalPrice ? '¥' + campaign.originalPrice : '未知'}`);
      console.log(`   图片: ${campaign.images.length} 张`);
      console.log(`   适用店铺: ${campaign.applicableStores.join(', ') || '未指定'}`);
      console.log(`   包含服务: ${campaign.includes.slice(0, 3).join(', ')}...`);
      console.log('');
    });

    // 保存数据
    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `scraped-campaigns-${timestamp}.json`);

    const output = {
      scrapedAt: new Date().toISOString(),
      sourceUrl: 'https://hefumiyabi.com/zh/campaign',
      method: 'puppeteer',
      campaigns,
      metadata: {
        totalCampaigns: campaigns.length,
        withPrice,
        withImages,
        withStores,
        stores: allStores,
        priceRange: campaigns.filter(c => c.campaignPrice).length > 0 ? {
          min: Math.min(...campaigns.filter(c => c.campaignPrice).map(c => c.campaignPrice)),
          max: Math.max(...campaigns.filter(c => c.campaignPrice).map(c => c.campaignPrice))
        } : null
      }
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 完整数据已保存: ${outputFile}\n`);

    // 保存简化版本
    const simpleFile = path.join(outputDir, 'real-campaigns-data.json');
    fs.writeFileSync(simpleFile, JSON.stringify(campaigns, null, 2), 'utf-8');
    console.log(`💾 简化数据已保存: ${simpleFile}\n`);

    return campaigns;

  } catch (error) {
    console.error('❌ 抓取失败:', error.message);

    // 截图调试
    const screenshotPath = path.join(__dirname, '../data/debug-campaign-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 调试截图: ${screenshotPath}`);

    throw error;
  } finally {
    await browser.close();
    console.log('✅ 浏览器已关闭');
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('  Campaign 活动套餐爬虫');
  console.log('='.repeat(60));
  console.log('');

  try {
    await scrapeCampaigns();
    console.log('\n✅ 抓取完成！');
  } catch (error) {
    console.error('\n❌ 抓取失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scrapeCampaigns };
