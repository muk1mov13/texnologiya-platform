"""AI qoralamalari: LLM natijasi mavjud kirish sxemalari bilan tekshiriladi va tasdiqlangach
mavjud saqlash funksiyalari orqali haqiqiy (nashr qilinmagan) yozuvga aylanadi."""

import json
import logging
from typing import Any

from pydantic import BaseModel, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.constants import DRAFT_CONTEXT_CHARS, GENERATE_DRAFT_JOB, INDEX_GLOSSARY_JOB
from app.ai.indexing import enqueue_questions_for_step
from app.ai.models import AiDraft, ChunkSource, DocChunk, DraftKind, DraftStatus
from app.ai.providers import ChatMessage, ProviderBusy
from app.ai.schemas import DraftCreateIn
from app.assessment import activities, crossword, tasks
from app.assessment.schemas import CrosswordActivityIn, QuizActivityIn, TaskIn, YesNoActivityIn
from app.auth.models import User
from app.core.errors import AppError
from app.core.jobs import JobContext, JobRunner, job
from app.learning import editing, topic_items
from app.learning.models import Material, MaterialStatus, Step, StepKind
from app.learning.schemas import GlossaryIn

logger = logging.getLogger(__name__)


# --- LLM chiqish sxemalari: Gemini `response_schema` uchun oddiy tiplar, cheklovsiz --------


class QuizItemGen(BaseModel):
    text: str
    options: list[str]
    correct_index: int
    explanation: str = ""


class QuizGen(BaseModel):
    title: str
    items: list[QuizItemGen]

    @classmethod
    def fake_sample(cls) -> dict[str, Any]:
        items = [
            {"text": f"{n}-savol?", "options": ["A", "B", "C", "D"], "correct_index": 0}
            for n in range(1, 4)
        ]
        return {"title": "Sinov testi", "items": items}


class YesNoItemGen(BaseModel):
    statement: str
    answer: bool
    explanation: str = ""


class YesNoGen(BaseModel):
    title: str
    items: list[YesNoItemGen]

    @classmethod
    def fake_sample(cls) -> dict[str, Any]:
        items = [{"statement": f"{n}-bayonot", "answer": n % 2 == 0} for n in range(1, 4)]
        return {"title": "Sinov ha/yo'q", "items": items}


class WordGen(BaseModel):
    word: str
    clue: str


class CrosswordGen(BaseModel):
    title: str
    items: list[WordGen]

    @classmethod
    def fake_sample(cls) -> dict[str, Any]:
        words = [("OLMA", "Meva"), ("ANOR", "Qizil meva"), ("ARRA", "Asbob")]
        return {"title": "Sinov krossvordi", "items": [{"word": w, "clue": c} for w, c in words]}


class TermGen(BaseModel):
    term: str
    definition: str


class GlossaryGen(BaseModel):
    items: list[TermGen]

    @classmethod
    def fake_sample(cls) -> dict[str, Any]:
        return {"items": [{"term": f"Atama {n}", "definition": f"Ta'rif {n}"} for n in (1, 2, 3)]}


class TaskGen(BaseModel):
    title: str
    description: str
    rubric: str = ""

    @classmethod
    def fake_sample(cls) -> dict[str, Any]:
        return {
            "title": "Sinov vazifasi",
            "description": "Mavzu bo'yicha insho yozing.",
            "rubric": "Mazmun 10 ball",
        }


