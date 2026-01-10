#!/bin/bash
# Kimono AI Customer Service - 服务器安装脚本
# 使用方法: bash install.sh

set -e

echo "=================================================="
echo "Kimono AI Customer Service - 安装脚本"
echo "=================================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 安装目录
INSTALL_DIR="/opt/kimono-ai"
LOG_DIR="/var/log/kimono-ai"

# 检查是否 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误: 请使用 root 用户运行此脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/7] 更新系统包...${NC}"
apt-get update -qq

echo -e "${YELLOW}[2/7] 安装 Python 3.11...${NC}"
apt-get install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update -qq
apt-get install -y python3.11 python3.11-venv python3.11-dev

# 验证 Python 版本
python3.11 --version

echo -e "${YELLOW}[3/7] 创建安装目录...${NC}"
mkdir -p $INSTALL_DIR
mkdir -p $LOG_DIR
chown www-data:www-data $LOG_DIR

echo -e "${YELLOW}[4/7] 创建 Python 虚拟环境...${NC}"
cd $INSTALL_DIR
python3.11 -m venv venv
source venv/bin/activate

echo -e "${YELLOW}[5/7] 安装 Python 依赖...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${YELLOW}[6/7] 配置 Systemd 服务...${NC}"
cp deploy/systemd/kimono-ai.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable kimono-ai

echo -e "${YELLOW}[7/7] 配置 Nginx...${NC}"
cp deploy/nginx/kimono-ai.conf /etc/nginx/sites-available/
ln -sf /etc/nginx/sites-available/kimono-ai.conf /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

echo -e "${GREEN}=================================================="
echo "安装完成!"
echo "=================================================="
echo ""
echo "启动服务: systemctl start kimono-ai"
echo "查看状态: systemctl status kimono-ai"
echo "查看日志: tail -f /var/log/kimono-ai/app.log"
echo ""
echo "访问地址: http://$(hostname -I | awk '{print $1}'):8080"
echo "==================================================${NC}"
