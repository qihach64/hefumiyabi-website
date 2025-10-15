# 和服租赁预约功能设计文档

## 一、预约流程概述

### 用户预约流程
```
浏览套餐页面 (/plans)
  ↓
选择套餐 → 点击"立即预约"
  ↓
进入预约页面 (/booking)
  ↓
步骤1: 选择店铺和日期
  ↓
步骤2: 选择和服（可选多件）
  ↓
步骤3: 填写个人信息（如未登录）
  ↓
步骤4: 确认订单信息
  ↓
步骤5: 支付（定金/全款）
  ↓
预约成功 → 显示预约详情
```

## 二、详细功能设计

### 2.1 预约入口

#### 入口1: 套餐页面
- 位置: `/plans` 页面
- 每个套餐卡片显示"立即预约"按钮
- 点击后跳转: `/booking?planId=xxx`

#### 入口2: 优惠活动页面
- 位置: `/campaigns` 页面
- 活动套餐显示"立即预约"按钮
- 点击后跳转: `/booking?campaignPlanId=xxx`

#### 入口3: 店铺详情页
- 位置: `/stores/[slug]` 页面
- 显示该店铺可用的套餐
- 点击预约: `/booking?storeId=xxx`

### 2.2 预约页面结构 (`/booking`)

#### 页面布局
```
┌─────────────────────────────────────┐
│         预约进度指示器               │
│   [1.选店铺] → [2.选和服] → [3.信息] → [4.确认]  │
├─────────────────────────────────────┤
│                                     │
│         当前步骤表单内容             │
│                                     │
├─────────────────────────────────────┤
│   [上一步]              [下一步]     │
└─────────────────────────────────────┘
```

### 2.3 步骤详解

#### **步骤1: 选择店铺和日期**

**显示内容:**
- 套餐信息摘要（如果从套餐页进入）
- 店铺选择（下拉或卡片选择）
  - 店铺名称
  - 地址
  - 营业时间
  - 距离（如果开启定位）
- 日期选择器
  - 租赁日期（开始日期）
  - 归还日期（自动计算或手动选择）
  - 不可选日期：过去日期、店铺休息日
- 时间选择
  - 取衣时间
  - 还衣时间

**验证规则:**
- 必须选择店铺
- 必须选择有效日期
- 租赁日期不能早于今天
- 归还日期必须晚于租赁日期

**数据收集:**
```typescript
{
  planId?: string,
  campaignPlanId?: string,
  storeId: string,
  rentalDate: Date,
  returnDate: Date,
  pickupTime?: string,
  returnTime?: string
}
```

---

#### **步骤2: 选择和服**

**显示内容:**
- 和服筛选器
  - 类别: 女士/男士/儿童
  - 风格: 振袖/留袖/小纹/浴衣等
  - 颜色
  - 图案
  - 季节
- 和服列表（卡片展示）
  - 和服图片
  - 名称
  - 颜色/图案信息
  - 库存状态
  - "选择"按钮
- 已选和服展示
  - 显示已选择的和服
  - 可以移除

**筛选逻辑:**
- 根据选择的店铺，只显示该店铺有库存的和服
- 根据选择的日期，过滤掉已被预订的和服

**验证规则:**
- 至少选择 1 件和服
- 不超过套餐允许的数量（如情侣套餐需要2件）

**数据收集:**
```typescript
{
  selectedKimonos: [
    { kimonoId: string, name: string, image: string }
  ]
}
```

---

#### **步骤3: 填写/确认个人信息**

**场景A: 已登录用户**
- 自动填充用户信息
- 允许修改联系方式
- 显示:
  - 姓名
  - 邮箱
  - 手机号（如有）
  - 备注（可选）

**场景B: 游客预约**
- 显示提示: "登录可享受更多优惠"
- 提供"快速登录"按钮
- 或填写游客信息:
  - 姓名（必填）
  - 邮箱（必填）
  - 手机号（必填）
  - 备注（可选）

**附加选项:**
- 附加服务选择
  - 专业摄影
  - 发型设计
  - 化妆服务
  - 配饰升级
- 特殊要求备注

**数据收集:**
```typescript
{
  userId?: string,  // 如果已登录
  guestName?: string,  // 游客姓名
  guestEmail?: string,  // 游客邮箱
  guestPhone?: string,  // 游客电话
  addOns: string[],  // 附加服务
  notes?: string  // 备注
}
```

