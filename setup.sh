#!/bin/bash

# 和服租赁平台 - 自动化设置脚本
# 用途：安装所有必要的依赖并启动开发环境

set -e  # 遇到错误立即退出

echo "🎌 江戸和装工房雅 - 开发环境设置"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检测操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "检测到操作系统: ${MACHINE}"
echo ""

# =====================================
# 1. 检查并安装 Homebrew (仅 macOS)
# =====================================
if [ "$MACHINE" = "Mac" ]; then
    echo "📦 步骤 1/6: 检查 Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}Homebrew 未安装，正在安装...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # 添加 Homebrew 到 PATH
        if [ -f "/opt/homebrew/bin/brew" ]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi

        echo -e "${GREEN}✓ Homebrew 安装完成${NC}"
    else
        echo -e "${GREEN}✓ Homebrew 已安装${NC}"
    fi
    echo ""
fi

# =====================================
# 2. 检查并安装 Node.js
# =====================================
echo "🟢 步骤 2/6: 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js 未安装，正在安装 Node.js v20...${NC}"

    if [ "$MACHINE" = "Mac" ]; then
        brew install node@20
        # 添加到 PATH
        echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
        export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
    elif [ "$MACHINE" = "Linux" ]; then
        # 使用 NodeSource 仓库
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    echo -e "${GREEN}✓ Node.js 安装完成${NC}"
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js 已安装 (${NODE_VERSION})${NC}"
fi
echo ""

# =====================================
# 3. 检查并安装 pnpm
# =====================================
echo "📦 步骤 3/6: 检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm 未安装，正在安装...${NC}"

    if [ "$MACHINE" = "Mac" ]; then
        brew install pnpm
    else
        npm install -g pnpm
    fi

    echo -e "${GREEN}✓ pnpm 安装完成${NC}"
else
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✓ pnpm 已安装 (v${PNPM_VERSION})${NC}"
fi
echo ""

# =====================================
# 4. 安装项目依赖
# =====================================
echo "📚 步骤 4/6: 安装项目依赖..."
pnpm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# =====================================
# 5. 配置环境变量
# =====================================
echo "⚙️  步骤 5/6: 配置环境变量..."
if [ ! -f .env.local ]; then
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo -e "${YELLOW}⚠️  已创建 .env.local 文件${NC}"
        echo -e "${YELLOW}⚠️  请编辑 .env.local 文件，填入你的数据库连接信息！${NC}"
    else
        echo -e "${RED}⚠️  未找到 .env.example 文件${NC}"
        echo -e "${YELLOW}创建默认 .env.local...${NC}"
        cat > .env.local << 'EOF'
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/kimono_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"

# Email (可选)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="江戸和装工房雅 <your-email@gmail.com>"

# AI Services (可选)
GOOGLE_AI_API_KEY=""
REPLICATE_API_TOKEN=""
EOF
        echo -e "${GREEN}✓ 已创建默认 .env.local${NC}"
        echo -e "${YELLOW}⚠️  请编辑此文件并填入你的实际配置！${NC}"
    fi
else
    echo -e "${GREEN}✓ .env.local 已存在${NC}"
fi
echo ""

# =====================================
# 6. 数据库设置
# =====================================
echo "🗄️  步骤 6/6: 数据库设置..."
echo -e "${YELLOW}正在生成 Prisma 客户端...${NC}"
pnpm prisma generate
echo -e "${GREEN}✓ Prisma 客户端生成完成${NC}"

echo ""
echo -e "${YELLOW}是否要立即推送数据库 schema 并初始化标签系统？(y/n)${NC}"
read -r SETUP_DB

if [ "$SETUP_DB" = "y" ] || [ "$SETUP_DB" = "Y" ]; then
    echo "推送数据库 schema..."
    pnpm prisma db push

    echo "初始化标签系统 demo 数据..."
    pnpm tsx scripts/seed-tags-demo.ts

    echo -e "${GREEN}✓ 数据库设置完成${NC}"
else
    echo -e "${YELLOW}跳过数据库设置${NC}"
    echo "稍后可以手动运行："
    echo "  pnpm prisma db push"
    echo "  pnpm tsx scripts/seed-tags-demo.ts"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ 设置完成！${NC}"
echo "=================================="
echo ""
echo "📋 下一步："
echo ""
echo "1. 编辑 .env.local 文件，配置数据库连接"
echo "   vi .env.local"
echo ""
echo "2. 如果还没运行数据库设置，执行："
echo "   pnpm prisma db push"
echo "   pnpm tsx scripts/seed-tags-demo.ts"
echo ""
echo "3. 启动开发服务器："
echo "   pnpm dev"
echo ""
echo "4. 打开浏览器访问："
echo "   http://localhost:3000"
echo ""
echo "5. 查看 Prisma Studio (数据库可视化)："
echo "   pnpm prisma studio"
echo ""
echo "📚 文档："
echo "   - 快速启动: QUICK_START.md"
echo "   - 标签系统 Demo: docs/TAG_SYSTEM_DEMO.md"
echo "   - API 文档: docs/TAG_SYSTEM_API_IMPLEMENTATION.md"
echo ""
echo -e "${GREEN}祝开发愉快！🎉${NC}"
