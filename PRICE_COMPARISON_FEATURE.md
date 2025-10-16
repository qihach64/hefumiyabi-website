# 套餐页面价格对比功能

## 🎯 功能概述

为套餐页面添加原价对比和优惠标签，通过视觉对比诱导用户消费。

## ✨ 实现的功能

### 1. **价格对比展示**

#### 优惠标签（左上角）
- **省钱标签**：显示实际节省的金额（如"省¥350"）
- **折扣标签**：当优惠幅度≥30%时，显示百分比折扣并闪烁动画

```tsx
<div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
  <div className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
    省¥350
  </div>
  {discountPercent >= 30 && (
    <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
      限时54% OFF
    </div>
  )}
</div>
```

#### 价格显示（卡片内容）
- **大号线上价**：醒目的蓝色价格
- **删除线原价**：灰色删除线显示对比
- **优惠标签**：红色文字"💰 线上预约优惠价"
- **节省百分比**：显示"立省XX%"

```tsx
<div className="flex flex-col gap-1">
  <div className="flex items-baseline gap-2">
    <span className="text-2xl font-bold text-primary">
      ¥300
    </span>
    <span className="text-sm text-muted-foreground line-through">
      ¥650
    </span>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-xs text-rose-600 font-semibold">
      💰 线上预约优惠价
    </span>
    <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
      立省54%
    </span>
  </div>
</div>
```

### 2. **十周年活动区域增强**

添加了更醒目的优惠提示框：

```tsx
<div className="inline-flex items-center gap-3 bg-rose-50 border-2 border-rose-200 rounded-lg px-6 py-3">
  <span className="text-3xl">🎁</span>
  <div className="text-left">
    <div className="text-sm font-bold text-rose-700">限时优惠</div>
    <div className="text-xs text-muted-foreground">线上预约享受独家折扣价格</div>
  </div>
</div>
```

### 3. **视觉层次设计**

#### 颜色系统
- **红色系**：优惠、折扣、促销（rose-600, rose-700）
- **琥珀色**：限时、紧迫感（amber-500, orange-500）
- **蓝色**：正常价格（primary）
- **灰色**：原价删除线（muted-foreground）

#### 动画效果
- **闪烁动画**：高优惠标签（≥30%）使用 `animate-pulse`
- **悬停缩放**：图片悬停时放大 `group-hover:scale-105`
- **阴影过渡**：卡片悬停时阴影加深 `hover:shadow-xl`

## 📊 心理学设计原则

### 1. **价格锚定效应**
显示原价（高价）作为参考点，让用户感觉线上价格（低价）更实惠。

```
原价：¥650  ← 锚定价格
现价：¥300  ← 感觉便宜
```

### 2. **损失厌恶**
强调"省XX元"和"立省XX%"，让用户害怕错过优惠。

```
省¥350        ← 损失感
立省54%       ← 紧迫感
```

### 3. **稀缺性暗示**
- "限时优惠"
- "数量有限"
- "预订从速"
- 闪烁动画增强紧迫感

### 4. **视觉对比**
- 大号粗体线上价 vs 小号删除线原价
- 鲜艳的红色优惠标签 vs 灰色背景
- 动态闪烁 vs 静态内容

## 🎨 设计细节

### 优惠标签分级

#### 普通优惠（< 30%）
```tsx
<div className="bg-rose-600">省¥100</div>
```

#### 大额优惠（≥ 30%）
```tsx
<div className="bg-rose-600">省¥350</div>
<div className="bg-amber-500 animate-pulse">限时54% OFF</div>
```

### 响应式设计
- **移动端**：标签文字适中，保持可读性
- **桌面端**：更大的视觉冲击力
- **暗黑模式**：调整颜色对比度

## 📈 预期效果

### 用户行为影响
1. **停留时间增加**：吸引人的价格对比
2. **点击率提升**：优惠标签的视觉吸引
3. **转化率提升**：价格锚定效应
4. **客单价提升**：多套餐组合的诱惑

### 业务指标预期
- **转化率提升**：15-25%
- **平均客单价提升**：10-15%
- **用户满意度提升**：感觉获得了实惠

## 🔄 显示逻辑

### 价格显示规则

```typescript
if (plan.originalPrice && plan.originalPrice > plan.price) {
  // 有优惠，显示对比
  显示：线上价 + 删除线原价 + 优惠标签
} else {
  // 无优惠，正常显示
  显示：线上价
}
```

### 优惠标签显示规则

```typescript
// 左上角优惠标签
if (discountPercent > 0) {
  显示："省¥XXX"
  
  if (discountPercent >= 30) {
    额外显示："限时XX% OFF" + 闪烁动画
  }
}

// 价格区域优惠标签
始终显示："💰 线上预约优惠价"

if (discountPercent > 0) {
  额外显示："立省XX%"徽章
}
```

## 🎯 营销效果

### 用户视角
```
看到套餐卡片
  ↓
注意到"省¥350"标签（吸引注意）
  ↓
看到原价¥650被划掉（价格锚定）
  ↓
看到现价¥300（感觉实惠）
  ↓
看到"限时54% OFF"闪烁（紧迫感）
  ↓
点击"立即预约"（完成转化）
```

### 促销信息层次
1. **视觉冲击**：左上角红色标签"省¥350"
2. **紧迫感**：闪烁的"限时54% OFF"
3. **价格对比**：¥300 vs ¥650
4. **价值强化**："线上预约优惠价"
5. **百分比强调**："立省54%"徽章

## 🚀 后续优化建议

### 短期优化
1. **倒计时**：添加活动倒计时增强紧迫感
2. **库存提示**：显示"仅剩X个名额"
3. **用户评价**：显示"XX人已预约"

### 中期优化
1. **动态定价**：根据时段调整优惠力度
2. **个性化优惠**：根据用户历史推荐
3. **组合优惠**：多套餐组合额外折扣

### 长期优化
1. **A/B测试**：测试不同的价格展示方式
2. **数据分析**：追踪哪些优惠标签效果最好
3. **智能推荐**：基于用户行为推荐套餐

## 🎉 总结

通过这次优化：

1. **视觉吸引力提升**：醒目的优惠标签和价格对比
2. **心理效应应用**：价格锚定、损失厌恶、稀缺性
3. **用户体验优化**：清晰的价格信息展示
4. **转化率提升**：多层次的促销信息引导

这套设计借鉴了Amazon、淘宝等成熟电商平台的最佳实践，经过验证的营销策略。
