# 标签系统 API 实现文档

> **状态**: API 层已完成，准备测试
> **完成时间**: 2025-11-02

## 📋 实现概览

已完成标签系统的完整 API 层，包括管理员、商家和公共接口。

### ✅ 已完成的组件

1. **数据库层** (已完成)
   - Prisma schema 扩展
   - 数据库迁移 SQL
   - 种子数据脚本

2. **API 层** (本次完成)
   - 管理员标签分类 CRUD
   - 管理员标签 CRUD
   - 商家套餐标签编辑
   - 公共标签查询

---

## 🗂️ API 端点清单

### 管理员 - 标签分类管理

#### `GET /api/admin/tags/categories`
获取所有标签分类（包含标签和统计）

**权限**: ADMIN
**响应**:
```json
{
  "categories": [
    {
      "id": "clxxx",
      "code": "scene",
      "name": "使用场景",
      "nameEn": "Scene",
      "icon": "MapPin",
      "color": "#3b82f6",
      "order": 1,
      "showInFilter": true,
      "filterOrder": 1,
      "tags": [...],
      "_count": { "tags": 4 }
    }
  ]
}
```

#### `POST /api/admin/tags/categories`
创建新标签分类

**权限**: ADMIN
**请求体**:
```json
{
  "code": "style",
  "name": "风格主题",
  "nameEn": "Style",
  "description": "和服风格分类",
  "icon": "Palette",
  "color": "#8b5cf6",
  "order": 4,
  "showInFilter": true,
  "filterOrder": 4
}
```

**验证**:
- `code` 和 `name` 必填
- `code` 必须唯一

#### `GET /api/admin/tags/categories/[id]`
获取单个标签分类

**权限**: ADMIN

#### `PUT /api/admin/tags/categories/[id]`
更新标签分类

**权限**: ADMIN
**请求体**: 同创建，所有字段可选
**验证**: 更新 code 时检查唯一性

#### `DELETE /api/admin/tags/categories/[id]`
删除标签分类

**权限**: ADMIN
**保护**: 如果分类下有标签，拒绝删除并返回 400

---

### 管理员 - 标签管理

#### `GET /api/admin/tags`
获取所有标签

**权限**: ADMIN
**查询参数**:
- `categoryId` (可选) - 按分类筛选

**响应**:
```json
{
  "tags": [
    {
      "id": "clxxx",
      "categoryId": "clxxx",
      "code": "casual_walk",
      "name": "街拍漫步",
      "nameEn": "Casual Walk",
      "icon": "Camera",
      "order": 1,
      "isActive": true,
      "usageCount": 15,
      "category": {...},
      "_count": { "plans": 15 }
    }
  ]
}
```

#### `POST /api/admin/tags`
创建新标签

**权限**: ADMIN
**请求体**:
```json
{
  "categoryId": "clxxx",
  "code": "traditional",
  "name": "传统古典",
  "nameEn": "Traditional",
  "icon": "Castle",
  "color": "#dc2626",
  "order": 1
}
```

**验证**:
- `categoryId`, `code`, `name` 必填
- 验证 `categoryId` 存在
- `code` 在同一分类内唯一 (unique constraint: `categoryId_code`)

#### `GET /api/admin/tags/[id]`
获取单个标签

**权限**: ADMIN

#### `PUT /api/admin/tags/[id]`
更新标签

**权限**: ADMIN
**请求体**: 同创建，所有字段可选
**验证**: 更新 code 时检查分类内唯一性

#### `DELETE /api/admin/tags/[id]`
删除标签

**权限**: ADMIN
**保护**: 如果标签被套餐使用，拒绝删除并返回 400，提示使用数量

---

### 商家 - 套餐标签编辑

#### `GET /api/merchant/plans/[id]/tags`
获取套餐的标签信息

**权限**: MERCHANT, ADMIN
**响应**:
```json
{
  "categories": [
    {
      "id": "clxxx",
      "code": "scene",
      "name": "使用场景",
      "tags": [
        {
          "id": "clxxx",
          "code": "casual_walk",
          "name": "街拍漫步",
          "icon": "Camera"
        }
      ]
    }
  ],
  "selectedTagIds": ["clxxx", "clyyy"],
  "planTags": [...]
}
```

