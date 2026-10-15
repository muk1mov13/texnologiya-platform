"""`resource/` papkasidagi tayyor materiallarni bazaga import qilish.

`python -m app.cli import-resources --path <papka>` orqali ishga tushiriladi. Fan sarlavha
(slug) bo'yicha, mavzu esa (fan, mashg'ulot turi, sarlavha) bo'yicha topiladi: mavjud mavzu
qayta yaratilmaydi, `--force` bilan esa o'chirilib qaytadan import qilinadi. Hammasi darhol
nashr qilinadi. Materiallar navbatga qo'yilmaydi, balki ketma-ket konvertatsiya qilinadi:
60 ta mavzuning fayllari bir vaqtda LibreOffice jarayonlarini ishga tushirib yubormasligi uchun.
"""

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.indexing import (
    index_library_job,
    index_material_quietly,
    index_topic_glossary_job,
    index_topic_questions_job,
)
from app.ai.services import build_ai
from app.assessment import activities, tasks
from app.assessment.models import TaskType
from app.assessment.schemas import (
    CrosswordActivityIn,
    CrosswordItemIn,
    QuizActivityIn,
    QuizItemIn,
    TaskIn,
)
from app.core.config import Settings
from app.core.db import make_engine, make_sessionmaker
from app.core.errors import AppError
from app.core.jobs import JobContext
from app.core.storage import Storage
from app.learning import convert, editing, syllabus, topic_items
from app.learning import resource_parse as rp
from app.learning.materials import convert_material_job
from app.learning.models import (
    LessonType,
    Material,
    MaterialStatus,
    Step,
    StepKind,
    Subject,
    Topic,
)
from app.learning.schemas import GlossaryIn, LiteratureIn, SubjectCreate, TopicCreate
from app.library.models import Document, Folder, LibrarySection

logger = logging.getLogger(__name__)

LESSON_LABELS = {
    LessonType.lecture: "Ma'ruza",
    LessonType.practical: "Amaliy mashg'ulot",
    LessonType.seminar: "Seminar",
    LessonType.lab: "Laboratoriya ishi",
}
SYLLABUS_FOLDER = "O'quv dasturlari"
TASK_MAX_SCORE = 10


@dataclass
class ImportReport:
    subjects: int = 0
    topics_created: int = 0
    topics_skipped: int = 0
    materials: int = 0
    materials_failed: int = 0
    quizzes: int = 0
    crosswords: int = 0
    tasks: int = 0
    glossary: int = 0
    literature: int = 0
    syllabi: int = 0
    warnings: list[str] = field(default_factory=list)


class _Reader:
    """Matnli fayllarni o'qiydi; xatolarni (LibreOffice yo'q, buzilgan fayl) ogohlantirishga
    aylantiradi."""

    def __init__(self, settings: Settings, report: ImportReport) -> None:
        self.settings = settings
        self.report = report

    async def lines(self, label: str, path: Path | None) -> list[str]:
        if path is None:
            return []
        try:
            return await rp.read_lines(
                path,
                soffice=self.settings.soffice_path,
                timeout=self.settings.conversion_timeout_seconds,
            )
        except convert.ConversionError as exc:
            self.report.warnings.append(f"{label}: {path.name} o'qilmadi ({exc.code})")
        except Exception as exc:  # buzilgan DOCX va h.k.: import davom etadi
            self.report.warnings.append(f"{label}: {path.name} o'qilmadi ({type(exc).__name__})")
        return []


@dataclass
class _Parsed:
    title: str
    quiz: list[rp.QuizItem]
    crossword: list[rp.CrosswordItem]
    task: rp.TaskText | None
    glossary: list[rp.GlossaryItem]
    literature: list[rp.LiteratureEntry]


async def _parse_topic(reader: _Reader, source: rp.TopicSource, label: str) -> _Parsed:
    files = source.files
    title = rp.parse_title(await reader.lines(label, files.get("lecture")))
    return _Parsed(
        title=title or label,
        quiz=rp.parse_quiz(await reader.lines(label, files.get("quiz"))),
        crossword=rp.parse_crossword(await reader.lines(label, files.get("crossword"))),
        task=rp.parse_task(await reader.lines(label, files.get("task")), "Mustaqil topshiriq"),
        glossary=rp.parse_glossary(await reader.lines(label, files.get("glossary"))),
        literature=rp.parse_literature(await reader.lines(label, files.get("literature"))),
    )


