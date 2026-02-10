# UI/UX 设计系统审计报告

**日期**: 2026-02-09
**审计范围**: `src/` 目录下所有 `.tsx` 和 `.css` 文件
**参考标准**: `.claude/skills/ui-design-system/SKILL.md`

---

## 审计摘要

| 违规类型 | 数量 | 严重程度 |
|----------|------|----------|
| 禁止颜色使用 (purple/violet/indigo) | 20 | **严重** |
| 禁止颜色使用 (pink/rose 非 sakura) | 55+ | **严重** |
| 禁止颜色使用 (emerald) | 10 | **中等** |
| 禁止颜色使用 (amber) | 45+ | **低** (语义色可接受，但部分场景有争议) |
| 非 4 倍数间距 | 75+ | **中等** |
| Tailwind 默认字号 (text-sm/base/lg/xl 等) | 300+ | **严重** |
| 禁止圆角 (rounded-md/sm/3xl) | 28+ | **中等** |
| 禁止动画 (duration/animate-bounce/ping) | 12 | **中等** |
| font-bold (应用 font-semibold) | 190+ | **严重** |
| font-light | 1 | **低** |
| hover:scale-110 (应 max 1.05) | 20+ | **中等** |
| 硬编码颜色 (非设计系统) | 30+ | **中等** |
| **总计** | **~790+** | |

---

## 1. 禁止颜色使用

### 1.1 Purple/Violet/Indigo (严重 - 20 处)

设计系统明确禁止: "绝对禁止！土气！"

| 文件 | 行号 | 内容 | 修复建议 |
|------|------|------|----------|
| `src/components/EmbeddedChatbot.tsx` | 116 | `from-blue-500 via-purple-500 to-pink-500` | 改为 sakura 渐变 |
| `src/components/EmbeddedChatbot.tsx` | 151 | `from-purple-500 to-pink-500` | 改为 `bg-sakura-600` |
| `src/components/EmbeddedChatbot.tsx` | 195 | `from-purple-500 to-pink-500` | 改为 sakura 色 |
| `src/components/EmbeddedChatbot.tsx` | 225 | `from-blue-500 to-purple-500` | 改为 sakura 色 |
| `src/components/AIChatbot.tsx` | 121 | `from-blue-500 to-purple-600` | 改为 sakura 色 |
| `src/components/AIChatbot.tsx` | 139 | `from-blue-500 to-purple-600` | 改为 sakura 渐变 |
| `src/components/AIChatbot.tsx` | 174 | `from-purple-500 to-pink-500` | 改为 sakura 色 |
| `src/components/AIChatbot.tsx` | 218 | `from-purple-500 to-pink-500` | 改为 sakura 色 |
| `src/components/SocialPostCard.tsx` | 32 | `from-purple-600 to-pink-600` | 改为 sakura 渐变 |
| `src/app/(main)/admin/services/ServiceReviewList.tsx` | 203 | `bg-purple-100 text-purple-700` | 改为 sakura 色 |
| `src/app/(main)/merchant/bookings/[id]/page.tsx` | 217-218 | `bg-purple-50`, `text-purple-600` | 改为 sakura 色 |
| `src/app/(main)/merchant/dashboard/page.tsx` | 468-477 | `hover:bg-purple-50`, `bg-purple-100`, `text-purple-600` | 改为 sakura 色 |
| `src/app/(main)/admin/page.tsx` | 235-236 | `from-purple-100 to-purple-200`, `text-purple-700` | 改为 sakura 色 |
| `src/app/admin/analytics/page.tsx` | 277 | `from-purple-500 to-purple-600` | 改为 sakura 色 |

### 1.2 Pink/Rose (非 sakura) (严重 - 55+ 处)

设计系统要求使用 `sakura-*` 代替 `pink-*` 和 `rose-*`。

**重灾区文件:**

