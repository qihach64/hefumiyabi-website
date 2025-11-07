// Virtual Try-On Prompt Templates for Gemini 2.5 Flash Image

// 原始默认提示词（从API route迁移而来）
export const DEFAULT_PROMPT = `You are a professional fashion photographer and digital artist. Replace the clothing in the first image with the complete kimono outfit from the second image.

TASK: Create a realistic full-body virtual try-on where the person from image 1 wears the complete kimono from image 2.

REQUIREMENTS:
1. Generate a FULL-BODY photograph showing the person from head to toe, FACING THE CAMERA directly
2. The person must be in a front-facing pose with their body oriented towards the viewer
3. BOTH HANDS must be clearly visible in the final image (not hidden or cropped)
4. Replace ALL clothing with the complete kimono outfit - including the top garment AND the bottom (hakama/skirt)
5. The kimono must cover the ENTIRE body appropriately:
   - Upper body: kimono top with proper collar and sleeves
   - Lower body: kimono bottom/hakama extending to ankles
   - Obi (belt) positioned correctly at waist level
   - Sleeves should show the hands naturally
6. Preserve the image1's person's face, body proportions, and background exactly as they are
7. Adjust the pose if needed to ensure front-facing orientation with visible hands
8. Make the kimono drape naturally with realistic fabric folds and movement
9. Accurately transfer the kimono's colors, patterns, and textures from the reference image
10. Match the original photo's lighting, shadows, and atmosphere
11. Ensure the complete traditional kimono styling is visible from head to toe
12. Create a seamless, photorealistic full-body result

The output must be a complete full-body photograph showing this person FACING FORWARD, wearing the entire kimono outfit with BOTH HANDS VISIBLE, in their original setting, as if professionally photographed.`.trim();

export const HALF_BODY_PROMPT = `You are a professional fashion photographer specializing in portrait photography. Replace the clothing in the first image with the kimono from the second image, focusing on upper body and face.

TASK: Create a realistic half-body (waist-up) virtual try-on photograph.

REQUIREMENTS:
1. Generate a half-body portrait from waist up, FACING THE CAMERA directly
2. BOTH HANDS should be visible if they were in the original photo
3. Replace upper body clothing with the kimono top:
   - Kimono collar and neckline properly positioned
   - Sleeves with accurate pattern and drape
   - Obi (belt) visible at waist level
4. Preserve the person's face, facial features, and expression exactly
5. Keep the original background and lighting unchanged
6. Focus on facial details and kimono pattern clarity
7. Ensure natural fabric texture and realistic shadows
8. The kimono should fit naturally on the person's body shape

The output must be a professional portrait photograph showing natural kimono wear with attention to facial details and upper body styling.`;

export const TEXTURE_FOCUS_PROMPT = `You are a professional fashion photographer and textile expert. Replace the clothing in the first image with the kimono from the second image, with special attention to fabric texture and pattern details.

TASK: Create a photorealistic full-body virtual try-on with enhanced texture rendering.

REQUIREMENTS:
1. Generate a FULL-BODY photograph with the person FACING THE CAMERA
2. Replace all clothing with the complete kimono outfit
3. TEXTURE PRIORITY - Pay special attention to:
   - Fabric weave patterns and texture (silk, cotton, brocade)
   - Embroidery details and thread work
   - Pattern clarity and color accuracy
   - Realistic light reflection on fabric (silk sheen, matte cotton)
   - Natural fabric wrinkles and folds
4. Preserve the person's face and body proportions
5. Maintain original lighting and shadows
6. Ensure the kimono drapes naturally with weight-appropriate folds
7. Capture the unique characteristics of kimono fabric (stiffness, flow, texture)
8. BOTH HANDS visible with natural positioning

The output must showcase the kimono's textile beauty with photorealistic fabric rendering while maintaining overall composition quality.`;

export const FACE_FOCUS_PROMPT = `You are a professional portrait photographer. Replace the clothing in the first image with the kimono from the second image, prioritizing facial clarity and natural expression.

TASK: Create a virtual try-on photograph with emphasis on facial features and natural expression.

REQUIREMENTS:
1. Generate a full-body or half-body photograph FACING THE CAMERA
2. FACE PRIORITY - Ensure:
   - Sharp facial features (eyes, nose, mouth)
   - Natural skin tone and texture
   - Original facial expression preserved
   - Hair styling maintained exactly as original
   - No distortion or artificial smoothing
3. Replace clothing with the complete kimono outfit
4. Keep the kimono styling natural and realistic
5. Maintain original background and lighting
6. Ensure natural color balance between face and kimono
7. BOTH HANDS visible if showing full body

The output must be a natural portrait where the person's face is clear and expressive, wearing the kimono as if it were their own clothing in a professional photoshoot.`;

export const SIMPLE_PROMPT = `Replace the person's clothing in image 1 with the kimono from image 2. Keep the person's face, body shape, and background unchanged. Make it look natural and realistic.`;

export interface PromptPreset {
  name: string;
  prompt: string;
  description: string;
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    name: '默认（全身照）',
    prompt: DEFAULT_PROMPT,
    description: '完整全身试穿，强调正面姿势和双手可见性',
  },
  {
    name: '半身照优化',
    prompt: HALF_BODY_PROMPT,
    description: '腰部以上肖像，突出面部和上半身细节',
  },
  {
    name: '强调纹理',
    prompt: TEXTURE_FOCUS_PROMPT,
    description: '注重和服面料质感、刺绣和图案细节',
  },
  {
    name: '强调面部',
    prompt: FACE_FOCUS_PROMPT,
    description: '保持面部清晰自然，适合人像摄影',
  },
  {
    name: '简化版',
    prompt: SIMPLE_PROMPT,
    description: '简短提示词，快速生成（可能质量较低）',
  },
];
