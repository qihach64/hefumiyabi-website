# @kimono-one/virtual-tryon

AI 驱动的和服虚拟试穿模块，采用智能三图合成技术，为 Kimono One 平台提供摄影级写真效果。

## 核心特性

- **智能三图合成** - 面部照片 + 和服 + 背景 → AI 合成完整写真
- **Gemini 3.0 Pro** - 使用 Google 最新 `gemini-3-pro-image-preview` 模型
- **2K 高清输出** - 支持 2K 分辨率 (3:4 比例) 摄影级画质
- **153+ 预设背景** - 多类别背景库 (girl/couple/male/professional)
- **反抠像技术** - 预处理干净背景，AI 智能选择构图
- **生产级稳定性** - 超时保护、图片大小验证、完善的错误处理
- **多框架支持** - 核心 API 兼容任何 Node.js 框架
- **React 组件** - 开箱即用的 UI 组件
- **Supabase 集成** - 内置图片上传存储支持

## 安装

```bash
pnpm add @kimono-one/virtual-tryon
```

## 快速开始

### 1. 创建 API 路由 (Next.js App Router)

```typescript
// app/api/virtual-tryon/route.ts
import { createNextHandlerV3 } from '@kimono-one/virtual-tryon';

// V3 模式: 面部 + 和服 + 干净背景 → 智能合成
const handler = createNextHandlerV3({
  googleApiKey: process.env.GOOGLE_AI_API_KEY!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: 'tryon-results',
});

export const POST = handler;
```

### 2. 使用完整应用组件

```tsx
import { VirtualTryOnApp } from '@kimono-one/virtual-tryon';

export default function TryOnPage() {
  return (
    <VirtualTryOnApp
      apiEndpoint="/api/virtual-tryon"
      defaultBackgroundCategory="girl"  // 默认背景分类
      showDefaults={true}                // 显示默认和服
      onSuccess={(result) => console.log('生成成功:', result)}
      onError={(error) => console.error('生成失败:', error)}
    />
  );
}
```

### 3. 使用独立组件

```tsx
import {
  TryOnCanvas,
  KimonoSelector,
  BackgroundPoseSelector,
  PromptEditor,
  DebugPanel,
} from '@kimono-one/virtual-tryon';

export default function CustomTryOn() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedKimono, setSelectedKimono] = useState(null);
  const [backgroundSelection, setBackgroundSelection] = useState({
    useOriginalBackground: false,
    selectedBackground: null,
  });

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* 画布区域 */}
      <TryOnCanvas
        userPhoto={userPhoto}
        resultImage={null}
        isGenerating={false}
        error={null}
        onPhotoUpload={setUserPhoto}
        onReset={() => setUserPhoto(null)}
        onPhotoChange={() => {}}
        generatedResults={[]}
        activeResultIndex={-1}
        onResultChange={() => {}}
        uploadHint="上传半身照 (面部清晰)"
      />

      {/* 和服选择器 */}
      <KimonoSelector
        selectedKimono={selectedKimono}
        onSelect={setSelectedKimono}
        showDefaults={true}
        externalKimonos={[]}  // 可传入外部和服数据
      />

      {/* 背景选择器 */}
      <BackgroundPoseSelector
        selection={backgroundSelection}
        onSelectionChange={setBackgroundSelection}
        defaultCategory="girl"
      />

      {/* 调试面板 */}
      <DebugPanel
        debugInfo={null}
        duration={undefined}
        error={null}
      />
    </div>
  );
}
```

### 4. 直接使用核心 API

```typescript
import { generateTryOnV3 } from '@kimono-one/virtual-tryon';

const result = await generateTryOnV3(
  {
    // 必需: 面部照片 (base64)
    faceImageBase64: 'data:image/jpeg;base64,...',
    // 必需: 和服图片 (base64 或 URL)
    kimonoImageUrl: 'https://example.com/kimono.jpg',
    // 必需: 干净背景 (base64)
    cleanBackgroundUrl: 'data:image/jpeg;base64,...',
    // 可选: 背景分类信息
    backgroundPoseRef: {
      category: 'girl',
    },
    // 可选: 自定义提示词
    customPrompt: undefined,
  },
  {
    googleApiKey: process.env.GOOGLE_AI_API_KEY!,
    // 可选: Supabase 存储配置
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    storageBucket: 'tryon-results',
  }
);

if (result.success) {
  console.log('生成成功!');
  console.log('图片 URL:', result.imageUrl);
  console.log('耗时:', result.duration, '秒');
  console.log('调试信息:', result.debugInfo);
}
```

