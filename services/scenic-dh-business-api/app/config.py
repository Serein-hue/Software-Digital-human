"""Configuration for scenic-dh-business-api."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "scenic-dh-business-api"
    SERVICE_VERSION: str = "1.0.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./scenic_business.db"

    RAG_SERVICE_URL: str = "http://127.0.0.1:5010"
    RAG_API_KEY: str = ""
    AVATAR_ORCHESTRATOR_URL: str = "http://localhost:8004/v1"

    SERVICE_TOKEN: str = "svc-dev-token"

    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "http://localhost:9000,http://127.0.0.1:9000"
    )

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    DEFAULT_SCENIC_ID: str = "SA-001"

    QWEATHER_API_KEY: str = ""
    QWEATHER_BASE_URL: str = "https://devapi.qweather.com/v7"
    WEATHER_LATITUDE: str = "31.433"
    WEATHER_LONGITUDE: str = "120.093"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
