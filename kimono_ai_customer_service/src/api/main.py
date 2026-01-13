"""
FastAPI Application
Kimono AI 客服系统 API 服务
"""
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError

# Add project paths
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / ".env")

from .routes import chat_router, knowledge_router, system_router
from .auth_routes import auth_router
from .learning_routes import learning_router
from .feedback_routes import feedback_review_router
from .tenant_routes import tenant_router
from .ops_routes import ops_router
from .dependencies import get_service_container

# 数据库
from database import init_database, close_database, get_database

# 学习调度器
from learning.scheduler import init_scheduler, get_scheduler, SchedulerConfig


# ========== Lifespan 管理 ==========

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化服务
    print("\n🚀 启动 Kimono AI 客服服务...")

    # 初始化数据库
    await init_database()

    # 初始化服务容器
    container = get_service_container()
    namespace = os.getenv("PINECONE_NAMESPACE", "")
    container.initialize(namespace=namespace)

    # 初始化并启动学习调度器
    try:
        db = get_database()
        vector_store = container.knowledge_base.vector_store if container.knowledge_base else None
        scheduler_config = SchedulerConfig(
            process_interval=300,  # 5 分钟处理一次反馈
            sync_interval=180,     # 3 分钟同步一次未同步的语料
            batch_size=100,
            auto_learn_enabled=True,
            auto_sync_enabled=True,
        )
        scheduler = init_scheduler(
            session_factory=db.session,
            vector_store=vector_store,
            config=scheduler_config,
        )
        await scheduler.start()
        print("✓ 学习调度器已启动")
    except Exception as e:
        print(f"⚠ 学习调度器启动失败: {e}")

    print("✓ 服务启动完成\n")

    yield

    # 关闭时清理资源
    print("\n👋 关闭服务...")

    # 停止调度器
    scheduler = get_scheduler()
    if scheduler:
        await scheduler.stop()

    await close_database()
    print("✓ 服务已关闭\n")


# ========== 创建应用 ==========

app = FastAPI(
    title="Kimono AI 客服系统",
    description="""
## 和服租赁智能客服 API

### 功能特性
- 🤖 基于 RAG 的智能问答
- 💬 多轮对话支持
- 🌏 多语言支持（中文/日语/英语）
- 📚 知识库检索

### 使用说明
1. 发送消息到 `/api/v1/chat/message` 获取回复
2. 使用 `conversation_id` 进行多轮对话
3. 通过 `/api/v1/knowledge/search` 搜索知识库

### 联系方式
- 官网: https://kimono.one
- 邮箱: support@kimono.one
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ========== 中间件配置 ==========

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录请求日志"""
    import time

    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    # 只记录 API 请求
    if request.url.path.startswith("/api"):
        print(f"[{request.method}] {request.url.path} - {response.status_code} - {process_time:.3f}s")

    response.headers["X-Process-Time"] = str(process_time)
    return response


# ========== 异常处理 ==========

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """验证错误处理"""
    return JSONResponse(
        status_code=422,
        content={
            "error": "ValidationError",
            "message": "请求参数验证失败",
            "detail": str(exc.errors()),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "服务器内部错误",
            "detail": str(exc) if os.getenv("DEBUG") else None,
        },
    )


# ========== 注册路由 ==========

# API v1 路由
app.include_router(auth_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(feedback_review_router, prefix="/api/v1")
app.include_router(learning_router, prefix="/api/v1")
app.include_router(tenant_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")
app.include_router(ops_router, prefix="/api/v1")

# 静态文件目录
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ========== 根路由 ==========

@app.get("/", tags=["根"])
async def root():
    """根路由 - 返回前端页面"""
    index_file = Path(__file__).parent.parent / "static" / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "service": "Kimono AI 客服系统",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/system/health",
    }


@app.get("/login", tags=["根"])
async def login_page():
    """登录页面"""
    login_file = Path(__file__).parent.parent / "static" / "login.html"
    if login_file.exists():
        return FileResponse(str(login_file))
    return {"error": "登录页面不存在"}


@app.get("/ops", tags=["根"])
async def ops_index():
    """运维中心首页"""
    ops_file = Path(__file__).parent.parent / "static" / "ops" / "index.html"
    if ops_file.exists():
        return FileResponse(str(ops_file))
    return {"error": "运维页面不存在"}


@app.get("/ping", tags=["根"])
async def ping():
    """心跳检测"""
    return {"status": "pong"}


# ========== 主入口 ==========

def run_server(host: str = "0.0.0.0", port: int = 8000, reload: bool = False):
    """运行服务器"""
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=reload,
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Kimono AI 客服 API 服务")
    parser.add_argument("--host", default="0.0.0.0", help="监听地址")
    parser.add_argument("--port", type=int, default=8000, help="监听端口")
    parser.add_argument("--reload", action="store_true", help="开发模式")

    args = parser.parse_args()
    run_server(host=args.host, port=args.port, reload=args.reload)