def _label(subject: rp.SubjectSource, source: rp.TopicSource) -> str:
    return f"{subject.title} / {LESSON_LABELS[source.lesson_type]} {source.number}"


# --- bazaga yozish -------------------------------------------------------------------------


async def _get_or_create_subject(db: AsyncSession, title: str) -> Subject:
    subject = await db.scalar(select(Subject).where(Subject.slug == editing.slugify(title)))
    if subject is None:
        subject = await editing.create_subject(db, SubjectCreate(title=title, is_published=True))
    return subject


async def _steps(db: AsyncSession, topic_id: int) -> dict[StepKind, Step]:
    rows = await db.scalars(select(Step).where(Step.topic_id == topic_id))
    return {step.kind: step for step in rows}


async def _add_material(
    db: AsyncSession, ctx: JobContext, step: Step, title: str, source: Path
) -> Material:
    rel = ctx.storage.import_file(source, "materials", source.suffix.lower())
    material = Material(
        step_id=step.id,
        title=title,
        original_file=rel,
        original_name=source.name[:255],
        status=MaterialStatus.processing,
    )
    if source.suffix.lower() == rp.PDF_EXT:
        # Tayyor PDF: `materials.upload_material` kabi darhol tayyor (konvertatsiyasiz).
        try:
            material.page_count = convert.count_pages(ctx.storage.path(rel))
            material.pdf_file = rel
            material.status = MaterialStatus.ready
        except convert.ConversionError:
            material.status = MaterialStatus.failed
            material.error = "INVALID_PDF"
        db.add(material)
        await db.commit()
        await index_material_quietly(ctx, material.id)
        return material
    db.add(material)
    await db.commit()
    # Konvertatsiya + AI indekslash shu yerda kutiladi (job o'z qisqa sessiyalarini ochadi).
    await convert_material_job(ctx, material_id=material.id)
    await db.refresh(material)
    return material


async def _add_activity(
    db: AsyncSession,
    step: Step,
    build: Callable[[], QuizActivityIn | CrosswordActivityIn],
    label: str,
    report: ImportReport,
) -> bool:
    try:
        data = build()
    except ValidationError as exc:
        report.warnings.append(f"{label}: faoliyat yaroqsiz ({exc.error_count()} xato)")
        return False
    if isinstance(data, CrosswordActivityIn):
        # Algoritm joylay olmagan so'zlar tashlanadi, kamida 3 ta qolsa qayta uriniladi.
        while True:
            try:
                activities._prepare_crossword(data.items)
                break
            except AppError as exc:
                dropped = set(exc.details.get("words", []))
                remaining = [item for item in data.items if item.word not in dropped]
                if exc.code != "CROSSWORD_UNPLACEABLE" or len(remaining) < 3:
                    report.warnings.append(f"{label}: krossvord qo'shilmadi ({exc.code})")
                    return False
                report.warnings.append(f"{label}: krossvordga sig'magan: {', '.join(dropped)}")
                data = data.model_copy(update={"items": remaining})
    activity = await activities.create_activity(db, step, data)
    await activities.set_published(db, activity, True)
    return True


