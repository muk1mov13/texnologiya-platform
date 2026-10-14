"""Kutubxona hujjatlari: yuklash, tahrir va o'chirish. PDF hujjatlar AI indeksiga yuboriladi."""

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.constants import INDEX_LIBRARY_JOB
from app.ai.indexing import delete_library_chunks
from app.core.config import Settings
from app.core.errors import AppError
from app.core.files import ALLOWED_DOC_EXT, save_checked
from app.core.jobs import JobRunner
from app.core.storage import Storage
from app.library.folders import get_folder
from app.library.models import Document
from app.library.schemas import DocumentUpdate


async def get_document(db: AsyncSession, document_id: int) -> Document:
    document = await db.get(Document, document_id)
    if document is None:
        raise AppError(404, "DOCUMENT_NOT_FOUND", "Hujjat topilmadi")
    return document


async def add_document(
    db: AsyncSession,
    *,
    folder_id: int,
    title: str,
    upload: UploadFile,
    storage: Storage,
    settings: Settings,
    jobs: JobRunner,
) -> Document:
    await get_folder(db, folder_id)
    rel, original_name, size = await save_checked(
        storage, upload, "library", allowed_ext=ALLOWED_DOC_EXT, max_mb=settings.max_library_mb
    )
    document = Document(
        folder_id=folder_id, title=title, file=rel, original_name=original_name, size=size
    )
    db.add(document)
    await db.commit()
    if rel.endswith(".pdf"):  # AI o'chiq bo'lsa job hech narsa qilmaydi
        await jobs.enqueue(INDEX_LIBRARY_JOB, source="document", source_id=document.id)
    return document


async def update_document(db: AsyncSession, document: Document, data: DocumentUpdate) -> Document:
    values = data.model_dump(exclude_unset=True, exclude_none=True)
    if "folder_id" in values:
        await get_folder(db, values["folder_id"])
    for key, value in values.items():
        setattr(document, key, value)
    await db.commit()
    return document


async def delete_document(db: AsyncSession, document: Document) -> str:
    """Yozuvni o'chiradi va o'chiriladigan fayl yo'lini qaytaradi (commit'dan keyin o'chiriladi)."""
    rel = document.file
    # `doc_chunks.source_id` FK emas — bo'laklar qo'lda o'chiriladi.
    await delete_library_chunks(db, "document", document.id)
    await db.delete(document)
    await db.commit()
    return rel
