from datetime import datetime

from pydantic import AwareDatetime, BaseModel, Field

from app.core.types import trimmed_str
from app.learning.schemas import SLUG_PATTERN

# --- yangiliklar ----------------------------------------------------------------------------


class NewsIn(BaseModel):
    title: trimmed_str(max_length=300)  # type: ignore[valid-type]
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    body: str = Field(default="", max_length=50000)
    published_at: AwareDatetime | None = None


class NewsUpdate(BaseModel):
    """`published_at: null` aniq yuborilsa — yangilik nashrdan olinadi (qoralamaga qaytadi)."""

    title: trimmed_str(max_length=300) | None = None  # type: ignore[valid-type]
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    body: str | None = Field(default=None, max_length=50000)
    published_at: AwareDatetime | None = None


class NewsCard(BaseModel):
    id: int
    title: str
    slug: str
    excerpt: str
    has_cover: bool
    published_at: datetime | None
    views: int


class NewsOut(NewsCard):
    body: str


class NewsAdminOut(NewsOut):
    created_at: datetime
    updated_at: datetime


class NewsPage(BaseModel):
    items: list[NewsCard]
    total: int
    page: int
    size: int
