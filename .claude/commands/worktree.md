---
name: worktree
description: 管理 Git Worktree 进行并行开发
argument-hint: "<create|list|remove|remove-all> [worktree名称]"
---

# Git Worktree 并行开发管理

通过 Git Worktree 实现多个 Claude Code session 并行开发，每个 worktree 是独立的工作目录。

## 预计算上下文

**当前 worktree 列表:**
!`git worktree list`

**当前分支:**
!`git branch --show-current`

## 参数解析

用户输入: `$ARGUMENTS`

解析规则:

- `create <name>` 或 `<name>` — 创建新 worktree
- `list` 或 `ls` 或无参数 — 列出所有 worktree
- `remove <name>` 或 `rm <name>` — 删除指定 worktree
- `remove-all` 或 `rm-all` — 删除所有 worktree

## 操作流程

### create（创建）

1. **检查是否已存在:** 检查 `.claude/worktrees/<name>` 目录是否存在
   - 如果已存在，告知用户并提示可以在另一个终端 `cd .claude/worktrees/<name> && claude` 进入

2. **创建 worktree:**

   ```bash
   git worktree add .claude/worktrees/<name> -b <name> origin/main
   ```

3. **安装依赖（在新 worktree 目录下执行）:**

   ```bash
   cd .claude/worktrees/<name>
   pnpm install --frozen-lockfile
   pnpm prisma generate
   ```

4. **告知用户下一步:** 显示以下信息：

   ```
   ✅ Worktree "<name>" 已就绪！

   在新终端窗口执行以下命令启动并行 Claude Code:
   cd <项目绝对路径>/.claude/worktrees/<name> && claude
   ```

### list（列出）

运行 `git worktree list` 并以表格形式展示结果，标注哪个是主目录。

### remove（删除）

1. 运行 `git worktree remove .claude/worktrees/<name>`
2. 尝试删除对应分支 `git branch -d <name>`（如果失败也无所谓）
3. 报告结果

### remove-all（全部删除）

1. 列出 `.claude/worktrees/` 下所有目录
2. 逐个执行 `git worktree remove` 和 `git branch -d`
3. 报告清理结果

## 注意事项

- Worktree 目录固定在 `.claude/worktrees/` 下（已加入 .gitignore）
- 每个 worktree 会创建同名分支，基于 `origin/main`
- 完成开发后，在 worktree 里用 `/commit-push-pr` 提交 PR，然后用 `remove` 清理
