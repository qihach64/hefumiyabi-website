# 组件迁移与测试覆盖进度

> 最后更新: 2026-01-22

## 概览

| 阶段 | 状态 | 进度 |
|------|------|------|
| Week 1: Foundation | ✅ 完成 | 100% |
| Week 2: Feature Migration | ✅ 完成 | 100% |
| Week 3: Component Migration + Testing | 🔄 进行中 | 60% |

**当前分支:** `refactor/architecture`

---

## Week 3 进度详情

### 已完成任务

| Task | 描述 | 状态 |
|------|------|------|
| 3.1 | Booking 组件迁移到 FSD 结构 | ✅ |
| 3.2 | Plans 组件迁移到 FSD 结构 | ✅ |
| 3.3 | Merchant Plans 组件迁移 | ✅ |
| 3.4 | 单元测试覆盖 (156 测试用例) | ✅ |
| 3.5 | 手动 UI 验证 (3 个页面) | ✅ |
| 3.6 | AI 试穿服务迁移 | 🔲 待开始 |
| 3.7 | AI 客服集成 | 🔲 待开始 |
| 3.8 | CampaignPlan 数据迁移 | 🔲 待开始 |

---

## 组件迁移详情

### Booking 组件 (7 个)

| 组件 | 原路径 | 新路径 |
|------|--------|--------|
| TimeSlotPicker | `components/booking/` | `features/guest/booking/components/` |
| MiniCalendar | `components/booking/` | `features/guest/booking/components/` |
| ContactForm | `components/booking/` | `features/guest/booking/components/` |
| PriceBreakdown | `components/booking/` | `features/guest/booking/components/` |
| CollapsibleDateTimePicker | `components/booking/` | `features/guest/booking/components/` |
| InstantBookingModal | `components/` | `features/guest/booking/components/` |
| MiniBookingBar | `components/` | `features/guest/booking/components/` |

### Plans 组件 (2 个)

| 组件 | 原路径 | 新路径 |
|------|--------|--------|
| PlanCardPreview | `components/PlanCard/` | `features/guest/plans/components/` |
| PlanCardManagement | `components/PlanCard/` | `features/merchant/plans/components/` |

---

## 测试覆盖详情

### 新增测试文件

```
src/features/
├── guest/
│   ├── booking/components/__tests__/
│   │   ├── TimeSlotPicker.test.tsx      (11 tests)
│   │   ├── MiniCalendar.test.tsx        (16 tests)
│   │   ├── ContactForm.test.tsx         (19 tests)
│   │   ├── PriceBreakdown.test.tsx      (17 tests)
│   │   ├── CollapsibleDateTimePicker.test.tsx (13 tests)
│   │   ├── InstantBookingModal.test.tsx (21 tests)
│   │   └── MiniBookingBar.test.tsx      (16 tests)
│   └── plans/components/__tests__/
│       └── PlanCardPreview.test.tsx     (11 tests)
└── merchant/plans/components/__tests__/
    └── PlanCardManagement.test.tsx      (32 tests)
```

### 测试统计

| 目录 | 测试文件数 | 测试用例数 | 状态 |
|------|-----------|-----------|------|
| booking/components | 7 | 113 | ✅ 通过 |
| plans/components | 1 | 11 | ✅ 通过 |
| merchant/plans/components | 1 | 32 | ✅ 通过 |
| **合计** | **9** | **156** | **✅** |

---

## 手动 UI 验证

### 已验证页面

| 页面 | 路径 | 状态 |
|------|------|------|
| 套餐详情页 | `/plans/[id]` | ✅ 通过 |
| 预约确认页 | `/booking` | ✅ 通过 |
| 商家列表页 | `/merchant/listings` | ✅ 通过 |

### 验证内容

**套餐详情页:**
- [x] 页面加载正常
- [x] 日期时间选择器交互正常
- [x] 人数增减正常
- [x] 增值服务选择正常
- [x] 价格计算正确
- [x] "立即预约" 打开模态框
- [x] "加入购物车" 功能正常
- [x] MiniBookingBar 显示/隐藏切换正常