**用途**:
- `categories` - 所有可用的标签分类和标签
- `selectedTagIds` - 当前套餐已选择的标签 ID
- `planTags` - 完整的 PlanTag 关联记录

#### `PUT /api/merchant/plans/[id]/tags`
更新套餐标签

**权限**: MERCHANT, ADMIN
**请求体**:
```json
{
  "tagIds": ["clxxx", "clyyy", "clzzz"]
}
```

**业务逻辑**:
1. 验证所有 tagId 有效且活跃
2. 使用事务更新:
   - 删除旧的 PlanTag 关联
   - 创建新的 PlanTag 关联
   - 更新被移除标签的 `usageCount` (-1)
   - 更新新增标签的 `usageCount` (+1)

**响应**:
```json
{
  "success": true,
  "planTags": [...]
}
```

---

### 公共 - 标签查询

#### `GET /api/tags`
获取所有活跃标签（用于前端筛选器）

**权限**: 公开
**查询参数**:
- `showInFilter=true` - 仅返回配置为显示在筛选器中的分类

**响应**:
```json
{
  "categories": [
    {
      "id": "clxxx",
      "code": "scene",
      "name": "使用场景",
      "nameEn": "Scene",
      "icon": "MapPin",
      "color": "#3b82f6",
      "order": 1,
      "showInFilter": true,
      "filterOrder": 1,
      "tags": [
        {
          "id": "clxxx",
          "code": "casual_walk",
          "name": "街拍漫步",
          "nameEn": "Casual Walk",
          "icon": "Camera",
          "usageCount": 15
        }
      ]
    }
  ]
}
```

**用途**: 前端 `/plans` 页面动态渲染筛选器

---

## 🔒 安全特性

### 权限控制
- 所有管理员接口: 验证 `session.user.role === 'ADMIN'`
- 商家接口: 验证 `session.user.role === 'MERCHANT' || 'ADMIN'`
- 公共接口: 无需认证

### 数据验证
- 必填字段检查
- 唯一性约束验证
- 外键关系验证
- 删除保护（级联删除前检查使用情况）

### 事务保证
- 套餐标签更新使用 Prisma 事务
- 确保 usageCount 与关联记录一致

---

## 🧪 测试步骤

### 1. 运行数据库迁移

```bash
# 生成 Prisma 客户端
pnpm prisma generate

# 推送 schema 到数据库
pnpm prisma db push
```

### 2. 初始化种子数据

```bash
# 创建 demo 标签和关联
pnpm tsx scripts/seed-tags-demo.ts
```

### 3. 测试管理员 API

使用 Postman/Insomnia 或 curl:

```bash
# 获取所有分类
curl -H "Cookie: next-auth.session-token=xxx" \
  http://localhost:3000/api/admin/tags/categories

# 创建新分类
curl -X POST \
  -H "Cookie: next-auth.session-token=xxx" \
  -H "Content-Type: application/json" \
  -d '{"code":"style","name":"风格主题","icon":"Palette"}' \
  http://localhost:3000/api/admin/tags/categories

# 创建新标签
curl -X POST \
  -H "Cookie: next-auth.session-token=xxx" \
  -H "Content-Type: application/json" \
  -d '{"categoryId":"clxxx","code":"traditional","name":"传统古典"}' \
  http://localhost:3000/api/admin/tags
```

### 4. 测试商家 API

```bash
# 获取套餐标签信息
curl -H "Cookie: next-auth.session-token=xxx" \
  http://localhost:3000/api/merchant/plans/{planId}/tags

# 更新套餐标签
curl -X PUT \
  -H "Cookie: next-auth.session-token=xxx" \
  -H "Content-Type: application/json" \
  -d '{"tagIds":["clxxx","clyyy"]}' \
  http://localhost:3000/api/merchant/plans/{planId}/tags
```

### 5. 测试公共 API

```bash
# 获取筛选器标签
curl http://localhost:3000/api/tags?showInFilter=true
```

---

## 📝 待实现功能

