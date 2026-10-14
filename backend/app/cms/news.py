"""Yangiliklar: admin CRUD va muqova; ochiq ro'yxat va sahifa (faqat nashr qilinganlar)."""

import re

from fastapi import UploadFile
from sqlalchemy import ColumnElement, and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.cms.models import News
from app.cms.schemas import NewsAdminOut, NewsCard, NewsIn, NewsOut, NewsPage, NewsUpdate
from app.core.config import Settings
from app.core.errors import AppError
from app.core.files import ALLOWED_IMAGE_EXT, save_checked
from app.core.storage import Storage
from app.core.types import utcnow
from app.learning.editing import slugify

EXCERPT_CHARS = 200
_IMAGE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_MARKS = re.compile(r"[#*_`>~|]")


def excerpt(body: str, limit: int = EXCERPT_CHARS) -> str:
    """Markdown belgilarisiz qisqa matn (ro'yxat kartalari va meta description uchun)."""
    text = _MARKS.sub("", _LINK.sub(r"\1", _IMAGE.sub("", body)))
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + "…"


def card(news: News) -> NewsCard:
    return NewsCard(
        id=news.id,
        title=news.title,
        slug=news.slug,
        excerpt=excerpt(news.body),
        has_cover=news.has_cover,
        published_at=news.published_at,
        views=news.views,
    )


def out(news: News) -> NewsOut:
    return NewsOut(**card(news).model_dump(), body=news.body)


def admin_out(news: News) -> NewsAdminOut:
    return NewsAdminOut(
        **out(news).model_dump(), created_at=news.created_at, updated_at=news.updated_at
    )


def _published() -> ColumnElement[bool]:
    return and_(News.published_at.is_not(None), News.published_at <= utcnow())


async def get_news(db: AsyncSession, news_id: int) -> News:
    news = await db.get(News, news_id)
    if news is None:
        raise AppError(404, "NEWS_NOT_FOUND", "Yangilik topilmadi")
    return news


async def _slug_taken(db: AsyncSession, slug: str, exclude_id: int | None = None) -> bool:
    stmt = select(News.id).where(News.slug == slug)
    if exclude_id is not None:
        stmt = stmt.where(News.id != exclude_id)
    return await db.scalar(stmt) is not None


async def _unique_slug(db: AsyncSession, base: str) -> str:
    slug, suffix = base, 2
    while await _slug_taken(db, slug):
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


async def create_news(db: AsyncSession, data: NewsIn) -> News:
    if data.slug:
        if await _slug_taken(db, data.slug):
            raise AppError(409, "NEWS_SLUG_TAKEN", "Bu manzil (slug) band")
        slug = data.slug
    else:
        slug = await _unique_slug(db, slugify(data.title))
    news = News(title=data.title, slug=slug, body=data.body, published_at=data.published_at)
    db.add(news)
    await db.commit()
    return news


async def update_news(db: AsyncSession, news: News, data: NewsUpdate) -> News:
    values = data.model_dump(exclude_unset=True)
    if values.get("slug"):
        if await _slug_taken(db, values["slug"], exclude_id=news.id):
            raise AppError(409, "NEWS_SLUG_TAKEN", "Bu manzil (slug) band")
    for key in ("title", "slug", "body"):
        if values.get(key) is not None:
            setattr(news, key, values[key])
    if "published_at" in values:  # aniq `null` — nashrdan olish
        news.published_at = values["published_at"]
    await db.commit()
    return news


async def set_cover(
    db: AsyncSession, news: News, upload: UploadFile, storage: Storage, settings: Settings
) -> str | None:
    """Yangi muqovani saqlaydi; eski muqova yo'lini qaytaradi (commit'dan keyin o'chirish uchun)."""
    rel, _, _ = await save_checked(
        storage, upload, "news", allowed_ext=ALLOWED_IMAGE_EXT, max_mb=settings.max_cover_mb
    )
    old = news.cover
    news.cover = rel
    await db.commit()
    return old


async def delete_news(db: AsyncSession, news: News) -> str | None:
    cover = news.cover
    await db.delete(news)
    await db.commit()
    return cover


async def admin_list(db: AsyncSession) -> list[NewsAdminOut]:
    rows = await db.scalars(select(News).order_by(News.created_at.desc(), News.id.desc()))
    return [admin_out(n) for n in rows]


async def public_page(db: AsyncSession, *, page: int, size: int) -> NewsPage:
    total = await db.scalar(select(func.count()).select_from(News).where(_published()))
    rows = await db.scalars(
        select(News)
        .where(_published())
        .order_by(News.published_at.desc(), News.id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return NewsPage(items=[card(n) for n in rows], total=total or 0, page=page, size=size)


async def public_by_slug(db: AsyncSession, slug: str) -> NewsOut:
    """Nashr qilingan yangilik; har ochilishda `views` atomar oshiriladi."""
    news = await db.scalar(select(News).where(News.slug == slug, _published()))
    if news is None:
        raise AppError(404, "NEWS_NOT_FOUND", "Yangilik topilmadi")
    # `updated_at` aniq saqlanadi: aks holda `onupdate` har ko'rishda uni o'zgartirib,
    # sitemap'dagi `lastmod` ni buzardi.
    # `synchronize_session=False`: xotiradagi obyekt o'zgarmaydi, javobdagi son qo'lda +1.
    await db.execute(
        update(News)
        .where(News.id == news.id)
        .values(views=News.views + 1, updated_at=News.updated_at)
        .execution_options(synchronize_session=False)
    )
    await db.commit()
    result = out(news)
    result.views += 1
    return result


async def public_cover(db: AsyncSession, news_id: int) -> str:
    rel = await db.scalar(select(News.cover).where(News.id == news_id, _published()))
    if rel is None:
        raise AppError(404, "NEWS_NOT_FOUND", "Yangilik topilmadi")
    return rel