---

#### **步骤4: 确认订单**

**显示内容:**
- 预约信息摘要
  - 套餐名称
  - 店铺信息
  - 租赁日期/时间
  - 归还日期/时间
- 和服信息
  - 显示所选和服（图片+名称）
- 联系信息
  - 预约人姓名
  - 联系方式
- 费用明细
  - 套餐价格
  - 附加服务费用
  - 优惠折扣
  - 定金金额
  - 应付总额
- 支付方式选择
  - 在线支付（支付宝/微信/信用卡）
  - 到店支付
  - 仅支付定金 / 全额支付
- 服务条款
  - 取消政策
  - 退款政策
  - 同意条款 checkbox

**验证规则:**
- 必须勾选同意服务条款
- 必须选择支付方式

**数据收集:**
```typescript
{
  totalAmount: number,  // 总金额（分）
  depositAmount: number,  // 定金（分）
  paymentMethod?: string,  // 支付方式
  agreedToTerms: boolean  // 同意条款
}
```

---

#### **步骤5: 支付**

**支付流程:**
```
选择支付方式
  ↓
跳转支付页面/扫码
  ↓
支付成功
  ↓
回调处理
  ↓
显示预约成功页面
```

**支付方式:**
1. **在线支付**
   - 支付宝
   - 微信支付
   - 信用卡

2. **到店支付**
   - 创建预约记录（状态: PENDING）
   - 发送确认邮件
   - 提示到店支付

**支付金额选项:**
- 仅支付定金（如 30%）
- 支付全款

---

### 2.4 预约成功页面

**显示内容:**
- 成功提示动画/图标
- 预约编号
- 预约详细信息
- 二维码（到店出示）
- 操作按钮:
  - 查看预约详情
  - 返回首页
  - 添加到日历
- 温馨提示:
  - 到店须知
  - 取消政策
  - 联系方式

**后续操作:**
- 发送确认邮件
- 发送短信（如果有手机号）
- 创建预约记录到数据库

---

## 三、数据库设计确认

### Booking 表字段
```prisma
model Booking {
  id String @id @default(cuid())

  // 用户信息（支持游客）
  userId     String?
  user       User?   @relation(...)
  guestName  String?
  guestEmail String?
  guestPhone String?

  // 预约信息
  storeId  String
  store    Store  @relation(...)
  planId   String
  plan     RentalPlan @relation(...)

  rentalDate DateTime  // 租赁日期
  returnDate DateTime  // 归还日期

  pickupTime String?  // 取衣时间
  returnTime String?  // 还衣时间

  // 和服
  kimonos BookingKimono[]

  // 附加服务
  addOns String[]

  // 支付
  totalAmount   Int
  depositAmount Int
  paidAmount    Int @default(0)
  paymentStatus PaymentStatus @default(PENDING)
  paymentMethod String?

  // 状态
  status BookingStatus @default(PENDING)

  // 备注
  notes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 四、技术实现方案

### 4.1 前端组件结构
```
/src/app/(main)/booking/
  ├── page.tsx              # 主预约页面（多步骤表单）
  ├── components/
  │   ├── StepIndicator.tsx    # 进度指示器
  │   ├── Step1SelectStore.tsx # 步骤1
  │   ├── Step2SelectKimono.tsx # 步骤2
  │   ├── Step3PersonalInfo.tsx # 步骤3
  │   ├── Step4Confirm.tsx      # 步骤4
  │   └── BookingSummary.tsx    # 订单摘要
  └── success/
      └── page.tsx          # 预约成功页面
```

### 4.2 状态管理
使用 React Context 或 URL 参数管理预约流程状态

```typescript
interface BookingState {
  currentStep: number;
  planId?: string;
  campaignPlanId?: string;
  storeId: string;
  rentalDate: Date;
  returnDate: Date;
  pickupTime?: string;
  returnTime?: string;
  selectedKimonos: Kimono[];
  guestInfo?: GuestInfo;
  addOns: string[];
  notes?: string;
  totalAmount: number;
  depositAmount: number;
}
```

### 4.3 API 端点

```typescript
// 创建预约
POST /api/bookings
Body: { ...bookingData }
Response: { bookingId, status, paymentUrl? }

