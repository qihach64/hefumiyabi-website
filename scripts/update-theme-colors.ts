
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// 手动加载 .env
const envPath = path.resolve(process.cwd(), '.env');
console.log('Trying to load .env from:', envPath);

if (fs.existsSync(envPath)) {
  console.log('.env file found.');
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    // 简单的 key=value 解析，忽略注释
    if (line.trim().startsWith('#')) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // 去除引号
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} else {
    console.log('.env file NOT found.');
}

console.log('DATABASE_URL is:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

const prisma = new PrismaClient();

// 日本传统色系 - 低饱和度、高明度，与樱花粉 (#FF7A9A) 协调
const newThemeColors: Record<string, string> = {
  'trendy-photo': '#F28B82',    // 薄红 - 柔和的珊瑚红
  'formal-ceremony': '#B39DDB', // 藤紫 - 优雅的浅紫色
  'together': '#80CBC4',        // 青磁 - 清新的薄荷青
  'seasonal': '#AED581',        // 萌黄 - 柔和自然
  'casual-stroll': '#90CAF9',   // 勿忘草 - 通透的天空蓝
  'specialty': '#FFCC80',       // 杏色 - 温暖的淡橙色
};

async function main() {
  console.log('🎨 开始更新主题颜色为日本传统色系 (Nippon Colors)...\n');

  // 如果没有 DATABASE_URL，尝试使用硬编码的本地连接字符串（如果用户是本地开发）
  // 或者提示错误
  if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL not found in environment variables.');
      process.exit(1);
  }

  for (const [slug, color] of Object.entries(newThemeColors)) {
    const theme = await prisma.theme.findUnique({
      where: { slug },
    });

    if (theme) {
      await prisma.theme.update({
        where: { slug },
        data: { color },
      });
      console.log(`✅ 更新 ${theme.name} (${slug}) -> ${color}`);
    } else {
      console.log(`⚠️ 未找到主题: ${slug}`);
    }
  }

  console.log('\n✨ 颜色更新完成！请刷新页面查看效果。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
