# Contributing Guide

## 快速开始

```bash
# 1. 克隆并安装
git clone <repo>
cd hefumiyabi-website
pnpm install

# 2. 配置环境
cp .env.example .env.local
# 编辑 .env.local 填入数据库连接等

# 3. 启动开发
pnpm dev
```

## 用 Claude Code 开发

### 推荐工作流

1. **理解项目** - Claude 会自动读取 CLAUDE.md
2. **描述任务** - 清晰说明要实现什么
3. **探索代码** - 让 AI 用 Explore agent 搜索相关代码
4. **制定计划** - 用 `/plan` 生成实施方案
5. **逐步实现** - 每步完成后验证

### 常见任务示例

**添加新组件:**
```
"在 discovery 模块添加一个价格范围筛选器，参考 CategoryFilter.tsx 的实现"
```

**修改数据模型:**
```
"给 RentalPlan 添加 maxGroupSize 字段，需要更新 Prisma schema 和相关 API"
```

**修复 Bug:**
```
"DateDropdown 在移动端点击没反应，帮我调试"
```

**写测试:**
```
"给 usePlanList hook 添加测试，参考 useSearchState.test.ts 的模式"
```

## 代码规范

### 文件位置

| 类型 | 位置 |
|------|------|
| 页面 | `src/app/(main)/[route]/page.tsx` |
| 搜索组件 | `src/features/guest/discovery/components/` |
| 套餐组件 | `src/features/guest/plans/components/` |
| 共享 Hook | `src/shared/hooks/` |
| API 路由 | `src/app/api/` |
| 测试 | `[模块]/__tests__/` |

### 命名规范

- 组件: PascalCase (`DateDropdown.tsx`)
- Hook: camelCase with use prefix (`usePlanList.ts`)
- 测试: `[name].test.ts(x)`

### 提交信息

```
feat(scope): 添加新功能
fix(scope): 修复问题
docs: 更新文档
test: 添加测试
refactor: 重构代码
```

## 测试

```bash
pnpm test              # 监视模式
pnpm test --run        # 单次运行全部
pnpm test [file]       # 运行特定文件
```

### 测试文件结构

```typescript
/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

describe('useMyHook', () => {
  it('should do something', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(expected);
  });
});
```

## 获取帮助

- 项目文档: `docs/` 目录
- 架构说明: `docs/architecture/`
- 功能设计: `docs/features/`
- 开发环境: `docs/guides/setup.md`
