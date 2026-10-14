from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_JWT_SECRET = "dev-only-secret-change-me-in-production-0000"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["dev", "test", "prod"] = "dev"
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    jwt_secret: str = DEV_JWT_SECRET
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    refresh_reuse_grace_seconds: int = Field(default=30, ge=0)
    cookie_secure: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]
    media_root: str = "./media"
    media_accel_redirect: bool = False
    max_material_mb: int = 50
    max_submission_mb: int = 20
    max_library_mb: int = 50
    max_cover_mb: int = 5
    contact_rate_limit: int = 5
    contact_rate_window_seconds: int = 3600
    # Sitemap va robots.txt dagi to'liq manzillar uchun (prod'da haqiqiy domen).
    public_base_url: str = "http://localhost:5173"
    login_rate_limit: int = 10
    login_rate_window_seconds: int = 900
    soffice_path: str = "soffice"
    conversion_timeout_seconds: int = 180
    ai_provider: Literal["gemini", "fake"] = "gemini"
    gemini_api_key: str = ""
    ai_model_chat: str = "gemini-2.5-flash"
    ai_model_fast: str = "gemini-2.5-flash-lite"
    ai_embedding_model: str = "gemini-embedding-001"
    ai_rpm: int = Field(default=10, ge=1)
    groq_api_key: str = ""
    groq_model_chat: str = "openai/gpt-oss-120b"
    groq_model_fast: str = "openai/gpt-oss-20b"
    groq_rpm: int = Field(default=30, ge=1)
    ai_min_similarity: float = Field(default=0.55, ge=0, le=1)
    ai_hint_similarity: float = Field(default=0.85, ge=0, le=1)

    @property
    def is_prod(self) -> bool:
        return self.env == "prod"

    @property
    def ai_configured(self) -> bool:
        """AI ishlata oladimi: sinov provayderi yoki Gemini kaliti bor."""
        return self.ai_provider == "fake" or bool(self.gemini_api_key)

    @model_validator(mode="after")
    def _require_prod_secret(self) -> "Settings":
        if self.env == "prod" and self.jwt_secret == DEV_JWT_SECRET:
            raise ValueError("JWT_SECRET must be set in production")
        if self.env == "prod" and not self.cookie_secure:
            raise ValueError("COOKIE_SECURE must be true in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