| 文件 | 违规数 | 说明 |
|------|--------|------|
| `src/app/(auth)/login/page.tsx` | 5 | 整个页面使用 rose/pink 色系 |
| `src/app/(auth)/register/page.tsx` | 5 | 同上 |
| `src/app/(auth)/verify-email/page.tsx` | 8 | 同上 |
| `src/app/(main)/booking/components/Step1SelectStore.tsx` | 6 | 大量 rose 色 |
| `src/app/(main)/booking/components/Step2PersonalInfo.tsx` | 3 | rose/pink 渐变 |
| `src/app/(main)/booking/components/Step3AddOns.tsx` | 5 | rose 选中状态 |
| `src/app/(main)/booking/components/Step4Confirm.tsx` | 8 | rose 按钮和链接 |
| `src/app/(main)/booking/success/BookingSuccessClient.tsx` | 8 | rose/pink 渐变 |
| `src/app/(main)/booking/components/StepIndicator.tsx` | 1 | rose 渐变 |
| `src/components/TryOnModal.tsx` | 7 | `to-pink-500` 渐变 |
| `src/components/layout/NavLink.tsx` | 3 | `pink-500/rose-500` 渐变 |
| `src/app/(main)/admin/layout.tsx` | 1 | `to-pink-400` |
| `src/app/(main)/admin/page.tsx` | 3 | `pink-100/pink-200/pink-700` |
| `src/app/(main)/virtual-tryon/page.tsx` | 1 | `border-pink-500` |
| `src/app/(main)/plans/(list)/page.tsx` | 1 | `from-pink-50/30` |

### 1.3 Emerald (中等 - 10 处)

设计系统规定应使用 `green` 而非 `emerald`。

| 文件 | 行号 | 内容 |
|------|------|------|
| `src/app/admin/analytics/page.tsx` | 346 | `to-emerald-500` |
| `src/app/(main)/merchant/dashboard/page.tsx` | 510-519 | `hover:bg-emerald-50`, `bg-emerald-100`, `text-emerald-600` |
| `src/components/merchant/PlanComponentEditor.tsx` | 928 | `text-emerald-600` |
| `src/components/plan/InteractiveKimonoMap/index.tsx` | 35, 248, 384, 456, 459 | 多处 emerald 色 |

### 1.4 Amber (低 - 45+ 处)

设计系统要求使用 `yellow` 代替 `amber`。但 `amber` 常用于警告状态语义色，且在 merchant/admin 后台大量使用。部分场景（如星级评分 `text-amber-400 fill-amber-400`）可以认为合理。

**主要分布:** `src/app/(main)/merchant/`, `src/app/(main)/admin/`, `src/components/merchant/`

---

## 2. 非 4 倍数间距 (中等 - 75+ 处)

设计系统严格要求间距为 4 的倍数: `gap-4, gap-6, gap-8, p-4, p-6, p-8`。
**禁止**: `gap-5, p-5, space-y-5, mb-5, px-5, py-5, pt-5, pb-5`。

### 高频违规模式

| 模式 | 出现次数 | 主要文件 |
|------|---------|---------|
| `p-5` / `px-5` / `py-5` | 40+ | SearchFilterSidebar, JourneyTimeline, ServiceMap, MobileFilterDrawer, InteractiveKimonoMap, PlanComponentEditor |
| `space-y-5` | 8+ | CreateCustomServiceModal, InteractiveKimonoMap, ServiceMap, ComponentDetailPanel |
| `gap-5` | 3 | PlanCardGrid, PlansClient |
| `mb-5` / `mt-5` / `pt-5` / `pb-5` | 10+ | FeaturedPlanCard, SocialProof, JourneyTimeline |

**重灾区文件:**

| 文件 | 违规数 |
|------|--------|
| `src/features/guest/discovery/components/SearchFilterSidebar.tsx` | 8 |
| `src/components/plan/JourneyTimeline/index.tsx` | 7 |
| `src/components/plan/ServiceMap/index.tsx` | 6 |
| `src/components/plan/InteractiveKimonoMap/index.tsx` | 5 |
| `src/app/(main)/search/SearchClient.tsx` | 3 |
| `src/app/(main)/plans/(list)/PlansClient.tsx` | 3 |
| `src/components/PlanCard/FeaturedPlanCard.tsx` | 3 |

