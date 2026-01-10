# 商户管理模块

## 需要主管帮助整合的事项

这个模块是从另一个项目复制过来的，需要适配以下内容：

### 1. 依赖修改
页面中使用了 `@/features/auth/contexts/AdminSessionContext`，需要替换为本项目的认证方案。

```typescript
// 原代码
import { useAdminSession } from '@/features/auth/contexts/AdminSessionContext';

// 需要改为本项目的认证方式
// TODO: 请主管指导如何替换
```

### 2. 文件说明

- `new/page.tsx` - 新增商户表单页面
- `route.ts` - 商户 API 接口（需要检查数据库 schema 是否匹配）

### 3. 功能说明

- 创建新商户账户
- 设置商户名称、邮箱、密码
- 设置主题颜色、API 配额
- 控制商户状态（启用/禁用）

---
*提交者: wenjie*
*日期: 2026-01-10*
