/**
 * 部署前检查脚本
 * 确保所有必需的配置都已就绪
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 和缘网站部署检查\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const checks = [];
let passed = 0;
let failed = 0;

// 检查 1: package.json 构建脚本
console.log('✓ 检查构建脚本...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts.build && packageJson.scripts.postinstall) {
  console.log('  ✅ 构建脚本配置正确');
  console.log(`     build: ${packageJson.scripts.build}`);
  console.log(`     postinstall: ${packageJson.scripts.postinstall}`);
  passed++;
} else {
  console.log('  ❌ 构建脚本缺失或配置错误');
  failed++;
}
console.log('');

// 检查 2: Next.js 配置
console.log('✓ 检查 Next.js 配置...');
if (fs.existsSync('next.config.ts')) {
  const config = fs.readFileSync('next.config.ts', 'utf8');
  if (config.includes('remotePatterns')) {
    console.log('  ✅ 图片域名配置存在');
    passed++;
  } else {
    console.log('  ⚠️  未找到图片域名配置');
    failed++;
  }
} else {
  console.log('  ❌ next.config.ts 不存在');
  failed++;
}
console.log('');

// 检查 3: Prisma schema
console.log('✓ 检查 Prisma schema...');
if (fs.existsSync('prisma/schema.prisma')) {
  console.log('  ✅ Prisma schema 存在');
  passed++;
} else {
  console.log('  ❌ Prisma schema 不存在');
  failed++;
}
console.log('');

// 检查 4: 环境变量示例
console.log('✓ 检查环境变量模板...');
if (fs.existsSync('.env.example')) {
  console.log('  ✅ .env.example 存在');
  passed++;
} else {
  console.log('  ⚠️  .env.example 不存在（建议创建）');
}
console.log('');

// 检查 5: 本地环境变量
console.log('✓ 检查本地环境变量...');
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const hasDatabase = envContent.includes('DATABASE_URL');
  const hasAppUrl = envContent.includes('NEXT_PUBLIC_APP_URL');
  
  if (hasDatabase && hasAppUrl) {
    console.log('  ✅ 本地环境变量配置完整');
    passed++;
  } else {
    console.log('  ⚠️  本地环境变量不完整');
    if (!hasDatabase) console.log('     - 缺少 DATABASE_URL');
    if (!hasAppUrl) console.log('     - 缺少 NEXT_PUBLIC_APP_URL');
  }
} else {
  console.log('  ⚠️  .env.local 不存在（本地开发需要）');
}
console.log('');

// 检查 6: Git 仓库状态
console.log('✓ 检查 Git 状态...');
if (fs.existsSync('.git')) {
  console.log('  ✅ Git 仓库已初始化');
  passed++;
} else {
  console.log('  ❌ 未初始化 Git 仓库');
  failed++;
}
console.log('');

// 检查 7: 依赖安装
console.log('✓ 检查依赖...');
if (fs.existsSync('node_modules')) {
  console.log('  ✅ 依赖已安装');
  passed++;
} else {
  console.log('  ❌ 依赖未安装，请运行 npm install');
  failed++;
}
console.log('');

// 总结
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`📊 检查结果: ${passed} 通过, ${failed} 失败\n`);

if (failed === 0) {
  console.log('🎉 恭喜！项目已准备好部署到 Vercel！\n');
  console.log('📝 下一步：');
  console.log('   1. 访问 https://vercel.com');
  console.log('   2. 用 GitHub 账号登录');
  console.log('   3. 导入这个仓库');
  console.log('   4. 配置环境变量：');
  console.log('      - DATABASE_URL');
  console.log('      - AUTH_SECRET (运行: openssl rand -base64 32)');
  console.log('      - NEXT_PUBLIC_APP_URL');
  console.log('      - NODE_ENV=production');
  console.log('   5. 点击 Deploy！\n');
  console.log('💡 详细步骤请查看 DEPLOYMENT.md\n');
} else {
  console.log('⚠️  部分检查未通过，请先修复以上问题。\n');
  console.log('💡 查看 DEPLOYMENT.md 获取帮助\n');
  process.exit(1);
}
