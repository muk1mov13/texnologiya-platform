import tempfile
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.config import Settings
from app.core.errors import AppError
from app.core.jobs import JobContext, JobRunner, job
from app.core.storage import Storage
from app.learning import convert, editing
from app.learning.models import FILE_STEP_KINDS, Material, MaterialStatus, Step

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


async def ensure_can_edit_material(db: AsyncSession, user: User, material_id: int) -> Material:
    material = await db.get(Material, material_id)
    if material is None:
        raise AppError(404, "MATERIAL_NOT_FOUND", "Material topilmadi")
    await editing.ensure_can_edit_step(db, user, material.step_id)
    return material


async def delete_material(db: AsyncSession, material: Material, storage: Storage) -> None:
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


@job(CONVERT_JOB)
async def convert_material_job(ctx: JobContext, material_id: int) -> None:
    async with ctx.sessionmaker() as db:
        material = await db.get(Material, material_id)
        if material is None or material.status != MaterialStatus.processing:
            return
        source = ctx.storage.path(material.original_file)
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
            material.pdf_file = rel
            material.page_count = page_count
            material.status = MaterialStatus.ready
            material.error = None
            await db.commit()
            return
        material.status = MaterialStatus.failed
        material.error = error
        await db.commit()
