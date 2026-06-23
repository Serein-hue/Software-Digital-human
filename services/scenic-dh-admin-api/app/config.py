"""scenic-dh-admin-api 配置"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "scenic-dh-admin-api"
    SERVICE_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8002
    DEBUG: bool = False

    # 上游服务
    BUSINESS_API_URL: str = "http://localhost:8001/v1"
    RAG_SERVICE_URL: str = "http://127.0.0.1:5010/api/v1"

    # Fay 数字人运行时（标准部署端口）
    FAY_HTTP_URL: str = "http://127.0.0.1:5000"       # Fay GUI / core HTTP
    FAY_CORE_URL: str = "http://127.0.0.1:5000"       # Fay GUI / core HTTP（同 FAY_HTTP_URL）
    FAY_MCP_URL: str = "http://127.0.0.1:5010"        # Fay MCP 管理服务（与 RAG 同端口复用）
    FAY_WS_URL: str = "ws://127.0.0.1:10000"          # Fay WebSocket

    # 内部服务 token
    INTERNAL_SERVICE_TOKEN: str = "svc-dev-token"
    ADMIN_TOKEN: str = "adm-dev-token"

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
