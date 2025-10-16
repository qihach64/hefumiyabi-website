/**
 * 修复价格数据 - 将价格乘以1000（因为原始数据缺少千位）
 */

const fs = require('fs');
const path = require('path');

function fixPrices() {
  const dataPath = path.join(__dirname, '../data/real-plans-data.json');
  const plans = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`📋 处理 ${plans.length} 个套餐...\n`);

  // 修复价格
  const fixed = plans.map(plan => {
    const fixed = { ...plan };

    // 价格需要乘以1000（6 -> 6000）
    if (fixed.price && fixed.price < 1000) {
      fixed.price = fixed.price * 1000;
    }

    if (fixed.originalPrice && fixed.originalPrice < 1000) {
      fixed.originalPrice = fixed.originalPrice * 1000;
    }

    return fixed;
  });

  // 保存修复后的数据
  const outputPath = path.join(__dirname, '../data/real-plans-data-fixed.json');
  fs.writeFileSync(outputPath, JSON.stringify(fixed, null, 2), 'utf-8');

  console.log(`✅ 修复完成！`);
  console.log(`💾 保存到: ${outputPath}\n`);

  // 显示示例
  console.log('📋 前3个套餐（修复后）:\n');
  fixed.slice(0, 3).forEach((plan, i) => {
    console.log(`${i + 1}. ${plan.name}`);
    console.log(`   价格: ¥${plan.price}`);
    console.log(`   原价: ¥${plan.originalPrice}`);
    console.log(`   店铺: ${plan.store || '未指定'}`);
    console.log('');
  });

  // 统计
  const priceStats = {
    min: Math.min(...fixed.filter(p => p.price).map(p => p.price)),
    max: Math.max(...fixed.filter(p => p.price).map(p => p.price)),
    avg: Math.round(fixed.reduce((sum, p) => sum + (p.price || 0), 0) / fixed.length)
  };

  console.log('📊 价格统计:');
  console.log(`   - 最低价: ¥${priceStats.min}`);
  console.log(`   - 最高价: ¥${priceStats.max}`);
  console.log(`   - 平均价: ¥${priceStats.avg}`);

  return fixed;
}

if (require.main === module) {
  fixPrices();
}

module.exports = { fixPrices };
