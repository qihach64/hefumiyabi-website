"""
Configuration settings for Kimono AI Customer Service
"""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Project paths
    project_root: Path = Field(default_factory=lambda: Path(__file__).parent.parent)

    # DashScope (Qwen) API
    dashscope_api_key: str = Field(default="", env="DASHSCOPE_API_KEY")
    qwen_primary_model: str = Field(default="qwen-plus", env="QWEN_PRIMARY_MODEL")
    qwen_advanced_model: str = Field(default="qwen-max", env="QWEN_ADVANCED_MODEL")

    # Pinecone
    pinecone_api_key: str = Field(default="", env="PINECONE_API_KEY")
    pinecone_index: str = Field(default="kimono-faq-index", env="PINECONE_INDEX")
    pinecone_environment: str = Field(default="us-east-1", env="PINECONE_ENVIRONMENT")

    # Data paths
    instagram_data_path: str = Field(default="../inbox", env="INSTAGRAM_DATA_PATH")
    line_data_path: str = Field(default="../LINE2024-2025", env="LINE_DATA_PATH")

    # Server settings
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    debug: bool = Field(default=True, env="DEBUG")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def instagram_path(self) -> Path:
        """Get absolute path to Instagram data"""
        path = Path(self.instagram_data_path)
        if not path.is_absolute():
            path = self.project_root / path
        return path.resolve()

    @property
    def line_path(self) -> Path:
        """Get absolute path to LINE data"""
        path = Path(self.line_data_path)
        if not path.is_absolute():
            path = self.project_root / path
        return path.resolve()

    @property
    def data_dir(self) -> Path:
        """Get data directory path"""
        return self.project_root / "data"

    @property
    def processed_dir(self) -> Path:
        """Get processed data directory path"""
        return self.data_dir / "processed"

    @property
    def knowledge_base_dir(self) -> Path:
        """Get knowledge base directory path"""
        return self.data_dir / "knowledge_base"


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get settings instance"""
    return settings
