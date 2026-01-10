# Kimono AI Customer Service

和服租赁平台智能客服系统 - 基于 RAG (Retrieval-Augmented Generation) 的多语言客服解决方案。

## 功能特性

- **智能问答**: 基于 RAG 技术的智能客服，结合知识库检索和大语言模型生成回答
- **多语言支持**: 支持日语、繁体中文、简体中文、英语自动检测和回复
- **智能路由**: Qwen-Plus (80%) / Qwen-Max (20%) 双模型路由策略
- **多轮对话**: 支持上下文感知的多轮对话管理
- **知识库管理**: 基于 Pinecone 向量数据库的 FAQ 知识库
- **RESTful API**: 完整的 FastAPI 服务，提供 OpenAPI 文档

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (FastAPI)                     │
├─────────────────────────────────────────────────────────────┤
│  /chat/message    /knowledge/search    /system/health       │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      RAG Chain                               │
├─────────────────────────────────────────────────────────────┤
│  Query → Retrieve → Augment → Generate → Response           │
└───────┬───────────────────┬─────────────────────────────────┘
        │                   │
┌───────▼───────┐   ┌───────▼───────┐
│ Knowledge Base │   │   QwenLLM     │
│  (Pinecone)    │   │ (DashScope)   │
└────────────────┘   └───────────────┘
```

## 快速开始

### 环境要求

- Python 3.12+
- Docker & Docker Compose (可选)

### 安装

1. **克隆项目**

```bash
cd kimono_ai_customer_service
```

2. **配置环境变量**

```bash
cp .env.example .env
# 编辑 .env 文件，填写 API 密钥
```

必需的环境变量：
- `DASHSCOPE_API_KEY`: 阿里云 DashScope API 密钥
- `PINECONE_API_KEY`: Pinecone API 密钥

3. **安装依赖**

```bash
pip install -r requirements.txt
```

### 启动服务

#### 方式一：本地开发模式

```bash
./scripts/deploy.sh start
# 或手动启动
cd src && python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 方式二：Docker 部署

```bash
# 构建镜像
./scripts/deploy.sh build

# 启动容器
./scripts/deploy.sh up

# 查看日志
./scripts/deploy.sh logs

# 停止容器
./scripts/deploy.sh down
```

### 验证服务

```bash
# 健康检查
curl http://localhost:8000/api/v1/system/health

# 发送消息
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "和服のサイズはどうなっていますか？"}'
```

## API 文档

启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 主要接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/chat/message` | POST | 发送消息获取回复 |
| `/api/v1/chat/history/{conversation_id}` | GET | 获取对话历史 |
| `/api/v1/chat/feedback` | POST | 提交反馈 |
| `/api/v1/knowledge/search` | POST | 搜索知识库 |
| `/api/v1/knowledge/stats` | GET | 知识库统计 |
| `/api/v1/system/health` | GET | 健康检查 |
| `/api/v1/system/stats` | GET | 系统统计 |

### 请求示例

**发送消息**

```json
POST /api/v1/chat/message
{
  "message": "和服のレンタル料金を教えてください",
  "conversation_id": "conv-abc123"
}
```

**响应**

```json
{
  "answer": "和服のレンタル料金は...",
  "conversation_id": "conv-abc123",
  "message_id": "msg-xyz789",
  "sources": [
    {
      "question": "和服のレンタル料金は？",
      "answer": "...",
      "score": 0.95,
      "category": "pricing"
    }
  ],
  "model_used": "qwen-plus",
  "language": "ja",
  "confidence": 0.92,
  "latency_ms": 1234
}
```

## 项目结构

```
kimono_ai_customer_service/
├── src/
│   ├── api/                    # API 服务层
│   │   ├── main.py            # FastAPI 应用
│   │   ├── routes.py          # 路由定义
│   │   ├── models.py          # 请求/响应模型
│   │   └── dependencies.py    # 依赖注入
│   ├── knowledge/              # 知识库模块
│   │   ├── faq_processor.py   # FAQ 处理器
│   │   ├── embedding.py       # 向量嵌入
│   │   ├── vector_store.py    # Pinecone 向量存储
│   │   └── knowledge_base.py  # 知识库管理
│   └── rag/                    # RAG 核心模块
│       ├── llm.py             # Qwen LLM 封装
│       ├── prompts.py         # 提示词模板
│       ├── conversation.py    # 对话管理
│       └── chain.py           # RAG 链
├── tests/                      # 测试
│   ├── conftest.py            # 测试配置
│   ├── test_knowledge.py      # 知识库测试
│   ├── test_rag.py            # RAG 测试
│   ├── test_api.py            # API 测试
│   └── test_performance.py    # 性能测试
├── scripts/                    # 脚本
│   ├── deploy.sh              # 部署脚本
│   └── gate*_verification.py  # 验收脚本
├── data/
│   ├── raw/                   # 原始数据
│   └── processed/             # 处理后数据
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 开发

### 运行测试

```bash
# 运行所有测试
python -m pytest tests/ -v

# 运行特定测试
python -m pytest tests/test_api.py -v

# 运行并显示覆盖率
python -m pytest tests/ -v --cov=src
```

### 部署脚本命令

```bash
./scripts/deploy.sh check      # 检查环境配置
./scripts/deploy.sh install    # 安装依赖
./scripts/deploy.sh test       # 运行测试
./scripts/deploy.sh start      # 启动本地服务 (开发模式)
./scripts/deploy.sh prod       # 启动生产服务
./scripts/deploy.sh build      # 构建 Docker 镜像
./scripts/deploy.sh up         # 启动 Docker 容器
./scripts/deploy.sh down       # 停止 Docker 容器
./scripts/deploy.sh logs       # 查看 Docker 日志
```

## 配置说明

### 环境变量

| 变量名 | 必需 | 默认值 | 描述 |
|--------|------|--------|------|
| `DASHSCOPE_API_KEY` | 是 | - | DashScope API 密钥 |
| `PINECONE_API_KEY` | 是 | - | Pinecone API 密钥 |
| `PINECONE_INDEX` | 否 | `kimono-faq-index` | Pinecone 索引名 |
| `PINECONE_NAMESPACE` | 否 | - | Pinecone 命名空间 |
| `DEBUG` | 否 | `false` | 调试模式 |
| `LOG_LEVEL` | 否 | `INFO` | 日志级别 |
| `PORT` | 否 | `8000` | 服务端口 |
| `HOST` | 否 | `0.0.0.0` | 服务主机 |

### 模型配置

系统使用智能路由策略：
- **Qwen-Plus**: 80% 请求，适用于常规问答
- **Qwen-Max**: 20% 请求，适用于复杂问题

## 技术栈

- **Web 框架**: FastAPI
- **LLM**: 阿里云 DashScope (Qwen-Plus/Qwen-Max)
- **向量数据库**: Pinecone
- **嵌入模型**: DashScope text-embedding-v3
- **容器化**: Docker, Docker Compose
- **测试**: pytest, pytest-asyncio

## 开发阶段

- **Phase 1**: 数据处理模块开发 ✅
- **Phase 2**: 知识库构建 ✅
- **Phase 3**: RAG 核心系统开发 ✅
- **Phase 4**: API 服务层开发 ✅
- **Phase 5**: 测试 ✅
- **Phase 6**: 部署与文档 ✅

## API 密钥获取

| 服务 | 获取地址 |
|------|----------|
| 阿里云 DashScope | https://dashscope.console.aliyun.com/ |
| Pinecone | https://www.pinecone.io/ |

## License

MIT License
