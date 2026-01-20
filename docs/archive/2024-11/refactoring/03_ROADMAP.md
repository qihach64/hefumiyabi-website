# 功能实施路线图

> **目标**：分阶段、有计划地完成网站重构，确保业务连续性

---

## 📅 总体时间线

```
Phase 1: 基础优化          ████████████████████ 100% (已完成)
Phase 2: 核心功能          ████████░░░░░░░░░░░░  40% (进行中)
Phase 3: 增强体验          ░░░░░░░░░░░░░░░░░░░░   0% (计划中)
Phase 4: 生态扩展          ░░░░░░░░░░░░░░░░░░░░   0% (未来)
                          ─────────────────────────────────────>
                          2周    4周    8周    12周   16周
```

---

## ✅ Phase 1: 基础优化 (已完成)

**时间**: 2周
**状态**: ✅ 100% 完成
**目标**: 建立统一的设计系统和 UI 组件库

### 完成清单

#### 1.1 设计系统建立 ✅
- [x] 分析 Airbnb UI/UX 特点
- [x] 创建 DESIGN_SYSTEM.md 文档
- [x] 定义颜色系统（樱花粉 + Airbnb 灰）
- [x] 定义间距、圆角、阴影系统
- [x] 更新 Tailwind CSS v4 配置

#### 1.2 UI 组件库创建 ✅
- [x] Button 组件 (7 variants, 4 sizes)
- [x] Card 组件 (5 variants)
- [x] Badge 组件 (8 variants)
- [x] 组件统一导出 (index.ts)

#### 1.3 页面重构 ✅
- [x] 首页 (page.tsx)
- [x] 套餐页面 (plans/PlansClient.tsx)
- [x] 店铺信息页 (stores/page.tsx)
- [x] 关于我们页 (about/page.tsx)
- [x] 常见问题页 (faq/page.tsx)
- [x] 个人中心页 (profile/page.tsx)
- [x] BookingsList 组件

### 成果
- ✅ 统一的视觉风格
- ✅ 可复用的组件库
- ✅ 提升用户体验

---

## 🔄 Phase 2: 核心功能 (进行中)

**时间**: 4周
**状态**: 🔄 40% 进行中
**目标**: 实现购物车和简化预约流程

### 2.1 购物车系统 (Week 3-4)

#### 后端设计
```typescript
// 数据模型
interface CartItem {
  id: string;
  type: 'plan' | 'campaign';
  planId?: string;
  campaignPlanId?: string;
  name: string;
  price: number;
  image?: string;
  storeId?: string;
  quantity: number;
  addOns: string[];
}

interface Cart {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}
```

#### 前端实现
- [ ] **Zustand Store 创建**
  ```typescript
  // stores/cartStore.ts
  export const useCartStore = create(
    persist(
      (set, get) => ({
        items: [],
        addItem: (item) => { /* ... */ },
        removeItem: (id) => { /* ... */ },
        updateQuantity: (id, quantity) => { /* ... */ },
        clear: () => set({ items: [] }),
      }),
      { name: 'cart-storage' }
    )
  );
  ```

- [ ] **购物车组件**
  - [ ] CartIcon (导航栏)
  - [ ] CartDrawer (侧边抽屉)
  - [ ] CartPage (/cart 页面)
  - [ ] CartSummary (订单摘要)

- [ ] **套餐卡片更新**
  - [ ] 添加"加入购物车"按钮
  - [ ] 添加飞入动画效果
  - [ ] Toast 提示

#### UI/UX 设计
```
套餐卡片
┌────────────────────────┐
│   [和服图片]            │
│                        │
│   套餐名称              │
│   ¥XXX                 │
│                        │
│   [🛒 加入购物车]       │  ← 新增
│   [⚡ 立即预约]         │  ← 保留
└────────────────────────┘
```

### 2.2 简化预约流程 (Week 5-6)

#### 当前流程 (4步)
```
Step 1: 选择套餐 → Step 2: 选择日期时间 →
Step 3: 选择店铺 → Step 4: 填写信息 → 完成
```

#### 新流程 (3步)
```
购物车 → Step 1: 到店信息 → Step 2: 联系方式 → 完成
```

#### 实现任务
- [ ] **移除冗余字段**
  - [ ] 删除租赁日期、归还日期
  - [ ] 删除取衣时间、还衣时间
  - [ ] 只保留到店日期和到店时间

- [ ] **统一预约表单**
  ```typescript
  interface BookingData {
    // 购物车项
    items: CartItem[];

    // 到店信息
    storeId: string;
    visitDate: Date;
    visitTime: string;  // "10:00"

    // 联系信息
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;

    specialRequests?: string;
  }
  ```

- [ ] **页面重构**
  - [ ] /checkout 结算页面（单页表单）
  - [ ] 左侧：预约表单
  - [ ] 右侧：订单摘要
  - [ ] 响应式设计

### 2.3 店铺筛选器 (Week 5)

- [ ] **套餐页面筛选**
  ```tsx
  <StoreFilter
    stores={stores}
    selectedStoreId={selectedStoreId}
    onStoreChange={setSelectedStoreId}
  />
  ```

- [ ] **活动页面筛选**
  - [ ] 同样的筛选组件
  - [ ] URL 参数同步

### 2.4 支付优化 (Week 6)

- [ ] **Stripe Integration 优化**
  - [ ] 支持支付宝、微信支付
  - [ ] 优化支付流程 UI
  - [ ] 支付成功/失败页面

