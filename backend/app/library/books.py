"""Kitoblar: o'qituvchi va admin yuklaydi; o'qituvchiniki admin tasdiqlagach ochiq bo'ladi."""

from typing import Literal

from fastapi import UploadFile
from sqlalchemy import ColumnElement, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.constants import INDEX_LIBRARY_JOB
from app.ai.indexing import delete_library_chunks
from app.auth.models import Role, User
from app.core.config import Settings
from app.core.errors import AppError
from app.core.files import ALLOWED_DOC_EXT, ALLOWED_IMAGE_EXT, save_checked
from app.core.jobs import JobRunner
from app.core.storage import Storage
from app.library.models import Book
from app.library.schemas import BookAdminOut, BookOut, BookPage, BookUpdate


async def get_book(db: AsyncSession, book_id: int) -> Book:
    book = await db.get(Book, book_id)
    if book is None:
        raise AppError(404, "BOOK_NOT_FOUND", "Kitob topilmadi")
    return book


async def get_approved(db: AsyncSession, book_id: int) -> Book:
    """Ochiq API uchun: tasdiqlanmagan kitob mavjud emasdek ko'rinadi."""
    book = await get_book(db, book_id)
    if not book.is_approved:
        raise AppError(404, "BOOK_NOT_FOUND", "Kitob topilmadi")
    return book


async def _save_cover(storage: Storage, upload: UploadFile, settings: Settings) -> str:
    rel, _, _ = await save_checked(
        storage, upload, "covers", allowed_ext=ALLOWED_IMAGE_EXT, max_mb=settings.max_cover_mb
    )
    return rel


async def add_book(
    db: AsyncSession,
    *,
    user: User,
    category: str,
    title: str,
    author: str,
    upload: UploadFile,
    cover: UploadFile | None,
    storage: Storage,
    settings: Settings,
    jobs: JobRunner,
) -> Book:
    rel, original_name, size = await save_checked(
        storage, upload, "books", allowed_ext=ALLOWED_DOC_EXT, max_mb=settings.max_library_mb
    )
    cover_rel = None
    if cover is not None and cover.filename:
        try:
            cover_rel = await _save_cover(storage, cover, settings)
        except AppError:
            storage.delete(rel)  # muqova yaroqsiz — asosiy fayl ham saqlanmaydi
            raise
    book = Book(
        category=category,
        title=title,
        author=author.strip(),
        cover=cover_rel,
        file=rel,
        original_name=original_name,
        size=size,
        is_approved=user.role == Role.admin,
        uploaded_by=user.id,
    )
    db.add(book)
    await db.commit()
    if book.is_approved:
        await _enqueue_index(jobs, book)
    return book


async def _enqueue_index(jobs: JobRunner, book: Book) -> None:
    """Tasdiqlangan PDF kitob AI indeksiga (AI o'chiq bo'lsa job hech narsa qilmaydi)."""
    if book.file.endswith(".pdf"):
        await jobs.enqueue(INDEX_LIBRARY_JOB, source="book", source_id=book.id)


def _like(q: str) -> str:
    escaped = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


async def public_page(
    db: AsyncSession, *, category: str | None, q: str | None, page: int, size: int
) -> BookPage:
    conditions: list[ColumnElement[bool]] = [Book.is_approved.is_(True)]
    if category:
        conditions.append(Book.category == category)
    if q and q.strip():
        pattern = _like(q)
        conditions.append(
            or_(Book.title.ilike(pattern, escape="\\"), Book.author.ilike(pattern, escape="\\"))
        )
    total = await db.scalar(select(func.count()).select_from(Book).where(*conditions))
    books = await db.scalars(
        select(Book)
        .where(*conditions)
        .order_by(Book.created_at.desc(), Book.id.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return BookPage(
        items=[BookOut.model_validate(b) for b in books], total=total or 0, page=page, size=size
    )


async def categories(db: AsyncSession) -> list[str]:
    rows = await db.scalars(
        select(Book.category).where(Book.is_approved.is_(True)).distinct().order_by(Book.category)
    )
    return list(rows)


async def own_books(db: AsyncSession, user: User) -> list[Book]:
    rows = await db.scalars(
        select(Book).where(Book.uploaded_by == user.id).order_by(Book.created_at.desc())
    )
    return list(rows)


async def delete_own(db: AsyncSession, user: User, book_id: int) -> list[str | None]:
    """O'qituvchi faqat o'zining hali tasdiqlanmagan kitobini o'chiradi."""
    book = await get_book(db, book_id)
    if book.uploaded_by != user.id:
        raise AppError(404, "BOOK_NOT_FOUND", "Kitob topilmadi")
    if book.is_approved:
        raise AppError(
            409, "BOOK_ALREADY_APPROVED", "Tasdiqlangan kitobni faqat administrator o'chiradi"
        )
    return await delete_book(db, book)


async def admin_list(
    db: AsyncSession, status: Literal["pending", "approved"]
) -> list[BookAdminOut]:
    rows = await db.execute(
        select(Book, User.full_name)
        .outerjoin(User, User.id == Book.uploaded_by)
        .where(Book.is_approved.is_(status == "approved"))
        .order_by(Book.created_at.desc(), Book.id.desc())
    )
    return [
        BookAdminOut(
            **BookOut.model_validate(book).model_dump(),
            uploaded_by=book.uploaded_by,
            uploader_name=name,
        )
        for book, name in rows
    ]


async def update_book(db: AsyncSession, book: Book, data: BookUpdate, jobs: JobRunner) -> Book:
    values = data.model_dump(exclude_unset=True, exclude_none=True)
    if "author" in values:
        values["author"] = values["author"].strip()
    was_approved = book.is_approved
    for key, value in values.items():
        setattr(book, key, value)
    if was_approved and not book.is_approved:  # tasdiq bekor qilindi — repetitor ko'rmasin
        await delete_library_chunks(db, "book", book.id)
    await db.commit()
    if book.is_approved and not was_approved:
        await _enqueue_index(jobs, book)
    return book


async def replace_cover(
    db: AsyncSession, book: Book, upload: UploadFile, storage: Storage, settings: Settings
) -> str | None:
    """Yangi muqovani saqlaydi; eski muqova yo'lini qaytaradi (commit'dan keyin o'chirish uchun)."""
    new_rel = await _save_cover(storage, upload, settings)
    old = book.cover
    book.cover = new_rel
    await db.commit()
    return old


async def delete_book(db: AsyncSession, book: Book) -> list[str | None]:
    files = [book.file, book.cover]
    await delete_library_chunks(db, "book", book.id)
    await db.delete(book)
    await db.commit()
    return files


async def admin_out(db: AsyncSession, book: Book) -> BookAdminOut:
    name = (
        await db.scalar(select(User.full_name).where(User.id == book.uploaded_by))
        if book.uploaded_by is not None
        else None
    )
    return BookAdminOut(
        **BookOut.model_validate(book).model_dump(),
        uploaded_by=book.uploaded_by,
        uploader_name=name,
    )
