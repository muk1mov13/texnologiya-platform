"""Fanning o'quv dasturi: bitta PDF fayl, fan sahifasida ko'rsatiladi.

DOC/DOCX shu so'rov ichida PDF'ga o'giriladi (bitta kichik fayl, faqat admin yuklaydi),
shuning uchun alohida holat (`processing`) va fon ishi kerak emas.
"""

import tempfile
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.config import Settings
from app.core.errors import AppError
from app.core.files import save_checked
from app.core.storage import Storage
from app.learning import convert, editing
from app.learning.models import Subject

ALLOWED_SYLLABUS_EXT = frozenset({".pdf", ".doc", ".docx"})
SYLLABUS_DIR = "syllabus"


async def _to_pdf(source: Path, settings: Settings, storage: Storage) -> str:
    """Manba fayldan PDF yaratib saqlaydi va uning yo'lini qaytaradi."""
    if source.suffix.lower() == ".pdf":
        pdf_source = source
        tmp = None
    else:
        tmp = tempfile.TemporaryDirectory()
        try:
            pdf_source = await convert.convert_to_pdf(
                source,
                Path(tmp.name),
                soffice=settings.soffice_path,
                timeout=settings.conversion_timeout_seconds,
            )
        except convert.ConversionError as exc:
            tmp.cleanup()
            raise AppError(400, exc.code, "O'quv dasturini PDF'ga o'girib bo'lmadi") from exc
    try:
        invalid = False
        try:
            convert.count_pages(pdf_source)
        except convert.ConversionError:
            invalid = True
        if invalid:
            raise AppError(400, "INVALID_PDF", "PDF fayl buzilgan yoki o'qib bo'lmaydi")
        return storage.import_file(pdf_source, SYLLABUS_DIR, ".pdf")
    finally:
        if tmp is not None:
            tmp.cleanup()


async def attach_syllabus(
    db: AsyncSession,
    subject: Subject,
    source: Path,
    original_name: str,
    *,
    settings: Settings,
    storage: Storage,
) -> Subject:
    """Diskdagi faylni fanning o'quv dasturi qilib biriktiradi (eskisi o'chiriladi)."""
    rel = await _to_pdf(source, settings, storage)
    old = subject.syllabus_pdf
    subject.syllabus_pdf = rel
    subject.syllabus_name = f"{Path(original_name).stem}.pdf"[:255]
    await db.commit()
    storage.delete_quietly([old])
    return subject


async def upload_syllabus(
    db: AsyncSession,
    subject: Subject,
    upload: UploadFile,
    *,
    settings: Settings,
    storage: Storage,
) -> Subject:
    rel, original_name, _size = await save_checked(
        storage,
        upload,
        SYLLABUS_DIR,
        allowed_ext=ALLOWED_SYLLABUS_EXT,
        max_mb=settings.max_material_mb,
    )
    try:
        return await attach_syllabus(
            db, subject, storage.path(rel), original_name, settings=settings, storage=storage
        )
    finally:
        storage.delete_quietly([rel])


async def remove_syllabus(db: AsyncSession, subject: Subject, storage: Storage) -> Subject:
    old = subject.syllabus_pdf
    subject.syllabus_pdf = None
    subject.syllabus_name = None
    await db.commit()
    storage.delete_quietly([old])
    return subject


async def syllabus_for_viewer(db: AsyncSession, user: User, slug: str) -> Subject:
    """Nashr qilingan fan dasturini har bir faol foydalanuvchi, nashr qilinmaganini esa faqat
    uni tahrirlay oladiganlar ko'radi."""
    subject = await db.scalar(select(Subject).where(Subject.slug == slug))
    visible = subject is not None and (
        subject.is_published or await editing.can_edit_subject(db, user, subject.id)
    )
    if subject is None or not visible or subject.syllabus_pdf is None:
        raise AppError(404, "SYLLABUS_NOT_FOUND", "O'quv dasturi topilmadi")
    return subject
