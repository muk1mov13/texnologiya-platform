"""Indekslash job'lari.

AI o'chiq bo'lsa hech narsa qilinmaydi — admin keyin `reindex_all` bilan to'ldiradi.
"""

import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.chunking import chunk_pages, pdf_pages
from app.ai.constants import (
    INDEX_GLOSSARY_JOB,
    INDEX_MATERIAL_JOB,
    INDEX_QUESTIONS_JOB,
    REINDEX_JOB,
)
from app.ai.models import QUESTION_SOURCES, ChunkSource, DocChunk
from app.ai.services import AiServices, ai_enabled
from app.ai.vectors import ChunkRow
from app.assessment.models import Activity, CrosswordWord, QuizQuestion, Task, YesNoItem
from app.core.jobs import JobContext, JobRunner, job
from app.learning.models import GlossaryTerm, Material, MaterialStatus, Step, Topic

logger = logging.getLogger(__name__)

TASK_TEXT_CHARS = 3200


async def _ready_ai(ctx: JobContext) -> AiServices | None:
    if ctx.ai is None:
        return None
    async with ctx.sessionmaker() as db:
        enabled = await ai_enabled(db, ctx.ai)
        await db.commit()  # get_ai_settings qatorni yaratgan bo'lishi mumkin
    return ctx.ai if enabled else None


async def _topic_subject(db: AsyncSession, topic_id: int) -> int | None:
    return await db.scalar(select(Topic.subject_id).where(Topic.id == topic_id))


@job(INDEX_MATERIAL_JOB)
async def index_material_job(ctx: JobContext, material_id: int) -> None:
    ai = await _ready_ai(ctx)
    if ai is None:
        return
    async with ctx.sessionmaker() as db:
        row = (
            await db.execute(
                select(Material.pdf_file, Material.status, Topic.id, Topic.subject_id)
                .join(Step, Step.id == Material.step_id)
                .join(Topic, Topic.id == Step.topic_id)
                .where(Material.id == material_id)
            )
        ).first()
    if row is None or row.status != MaterialStatus.ready or not row.pdf_file:
        return
    pages = await asyncio.to_thread(pdf_pages, ctx.storage.path(row.pdf_file))
    chunks = chunk_pages(pages)
    vectors = await ai.embedder.embed([c.text for c in chunks], "document") if chunks else []
    async with ctx.sessionmaker() as db:
        if await db.get(Material, material_id) is None:  # orada o'chirilgan
            return
        await ai.vectors.delete(db, source_types=[ChunkSource.material], source_id=material_id)
        await ai.vectors.add(
            db,
            [
                ChunkRow(
                    ChunkSource.material, material_id, row.subject_id, row.id, c.page, i, c.text, v
                )
                for i, (c, v) in enumerate(zip(chunks, vectors, strict=True))
            ],
            ai.embedder.model_name,
        )
        await db.commit()


@job(INDEX_GLOSSARY_JOB)
async def index_topic_glossary_job(ctx: JobContext, topic_id: int) -> None:
    """Mavzu glossariysi bitta manba (`source_id = topic_id`), har atama — alohida bo'lak."""
    ai = await _ready_ai(ctx)
    if ai is None:
        return
    async with ctx.sessionmaker() as db:
        subject_id = await _topic_subject(db, topic_id)
        terms = list(
            await db.scalars(
                select(GlossaryTerm)
                .where(GlossaryTerm.topic_id == topic_id)
                .order_by(GlossaryTerm.order, GlossaryTerm.id)
            )
        )
        texts = [f"{t.term} — {t.definition}" for t in terms]
    if subject_id is None:
        return
    vectors = await ai.embedder.embed(texts, "document") if texts else []
    async with ctx.sessionmaker() as db:
        await ai.vectors.delete(db, source_types=[ChunkSource.glossary], source_id=topic_id)
        await ai.vectors.add(
            db,
            [
                ChunkRow(ChunkSource.glossary, topic_id, subject_id, topic_id, None, i, text, v)
                for i, (text, v) in enumerate(zip(texts, vectors, strict=True))
            ],
            ai.embedder.model_name,
        )
        await db.commit()


