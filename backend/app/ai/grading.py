"""Vazifa javobini AI bilan baholash — faqat tavsiya; yakuniy ballni o'qituvchi qo'yadi.

AI'ga talabaning ismi, emaili va fayl nomi yuborilmaydi: faqat javob matni va topshiriq.
"""

import asyncio
import logging
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.chunking import pdf_pages
from app.ai.constants import AI_CHECK_JOB, SUBMISSION_TEXT_CHARS
from app.ai.models import ChunkSource
from app.ai.providers import ChatMessage, ProviderBusy
from app.ai.services import AiServices, ai_enabled
from app.assessment.models import AiCheckStatus, Submission, Task
from app.core.jobs import JobContext, JobRunner, job
from app.learning.models import Step

logger = logging.getLogger(__name__)

SYSTEM = (
    "Sen o'qituvchiga yordamchisan. Talaba javobini topshiriq va mezon bo'yicha 0 dan max_score "
    "gacha butun son bilan baholab, qisqa izoh, kuchli tomonlar va kamchiliklarni yoz (javob "
    "tilida, har ro'yxatda 5 tagacha). Mavzu parchalarini faktlarni tekshirish uchun ishlat."
)


class GradeGen(BaseModel):
    score: int
    feedback: str
    strengths: list[str]
    issues: list[str]

    @classmethod
    def fake_sample(cls) -> dict[str, Any]:
        return {"score": 7, "feedback": "Sinov bahosi", "strengths": ["Aniq"], "issues": []}


def extract_text(path: Path | None, text: str | None) -> str | None:
    """Textarea + PDF/DOCX matni. Boshqa fayl turi (DOC, PPT, rasm) va matnsiz bo'lsa `None`."""
    parts = [text.strip()] if text and text.strip() else []
    if path is not None:
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            parts += [p for p in pdf_pages(path) if p.strip()]
        elif suffix == ".docx":
            import docx

            parts += [p.text for p in docx.Document(str(path)).paragraphs if p.text.strip()]
    joined = "\n\n".join(parts).strip()
    return joined[:SUBMISSION_TEXT_CHARS] or None


async def queue_check(
    db: AsyncSession, ai: AiServices, jobs: JobRunner, submission_id: int
) -> None:
    """AI yoqilgan bo'lsa tekshiruvni navbatga qo'yadi. Xatosi javob yuborishni to'xtatmaydi."""
    try:
        if not await ai_enabled(db, ai):
            await db.commit()
            return
        submission = await db.get(Submission, submission_id)
        if submission is None:
            return
        submission.ai_status = AiCheckStatus.pending
        submission.ai_score = None
        submission.ai_feedback = None
        submitted_at = submission.submitted_at.isoformat()
        await db.commit()
        await jobs.enqueue(AI_CHECK_JOB, submission_id=submission_id, submitted_at=submitted_at)
    except Exception:
        logger.exception("queue_check failed for submission %s", submission_id)


async def _set_status(
    ctx: JobContext,
    submission_id: int,
    submitted_at: str,
    status: AiCheckStatus,
    result: GradeGen | None = None,
) -> None:
    async with ctx.sessionmaker() as db:
        submission = await db.get(Submission, submission_id)
        if submission is None or submission.submitted_at.isoformat() != submitted_at:
            return  # orada qayta yuborilgan yoki o'chirilgan — eski natija yozilmaydi
        submission.ai_status = status
        if result is not None:
            submission.ai_score = result.score
            submission.ai_feedback = {
                "feedback": result.feedback,
                "strengths": result.strengths[:5],
                "issues": result.issues[:5],
            }
        await db.commit()


@job(AI_CHECK_JOB)
async def ai_check_job(ctx: JobContext, submission_id: int, submitted_at: str) -> None:
    ai = ctx.ai
    if ai is None:
        return
    async with ctx.sessionmaker() as db:
        row = (
            await db.execute(
                select(Submission, Task, Step.topic_id)
                .join(Task, Task.id == Submission.task_id)
                .join(Step, Step.id == Task.step_id)
                .where(Submission.id == submission_id)
            )
        ).first()
    if row is None:
        return
    submission, task, topic_id = row
    path = ctx.storage.path(submission.file) if submission.file else None
    try:
        text = await asyncio.to_thread(extract_text, path, submission.text)
    except Exception:
        logger.exception("text extraction failed for submission %s", submission_id)
        text = None
    if text is None:
        await _set_status(ctx, submission_id, submitted_at, AiCheckStatus.unsupported)
        return
    try:
        [vec] = await ai.embedder.embed([text[:2000]], "query")
        async with ctx.sessionmaker() as db:
            hits = await ai.vectors.search(
                db, vec, source_types=[ChunkSource.material], topic_ids=[topic_id], k=4
            )
        context = "\n\n".join(h.text for h in hits)
        prompt = (
            f"Topshiriq: {task.title}\n{task.description}\n\n"
            f"Mezon: {task.rubric or '-'}\nmax_score: {task.max_score}\n\n"
            f"Mavzu parchalari:\n{context or '-'}\n\nTalaba javobi:\n{text}"
        )
        result = await ai.llm.generate_json(
            ai.chat_model, SYSTEM, [ChatMessage("user", prompt)], GradeGen
        )
    except (ProviderBusy, ValidationError) as exc:
        logger.warning("ai check failed for submission %s: %s", submission_id, type(exc).__name__)
        await _set_status(ctx, submission_id, submitted_at, AiCheckStatus.failed)
        return
    result.score = min(max(result.score, 0), task.max_score)
    await _set_status(ctx, submission_id, submitted_at, AiCheckStatus.done, result)
