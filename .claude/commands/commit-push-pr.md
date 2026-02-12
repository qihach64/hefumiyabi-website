---
name: commit-push-pr
description: Commit, push, and open a PR
argument-hint: "[可选: PR 标题]"
---

# Commit, Push, and Open a PR

当前分支和变更状态已预计算：

## 预计算上下文

**当前分支:**
!`git branch --show-current`

**最近 commit 风格:**
!`git log --oneline -5`

**变更摘要:**
!`git diff --stat`

**未追踪文件:**
!`git ls-files --others --exclude-standard`

## 步骤

### 1. 检查

- 如果当前在 `main` 分支，先创建新分支（根据变更内容命名，如 `fix/xxx` 或 `feat/xxx`）
- 如果没有任何变更，告知用户并停止

### 2. 暂存 + 提交

- 用 `git add` 添加相关文件（**不要**添加 `.env*`、credentials 等敏感文件）
- 生成 commit 信息，格式: `feat|fix|docs|test|refactor|ci(scope): 中文描述`
- 用 HEREDOC 格式写 commit message，末尾加 `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

### 3. 推送

- `git push -u origin <当前分支>`

### 4. 创建 PR

- 如果用户提供了 `$ARGUMENTS`，作为 PR 标题
- 否则根据 commit 信息生成简短 PR 标题（< 70 字符）
- 用 `gh pr create` 创建 PR，body 格式：

```
## Summary
<1-3 bullet points>

## Test plan
<bulleted checklist>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- base 分支: `main`

### 5. 输出

完成后报告:

- commit 信息
- PR 链接