## API 参考

### TryOnRequestV3 (请求参数)

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `faceImageBase64` | `string` | 是 | 用户面部照片 (base64 格式) |
| `kimonoImageUrl` | `string` | 是 | 和服图片 (base64 或 URL) |
| `cleanBackgroundUrl` | `string` | 是 | 干净背景图片 (base64) |
| `backgroundPoseRef` | `object` | 否 | 背景分类信息 |
| `options` | `object` | 否 | 生成选项 |
| `customPrompt` | `string` | 否 | 自定义提示词 |
| `planId` | `string` | 否 | 套餐 ID (用于路由追踪) |

### TryOnConfig (配置参数)

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `googleApiKey` | `string` | 是 | Google AI API 密钥 |
| `supabaseUrl` | `string` | 否 | Supabase 项目 URL |
| `supabaseServiceKey` | `string` | 否 | Supabase Service Role Key |
| `storageBucket` | `string` | 否 | 存储桶名称 (默认: `tryon-results`) |

### TryOnResponse (响应参数)

| 参数 | 类型 | 说明 |
|------|------|------|
| `success` | `boolean` | 是否成功 |
| `imageUrl` | `string` | 生成图片的公开 URL |
| `imageBuffer` | `Buffer` | 图片原始数据 |
| `duration` | `number` | 生成耗时 (秒) |
| `debugInfo` | `DebugInfo` | 调试信息 |
| `message` | `string` | 错误信息 (失败时) |
| `errorCode` | `string` | 错误代码 (失败时) |

## 背景库

### 背景分类

| 分类 | ID | 说明 |
|------|------|------|
| 少女风 | `girl` | 可爱、活泼的少女风格 |
| 双人 | `couple` | 情侣/双人合照背景 |
| 男性 | `male` | 男性和服试穿背景 |
| 专业 | `professional` | 专业写真背景 |

### 使用背景库

```typescript
import {
  getBackgroundsByCategory,
  getAllBackgrounds,
  BACKGROUND_CATEGORIES,
} from '@kimono-one/virtual-tryon';

// 获取所有分类
console.log(BACKGROUND_CATEGORIES);
// ['girl', 'couple', 'male', 'professional']

// 获取指定分类的背景
const girlBackgrounds = getBackgroundsByCategory('girl');

// 获取所有背景
const allBackgrounds = getAllBackgrounds();

// 背景对象结构
interface BackgroundPoseItem {
  id: string;                    // 唯一标识
  imageUrl: string;              // 原图 URL (含人物)
  cleanBackgroundUrl?: string;   // 干净背景 URL (已移除人物)
  category: BackgroundCategory;  // 分类
  label: string;                 // 显示名称
  aspectRatio?: string;          // 宽高比
}
```

## 状态管理 (Zustand)

### useTryOnStore

用于缓存生成结果，支持 localStorage 持久化。

```typescript
import { useTryOnStore } from '@kimono-one/virtual-tryon';

const {
  tryOnCache,                    // 缓存映射 Map<string, CacheEntry>
  addTryOnResult,                // 添加结果到缓存
  getTryOnResult,                // 从缓存获取结果
  clearCache,                    // 清空缓存
} = useTryOnStore();

// 添加结果
addTryOnResult('user123', 'kimono456', {
  imageUrl: 'https://...',
  timestamp: Date.now(),
});

// 获取缓存的结果
const cached = getTryOnResult('user123', 'kimono456');
```

### useUserPhotoStore

用于会话级用户照片缓存，支持 sessionStorage 持久化。

