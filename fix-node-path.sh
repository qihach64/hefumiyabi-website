#!/bin/bash

# 修复 Node.js PATH 问题

echo "🔧 修复 Node.js PATH 配置..."
echo ""

# 检测 shell
SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

# 添加 Node.js 到 PATH
NODE_PATH="/opt/homebrew/opt/node@20/bin"
PNPM_PATH="$HOME/Library/pnpm"

if [ -n "$SHELL_RC" ]; then
    echo "添加 Node.js 到 $SHELL_RC..."

    # 检查是否已经添加
    if ! grep -q "node@20/bin" "$SHELL_RC" 2>/dev/null; then
        echo "" >> "$SHELL_RC"
        echo "# Node.js v20" >> "$SHELL_RC"
        echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> "$SHELL_RC"
        echo "✓ 已添加 Node.js PATH"
    else
        echo "✓ Node.js PATH 已存在"
    fi

    # 添加 pnpm
    if ! grep -q "Library/pnpm" "$SHELL_RC" 2>/dev/null; then
        echo "" >> "$SHELL_RC"
        echo "# pnpm" >> "$SHELL_RC"
        echo 'export PNPM_HOME="$HOME/Library/pnpm"' >> "$SHELL_RC"
        echo 'case ":$PATH:" in' >> "$SHELL_RC"
        echo '  *":$PNPM_HOME:"*) ;;' >> "$SHELL_RC"
        echo '  *) export PATH="$PNPM_HOME:$PATH" ;;' >> "$SHELL_RC"
        echo 'esac' >> "$SHELL_RC"
        echo "✓ 已添加 pnpm PATH"
    else
        echo "✓ pnpm PATH 已存在"
    fi
fi

echo ""
echo "✅ PATH 配置完成！"
echo ""
echo "请运行以下命令使配置生效："
echo ""
if [ -n "$ZSH_VERSION" ]; then
    echo "  source ~/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    echo "  source ~/.bashrc"
fi
echo ""
echo "或者关闭并重新打开终端"
echo ""
echo "然后运行："
echo "  node --version"
echo "  pnpm --version"
echo "  ./start.sh"
