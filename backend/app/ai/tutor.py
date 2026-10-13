"""Talaba repetitori: tayyor javoblar, qidiruv kaskadi, maslahat rejimi, prompt va SSE oqimi."""

import json
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai import usage
from app.ai.constants import HISTORY_MESSAGES, TOP_K
from app.ai.models import (
    CONTEXT_SOURCES,
    QUESTION_SOURCES,
    AiConversation,
    AiMessage,
    ChunkSource,
    MessageMode,
    MessageRole,
)
from app.ai.providers import ChatMessage, ProviderBusy
from app.ai.schemas import ChatIn, ChatMeta, Citation
from app.ai.services import AiServices, require_ai
from app.ai.vectors import Hit
from app.assessment.models import Attempt, Submission
from app.auth.models import User
from app.core.config import Settings
from app.core.errors import AppError
from app.learning import progress
from app.learning.models import Material, Topic

BUSY_MESSAGE = "AI hozir band, birozdan so'ng urinib ko'ring"
REFUSAL = {
    "uz": "Bu savol platformadagi mavzularga tegishli emas yoki materiallarda javob topilmadi. "
    "Iltimos, dars mavzusi bo'yicha savol bering.",
    "ru": "Этот вопрос не относится к темам платформы или ответ не найден в материалах. "
    "Пожалуйста, задайте вопрос по теме урока.",
}
CANNED = [
    (
        re.compile(r"^\s*(salom|assalomu|привет|здравствуй)\W*$", re.I),
        {
            "uz": "Salom! Dars mavzusi bo'yicha savolingizni yozing.",
            "ru": "Здравствуйте! Задайте вопрос по теме урока.",
        },
    ),
    (
        re.compile(r"(platformadan qanday foydalan|как пользоваться платформой)", re.I),
        {
            "uz": "Fanni tanlang, mavzuni oching va bosqichlarni ketma-ket bajaring. "
            "Tushunmagan joyingizni shu yerda so'rang.",
            "ru": "Выберите предмет, откройте тему и проходите этапы по порядку. "
            "Непонятное спрашивайте здесь.",
        },
    ),
]
SYSTEM = (
    "Sen o'quv platformasidagi repetitorsan. Faqat quyida berilgan parchalar asosida javob ber. "
    "Har bir fikrdan keyin manbani [n] ko'rinishida ko'rsat. Savol qaysi tilda bo'lsa, "
    "o'sha tilda javob ber. Parchalarda javob bo'lmasa, buni ochiq ayt va taxmin qilma."
)
HINT = (
    " Talaba hali yakunlamagan topshiriq haqida so'rayapti: tayyor javobni, variant harfini "
    "yoki so'zni aytma. Faqat tushunchani tushuntir va o'zi topishiga yo'naltir."
)
_REF = re.compile(r"\[(\d+)\]")


@dataclass
class Prepared:
    conversation_id: int | None
    topic_id: int | None
    message: str
    mode: MessageMode
    canned_text: str | None = None
    citations: list[Citation] = field(default_factory=list)
    prompt: list[ChatMessage] = field(default_factory=list)
    system: str = SYSTEM


async def own_conversation(db: AsyncSession, user: User, conversation_id: int) -> AiConversation:
    conv = await db.get(AiConversation, conversation_id)
    if conv is None or conv.user_id != user.id:
        raise AppError(404, "CONVERSATION_NOT_FOUND", "Suhbat topilmadi")
    return conv


async def _visible_topic_ids(db: AsyncSession, subject_id: int | None) -> list[int]:
    subjects = await progress.published_subjects(db)
    ids = [s.id for s in subjects if subject_id is None or s.id == subject_id]
    return [t.id for t in await progress.published_topics(db, ids)] if ids else []


async def _retrieve(
    db: AsyncSession, ai: AiServices, vec: list[float], topic: Topic | None, settings: Settings
) -> list[Hit]:
    """Mavzu → fan → platforma. Chegaradan o'tgan birinchi daraja qaytariladi, bo'lmasa []."""
    levels: list[list[int]] = []
    if topic is not None:
        levels += [[topic.id], await _visible_topic_ids(db, topic.subject_id)]
    levels.append(await _visible_topic_ids(db, None))
    for topic_ids in levels:
        hits = await ai.vectors.search(
            db, vec, source_types=CONTEXT_SOURCES, topic_ids=topic_ids, k=TOP_K
        )
        if hits and hits[0].score >= settings.ai_min_similarity:
            return hits
    return []


async def _is_hint(
    db: AsyncSession,
    ai: AiServices,
    vec: list[float],
    user: User,
    topic: Topic | None,
    settings: Settings,
) -> bool:
    """Savol shu mavzuning hali yakunlanmagan topshirig'iga juda o'xshashmi."""
    if topic is None:
        return False
    hits = await ai.vectors.search(
        db, vec, source_types=QUESTION_SOURCES, topic_ids=[topic.id], k=3
    )
    for hit in hits:
        if hit.score < settings.ai_hint_similarity:
            break
        if hit.source_type == ChunkSource.activity:
            done = exists().where(Attempt.user_id == user.id, Attempt.activity_id == hit.source_id)
        else:
            done = exists().where(
                Submission.user_id == user.id, Submission.task_id == hit.source_id
            )
        if not await db.scalar(select(done)):
            return True
    return False