---

## 3. Tailwind 默认字号 (严重 - 300+ 处)

设计系统禁止 `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`。
应改为 `text-[Npx]` 形式。

### 按字号分布

| 禁止字号 | 出现次数 | 应替换为 |
|----------|---------|---------|
| `text-sm` | 200+ | `text-[14px]` 或 `text-[15px]` |
| `text-base` | 10+ | `text-[16px]` |
| `text-lg` | 35+ | `text-[18px]` |
| `text-xl` | 30+ | `text-[22px]` |
| `text-2xl` | 15+ | `text-[26px]` |
| `text-3xl` | 20+ | `text-[32px]` |
| `text-4xl` | 5+ | `text-[36px]` 或 `text-[42px]` |

**特别注意:** `text-sm` 几乎遍布整个项目，是最大的系统性违规。这影响了全站的字体一致性。

**涉及的系统级组件 (修复后影响全局):**

| 文件 | 说明 |
|------|------|
| `src/components/ui/Button.tsx` | 49-52 行: `text-sm`, `text-base`, `text-lg`, `text-xl` |
| `src/components/ui/Badge.tsx` | 54-55 行: `text-sm`, `text-base` |
| `src/components/ui/Card.tsx` | 92, 107 行: `text-2xl`, `text-sm` |
| `src/components/layout/Header.tsx` | 177, 212 行: `text-base`, `text-lg`, `text-xl` |
| `src/components/layout/Footer.tsx` | 9-86 行: 多处 `text-sm`, `text-lg` |

---

## 4. 禁止圆角 (中等 - 28+ 处)

### rounded-md (27 处)

设计系统: 按钮应用 `rounded-lg`，卡片应用 `rounded-xl`。

| 文件 | 行号 | 组件类型 | 修复建议 |
|------|------|---------|---------|
| `src/components/WishlistIcon.tsx` | 21 | 图标按钮 | `rounded-lg` |
| `src/components/NavigationButton.tsx` | 24 | 按钮 | `rounded-lg` |
| `src/components/CartIcon.tsx` | 20 | 图标按钮 | `rounded-lg` |
| `src/components/kimono/KimonoFilter.tsx` | 110, 127, 154 | 表单元素 | `rounded-lg` |
| `src/components/CancelBookingButton.tsx` | 63 | 按钮 | `rounded-lg` |
| `src/components/PlanCard/FeaturedPlanCard.tsx` | 169, 198 | 标签 | `rounded-lg` |
| `src/components/ui/Badge.tsx` | 58 | Badge md variant | `rounded-lg` |
| `src/features/guest/discovery/components/StoreFilter.tsx` | 31 | 下拉框 | `rounded-lg` |
| `src/app/(main)/booking/success/BookingSuccessClient.tsx` | 99, 109 | 图片 | `rounded-lg` |
| `src/app/(main)/kimonos/[id]/page.tsx` | 86, 233, 239 | 按钮 | `rounded-lg` |
| `src/app/(main)/stores/[slug]/page.tsx` | 100, 224, 275, 282, 361 | 按钮 | `rounded-lg` |
| `src/app/(main)/stores/page.tsx` | 265, 271 | 按钮 | `rounded-lg` |
| `src/app/(main)/contact/page.tsx` | 256, 278, 284 | 按钮 | `rounded-lg` |

### rounded-3xl (3 处)

| 文件 | 行号 | 修复建议 |
|------|------|---------|
| `src/features/guest/discovery/components/HeroSearchBar.tsx` | 211 | `rounded-2xl` |
| `src/features/guest/discovery/components/GuestsDropdown.tsx` | 136 | `rounded-2xl` |

---

## 5. 禁止动画 (中等 - 12 处)

### duration-700 (2 处)

设计系统: 标准时长为 `duration-200`, `duration-300`, `duration-500`。
**例外**: 图片 hover 缩放允许 `duration-700`（设计系统动效哲学 section 有说明 `group-hover:scale-105 transition-transform duration-700 ease-out`），这 2 处实际合规。

