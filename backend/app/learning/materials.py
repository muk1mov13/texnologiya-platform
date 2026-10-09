import logging
import tempfile
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.auth.models import User
from app.core.config import Settings
from app.core.errors import AppError
from app.core.jobs import JobContext, JobRunner, job
from app.core.storage import Storage
from app.learning import convert, editing
from app.learning.models import FILE_STEP_KINDS, Material, MaterialStatus, Step

logger = logging.getLogger(__name__)

ALLOWED_MATERIAL_EXT = frozenset({".pdf", ".ppt", ".pptx", ".doc", ".docx"})
CONVERT_JOB = "convert_material"
MAX_CONVERSION_ATTEMPTS = 3


async def add_material(
    db: AsyncSession,
    *,
    step: Step,
    title: str,
    upload: UploadFile,
    user: User,
    storage: Storage,
    settings: Settings,
    jobs: JobRunner,
) -> Material:
    if step.kind not in FILE_STEP_KINDS:
        raise AppError(400, "STEP_DOES_NOT_ACCEPT_FILES", "Bu bosqichga fayl yuklanmaydi")
    rel, original_name = await storage.save_upload(
        upload,
        "materials",
        allowed_ext=ALLOWED_MATERIAL_EXT,
        max_bytes=settings.max_material_mb * 1024 * 1024,
    )
    material = Material(
        step_id=step.id,
        title=title.strip(),
        original_file=rel,
        original_name=original_name,
        uploaded_by=user.id,
    )
    if rel.endswith(".pdf"):
        invalid = False
        try:
            material.page_count = convert.count_pages(storage.path(rel))
        except convert.ConversionError:
            invalid = True
        if invalid:
            # `exc` o'z ichidagi traceback orqali pymupdf'ning ochiq fayl tutqichini
            # ushlab turadi; except blokidan chiqgandan keyingina (u yo'q qilinganda)
            # faylni o'chirish mumkin, aks holda Windows'da PermissionError beradi.
            storage.delete(rel)
            raise AppError(400, "INVALID_PDF", "PDF fayl buzilgan yoki o'qib bo'lmaydi")
        material.pdf_file = rel
        material.status = MaterialStatus.ready
    else:
        material.status = MaterialStatus.processing
    db.add(material)
    await db.commit()
    if material.status == MaterialStatus.processing:
        await jobs.enqueue(CONVERT_JOB, material_id=material.id)
    return material


async def recover_interrupted_conversions(
    sessionmaker: async_sessionmaker[AsyncSession],
) -> None:
    """InlineJobRunner fon ishlarini faqat xotirada saqlaydi: jarayon to'xtaganda
    "processing" holatidagi materiallar abadiy shu holatda qolib ketadi (o'chirish
    409, qayta urinish 400 qaytaradi). Server qayta ishga tushganda ularni "failed"
    qilib belgilaymiz, shunda o'qituvchi ularni qayta yuklashi mumkin."""
    async with sessionmaker() as db:
        await db.execute(
            update(Material)
            .where(Material.status == MaterialStatus.processing)
            .values(status=MaterialStatus.failed, error="INTERRUPTED")
        )
        await db.commit()


async def ensure_can_edit_material(db: AsyncSession, user: User, material_id: int) -> Material:
    material = await db.get(Material, material_id)
    if material is None:
        raise AppError(404, "MATERIAL_NOT_FOUND", "Material topilmadi")
    await editing.ensure_can_edit_step(db, user, material.step_id)
    return material


async def delete_material(db: AsyncSession, material: Material, storage: Storage) -> None:
    if material.status == MaterialStatus.processing:
        raise AppError(409, "MATERIAL_PROCESSING", "Material hali qayta ishlanmoqda")
    paths = {material.original_file, material.pdf_file}
    await db.delete(material)
    await db.commit()
    for path in paths:
        storage.delete(path)


async def retry_material(db: AsyncSession, material: Material, jobs: JobRunner) -> Material:
    if material.status != MaterialStatus.failed:
        raise AppError(
            400, "MATERIAL_NOT_FAILED", "Faqat xato bilan tugagan materialni qayta ishlash mumkin"
        )
    material.status = MaterialStatus.processing
    material.error = None
    await db.commit()
    await jobs.enqueue(CONVERT_JOB, material_id=material.id)
    return material


async def _mark_failed_if_processing(ctx: JobContext, material_id: int, error: str) -> None:
    async with ctx.sessionmaker() as db:
        material = await db.get(Material, material_id)
        if material is not None and material.status == MaterialStatus.processing:
            material.status = MaterialStatus.failed
            material.error = error
            await db.commit()


async def _run_conversion(ctx: JobContext, material_id: int) -> None:
    # Material faqat boshida (fayl yo'lini olish uchun) va oxirida (natijani yozish
    # uchun) qisqa muddatli sessiyalar bilan o'qiladi/yoziladi — konvertatsiya
    # (subprocess, bir necha urinish) davomida DB sessiyasi/tranzaksiyasi ochiq
    # qolmaydi, aks holda parallel so'rovlar (masalan, o'chirish) SQLite'da qulflanib
    # qolishi mumkin.
    async with ctx.sessionmaker() as db:
        material = await db.get(Material, material_id)
        if material is None or material.status != MaterialStatus.processing:
            return
        original_file = material.original_file

    source = ctx.storage.path(original_file)
    error = "CONVERSION_FAILED"
    for _ in range(MAX_CONVERSION_ATTEMPTS):
        try:
            with tempfile.TemporaryDirectory() as tmp:
                pdf = await convert.convert_to_pdf(
                    source,
                    Path(tmp),
                    soffice=ctx.settings.soffice_path,
                    timeout=ctx.settings.conversion_timeout_seconds,
                )
                page_count = convert.count_pages(pdf)
                rel = ctx.storage.import_file(pdf, "materials", ".pdf")
        except convert.ConversionError as exc:
            error = exc.code
            if exc.code == "LIBREOFFICE_NOT_FOUND":
                break
            continue
        except OSError:
            # Masalan, disk to'lib qolgan yoki saqlash joyiga yozib bo'lmadi — bu ham
            # vaqtincha xato sifatida qaraladi va qayta urinish davom etadi.
            error = "STORAGE_FAILED"
            continue
        async with ctx.sessionmaker() as db:
            # Urinish davomida material o'chirilgan/o'zgargan bo'lishi mumkin —
            # natijani yozishdan oldin yangi so'rov bilan tekshiramiz.
            fresh_status = await db.scalar(
                select(Material.status).where(Material.id == material_id)
            )
            if fresh_status != MaterialStatus.processing:
                ctx.storage.delete(rel)
                return
            material = await db.get(Material, material_id)
            assert material is not None
            material.pdf_file = rel
            material.page_count = page_count
            material.status = MaterialStatus.ready
            material.error = None
            await db.commit()
        return
    await _mark_failed_if_processing(ctx, material_id, error)


@job(CONVERT_JOB)
async def convert_material_job(ctx: JobContext, material_id: int) -> None:
    try:
        await _run_conversion(ctx, material_id)
    except Exception:
        # Kutilmagan xato (bug, DB uzilishi va h.k.) material'ni "processing"
        # holatida abadiy ushlab turmasligi kerak.
        logger.exception("Material konvertatsiyasida kutilmagan xato: material_id=%s", material_id)
        await _mark_failed_if_processing(ctx, material_id, "CONVERSION_FAILED")
