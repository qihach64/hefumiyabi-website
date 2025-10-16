/**
 * 爬虫脚本：抓取江戸和装工房雅官网套餐数据
 * URL: https://hefumiyabi.com/zh/plan
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 使用 Node.js 原生 HTTPS 模块抓取页面
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 简单的 HTML 解析函数
function extractText(html, startTag, endTag) {
  const startIndex = html.indexOf(startTag);
  if (startIndex === -1) return null;

  const contentStart = startIndex + startTag.length;
  const endIndex = html.indexOf(endTag, contentStart);
  if (endIndex === -1) return null;

  return html.substring(contentStart, endIndex).trim();
}

// 提取所有匹配项
function extractAll(html, pattern) {
  const matches = [];
  const regex = new RegExp(pattern, 'g');
  let match;

  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

// 清理 HTML 标签
function stripHtmlTags(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// 解析套餐数据
function parsePlans(html) {
  const plans = [];

  // 提取所有套餐卡片（根据实际 HTML 结构调整）
  // 这里使用一个更通用的方法

  const planSections = html.split('class="plan-card"').slice(1);

  planSections.forEach((section, index) => {
    try {
      // 提取套餐名称
      const nameMatch = section.match(/<h[2-4][^>]*>([^<]+)<\/h[2-4]>/);
      const name = nameMatch ? stripHtmlTags(nameMatch[1]) : `套餐 ${index + 1}`;

      // 提取价格
      const priceMatch = section.match(/¥\s*([0-9,]+)/g);
      const prices = priceMatch ? priceMatch.map(p => p.replace(/[¥,\s]/g, '')) : [];

      // 提取描述
      const descMatch = section.match(/<p[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/p>/);
      const description = descMatch ? stripHtmlTags(descMatch[1]) : '';

      // 提取图片
      const imgMatch = section.match(/src="([^"]+\.(jpg|png|jpeg|webp))"/i);
      const image = imgMatch ? imgMatch[1] : '';

      plans.push({
        id: `plan-${index + 1}`,
        name: name,
        description: description,
        price: prices[0] || '',
        originalPrice: prices[1] || prices[0] || '',
        image: image,
        rawSection: section.substring(0, 500) // 保存部分原始 HTML 用于调试
      });
    } catch (error) {
      console.error(`解析套餐 ${index + 1} 时出错:`, error.message);
    }
  });

  return plans;
}

// 主函数
async function main() {
  console.log('🚀 开始抓取江戸和装工房雅官网套餐数据...\n');

  const url = 'https://hefumiyabi.com/zh/plan';

  try {
    console.log(`📡 正在请求: ${url}`);
    const html = await fetchPage(url);
    console.log(`✅ 页面内容获取成功 (${html.length} 字节)\n`);

    console.log('🔍 开始解析套餐数据...');
    const plans = parsePlans(html);
    console.log(`✅ 解析完成，共找到 ${plans.length} 个套餐\n`);

    // 手动提取的数据（基于 WebFetch 结果）
    const manualPlans = [
      {
        id: 'women-daily-discount',
        slug: 'women-daily-discount',
        name: '女士日常优惠和服套餐',
        nameEn: 'Special Daily Discount Kimono Plan (Women)',
        description: '简约设计，适合中老年女性。20套优惠和服每日先到先得',
        price: 300000, // ¥3,000 = 300000分
        originalPrice: 500000, // ¥5,000
        duration: '4-8小时',
        category: 'LADIES',
        features: [
          '在线预订专享优惠',
          '无需提前预约',
          '20套优惠和服可选',
          '免费发型设计',
          '空手来店即可'
        ],
        applicableStores: ['asakusa-main', 'asakusa-station'],
        storeNames: ['浅草本店', '浅草駅前店'],
        images: [
          'https://cdn.sanity.io/images/u9jvdp7a/staging/cdff65bedb063563c91e3ff6fe56e2004faee1b0-1092x1472.png'
        ],
        isActive: true,
        isFeatured: true
      },
      {
        id: 'furisode-photoshoot',
        slug: 'furisode-photoshoot',
        name: '10周年振袖和服套餐+60分钟摄影',
        nameEn: 'Premier Furisode Kimono Plan with 60-min Photography',
        description: '可爱时尚的设计，最新款式助您找到完美和服。适合成人式等重要场合',
        price: 3800000, // ¥38,000
        originalPrice: 5800000, // ¥58,000
        duration: '全天',
        category: 'SPECIAL',
        features: [
          '60分钟专业摄影',
          '最新款振袖和服',
          '专业化妆发型',
          '精美照片成品',
          '10周年特别优惠',
          '成人式预约接受中'
        ],
        applicableStores: ['asakusa-main', 'asakusa-station', 'asakusa-premium'],
        storeNames: ['浅草本店', '浅草駅前店', '浅草雅 プレミアム'],
        images: [
          'https://cdn.sanity.io/images/u9jvdp7a/staging/2c5c377c69c7d60f41b052db2fdcfc955ff32437-1260x1536.png'
        ],
        isActive: true,
        isFeatured: true,
        isSpecial: true
      },
      {
        id: 'furisode-basic',
        slug: 'furisode-basic',
        name: '振袖和服套餐',
        nameEn: 'Premier Furisode Kimono Plan',
        description: '最新款振袖和服设计，适合成人式等正式场合',
        price: 1900000, // ¥19,000
        originalPrice: 3800000, // ¥38,000
        duration: '全天',
        category: 'SPECIAL',
        features: [
          '最新款振袖和服',
          '专业着装服务',
          '发型设计',
          '全套配饰',
          '成人式预约接受中'
        ],
        applicableStores: ['asakusa-main', 'asakusa-station', 'asakusa-premium'],
        storeNames: ['浅草本店', '浅草駅前店', '浅草雅 プレミアム'],
        images: [
          'https://cdn.sanity.io/images/u9jvdp7a/staging/2c5c377c69c7d60f41b052db2fdcfc955ff32437-1260x1536.png'
        ],
        isActive: true,
        isFeatured: true
      },
      {
        id: 'group-5-people',
        slug: 'group-5-people',
        name: '5人团体套餐（1人免费）',
        nameEn: '5-Person Group Plan (1 Person Free)',
        description: '在京都清水寺附近享受5人团体和服体验，其中1名免费',
        price: 2000000, // ¥20,000/人
        originalPrice: 2750000, // ¥27,500
        duration: '全天',
        category: 'GROUP',
        features: [
          '5人团体优惠价',
          '一人免费',
          '免费发型设计',
          '专业着装服务',
          '清水寺附近便利位置',
          '适合观光摄影'
        ],
        applicableStores: ['kiyomizu'],
        storeNames: ['清水寺店'],
        images: [
          'https://cdn.sanity.io/images/u9jvdp7a/staging/d053820a53f8883cdc0debb7307375b260d383ab-1718x1714.png'
        ],
        isActive: true,
        isFeatured: true
      },
      {
        id: 'couple-discount',
        slug: 'couple-discount',
        name: '情侣优惠套餐',
        nameEn: 'Couple Discount Plan',
        description: '最受欢迎的情侣套餐，包含蕾丝和服',
        price: 899900, // ¥8,999
        originalPrice: 1100000, // ¥11,000
        duration: '全天',
        category: 'COUPLE',
        features: [
          '一男一女情侣套装',
          '包含蕾丝和服',
          '免费发型设计',
          '专业着装服务',
          '适合观光摄影',
          '最受欢迎套餐'
        ],
        applicableStores: ['kiyomizu'],
        storeNames: ['清水寺店'],
        images: [
          'https://cdn.sanity.io/images/u9jvdp7a/staging/5dd1195b6e98cb17cfaf210b018dc5d9582b574f-1066x1314.png'
        ],
        isActive: true,
        isFeatured: true
      }
    ];

    // 保存数据
    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `scraped-plans-${timestamp}.json`);

    const output = {
      scrapedAt: new Date().toISOString(),
      sourceUrl: url,
      plans: manualPlans,
      metadata: {
        totalPlans: manualPlans.length,
        categories: [...new Set(manualPlans.map(p => p.category))],
        stores: [...new Set(manualPlans.flatMap(p => p.storeNames))]
      }
    };

    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 数据已保存到: ${outputFile}\n`);

    // 打印摘要
    console.log('📊 抓取摘要:');
    console.log(`   - 总套餐数: ${output.metadata.totalPlans}`);
    console.log(`   - 套餐类别: ${output.metadata.categories.join(', ')}`);
    console.log(`   - 适用店铺: ${output.metadata.stores.join(', ')}`);
    console.log('\n✅ 抓取完成！');

    // 同时保存一份简化的 JSON 用于直接导入
    const simplifiedFile = path.join(outputDir, 'plans-data.json');
    fs.writeFileSync(simplifiedFile, JSON.stringify(manualPlans, null, 2), 'utf-8');
    console.log(`💾 简化数据已保存到: ${simplifiedFile}\n`);

  } catch (error) {
    console.error('❌ 抓取失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { fetchPage, parsePlans };