### 高优先级（Demo 必需）
1. **管理员 UI** (4 小时)
   - `/admin/tags/categories` - 分类管理页面
   - `/admin/tags` - 标签管理页面
   - 表格 + 创建/编辑表单
   - 删除确认弹窗

2. **商家 UI** (3 小时)
   - `/merchant/plans/[id]/tags` - 标签编辑页面
   - 或集成到 `/merchant/plans/[id]/edit` 页面
   - 按分类分组的多选框
   - 实时保存

3. **前端筛选器** (2 小时)
   - 更新 `PlansClient.tsx`
   - 从 `/api/tags?showInFilter=true` 获取分类
   - 动态渲染筛选器
   - 更新 `PlanCard.tsx` 显示标签 Badge

### 中优先级（优化）
4. **批量操作 API**
   - `POST /api/admin/tags/batch` - 批量创建标签
   - `PUT /api/admin/tags/batch` - 批量更新激活状态

5. **搜索和分页**
   - 标签列表支持搜索
   - 分页加载

### 低优先级（未来）
6. **标签建议系统** (V2)
   - 商家建议新标签
   - 管理员审批流程

7. **标签分析**
   - 使用热力图
   - 标签效果分析

---

## 🎯 下一步行动

1. **立即**: 运行 `pnpm prisma db push` 和种子脚本
2. **今天**: 使用 API 测试工具验证所有端点
3. **明天**: 实现管理员 UI（分类和标签管理）
4. **后天**: 实现商家标签编辑 UI
5. **第四天**: 实现前端筛选器集成

**预计总时间**: 9-12 小时完成完整 Demo

---

## 📁 相关文件

- **API 实现**:
  - `src/app/api/admin/tags/categories/route.ts`
  - `src/app/api/admin/tags/categories/[id]/route.ts`
  - `src/app/api/admin/tags/route.ts`
  - `src/app/api/admin/tags/[id]/route.ts`
  - `src/app/api/merchant/plans/[id]/tags/route.ts`
  - `src/app/api/tags/route.ts`

- **数据模型**:
  - `prisma/schema.prisma` (TagCategory, Tag, PlanTag)
  - `prisma/migrations/add_tag_system/migration.sql`

- **种子数据**:
  - `scripts/seed-tags-demo.ts`

- **文档**:
  - `docs/tag-management-system.md` (完整设计文档)
  - `docs/TAG_SYSTEM_DEMO.md` (Demo 指南)
  - `docs/TAG_SYSTEM_API_IMPLEMENTATION.md` (本文档)

---

## 🔍 常见问题

### Q: 商家能否创建自己的标签？
**A**: 不能。当前版本只允许平台管理员创建标签，商家只能选择。这是有意为之，以保持平台标准化。V2 可能添加"建议标签"功能。

### Q: 删除标签会影响已有套餐吗？
**A**: 直接删除会被阻止（如果标签在使用中）。建议做法是停用标签（`isActive: false`），已有套餐保留标签但不再显示。

### Q: 标签如何排序？
**A**:
- 分类按 `order` 排序（或筛选器中按 `filterOrder`）
- 分类内的标签按 `order` 排序
- 所有排序字段都可通过 API 更新

### Q: usageCount 会自动同步吗？
**A**: 是的。通过商家标签编辑 API 更新时，`usageCount` 会在事务中自动增减。种子脚本也会初始化正确的计数。

### Q: 前端如何知道显示哪些分类作为筛选器？
**A**: 查询 `/api/tags?showInFilter=true`，只返回 `showInFilter: true` 的分类，并按 `filterOrder` 排序。

---

## ✅ 验收标准

API 层已达到以下标准：

- ✅ 所有端点实现完整 CRUD
- ✅ 权限验证（ADMIN/MERCHANT 角色）
- ✅ 数据验证（必填、唯一性、外键）
- ✅ 删除保护（防止误删使用中的数据）
- ✅ 事务安全（usageCount 一致性）
- ✅ RESTful 规范（HTTP 动词、状态码）
- ✅ 错误处理（try-catch + 有意义的错误消息）
- ✅ 响应格式统一（JSON）

**准备就绪，可以开始 UI 层开发！** 🚀