GEN_SCHEMAS: dict[DraftKind, type[BaseModel]] = {
    DraftKind.quiz: QuizGen,
    DraftKind.yesno: YesNoGen,
    DraftKind.crossword: CrosswordGen,
    DraftKind.glossary: GlossaryGen,
    DraftKind.task: TaskGen,
}
STEP_FOR_KIND: dict[DraftKind, set[StepKind]] = {
    DraftKind.quiz: {StepKind.review, StepKind.practice},
    DraftKind.yesno: {StepKind.review, StepKind.practice},
    DraftKind.crossword: {StepKind.review, StepKind.practice},
    DraftKind.glossary: {StepKind.glossary},
    DraftKind.task: {StepKind.task},
}
COUNT_RANGE: dict[DraftKind, tuple[int, int]] = {
    DraftKind.quiz: (3, 15),
    DraftKind.yesno: (3, 15),
    DraftKind.crossword: (5, 12),
    DraftKind.glossary: (3, 15),
    DraftKind.task: (1, 1),
}
DIFFICULTY = {"easy": "oson", "medium": "o'rtacha", "hard": "qiyin"}
BASE_PROMPT = (
    "Sen o'qituvchiga yordamchisan. Faqat foydalanuvchi bergan o'quv matni asosida, matn tilida, "
    "{difficulty} darajada ishla. Matnda yo'q faktlarni qo'shma. "
)
KIND_PROMPT = {
    DraftKind.quiz: "{count} ta test savoli tuz: har birida aynan 4 ta turli variant, bittasi "
    "to'g'ri (correct_index 0..3), qisqa izoh bilan. Faoliyatga qisqa nom ber.",
    DraftKind.yesno: "{count} ta 'ha yoki yo'q' bayonoti tuz (answer true/false), qisqa izoh "
    "bilan. Faoliyatga qisqa nom ber.",
    DraftKind.crossword: "Krossvord uchun {count} ta so'z va savol tuz: har so'z bitta so'z, "
    "faqat harflar, 3–12 harf, so'zlarda umumiy harflar ko'p bo'lsin. Faoliyatga qisqa nom ber.",
    DraftKind.glossary: "{count} ta muhim atama va ularning qisqa ta'rifini yoz.",
    DraftKind.task: "Mavzu bo'yicha bitta mustaqil ish topshirig'i yoz: nom, batafsil tavsif va "
    "baholash mezoni.",
}


class DraftInvalid(ValueError):
    pass


def _check_unique(values: list[str], what: str) -> None:
    lowered = [v.strip().lower() for v in values]
    if len(set(lowered)) != len(lowered):
        raise DraftInvalid(f"Takrorlangan {what} bor")


def validate_payload(kind: DraftKind, payload: dict[str, Any]) -> dict[str, Any]:
    """Payload'ni mavjud kirish sxemalari va qo'shimcha qoidalar bilan tekshiradi."""
    try:
        if kind == DraftKind.quiz:
            quiz = QuizActivityIn.model_validate({**payload, "type": "quiz"})
            for item in quiz.items:
                if len({o.strip().lower() for o in item.options}) != 4:
                    raise DraftInvalid("Har savolda 4 ta turli variant bo'lishi kerak")
            _check_unique([i.text for i in quiz.items], "savol")
            return quiz.model_dump(exclude={"type"})
        if kind == DraftKind.yesno:
            yesno = YesNoActivityIn.model_validate({**payload, "type": "yesno"})
            _check_unique([i.statement for i in yesno.items], "bayonot")
            return yesno.model_dump(exclude={"type"})
        if kind == DraftKind.crossword:
            cw = CrosswordActivityIn.model_validate({**payload, "type": "crossword"})
            try:
                cells = [crossword.normalize_word(i.word) for i in cw.items]
            except crossword.InvalidWordError as exc:
                raise DraftInvalid(f"Noto'g'ri so'z: {exc.word}") from None
            _check_unique(["".join(c) for c in cells], "so'z")
            try:
                crossword.build_layout(cells)
            except crossword.UnplaceableError as exc:
                bad = ", ".join(cw.items[i].word for i in exc.indexes)
                raise DraftInvalid(f"Krossvordga joylashmagan so'zlar: {bad}") from None
            return cw.model_dump(exclude={"type"})
        if kind == DraftKind.glossary:
            terms = TypeAdapter(list[GlossaryIn]).validate_python(payload.get("items", []))
            if not terms:
                raise DraftInvalid("Atamalar yo'q")
            _check_unique([t.term for t in terms], "atama")
            return {"items": [t.model_dump() for t in terms]}
        task = TaskIn.model_validate({"type": "both", "max_score": 10, "deadline": None, **payload})
        return task.model_dump(mode="json")
    except ValidationError as exc:
        raise DraftInvalid(str(exc.errors(include_url=False)[0]["msg"])) from None


