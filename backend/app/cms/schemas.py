from datetime import datetime

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator

from app.core.types import Order31, trimmed_str
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


# --- FAQ -------------------------------------------------------------------------------------


class FaqIn(BaseModel):
    question: trimmed_str(max_length=500)  # type: ignore[valid-type]
    answer: trimmed_str(max_length=5000)  # type: ignore[valid-type]
    order: Order31 = 0
    is_published: bool = True


class FaqUpdate(BaseModel):
    question: trimmed_str(max_length=500) | None = None  # type: ignore[valid-type]
    answer: trimmed_str(max_length=5000) | None = None  # type: ignore[valid-type]
    order: Order31 | None = None
    is_published: bool | None = None


class FaqOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question: str
    answer: str
    order: int
    is_published: bool


# --- sayt sozlamalari ------------------------------------------------------------------------


class Contacts(BaseModel):
    phone: str = Field(default="", max_length=50)
    email: str = Field(default="", max_length=150)
    address: str = Field(default="", max_length=300)


class Socials(BaseModel):
    telegram: str = Field(default="", max_length=300)
    instagram: str = Field(default="", max_length=300)
    facebook: str = Field(default="", max_length=300)
    youtube: str = Field(default="", max_length=300)

    @field_validator("telegram", "instagram", "facebook", "youtube")
    @classmethod
    def _https_only(cls, value: str) -> str:
        # Havola saytda <a href> bo'lib chiqadi: `javascript:` va boshqa sxemalar qabul qilinmaydi.
        value = value.strip()
        if value and not value.startswith("https://"):
            raise ValueError("Havola https:// bilan boshlanishi kerak")
        return value


class SiteOut(BaseModel):
    contacts: Contacts = Field(default_factory=Contacts)
    socials: Socials = Field(default_factory=Socials)
    about: str = ""


class SiteUpdate(BaseModel):
    """Faqat yuborilgan bo'limlar almashtiriladi; noma'lum kalit — 422 (`extra="forbid"`)."""

    model_config = ConfigDict(extra="forbid")

    contacts: Contacts | None = None
    socials: Socials | None = None
    about: str | None = Field(default=None, max_length=20000)
