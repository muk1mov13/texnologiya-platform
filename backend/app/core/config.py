from functools import lru_cache
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_JWT_SECRET = "dev-only-secret-change-me-in-production-0000"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["dev", "test", "prod"] = "dev"
    database_url: str = "sqlite+aiosqlite:///./dev.db"
    jwt_secret: str = DEV_JWT_SECRET
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    refresh_reuse_grace_seconds: int = 30
    cookie_secure: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]
    media_root: str = "./media"
    media_accel_redirect: bool = False
    max_material_mb: int = 50
    login_rate_limit: int = 10
    login_rate_window_seconds: int = 900
    soffice_path: str = "soffice"
    conversion_timeout_seconds: int = 180

    @property
    def is_prod(self) -> bool:
        return self.env == "prod"

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