- [ ] **订单管理**
  - [ ] 订单状态追踪
  - [ ] 邮件通知
  - [ ] 取消/修改订单

---

## 📅 Phase 3: 增强体验 (计划中)

**时间**: 4周
**状态**: 📅 计划中
**目标**: 提升用户互动和信任度

### 3.1 用户评价系统 (Week 7-8)

#### 功能设计
- [ ] **评价功能**
  - [ ] 星级评分 (1-5星)
  - [ ] 文字评论
  - [ ] 照片上传（最多9张）
  - [ ] 标签系统（服务、和服、店铺等）

- [ ] **展示位置**
  - [ ] 套餐详情页
  - [ ] 店铺页面
  - [ ] 用户个人中心

- [ ] **反垃圾机制**
  - [ ] 只有完成预约的用户可评价
  - [ ] 评价审核机制
  - [ ] 举报功能

#### 数据模型
```prisma
model Review {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])

  rating      Int      // 1-5
  content     String?
  images      String[]
  tags        String[]

  helpful     Int      @default(0)  // 有帮助投票

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("reviews")
}
```

### 3.2 社交分享功能 (Week 8-9)

- [ ] **照片墙**
  - [ ] 用户上传和服照片
  - [ ] Instagram 式瀑布流展示
  - [ ] 照片标签和位置

- [ ] **分享功能**
  - [ ] 微信分享
  - [ ] LINE 分享
  - [ ] Instagram 分享
  - [ ] 生成分享海报

- [ ] **UGC 激励**
  - [ ] 分享获得积分
  - [ ] 优质内容推荐
  - [ ] 月度最佳照片

### 3.3 会员体系 (Week 9-10)

#### 会员等级
```
普通会员    0-999分
银卡会员    1000-2999分
金卡会员    3000-4999分
钻石会员    5000+分
```

#### 权益设计
- [ ] **积分系统**
  - [ ] 预约获得积分
  - [ ] 分享获得积分
  - [ ] 评价获得积分
  - [ ] 积分兑换优惠券

- [ ] **会员特权**
  - [ ] 专属折扣
  - [ ] 优先预约
  - [ ] 生日礼包
  - [ ] 免费升级

- [ ] **推荐奖励**
  - [ ] 推荐好友注册奖励
  - [ ] 好友首次预约双方获益

---

## 🔮 Phase 4: 生态扩展 (未来)

**时间**: 8周+
**状态**: 🔮 概念阶段
**目标**: 构建和服租赁生态系统

### 4.1 合作伙伴平台 (Week 11-14)

#### 摄影师平台
- [ ] 摄影师入驻
- [ ] 作品展示
- [ ] 在线预约
- [ ] 佣金分成

#### 化妆师平台
- [ ] 化妆师认证
- [ ] 服务套餐
- [ ] 预约管理

#### 景点合作
- [ ] 景点优惠券
- [ ] 联合营销
- [ ] 导游服务

### 4.2 API 开放平台 (Week 15-16)

- [ ] **RESTful API**
  - [ ] API 文档
  - [ ] API Key 管理
  - [ ] 限流和配额

- [ ] **Webhook**
  - [ ] 订单状态变更
  - [ ] 支付成功通知

- [ ] **合作伙伴集成**
  - [ ] OTA 平台对接
  - [ ] 旅行社系统集成

### 4.3 移动应用 (Week 17+)

- [ ] **React Native App**
  - [ ] iOS 应用
  - [ ] Android 应用
  - [ ] 共享代码库

- [ ] **小程序**
  - [ ] 微信小程序
  - [ ] 支付宝小程序

---

## 🎯 每个 Phase 的验收标准

### Phase 2 验收标准
- [ ] 购物车功能完整，支持增删改查
- [ ] 预约流程简化为 3 步
- [ ] 店铺筛选器正常工作
- [ ] 所有测试通过
- [ ] 性能指标达标（首屏 < 2s）

### Phase 3 验收标准
- [ ] 用户可以发布评价
- [ ] 评价在套餐页正确显示
- [ ] 社交分享功能正常
- [ ] 会员系统运行良好
- [ ] 积分计算准确

### Phase 4 验收标准
- [ ] 合作伙伴可以注册和管理账户
- [ ] API 文档完整
- [ ] 移动应用上线
- [ ] 用户满意度 NPS > 50

---

## 📊 进度追踪

### Week 1-2 (已完成)
- ✅ 设计系统建立
- ✅ UI 组件库创建
- ✅ 主要页面重构

### Week 3-4 (当前)
- 🔄 购物车系统开发
- 📅 预约流程重构准备

### Week 5-6 (下一步)
- 📅 预约流程重构
- 📅 店铺筛选器
- 📅 支付优化

---

## 🚨 风险和挑战

### 技术风险
1. **数据迁移风险**
   - 现有订单数据兼容性
   - 解决方案：创建迁移脚本，灰度发布

2. **性能风险**
   - 购物车状态管理
   - 解决方案：使用 Zustand + LocalStorage

3. **兼容性风险**
   - 旧版浏览器支持
   - 解决方案：Polyfills + 降级方案

### 业务风险
1. **用户适应成本**
   - 新流程学习曲线
   - 解决方案：引导动画、帮助文档

2. **数据安全**
   - 支付信息保护
   - 解决方案：PCI DSS 合规

---

**最后更新**: 2025-10-20
**负责人**: Development Team