| 文件 | 行号 | 内容 |
|------|------|------|
| `src/components/PlanCard/FeaturedPlanCard.tsx` | 70 | `duration-700 ease-out` (图片 hover - 合规) |
| `src/components/PlanCard/index.tsx` | 140 | `duration-700 ease-out` (图片 hover - 合规) |

### duration-1000 (1 处 - 严重)

| 文件 | 行号 | 内容 |
|------|------|------|
| `src/components/home/HeroSection.tsx` | 78 | `duration-1000` | 改为 `duration-500` |

### duration-150 (2 处)

| 文件 | 行号 | 内容 |
|------|------|------|
| `src/components/plan/ServiceMap/index.tsx` | 329 | `duration-150` | 改为 `duration-200` |
| `src/components/plan/ServiceMap/index.tsx` | 367 | `duration-150` | 改为 `duration-200` |

### animate-bounce (6 处)

设计系统: "太活泼，不符合 Zen"

| 文件 | 行号 | 说明 |
|------|------|------|
| `src/components/AIChatbot.tsx` | 223-225 | 加载动画 3 个点 |
| `src/components/EmbeddedChatbot.tsx` | 200-202 | 加载动画 3 个点 |

**注意**: `src/app/globals.css` 中的 `.animate-bounce-arrow` 和 `src/components/home/ScrollIndicator.tsx` 是自定义动画类名，不是原生 `animate-bounce`，可接受。

### animate-ping (1 处)

| 文件 | 行号 | 说明 |
|------|------|------|
| `src/components/plan/ServiceMap/index.tsx` | 252 | 导览点动画 |

---

## 6. 字重规范 (严重 - 191 处)

### font-bold (190 处)

设计系统: 应使用 `font-semibold` 代替 `font-bold`。

**全项目分布广泛，几乎所有标题、价格、强调文本都使用了 font-bold。**

**高频文件 (前 10):**

| 文件 | font-bold 出现次数 |
|------|-------------------|
| `src/app/(main)/merchant/bookings/[id]/page.tsx` | 12 |
| `src/app/(main)/stores/page.tsx` | 10 |
| `src/app/(main)/stores/[slug]/page.tsx` | 6 |
| `src/app/(main)/admin/page.tsx` | 10 |
| `src/app/(main)/faq/page.tsx` | 5 |
| `src/app/(main)/about/page.tsx` | 7 |
| `src/app/(main)/contact/page.tsx` | 5 |
| `src/app/(main)/merchant/dashboard/page.tsx` | 8 |
| `src/app/admin/tags/categories/page.tsx` | 6 |
| `src/app/admin/tags/page.tsx` | 5 |

### font-light (1 处)

| 文件 | 行号 | 内容 |
|------|------|------|
| `src/components/layout/Header.tsx` | 219 | `<span className="font-light ml-1">One</span>` |

**修复建议**: 改为 `font-normal`

---

## 7. hover:scale-110 (中等 - 20+ 处)

设计系统: 最大缩放 `hover:scale-105`，`110` 放大幅度过大。

| 文件 | 行号 | 组件 |
|------|------|------|
| `src/components/AIChatbot.tsx` | 121 | 聊天按钮 |
| `src/components/plan/VisualHub/index.tsx` | 370, 381, 422, 433 | 画廊按钮 |
| `src/features/guest/discovery/components/ThemeImageSelector.tsx` | 76, 214 | 左右箭头 |
| `src/features/guest/discovery/components/CategoryFilter.tsx` | 49 | 分类图标 |
| `src/features/guest/discovery/components/SearchFilterSidebar.tsx` | 328, 362 | 滑块 |
| `src/features/guest/discovery/components/HeroSearchBar.tsx` | 234 | 搜索按钮 |
| `src/components/merchant/HotspotEditor.tsx` | 234 | 热点按钮 |
| `src/app/(main)/admin/page.tsx` | 200, 213, 224, 235 | 管理卡片图标 |
| `src/components/TryOnModal.tsx` | 328 | 上传区域 |
| `src/components/layout/HeaderSearchBar.tsx` | 441 | 搜索图标 |
| `src/components/PlanCard/FeaturedPlanCard.tsx` | 100 | 收藏按钮 |
| `src/components/PlanCard/index.tsx` | 160 | 收藏按钮 |

