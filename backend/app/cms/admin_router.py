from fastapi import APIRouter, Response, UploadFile

from app.auth.deps import AdminUser
from app.cms import news
from app.cms.schemas import NewsAdminOut, NewsIn, NewsUpdate
from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.types import DbIdPath

news_router = APIRouter(prefix="/admin/news", tags=["admin-cms"])


@news_router.get("", response_model=list[NewsAdminOut])
async def list_news(admin: AdminUser, db: DbSession) -> list[NewsAdminOut]:
    return await news.admin_list(db)


@news_router.post("", response_model=NewsAdminOut, status_code=201)
async def create_news(data: NewsIn, admin: AdminUser, db: DbSession) -> NewsAdminOut:
    return news.admin_out(await news.create_news(db, data))


@news_router.get("/{news_id}", response_model=NewsAdminOut)
async def get_news(news_id: DbIdPath, admin: AdminUser, db: DbSession) -> NewsAdminOut:
    return news.admin_out(await news.get_news(db, news_id))


@news_router.patch("/{news_id}", response_model=NewsAdminOut)
async def update_news(
    news_id: DbIdPath, data: NewsUpdate, admin: AdminUser, db: DbSession
) -> NewsAdminOut:
    item = await news.update_news(db, await news.get_news(db, news_id), data)
    return news.admin_out(item)


@news_router.put("/{news_id}/cover", response_model=NewsAdminOut)
async def set_cover(
    news_id: DbIdPath,
    cover: UploadFile,
    admin: AdminUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> NewsAdminOut:
    item = await news.get_news(db, news_id)
    storage.delete_quietly([await news.set_cover(db, item, cover, storage, settings)])
    return news.admin_out(item)


@news_router.delete("/{news_id}", status_code=204)
async def delete_news(
    news_id: DbIdPath, admin: AdminUser, db: DbSession, storage: AppStorage
) -> Response:
    storage.delete_quietly([await news.delete_news(db, await news.get_news(db, news_id))])
    return Response(status_code=204)
