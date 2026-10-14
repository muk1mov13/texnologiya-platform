"""CMS'ning ochiq qismi: login talab qilinmaydi."""

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Query, Request, Response

from app.cms import contact, faq, news, site
from app.cms.models import FaqItem
from app.cms.schemas import ContactIn, FaqOut, NewsOut, NewsPage, SiteOut
from app.core.deps import AppSettings, AppStorage, ContactLimiter, DbSession
from app.core.errors import AppError
from app.core.files import file_response
from app.core.types import DbIdPath

router = APIRouter(tags=["cms"])


@router.get("/news", response_model=NewsPage)
async def news_list(
    db: DbSession,
    page: Annotated[int, Query(ge=1, le=10000)] = 1,
    size: Annotated[int, Query(ge=1, le=50)] = 12,
) -> NewsPage:
    return await news.public_page(db, page=page, size=size)


@router.get("/news/{slug}", response_model=NewsOut)
async def news_detail(slug: str, db: DbSession) -> NewsOut:
    return await news.public_by_slug(db, slug)


@router.get("/news/{news_id}/cover", response_class=Response)
async def news_cover(
    news_id: DbIdPath, db: DbSession, settings: AppSettings, storage: AppStorage
) -> Response:
    rel = await news.public_cover(db, news_id)
    return file_response(settings, storage, rel, f"cover{Path(rel).suffix}")


@router.get("/faq", response_model=list[FaqOut])
async def faq_list(db: DbSession) -> list[FaqItem]:
    return await faq.public_list(db)


@router.get("/site", response_model=SiteOut)
async def site_settings(db: DbSession) -> SiteOut:
    return await site.get_site(db)


@router.post("/contact", status_code=204)
async def contact_form(
    data: ContactIn, request: Request, db: DbSession, limiter: ContactLimiter
) -> Response:
    key = request.client.host if request.client else "-"
    if limiter.is_blocked(key):
        raise AppError(
            429, "CONTACT_RATE_LIMITED", "Juda ko'p xabar yuborildi. Birozdan so'ng urinib ko'ring"
        )
    # Limiter login uchun yozilgan ("muvaffaqiyatsiz urinish"), bu yerda har yuborish sanaladi —
    # honeypot ham, shunda bot cheksiz urina olmaydi.
    limiter.record_failure(key)
    if not data.website:
        await contact.save_message(db, data)
    return Response(status_code=204)
