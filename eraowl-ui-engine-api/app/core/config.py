"""Centralised configuration via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://eraowl:eraowl@localhost:5432/eraowl_ui_engine"
    DATABASE_ECHO: bool = False

    # ── Redis ────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT / Auth ───────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── Telemetry ────────────────────────────────────────────────────────────
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = None
    OTEL_SERVICE_NAME: str = "eraowl-ui-engine-api"

    # ── Codegen ──────────────────────────────────────────────────────────────
    TARGET_PROJECT_ROOT: str = "/u01/eraowl-ops"
    CODEGEN_SANDBOX_DIR: str = "/tmp/codegen_sandbox"

    # ── AI Provider ─────────────────────────────────────────────────────────
    AI_PROVIDER: str = "openrouter"
    AI_API_KEY: str = ""
    AI_MODEL: str = "deepseek/deepseek-v4-flash"
    AI_BASE_URL: str = "https://openrouter.ai/api/v1"
    AI_MAX_TOKENS: int = 4096
    AI_TEMPERATURE: float = 0.7
    AI_TIMEOUT: int = 120

    # ── AI Fallback Provider ────────────────────────────────────────────────
    AI_FALLBACK_PROVIDER: str | None = None
    AI_FALLBACK_API_KEY: str = ""
    AI_FALLBACK_MODEL: str | None = None
    AI_FALLBACK_BASE_URL: str = ""
    """Base URL for the fallback AI provider. If empty, falls back to the
    primary ``AI_BASE_URL`` (which means the fallback only helps if the
    primary API key or model is the problem, not if the service endpoint
    itself is unreachable). Set this to a different provider's endpoint
    for true geographic/network-level redundancy."""

    # ── AI Feature Flags ────────────────────────────────────────────────────
    AI_CODEGEN_ENABLED: bool = True
    AI_LAYOUT_SUGGESTIONS: bool = True
    AI_COMPONENT_DISCOVERY: bool = True

    # ── Logging ──────────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