**预约确认页:**
- [x] 购物车为空时显示提示
- [x] 联系表单填写正常
- [x] 订单摘要显示正确
- [x] 价格明细正确

**商家列表页:**
- [x] 套餐卡片渲染正常
- [x] 操作菜单功能正常
- [x] 预览/编辑链接正确

---

## 目录结构 (更新后)

```
src/features/
├── guest/
│   ├── discovery/           # Week 2 完成
│   │   └── components/
│   ├── booking/             # Week 3 新增
│   │   ├── components/
│   │   │   ├── TimeSlotPicker.tsx
│   │   │   ├── MiniCalendar.tsx
│   │   │   ├── ContactForm.tsx
│   │   │   ├── PriceBreakdown.tsx
│   │   │   ├── CollapsibleDateTimePicker.tsx
│   │   │   ├── InstantBookingModal.tsx
│   │   │   ├── MiniBookingBar.tsx
│   │   │   ├── __tests__/
│   │   │   └── index.ts
│   │   └── index.ts
│   └── plans/               # Week 3 新增
│       ├── components/
│       │   ├── PlanCardPreview.tsx
│       │   ├── __tests__/
│       │   └── index.ts
│       ├── hooks/           # Week 2 完成
│       └── index.ts
└── merchant/
    └── plans/               # Week 3 新增
        ├── components/
        │   ├── PlanCardManagement.tsx
        │   ├── __tests__/
        │   └── index.ts
        └── index.ts
```

---

## 下一步计划

### Week 3 剩余任务

1. **AI 试穿服务迁移**
   - 迁移到 `features/guest/virtual-tryon/`
   - 保持 TypeScript 实现

2. **AI 客服集成**
   - REST + OpenAPI 类型生成
   - 独立 Python 服务

3. **CampaignPlan 数据迁移**
   - 8 条记录迁移到 RentalPlan
   - 更新 BookingItem 关联

4. **清理旧代码**
   - 删除 `src/components/booking/` (已迁移)
   - 删除 `src/components/PlanCard/` (已迁移)
   - 删除 `src/components/InstantBookingModal.tsx`
   - 删除 `src/components/MiniBookingBar.tsx`

---

## 命令参考

```bash
# 运行新增测试
pnpm test --run src/features/guest/booking
pnpm test --run src/features/guest/plans
pnpm test --run src/features/merchant/plans

# 运行所有测试
pnpm test --run

# 开发服务器
pnpm dev

# 构建验证
pnpm build
```

---

## 待提交变更

```
# 新增文件
src/features/guest/booking/components/TimeSlotPicker.tsx
src/features/guest/booking/components/MiniCalendar.tsx
src/features/guest/booking/components/ContactForm.tsx
src/features/guest/booking/components/PriceBreakdown.tsx
src/features/guest/booking/components/CollapsibleDateTimePicker.tsx
src/features/guest/booking/components/InstantBookingModal.tsx
src/features/guest/booking/components/MiniBookingBar.tsx
src/features/guest/booking/components/__tests__/*.test.tsx
src/features/guest/plans/components/PlanCardPreview.tsx
src/features/guest/plans/components/__tests__/*.test.tsx
src/features/merchant/plans/components/PlanCardManagement.tsx
src/features/merchant/plans/components/__tests__/*.test.tsx

# 修改文件
src/features/guest/booking/components/index.ts
src/features/guest/plans/components/index.ts
src/app/(main)/booking/page.tsx
src/app/(main)/merchant/listings/ListingsClient.tsx
src/components/BookingCard.tsx
src/components/PlanDetailClient.tsx

# 删除文件 (已迁移)
src/components/booking/TimeSlotPicker.tsx
src/components/booking/MiniCalendar.tsx
src/components/booking/ContactForm.tsx
src/components/booking/PriceBreakdown.tsx
src/components/booking/CollapsibleDateTimePicker.tsx
src/components/InstantBookingModal.tsx
src/components/MiniBookingBar.tsx
src/components/PlanCard/PlanCardPreview.tsx
src/components/PlanCard/PlanCardManagement.tsx
```