---

## 8. 硬编码颜色 (中等 - 30+ 处)

### 非设计系统颜色

| 颜色值 | 文件 | 出现次数 | 说明 |
|--------|------|---------|------|
| `#FF5580` / `#E63462` | `src/app/admin/tags/` 相关文件 | 12+ | 应使用 sakura-600 / sakura-700 |
| `#D4A5A5` | `src/components/merchant/PlanEditPreview/` | 8 | 商家预览中使用，不在设计系统中 |
| `#8B4513` | `src/components/merchant/PlanEditPreview/`, `PricingTab` | 8 | 棕色，不在设计系统中，应使用 wabi 色系 |
| `#DCFCE7` | `src/app/admin/tags/` | 2 | 应使用 green-50 |
| `#E0F2FE` | `src/app/admin/tags/` | 2 | 应使用 blue-50 |
| `#FEF3C7` | `src/app/admin/tags/` | 2 | 应使用 yellow-50 |
| `#FFF5F7` | `src/app/admin/tags/` | 2 | 应使用 sakura-50 |
| `#10B981` | `src/app/admin/tags/` | 2 | 应使用 green-600 |
| `#3B82F6` | `src/app/admin/tags/` | 2 | 应使用 blue-500 |

### 可接受的硬编码颜色

| 颜色值 | 文件 | 说明 |
|--------|------|------|
| `#FDFBF7` | 多处详情页 | wabi-50，设计系统允许 |
| `#B8A89A` | 装饰文字 | wabi-400，设计系统允许 |

---

## 9. 优先级修复建议

### P0 - 立即修复 (影响品牌一致性)

1. **Purple/Violet 颜色**: 全部替换为 sakura 色系，尤其是 AI 相关组件
2. **认证页面 (auth/)**: 整体从 rose/pink 迁移到 sakura
3. **预约流程 (booking/)**: 整体从 rose/pink 迁移到 sakura

### P1 - 短期修复 (提高设计一致性)

4. **font-bold → font-semibold**: 全局替换，但需逐文件确认
5. **UI 组件库** (`Button.tsx`, `Badge.tsx`, `Card.tsx`): 修复字号，影响全局
6. **NavLink.tsx**: pink/rose → sakura

### P2 - 中期修复 (规范细节)

7. **text-sm/base/lg/xl**: 逐步迁移到 `text-[Npx]`，从核心组件开始
8. **rounded-md → rounded-lg**: 批量替换
9. **hover:scale-110 → hover:scale-105**: 批量替换
10. **非 4 倍数间距**: 逐步调整

### P3 - 低优先级

11. **admin/ 后台硬编码颜色**: 统一到设计系统
12. **emerald → green**: 替换
13. **amber 使用审查**: 区分合理语义色和不合理使用

---

## 10. 按模块风险评估

| 模块 | 违规密度 | 风险 | 说明 |
|------|---------|------|------|
| `app/(auth)/` | 极高 | **高** | 完全使用 rose/pink，偏离品牌色 |
| `app/(main)/booking/` | 极高 | **高** | 大量 rose 色，预约核心流程 |
| `components/AIChatbot.tsx` | 高 | **高** | purple 渐变，AI slop 典型 |
| `components/EmbeddedChatbot.tsx` | 高 | **高** | 同上 |
| `app/(main)/admin/` | 中 | **中** | purple/pink/amber 混用 |
| `app/(main)/merchant/` | 中 | **中** | emerald/amber/purple |
| `components/layout/` | 低 | **中** | Header font-light, NavLink pink |
| `features/guest/discovery/` | 中 | **低** | 主要是间距和 scale 问题 |
| `components/plan/` | 低 | **低** | 少量间距和动画问题 |
| `app/(main)/plans/` | 低 | **低** | 相对遵守规范 |

---

*审计工具: Grep 模式匹配, 手动验证*
*审计人: UI/UX 审计 Agent*
