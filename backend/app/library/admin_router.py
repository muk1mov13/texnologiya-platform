from typing import Annotated, Literal

from fastapi import APIRouter, Query, Response, UploadFile

from app.auth.deps import AdminUser
from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.forms import LongTitleForm
from app.core.types import DbIdPath
from app.library import books, documents, folders
from app.library.models import Document, Folder
from app.library.schemas import (
    BookAdminOut,
    BookUpdate,
    DocumentOut,
    DocumentUpdate,
    FolderAdminOut,
    FolderIn,
    FolderUpdate,
)

router = APIRouter(prefix="/admin/library", tags=["admin-library"])
books_router = APIRouter(prefix="/admin/books", tags=["admin-library"])


@router.post("/folders", response_model=FolderAdminOut, status_code=201)
async def create_folder(data: FolderIn, admin: AdminUser, db: DbSession) -> Folder:
    return await folders.create_folder(db, data)


@router.patch("/folders/{folder_id}", response_model=FolderAdminOut)
async def update_folder(
    folder_id: DbIdPath, data: FolderUpdate, admin: AdminUser, db: DbSession
) -> Folder:
    return await folders.update_folder(db, await folders.get_folder(db, folder_id), data)


@router.delete("/folders/{folder_id}", status_code=204)
async def delete_folder(folder_id: DbIdPath, admin: AdminUser, db: DbSession) -> Response:
    await folders.delete_folder(db, await folders.get_folder(db, folder_id))
    return Response(status_code=204)


@router.post("/folders/{folder_id}/documents", response_model=DocumentOut, status_code=201)
async def add_document(
    folder_id: DbIdPath,
    title: LongTitleForm,
    file: UploadFile,
    admin: AdminUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> Document:
    return await documents.add_document(
        db, folder_id=folder_id, title=title, upload=file, storage=storage, settings=settings
    )


@router.patch("/documents/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: DbIdPath, data: DocumentUpdate, admin: AdminUser, db: DbSession
) -> Document:
    return await documents.update_document(db, await documents.get_document(db, document_id), data)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: DbIdPath, admin: AdminUser, db: DbSession, storage: AppStorage
) -> Response:
    rel = await documents.delete_document(db, await documents.get_document(db, document_id))
    storage.delete_quietly([rel])
    return Response(status_code=204)


# --- kitoblar (tasdiqlash navbati) ----------------------------------------------------------


@books_router.get("", response_model=list[BookAdminOut])
async def list_books(
    admin: AdminUser,
    db: DbSession,
    status: Annotated[Literal["pending", "approved"], Query()] = "pending",
) -> list[BookAdminOut]:
    return await books.admin_list(db, status)


@books_router.patch("/{book_id}", response_model=BookAdminOut)
async def update_book(
    book_id: DbIdPath, data: BookUpdate, admin: AdminUser, db: DbSession
) -> BookAdminOut:
    book = await books.update_book(db, await books.get_book(db, book_id), data)
    return await books.admin_out(db, book)


@books_router.put("/{book_id}/cover", response_model=BookAdminOut)
async def replace_cover(
    book_id: DbIdPath,
    cover: UploadFile,
    admin: AdminUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> BookAdminOut:
    book = await books.get_book(db, book_id)
    old = await books.replace_cover(db, book, cover, storage, settings)
    storage.delete_quietly([old])
    return await books.admin_out(db, book)


@books_router.delete("/{book_id}", status_code=204)
async def delete_book(
    book_id: DbIdPath, admin: AdminUser, db: DbSession, storage: AppStorage
) -> Response:
    storage.delete_quietly(await books.delete_book(db, await books.get_book(db, book_id)))
    return Response(status_code=204)
