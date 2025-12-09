/**
 * 批量反抠像脚本 - 移除背景图中的人物
 *
 * 使用 Gemini API 将背景图中的人物移除，保留背景
 *
 * 使用方法:
 * GOOGLE_AI_API_KEY=xxx npx tsx scripts/remove-person-from-backgrounds.ts
 *
 * 可选参数:
 * --category=girl|boy|kid  只处理指定分类
 * --dry-run               仅列出待处理文件，不实际执行
 * --limit=N               限制处理数量
 * --mode=inpaint|silhouette  处理模式（默认 inpaint）
 *   - inpaint: 用背景填充人物区域（干净背景）
 *   - silhouette: 保留人物轮廓作为灰色占位符
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// 配置
const BACKGROUNDS_DIR = path.join(__dirname, '../../../apps/virtual-tryon-demo/public/backgrounds');
const OUTPUT_DIR = path.join(__dirname, '../../../apps/virtual-tryon-demo/public/backgrounds-clean');
const CATEGORIES = ['girl', 'boy', 'kid'] as const;

// Gemini 配置 - 使用背景填充方式移除人物
// 注意：这会生成干净的背景图，人物位置被自然背景填充
const REMOVE_PERSON_PROMPT = `Remove the person/people from this image completely.
Fill in the area where the person was with a natural continuation of the background.
The result should look like a photograph of the empty scene without any person.
Keep all other elements: buildings, nature, props, lighting exactly as they are.
The image should look photorealistic, not AI-generated.`;

// 备选方案：保留人物轮廓作为占位符（半透明灰色）
const MARK_PERSON_AREA_PROMPT = `In this image, replace the person with a semi-transparent gray silhouette.
The silhouette should:
- Keep the exact shape and position of the original person
- Be filled with a semi-transparent gray color (50% opacity)
- Show the background through the gray area
- Keep all other elements exactly as they are
This creates a "placeholder" showing where a person should be placed.`;

interface ProcessResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  error?: string;
}

type ProcessMode = 'inpaint' | 'silhouette';

async function processImage(
  ai: GoogleGenAI,
  inputPath: string,
  outputPath: string,
  mode: ProcessMode = 'inpaint'
): Promise<ProcessResult> {
  try {
    // 读取图片并转为 base64
    const imageBuffer = fs.readFileSync(inputPath);
    const imageBase64 = imageBuffer.toString('base64');

    // 获取图片 MIME 类型
    const ext = path.extname(inputPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png'
      : ext === '.webp' ? 'image/webp'
      : 'image/jpeg';

    const prompt = mode === 'silhouette' ? MARK_PERSON_AREA_PROMPT : REMOVE_PERSON_PROMPT;

    console.log(`  Processing (${mode}): ${path.basename(inputPath)}`);

    // 调用 Gemini API 进行图像编辑
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseModalities: ['image', 'text'],
        // @ts-ignore - Gemini 图像生成特定参数
        imageGenerationConfig: {
          outputMimeType: 'image/jpeg',
        }
      }
    });

    // 提取生成的图片
    const result = response.candidates?.[0]?.content?.parts;
    if (!result) {
      throw new Error('No response from Gemini');
    }

    // 找到图片数据
    const imagePart = result.find((part: any) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error('No image in response');
    }

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 保存图片
    const outputBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    fs.writeFileSync(outputPath, outputBuffer);

    console.log(`  ✓ Saved: ${path.basename(outputPath)}`);

    return {
      success: true,
      inputPath,
      outputPath,
    };
  } catch (error: any) {
    console.error(`  ✗ Error: ${error.message}`);
    return {
      success: false,
      inputPath,
      error: error.message,
    };
  }
}

async function getImagesToProcess(category?: string): Promise<{ category: string; files: string[] }[]> {
  const result: { category: string; files: string[] }[] = [];

  const categoriesToProcess = category
    ? [category]
    : CATEGORIES;

  for (const cat of categoriesToProcess) {
    const categoryDir = path.join(BACKGROUNDS_DIR, cat);
    const outputCategoryDir = path.join(OUTPUT_DIR, cat);

    if (!fs.existsSync(categoryDir)) {
      console.warn(`Warning: Category directory not found: ${categoryDir}`);
      continue;
    }

    const files = fs.readdirSync(categoryDir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .filter(f => {
        // 跳过已处理的文件
        const outputPath = path.join(outputCategoryDir, f.replace(/\.[^.]+$/, '.jpg'));
        return !fs.existsSync(outputPath);
      });

    if (files.length > 0) {
      result.push({ category: cat, files });
    }
  }

  return result;
}

async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const categoryArg = args.find(a => a.startsWith('--category='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const limit = limitArg ? parseInt(limitArg, 10) : undefined;
  const modeArg = args.find(a => a.startsWith('--mode='))?.split('=')[1] as ProcessMode | undefined;
  const mode: ProcessMode = modeArg === 'silhouette' ? 'silhouette' : 'inpaint';

  // 检查 API Key
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('Error: GOOGLE_AI_API_KEY environment variable is required');
    console.error('Usage: GOOGLE_AI_API_KEY=xxx npx tsx scripts/remove-person-from-backgrounds.ts');
    process.exit(1);
  }

  console.log('=== Background Person Removal Script ===');
  console.log(`Mode: ${mode}\n`);

  // 获取待处理文件
  const toProcess = await getImagesToProcess(categoryArg);

  let totalFiles = 0;
  for (const { category, files } of toProcess) {
    console.log(`Category: ${category}`);
    console.log(`  Files to process: ${files.length}`);
    totalFiles += files.length;

    if (dryRun) {
      files.slice(0, 5).forEach(f => console.log(`    - ${f}`));
      if (files.length > 5) {
        console.log(`    ... and ${files.length - 5} more`);
      }
    }
  }

  console.log(`\nTotal files to process: ${totalFiles}`);

  if (dryRun) {
    console.log('\n[Dry run - no files will be processed]');
    return;
  }

  if (totalFiles === 0) {
    console.log('\nNo files to process. All images may already be processed.');
    return;
  }

  // 初始化 Gemini
  const ai = new GoogleGenAI({ apiKey: apiKey! });

  // 处理统计
  const results: ProcessResult[] = [];
  let processedCount = 0;

  // 处理每个分类
  for (const { category, files } of toProcess) {
    console.log(`\n--- Processing ${category} ---`);

    for (const file of files) {
      if (limit && processedCount >= limit) {
        console.log(`\nReached limit of ${limit} files.`);
        break;
      }

      const inputPath = path.join(BACKGROUNDS_DIR, category, file);
      const outputPath = path.join(OUTPUT_DIR, category, file.replace(/\.[^.]+$/, '.jpg'));

      const result = await processImage(ai, inputPath, outputPath, mode);
      results.push(result);
      processedCount++;

      // 添加延迟避免 API 限流
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (limit && processedCount >= limit) {
      break;
    }
  }

  // 输出统计
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n=== Summary ===');
  console.log(`Total processed: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed files:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${path.basename(r.inputPath)}: ${r.error}`);
    });
  }
}

main().catch(console.error);