async def _question_rows(db: AsyncSession, topic_id: int) -> list[tuple[ChunkSource, int, str]]:
    """Faqat savol matnlari (test savoli, ha/yo'q bayonoti, krossvord izohi, vazifa).

    To'g'ri javoblar (variantlar, `answer`, krossvord so'zi) bu yerga hech qachon kirmaydi.
    """
    published = (Step.topic_id == topic_id, Activity.is_published.is_(True))
    rows: list[tuple[ChunkSource, int, str]] = []
    for activity_id, text in await db.execute(
        select(QuizQuestion.activity_id, QuizQuestion.text)
        .join(Activity, Activity.id == QuizQuestion.activity_id)
        .join(Step, Step.id == Activity.step_id)
        .where(*published)
    ):
        rows.append((ChunkSource.activity, activity_id, text))
    for activity_id, text in await db.execute(
        select(YesNoItem.activity_id, YesNoItem.statement)
        .join(Activity, Activity.id == YesNoItem.activity_id)
        .join(Step, Step.id == Activity.step_id)
        .where(*published)
    ):
        rows.append((ChunkSource.activity, activity_id, text))
    for activity_id, text in await db.execute(
        select(CrosswordWord.activity_id, CrosswordWord.clue)
        .join(Activity, Activity.id == CrosswordWord.activity_id)
        .join(Step, Step.id == Activity.step_id)
        .where(*published)
    ):
        rows.append((ChunkSource.activity, activity_id, text))
    for task in await db.scalars(
        select(Task).join(Step, Step.id == Task.step_id).where(Step.topic_id == topic_id)
    ):
        rows.append(
            (ChunkSource.task, task.id, f"{task.title}. {task.description}"[:TASK_TEXT_CHARS])
        )
    return rows


@job(INDEX_QUESTIONS_JOB)
async def index_topic_questions_job(ctx: JobContext, topic_id: int) -> None:
    ai = await _ready_ai(ctx)
    if ai is None:
        return
    async with ctx.sessionmaker() as db:
        subject_id = await _topic_subject(db, topic_id)
        rows = await _question_rows(db, topic_id)
    if subject_id is None:
        return
    vectors = await ai.embedder.embed([r[2] for r in rows], "document") if rows else []
    async with ctx.sessionmaker() as db:
        await ai.vectors.delete(db, source_types=QUESTION_SOURCES, topic_id=topic_id)
        await ai.vectors.add(
            db,
            [
                ChunkRow(source, source_id, subject_id, topic_id, None, i, text, v)
                for i, ((source, source_id, text), v) in enumerate(zip(rows, vectors, strict=True))
            ],
            ai.embedder.model_name,
        )
        await db.commit()


@job(REINDEX_JOB)
async def reindex_all_job(ctx: JobContext, everything: bool = False) -> None:
    """Model o'zgargan (yoki `everything`) bo'laklarni qayta quradi. Ketma-ket, provayder
    limitiga mos; har manba xatosi qolganlarini to'xtatmaydi."""
    ai = await _ready_ai(ctx)
    if ai is None:
        return
    async with ctx.sessionmaker() as db:
        if everything:
            materials = list(
                await db.scalars(select(Material.id).where(Material.status == MaterialStatus.ready))
            )
            topics = list(await db.scalars(select(Topic.id)))
        else:
            stale = DocChunk.embedding_model != ai.embedder.model_name
            materials = list(
                await db.scalars(
                    select(DocChunk.source_id)
                    .where(stale, DocChunk.source_type == ChunkSource.material)
                    .distinct()
                )
            )
            topics = [
                t
                for t in await db.scalars(select(DocChunk.topic_id).where(stale).distinct())
                if t is not None
            ]
    for material_id in materials:
        await index_material_quietly(ctx, material_id)
    for topic_id in topics:
        try:
            await index_topic_glossary_job(ctx, topic_id=topic_id)
            await index_topic_questions_job(ctx, topic_id=topic_id)
        except Exception:
            logger.exception("reindex failed for topic %s", topic_id)


async def index_material_quietly(ctx: JobContext, material_id: int) -> None:
    """Boshqa jarayon (konvertatsiya, reindex) ichidan chaqirish uchun: xato faqat logga."""
    try:
        await index_material_job(ctx, material_id=material_id)
    except Exception:
        logger.exception("index_material failed for %s", material_id)


async def enqueue_questions_for_step(db: AsyncSession, jobs: JobRunner, step_id: int) -> None:
    topic_id = await db.scalar(select(Step.topic_id).where(Step.id == step_id))
    if topic_id is not None:
        await jobs.enqueue(INDEX_QUESTIONS_JOB, topic_id=topic_id)
