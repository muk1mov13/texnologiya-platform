"""CMS'ning ochiq qismi: login talab qilinmaydi."""

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.cms import faq, news, site
from app.cms.models import FaqItem
from app.cms.schemas import FaqOut, NewsOut, NewsPage, SiteOut
from app.core.deps import AppSettings, AppStorage, DbSession
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