def _to_payload(kind: DraftKind, generated: BaseModel) -> dict[str, Any]:
    data = generated.model_dump()
    if kind == DraftKind.task:
        return {**data, "rubric": data.get("rubric") or None}
    return data


async def _context_text(db: AsyncSession, material_ids: list[int]) -> str:
    rows = await db.scalars(
        select(DocChunk.text)
        .where(DocChunk.source_type == ChunkSource.material, DocChunk.source_id.in_(material_ids))
        .order_by(DocChunk.source_id, DocChunk.chunk_index)
    )
    parts: list[str] = []
    total = 0
    for text in rows:
        if total + len(text) > DRAFT_CONTEXT_CHARS:
            break
        parts.append(text)
        total += len(text)
    return "\n\n".join(parts)


async def _finish(
    ctx: JobContext, draft_id: int, *, payload: dict[str, Any] | None, error: str | None
) -> None:
    async with ctx.sessionmaker() as db:
        draft = await db.get(AiDraft, draft_id)
        if draft is None or draft.status != DraftStatus.generating:
            return
        draft.status = DraftStatus.draft if payload is not None else DraftStatus.failed
        draft.payload = payload
        draft.error = error[:500] if error else None
        await db.commit()


@job(GENERATE_DRAFT_JOB)
async def generate_draft_job(ctx: JobContext, draft_id: int) -> None:
    ai = ctx.ai
    async with ctx.sessionmaker() as db:
        draft = await db.get(AiDraft, draft_id)
        if draft is None or draft.status != DraftStatus.generating or ai is None:
            return
        kind = draft.kind
        params = dict(draft.params)
        context = await _context_text(db, list(params["material_ids"]))
    if not context:
        await _finish(ctx, draft_id, payload=None, error="NO_TEXT")
        return
    system = BASE_PROMPT.format(difficulty=DIFFICULTY[params["difficulty"]]) + KIND_PROMPT[
        kind
    ].format(count=params["count"])
    messages = [ChatMessage("user", f"O'quv matni:\n{context}")]
    error = "INVALID"
    for _attempt in range(2):  # xato bo'lsa xato matni bilan bir marta qayta so'raladi
        try:
            generated = await ai.llm.generate_json(
                ai.chat_model, system, messages, GEN_SCHEMAS[kind]
            )
            payload = validate_payload(kind, _to_payload(kind, generated))
        except ProviderBusy:
            await _finish(ctx, draft_id, payload=None, error="AI_BUSY")
            return
        except (ValidationError, DraftInvalid, json.JSONDecodeError) as exc:
            error = str(exc)
            messages = [*messages, ChatMessage("user", f"Natija xato: {error}. Qayta tuz.")]
            continue
        await _finish(ctx, draft_id, payload=payload, error=None)
        return
    await _finish(ctx, draft_id, payload=None, error=error)


def _not_found() -> AppError:
    return AppError(404, "AI_DRAFT_NOT_FOUND", "Qoralama topilmadi")


async def get_editable_draft(db: AsyncSession, user: User, draft_id: int) -> AiDraft:
    """Ruxsat bo'lmasa ham 404: qoralamaning borligi oshkor qilinmaydi."""
    draft = await db.get(AiDraft, draft_id)
    if draft is None:
        raise _not_found()
    try:
        await editing.ensure_can_edit_step(db, user, draft.step_id)
    except AppError:
        raise _not_found() from None
    return draft


