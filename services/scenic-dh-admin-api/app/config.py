"""Configuration for scenic-dh-admin-api."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "scenic-dh-admin-api"
    SERVICE_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///../scenic-dh-business-api/scenic_business.db"

    BUSINESS_API_URL: str = "http://localhost:8001/v1"
    RAG_SERVICE_URL: str = "http://127.0.0.1:5010/api/v1"

    FAY_HTTP_URL: str = "http://127.0.0.1:5000"
    FAY_CORE_URL: str = "http://127.0.0.1:5000"
    FAY_MCP_URL: str = "http://127.0.0.1:5010"
    FAY_WS_URL: str = "ws://127.0.0.1:10000"

    INTERNAL_SERVICE_TOKEN: str = "svc-dev-token"
    RAG_API_KEY: str = ""
    ADMIN_TOKEN: str = ""
    ALLOW_LEGACY_ADMIN_TOKEN: bool = False
    JWT_EXPIRE_HOURS: int = 8
    ADMIN_BOOTSTRAP_USERNAME: str = "admin"
    ADMIN_BOOTSTRAP_PASSWORD: str = ""
    ADMIN_BOOTSTRAP_DISPLAY_NAME: str = "系统管理员"

    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "http://localhost:9000,http://127.0.0.1:9000"
    )

    LOG_LEVEL: str = "INFO"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
