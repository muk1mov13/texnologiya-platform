"""Kutubxonaning ochiq qismi: login talab qilinmaydi (spec 6 — "kutubxonaning ochiq qismi")."""

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.errors import AppError
from app.core.files import file_response
from app.core.types import DbIdPath
from app.library import books, documents, folders
from app.library.models import LibrarySection
from app.library.schemas import BookPage, FolderOut

router = APIRouter(prefix="/library", tags=["library"])


@router.get("/folders", response_model=list[FolderOut])
async def folder_tree(
    db: DbSession, section: Annotated[LibrarySection, Query()]
) -> list[FolderOut]:
    return await folders.tree(db, section)


@router.get("/documents/{document_id}/file", response_class=Response)
async def document_file(
    document_id: DbIdPath, db: DbSession, settings: AppSettings, storage: AppStorage
) -> Response:
    document = await documents.get_document(db, document_id)
    return file_response(settings, storage, document.file, document.original_name)


@router.get("/books", response_model=BookPage)
async def book_catalog(
    db: DbSession,
    category: Annotated[str | None, Query(max_length=100)] = None,
    q: Annotated[str | None, Query(max_length=100)] = None,
    page: Annotated[int, Query(ge=1, le=10000)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> BookPage:
    return await books.public_page(db, category=category, q=q, page=page, size=size)


@router.get("/books/categories", response_model=list[str])
async def book_categories(db: DbSession) -> list[str]:
    return await books.categories(db)


@router.get("/books/{book_id}/file", response_class=Response)
async def book_file(
    book_id: DbIdPath, db: DbSession, settings: AppSettings, storage: AppStorage
) -> Response:
    book = await books.get_approved(db, book_id)
    return file_response(settings, storage, book.file, book.original_name)


@router.get("/books/{book_id}/cover", response_class=Response)
async def book_cover(
    book_id: DbIdPath, db: DbSession, settings: AppSettings, storage: AppStorage
) -> Response:
    book = await books.get_approved(db, book_id)
    if book.cover is None:
        raise AppError(404, "BOOK_NOT_FOUND", "Kitob muqovasi yo'q")
    return file_response(settings, storage, book.cover, f"cover{Path(book.cover).suffix}")