// 检查库存
GET /api/bookings/check-availability
Query: { storeId, date, kimonoIds }
Response: { available: boolean, conflicts: [] }

// 计算价格
POST /api/bookings/calculate
Body: { planId, addOns, discountCode? }
Response: { totalAmount, depositAmount, breakdown }

// 获取可用和服
GET /api/kimonos/available
Query: { storeId, date, category? }
Response: { kimonos: [] }
```

---

## 五、需要确认的问题

### 5.1 业务逻辑问题

1. **套餐与和服的关系**
   - ✅ 用户不需要选择和服，只预约服务即可
   - 套餐不限制和服数量

2. **定金政策**
   - 定金比例是多少？（建议 30%）
   - 是否支持全额支付？
   - 定金是否可退？

3. **取消政策**
   - 提前多久可以免费取消？
   - 取消后退款比例？
   - 是否收取取消手续费？

4. **库存管理**
   - 和服是否需要实时库存检查？
   - 一件和服同一天是否可以被多次预约？（考虑清洗时间）

5. **游客预约**
   - ✅ 允许游客预约
   - ✅ 在流程中引导游客注册（非强制）
   - ✅ 游客预约后显示注册优惠提示
   - 游客邮箱在预约成功后发送确认邮件，包含注册链接

6. **附加服务**
   - ✅ 参考 https://hefumiyabi.com/zh/service
   - 附加服务在步骤3中可选
   - MVP 阶段暂不计算附加服务价格，仅记录

7. **时间管理**
   - 店铺营业时间？
   - 取衣/还衣时间段？
   - 租赁时长限制？（最短/最长）

### 5.2 技术实现问题

1. **支付集成**
   - 使用哪个支付网关？（Stripe / 支付宝 / 微信支付）
   - 是否需要沙盒测试环境？
   - 支付回调 URL 配置？

2. **邮件通知**
   - 预约确认邮件模板？
   - 预约提醒（提前1天/3天）？
   - 取消/修改通知？

3. **短信通知**
   - 是否需要短信验证？
   - 预约确认短信？
   - 使用哪个短信服务商？

4. **日历集成**
   - 是否支持添加到 Google Calendar / Apple Calendar？
   - 生成 .ics 文件？

5. **优惠码/折扣**
   - 是否支持优惠码？
   - 会员折扣？
   - 活动折扣优先级？

---

## 六、MVP 最小可行产品范围

如果要快速上线，建议 MVP 包含：

### ✅ MVP 必须功能
1. 选择套餐（支持从套餐页/活动页进入）
2. 选择店铺和日期
3. ~~选择和服~~（不需要，到店选择）
4. 填写联系信息（支持游客，引导注册）
5. 可选附加服务（记录，暂不计价）
6. 确认订单信息
7. 创建预约记录（状态: PENDING，到店支付）
8. 显示预约成功页面
9. 发送确认邮件（游客邮件包含注册链接）

### ⏳ 后期功能
1. 在线支付
2. 实时库存检查
3. 附加服务选择
4. 优惠码系统
5. 短信通知
6. 日历集成
7. 预约修改/取消
8. 会员等级折扣

---

## 七、UI/UX 设计重点

### 7.1 响应式设计
- 移动端优先
- 桌面端优化布局
- 步骤指示器清晰

### 7.2 用户体验
- 进度保存（浏览器刷新不丢失）
- 表单验证实时反馈
- 错误提示友好
- 加载状态明确
- 成功动画/反馈

### 7.3 可访问性
- 键盘导航
- 屏幕阅读器支持
- 颜色对比度
- 焦点指示器

---

## 八、下一步行动

请确认以下内容后，我们开始开发：

1. ✅ 预约流程是否符合您的业务需求？
2. ❓ 第五部分的业务逻辑问题需要您的回答
3. ❓ 是否从 MVP 开始，还是完整功能？
4. ❓ 支付方式优先级？（在线支付 vs 到店支付）
5. ❓ 是否允许游客预约？

---

**请您审阅此文档，并告诉我：**
1. 哪些流程需要调整？
2. 业务逻辑问题的答案
3. 我们从哪个范围开始实现？（MVP 或完整功能）