async def _import_topic(
    db: AsyncSession,
    ctx: JobContext,
    subject: Subject,
    source: rp.TopicSource,
    parsed: _Parsed,
    label: str,
    report: ImportReport,
) -> Topic:
    topic = await editing.create_topic(
        db,
        subject.id,
        TopicCreate(title=parsed.title, lesson_type=source.lesson_type, is_published=True),
    )
    steps = await _steps(db, topic.id)
    for key, kind, title in (
        ("lecture", StepKind.lecture, "Ma'ruza matni"),
        ("presentation", StepKind.presentation, "Interaktiv o'yin"),
    ):
        path = source.files.get(f"{key}_pdf") or source.files.get(key)
        if path is None:
            continue
        material = await _add_material(db, ctx, steps[kind], title, path)
        report.materials += 1
        if material.status != MaterialStatus.ready:
            report.materials_failed += 1
            report.warnings.append(f"{label}: {path.name} PDF'ga o'girilmadi ({material.error})")

    if parsed.crossword and await _add_activity(
        db,
        steps[StepKind.review],
        lambda: CrosswordActivityIn(
            type="crossword",
            title="Krossvord",
            items=[CrosswordItemIn(word=i.word, clue=i.clue) for i in parsed.crossword],
        ),
        label,
        report,
    ):
        report.crosswords += 1
    if parsed.quiz and await _add_activity(
        db,
        steps[StepKind.practice],
        lambda: QuizActivityIn(
            type="quiz",
            title="Test",
            items=[
                QuizItemIn(text=q.text, options=q.options, correct_index=q.correct_index)
                for q in parsed.quiz
            ],
        ),
        label,
        report,
    ):
        report.quizzes += 1
    if parsed.task is not None:
        await tasks.upsert_task(
            db,
            steps[StepKind.task],
            TaskIn(
                title=parsed.task.title,
                description=parsed.task.description,
                type=TaskType.both,
                max_score=TASK_MAX_SCORE,
            ),
        )
        report.tasks += 1
    for term in parsed.glossary:
        try:
            data = GlossaryIn(term=term.term, definition=term.definition)
        except ValidationError:
            report.warnings.append(f"{label}: atama tashlandi: {term.term[:40]}")
            continue
        await topic_items.add_glossary_term(db, topic.id, data)
        report.glossary += 1
    for entry in parsed.literature:
        try:
            item = LiteratureIn(
                title=entry.title, author=entry.author, year=entry.year, url=entry.url
            )
        except ValidationError:
            item = LiteratureIn(title=entry.title, author=entry.author)
        await topic_items.add_literature(db, topic.id, item)
        report.literature += 1

    # AI repetitori uchun glossariy va savollar indeksi (AI o'chiq bo'lsa hech narsa qilmaydi).
    for index_job in (index_topic_glossary_job, index_topic_questions_job):
        try:
            await index_job(ctx, topic_id=topic.id)
        except Exception:
            logger.exception("Mavzu indekslanmadi: topic_id=%s", topic.id)
    return topic


async def _syllabus_folder(db: AsyncSession) -> Folder:
    folder = await db.scalar(
        select(Folder).where(
            Folder.section == LibrarySection.metodik,
            Folder.parent_id.is_(None),
            Folder.title == SYLLABUS_FOLDER,
        )
    )
    if folder is None:
        folder = Folder(section=LibrarySection.metodik, title=SYLLABUS_FOLDER, order=0)
        db.add(folder)
        await db.commit()
    return folder


async def _import_syllabus(
    db: AsyncSession, ctx: JobContext, subject: Subject, path: Path, report: ImportReport
) -> None:
    try:
        await syllabus.attach_syllabus(
            db, subject, path, path.name, settings=ctx.settings, storage=ctx.storage
        )
    except AppError as exc:
        report.warnings.append(f"{subject.title}: o'quv dasturi qo'shilmadi ({exc.code})")
        return
    assert subject.syllabus_pdf is not None and subject.syllabus_name is not None
    folder = await _syllabus_folder(db)
    title = f"{subject.title} — o'quv dasturi"
    old = await db.scalar(
        select(Document).where(Document.folder_id == folder.id, Document.title == title)
    )
    if old is not None:
        await db.delete(old)
        await db.commit()
        ctx.storage.delete_quietly([old.file])
    source = ctx.storage.path(subject.syllabus_pdf)
    document = Document(
        folder_id=folder.id,
        title=title,
        file=ctx.storage.import_file(source, "library", ".pdf"),
        original_name=subject.syllabus_name,
        size=source.stat().st_size,
    )
    db.add(document)
    await db.commit()
    try:
        await index_library_job(ctx, source="document", source_id=document.id)
    except Exception:
        logger.exception("Kutubxona hujjati indekslanmadi: document_id=%s", document.id)
    report.syllabi += 1