```typescript
import { useUserPhotoStore } from '@kimono-one/virtual-tryon';

const {
  photo,        // 当前照片 (base64)
  setPhoto,     // 设置照片
  clearPhoto,   // 清除照片
} = useUserPhotoStore();
```

## 错误处理

### 错误代码

| 错误代码 | 说明 | HTTP 状态码 |
|----------|------|-------------|
| `missing_images` | 缺少必需的图片 | 400 |
| `image_too_large` | 图片超过大小限制 (10MB) | 400 |
| `generation_failed` | AI 生成失败 | 500 |
| `fetch_timeout` | 请求超时 (30秒) | 504 |
| `network_error` | 网络连接错误 | 503 |
| `upload_failed` | 图片上传失败 | 500 |
| `rate_limited` | API 调用频率限制 | 429 |
| `invalid_api_key` | 无效的 API 密钥 | 401 |
| `unknown_error` | 未知错误 | 500 |

### 错误处理示例

```typescript
try {
  const result = await generateTryOnV3(request, config);
  if (!result.success) {
    console.error(`错误 [${result.errorCode}]: ${result.message}`);
  }
} catch (error) {
  if (error instanceof TryOnGeneratorError) {
    console.error(`生成错误 [${error.code}]: ${error.message}`);
  }
}
```

## 环境变量

```bash
# 必需 - Google AI API 密钥
GOOGLE_AI_API_KEY=your-gemini-api-key

# 可选 - Supabase 存储配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 技术规格

### 图像规格

| 规格 | 值 |
|------|------|
| 输出分辨率 | 2K (约 1536x2048) |
| 输出比例 | 3:4 (竖版) |
| 输入大小限制 | 10MB |
| 输出格式 | JPEG |
| 压缩质量 | 80% |

### 模型配置

| 配置 | 值 |
|------|------|
| 模型 | `gemini-3-pro-image-preview` |
| 图像尺寸 | `2K` |
| 输出格式 | `JPEG` |
| 请求超时 | 30 秒 |

### 限制

- 单次请求最多 3 张输入图片
- 单张图片不超过 10MB
- API 调用需要有效的 Google AI API Key
- 背景图需要预处理为干净背景 (无人物)

## 目录结构

```
src/
├── api/
│   └── generator.ts      # 核心生成逻辑 (V3)
├── components/
│   ├── VirtualTryOnApp.tsx      # 完整应用组件
│   ├── TryOnCanvas.tsx          # 画布/预览组件
│   ├── KimonoSelector.tsx       # 和服选择器
│   ├── BackgroundPoseSelector.tsx  # 背景选择器
│   ├── PromptEditor.tsx         # 提示词编辑器
│   └── DebugPanel.tsx           # 调试面板
├── lib/
│   ├── prompts.ts        # 提示词模板
│   ├── upload.ts         # Supabase 上传工具
│   └── backgroundLibrary.ts  # 背景库管理
├── store/
│   └── tryOn.ts          # Zustand 状态管理
├── types/
│   ├── index.ts          # 核心类型定义
│   └── background.ts     # 背景相关类型
└── index.ts              # 导出入口
```

## 开发

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm typecheck

# 构建
pnpm build

# 开发模式
pnpm dev
```

## 工作原理

### V3 智能三图合成模式

1. **输入准备**
   - 用户上传半身照 (面部清晰)
   - 选择和服款式
   - 选择预设背景 (已移除人物的干净背景)

2. **图片压缩**
   - 前端将三张图片压缩至 1024x1024 以内
   - 转换为 base64 格式

3. **AI 合成**
   - 使用 Gemini 3.0 Pro 图像生成模型
   - 提示词指导 AI 完成面部替换、和服穿着、背景融合
   - 输出 2K 分辨率摄影级写真

4. **结果存储**
   - 可选上传至 Supabase Storage
   - 返回公开访问 URL

### 反抠像技术

传统方案: 上传照片 → AI 抠图 → 替换背景 (容易出现边缘问题)

反抠像方案:
1. 预处理阶段: 使用 AI 从背景图中移除人物
2. 生成阶段: AI 将用户面部+和服+干净背景智能合成
3. 优势: 更自然的融合效果，无抠图痕迹

## License

Private - Kimono One
