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
    # Domen va HTTPS hali yo'q bo'lsa, prod'ni oddiy HTTP'da (Secure'siz cookie bilan)
    # ishga tushirishga ongli ruxsat. Parol va tokenlar shifrlanmagan holda uzatiladi.
    allow_insecure_http: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]
    media_root: str = "./media"
    media_accel_redirect: bool = False
    max_material_mb: int = 50
    max_submission_mb: int = 20
    max_library_mb: int = 50
    max_cover_mb: int = 5
    max_avatar_mb: int = 2
    contact_rate_limit: int = 5
    contact_rate_window_seconds: int = 3600
    # Sitemap va robots.txt dagi to'liq manzillar uchun (prod'da haqiqiy domen).
    public_base_url: str = "http://localhost:5173"
    login_rate_limit: int = 10
    login_rate_window_seconds: int = 900
    soffice_path: str = "soffice"
    conversion_timeout_seconds: int = 180
    # Asosiy matn provayderi: `compat` — OpenAI'ga mos API (Groq, Cerebras, OpenRouter...),
    # `gemini` — Google Gemini. Ikkinchisining kaliti bo'lsa, u zaxira bo'ladi.
    ai_provider: Literal["compat", "gemini", "fake"] = "gemini"
    gemini_api_key: str = ""
    gemini_model_chat: str = "gemini-3.5-flash"
    gemini_model_fast: str = "gemini-3.5-flash-lite"
    gemini_embedding_model: str = "gemini-embedding-001"
    gemini_rpm: int = Field(default=10, ge=1)
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_api_key: str = ""
    llm_model_chat: str = "openai/gpt-oss-120b"
    llm_model_fast: str = "openai/gpt-oss-20b"
    llm_rpm: int = Field(default=30, ge=1)
    # Embedding: `gemini` (API), `tei` (text-embeddings-inference konteyneri) yoki `local`
    # (jarayon ichida ONNX, alohida xizmatsiz; `app/ai/local_embed.py`).
    embedding_provider: Literal["gemini", "tei", "local"] = "gemini"
    tei_url: str = "http://embeddings:80"
    tei_model: str = "intfloat/multilingual-e5-base"
    local_embed_repo: str = "Xenova/multilingual-e5-base"
    local_embed_file: str = "onnx/model_quantized.onnx"
    local_embed_cache: str = "./models"
    local_embed_threads: int = Field(default=2, ge=1)
    ai_min_similarity: float = Field(default=0.55, ge=0, le=1)
    ai_hint_similarity: float = Field(default=0.85, ge=0, le=1)

    @property
    def is_prod(self) -> bool:
        return self.env == "prod"

    @property
    def ai_configured(self) -> bool:
        """AI ishlata oladimi: sinov provayderi yoki asosiy matn provayderining kaliti va
        embedding bor (embedding'siz tutor manba topa olmaydi)."""
        if self.ai_provider == "fake":
            return True
        if self.ai_provider == "compat":
            return bool(self.llm_api_key) and self.embeddings_configured
        return bool(self.gemini_api_key) and self.embeddings_configured

    @property
    def embeddings_configured(self) -> bool:
        return self.embedding_provider in ("tei", "local") or bool(self.gemini_api_key)

    @model_validator(mode="after")
    def _require_prod_secret(self) -> "Settings":
        if self.env == "prod" and self.jwt_secret == DEV_JWT_SECRET:
            raise ValueError("JWT_SECRET must be set in production")
        if self.env == "prod" and not self.cookie_secure and not self.allow_insecure_http:
            raise ValueError(
                "COOKIE_SECURE must be true in production (or set ALLOW_INSECURE_HTTP=true)"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
