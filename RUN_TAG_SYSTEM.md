# 🏷️ 标签系统 - 手动运行指南

## 当前状态

✅ **已完成**:
- Prisma schema 扩展（TagCategory, Tag, PlanTag 模型）
- 数据库迁移 SQL 文件
- 种子数据脚本（创建 demo 标签）
- 完整 API 层（6 个路由文件）
  - 管理员标签分类 CRUD
  - 管理员标签 CRUD
  - 商家套餐标签编辑
  - 公共标签查询
- 环境变量配置（DATABASE_URL, AUTH_SECRET）

⏳ **进行中**:
- 正在推送数据库 schema 到 Supabase...

## 🚀 在你的终端手动运行

打开新的终端窗口，cd 到项目目录，然后依次运行：

### 步骤 1: 设置环境变量

```bash
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
export DATABASE_URL="postgresql://postgres.epxyusnhvqfhfbaqgsli:9DbHJf%5EdwS%24%405%24@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

### 步骤 2: 推送数据库 schema

```bash
pnpm prisma db push
```

这将创建以下表：
- `tag_categories` - 标签分类（使用场景、价格区间等）
- `tags` - 标签（街拍漫步、寺庙参拜等）
- `plan_tags` - 套餐-标签关联表
- 以及所有相关的索引和外键约束

### 步骤 3: 初始化 demo 数据

```bash
pnpm tsx scripts/seed-tags-demo.ts
```

这将创建：
- 3 个标签分类（使用场景、价格区间、服务等级）
- 10 个演示标签
- 自动为前 10 个套餐添加标签

### 步骤 4: 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 🧪 验证标签系统

### 方法 1: Prisma Studio（可视化）

```bash
export DATABASE_URL="postgresql://postgres.epxyusnhvqfhfbaqgsli:9DbHJf%5EdwS%24%405%24@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
pnpm prisma studio
```

打开 http://localhost:5555，查看：
- `tag_categories` 表 - 应有 3 条记录
- `tags` 表 - 应有 10 条记录
- `plan_tags` 表 - 应有多条关联记录

### 方法 2: API 测试

```bash
# 获取所有标签（公共接口）
curl http://localhost:3000/api/tags?showInFilter=true

# 获取管理员标签分类（需要登录）
# 先在浏览器登录获取 cookie，然后：
curl -H "Cookie: next-auth.session-token=xxx" \
  http://localhost:3000/api/admin/tags/categories
```

### 方法 3: 前端页面

- **套餐列表**: http://localhost:3000/plans
  - 左侧应显示标签筛选器

- **管理员界面**: http://localhost:3000/admin/tags
  - 需要以 ADMIN 角色登录
  - 可以管理标签分类和标签

- **商家界面**: http://localhost:3000/merchant/plans
  - 需要以 MERCHANT 角色登录
  - 编辑套餐时可选择标签

## 📊 标签系统数据结构

### TagCategory（标签分类）
```typescript
{
  id: string
  code: string           // 如: "scene", "price_range"
  name: string           // 如: "使用场景", "价格区间"
  nameEn?: string
  icon?: string          // Lucide 图标名
  color?: string         // 十六进制颜色
  order: number          // 排序
  showInFilter: boolean  // 是否显示在筛选器
  filterOrder: number    // 筛选器中的排序
  isActive: boolean
}
```

### Tag（标签）
```typescript
{
  id: string
  categoryId: string
  code: string        // 如: "casual_walk"
  name: string        // 如: "街拍漫步"
  nameEn?: string
  icon?: string
  color?: string
  order: number
  usageCount: number  // 使用统计（自动更新）
  isActive: boolean
}
```

### PlanTag（套餐-标签关联）
```typescript
{
  id: string
  planId: string
  tagId: string
  addedBy?: string    // 谁添加的（用户ID）
  addedAt: DateTime
}
```

## 🎯 Demo 演示流程

### 场景 1: 管理员添加新标签分类

1. 访问 `/admin/tags/categories`
2. 点击"新建分类"
3. 填写：
   - 代码: `style`
   - 名称: `风格主题`
   - 图标: `Palette`
   - 显示在筛选器: ✅
4. 保存后，添加标签: "传统古典"、"时尚现代"、"可爱甜美"

### 场景 2: 商家编辑套餐标签

1. 访问 `/merchant/plans`
2. 选择套餐，点击"编辑标签"
3. 看到所有可用标签，按分类分组
4. 勾选/取消标签
5. 保存

### 场景 3: 游客筛选套餐

1. 访问 `/plans`
2. 左侧看到动态生成的筛选器
3. 勾选标签进行筛选
4. 套餐卡片显示标签 Badge

## 🔍 故障排查

### 数据库连接失败

检查 Supabase 数据库是否可访问：
```bash
psql "postgresql://postgres.epxyusnhvqfhfbaqgsli:9DbHJf%5EdwS%24%405%24@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

### Prisma 客户端错误

重新生成：
```bash
pnpm prisma generate
```

### 种子数据失败

可能是没有套餐数据。检查：
```bash
export DATABASE_URL="..."
pnpm prisma studio
```
查看 `rental_plans` 表是否有数据。

## 📚 相关文档

- **设计文档**: [docs/tag-management-system.md](docs/tag-management-system.md)
- **Demo 指南**: [docs/TAG_SYSTEM_DEMO.md](docs/TAG_SYSTEM_DEMO.md)
- **API 文档**: [docs/TAG_SYSTEM_API_IMPLEMENTATION.md](docs/TAG_SYSTEM_API_IMPLEMENTATION.md)
- **快速启动**: [QUICK_START.md](QUICK_START.md)

## ✅ 验收标准

标签系统成功创建后，应满足：

- ✅ 数据库有 3 张新表（tag_categories, tags, plan_tags）
- ✅ 有 3 个标签分类
- ✅ 有 10 个标签
- ✅ 部分套餐已关联标签
- ✅ API 端点返回正确数据
- ✅ 前端筛选器（待实现 UI）

## 下一步

完成标签系统创建后，需要实现：
1. 管理员标签管理 UI（4 小时）
2. 商家标签编辑 UI（3 小时）
3. 前端筛选器集成（2 小时）

**总计**: 约 9 小时完成完整功能
