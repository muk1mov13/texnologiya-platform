"""Talaba repetitori: tayyor javoblar, qidiruv kaskadi, maslahat rejimi, prompt va SSE oqimi."""

import json
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai import usage
from app.ai.constants import CONTEXT_CHARS, FOLLOWUP_CHARS, HISTORY_MESSAGES, TOP_K, TOPIC_K
from app.ai.models import (
    CONTEXT_SOURCES,
    LIBRARY_SOURCES,
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
from app.learning.models import Material, Subject, Topic
from app.library.models import Book, Document

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
    "Sen o'quv platformasidagi repetitorsan. Doirang: {scope}. Qoidalar:\n"
    "1. Avval quyidagi parchalardan foydalan va har bir fikrdan keyin manbani [n] ko'rinishida "
    "ko'rsat.\n"
    "2. Parchalarda javob bo'lmasa, lekin savol shu doiraga aloqador bo'lsa (mavzuga yaqin "
    "tushuncha, misol, izoh), o'z bilimingdan qisqa va aniq javob ber. Bunday javobni "
    "\"Materiallarda bu haqda to'g'ridan-to'g'ri ma'lumot yo'q, umumiy ma'lumot:\" bilan boshla "
    "va unga [n] qo'yma. Ishonching komil bo'lmagan faktni to'qima.\n"
    "3. Savol bu doiraga umuman aloqador bo'lmasa, faqat bitta jumla bilan buni ayt va dars "
    "mavzusi bo'yicha savol berishni so'ra.\n"
    "4. Savol qaysi tilda bo'lsa, o'sha tilda javob ber."
)
HINT = (
    " Talaba hali yakunlamagan test yoki topshiriq savolini so'rayapti, shuning uchun javobni "
    "bevosita ham, bilvosita ham berma: variant harfi, son, sana, atama, so'z yoki ta'rifni "
    "aytma; savolga javob bo'ladigan ro'yxat yoki elementlarni to'liq sanab ham berma. "
    "Buning o'rniga 2-3 jumlada: tushunchaning umumiy ma'nosini tushuntir, materialning qaysi "
    "qismini [n] o'qish kerakligini ko'rsat va o'zi topishi uchun bitta yo'naltiruvchi savol ber. "
    "Bu rejimda umumiy bilimingdan ham javobni aytma."
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


def _within_budget(hits: list[Hit], budget: int) -> list[Hit]:
    """Takrorsiz, o'xshashlik tartibida, jami matn `budget` belgidan oshmaguncha."""
    picked: list[Hit] = []
    seen: set[tuple[ChunkSource, int, str]] = set()
    used = 0
    for hit in hits:
        key = (hit.source_type, hit.source_id, hit.text)
        if key in seen or (picked and used + len(hit.text) > budget):
            continue
        seen.add(key)
        picked.append(hit)
        used += len(hit.text)
    return picked


async def _retrieve(
    db: AsyncSession, ai: AiServices, vec: list[float], topic: Topic | None, settings: Settings
) -> list[Hit]:
    """Mavzu ochiq bo'lsa, uning eng mos bo'laklari chegarasiz olinadi (mavzu ichida rad etish
    yo'q); ular yetarlicha o'xshash bo'lmasa, fan va kutubxonadan chegaradan o'tganlari
    qo'shiladi. Mavzusiz: butun platforma + kutubxona, faqat chegaradan o'tganlari."""
    hits: list[Hit] = []
    if topic is not None:
        hits = await ai.vectors.search(
            db, vec, source_types=CONTEXT_SOURCES, topic_ids=[topic.id], k=TOPIC_K
        )
        if hits and hits[0].score >= settings.ai_min_similarity:
            return _within_budget(hits, CONTEXT_CHARS)
        wider_ids = await _visible_topic_ids(db, topic.subject_id)
    else:
        wider_ids = await _visible_topic_ids(db, None)
    wider = await ai.vectors.search(
        db,
        vec,
        source_types=CONTEXT_SOURCES + LIBRARY_SOURCES,
        topic_ids=wider_ids,
        k=TOP_K,
        include_library=True,
    )
    relevant = [h for h in wider if h.score >= settings.ai_min_similarity]
    return _within_budget(sorted(hits + relevant, key=lambda h: -h.score), CONTEXT_CHARS)


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


_TITLE_MODELS: dict[ChunkSource, type[Material] | type[Document] | type[Book]] = {
    ChunkSource.material: Material,
    ChunkSource.document: Document,
    ChunkSource.book: Book,
}
_FIXED_TITLES = {ChunkSource.glossary: "Glossariy", ChunkSource.topic_info: "Mavzu haqida"}


async def citations_for(db: AsyncSession, hits: list[Hit]) -> list[Citation]:
    titles: dict[tuple[ChunkSource, int], str] = {}
    for source, model in _TITLE_MODELS.items():
        ids = [h.source_id for h in hits if h.source_type == source]
        if ids:
            rows = await db.execute(select(model.id, model.title).where(model.id.in_(ids)))
            titles.update({(source, row.id): row.title for row in rows})
    return [
        Citation(
            n=i,
            source_type=h.source_type.value,
            source_id=h.source_id,
            page=h.page,
            title=_FIXED_TITLES.get(h.source_type) or titles.get((h.source_type, h.source_id), ""),
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
    # Qidiruv so'rovi: mavzu nomi ("Bu mavzuda..." kabi savollarda mazmunli so'z yo'q) va qisqa
    # ergashuvchi savolda ("batafsilroq tushuntir") oldingi savol ham. Ishora rejimi esa faqat
    # savolning o'zi bilan (nom topshiriqlarga ham o'xshatib yuboradi).
    previous = next((m.text for m in reversed(history) if m.role == "user"), None)
    search = data.message
    if previous and len(data.message) < FOLLOWUP_CHARS:
        search = f"{previous}. {search}"
    if topic is not None:
        search = f"{topic.title}. {search}"
    try:
        vecs = await ai.embedder.embed([data.message, search], "query")
    except ProviderBusy:
        raise AppError(503, "AI_BUSY", BUSY_MESSAGE) from None
    hits = await _retrieve(db, ai, vecs[1], topic, settings)
    scope = await _scope(db, topic)
    if scope is None:
        text = REFUSAL.get(lang, REFUSAL["uz"])
        return Prepared(conv_id, topic_id, data.message, MessageMode.refusal, canned_text=text)
    hint = await _is_hint(db, ai, vecs[0], user, topic, settings)
    context = "\n\n".join(
        f"[{i}] (sahifa {h.page or '-'})\n{h.text}" for i, h in enumerate(hits, start=1)
    )
    question = ChatMessage(
        "user", f"Parchalar:\n{context or '(mos parcha topilmadi)'}\n\nSavol: {data.message}"
    )
    return Prepared(
        conv_id,
        topic_id,
        data.message,
        MessageMode.hint if hint else MessageMode.answer,
        citations=await citations_for(db, hits),
        prompt=[*history, question],
        system=SYSTEM.format(scope=scope) + (HINT if hint else ""),
    )


async def _scope(db: AsyncSession, topic: Topic | None) -> str | None:
    """Repetitor doirasi: ochiq mavzu va uning fani yoki platformadagi fanlar ro'yxati.
    Chop etilgan fan bo'lmasa None (rad etiladi)."""
    if topic is not None:
        subject = await db.scalar(select(Subject.title).where(Subject.id == topic.subject_id))
        return f'"{subject}" fani, "{topic.title}" mavzusi'
    titles = [s.title for s in await progress.published_subjects(db)]
    if not titles:
        return None
    return "platformadagi fanlar: " + ", ".join(f'"{t}"' for t in titles)


def sse_event(event: str, payload: object) -> str:
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
        yield sse_event("delta", {"text": prep.canned_text})
        yield sse_event("meta", ChatMeta(conversation_id=conv_id, mode=prep.mode).model_dump())
        yield sse_event("done", {})
        return
    parts: list[str] = []
    try:
        async for piece in ai.llm.stream(ai.chat_model, prep.system, prep.prompt):
            parts.append(piece)
            yield sse_event("delta", {"text": piece})
    except ProviderBusy:
        yield sse_event("error", {"code": "AI_BUSY", "message": BUSY_MESSAGE})
        return
    answer = "".join(parts)
    used = {int(n) for n in _REF.findall(answer)}
    citations = [c for c in prep.citations if c.n in used]
    conv_id = await _save(sessionmaker, user, prep, answer, citations, True)
    meta = ChatMeta(conversation_id=conv_id, mode=prep.mode, citations=citations)
    yield sse_event("meta", meta.model_dump(mode="json"))
    yield sse_event("done", {})
