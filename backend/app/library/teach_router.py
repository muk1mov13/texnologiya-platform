"""O'qituvchi (va admin) o'z kitoblarini yuklaydi va holatini ko'radi."""

from typing import Annotated

from fastapi import APIRouter, Form, Response, UploadFile

from app.auth.deps import StaffUser
from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.forms import CategoryForm, LongTitleForm
from app.core.types import DbIdPath
from app.library import books
from app.library.models import Book
from app.library.schemas import BookOut

router = APIRouter(prefix="/teach/books", tags=["teach-library"])


@router.get("", response_model=list[BookOut])
async def my_books(user: StaffUser, db: DbSession) -> list[Book]:
    return await books.own_books(db, user)


@router.post("", response_model=BookOut, status_code=201)
async def upload_book(
    category: CategoryForm,
    title: LongTitleForm,
    file: UploadFile,
    user: StaffUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
    author: Annotated[str, Form(max_length=200)] = "",
    cover: UploadFile | None = None,
) -> Book:
    return await books.add_book(
        db,
        user=user,
        category=category,
        title=title,
        author=author,
        upload=file,
        cover=cover,
        storage=storage,
        settings=settings,
    )


@router.delete("/{book_id}", status_code=204)
async def delete_my_book(
    book_id: DbIdPath, user: StaffUser, db: DbSession, storage: AppStorage
) -> Response:
    storage.delete_quietly(await books.delete_own(db, user, book_id))
    return Response(status_code=204)
