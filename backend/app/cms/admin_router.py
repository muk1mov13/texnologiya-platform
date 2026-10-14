from typing import Annotated

from fastapi import APIRouter, Query, Response, UploadFile

from app.auth.deps import AdminUser
from app.cms import contact, faq, news, site
from app.cms.models import ContactMessage, FaqItem
from app.cms.schemas import (
    FaqIn,
    FaqOut,
    FaqUpdate,
    MessageOut,
    MessageUpdate,
    NewsAdminOut,
    NewsIn,
    NewsUpdate,
    SiteOut,
    SiteUpdate,
)
from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.types import DbIdPath

news_router = APIRouter(prefix="/admin/news", tags=["admin-cms"])
faq_router = APIRouter(prefix="/admin/faq", tags=["admin-cms"])
site_router = APIRouter(prefix="/admin/site", tags=["admin-cms"])
messages_router = APIRouter(prefix="/admin/messages", tags=["admin-cms"])


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


# --- FAQ -------------------------------------------------------------------------------------


@faq_router.get("", response_model=list[FaqOut])
async def list_faq(admin: AdminUser, db: DbSession) -> list[FaqItem]:
    return await faq.admin_list(db)


@faq_router.post("", response_model=FaqOut, status_code=201)
async def create_faq(data: FaqIn, admin: AdminUser, db: DbSession) -> FaqItem:
    return await faq.create_item(db, data)


@faq_router.patch("/{item_id}", response_model=FaqOut)
async def update_faq(
    item_id: DbIdPath, data: FaqUpdate, admin: AdminUser, db: DbSession
) -> FaqItem:
    return await faq.update_item(db, await faq.get_item(db, item_id), data)


@faq_router.delete("/{item_id}", status_code=204)
async def delete_faq(item_id: DbIdPath, admin: AdminUser, db: DbSession) -> Response:
    await faq.delete_item(db, await faq.get_item(db, item_id))
    return Response(status_code=204)


# --- sayt sozlamalari ------------------------------------------------------------------------


@site_router.get("", response_model=SiteOut)
async def get_site(admin: AdminUser, db: DbSession) -> SiteOut:
    return await site.get_site(db)


@site_router.put("", response_model=SiteOut)
async def update_site(data: SiteUpdate, admin: AdminUser, db: DbSession) -> SiteOut:
    return await site.update_site(db, data)


# --- bog'lanish xabarlari --------------------------------------------------------------------


@messages_router.get("", response_model=list[MessageOut])
async def list_messages(
    admin: AdminUser, db: DbSession, unread: Annotated[bool, Query()] = False
) -> list[ContactMessage]:
    return await contact.admin_list(db, unread_only=unread)


@messages_router.patch("/{message_id}", response_model=MessageOut)
async def update_message(
    message_id: DbIdPath, data: MessageUpdate, admin: AdminUser, db: DbSession
) -> ContactMessage:
    return await contact.update_message(db, await contact.get_message(db, message_id), data)


@messages_router.delete("/{message_id}", status_code=204)
async def delete_message(message_id: DbIdPath, admin: AdminUser, db: DbSession) -> Response:
    await contact.delete_message(db, await contact.get_message(db, message_id))
    return Response(status_code=204)
