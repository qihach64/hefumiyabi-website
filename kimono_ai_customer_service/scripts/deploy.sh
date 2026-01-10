#!/bin/bash
# Kimono AI Customer Service 部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的环境变量
check_env() {
    print_info "检查环境变量..."

    if [ ! -f .env ]; then
        print_error ".env 文件不存在"
        print_info "请复制 .env.example 为 .env 并填写配置"
        exit 1
    fi

    source .env

    if [ -z "$DASHSCOPE_API_KEY" ]; then
        print_error "DASHSCOPE_API_KEY 未设置"
        exit 1
    fi

    if [ -z "$PINECONE_API_KEY" ]; then
        print_error "PINECONE_API_KEY 未设置"
        exit 1
    fi

    print_info "环境变量检查通过 ✓"
}

# 安装依赖
install_deps() {
    print_info "安装 Python 依赖..."
    pip install -r requirements.txt
    print_info "依赖安装完成 ✓"
}

# 运行测试
run_tests() {
    print_info "运行测试..."
    python -m pytest tests/ -v --tb=short
    print_info "测试通过 ✓"
}

# 启动服务 (本地)
start_local() {
    print_info "启动本地服务..."
    cd src
    python -m uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000} --reload
}

# 启动服务 (生产)
start_prod() {
    print_info "启动生产服务..."
    cd src
    python -m uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4
}

# Docker 构建
docker_build() {
    print_info "构建 Docker 镜像..."
    docker build -t kimono-ai-customer-service:latest .
    print_info "Docker 镜像构建完成 ✓"
}

# Docker 启动
docker_start() {
    print_info "启动 Docker 容器..."
    docker-compose up -d
    print_info "容器启动完成 ✓"
    print_info "服务地址: http://localhost:8000"
    print_info "API 文档: http://localhost:8000/docs"
}

# Docker 停止
docker_stop() {
    print_info "停止 Docker 容器..."
    docker-compose down
    print_info "容器已停止 ✓"
}

# Docker 日志
docker_logs() {
    docker-compose logs -f
}

# 显示帮助
show_help() {
    echo "Kimono AI Customer Service 部署脚本"
    echo ""
    echo "用法: ./deploy.sh [命令]"
    echo ""
    echo "命令:"
    echo "  check       检查环境配置"
    echo "  install     安装依赖"
    echo "  test        运行测试"
    echo "  start       启动本地服务 (开发模式)"
    echo "  prod        启动生产服务"
    echo "  build       构建 Docker 镜像"
    echo "  up          启动 Docker 容器"
    echo "  down        停止 Docker 容器"
    echo "  logs        查看 Docker 日志"
    echo "  help        显示帮助"
    echo ""
}

# 主入口
case "$1" in
    check)
        check_env
        ;;
    install)
        install_deps
        ;;
    test)
        run_tests
        ;;
    start)
        check_env
        start_local
        ;;
    prod)
        check_env
        start_prod
        ;;
    build)
        docker_build
        ;;
    up)
        check_env
        docker_start
        ;;
    down)
        docker_stop
        ;;
    logs)
        docker_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "未知命令: $1"
        show_help
        exit 1
        ;;
esac
