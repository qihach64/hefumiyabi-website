/**
 * 批量提取和服脚本 - 从穿着照中提取纯和服图片
 *
 * 使用 Gemini API 从含人物的照片中提取和服，生成纯白背景的和服产品图
 *
 * 使用方法:
 * GOOGLE_AI_API_KEY=xxx npx tsx scripts/extract-kimono-from-photos.ts
 *
 * 可选参数:
 * --category=girl|boy|kid  只处理指定分类
 * --dry-run               仅列出待处理文件，不实际执行
 * --limit=N               限制处理数量
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// 配置
const BACKGROUNDS_DIR = path.join(__dirname, '../../../apps/virtual-tryon-demo/public/backgrounds');
const OUTPUT_DIR = path.join(__dirname, '../../../apps/virtual-tryon-demo/public/kimonos');

// 源分类 → 目标分类映射
const CATEGORY_MAP: Record<string, string> = {
  'girl': 'female',
  'boy': 'male',
  'kid': 'child',
};

const SOURCE_CATEGORIES = ['girl', 'boy', 'kid'] as const;

// Gemini 提示词 - 提取和服（强调保留原始细节）
const EXTRACT_KIMONO_PROMPT = `CRITICAL TASK: Extract the kimono garment from this photo and place it on a pure white background.

MOST IMPORTANT - PRESERVE ORIGINAL DETAILS:
- You MUST copy the EXACT patterns, colors, and textures from the original kimono
- Do NOT re-draw, simplify, or reinterpret the patterns - copy them PIXEL-PERFECTLY
- Every flower, every line, every detail must match the original EXACTLY
- The colors must be IDENTICAL to the source image - no color shifts or modifications
- Preserve the exact fabric texture, sheen, and material appearance

EXTRACTION REQUIREMENTS:
1. REMOVE the person completely - no face, body, hands, feet, or skin visible
2. Extract the COMPLETE kimono garment including: obi belt, all accessories, all layers
3. Background must be PURE WHITE (#FFFFFF) with no shadows or gradients
4. Display as if on an invisible mannequin - maintain natural 3D shape and draping
5. Kimono should be centered and fill 80-90% of the frame
6. Output must be HIGHEST QUALITY with crisp, sharp edges

QUALITY CHECK:
- If you compare the extracted kimono to the original, the patterns should be INDISTINGUISHABLE
- This is for product photography - accuracy is critical
- Any simplification or artistic interpretation of the patterns is UNACCEPTABLE

Output: Professional e-commerce product photo of ONLY the kimono on white background.`;

interface ProcessResult {
  success: boolean;
  inputPath: string;
  outputPath?: string;
  error?: string;
}

async function processImage(
  ai: GoogleGenAI,
  inputPath: string,
  outputPath: string
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

    console.log(`  Processing: ${path.basename(inputPath)}`);

    // 调用 Gemini API 进行图像生成
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
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
              text: EXTRACT_KIMONO_PROMPT
            }
          ]
        }
      ],
      config: {
        responseModalities: ['image', 'text'],
        // @ts-ignore - Gemini 图像生成特定参数
        imageGenerationConfig: {
          outputMimeType: 'image/png', // PNG 保留透明度
          imageSize: '2K', // 高分辨率输出 (2048x2048)
          aspectRatio: '3:4', // 适合和服的纵向比例
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

async function getImagesToProcess(category?: string): Promise<{ sourceCategory: string; targetCategory: string; files: string[] }[]> {
  const result: { sourceCategory: string; targetCategory: string; files: string[] }[] = [];

  const categoriesToProcess = category
    ? [category as typeof SOURCE_CATEGORIES[number]]
    : SOURCE_CATEGORIES;

  for (const sourceCat of categoriesToProcess) {
    const targetCat = CATEGORY_MAP[sourceCat];
    const sourceDir = path.join(BACKGROUNDS_DIR, sourceCat);
    const outputCategoryDir = path.join(OUTPUT_DIR, targetCat);

    if (!fs.existsSync(sourceDir)) {
      console.warn(`Warning: Source directory not found: ${sourceDir}`);
      continue;
    }

    const files = fs.readdirSync(sourceDir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .filter(f => {
        // 跳过已处理的文件
        const baseName = path.basename(f, path.extname(f));
        const outputPath = path.join(outputCategoryDir, `${baseName}.png`);
        return !fs.existsSync(outputPath);
      });

    if (files.length > 0) {
      result.push({ sourceCategory: sourceCat, targetCategory: targetCat, files });
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

  // 检查 API Key
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey && !dryRun) {
    console.error('Error: GOOGLE_AI_API_KEY environment variable is required');
    console.error('Usage: GOOGLE_AI_API_KEY=xxx npx tsx scripts/extract-kimono-from-photos.ts');
    process.exit(1);
  }

  console.log('=== Kimono Extraction Script ===');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  // 获取待处理文件
  const toProcess = await getImagesToProcess(categoryArg);

  let totalFiles = 0;
  for (const { sourceCategory, targetCategory, files } of toProcess) {
    console.log(`Category: ${sourceCategory} → ${targetCategory}`);
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
  for (const { sourceCategory, targetCategory, files } of toProcess) {
    console.log(`\n--- Processing ${sourceCategory} → ${targetCategory} ---`);

    for (const file of files) {
      if (limit && processedCount >= limit) {
        console.log(`\nReached limit of ${limit} files.`);
        break;
      }

      const inputPath = path.join(BACKGROUNDS_DIR, sourceCategory, file);
      const baseName = path.basename(file, path.extname(file));
      const outputPath = path.join(OUTPUT_DIR, targetCategory, `${baseName}.png`);

      const result = await processImage(ai, inputPath, outputPath);
      results.push(result);
      processedCount++;

      // 添加延迟避免 API 限流（3秒，因为图像生成更耗资源）
      await new Promise(resolve => setTimeout(resolve, 3000));
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

  // 输出映射信息
  if (successful > 0) {
    console.log('\n=== Generated Mappings ===');
    console.log('Add these to kimonoLibrary.ts:');
    results.filter(r => r.success).slice(0, 3).forEach(r => {
      const relativePath = r.outputPath!.replace(/.*\/public/, '');
      console.log(`  cleanImageUrl: '${relativePath}',`);
    });
    if (successful > 3) {
      console.log(`  ... and ${successful - 3} more`);
    }
  }
}

main().catch(console.error);
