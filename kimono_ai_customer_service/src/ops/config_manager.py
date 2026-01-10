"""
Config Manager
系统配置管理服务

提供配置的查询、更新和重置功能
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_


from database.models import SystemConfig


class ConfigCategory(str, Enum):
    """配置分类"""
    API = "api"
    SCHEDULER = "scheduler"
    ALERT = "alert"
    SECURITY = "security"


# 默认配置
DEFAULT_CONFIGS: Dict[str, Dict[str, Dict[str, Any]]] = {
    ConfigCategory.API.value: {
        "dashscope_model": {
            "value": "qwen-plus",
            "description": "DashScope 对话模型",
            "is_sensitive": False,
        },
        "embedding_model": {
            "value": "text-embedding-v2",
            "description": "向量嵌入模型",
            "is_sensitive": False,
        },
        "max_tokens": {
            "value": 1024,
            "description": "生成回复的最大 token 数",
            "is_sensitive": False,
        },
        "temperature": {
            "value": 0.7,
            "description": "生成温度（0-1）",
            "is_sensitive": False,
        },
        "top_k": {
            "value": 5,
            "description": "向量检索返回数量",
            "is_sensitive": False,
        },
    },
    ConfigCategory.SCHEDULER.value: {
        "sync_interval": {
            "value": 300,
            "description": "同步间隔（秒）",
            "is_sensitive": False,
        },
        "batch_size": {
            "value": 50,
            "description": "批处理大小",
            "is_sensitive": False,
        },
        "max_retries": {
            "value": 3,
            "description": "最大重试次数",
            "is_sensitive": False,
        },
        "enabled": {
            "value": True,
            "description": "是否启用调度器",
            "is_sensitive": False,
        },
    },
    ConfigCategory.ALERT.value: {
        "error_rate_threshold": {
            "value": 10.0,
            "description": "错误率告警阈值（%）",
            "is_sensitive": False,
        },
        "latency_threshold": {
            "value": 5000,
            "description": "延迟告警阈值（毫秒）",
            "is_sensitive": False,
        },
        "queue_size_threshold": {
            "value": 1000,
            "description": "队列大小告警阈值",
            "is_sensitive": False,
        },
        "notification_email": {
            "value": "",
            "description": "告警通知邮箱",
            "is_sensitive": False,
        },
    },
    ConfigCategory.SECURITY.value: {
        "ops_session_timeout": {
            "value": 3600,
            "description": "运维会话超时时间（秒）",
            "is_sensitive": False,
        },
        "max_login_attempts": {
            "value": 5,
            "description": "最大登录尝试次数",
            "is_sensitive": False,
        },
        "lockout_duration": {
            "value": 900,
            "description": "锁定时长（秒）",
            "is_sensitive": False,
        },
        "allowed_ips": {
            "value": [],
            "description": "允许访问的 IP 列表（空表示不限制）",
            "is_sensitive": False,
        },
    },
}


@dataclass
class ConfigItem:
    """配置项"""
    category: str
    key: str
    value: Any
    description: Optional[str]
    is_sensitive: bool
    updated_at: Optional[datetime]


@dataclass
class ConfigCategoryInfo:
    """配置分类信息"""
    category: str
    name: str
    description: str
    items: List[ConfigItem]


class ConfigManager:
    """配置管理器"""

    CATEGORY_NAMES = {
        ConfigCategory.API.value: "API 配置",
        ConfigCategory.SCHEDULER.value: "调度器配置",
        ConfigCategory.ALERT.value: "告警配置",
        ConfigCategory.SECURITY.value: "安全配置",
    }

    CATEGORY_DESCRIPTIONS = {
        ConfigCategory.API.value: "管理 AI 服务和向量数据库的 API 配置",
        ConfigCategory.SCHEDULER.value: "管理知识库同步调度器配置",
        ConfigCategory.ALERT.value: "管理系统告警阈值和通知配置",
        ConfigCategory.SECURITY.value: "管理运维中心安全配置",
    }

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_categories(self) -> List[Dict[str, str]]:
        """获取所有配置分类"""
        return [
            {
                "category": cat,
                "name": self.CATEGORY_NAMES.get(cat, cat),
                "description": self.CATEGORY_DESCRIPTIONS.get(cat, ""),
            }
            for cat in ConfigCategory
        ]

    async def get_config(self, category: str) -> ConfigCategoryInfo:
        """获取指定分类的配置"""
        # 从数据库获取已设置的配置
        query = select(SystemConfig).where(SystemConfig.category == category)
        result = await self.db.execute(query)
        db_configs = {cfg.key: cfg for cfg in result.scalars().all()}

        # 获取默认配置
        default_configs = DEFAULT_CONFIGS.get(category, {})

        # 合并配置
        items = []
        for key, default in default_configs.items():
            if key in db_configs:
                cfg = db_configs[key]
                items.append(ConfigItem(
                    category=category,
                    key=key,
                    value=cfg.value if not cfg.is_sensitive else "******",
                    description=cfg.description or default.get("description"),
                    is_sensitive=cfg.is_sensitive,
                    updated_at=cfg.updated_at,
                ))
            else:
                items.append(ConfigItem(
                    category=category,
                    key=key,
                    value=default["value"],
                    description=default.get("description"),
                    is_sensitive=default.get("is_sensitive", False),
                    updated_at=None,
                ))

        return ConfigCategoryInfo(
            category=category,
            name=self.CATEGORY_NAMES.get(category, category),
            description=self.CATEGORY_DESCRIPTIONS.get(category, ""),
            items=items,
        )

    async def get_config_value(
        self,
        category: str,
        key: str,
        default: Any = None,
    ) -> Any:
        """获取单个配置值"""
        query = select(SystemConfig).where(
            and_(
                SystemConfig.category == category,
                SystemConfig.key == key
            )
        )
        result = await self.db.execute(query)
        cfg = result.scalar_one_or_none()

        if cfg:
            return cfg.value

        # 返回默认值
        default_configs = DEFAULT_CONFIGS.get(category, {})
        if key in default_configs:
            return default_configs[key]["value"]

        return default

    async def update_config(
        self,
        category: str,
        updates: Dict[str, Any],
    ) -> List[ConfigItem]:
        """更新配置"""
        updated_items = []

        for key, value in updates.items():
            # 检查是否为有效配置键
            default_configs = DEFAULT_CONFIGS.get(category, {})
            if key not in default_configs:
                continue

            # 查找现有配置
            query = select(SystemConfig).where(
                and_(
                    SystemConfig.category == category,
                    SystemConfig.key == key
                )
            )
            result = await self.db.execute(query)
            cfg = result.scalar_one_or_none()

            default = default_configs[key]

            if cfg:
                # 更新现有配置
                cfg.value = value
                cfg.updated_at = datetime.now(timezone.utc)
            else:
                # 创建新配置
                cfg = SystemConfig(
                    category=category,
                    key=key,
                    value=value,
                    description=default.get("description"),
                    is_sensitive=default.get("is_sensitive", False),
                )
                self.db.add(cfg)

            updated_items.append(ConfigItem(
                category=category,
                key=key,
                value=value if not cfg.is_sensitive else "******",
                description=cfg.description,
                is_sensitive=cfg.is_sensitive,
                updated_at=cfg.updated_at,
            ))

        await self.db.commit()
        return updated_items

    async def reset_config(self, category: str) -> bool:
        """重置指定分类的配置为默认值"""
        query = select(SystemConfig).where(SystemConfig.category == category)
        result = await self.db.execute(query)
        configs = result.scalars().all()

        for cfg in configs:
            await self.db.delete(cfg)

        await self.db.commit()
        return True

    async def reset_config_key(self, category: str, key: str) -> bool:
        """重置单个配置键为默认值"""
        query = select(SystemConfig).where(
            and_(
                SystemConfig.category == category,
                SystemConfig.key == key
            )
        )
        result = await self.db.execute(query)
        cfg = result.scalar_one_or_none()

        if cfg:
            await self.db.delete(cfg)
            await self.db.commit()

        return True

    async def initialize_defaults(self) -> int:
        """初始化默认配置（仅当配置表为空时）"""
        # 检查是否已有配置
        query = select(SystemConfig).limit(1)
        result = await self.db.execute(query)
        if result.scalar_one_or_none():
            return 0

        # 创建所有默认配置
        count = 0
        for category, configs in DEFAULT_CONFIGS.items():
            for key, default in configs.items():
                cfg = SystemConfig(
                    category=category,
                    key=key,
                    value=default["value"],
                    description=default.get("description"),
                    is_sensitive=default.get("is_sensitive", False),
                )
                self.db.add(cfg)
                count += 1

        await self.db.commit()
        return count
