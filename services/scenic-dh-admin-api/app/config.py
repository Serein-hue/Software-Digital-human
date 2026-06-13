"""scenic-dh-admin-api 配置"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "scenic-dh-admin-api"
    SERVICE_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    DEBUG: bool = False

    # 数据库 — 与 business-api 共享 SQLite
    DATABASE_URL: str = "sqlite:///./scenic_business.db"

    # 上游服务
    BUSINESS_API_URL: str = "http://localhost:8001/v1"
    RAG_SERVICE_URL: str = "http://127.0.0.1:5010"
    FAY_RUNTIME_URL: str = "http://localhost:8005/internal/v1"

    # 鉴权
    INTERNAL_SERVICE_TOKEN: str = "svc-dev-token"
    ADMIN_TOKEN: str = "adm-dev-token"
    JWT_SECRET: str = "admin-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