async def _citations(db: AsyncSession, hits: list[Hit]) -> list[Citation]:
    material_ids = [h.source_id for h in hits if h.source_type == ChunkSource.material]
    titles: dict[int, str] = {}
    if material_ids:
        rows = await db.execute(
            select(Material.id, Material.title).where(Material.id.in_(material_ids))
        )
        titles = {row.id: row.title for row in rows}
    return [
        Citation(
            n=i,
            source_type=h.source_type.value,
            source_id=h.source_id,
            page=h.page,
            title=titles.get(h.source_id, "")
            if h.source_type == ChunkSource.material
            else "Glossariy",
        )
        for i, h in enumerate(hits, start=1)
    ]


async def prepare(
    db: AsyncSession, ai: AiServices, settings: Settings, user: User, data: ChatIn
) -> Prepared:
    """Oqimdan oldingi hamma tekshiruvlar: xato bo'lsa oddiy JSON xato (SSE boshlanmaydi)."""
    await require_ai(db, ai)
    conv = await own_conversation(db, user, data.conversation_id) if data.conversation_id else None
    conv_id = conv.id if conv else None
    topic_id = data.topic_id or (conv.topic_id if conv else None)
    topic = None
    if topic_id:
        topic = await progress.visible_topic_or(
            db, user, topic_id, AppError(404, "TOPIC_NOT_FOUND", "Mavzu topilmadi")
        )
    lang = user.locale.value
    for pattern, answers in CANNED:
        if pattern.search(data.message):
            text = answers.get(lang, answers["uz"])
            return Prepared(conv_id, topic_id, data.message, MessageMode.canned, canned_text=text)
    await usage.ensure_within_limit(db, user)
    try:
        [vec] = await ai.embedder.embed([data.message], "query")
    except ProviderBusy:
        raise AppError(503, "AI_BUSY", BUSY_MESSAGE) from None
    hits = await _retrieve(db, ai, vec, topic, settings)
    if not hits:
        text = REFUSAL.get(lang, REFUSAL["uz"])
        return Prepared(conv_id, topic_id, data.message, MessageMode.refusal, canned_text=text)
    hint = await _is_hint(db, ai, vec, user, topic, settings)
    history: list[ChatMessage] = []
    if conv is not None:
        recent = await db.scalars(
            select(AiMessage)
            .where(AiMessage.conversation_id == conv.id)
            .order_by(AiMessage.id.desc())
            .limit(HISTORY_MESSAGES)
        )
        history = [
            ChatMessage("assistant" if m.role == MessageRole.assistant else "user", m.content)
            for m in reversed(list(recent))
        ]
    context = "\n\n".join(
        f"[{i}] (sahifa {h.page or '-'})\n{h.text}" for i, h in enumerate(hits, start=1)
    )
    question = ChatMessage("user", f"Parchalar:\n{context}\n\nSavol: {data.message}")
    return Prepared(
        conv_id,
        topic_id,
        data.message,
        MessageMode.hint if hint else MessageMode.answer,
        citations=await _citations(db, hits),
        prompt=[*history, question],
        system=SYSTEM + (HINT if hint else ""),
    )


def _sse(event: str, payload: object) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def _save(
    sessionmaker: async_sessionmaker[AsyncSession],
    user: User,
    prep: Prepared,
    answer: str,
    citations: list[Citation],
    count_usage: bool,
) -> int:
    async with sessionmaker() as db:
        conv = await db.get(AiConversation, prep.conversation_id) if prep.conversation_id else None
        if conv is None:
            conv = AiConversation(user_id=user.id, topic_id=prep.topic_id, title=prep.message[:80])
            db.add(conv)
            await db.flush()
        db.add_all(
            [
                AiMessage(
                    conversation_id=conv.id,
                    role=MessageRole.user,
                    content=prep.message,
                    citations=[],
                    mode=None,
                ),
                AiMessage(
                    conversation_id=conv.id,
                    role=MessageRole.assistant,
                    content=answer,
                    citations=[c.model_dump() for c in citations],
                    mode=prep.mode,
                ),
            ]
        )
        if count_usage:
            await usage.record_request(db, user)
        await db.commit()
        return conv.id


async def stream(
    prep: Prepared, ai: AiServices, user: User, sessionmaker: async_sessionmaker[AsyncSession]
) -> AsyncIterator[str]:
    """SSE hodisalari: `delta`… → `meta` → `done` (xatoda `error`). Saqlash yangi sessiyada,
    chunki so'rov sessiyasi oqim davomida yopilgan bo'lishi mumkin."""
    if prep.canned_text is not None:
        count_usage = prep.mode == MessageMode.refusal
        conv_id = await _save(sessionmaker, user, prep, prep.canned_text, [], count_usage)
        yield _sse("delta", {"text": prep.canned_text})
        yield _sse("meta", ChatMeta(conversation_id=conv_id, mode=prep.mode).model_dump())
        yield _sse("done", {})
        return
    parts: list[str] = []
    try:
        async for piece in ai.llm.stream(ai.chat_model, prep.system, prep.prompt):
            parts.append(piece)
            yield _sse("delta", {"text": piece})
    except ProviderBusy:
        yield _sse("error", {"code": "AI_BUSY", "message": BUSY_MESSAGE})
        return
    answer = "".join(parts)
    used = {int(n) for n in _REF.findall(answer)}
    citations = [c for c in prep.citations if c.n in used]
    conv_id = await _save(sessionmaker, user, prep, answer, citations, True)
    meta = ChatMeta(conversation_id=conv_id, mode=prep.mode, citations=citations)
    yield _sse("meta", meta.model_dump(mode="json"))
    yield _sse("done", {})
