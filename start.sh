#!/bin/bash

# 快速启动脚本
# 用途：检查环境并启动开发服务器

set -e

# 添加 Homebrew Node.js 到 PATH
export PATH="/opt/homebrew/opt/node@20/bin:/opt/homebrew/bin:$PATH"
export PNPM_HOME="$HOME/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

echo "🎌 江戸和装工房雅 - 启动开发服务器"
echo "======================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ 错误: pnpm 未安装${NC}"
    echo ""
    echo "请先运行安装脚本："
    echo "  ./setup.sh"
    echo ""
    echo "或手动安装："
    echo "  brew install pnpm"
    exit 1
fi

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 未找到 node_modules，正在安装依赖...${NC}"
    pnpm install
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
    echo ""
fi

# 检查 .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ 错误: 未找到 .env.local 文件${NC}"
    echo ""
    echo "请先配置环境变量："
    echo "  cp .env.example .env.local"
    echo "  然后编辑 .env.local 填入数据库信息"
    exit 1
fi

# 检查 Prisma 客户端
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${YELLOW}⚙️  正在生成 Prisma 客户端...${NC}"
    pnpm prisma generate
    echo -e "${GREEN}✓ Prisma 客户端生成完成${NC}"
    echo ""
fi

# 询问是否需要推送数据库 schema
echo -e "${BLUE}是否需要推送数据库 schema？(第一次运行或 schema 有更新时需要)${NC}"
echo -e "${YELLOW}这将应用标签系统的数据库迁移 (y/n):${NC} "
read -r PUSH_DB

if [ "$PUSH_DB" = "y" ] || [ "$PUSH_DB" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}🗄️  正在推送数据库 schema...${NC}"
    pnpm prisma db push
    echo -e "${GREEN}✓ 数据库 schema 推送完成${NC}"
    echo ""

    # 询问是否初始化标签系统
    echo -e "${BLUE}是否需要初始化标签系统 demo 数据？(y/n):${NC} "
    read -r SEED_TAGS

    if [ "$SEED_TAGS" = "y" ] || [ "$SEED_TAGS" = "Y" ]; then
        echo ""
        echo -e "${YELLOW}🌱 正在初始化标签系统...${NC}"
        pnpm tsx scripts/seed-tags-demo.ts
        echo -e "${GREEN}✓ 标签系统初始化完成${NC}"
        echo ""
    fi
fi

echo ""
echo "======================================"
echo -e "${GREEN}🚀 启动开发服务器...${NC}"
echo "======================================"
echo ""
echo -e "${BLUE}访问地址: http://localhost:3000${NC}"
echo -e "${BLUE}Prisma Studio: pnpm prisma studio${NC}"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止服务器${NC}"
echo ""

# 启动开发服务器
pnpm dev