async def create_draft(
    db: AsyncSession, user: User, data: DraftCreateIn, jobs: JobRunner
) -> AiDraft:
    step, _topic = await editing.ensure_can_edit_step(db, user, data.step_id)
    if step.kind not in STEP_FOR_KIND[data.kind]:
        raise AppError(400, "AI_DRAFT_WRONG_STEP", "Bu tur bu bosqichga mos emas")
    low, high = COUNT_RANGE[data.kind]
    count = min(max(data.count, low), high)
    ready = set(
        await db.scalars(
            select(Material.id)
            .join(Step, Step.id == Material.step_id)
            .where(
                Material.id.in_(data.material_ids),
                Step.topic_id == step.topic_id,
                Material.status == MaterialStatus.ready,
            )
        )
    )
    if ready != set(data.material_ids):
        raise AppError(
            422, "AI_DRAFT_INVALID", "Materiallar shu mavzuga tegishli va tayyor bo'lishi kerak"
        )
    draft = AiDraft(
        topic_id=step.topic_id,
        step_id=step.id,
        requested_by=user.id,
        kind=data.kind,
        params={"material_ids": data.material_ids, "count": count, "difficulty": data.difficulty},
    )
    db.add(draft)
    await db.commit()
    await jobs.enqueue(GENERATE_DRAFT_JOB, draft_id=draft.id)
    return draft


def _ensure_open(draft: AiDraft) -> None:
    if draft.status == DraftStatus.generating:
        raise AppError(409, "AI_DRAFT_NOT_READY", "Qoralama hali tayyorlanmoqda")
    if draft.status in (DraftStatus.approved, DraftStatus.rejected):
        raise AppError(409, "AI_DRAFT_CLOSED", "Qoralama yopilgan")


def _validated(draft: AiDraft, payload: dict[str, Any]) -> dict[str, Any]:
    try:
        return validate_payload(draft.kind, payload)
    except DraftInvalid as exc:
        raise AppError(422, "AI_DRAFT_INVALID", str(exc), {"message": str(exc)}) from None


async def update_draft(db: AsyncSession, draft: AiDraft, payload: dict[str, Any]) -> AiDraft:
    _ensure_open(draft)
    draft.payload = _validated(draft, payload)
    draft.status = DraftStatus.draft
    draft.error = None
    await db.commit()
    return draft


async def approve_draft(db: AsyncSession, draft: AiDraft, jobs: JobRunner) -> AiDraft:
    """Mavjud saqlash funksiyalari o'zlari commit qiladi; qoralama holati alohida commit."""
    _ensure_open(draft)
    if draft.payload is None:
        raise AppError(409, "AI_DRAFT_NOT_READY", "Qoralama hali tayyorlanmoqda")
    payload = _validated(draft, draft.payload)
    step = await db.get(Step, draft.step_id)
    if step is None:
        raise _not_found()
    ref: dict[str, Any]
    if draft.kind == DraftKind.quiz:
        quiz = QuizActivityIn.model_validate({**payload, "type": "quiz"})
        ref = {"activity_id": (await activities.create_activity(db, step, quiz)).id}
    elif draft.kind == DraftKind.yesno:
        yesno = YesNoActivityIn.model_validate({**payload, "type": "yesno"})
        ref = {"activity_id": (await activities.create_activity(db, step, yesno)).id}
    elif draft.kind == DraftKind.crossword:
        cw = CrosswordActivityIn.model_validate({**payload, "type": "crossword"})
        ref = {"activity_id": (await activities.create_activity(db, step, cw)).id}
    elif draft.kind == DraftKind.glossary:
        ids = []
        for item in payload["items"]:
            term = await topic_items.add_glossary_term(
                db, draft.topic_id, GlossaryIn.model_validate(item)
            )
            ids.append(term.id)
        ref = {"glossary_ids": ids}
        await jobs.enqueue(INDEX_GLOSSARY_JOB, topic_id=draft.topic_id)
    else:
        task = await tasks.upsert_task(db, step, TaskIn.model_validate(payload))
        ref = {"task_id": task.id}
        await enqueue_questions_for_step(db, jobs, step.id)
    draft.status = DraftStatus.approved
    draft.approved_ref = ref
    await db.commit()
    return draft


async def reject_draft(db: AsyncSession, draft: AiDraft) -> AiDraft:
    _ensure_open(draft)
    draft.status = DraftStatus.rejected
    await db.commit()
    return draft
