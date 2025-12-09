/**
 * 更新和服库映射脚本
 *
 * 扫描已处理的和服图片，自动更新 kimonoLibrary.ts 中的 cleanImageUrl 映射
 *
 * 使用方法:
 * npx tsx scripts/update-kimono-library-mappings.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const KIMONOS_DIR = path.join(__dirname, '../../../apps/virtual-tryon-demo/public/kimonos');
const LIBRARY_FILE = path.join(__dirname, '../src/lib/kimonoLibrary.ts');

// 分类映射：输出目录名 → 源目录名
const CATEGORY_MAP: Record<string, string> = {
  'female': 'girl',
  'male': 'boy',
  'child': 'kid',
};

interface ProcessedKimono {
  sourceFile: string;
  cleanImageUrl: string;
  category: string;
}

function getProcessedKimonos(): ProcessedKimono[] {
  const result: ProcessedKimono[] = [];

  for (const [targetCat, sourceCat] of Object.entries(CATEGORY_MAP)) {
    const categoryDir = path.join(KIMONOS_DIR, targetCat);

    if (!fs.existsSync(categoryDir)) {
      console.log(`Directory not found: ${categoryDir}`);
      continue;
    }

    const files = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.png'));

    for (const file of files) {
      const baseName = path.basename(file, '.png');
      result.push({
        sourceFile: `${sourceCat}/${baseName}`,
        cleanImageUrl: `/kimonos/${targetCat}/${file}`,
        category: targetCat,
      });
    }
  }

  return result;
}

function updateLibraryFile(processed: ProcessedKimono[]): void {
  let content = fs.readFileSync(LIBRARY_FILE, 'utf-8');

  let updatedCount = 0;

  for (const item of processed) {
    // 查找对应的 imageUrl 行
    // 匹配模式: imageUrl: `${KIMONO_BASE_PATH}/girl/010A7117.jpg`,
    const sourcePattern = item.sourceFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `(imageUrl: \`\\$\\{KIMONO_BASE_PATH\\}\\/${sourcePattern}\\.[^']+\`,)`,
      'g'
    );

    if (regex.test(content)) {
      // 检查是否已有 cleanImageUrl
      const checkRegex = new RegExp(
        `imageUrl: \`\\$\\{KIMONO_BASE_PATH\\}\\/${sourcePattern}\\.[^']+\`,\\s*\\n\\s*cleanImageUrl:`,
        'g'
      );

      if (!checkRegex.test(content)) {
        // 添加 cleanImageUrl
        content = content.replace(
          regex,
          `$1\n      cleanImageUrl: '${item.cleanImageUrl}',`
        );
        updatedCount++;
      }
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(LIBRARY_FILE, content);
    console.log(`Updated ${updatedCount} mappings in kimonoLibrary.ts`);
  } else {
    console.log('No new mappings to add');
  }
}

function main() {
  console.log('=== Update Kimono Library Mappings ===\n');

  const processed = getProcessedKimonos();
  console.log(`Found ${processed.length} processed kimono images\n`);

  if (processed.length === 0) {
    console.log('No processed images found. Run extract-kimono-from-photos.ts first.');
    return;
  }

  // 按分类统计
  const stats: Record<string, number> = {};
  for (const item of processed) {
    stats[item.category] = (stats[item.category] || 0) + 1;
  }

  console.log('By category:');
  for (const [cat, count] of Object.entries(stats)) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log('\nUpdating kimonoLibrary.ts...');
  updateLibraryFile(processed);

  console.log('\nDone!');
}

main();
