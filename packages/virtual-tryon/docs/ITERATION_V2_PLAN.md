# 🎎 AI 和服换装模块 V2.0 迭代开发方案

> 文档版本：v2.0
> 创建日期：2024-12-08
> 模块：@kimono-one/virtual-tryon

---

## 目录

- [一、需求概述](#一需求概述)
- [二、技术架构变更](#二技术架构变更)
- [三、功能详细设计](#三功能详细设计)
- [四、数据流程图](#四数据流程图)
- [五、Prompt 策略重构](#五prompt-策略重构)
- [六、开发任务分解](#六开发任务分解)
- [七、文件变更清单](#七文件变更清单)
- [八、测试方案](#八测试方案)
- [九、风险与应对](#九风险与应对)

---

## 一、需求概述

### 1.1 核心需求列表

| 序号 | 需求 | 优先级 | 复杂度 |
|------|------|--------|--------|
| 1 | AI模型升级至 `gemini-3-pro-image-preview` | 🔴 P0 | 低 |
| 2 | 简化Prompt模板（5个→1个） | 🔴 P0 | 低 |
| 3 | 新增背景库功能（预设背景+姿势参考） | 🔴 P0 | 高 |
| 4 | 姿势/表情迁移（与参考图一致） | 🔴 P0 | 高 |
| 5 | 输入图改为半身照（AI补全身体） | 🔴 P0 | 中 |

### 1.2 产品流程对比

#### 当前流程（V1）
```
用户上传全身照 → 选择和服 → 选择Prompt模板 → 生成 → 输出（保留原背景）
```

#### 新流程（V2）
```
用户上传半身照 → 选择和服 → 选择背景&姿势参考图 → 生成 → 输出（新背景+参考姿势）
```

### 1.3 核心变化

| 维度 | V1 现状 | V2 目标 |
|------|---------|---------|
| **输入图片** | 全身照（头到脚） | 半身照（重点面部） |
| **AI模型** | gemini-2.5-flash-image | gemini-3-pro-image-preview |
| **图片输入数量** | 2张（人物+和服） | 3张（面部+和服+背景参考） |
| **背景来源** | 保留用户原图背景 | 预设背景库（可选） |
| **姿势控制** | 无（随机） | 与参考图一致 |
| **表情控制** | 保留原图表情 | 与参考图一致 |
| **Prompt模板** | 5个可选 | 1个统一模板 |
| **身体补全** | 无需（全身输入） | AI智能补全 |

---

## 二、技术架构变更

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          VirtualTryOnApp V2                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────────┐ │
│  │  PhotoUpload │   │KimonoSelector│   │   BackgroundPoseSelector     │ │
│  │  (半身照)    │   │   (和服)     │   │   (背景+姿势参考)            │ │
│  │              │   │              │   │                              │ │
│  │ ┌──────────┐ │   │ ┌──────────┐ │   │ ┌────────┐ ┌────────┐       │ │
│  │ │ 面部照片 │ │   │ │ 和服图片 │ │   │ │女生背景│ │男生背景│ ...   │ │
│  │ └──────────┘ │   │ └──────────┘ │   │ └────────┘ └────────┘       │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┬───────────────┘ │
│         │                  │                          │                  │
│         └──────────────────┼──────────────────────────┘                  │
│                            │                                             │
│                            ▼                                             │
│              ┌─────────────────────────────┐                             │
│              │     generateTryOnV2()       │                             │
│              │  ┌───────────────────────┐  │                             │
│              │  │ 3张图片 + 统一Prompt   │  │                             │
│              │  │ • 用户面部照          │  │                             │
│              │  │ • 和服图片            │  │                             │
│              │  │ • 背景参考图          │  │                             │
│              │  └───────────────────────┘  │                             │
│              │              │              │                             │
│              │              ▼              │                             │
│              │  ┌───────────────────────┐  │                             │
│              │  │  Gemini 3 Pro Image   │  │                             │
│              │  │  (gemini-3-pro-image- │  │                             │
│              │  │   preview)            │  │                             │
│              │  └───────────────────────┘  │                             │
│              └─────────────────────────────┘                             │
│                            │                                             │
│                            ▼                                             │
│              ┌─────────────────────────────┐                             │
│              │       TryOnCanvas           │                             │
│              │   (结果展示+下载分享)        │                             │
│              └─────────────────────────────┘                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 新增模块说明

#### 2.2.1 BackgroundPoseSelector（背景姿势选择器）

**功能**：
- 展示预设的背景参考图库
- 分类浏览：女生、男生、儿童
- 预览背景效果和对应姿势
- 选择后传递背景参考图URL

**数据来源**：
```
/background&pose/
├── girl background/     # 女生背景（~100张）
├── boy background/      # 男生背景（~30张）
└── kid background/      # 儿童背景（~20张）
```

#### 2.2.2 图像预处理流程

```typescript
// 新增：背景移除功能（仅对参考图处理）
async function processReferenceImage(imageUrl: string): Promise<{
  originalImage: string;      // 原始参考图（用于姿势/表情参考）
  backgroundOnly: string;     // 移除人物后的纯背景
}>;
```

### 2.3 API 接口变更

#### 当前接口 (V1)
```typescript
interface TryOnRequest {
  personImageBase64: string;    // 用户全身照
  kimonoImageUrl: string;       // 和服图片
  customPrompt?: string;        // 自定义Prompt
}
```

#### 新接口 (V2)
```typescript
interface TryOnRequestV2 {
  // 用户输入
  faceImageBase64: string;        // 用户半身照（重点面部）
  kimonoImageUrl: string;         // 和服图片

  // 背景参考（可选，不选则使用用户原背景）
  backgroundPoseRef?: {
    imageUrl: string;             // 参考图URL
    category: 'girl' | 'boy' | 'kid';
  };

  // 生成选项
  options?: {
    preserveExpression?: boolean; // 保留用户原表情（默认false，使用参考图表情）
    bodyType?: 'auto' | 'slim' | 'normal' | 'curvy'; // 身体补全体型
  };
}
```

---

## 三、功能详细设计

### 3.1 模型升级

#### 变更点

| 项目 | 当前 | 目标 |
|------|------|------|
| 模型ID | `gemini-2.5-flash-image` | `gemini-3-pro-image-preview` |
| 配置文件 | `api/generator.ts:108` | 同文件，更新模型名称 |
| 调试信息 | `api/generator.ts:137` | 同步更新 |

#### 代码变更

```typescript
// api/generator.ts

// 变更前
const result = await ai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents,
});

// 变更后
const result = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents,
});

// 调试信息也需要更新
const debugInfo: DebugInfo = {
  model: 'gemini-3-pro-image-preview',  // 更新
  // ...其他字段
};
```

---

### 3.2 Prompt 模板简化

#### 当前 Prompt 模板（5个）

| 模板名称 | 用途 | V2处理 |
|----------|------|--------|
| DEFAULT_PROMPT | 全身照 | 🔄 重构为统一模板 |
| HALF_BODY_PROMPT | 半身照 | ❌ 删除 |
| TEXTURE_FOCUS_PROMPT | 强调纹理 | ❌ 删除 |
| FACE_FOCUS_PROMPT | 强调面部 | ❌ 删除 |
| SIMPLE_PROMPT | 简化版 | ❌ 删除 |

#### V2 统一 Prompt 模板

```typescript
// lib/prompts.ts - 完全重写

export const UNIFIED_TRYON_PROMPT = `You are a professional fashion photographer and AI image synthesis expert.

## TASK
Create a photorealistic full-body image combining:
- **Image 1 (Face Source)**: Extract the person's FACE, facial features, skin tone, and hair
- **Image 2 (Kimono Source)**: The kimono outfit to dress the person in
- **Image 3 (Pose & Background Reference)**: Use this image's POSE, BODY POSITION, EXPRESSION, and BACKGROUND

## CRITICAL REQUIREMENTS

### Face Transfer (from Image 1)
- Extract and preserve the exact facial features: eyes, nose, mouth, eyebrows
- Maintain the person's skin tone and texture
- Keep the hairstyle or adapt it naturally to match the pose
- The face should be the ONLY element taken from Image 1

### Body Generation
- Generate a complete full-body figure from head to toe
- The body proportions should be natural and realistic
- Match the EXACT POSE from Image 3 (arm positions, leg stance, body angle, head tilt)
- Match the EXACT EXPRESSION from Image 3 (smile, serious, playful, etc.)
- The generated body should naturally support the transferred face

### Kimono Application (from Image 2)
- Dress the generated body in the complete kimono outfit from Image 2
- Preserve all kimono details: patterns, colors, textures, obi (belt)
- The kimono should drape naturally following the pose
- Include all traditional elements: collar, sleeves, hem
- Ensure proper fit without stretching or distorting the pattern

### Background (from Image 3)
- Use the EXACT background scene from Image 3
- Remove the original person from Image 3, keep only the background
- Place the newly generated figure in the same position
- Match lighting and shadows to integrate naturally with the background

## OUTPUT SPECIFICATIONS
- Generate a high-quality, photorealistic full-body photograph
- Resolution: Maintain source image quality
- The final image should look like a professional kimono photoshoot
- No visible AI artifacts, seams, or unnatural elements

## IMPORTANT
- The face MUST come from Image 1
- The kimono MUST come from Image 2
- The pose, expression, and background MUST come from Image 3
- Do NOT invent new poses or backgrounds
- Do NOT change the kimono design`;
```

---

### 3.3 背景库功能设计

#### 3.3.1 背景库数据结构

```typescript
// types/background.ts - 新增文件

export type BackgroundCategory = 'girl' | 'boy' | 'kid';

export interface BackgroundPoseItem {
  id: string;                    // 唯一标识
  name: string;                  // 显示名称（可选）
  category: BackgroundCategory;  // 分类
  imageUrl: string;              // 原图URL（包含人物）
  thumbnailUrl?: string;         // 缩略图URL
  poseDescription?: string;      // 姿势描述（如"站姿-双手合十"）
  sceneDescription?: string;     // 场景描述（如"神社�的鸟居前"）
}

export interface BackgroundLibrary {
  girl: BackgroundPoseItem[];
  boy: BackgroundPoseItem[];
  kid: BackgroundPoseItem[];
}
```

#### 3.3.2 背景选择器组件

```typescript
// components/BackgroundPoseSelector.tsx - 新增文件

interface BackgroundPoseSelectorProps {
  selected: BackgroundPoseItem | null;
  onSelect: (item: BackgroundPoseItem | null) => void;
  category?: BackgroundCategory;  // 筛选分类
  ImageComponent?: React.ComponentType<ImageProps>;
}

export function BackgroundPoseSelector({
  selected,
  onSelect,
  category,
  ImageComponent,
}: BackgroundPoseSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<BackgroundCategory>(category || 'girl');
  const [useOriginalBackground, setUseOriginalBackground] = useState(true);

  // 背景库数据加载
  const backgrounds = useBackgroundLibrary();

  return (
    <div className="space-y-4">
      {/* 开关：使用原背景 vs 选择预设背景 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">背景与姿势</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useOriginalBackground}
            onChange={(e) => {
              setUseOriginalBackground(e.target.checked);
              if (e.target.checked) onSelect(null);
            }}
          />
          使用我的照片背景
        </label>
      </div>

      {/* 预设背景库 */}
      {!useOriginalBackground && (
        <>
          {/* 分类标签 */}
          <div className="flex gap-2">
            {(['girl', 'boy', 'kid'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm ${
                  activeCategory === cat
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat === 'girl' ? '女生' : cat === 'boy' ? '男生' : '儿童'}
              </button>
            ))}
          </div>

          {/* 背景网格 */}
          <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
            {backgrounds[activeCategory].map((bg) => (
              <BackgroundCard
                key={bg.id}
                item={bg}
                selected={selected?.id === bg.id}
                onClick={() => onSelect(bg)}
                ImageComponent={ImageComponent}
              />
            ))}
          </div>
        </>
      )}

      {/* 选中状态预览 */}
      {selected && (
        <div className="p-3 bg-pink-50 rounded-lg">
          <p className="text-sm text-pink-700">
            已选择背景：{selected.sceneDescription || '预设背景'}
          </p>
          <p className="text-xs text-pink-500 mt-1">
            生成的图片将使用此背景和姿势
          </p>
        </div>
      )}
    </div>
  );
}
```

#### 3.3.3 背景库数据加载

```typescript
// lib/backgroundLibrary.ts - 新增文件

import type { BackgroundLibrary, BackgroundPoseItem } from '../types/background';

// 静态背景库配置（实际部署时可改为API加载）
export const BACKGROUND_LIBRARY: BackgroundLibrary = {
  girl: [
    {
      id: 'girl-001',
      name: '神社祈福',
      category: 'girl',
      imageUrl: '/backgrounds/girl/DSC01414.jpg',
      thumbnailUrl: '/backgrounds/girl/thumbs/DSC01414.jpg',
      poseDescription: '双手合十祈福',
      sceneDescription: '神社鸟居前',
    },
    {
      id: 'girl-002',
      name: '樱花漫步',
      category: 'girl',
      imageUrl: '/backgrounds/girl/DSC04598.jpg',
      thumbnailUrl: '/backgrounds/girl/thumbs/DSC04598.jpg',
      poseDescription: '侧身回眸',
      sceneDescription: '樱花树下小径',
    },
    // ... 更多背景
  ],
  boy: [
    {
      id: 'boy-001',
      name: '庭院漫步',
      category: 'boy',
      imageUrl: '/backgrounds/boy/DSC05648.jpg',
      thumbnailUrl: '/backgrounds/boy/thumbs/DSC05648.jpg',
      poseDescription: '站立正面',
      sceneDescription: '日式庭院',
    },
    // ... 更多背景
  ],
  kid: [
    {
      id: 'kid-001',
      name: '七五三祝福',
      category: 'kid',
      imageUrl: '/backgrounds/kid/DSC00305.jpg',
      thumbnailUrl: '/backgrounds/kid/thumbs/DSC00305.jpg',
      poseDescription: '开心跳跃',
      sceneDescription: '神社台阶',
    },
    // ... 更多背景
  ],
};

// 背景图片基础路径
export const BACKGROUND_BASE_PATH = '/backgrounds';

// 获取完整背景库
export function getBackgroundLibrary(): BackgroundLibrary {
  return BACKGROUND_LIBRARY;
}

// 按分类获取
export function getBackgroundsByCategory(category: BackgroundCategory): BackgroundPoseItem[] {
  return BACKGROUND_LIBRARY[category] || [];
}

// 按ID获取
export function getBackgroundById(id: string): BackgroundPoseItem | null {
  const all = [...BACKGROUND_LIBRARY.girl, ...BACKGROUND_LIBRARY.boy, ...BACKGROUND_LIBRARY.kid];
  return all.find(bg => bg.id === id) || null;
}
```

---

### 3.4 姿势/表情迁移设计

#### 核心原理

用户选择背景参考图后，AI需要：
1. **提取背景**：移除参考图中的人物，保留纯背景
2. **提取姿势**：识别参考图中人物的身体姿势
3. **提取表情**：识别参考图中人物的面部表情
4. **合成**：将用户面部 + 参考姿势/表情 + 和服 + 背景 合成为新图

#### Prompt 中的姿势/表情指令

```typescript
// 在 UNIFIED_TRYON_PROMPT 中已包含：

/*
### Body Generation
- Match the EXACT POSE from Image 3 (arm positions, leg stance, body angle, head tilt)
- Match the EXACT EXPRESSION from Image 3 (smile, serious, playful, etc.)
*/
```

#### 可选：保留用户原表情

```typescript
// 当 options.preserveExpression = true 时，使用变体Prompt

export const PRESERVE_EXPRESSION_ADDON = `
## EXPRESSION OVERRIDE
- IGNORE the expression from Image 3
- Instead, match the facial expression from Image 1
- Keep the person's original mood and emotion
- Only use Image 3 for pose and background reference
`;
```

---

### 3.5 半身照输入与身体补全

#### 设计理念

**为什么改用半身照？**

| 问题 | 全身照（V1） | 半身照（V2） |
|------|-------------|-------------|
| 面部清晰度 | 面部占比小，细节损失 | 面部占比大，细节清晰 |
| 用户拍摄难度 | 需要全身镜/他人帮助 | 自拍即可 |
| AI理解难度 | 需同时处理面部+身体+背景 | 专注面部特征提取 |
| 姿势控制 | 受限于原图姿势 | 完全由参考图控制 |

#### 身体补全策略

```typescript
// 在 UNIFIED_TRYON_PROMPT 中已包含：

/*
### Body Generation
- Generate a complete full-body figure from head to toe
- The body proportions should be natural and realistic
- The generated body should naturally support the transferred face
*/
```

#### 可选：体型控制

```typescript
// 当需要控制生成的体型时

export const BODY_TYPE_PROMPTS: Record<string, string> = {
  auto: '', // 默认，AI自动判断
  slim: 'Generate a slim, slender body type.',
  normal: 'Generate a normal, average body type.',
  curvy: 'Generate a curvy, fuller body type.',
};
```

---

## 四、数据流程图

### 4.1 完整生成流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户操作流程                                    │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │   用户访问   │
     │  试穿页面    │
     └──────┬───────┘
            │
            ▼
     ┌──────────────┐         ┌──────────────────────────────────────────┐
     │  Step 1      │         │  提示：请上传清晰的半身照               │
     │  上传半身照  │────────▶│  • 面部清晰可见                         │
     │              │         │  • 光线充足                             │
     │              │         │  • 正面或3/4侧面                        │
     └──────┬───────┘         └──────────────────────────────────────────┘
            │
            ▼
     ┌──────────────┐         ┌──────────────────────────────────────────┐
     │  Step 2      │         │  和服选择：                              │
     │  选择和服    │────────▶│  • 预设和服库                           │
     │              │         │  • 或上传自定义和服                      │
     └──────┬───────┘         └──────────────────────────────────────────┘
            │
            ▼
     ┌──────────────┐         ┌──────────────────────────────────────────┐
     │  Step 3      │         │  背景选择：                              │
     │  选择背景    │────────▶│  ☐ 使用我的照片背景（默认）              │
     │  和姿势参考  │         │  ☑ 使用预设背景（女生/男生/儿童）        │
     └──────┬───────┘         └──────────────────────────────────────────┘
            │
            ▼
     ┌──────────────┐
     │  Step 4      │
     │  点击生成    │
     └──────┬───────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              系统处理流程                                    │
└─────────────────────────────────────────────────────────────────────────────┘

            │
            ▼
     ┌─────────────────────────────────────────────────────┐
     │                 图片预处理                          │
     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
     │  │ 半身照压缩  │  │ 和服图获取  │  │背景参考获取 │ │
     │  │ (保证面部   │  │ (URL→base64)│  │(原图，含人物)│ │
     │  │  清晰度)    │  │             │  │             │ │
     │  └─────────────┘  └─────────────┘  └─────────────┘ │
     └──────────────────────────┬──────────────────────────┘
                                │
                                ▼
     ┌─────────────────────────────────────────────────────┐
     │              构建 API 请求                          │
     │  {                                                  │
     │    model: "gemini-3-pro-image-preview",            │
     │    contents: [                                      │
     │      { image: 用户半身照 },        // 面部来源     │
     │      { image: 和服图片 },          // 服装来源     │
     │      { image: 背景参考图 },        // 姿势+背景    │
     │      { text: UNIFIED_TRYON_PROMPT }                │
     │    ]                                                │
     │  }                                                  │
     └──────────────────────────┬──────────────────────────┘
                                │
                                ▼
     ┌─────────────────────────────────────────────────────┐
     │              Gemini 3 Pro Image API                 │
     │                                                     │
     │  AI 执行：                                          │
     │  1. 从半身照提取面部特征                            │
     │  2. 识别参考图的姿势和表情                          │
     │  3. 生成完整身体（头到脚）                          │
     │  4. 穿上和服                                        │
     │  5. 移除参考图人物，保留背景                        │
     │  6. 将新人物放入背景                                │
     │  7. 匹配光影，自然融合                              │
     │                                                     │
     └──────────────────────────┬──────────────────────────┘
                                │
                                ▼
     ┌─────────────────────────────────────────────────────┐
     │              结果后处理                             │
     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
     │  │ 质量检查    │  │ 上传Supabase│  │ 返回结果    │ │
     │  │ (可选)      │  │ (可选)      │  │             │ │
     │  └─────────────┘  └─────────────┘  └─────────────┘ │
     └──────────────────────────┬──────────────────────────┘
                                │
                                ▼
     ┌──────────────┐
     │   显示结果   │
     │  • 原图对比  │
     │  • 下载/分享 │
     └──────────────┘
```

### 4.2 API 调用时序图

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  Client  │     │   API    │     │ generateTryOn│     │ Gemini API  │
└────┬─────┘     └────┬─────┘     └──────┬───────┘     └──────┬──────┘
     │                │                   │                   │
     │ POST /api/     │                   │                   │
     │ virtual-tryon  │                   │                   │
     │ ───────────────>                   │                   │
     │                │                   │                   │
     │                │ generateTryOnV2() │                   │
     │                │ ──────────────────>                   │
     │                │                   │                   │
     │                │                   │ 验证输入          │
     │                │                   │ ─────             │
     │                │                   │                   │
     │                │                   │ 构建 contents     │
     │                │                   │ [img1, img2, img3,│
     │                │                   │  prompt]          │
     │                │                   │                   │
     │                │                   │ generateContent() │
     │                │                   │ ──────────────────>
     │                │                   │                   │
     │                │                   │   (15-30秒处理)   │
     │                │                   │                   │
     │                │                   │ <──────────────────
     │                │                   │   返回生成图片    │
     │                │                   │                   │
     │                │                   │ 上传 Supabase     │
     │                │                   │ ─────             │
     │                │                   │                   │
     │                │ <──────────────────                   │
     │                │   返回 result     │                   │
     │                │                   │                   │
     │ <───────────────                   │                   │
     │   JSON Response│                   │                   │
     │                │                   │                   │
```

---

## 五、Prompt 策略重构

### 5.1 新 Prompt 架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                     UNIFIED_TRYON_PROMPT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ROLE: Professional fashion photographer & AI expert        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  TASK: Combine 3 images into 1 photorealistic result        │   │
│  │  • Image 1 → Face                                           │   │
│  │  • Image 2 → Kimono                                         │   │
│  │  • Image 3 → Pose + Background                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  REQUIREMENTS (5 sections):                                  │   │
│  │                                                              │   │
│  │  1. Face Transfer      - 面部特征精准迁移                    │   │
│  │  2. Body Generation    - 身体姿势补全                        │   │
│  │  3. Kimono Application - 和服穿着效果                        │   │
│  │  4. Background         - 背景融合                            │   │
│  │  5. Output Specs       - 输出规格                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  IMPORTANT: Hard constraints                                 │   │
│  │  - Face MUST from Image 1                                   │   │
│  │  - Kimono MUST from Image 2                                 │   │
│  │  - Pose & BG MUST from Image 3                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 完整 Prompt 模板（最终版）

```typescript
// lib/prompts.ts - 完整重写

/**
 * V2 统一 Prompt 模板
 *
 * 设计原则：
 * 1. 明确三张图片的职责划分
 * 2. 详细的面部迁移指令
 * 3. 姿势/表情迁移指令
 * 4. 身体生成和补全指令
 * 5. 背景融合指令
 */
export const UNIFIED_TRYON_PROMPT = `You are a professional fashion photographer and AI image synthesis expert specializing in kimono photography.

## TASK
Create a photorealistic full-body kimono photograph by combining elements from three source images:
- **Image 1 (FACE SOURCE)**: The person's face to use
- **Image 2 (KIMONO SOURCE)**: The kimono outfit to wear
- **Image 3 (POSE & BACKGROUND SOURCE)**: The pose, expression, and background scene to replicate

## DETAILED REQUIREMENTS

### 1. FACE TRANSFER (from Image 1)
Extract and preserve with high fidelity:
- Exact facial structure: eyes, nose, mouth, chin, cheekbones
- Skin tone, texture, and complexion
- Eyebrows shape and color
- Any facial features like moles, freckles
- Hair color (adapt hairstyle to match the pose naturally)

Critical: The face must be ONLY from Image 1. Do not blend with Image 3's face.

### 2. BODY GENERATION
Generate a complete human body from head to toe:
- Natural body proportions appropriate for the face
- Smooth neck transition connecting face to body
- Complete arms with visible hands and fingers
- Full legs down to feet
- Natural posture without stiffness

Body pose requirements (from Image 3):
- Copy the EXACT arm positions
- Copy the EXACT leg stance
- Copy the EXACT body angle and tilt
- Copy the EXACT head position and angle
- The body should mirror Image 3's pose precisely

### 3. EXPRESSION TRANSFER (from Image 3)
Apply the facial expression from the reference:
- Match the smile/serious/playful mood
- Match the eye direction and gaze
- Match the mouth position (open/closed/smiling)
- The transferred face should wear Image 3's expression

### 4. KIMONO APPLICATION (from Image 2)
Dress the generated body in the kimono:
- Preserve exact colors and patterns from Image 2
- Proper kimono structure:
  - Collar (eri) layered correctly
  - Left side over right (for living persons)
  - Obi (belt) positioned at waist
  - Sleeves (sode) with proper length
  - Hem reaching to ankles
- Natural fabric draping based on the pose
- Realistic wrinkles and folds where body bends
- Maintain pattern continuity across seams

### 5. BACKGROUND INTEGRATION (from Image 3)
Recreate the scene from Image 3:
- Remove the original person from Image 3
- Keep the entire background: buildings, nature, props
- Place the newly generated figure in the same position
- Match the lighting direction and intensity
- Add appropriate shadows under the figure
- Ensure color harmony between subject and background

## OUTPUT SPECIFICATIONS
- Full-body photograph, head to toe visible
- High resolution, sharp details
- Professional photography quality
- No visible AI artifacts or seams
- Natural skin tones and fabric colors
- Proper depth of field matching the scene

## STRICT RULES
1. Face identity ONLY from Image 1 - non-negotiable
2. Kimono design ONLY from Image 2 - do not modify patterns
3. Pose and background ONLY from Image 3 - do not invent new poses
4. Generate complete body - no cropping at knees or elbows
5. Both hands must be visible with all fingers
6. The result should look like a real photograph, not digital art`;

/**
 * 当用户选择保留原表情时的附加指令
 */
export const PRESERVE_USER_EXPRESSION_ADDON = `

## EXPRESSION OVERRIDE
Ignore the expression from Image 3. Instead:
- Keep the facial expression from Image 1
- Preserve the person's original mood and emotion
- Only use Image 3 for body pose and background
- The face should show the same expression as in Image 1`;

/**
 * 当用户选择使用原背景（不使用参考图）时的简化 Prompt
 */
export const ORIGINAL_BACKGROUND_PROMPT = `You are a professional fashion photographer and digital artist.

## TASK
Replace the clothing in Image 1 with the kimono from Image 2, keeping the original background.

## REQUIREMENTS

### Person (from Image 1)
- Preserve the exact face, expression, and body pose
- Keep the original background unchanged
- Maintain the lighting and atmosphere

### Kimono (from Image 2)
- Dress the person in the complete kimono outfit
- Preserve all patterns, colors, and details
- Natural draping following the body pose
- Include collar, obi, sleeves, and proper hem length

### Output
- Photorealistic result
- Seamless integration of kimono onto the person
- No visible editing artifacts
- Professional quality suitable for print`;
```

---

## 六、开发任务分解

### 6.1 任务总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          V2 迭代开发任务                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1: 基础升级 (2天)                                                    │
│  ├── T1.1 模型升级                                                         │
│  └── T1.2 Prompt 简化                                                      │
│                                                                             │
│  Phase 2: 背景库功能 (3天)                                                  │
│  ├── T2.1 背景数据结构设计                                                 │
│  ├── T2.2 背景选择器组件                                                   │
│  ├── T2.3 背景图片资源处理                                                 │
│  └── T2.4 背景库数据配置                                                   │
│                                                                             │
│  Phase 3: 生成逻辑重构 (3天)                                                │
│  ├── T3.1 API 接口升级                                                     │
│  ├── T3.2 三图输入处理                                                     │
│  ├── T3.3 新 Prompt 集成                                                   │
│  └── T3.4 结果处理优化                                                     │
│                                                                             │
│  Phase 4: UI 整合 (2天)                                                     │
│  ├── T4.1 VirtualTryOnApp 重构                                             │
│  ├── T4.2 用户引导优化                                                     │
│  └── T4.3 半身照上传提示                                                   │
│                                                                             │
│  Phase 5: 测试与优化 (2天)                                                  │
│  ├── T5.1 功能测试                                                         │
│  ├── T5.2 效果调优                                                         │
│  └── T5.3 文档更新                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 详细任务列表

#### Phase 1: 基础升级 (2天)

| ID | 任务 | 描述 | 工作量 |
|----|------|------|--------|
| T1.1 | 模型升级 | 将 `gemini-2.5-flash-image` 改为 `gemini-3-pro-image-preview` | 0.5天 |
| T1.2 | Prompt 简化 | 删除多余模板，保留并优化为统一模板 | 0.5天 |
| T1.3 | PromptEditor 简化 | 移除模板选择下拉框，改为只读展示 | 0.5天 |
| T1.4 | 类型更新 | 更新 `DebugInfo` 中的模型名称 | 0.5天 |

#### Phase 2: 背景库功能 (3天)

| ID | 任务 | 描述 | 工作量 |
|----|------|------|--------|
| T2.1 | 类型定义 | 创建 `types/background.ts`，定义背景相关类型 | 0.5天 |
| T2.2 | 背景选择器 | 创建 `BackgroundPoseSelector` 组件 | 1天 |
| T2.3 | 背景库配置 | 创建 `lib/backgroundLibrary.ts`，配置背景数据 | 0.5天 |
| T2.4 | 图片资源处理 | 将 `background&pose` 文件夹图片处理为web可用格式 | 0.5天 |
| T2.5 | 缩略图生成 | 为背景图生成缩略图（可选，提升加载速度） | 0.5天 |

#### Phase 3: 生成逻辑重构 (3天)

| ID | 任务 | 描述 | 工作量 |
|----|------|------|--------|
| T3.1 | 接口升级 | 更新 `TryOnRequest` 类型，增加背景参考字段 | 0.5天 |
| T3.2 | 生成函数重构 | 重写 `generateTryOn()`，支持三图输入 | 1天 |
| T3.3 | Prompt 选择逻辑 | 根据是否选择背景，使用不同Prompt | 0.5天 |
| T3.4 | 错误处理更新 | 增加背景相关错误类型 | 0.5天 |
| T3.5 | API Handler 更新 | 更新 `createNextHandler()` | 0.5天 |

#### Phase 4: UI 整合 (2天)

| ID | 任务 | 描述 | 工作量 |
|----|------|------|--------|
| T4.1 | 主组件重构 | 更新 `VirtualTryOnApp`，集成背景选择器 | 1天 |
| T4.2 | 上传提示优化 | 更新 `TryOnCanvas`，提示用户上传半身照 | 0.5天 |
| T4.3 | 布局调整 | 调整三栏布局，增加背景选择区域 | 0.5天 |

#### Phase 5: 测试与优化 (2天)

| ID | 任务 | 描述 | 工作量 |
|----|------|------|--------|
| T5.1 | 功能测试 | 测试所有新功能流程 | 0.5天 |
| T5.2 | 效果调优 | 根据生成效果调整Prompt | 1天 |
| T5.3 | 文档更新 | 更新 README 和 API 文档 | 0.5天 |

---

## 七、文件变更清单

### 7.1 修改文件

| 文件路径 | 变更类型 | 变更说明 |
|----------|----------|----------|
| `src/api/generator.ts` | 修改 | 模型升级、三图输入支持 |
| `src/lib/prompts.ts` | 重写 | 新Prompt模板 |
| `src/types/index.ts` | 修改 | 新增背景相关类型 |
| `src/components/VirtualTryOnApp.tsx` | 修改 | 集成背景选择器 |
| `src/components/TryOnCanvas.tsx` | 修改 | 半身照上传提示 |
| `src/components/PromptEditor.tsx` | 修改 | 移除模板选择 |
| `src/components/index.ts` | 修改 | 导出新组件 |
| `src/index.ts` | 修改 | 导出新类型和函数 |

### 7.2 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/types/background.ts` | 背景相关类型定义 |
| `src/components/BackgroundPoseSelector.tsx` | 背景选择器组件 |
| `src/lib/backgroundLibrary.ts` | 背景库数据和工具函数 |
| `public/backgrounds/` | 背景图片资源目录 |

### 7.3 删除/废弃

| 项目 | 说明 |
|------|------|
| `HALF_BODY_PROMPT` | 删除 |
| `TEXTURE_FOCUS_PROMPT` | 删除 |
| `FACE_FOCUS_PROMPT` | 删除 |
| `SIMPLE_PROMPT` | 删除 |
| `PROMPT_PRESETS` 数组 | 删除 |

---

## 八、测试方案

### 8.1 功能测试用例

| ID | 测试场景 | 预期结果 |
|----|----------|----------|
| TC01 | 使用原背景生成 | 人物换上和服，保留原背景 |
| TC02 | 选择女生背景生成 | 使用女生背景，姿势匹配 |
| TC03 | 选择男生背景生成 | 使用男生背景，姿势匹配 |
| TC04 | 选择儿童背景生成 | 使用儿童背景，姿势匹配 |
| TC05 | 上传半身照 | 系统正确识别并处理 |
| TC06 | 上传全身照（兼容） | 系统仍能正常生成 |
| TC07 | 不选和服直接生成 | 提示选择和服 |
| TC08 | 切换背景分类 | 正确显示对应分类图片 |
| TC09 | 下载生成结果 | 正常下载高清图 |
| TC10 | 分享生成结果 | 正常分享/复制链接 |

### 8.2 效果质量检查点

| 检查点 | 评判标准 |
|--------|----------|
| 面部还原度 | 与原照片面部相似度 > 90% |
| 姿势匹配度 | 与参考图姿势一致 |
| 表情匹配度 | 与参考图表情一致 |
| 和服穿着 | 自然、无明显错误 |
| 背景融合 | 无明显拼接痕迹 |
| 整体自然度 | 看起来像真实照片 |

### 8.3 性能测试

| 指标 | 目标值 |
|------|--------|
| 生成时间 | < 30秒 |
| 图片上传时间 | < 3秒 |
| 背景库加载时间 | < 1秒 |
| 内存占用 | < 200MB |

---

## 九、风险与应对

### 9.1 技术风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| Gemini 3 模型效果不稳定 | 中 | 高 | 保留 Gemini 2.5 作为降级方案 |
| 三图输入导致处理时间过长 | 中 | 中 | 优化图片压缩，限制分辨率 |
| 姿势迁移效果差 | 中 | 高 | 持续优化Prompt，增加迭代 |
| 背景融合痕迹明显 | 中 | 中 | 调整Prompt中的融合指令 |
| API 成本增加 | 高 | 中 | 监控使用量，设置配额 |

### 9.2 产品风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| 用户不理解半身照要求 | 高 | 中 | 增加引导提示和示例图 |
| 背景库图片不够丰富 | 中 | 低 | 持续补充背景素材 |
| 生成结果与预期差距大 | 中 | 高 | 提供重试机制，允许调整 |

### 9.3 应急预案

```
如果 Gemini 3 效果不佳：
├── 方案A：回退到 Gemini 2.5 + 优化Prompt
├── 方案B：使用两步生成（先生成身体，再融合背景）
└── 方案C：接入 Replicate 的专业换装模型作为备选

如果背景融合效果差：
├── 方案A：增加后处理步骤（边缘羽化）
├── 方案B：简化背景要求（纯色背景作为保底）
└── 方案C：保留"使用原背景"作为默认选项
```

---

## 附录

### A. 背景图片处理脚本

```bash
#!/bin/bash
# 处理背景图片：压缩 + 生成缩略图

SOURCE_DIR="background&pose"
TARGET_DIR="public/backgrounds"

# 创建目录
mkdir -p "$TARGET_DIR/girl/thumbs"
mkdir -p "$TARGET_DIR/boy/thumbs"
mkdir -p "$TARGET_DIR/kid/thumbs"

# 处理女生背景
for file in "$SOURCE_DIR/girl background"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    # 主图压缩到 1920px
    convert "$file" -resize 1920x1920\> -quality 85 "$TARGET_DIR/girl/$filename"
    # 缩略图 400px
    convert "$file" -resize 400x400\> -quality 80 "$TARGET_DIR/girl/thumbs/$filename"
  fi
done

# 处理男生背景
for file in "$SOURCE_DIR/boy background"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    convert "$file" -resize 1920x1920\> -quality 85 "$TARGET_DIR/boy/$filename"
    convert "$file" -resize 400x400\> -quality 80 "$TARGET_DIR/boy/thumbs/$filename"
  fi
done

# 处理儿童背景
for file in "$SOURCE_DIR/kid background"/*.{jpg,jpeg,png,JPG,JPEG,PNG}; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    convert "$file" -resize 1920x1920\> -quality 85 "$TARGET_DIR/kid/$filename"
    convert "$file" -resize 400x400\> -quality 80 "$TARGET_DIR/kid/thumbs/$filename"
  fi
done

echo "Done! Backgrounds processed to $TARGET_DIR"
```

### B. 相关文档

- [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md) - 长期产品规划
- [README.md](../README.md) - 包使用文档
- [Gemini API 文档](https://ai.google.dev/docs)

### C. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v2.0 | 2024-12-08 | 初始版本，V2功能迭代方案 |

---

> 文档维护：开发团队
> 最后更新：2024-12-08
