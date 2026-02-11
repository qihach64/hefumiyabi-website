---
name: sync
description: 同步代码到 GitHub (add → commit → push)
argument-hint: "[可选: commit 信息]"
---

# 同步到 GitHub

将当前变更提交并推送到 GitHub。

## 步骤

### 1. 检查状态

并行运行:
- `git status` 查看变更文件
- `git diff --stat` 查看变更摘要
- `git log --oneline -3` 查看最近提交风格

如果没有任何变更，告知用户并停止。

### 2. 暂存文件

- 根据变更内容，用 `git add` 添加相关文件
- **不要** 添加 `.env*`、`credentials`、`node_modules` 等敏感/无关文件
- 如果有不确定是否该提交的文件，询问用户

### 3. 提交

- 如果用户提供了 `$ARGUMENTS` 作为 commit 信息，直接使用
- 如果没有提供，根据变更内容生成 commit 信息
- 格式遵循: `feat|fix|docs|test|refactor(scope): 中文描述`
- 用 HEREDOC 格式写 commit message

### 4. 推送

- `git push origin <当前分支>`
- 如果远程没有该分支，用 `git push -u origin <当前分支>`
- 推送成功后显示结果摘要

## 输出

完成后简要报告:
- 提交了哪些文件
- commit 信息
- 推送到哪个分支