async def _existing_topic(
    db: AsyncSession, subject_id: int, lesson_type: LessonType, title: str
) -> Topic | None:
    return await db.scalar(
        select(Topic).where(
            Topic.subject_id == subject_id,
            Topic.lesson_type == lesson_type,
            Topic.title == title,
        )
    )


def _needs_soffice(sources: list[rp.SubjectSource]) -> bool:
    """LibreOffice faqat .doc matn, PDF'i yo'q material yoki DOC/DOCX o'quv dasturi uchun kerak."""
    for subject in sources:
        if subject.syllabus is not None and subject.syllabus.suffix.lower() != rp.PDF_EXT:
            return True
        for topic in subject.topics:
            files = topic.files
            if any(key in files and f"{key}_pdf" not in files for key in rp.MATERIAL_KEYS) or any(
                path.suffix.lower() == ".doc" for path in files.values()
            ):
                return True
    return False


async def import_resources(
    settings: Settings,
    root: Path,
    *,
    force: bool = False,
    dry_run: bool = False,
    allow_no_soffice: bool = False,
) -> ImportReport:
    report = ImportReport()
    sources = rp.scan(root)
    if _needs_soffice(sources) and convert.resolve_soffice(settings.soffice_path) is None:
        message = (
            "LibreOffice topilmadi (SOFFICE_PATH): .doc fayllar o'qilmaydi, "
            "PDF'i yo'q materiallar va DOC/DOCX o'quv dasturlari PDF'ga o'girilmaydi"
        )
        if not dry_run and not allow_no_soffice:
            raise ValueError(message)
        report.warnings.append(message)
    reader = _Reader(settings, report)
    if dry_run:
        for subject_source in sources:
            report.subjects += 1
            report.syllabi += subject_source.syllabus is not None
            for source in subject_source.topics:
                label = _label(subject_source, source)
                parsed = await _parse_topic(reader, source, label)
                report.topics_created += 1
                report.materials += sum(
                    k in source.files or f"{k}_pdf" in source.files for k in rp.MATERIAL_KEYS
                )
                report.quizzes += bool(parsed.quiz)
                report.crosswords += len(parsed.crossword) >= 3
                report.tasks += parsed.task is not None
                report.glossary += len(parsed.glossary)
                report.literature += len(parsed.literature)
                pdfs = ",".join(
                    number
                    for number, key in (("2", "lecture"), ("7", "presentation"))
                    if f"{key}_pdf" in source.files
                )
                print(
                    f"{label}: «{parsed.title[:60]}» test={len(parsed.quiz)} "
                    f"krossvord={len(parsed.crossword)} glossariy={len(parsed.glossary)} "
                    f"adabiyot={len(parsed.literature)} topshiriq={parsed.task is not None} "
                    f"pdf={pdfs or '-'}"
                )
        return report

    engine = make_engine(settings.database_url)
    sessionmaker = make_sessionmaker(engine)
    storage = Storage(Path(settings.media_root))
    ctx = JobContext(
        sessionmaker=sessionmaker,
        settings=settings,
        storage=storage,
        ai=build_ai(settings, engine.dialect.name),
    )
    try:
        async with sessionmaker() as db:
            for subject_source in sources:
                subject = await _get_or_create_subject(db, subject_source.title)
                report.subjects += 1
                for source in subject_source.topics:
                    label = _label(subject_source, source)
                    parsed = await _parse_topic(reader, source, label)
                    existing = await _existing_topic(
                        db, subject.id, source.lesson_type, parsed.title
                    )
                    if existing is not None and not force:
                        report.topics_skipped += 1
                        continue
                    if existing is not None:
                        storage.delete_quietly(await editing.delete_topic(db, existing))
                    await _import_topic(db, ctx, subject, source, parsed, label, report)
                    report.topics_created += 1
                    print(f"+ {label}: {parsed.title[:60]}", flush=True)
                if subject_source.syllabus is not None and (force or subject.syllabus_pdf is None):
                    await _import_syllabus(db, ctx, subject, subject_source.syllabus, report)
    finally:
        await engine.dispose()
    return report
