# 3A: AI backend — implementatsiya rejasi

> **Bajarish tartibi (foydalanuvchi qoidalari):** `superpowers:executing-plans` bilan, shu sessiyada, **bir vaqtda bitta task**. Har task'dan keyin to'xtab, foydalanuvchi tasdig'i kutiladi. Subagent ishlatilmaydi (`CLAUDE.md`, "Execution Constraints"). Ish faqat `main` branch'ida bo'ladi. Push faqat foydalanuvchi so'raganda qilinadi. Har o'zgarish `CHANGELOG.md` ga yoziladi.
>
> **Testlar:** foydalanuvchi qarori bilan testlar loyiha oxirida yoziladi va ishga tushiriladi (memory: "No tests until the end"). Har task oxirida faqat `uv run ruff format --check .`, `uv run ruff check .` va `uv run mypy app` ishga tushiriladi. Ba'zi task'larda `AI_PROVIDER=fake` bilan qo'lda smoke-tekshiruv bor. Loyiha oxirida yoziladigan testlar ro'yxati — rejaning oxirida.

**Maqsad:** `docs/superpowers/specs/2026-10-13-phase-3-ai-design.md` dagi butun AI backend'ini qurish:
- provayder adapteri;
- vektor ombori;
- indekslash;
- repetitor (SSE);
- qoralamalar;
- vazifani AI bilan tekshirish;
- haftalik tahlil (CLI);
- admin API.

**Arxitektura:** yangi `app/ai/` moduli. U mavjud naqshlarga amal qiladi:
- `create_app` → `app.state.ai`;
- `deps.py` alias'i;
- `JobRunner` va `@job`;
- `AppError`;
- `core/types.py` tiplari.

Vektor qidiruv `VectorStore` orqali ikki xil: lokal SQLite'da BLOB + numpy, CI va prod'dagi PostgreSQL'da pgvector.

**Texnologiyalar:**
- yangi bog'liqliklar: `google-genai`, `pgvector`, `numpy`, `python-docx`;
- PyMuPDF (bor);
- FastAPI `StreamingResponse` (SSE).

**Spec'dan ataylab qilingan aniqliklar** (kodni o'qish paytida topilgan; Task 15 da spec'ga ham yoziladi):
1. **`AI_EMBEDDING_DIM` sozlama emas, konstanta.** `app/ai/constants.py` dagi `EMBEDDING_DIM = 768`. Sababi: ustun o'lchami migratsiyada qat'iy; o'zgartirish yangi migratsiya talab qiladi.
2. **`question` manba turi ikkiga bo'lindi:**
   - `activity`: `source_id` = faoliyat ID, har savol, bayonot yoki izoh alohida bo'lak;
   - `task`: `source_id` = vazifa ID.
   
   Maslahat rejimi "talaba shu faoliyat yoki vazifani yakunlaganmi" degan savolga aynan shu ID orqali javob beradi.
3. **Glossariy bo'laklari** `source_type=glossary`, `source_id = topic_id` bilan yoziladi. Mavzu glossariysi bir manba sifatida yangilanadi, har atama baribir alohida bo'lak.
4. **SSE `meta` hodisasi** javob oxirida (`done` dan oldin) yuboriladi, chunki `conversation_id` va haqiqatan ishlatilgan `citations` shundagina ma'lum bo'ladi.
5. **Qo'shimcha `canned` rejimi** — salomlashish va "qanday foydalanaman" savollariga tayyor javob. LLM ham, limit ham ishlatilmaydi.

---

## Fayl tuzilmasi

| Fayl | Mas'uliyat |
|---|---|
| `app/ai/__init__.py` | bo'sh |
| `app/ai/constants.py` | `EMBEDDING_DIM`, job nomlari, sozlanmaydigan chegaralar |
| `app/ai/models.py` | `DocChunk`, `AiConversation`, `AiMessage`, `AiDraft`, `AiReport`, `AiUsage`, `AiSettings` va enum'lar |
| `app/ai/providers.py` | `ChatMessage`, `ProviderBusy`, `TokenBucket`, `LLMProvider`/`EmbeddingProvider` protokollari, `FakeProvider`, `GeminiProvider` |
| `app/ai/vectors.py` | `ChunkRow`, `Hit`, `VectorStore` bazasi, `SqliteVectorStore`, `PgVectorStore` |
| `app/ai/services.py` | `AiServices`, `build_ai()`, `get_ai_settings()`, `ai_enabled()`, `require_ai()`, `recover_interrupted_ai()` |
| `app/ai/chunking.py` | `pdf_pages()`, `split_text()`, `chunk_pages()`: sof funksiyalar |
| `app/ai/indexing.py` | job'lar: `index_material`, `index_topic_glossary`, `index_topic_questions`, `reindex_all`; `enqueue_questions_for_step()` |
| `app/ai/usage.py` | talabaning kunlik limiti (`ai_usage`) |
| `app/ai/tutor.py` | qoidalar, qidiruv kaskadi, maslahat rejimi, prompt, SSE generatori |
| `app/ai/drafts.py` | LLM chiqish sxemalari, `generate_draft` job'i, tekshirish, tasdiqlash |
| `app/ai/grading.py` | matn olish, `ai_check_submission` job'i, `queue_check()` |
| `app/ai/reports.py` | haftalik statistika va `weekly_report()` |
| `app/ai/schemas.py` | API sxemalari |
| `app/ai/router.py` | `/api/ai/*` (talaba) |
| `app/ai/teach_router.py` | `/api/teach/ai/*` va `/api/teach/submissions/{id}/ai-check` |
| `app/ai/admin_router.py` | `/api/admin/ai/*` |
| O'zgaradi | `core/config.py`, `core/types.py`, `core/jobs.py`, `core/deps.py`, `main.py`, `api.py`, `models_registry.py`, `cli.py`, `alembic/env.py`, `learning/materials.py`, `learning/teach_items_router.py`, `assessment/models.py`, `assessment/schemas.py`, `assessment/review.py`, `assessment/reports.py`, `assessment/teach_router.py`, `assessment/router.py`, `.env.example`, `.github/workflows/ci.yml`, `pyproject.toml`, `uv.lock` |

**Commit xatti-harakati (mavjud kod):**
- `activities.create_activity`/`update_activity`/`delete_activity`, `tasks.upsert_task`/`delete_task` va `topic_items.add_glossary_term`/`update_glossary_term`/`delete_item` **o'zlari commit qiladi**. AI hook'lari ulardan keyin chaqiriladi.
- AI holatini (masalan, qoralama `approved`) yozish alohida commit bilan bo'ladi.

---

## Task 0: Rejani repoga qo'shish

- [ ] Shu fayl commit qilinadi: `docs: phase 3A backend plan`.
- [ ] CHANGELOG yozuvi (hash bilan) va commit.

---

## Task 1: Bog'liqliklar va sozlamalar

**Fayllar:** `backend/pyproject.toml`, `backend/uv.lock`, `app/core/config.py`, `backend/.env.example`, `app/ai/__init__.py`, `app/ai/constants.py`

- [ ] **Step 1:** bog'liqliklar (`backend/` da):

```bash
uv add google-genai pgvector numpy python-docx
```

- [ ] **Step 2:** `app/core/config.py` ga `Settings` maydonlari (`conversion_timeout_seconds` dan keyin):

```python
    ai_provider: Literal["gemini", "fake"] = "gemini"
    gemini_api_key: str = ""
    ai_model_chat: str = "gemini-2.5-flash"
    ai_model_fast: str = "gemini-2.5-flash-lite"
    ai_embedding_model: str = "gemini-embedding-001"
    ai_rpm: int = Field(default=10, ge=1)
    ai_min_similarity: float = Field(default=0.55, ge=0, le=1)
    ai_hint_similarity: float = Field(default=0.85, ge=0, le=1)

    @property
    def ai_configured(self) -> bool:
        """AI ishlata oladimi: sinov provayderi yoki Gemini kaliti bor."""
        return self.ai_provider == "fake" or bool(self.gemini_api_key)
```

- [ ] **Step 3:** `.env.example` oxiriga:

```dotenv
# AI (3-bosqich). Kalit bo'lmasa AI o'chiq turadi, qolgan sayt ishlaydi.
# AI_PROVIDER=fake — lokal sinov uchun, internetsiz deterministik javoblar.
AI_PROVIDER=gemini
GEMINI_API_KEY=
AI_MODEL_CHAT=gemini-2.5-flash
AI_MODEL_FAST=gemini-2.5-flash-lite
AI_EMBEDDING_MODEL=gemini-embedding-001
# Daqiqasiga provayderga umumiy so'rovlar. Bepul tarif limitini
# https://ai.google.dev/gemini-api/docs/rate-limits dan tekshirib, undan past qiymat qo'ying.
AI_RPM=10
```

- [ ] **Step 4:** ai.google.dev "Rate limits" sahifasidan joriy bepul tarifdagi `gemini-2.5-flash` va `gemini-embedding-001` RPM/RPD qiymatlarini tekshirib, `.env.example` izohiga yozish. Agar `AI_RPM=10` ulardan yuqori bo'lsa, sukut qiymatni (`config.py` da ham) pasaytirish.
- [ ] **Step 5:** `app/ai/__init__.py` (bo'sh) va `app/ai/constants.py`:

```python
"""AI modulining konstantalari. `EMBEDDING_DIM` ustun o'lchami: o'zgartirish migratsiya talab qiladi."""

EMBEDDING_DIM = 768

INDEX_MATERIAL_JOB = "index_material"
INDEX_GLOSSARY_JOB = "index_topic_glossary"
INDEX_QUESTIONS_JOB = "index_topic_questions"
REINDEX_JOB = "reindex_all"
GENERATE_DRAFT_JOB = "generate_draft"
AI_CHECK_JOB = "ai_check_submission"

TOP_K = 6
HISTORY_MESSAGES = 6
MAX_MESSAGE_CHARS = 1000
DRAFT_CONTEXT_CHARS = 24_000
SUBMISSION_TEXT_CHARS = 20_000
EMBED_BATCH = 100
```

- [ ] **Step 6:** `uv run ruff format . && uv run ruff check . && uv run mypy app`.
- [ ] **Step 7:** commit `chore(ai): dependencies and settings`, so'ng CHANGELOG yozuvi va commit.

---

## Task 2: `Vector` tipi, AI modellari va migratsiya

**Fayllar:** `app/core/types.py`, `app/ai/models.py`, `app/assessment/models.py`, `app/models_registry.py`, `alembic/env.py`, `alembic/versions/<rev>_ai_tables.py`, `.github/workflows/ci.yml`

- [ ] **Step 1:** `app/core/types.py` ga (importlar: `import numpy as np`, `from sqlalchemy import LargeBinary`):

```python
class Vector(TypeDecorator[list[float]]):
    """Embedding vektori: PostgreSQL'da pgvector `vector(dim)`, SQLite'da float32 baytlar (BLOB)."""

    impl = LargeBinary
    cache_ok = True

    def __init__(self, dim: int) -> None:
        super().__init__()
        self.dim = dim

    def load_dialect_impl(self, dialect: Dialect) -> Any:
        if dialect.name == "postgresql":
            from pgvector.sqlalchemy import Vector as PgVector

            return dialect.type_descriptor(PgVector(self.dim))
        return dialect.type_descriptor(LargeBinary())

    def process_bind_param(self, value: Any, dialect: Dialect) -> Any:
        if value is None:
            return None
        if len(value) != self.dim:
            raise ValueError(f"vector dimension {len(value)} != {self.dim}")
        if dialect.name == "postgresql":
            return [float(x) for x in value]
        return np.asarray(value, dtype=np.float32).tobytes()

    def process_result_value(self, value: Any, dialect: Dialect) -> list[float] | None:
        if value is None:
            return None
        if dialect.name == "postgresql":
            return [float(x) for x in value]
        return np.frombuffer(value, dtype=np.float32).tolist()
```

- [ ] **Step 2:** `app/assessment/models.py`: `SubmissionStatus` yoniga enum va `Submission` ga ustunlar (`JSON` va `Any` importi bor):

```python
class AiCheckStatus(StrEnum):
    none = "none"
    pending = "pending"
    done = "done"
    unsupported = "unsupported"
    failed = "failed"
```

```python
    ai_status: Mapped[AiCheckStatus] = mapped_column(
        str_enum(AiCheckStatus), default=AiCheckStatus.none, server_default="none"
    )
    ai_score: Mapped[int | None] = mapped_column(Integer)
    ai_feedback: Mapped[dict[str, Any] | None] = mapped_column(JSON)
```

- [ ] **Step 3:** `app/ai/models.py`:

```python
"""AI jadvallari (3-bosqich)."""

from datetime import date, datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    DDL,
    JSON,
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    event,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.ai.constants import EMBEDDING_DIM
from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, Vector, str_enum, utcnow


class ChunkSource(StrEnum):
    material = "material"
    glossary = "glossary"
    activity = "activity"
    task = "task"
    document = "document"  # 4-bosqich
    book = "book"  # 4-bosqich


# Repetitor kontekstiga kiradigan manbalar. `activity`/`task` — faqat maslahat rejimi uchun.
CONTEXT_SOURCES = (ChunkSource.material, ChunkSource.glossary)
QUESTION_SOURCES = (ChunkSource.activity, ChunkSource.task)


class MessageRole(StrEnum):
    user = "user"
    assistant = "assistant"


class MessageMode(StrEnum):
    answer = "answer"
    hint = "hint"
    refusal = "refusal"
    canned = "canned"


class DraftKind(StrEnum):
    quiz = "quiz"
    yesno = "yesno"
    crossword = "crossword"
    glossary = "glossary"
    task = "task"


class DraftStatus(StrEnum):
    generating = "generating"
    draft = "draft"
    approved = "approved"
    rejected = "rejected"
    failed = "failed"


class DocChunk(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "doc_chunks"
    __table_args__ = (Index("ix_doc_chunks_source", "source_type", "source_id"),)

    source_type: Mapped[ChunkSource] = mapped_column(str_enum(ChunkSource))
    source_id: Mapped[int] = mapped_column(BigIntPK)
    subject_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("subjects.id", ondelete="CASCADE"), index=True
    )
    topic_id: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    page: Mapped[int | None] = mapped_column(Integer)
    chunk_index: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))
    embedding_model: Mapped[str] = mapped_column(String(100))


# pgvector kengaytmasi va HNSW indeksi faqat PostgreSQL'da. `create_all` (testlar) shu DDL'ni
# ishlatadi; migratsiya o'zi yaratadi. Alembic taqqoslashidan indeks `env.py` da chiqariladi.
HNSW_INDEX = "ix_doc_chunks_embedding_hnsw"
event.listen(
    DocChunk.__table__,
    "before_create",
    DDL("CREATE EXTENSION IF NOT EXISTS vector").execute_if(dialect="postgresql"),
)
event.listen(
    DocChunk.__table__,
    "after_create",
    DDL(
        f"CREATE INDEX {HNSW_INDEX} ON doc_chunks USING hnsw (embedding vector_cosine_ops)"
    ).execute_if(dialect="postgresql"),
)


class AiConversation(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_conversations"

    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    topic_id: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="SET NULL")
    )
    title: Mapped[str] = mapped_column(String(80))
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class AiMessage(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_messages"

    conversation_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[MessageRole] = mapped_column(str_enum(MessageRole))
    content: Mapped[str] = mapped_column(Text)
    citations: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    mode: Mapped[MessageMode | None] = mapped_column(str_enum(MessageMode))


class AiDraft(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_drafts"

    topic_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("topics.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"))
    requested_by: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="SET NULL")
    )
    kind: Mapped[DraftKind] = mapped_column(str_enum(DraftKind))
    params: Mapped[dict[str, Any]] = mapped_column(JSON)
    status: Mapped[DraftStatus] = mapped_column(
        str_enum(DraftStatus), default=DraftStatus.generating
    )
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    error: Mapped[str | None] = mapped_column(String(500))
    approved_ref: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class AiReport(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "ai_reports"
    __table_args__ = (UniqueConstraint("subject_id", "locale", "period_start"),)

    subject_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("subjects.id", ondelete="CASCADE"), index=True
    )
    locale: Mapped[str] = mapped_column(String(5))
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    stats: Mapped[dict[str, Any]] = mapped_column(JSON)
    content: Mapped[str] = mapped_column(Text)


class AiUsage(IdMixin, Base):
    __tablename__ = "ai_usage"
    __table_args__ = (UniqueConstraint("user_id", "date"),)

    user_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("users.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date)
    requests: Mapped[int] = mapped_column(Integer, default=0)


class AiSettings(Base):
    """Bitta qator (`id=1`). Yo'q bo'lsa `services.get_ai_settings` yaratadi."""

    __tablename__ = "ai_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    student_daily_limit: Mapped[int] = mapped_column(Integer, default=30)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)
```

- [ ] **Step 4:** `app/models_registry.py` ga `import app.ai.models  # noqa: F401`.
- [ ] **Step 5:** `alembic/env.py`. HNSW indeksi modelda yo'q (DDL bilan yaratiladi), shuning uchun taqqoslashdan chiqariladi. `Vector` ustuni turi PG'da reflektsiya qilinganda farq bermasligi uchun taqqoslanmaydi. Ikkala `context.configure(...)` chaqiruvida `compare_type=True` o'rniga `compare_type=_compare_type, include_object=_include_object` qo'yiladi:

```python
from app.ai.models import HNSW_INDEX
from app.core.types import Vector


def _include_object(obj, name, type_, reflected, compare_to):  # type: ignore[no-untyped-def]
    return not (type_ == "index" and name == HNSW_INDEX)


def _compare_type(context, inspected_column, metadata_column, inspected_type, metadata_type):  # type: ignore[no-untyped-def]
    if isinstance(metadata_type, Vector):
        return False
    return None  # qolgan ustunlar uchun Alembic'ning standart taqqoslashi
```

- [ ] **Step 6:** migratsiya:

```bash
uv run alembic revision --autogenerate -m "ai tables"
```

  Yaratilgan faylni qo'lda tekshirib to'g'rilash:
  - `import app.core.types` va `Vector` ustuni `app.core.types.Vector(dim=768)` ko'rinishida;
  - `upgrade()` boshida PG uchun kengaytma, oxirida PG uchun HNSW indeksi;
  - `downgrade()` da teskari tartib;
  - `submissions.ai_status` ga `server_default="none"`.

```python
def upgrade() -> None:
    is_pg = op.get_bind().dialect.name == "postgresql"
    if is_pg:
        op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    # ... autogenerate'ning create_table / add_column qismlari ...
    if is_pg:
        op.execute(
            "CREATE INDEX ix_doc_chunks_embedding_hnsw ON doc_chunks "
            "USING hnsw (embedding vector_cosine_ops)"
        )
```

- [ ] **Step 7:** `.github/workflows/ci.yml` da `image: postgres:16` → `image: pgvector/pgvector:pg16`.
- [ ] **Step 8:** `uv run alembic upgrade head` (lokal `dev.db`), so'ng `uv run alembic check` ("No new upgrade operations detected"). Keyin ruff va mypy.
- [ ] **Step 9:** commit `feat(ai): models, vector type and migration`, CHANGELOG yozuvi va commit.

---

## Task 3: Provayderlar va global tezlik cheklovi

**Fayl:** `app/ai/providers.py`

- [ ] **Step 1:** fayl:

```python
"""AI provayder adapteri: Gemini va sinov uchun `FakeProvider`. Boshqa modullar faqat protokollarni biladi."""

import asyncio
import hashlib
import logging
import math
import re
import time
from collections.abc import AsyncIterator, Awaitable, Callable, Sequence
from dataclasses import dataclass
from typing import Any, Literal, Protocol, TypeVar

from pydantic import BaseModel

from app.ai.constants import EMBED_BATCH, EMBEDDING_DIM

logger = logging.getLogger(__name__)

EmbedTask = Literal["document", "query"]
ModelT = TypeVar("ModelT", bound=BaseModel)
T = TypeVar("T")


@dataclass(frozen=True)
class ChatMessage:
    role: Literal["user", "assistant"]
    text: str


class ProviderBusy(Exception):
    """Provayder javob bermadi (limit, 5xx, tarmoq yoki noto'g'ri so'rov). Foydalanuvchiga `AI_BUSY`."""


def normalize(vec: Sequence[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return [1.0 / math.sqrt(len(vec))] * len(vec)
    return [x / norm for x in vec]


class TokenBucket:
    """Provayderga umumiy so'rovlar oqimi (`AI_RPM`). Bitta jarayon uchun; 4-bosqichda Redis."""

    def __init__(self, per_minute: int, clock: Callable[[], float] = time.monotonic) -> None:
        self.capacity = float(per_minute)
        self.rate = per_minute / 60.0
        self.tokens = float(per_minute)
        self._clock = clock
        self.updated = clock()
        self._lock = asyncio.Lock()

    async def acquire(self, timeout: float = 20.0) -> None:
        deadline = self._clock() + timeout
        while True:
            async with self._lock:
                now = self._clock()
                self.tokens = min(self.capacity, self.tokens + (now - self.updated) * self.rate)
                self.updated = now
                if self.tokens >= 1:
                    self.tokens -= 1
                    return
                wait = (1 - self.tokens) / self.rate
            if self._clock() + wait > deadline:
                raise ProviderBusy("rate limit")
            await asyncio.sleep(wait)


class LLMProvider(Protocol):
    async def generate(self, model: str, system: str, messages: Sequence[ChatMessage]) -> str: ...

    async def generate_json(
        self, model: str, system: str, messages: Sequence[ChatMessage], schema: type[ModelT]
    ) -> ModelT: ...

    def stream(
        self, model: str, system: str, messages: Sequence[ChatMessage]
    ) -> AsyncIterator[str]: ...


class EmbeddingProvider(Protocol):
    model_name: str

    async def embed(self, texts: Sequence[str], task: EmbedTask) -> list[list[float]]: ...


_TOKEN = re.compile(r"\w+", re.UNICODE)


class FakeProvider:
    """Internetsiz, deterministik provayder (testlar va `AI_PROVIDER=fake`).

    Embedding — so'zlarni hash bo'yicha savatlarga sanash: umumiy so'zlari ko'p matnlar o'xshash.
    JSON javobi — sxemaning `fake_sample()` klass-metodi.
    """

    model_name = "fake-embedding"

    async def embed(self, texts: Sequence[str], task: EmbedTask) -> list[list[float]]:
        result = []
        for text in texts:
            vec = [0.0] * EMBEDDING_DIM
            for token in _TOKEN.findall(text.lower()):
                bucket = int.from_bytes(hashlib.md5(token.encode()).digest()[:4], "big")
                vec[bucket % EMBEDDING_DIM] += 1.0
            result.append(normalize(vec))
        return result

    async def generate(self, model: str, system: str, messages: Sequence[ChatMessage]) -> str:
        return "Bu sinov javobi [1]."

    async def generate_json(
        self, model: str, system: str, messages: Sequence[ChatMessage], schema: type[ModelT]
    ) -> ModelT:
        sample: Any = getattr(schema, "fake_sample", None)
        if sample is None:
            raise NotImplementedError(f"{schema.__name__}.fake_sample yo'q")
        return schema.model_validate(sample())

    async def stream(
        self, model: str, system: str, messages: Sequence[ChatMessage]
    ) -> AsyncIterator[str]:
        for part in ("Bu sinov ", "javobi [1]."):
            yield part


RETRY_DELAYS = (1.0, 2.0, 4.0)


def _retryable(exc: BaseException) -> bool:
    from google.genai import errors

    if isinstance(exc, errors.APIError):
        return exc.code == 429 or (exc.code or 0) >= 500
    return isinstance(exc, TimeoutError | ConnectionError)


async def with_retry(call: Callable[[], Awaitable[T]]) -> T:
    """429/5xx/tarmoq xatosida 1, 2, 4 s kutib 3 marta qayta urinadi; bo'lmasa `ProviderBusy`."""
    from google.genai import errors

    for delay in (*RETRY_DELAYS, None):
        try:
            return await call()
        except Exception as exc:
            if delay is not None and _retryable(exc):
                await asyncio.sleep(delay)
                continue
            if isinstance(exc, errors.APIError) or _retryable(exc):
                logger.warning("AI provider error: %s", type(exc).__name__)
                raise ProviderBusy(type(exc).__name__) from exc
            raise
    raise AssertionError("unreachable")


class GeminiProvider:
    def __init__(self, api_key: str, embedding_model: str, limiter: TokenBucket) -> None:
        from google import genai

        self._client = genai.Client(api_key=api_key)
        self.model_name = embedding_model
        self._limiter = limiter

    @staticmethod
    def _contents(messages: Sequence[ChatMessage]) -> list[Any]:
        from google.genai import types

        return [
            types.Content(
                role="model" if m.role == "assistant" else "user",
                parts=[types.Part.from_text(text=m.text)],
            )
            for m in messages
        ]

    async def generate(self, model: str, system: str, messages: Sequence[ChatMessage]) -> str:
        from google.genai import types

        await self._limiter.acquire()
        response = await with_retry(
            lambda: self._client.aio.models.generate_content(
                model=model,
                contents=self._contents(messages),
                config=types.GenerateContentConfig(system_instruction=system),
            )
        )
        return response.text or ""

    async def generate_json(
        self, model: str, system: str, messages: Sequence[ChatMessage], schema: type[ModelT]
    ) -> ModelT:
        """Sxemaga mos kelmasa `pydantic.ValidationError` ko'tariladi — chaqiruvchi qayta so'raydi."""
        from google.genai import types

        await self._limiter.acquire()
        response = await with_retry(
            lambda: self._client.aio.models.generate_content(
                model=model,
                contents=self._contents(messages),
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
        )
        return schema.model_validate_json(response.text or "{}")

    async def stream(
        self, model: str, system: str, messages: Sequence[ChatMessage]
    ) -> AsyncIterator[str]:
        from google.genai import errors, types

        await self._limiter.acquire()
        chunks = await with_retry(
            lambda: self._client.aio.models.generate_content_stream(
                model=model,
                contents=self._contents(messages),
                config=types.GenerateContentConfig(system_instruction=system),
            )
        )
        try:
            async for chunk in chunks:
                if chunk.text:
                    yield chunk.text
        except errors.APIError as exc:  # oqim o'rtasida qayta urinib bo'lmaydi
            raise ProviderBusy(type(exc).__name__) from exc

    async def embed(self, texts: Sequence[str], task: EmbedTask) -> list[list[float]]:
        from google.genai import types

        task_type = "RETRIEVAL_QUERY" if task == "query" else "RETRIEVAL_DOCUMENT"
        result: list[list[float]] = []
        for start in range(0, len(texts), EMBED_BATCH):
            batch = list(texts[start : start + EMBED_BATCH])
            await self._limiter.acquire()
            response = await with_retry(
                lambda batch=batch: self._client.aio.models.embed_content(  # type: ignore[misc]
                    model=self.model_name,
                    contents=batch,
                    config=types.EmbedContentConfig(
                        output_dimensionality=EMBEDDING_DIM, task_type=task_type
                    ),
                )
            )
            result.extend(normalize(list(e.values or [])) for e in response.embeddings or [])
        return result
```

- [ ] **Step 2:** ruff va mypy. `google.genai` tiplari mypy'da xato bersa, faqat shu qatorlarga aniq `# type: ignore[...]` qo'yiladi, umumiy `ignore_missing_imports` emas.
- [ ] **Step 3:** smoke-tekshiruv (internet kerak emas):

```bash
uv run python -c "import asyncio; from app.ai.providers import FakeProvider; p=FakeProvider(); v=asyncio.run(p.embed(['olma anor','olma'], 'document')); print(len(v[0]), round(sum(a*b for a,b in zip(v[0],v[1])),3))"
```

  Kutilgan natija: `768 0.707`.
- [ ] **Step 4:** commit `feat(ai): provider adapter with Gemini and fake provider`, CHANGELOG.

---

## Task 4: Vektor ombori va bo'laklash

**Fayllar:** `app/ai/vectors.py`, `app/ai/chunking.py`

- [ ] **Step 1:** `app/ai/vectors.py`:

```python
"""Vektor ombori: yozish ikkala bazada bir xil, qidiruv SQLite'da numpy, PostgreSQL'da pgvector."""

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
from sqlalchemy import Float, bindparam, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.constants import EMBEDDING_DIM
from app.ai.models import ChunkSource, DocChunk
from app.core.types import Vector


@dataclass(frozen=True)
class ChunkRow:
    source_type: ChunkSource
    source_id: int
    subject_id: int
    topic_id: int | None
    page: int | None
    chunk_index: int
    text: str
    embedding: list[float]


@dataclass(frozen=True)
class Hit:
    source_type: ChunkSource
    source_id: int
    topic_id: int | None
    page: int | None
    text: str
    score: float


_COLUMNS = (
    DocChunk.source_type,
    DocChunk.source_id,
    DocChunk.topic_id,
    DocChunk.page,
    DocChunk.text,
)


class VectorStore:
    """Yozish va o'chirish umumiy; `search` dialektga qarab qayta yoziladi. Commit qilmaydi."""

    async def delete(
        self,
        db: AsyncSession,
        *,
        source_types: Sequence[ChunkSource],
        source_id: int | None = None,
        topic_id: int | None = None,
    ) -> None:
        stmt = delete(DocChunk).where(DocChunk.source_type.in_(source_types))
        if source_id is not None:
            stmt = stmt.where(DocChunk.source_id == source_id)
        if topic_id is not None:
            stmt = stmt.where(DocChunk.topic_id == topic_id)
        await db.execute(stmt)

    async def add(self, db: AsyncSession, rows: Sequence[ChunkRow], model: str) -> None:
        db.add_all(
            DocChunk(
                source_type=r.source_type,
                source_id=r.source_id,
                subject_id=r.subject_id,
                topic_id=r.topic_id,
                page=r.page,
                chunk_index=r.chunk_index,
                text=r.text,
                embedding=r.embedding,
                embedding_model=model,
            )
            for r in rows
        )

    async def search(
        self,
        db: AsyncSession,
        vec: Sequence[float],
        *,
        source_types: Sequence[ChunkSource],
        topic_ids: Sequence[int],
        k: int,
    ) -> list[Hit]:
        raise NotImplementedError


class SqliteVectorStore(VectorStore):
    """Lokal muhit: nomzodlar SQL filtri bilan olinadi, o'xshashlik numpy bilan (normallashgan → dot)."""

    async def search(
        self,
        db: AsyncSession,
        vec: Sequence[float],
        *,
        source_types: Sequence[ChunkSource],
        topic_ids: Sequence[int],
        k: int,
    ) -> list[Hit]:
        if not topic_ids:
            return []
        rows = (
            await db.execute(
                select(*_COLUMNS, DocChunk.embedding).where(
                    DocChunk.source_type.in_(source_types), DocChunk.topic_id.in_(topic_ids)
                )
            )
        ).all()
        if not rows:
            return []
        matrix = np.asarray([row.embedding for row in rows], dtype=np.float32)
        scores = matrix @ np.asarray(vec, dtype=np.float32)
        best = np.argsort(-scores)[:k]
        return [
            Hit(
                rows[i].source_type,
                rows[i].source_id,
                rows[i].topic_id,
                rows[i].page,
                rows[i].text,
                float(scores[i]),
            )
            for i in best
        ]


class PgVectorStore(VectorStore):
    """PostgreSQL: `<=>` (cosine masofa) va HNSW indeksi."""

    async def search(
        self,
        db: AsyncSession,
        vec: Sequence[float],
        *,
        source_types: Sequence[ChunkSource],
        topic_ids: Sequence[int],
        k: int,
    ) -> list[Hit]:
        if not topic_ids:
            return []
        query = bindparam("query_vec", list(vec), type_=Vector(EMBEDDING_DIM))
        distance = DocChunk.embedding.op("<=>", return_type=Float)(query)
        rows = (
            await db.execute(
                select(*_COLUMNS, distance.label("distance"))
                .where(DocChunk.source_type.in_(source_types), DocChunk.topic_id.in_(topic_ids))
                .order_by(distance)
                .limit(k)
            )
        ).all()
        return [
            Hit(r.source_type, r.source_id, r.topic_id, r.page, r.text, 1.0 - float(r.distance))
            for r in rows
        ]
```

- [ ] **Step 2:** `app/ai/chunking.py`:

```python
"""PDF matnini sahifama-sahifa bo'laklarga bo'lish (sof funksiyalar, tokenizer'siz)."""

from dataclasses import dataclass
from pathlib import Path

import pymupdf

CHUNK_CHARS = 3200  # ~800 token
OVERLAP_CHARS = 400  # ~100 token
MIN_CHUNK_CHARS = 40


@dataclass(frozen=True)
class TextChunk:
    page: int | None
    text: str


def pdf_pages(path: Path) -> list[str]:
    with pymupdf.open(path) as doc:
        return [page.get_text() for page in doc]


def split_text(text: str) -> list[str]:
    """Bo'shliqlarni siqib, ~CHUNK_CHARS uzunlikda, so'z chegarasida, ustma-ust bo'laklar."""
    text = " ".join(text.split())
    pieces: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + CHUNK_CHARS)
        if end < len(text):
            cut = text.rfind(" ", start + CHUNK_CHARS // 2, end)
            if cut > start:
                end = cut
        piece = text[start:end].strip()
        if len(piece) >= MIN_CHUNK_CHARS:
            pieces.append(piece)
        if end >= len(text):
            break
        start = max(end - OVERLAP_CHARS, start + 1)
    return pieces


def chunk_pages(pages: list[str]) -> list[TextChunk]:
    return [
        TextChunk(page=number, text=piece)
        for number, page_text in enumerate(pages, start=1)
        for piece in split_text(page_text)
    ]
```

- [ ] **Step 3:** ruff va mypy. Smoke-tekshiruv:

```bash
uv run python -c "from app.ai.chunking import split_text; p=split_text('soz '*2000); print(len(p), max(len(x) for x in p))"
```

  Kutilgan: 3 yoki undan ko'p bo'lak, eng uzuni ≤ 3200.
- [ ] **Step 4:** commit `feat(ai): vector store and chunking`, CHANGELOG.

---

## Task 5: Xizmatlarni ulash (`app.state.ai`, job konteksti, dependency, AI sozlamalari)

**Fayllar:** `app/ai/services.py`, `app/core/jobs.py`, `app/core/deps.py`, `app/main.py`

- [ ] **Step 1:** `app/ai/services.py`:

```python
"""AI xizmatlarini yig'ish va "AI yoqilganmi" tekshiruvi."""

from dataclasses import dataclass

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai.models import AiDraft, AiSettings, DraftStatus
from app.ai.providers import (
    EmbeddingProvider,
    FakeProvider,
    GeminiProvider,
    LLMProvider,
    TokenBucket,
)
from app.ai.vectors import PgVectorStore, SqliteVectorStore, VectorStore
from app.assessment.models import AiCheckStatus, Submission
from app.core.config import Settings
from app.core.errors import AppError


@dataclass(frozen=True)
class AiServices:
    llm: LLMProvider
    embedder: EmbeddingProvider
    vectors: VectorStore
    configured: bool  # kalit bor yoki `fake`
    chat_model: str
    fast_model: str


def build_ai(settings: Settings, dialect_name: str) -> AiServices:
    vectors: VectorStore = PgVectorStore() if dialect_name == "postgresql" else SqliteVectorStore()
    llm: LLMProvider
    embedder: EmbeddingProvider
    if settings.ai_provider == "gemini" and settings.gemini_api_key:
        gemini = GeminiProvider(
            settings.gemini_api_key, settings.ai_embedding_model, TokenBucket(settings.ai_rpm)
        )
        llm, embedder = gemini, gemini
    else:
        fake = FakeProvider()
        llm, embedder = fake, fake
    return AiServices(
        llm=llm,
        embedder=embedder,
        vectors=vectors,
        configured=settings.ai_configured,
        chat_model=settings.ai_model_chat,
        fast_model=settings.ai_model_fast,
    )


async def get_ai_settings(db: AsyncSession) -> AiSettings:
    """Yo'q bo'lsa yaratadi va `flush` qiladi — chaqiruvchi keyin commit qilishi kerak."""
    row = await db.get(AiSettings, 1)
    if row is None:
        row = AiSettings(id=1, enabled=True, student_daily_limit=30)
        db.add(row)
        await db.flush()
    return row


async def ai_enabled(db: AsyncSession, ai: AiServices) -> bool:
    return ai.configured and (await get_ai_settings(db)).enabled


async def require_ai(db: AsyncSession, ai: AiServices) -> None:
    if not await ai_enabled(db, ai):
        raise AppError(503, "AI_DISABLED", "AI yordamchisi hozircha o'chirilgan")


async def recover_interrupted_ai(sessionmaker: async_sessionmaker[AsyncSession]) -> None:
    """Inline job'lar saqlanmaydi: qayta ishga tushganda yarim qolganlar `failed` bo'ladi."""
    async with sessionmaker() as db:
        await db.execute(
            update(AiDraft)
            .where(AiDraft.status == DraftStatus.generating)
            .values(status=DraftStatus.failed, error="INTERRUPTED")
        )
        await db.execute(
            update(Submission)
            .where(Submission.ai_status == AiCheckStatus.pending)
            .values(ai_status=AiCheckStatus.failed)
        )
        await db.commit()
```

- [ ] **Step 2:** `app/core/jobs.py`: `JobContext` ga maydon. Import tsikli bo'lmasligi uchun tip faqat `TYPE_CHECKING` da:

```python
from typing import TYPE_CHECKING, Any, Protocol

if TYPE_CHECKING:
    from app.ai.services import AiServices


@dataclass(frozen=True)
class JobContext:
    sessionmaker: async_sessionmaker[AsyncSession]
    settings: Settings
    storage: Storage
    ai: "AiServices | None" = None
```

- [ ] **Step 3:** `app/core/deps.py`:

```python
from app.ai.services import AiServices


def get_ai(request: Request) -> AiServices:
    return request.app.state.ai  # type: ignore[no-any-return]


Ai = Annotated[AiServices, Depends(get_ai)]
```

- [ ] **Step 4:** `app/main.py`:
  - `create_app` da `storage` dan keyin `ai = build_ai(settings, engine.dialect.name)`, `app.state.ai = ai`;
  - `JobContext(sessionmaker=..., settings=..., storage=..., ai=ai)`;
  - lifespan'dagi `if isinstance(app.state.jobs, InlineJobRunner):` bloki ichiga `await recover_interrupted_ai(app.state.sessionmaker)` qo'shiladi.
- [ ] **Step 5:** ruff, mypy. Smoke-tekshiruv: `uv run uvicorn app.main:create_app --factory`, so'ng `curl localhost:8000/api/health` → `{"status":"ok"}`.
- [ ] **Step 6:** commit `feat(ai): wire AI services into app state and jobs`, CHANGELOG.

---

## Task 6: Indekslash job'lari va hook'lar

**Fayllar:** `app/ai/indexing.py`, `app/main.py`, `app/learning/materials.py`, `app/learning/teach_items_router.py`, `app/assessment/teach_router.py`

- [ ] **Step 1:** `app/ai/indexing.py`:

```python
"""Indekslash job'lari. AI o'chiq bo'lsa hech narsa qilinmaydi (admin keyin `reindex_all` qiladi)."""

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


async def _ready_ai(ctx: JobContext) -> AiServices | None:
    if ctx.ai is None:
        return None
    async with ctx.sessionmaker() as db:
        enabled = await ai_enabled(db, ctx.ai)
        await db.commit()
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
    """Faqat savol matnlari (test savoli, ha/yo'q bayonoti, krossvord izohi, vazifa). Javoblar yo'q."""
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
        rows.append((ChunkSource.task, task.id, f"{task.title}. {task.description}"[:3200]))
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
    """Model o'zgargan (yoki `everything`) bo'laklarni qayta quradi. Ketma-ket, provayder limitiga mos."""
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
        await index_material_job(ctx, material_id=material_id)
    for topic_id in topics:
        await index_topic_glossary_job(ctx, topic_id=topic_id)
        await index_topic_questions_job(ctx, topic_id=topic_id)


async def enqueue_questions_for_step(db: AsyncSession, jobs: JobRunner, step_id: int) -> None:
    topic_id = await db.scalar(select(Step.topic_id).where(Step.id == step_id))
    if topic_id is not None:
        await jobs.enqueue(INDEX_QUESTIONS_JOB, topic_id=topic_id)
```

- [ ] **Step 2:** job'lar ro'yxatdan o'tishi uchun `app/main.py` ga `import app.ai.indexing  # noqa: F401` qo'shiladi. `@job` modul import qilinganda ishlaydi; `learning.materials` ham shu yo'l bilan ro'yxatdan o'tadi.
- [ ] **Step 3:** `app/learning/materials.py` dagi hook'lar:
  - **PDF yuklanganda** (`add_material`, `material.status = MaterialStatus.ready` bilan sinxron shoxcha): funksiya oxiridagi commitdan keyin, `processing` shoxchasidagi `CONVERT_JOB` ga o'xshash tarzda, `ready` bo'lsa `await jobs.enqueue(INDEX_MATERIAL_JOB, material_id=material.id)`.
  - **Konvertatsiya tugaganda** (`_run_conversion`, `material.status = MaterialStatus.ready` dan keyingi `await db.commit()` ning sessiya bloki tugagandan so'ng, `return` dan oldin): job ichidan boshqa job navbatga qo'yib bo'lmaydi, shuning uchun funksiya to'g'ridan-to'g'ri chaqiriladi. Indekslash xatosi konvertatsiya natijasini buzmasligi kerak:

```python
        try:
            await index_material_job(ctx, material_id=material_id)
        except Exception:
            logger.exception("index_material failed for %s", material_id)
```

  - **O'chirilganda** (`delete_material`, `await db.delete(material)` oldidan):

```python
    await db.execute(
        delete(DocChunk).where(
            DocChunk.source_type == ChunkSource.material, DocChunk.source_id == material.id
        )
    )
```

  Importlar: `from app.ai.constants import INDEX_MATERIAL_JOB`, `from app.ai.models import ChunkSource, DocChunk`. `index_material_job` esa `_run_conversion` ichida funksiya darajasida import qilinadi (`from app.ai.indexing import index_material_job`), chunki `ai.indexing` `learning.models` ni import qiladi va bu yuqori darajadagi tsiklni oldini oladi. Agar modulda `logger` bo'lmasa, qo'shiladi.

- [ ] **Step 4:** `app/learning/teach_items_router.py`: glossariy endpoint'larining uchalasiga (`add_glossary_term`, `update_glossary_term`, `delete_glossary_term`) `jobs: Jobs` parametri va javobdan oldin `await jobs.enqueue(INDEX_GLOSSARY_JOB, topic_id=topic_id)`.
- [ ] **Step 5:** `app/assessment/teach_router.py`: quyidagi endpoint'larga `jobs: Jobs` parametri:
  - `create_activity`, `update_activity`, `publish_activity`, `delete_activity`;
  - vazifani saqlash (`PUT /steps/{step_id}/task`) va o'chirish.
  
  Mavjud chaqiruvdan keyin `await enqueue_questions_for_step(db, jobs, step_id)`, bu yerda `step_id`:
  - yaratish va vazifa saqlashda `step.id`;
  - yangilash va nashrda `activity.step_id`;
  - o'chirishda chaqiruvdan **oldin** saqlab olingan `activity.step_id` / `task.step_id`.
- [ ] **Step 6:** ruff, mypy. Smoke-tekshiruv `.env` da `AI_PROVIDER=fake` bilan: backend'ni ishga tushirib, o'qituvchi sifatida PDF material yuklash, keyin:

```bash
uv run python -c "import sqlite3; print(sqlite3.connect('dev.db').execute('select source_type, count(*) from doc_chunks group by 1').fetchall())"
```

  Kutilgan natija: `[('material', N)]`, N > 0.
- [ ] **Step 7:** commit `feat(ai): index materials, glossary and questions`, CHANGELOG.

---

## Task 7: Kunlik limit (`ai_usage`)

**Fayl:** `app/ai/usage.py`

- [ ] **Step 1:**

```python
"""Talabaning kunlik AI so'rovlari (Asia/Tashkent sanasi bo'yicha). O'qituvchi va admin hisoblanmaydi."""

from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models import AiUsage
from app.ai.services import get_ai_settings
from app.auth.models import Role, User
from app.core.errors import AppError
from app.core.types import utcnow

TASHKENT = ZoneInfo("Asia/Tashkent")


def today(now: datetime | None = None) -> date:
    return (now or utcnow()).astimezone(TASHKENT).date()


async def used_today(db: AsyncSession, user_id: int) -> int:
    value = await db.scalar(
        select(AiUsage.requests).where(AiUsage.user_id == user_id, AiUsage.date == today())
    )
    return int(value or 0)


async def ensure_within_limit(db: AsyncSession, user: User) -> None:
    if user.role != Role.student:
        return
    limit = (await get_ai_settings(db)).student_daily_limit
    if await used_today(db, user.id) >= limit:
        raise AppError(
            429, "AI_LIMIT_REACHED", "Bugungi AI so'rovlari limiti tugadi", {"limit": limit}
        )


async def _increment(db: AsyncSession, user_id: int, day: date) -> int:
    result = await db.execute(
        update(AiUsage)
        .where(AiUsage.user_id == user_id, AiUsage.date == day)
        .values(requests=AiUsage.requests + 1)
    )
    return result.rowcount  # type: ignore[attr-defined,no-any-return]


async def record_request(db: AsyncSession, user: User) -> None:
    """Atomik +1. Commit qilmaydi — chaqiruvchi commit qiladi."""
    if user.role != Role.student:
        return
    day = today()
    if await _increment(db, user.id, day):
        return
    try:
        async with db.begin_nested():
            db.add(AiUsage(user_id=user.id, date=day, requests=1))
    except IntegrityError:  # parallel so'rov qatorni yaratib ulgurgan
        await _increment(db, user.id, day)
```

- [ ] **Step 2:** ruff, mypy. Commit `feat(ai): daily usage limit`, CHANGELOG.

---

## Task 8: Repetitor (SSE) va suhbatlar

**Fayllar:** `app/ai/schemas.py`, `app/ai/tutor.py`, `app/ai/router.py`, `app/api.py`

- [ ] **Step 1:** `app/ai/schemas.py` (talaba qismi; keyingi task'larda to'ldiriladi):

```python
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.ai.constants import MAX_MESSAGE_CHARS
from app.ai.models import MessageMode, MessageRole
from app.core.types import DbId, trimmed_str


class ChatIn(BaseModel):
    message: trimmed_str(max_length=MAX_MESSAGE_CHARS)  # type: ignore[valid-type]
    topic_id: DbId | None = None
    conversation_id: DbId | None = None


class Citation(BaseModel):
    n: int
    source_type: str
    source_id: int
    title: str
    page: int | None


class ConversationOut(BaseModel):
    id: int
    topic_id: int | None
    title: str
    updated_at: datetime


class MessageOut(BaseModel):
    id: int
    role: MessageRole
    content: str
    citations: list[Citation]
    mode: MessageMode | None
    created_at: datetime


class ConversationDetailOut(ConversationOut):
    messages: list[MessageOut]


class UsageOut(BaseModel):
    used: int
    limit: int | None  # o'qituvchi/admin uchun None (cheksiz)
    enabled: bool


class ChatMeta(BaseModel):
    """SSE `meta` hodisasi tanasi."""

    conversation_id: int
    mode: MessageMode
    citations: list[Citation] = Field(default_factory=list)


def citations_out(raw: list[dict[str, Any]]) -> list[Citation]:
    return [Citation.model_validate(c) for c in raw]
```

- [ ] **Step 2:** `app/ai/tutor.py`:

```python
"""Talaba repetitori: qoidalar, qidiruv kaskadi, maslahat rejimi, prompt va SSE oqimi."""

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
        re.compile(r"^\s*(salom|assalomu|привет|здравствуй)", re.I),
        {
            "uz": "Salom! Dars mavzusi bo'yicha savolingizni yozing.",
            "ru": "Здравствуйте! Задайте вопрос по теме урока.",
        },
    ),
    (
        re.compile(r"(qanday foydalan|как пользоваться)", re.I),
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
    return [t.id for t in await progress.published_topics(db, ids)]


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
            done = exists().where(Submission.user_id == user.id, Submission.task_id == hit.source_id)
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
            title=titles.get(h.source_id, "") if h.source_type == ChunkSource.material
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
            return Prepared(
                conv_id, topic_id, data.message, MessageMode.canned,
                canned_text=answers.get(lang, answers["uz"]),
            )
    await usage.ensure_within_limit(db, user)
    try:
        [vec] = await ai.embedder.embed([data.message], "query")
    except ProviderBusy:
        raise AppError(503, "AI_BUSY", BUSY_MESSAGE) from None
    hits = await _retrieve(db, ai, vec, topic, settings)
    if not hits:
        return Prepared(
            conv_id, topic_id, data.message, MessageMode.refusal,
            canned_text=REFUSAL.get(lang, REFUSAL["uz"]),
        )
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
                    conversation_id=conv.id, role=MessageRole.user, content=prep.message,
                    citations=[], mode=None,
                ),
                AiMessage(
                    conversation_id=conv.id, role=MessageRole.assistant, content=answer,
                    citations=[c.model_dump() for c in citations], mode=prep.mode,
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
```

  > `User` obyekti generator ichida faqat `id`, `role` va `locale` uchun ishlatiladi. Bu qiymatlar so'rov sessiyasi yopilgandan keyin ham obyektda yuklangan holda turadi; boshqa atributlarga murojaat qilinmaydi.

- [ ] **Step 3:** `app/ai/router.py`:

```python
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.ai import tutor, usage
from app.ai.models import AiConversation, AiMessage
from app.ai.schemas import (
    ChatIn,
    ConversationDetailOut,
    ConversationOut,
    MessageOut,
    UsageOut,
    citations_out,
)
from app.ai.services import ai_enabled, get_ai_settings
from app.auth.deps import ActiveUser
from app.auth.models import Role
from app.core.deps import Ai, AppSettings, DbSession
from app.core.types import DbIdPath

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_class=StreamingResponse)
async def chat(
    data: ChatIn,
    user: ActiveUser,
    db: DbSession,
    ai: Ai,
    settings: AppSettings,
    request: Request,
) -> StreamingResponse:
    prepared = await tutor.prepare(db, ai, settings, user, data)
    await db.commit()  # get_ai_settings qatorni yaratgan bo'lishi mumkin
    return StreamingResponse(
        tutor.stream(prepared, ai, user, request.app.state.sessionmaker),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/usage", response_model=UsageOut)
async def my_usage(user: ActiveUser, db: DbSession, ai: Ai) -> UsageOut:
    limit = (await get_ai_settings(db)).student_daily_limit
    enabled = await ai_enabled(db, ai)
    used = await usage.used_today(db, user.id)
    await db.commit()
    return UsageOut(used=used, limit=limit if user.role == Role.student else None, enabled=enabled)


@router.get("/conversations", response_model=list[ConversationOut])
async def conversations(user: ActiveUser, db: DbSession) -> list[AiConversation]:
    return list(
        await db.scalars(
            select(AiConversation)
            .where(AiConversation.user_id == user.id)
            .order_by(AiConversation.updated_at.desc())
            .limit(50)
        )
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailOut)
async def conversation(
    conversation_id: DbIdPath, user: ActiveUser, db: DbSession
) -> ConversationDetailOut:
    conv = await tutor.own_conversation(db, user, conversation_id)
    messages = await db.scalars(
        select(AiMessage).where(AiMessage.conversation_id == conv.id).order_by(AiMessage.id)
    )
    return ConversationDetailOut(
        id=conv.id,
        topic_id=conv.topic_id,
        title=conv.title,
        updated_at=conv.updated_at,
        messages=[
            MessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                citations=citations_out(m.citations),
                mode=m.mode,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: DbIdPath, user: ActiveUser, db: DbSession
) -> Response:
    await db.delete(await tutor.own_conversation(db, user, conversation_id))
    await db.commit()
    return Response(status_code=204)
```

- [ ] **Step 4:** `app/api.py`: `from app.ai.router import router as ai_router` va `api_router.include_router(ai_router)`.
- [ ] **Step 5:** ruff, mypy. Smoke-tekshiruv (`AI_PROVIDER=fake`, PDF yuklangan nashr qilingan mavzu, talaba tokeni):

```bash
curl -N -X POST localhost:8000/api/ai/chat -H "Authorization: Bearer <talaba tokeni>" -H "Content-Type: application/json" -d "{\"message\":\"<PDF matnidan bir nechta so'z>\",\"topic_id\":<id>}"
```

  Kutilgan natija:
  - `delta` hodisalari, so'ng `meta` va `done`;
  - mavzuga aloqasiz savolda rad matni;
  - `{"message":"salom"}` ga tayyor javob.
- [ ] **Step 6:** commit `feat(ai): student tutor with SSE streaming`, CHANGELOG.

---

## Task 9: Qoralamalar (kontent yaratish)

**Fayllar:** `app/ai/drafts.py`, `app/ai/schemas.py`, `app/ai/teach_router.py`, `app/api.py`

- [ ] **Step 1:** `app/ai/drafts.py`. LLM chiqish sxemalari Gemini `response_schema` uchun oddiy tiplarda va cheklovsiz; tekshiruv keyin mavjud kirish sxemalari bilan bo'ladi:

```python
"""AI qoralamalari: LLM natijasi mavjud kirish sxemalari bilan tekshiriladi va tasdiqlangach
mavjud saqlash funksiyalari orqali haqiqiy yozuvga aylanadi."""

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
from app.assessment.schemas import (
    CrosswordActivityIn,
    QuizActivityIn,
    TaskIn,
    YesNoActivityIn,
)
from app.auth.models import User
from app.core.errors import AppError
from app.core.jobs import JobContext, JobRunner, job
from app.learning import editing, topic_items
from app.learning.models import Material, MaterialStatus, Step, StepKind
from app.learning.schemas import GlossaryIn

logger = logging.getLogger(__name__)


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
        words = [("OLMA", "Meva"), ("ANOR", "Qizil meva"), ("ARRA", "Asbob"),
                 ("RANDA", "Yog'och asbobi"), ("OLOV", "Issiq")]
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
        return {"title": "Sinov vazifasi", "description": "Mavzu bo'yicha insho yozing.",
                "rubric": "Mazmun 10 ball"}


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
    DraftKind.crossword: "Krossvord uchun {count} ta so'z va savol tuz: har so'z bitta so'z, faqat "
    "harflar, 3–12 harf, so'zlarda umumiy harflar ko'p bo'lsin. Faoliyatga qisqa nom ber.",
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
        task = TaskIn.model_validate(
            {"type": "both", "max_score": 10, "deadline": None, **payload}
        )
        return task.model_dump(mode="json")
    except ValidationError as exc:
        raise DraftInvalid(exc.errors(include_url=False)[0]["msg"]) from None


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
    schema = GEN_SCHEMAS[kind]
    error = "INVALID"
    for _attempt in range(2):
        try:
            generated = await ai.llm.generate_json(ai.chat_model, system, messages, schema)
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
        raise AppError(422, "AI_DRAFT_INVALID", "Materiallar shu mavzuga tegishli va tayyor bo'lsin")
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
    _ensure_open(draft)
    if draft.payload is None:
        raise AppError(409, "AI_DRAFT_NOT_READY", "Qoralama hali tayyorlanmoqda")
    payload = _validated(draft, draft.payload)
    step = await db.get(Step, draft.step_id)
    assert step is not None
    ref: dict[str, Any]
    if draft.kind == DraftKind.quiz:
        activity = await activities.create_activity(
            db, step, QuizActivityIn.model_validate({**payload, "type": "quiz"})
        )
        ref = {"activity_id": activity.id}
    elif draft.kind == DraftKind.yesno:
        activity = await activities.create_activity(
            db, step, YesNoActivityIn.model_validate({**payload, "type": "yesno"})
        )
        ref = {"activity_id": activity.id}
    elif draft.kind == DraftKind.crossword:
        activity = await activities.create_activity(
            db, step, CrosswordActivityIn.model_validate({**payload, "type": "crossword"})
        )
        ref = {"activity_id": activity.id}
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
```

  > Faoliyat **nashr qilinmagan** holda yaratiladi: `Activity.is_published` sukuti `False`. Shuning uchun savol indeksi faqat o'qituvchi nashr qilganda (Task 6 hook'i) yangilanadi.
  > `editing.ensure_can_edit_step` `(Step, Topic)` qaytaradi, bosqich yo'q bo'lsa 404 beradi.

- [ ] **Step 2:** `app/ai/schemas.py` ga:

```python
class DraftCreateIn(BaseModel):
    step_id: DbId
    kind: DraftKind
    material_ids: list[DbId] = Field(min_length=1, max_length=3)
    count: int = Field(ge=1, le=15)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class DraftUpdateIn(BaseModel):
    payload: dict[str, Any]


class DraftOut(BaseModel):
    id: int
    topic_id: int
    step_id: int
    kind: DraftKind
    status: DraftStatus
    params: dict[str, Any]
    payload: dict[str, Any] | None
    error: str | None
    approved_ref: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
```

  Importlar: `Literal`, `DraftKind`, `DraftStatus`.
- [ ] **Step 3:** `app/ai/teach_router.py`:

```python
from fastapi import APIRouter
from sqlalchemy import select

from app.ai import drafts
from app.ai.models import AiDraft
from app.ai.schemas import DraftCreateIn, DraftOut, DraftUpdateIn
from app.ai.services import require_ai
from app.auth.deps import StaffUser
from app.core.deps import Ai, DbSession, Jobs
from app.core.types import DbIdPath
from app.learning import editing

router = APIRouter(prefix="/teach", tags=["teach-ai"])


@router.post("/ai/drafts", response_model=DraftOut, status_code=201)
async def create_draft(
    data: DraftCreateIn, user: StaffUser, db: DbSession, ai: Ai, jobs: Jobs
) -> AiDraft:
    await require_ai(db, ai)
    return await drafts.create_draft(db, user, data, jobs)


@router.get("/ai/drafts", response_model=list[DraftOut])
async def list_drafts(topic_id: int, user: StaffUser, db: DbSession) -> list[AiDraft]:
    await editing.ensure_can_edit_topic(db, user, topic_id)
    return list(
        await db.scalars(
            select(AiDraft)
            .where(AiDraft.topic_id == topic_id)
            .order_by(AiDraft.id.desc())
            .limit(50)
        )
    )


@router.get("/ai/drafts/{draft_id}", response_model=DraftOut)
async def get_draft(draft_id: DbIdPath, user: StaffUser, db: DbSession) -> AiDraft:
    return await drafts.get_editable_draft(db, user, draft_id)


@router.put("/ai/drafts/{draft_id}", response_model=DraftOut)
async def update_draft(
    draft_id: DbIdPath, data: DraftUpdateIn, user: StaffUser, db: DbSession
) -> AiDraft:
    draft = await drafts.get_editable_draft(db, user, draft_id)
    return await drafts.update_draft(db, draft, data.payload)


@router.post("/ai/drafts/{draft_id}/approve", response_model=DraftOut)
async def approve_draft(draft_id: DbIdPath, user: StaffUser, db: DbSession, jobs: Jobs) -> AiDraft:
    draft = await drafts.get_editable_draft(db, user, draft_id)
    return await drafts.approve_draft(db, draft, jobs)


@router.post("/ai/drafts/{draft_id}/reject", response_model=DraftOut)
async def reject_draft(draft_id: DbIdPath, user: StaffUser, db: DbSession) -> AiDraft:
    draft = await drafts.get_editable_draft(db, user, draft_id)
    return await drafts.reject_draft(db, draft)
```

  `topic_id` query parametri uchun `DbIdPath` o'rniga `Annotated[int, Query(ge=1, le=DB_ID_MAX)]` ishlatiladi.
- [ ] **Step 4:** `app/main.py` ga `import app.ai.drafts  # noqa: F401` (job ro'yxati). `app/api.py` ga `ai_teach_router`.
- [ ] **Step 5:** ruff, mypy. Smoke-tekshiruv (`fake`, practice bosqichi, PDF material bilan):
  - `POST /api/teach/ai/drafts {"step_id":..,"kind":"quiz","material_ids":[..],"count":3}`;
  - bir soniyadan so'ng `GET /api/teach/ai/drafts/{id}` → `status=draft`;
  - `POST …/approve` → faoliyatlar ro'yxatida nashr qilinmagan "Sinov testi".
- [ ] **Step 6:** commit `feat(ai): AI content drafts`, CHANGELOG.

---

## Task 10: Vazifani AI bilan tekshirish

**Fayllar:** `app/ai/grading.py`, `app/assessment/router.py`, `app/assessment/schemas.py`, `app/assessment/review.py`, `app/ai/teach_router.py`, `app/main.py`

- [ ] **Step 1:** `app/ai/grading.py`:

```python
"""Vazifa javobini AI bilan baholash (faqat tavsiya; yakuniy ballni o'qituvchi qo'yadi)."""

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
    parts = [text.strip()] if text and text.strip() else []
    if path is not None:
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            parts += [p for p in pdf_pages(path) if p.strip()]
        elif suffix == ".docx":
            import docx

            parts += [p.text for p in docx.Document(str(path)).paragraphs if p.text.strip()]
        elif not parts:
            return None
    joined = "\n\n".join(parts).strip()
    return joined[:SUBMISSION_TEXT_CHARS] or None


async def queue_check(db: AsyncSession, ai: AiServices, jobs: JobRunner, submission_id: int) -> None:
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
        await db.commit()
        await jobs.enqueue(
            AI_CHECK_JOB,
            submission_id=submission_id,
            submitted_at=submission.submitted_at.isoformat(),
        )
    except Exception:
        logger.exception("queue_check failed for %s", submission_id)


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
            return  # orada qayta yuborilgan yoki o'chirilgan
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
    except (ProviderBusy, ValidationError):
        await _set_status(ctx, submission_id, submitted_at, AiCheckStatus.failed)
        return
    result.score = min(max(result.score, 0), task.max_score)
    await _set_status(ctx, submission_id, submitted_at, AiCheckStatus.done, result)
```

  > Promptda talabaning ismi, emaili va fayl nomi **yo'q**: `Submission` dan faqat matn olinadi.

- [ ] **Step 2:** `app/assessment/router.py`, `submit_task`:

```python
async def submit_task(
    task_id: DbIdPath,
    user: ActiveUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
    jobs: Jobs,
    ai: Ai,
    text: Annotated[str | None, Form(max_length=20000)] = None,
    file: UploadFile | None = None,
) -> SubmitOut:
    out = await tasks.submit(
        db, user, task_id, text=text, upload=file, storage=storage, settings=settings
    )
    await grading.queue_check(db, ai, jobs, out.submission.id)
    return out
```

- [ ] **Step 3:** `app/assessment/schemas.py`:

```python
class AiFeedbackOut(BaseModel):
    feedback: str
    strengths: list[str]
    issues: list[str]
```

  `SubmissionDetailOut` ga:
  - `ai_status: AiCheckStatus`;
  - `ai_score: int | None`;
  - `ai_feedback: AiFeedbackOut | None`.
  
  `review._detail` ularni to'ldiradi:

```python
        ai_status=submission.ai_status,
        ai_score=submission.ai_score,
        ai_feedback=AiFeedbackOut.model_validate(submission.ai_feedback)
        if submission.ai_feedback
        else None,
```

  Talaba sxemalari (`SubmissionView`, `SubmitOut`) **o'zgarmaydi**.
- [ ] **Step 4:** `app/ai/teach_router.py` ga:

```python
@router.post("/submissions/{submission_id}/ai-check", status_code=202)
async def rerun_ai_check(
    submission_id: DbIdPath, user: StaffUser, db: DbSession, ai: Ai, jobs: Jobs
) -> dict[str, str]:
    await review.get_reviewable(db, user, submission_id)
    await require_ai(db, ai)
    await grading.queue_check(db, ai, jobs, submission_id)
    return {"ai_status": "pending"}
```

- [ ] **Step 5:** `app/main.py` ga `import app.ai.grading  # noqa: F401`.
- [ ] **Step 6:** ruff, mypy. Smoke-tekshiruv (`fake`): talaba matnli javob yuboradi; o'qituvchi `GET /api/teach/submissions/{id}` → `ai_status=done`, `ai_score=7`.
- [ ] **Step 7:** commit `feat(ai): AI suggestion for task submissions`, CHANGELOG.

---

## Task 11: Haftalik tahlil (CLI)

**Fayllar:** `app/assessment/reports.py`, `app/ai/reports.py`, `app/ai/schemas.py`, `app/ai/teach_router.py`, `app/cli.py`

- [ ] **Step 1:** `assessment/reports.py`: `teach_stats` ichidagi hisob ruxsatsiz funksiyaga ko'chiriladi:

```python
async def topic_stats(db: AsyncSession, subject_id: int) -> list[TopicStatsOut]:
    """Mavzular bo'yicha statistika (faqat talabalar hisobga olinadi). Ruxsat tekshirilmaydi."""
    # ... teach_stats'dagi `topics = ...` dan oxirigacha bo'lgan kod o'zgarishsiz ...


async def teach_stats(db: AsyncSession, user: User, subject_id: int) -> list[TopicStatsOut]:
    await editing.ensure_can_edit_subject(db, user, subject_id)
    return await topic_stats(db, subject_id)
```

- [ ] **Step 2:** `app/ai/reports.py`:

```python
"""Haftalik AI tahlili: raqamlar SQL bilan, LLM faqat xulosa va tavsiyalar yozadi."""

import json
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models import AiReport
from app.ai.providers import ChatMessage
from app.ai.services import AiServices, build_ai
from app.ai.usage import TASHKENT, today
from app.assessment.models import Activity, Attempt, Submission, SubmissionStatus, Task
from app.assessment.reports import topic_stats
from app.auth.models import Role, User
from app.core.config import Settings
from app.core.db import make_engine, make_sessionmaker
from app.gamification.models import XpEvent
from app.learning.models import Step, StepProgress, Subject, Topic, subject_teachers

PROMPT = {
    "uz": "Sen o'qituvchiga yordamchisan. Faqat berilgan statistika (JSON) asosida o'zbek tilida "
    "3–5 gaplik xulosa va 3 ta aniq tavsiya yoz. Raqamlarni o'zing hisoblama va o'ylab topma.",
    "ru": "Ты помощник преподавателя. Только на основе данной статистики (JSON) напиши на русском "
    "вывод из 3–5 предложений и 3 конкретные рекомендации. Не вычисляй и не придумывай числа.",
}
EMPTY = {
    "uz": "Bu hafta fan bo'yicha talabalar faolligi qayd etilmadi.",
    "ru": "На этой неделе активность студентов по предмету не зафиксирована.",
}


def week_bounds(week_start: date | None) -> tuple[date, date]:
    if week_start is None:
        current = today()
        week_start = current - timedelta(days=current.weekday() + 7)
    if week_start.weekday() != 0:
        raise ValueError("--week-start dushanba bo'lishi kerak")
    return week_start, week_start + timedelta(days=6)


def _utc_range(start: date, end: date) -> tuple[datetime, datetime]:
    lo = datetime.combine(start, time.min, TASHKENT)
    hi = datetime.combine(end + timedelta(days=1), time.min, TASHKENT)
    return lo, hi


async def subject_week_stats(
    db: AsyncSession, subject_id: int, start: date, end: date
) -> dict[str, Any]:
    lo, hi = _utc_range(start, end)
    attempts = list(
        await db.scalars(
            select(Attempt)
            .join(Activity, Activity.id == Attempt.activity_id)
            .join(Step, Step.id == Activity.step_id)
            .join(Topic, Topic.id == Step.topic_id)
            .join(User, User.id == Attempt.user_id)
            .where(Topic.subject_id == subject_id, User.role == Role.student,
                   Attempt.created_at >= lo, Attempt.created_at < hi)
        )
    )
    per_item: dict[str, list[bool]] = defaultdict(list)
    for attempt in attempts:
        for item in attempt.result:
            per_item[str(item.get("prompt", ""))].append(bool(item.get("is_correct")))
    hardest = sorted(
        (
            {"prompt": prompt[:200], "correct_percent": round(100 * sum(v) / len(v)), "answers": len(v)}
            for prompt, v in per_item.items()
            if len(v) >= 3
        ),
        key=lambda x: x["correct_percent"],
    )[:5]
    subs = (
        select(func.count())
        .select_from(Submission)
        .join(Task, Task.id == Submission.task_id)
        .join(Step, Step.id == Task.step_id)
        .join(Topic, Topic.id == Step.topic_id)
        .where(Topic.subject_id == subject_id)
    )
    submitted = await db.scalar(subs.where(Submission.submitted_at >= lo, Submission.submitted_at < hi))
    graded = await db.scalar(
        subs.where(Submission.status == SubmissionStatus.graded,
                   Submission.graded_at >= lo, Submission.graded_at < hi)
    )
    learners = select(StepProgress.user_id).join(Step, Step.id == StepProgress.step_id).join(
        Topic, Topic.id == Step.topic_id
    ).where(Topic.subject_id == subject_id).distinct()
    active = select(XpEvent.user_id).where(XpEvent.created_at >= hi - timedelta(days=7)).distinct()
    inactive = await db.scalar(
        select(func.count()).select_from(
            learners.where(StepProgress.user_id.not_in(active)).subquery()
        )
    )
    topics = [t.model_dump() for t in await topic_stats(db, subject_id)]
    return {
        "period": [start.isoformat(), end.isoformat()],
        "topics": topics,
        "attempts": len(attempts),
        "hardest": hardest,
        "submitted": int(submitted or 0),
        "graded": int(graded or 0),
        "inactive_students": int(inactive or 0),
    }


async def _write_report(
    db: AsyncSession, ai: AiServices, subject_id: int, start: date, end: date, stats: dict[str, Any]
) -> int:
    locales = {
        loc.value
        for loc in await db.scalars(
            select(User.locale)
            .join(subject_teachers, subject_teachers.c.user_id == User.id)
            .where(subject_teachers.c.subject_id == subject_id)
        )
    } or {"uz"}
    quiet = stats["attempts"] == 0 and stats["submitted"] == 0
    for locale in sorted(locales):
        content = (
            EMPTY[locale]
            if quiet
            else await ai.llm.generate(
                ai.fast_model, PROMPT[locale],
                [ChatMessage("user", json.dumps(stats, ensure_ascii=False))],
            )
        )
        report = await db.scalar(
            select(AiReport).where(AiReport.subject_id == subject_id,
                                   AiReport.locale == locale, AiReport.period_start == start)
        )
        if report is None:
            report = AiReport(subject_id=subject_id, locale=locale, period_start=start,
                              period_end=end, stats=stats, content=content)
            db.add(report)
        else:
            report.stats, report.content, report.period_end = stats, content, end
    await db.commit()
    return len(locales)


async def weekly_report(
    settings: Settings, week_start: date | None = None, subject_id: int | None = None
) -> int:
    if not settings.ai_configured:
        raise ValueError("AI sozlanmagan (GEMINI_API_KEY yoki AI_PROVIDER=fake)")
    start, end = week_bounds(week_start)
    engine = make_engine(settings.database_url)
    ai = build_ai(settings, engine.dialect.name)
    count = 0
    try:
        async with make_sessionmaker(engine)() as db:
            stmt = select(Subject.id).where(Subject.is_published.is_(True))
            if subject_id is not None:
                stmt = select(Subject.id).where(Subject.id == subject_id)
            for sid in list(await db.scalars(stmt)):
                stats = await subject_week_stats(db, sid, start, end)
                count += await _write_report(db, ai, sid, start, end, stats)
    finally:
        await engine.dispose()
    return count
```

  > `XpEvent` (`gamification/models.py`) `user_id` va `created_at` (`CreatedAtMixin`) maydonlariga ega.

- [ ] **Step 3:** `cli.py`, yangi subcommand va shoxchalanish:

```python
    report = commands.add_parser("weekly-report", help="Fanlar bo'yicha haftalik AI tahlili")
    report.add_argument("--week-start", default=None, help="YYYY-MM-DD (dushanba)")
    report.add_argument("--subject", type=int, default=None)
    args = parser.parse_args(argv)

    if args.command == "weekly-report":
        from datetime import date

        from app.ai.reports import weekly_report

        try:
            week_start = date.fromisoformat(args.week_start) if args.week_start else None
            count = asyncio.run(weekly_report(get_settings(), week_start, args.subject))
        except ValueError as exc:
            print(f"Xato: {exc}", file=sys.stderr)
            return 1
        print(f"Hisobotlar: {count}")
        return 0
```

  Mavjud `create-admin` kodi `if args.command == "create-admin":` blokiga o'tkaziladi.
- [ ] **Step 4:** sxema va endpoint:

```python
class AiReportOut(BaseModel):
    id: int
    subject_id: int
    locale: str
    period_start: date
    period_end: date
    stats: dict[str, Any]
    content: str
    created_at: datetime
```

```python
@router.get("/ai/reports", response_model=list[AiReportOut])
async def reports(subject_id: SubjectQuery, user: StaffUser, db: DbSession) -> list[AiReport]:
    await editing.ensure_can_edit_subject(db, user, subject_id)
    return list(
        await db.scalars(
            select(AiReport)
            .where(AiReport.subject_id == subject_id, AiReport.locale == user.locale.value)
            .order_by(AiReport.period_start.desc())
            .limit(4)
        )
    )
```

  Bu yerda `SubjectQuery = Annotated[int, Query(ge=1, le=DB_ID_MAX)]`.
- [ ] **Step 5:** ruff, mypy. Smoke-tekshiruv: `AI_PROVIDER=fake uv run python -m app.cli weekly-report` → `Hisobotlar: N`.
- [ ] **Step 6:** commit `feat(ai): weekly report CLI`, CHANGELOG.

---

## Task 12: Admin AI API

**Fayllar:** `app/ai/admin_router.py`, `app/ai/schemas.py`, `app/api.py`

- [ ] **Step 1:** sxemalar:

```python
class AiSettingsOut(BaseModel):
    enabled: bool
    student_daily_limit: int
    configured: bool
    provider: str
    chat_model: str
    embedding_model: str


class AiSettingsUpdate(BaseModel):
    enabled: bool | None = None
    student_daily_limit: int | None = Field(default=None, ge=0, le=500)


class AiUsageDay(BaseModel):
    date: date
    requests: int
    users: int


class AiUsageOut(BaseModel):
    days: list[AiUsageDay]
    chunks: int
    stale_chunks: int


class ReindexIn(BaseModel):
    all: bool = False
```

- [ ] **Step 2:** `app/ai/admin_router.py`:

```python
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.ai.constants import REINDEX_JOB
from app.ai.models import AiUsage, DocChunk
from app.ai.schemas import AiSettingsOut, AiSettingsUpdate, AiUsageDay, AiUsageOut, ReindexIn
from app.ai.services import get_ai_settings, require_ai
from app.ai.usage import today
from app.auth.deps import AdminUser
from app.core.deps import Ai, AppSettings, DbSession, Jobs

router = APIRouter(prefix="/admin/ai", tags=["admin-ai"])


def _settings_out(row, settings, ai) -> AiSettingsOut:  # type: ignore[no-untyped-def]
    return AiSettingsOut(
        enabled=row.enabled,
        student_daily_limit=row.student_daily_limit,
        configured=ai.configured,
        provider=settings.ai_provider,
        chat_model=settings.ai_model_chat,
        embedding_model=ai.embedder.model_name,
    )


@router.get("/settings", response_model=AiSettingsOut)
async def get_settings_(
    _: AdminUser, db: DbSession, settings: AppSettings, ai: Ai
) -> AiSettingsOut:
    row = await get_ai_settings(db)
    await db.commit()
    return _settings_out(row, settings, ai)


@router.patch("/settings", response_model=AiSettingsOut)
async def update_settings(
    data: AiSettingsUpdate, _: AdminUser, db: DbSession, settings: AppSettings, ai: Ai
) -> AiSettingsOut:
    row = await get_ai_settings(db)
    if data.enabled is not None:
        row.enabled = data.enabled
    if data.student_daily_limit is not None:
        row.student_daily_limit = data.student_daily_limit
    await db.commit()
    return _settings_out(row, settings, ai)


@router.get("/usage", response_model=AiUsageOut)
async def usage_stats(
    _: AdminUser, db: DbSession, ai: Ai, days: Annotated[int, Query(ge=1, le=90)] = 30
) -> AiUsageOut:
    since = today() - timedelta(days=days - 1)
    rows = await db.execute(
        select(AiUsage.date, func.sum(AiUsage.requests), func.count(AiUsage.user_id))
        .where(AiUsage.date >= since)
        .group_by(AiUsage.date)
        .order_by(AiUsage.date)
    )
    chunks = await db.scalar(select(func.count()).select_from(DocChunk))
    stale = await db.scalar(
        select(func.count()).where(DocChunk.embedding_model != ai.embedder.model_name)
    )
    return AiUsageOut(
        days=[AiUsageDay(date=d, requests=int(r), users=int(u)) for d, r, u in rows],
        chunks=int(chunks or 0),
        stale_chunks=int(stale or 0),
    )


@router.post("/reindex", status_code=202)
async def reindex(data: ReindexIn, _: AdminUser, db: DbSession, ai: Ai, jobs: Jobs) -> dict[str, bool]:
    await require_ai(db, ai)
    await jobs.enqueue(REINDEX_JOB, everything=data.all)
    return {"queued": True}
```

  `_settings_out` ga aniq tiplar (`AiSettings`, `Settings`, `AiServices`) yoziladi, shunda `type: ignore` kerak bo'lmaydi.
- [ ] **Step 3:** `app/api.py` ga `ai_admin_router`.
- [ ] **Step 4:** ruff, mypy. Commit `feat(ai): admin AI settings, usage and reindex`, CHANGELOG.

---

## Task 13: Frontend uchun API sxemasi va xato matnlari

**Fayllar:** `frontend/src/api/schema.gen.ts` (generatsiya), `frontend/src/i18n/uz.json`, `ru.json`

- [ ] **Step 1:** `cd frontend && npm run gen:api` — yangi endpoint'lar `schema.gen.ts` ga tushadi.
- [ ] **Step 2:** `npm run typecheck`. `SubmissionDetail` ga yangi majburiy maydonlar qo'shilgani uchun `types.contract.ts` xato bersa, `src/api/types.ts` dagi `SubmissionDetail` ga quyidagilar qo'shiladi:
  - `ai_status: 'none' | 'pending' | 'done' | 'unsupported' | 'failed'`;
  - `ai_score: number | null`;
  - `ai_feedback: { feedback: string; strengths: string[]; issues: string[] } | null`.
- [ ] **Step 3:** `errors.*` ga uz va ru matnlari:
  - `AI_DISABLED`, `AI_BUSY`, `AI_LIMIT_REACHED`;
  - `CONVERSATION_NOT_FOUND`;
  - `AI_DRAFT_NOT_FOUND`, `AI_DRAFT_WRONG_STEP`, `AI_DRAFT_NOT_READY`, `AI_DRAFT_CLOSED`, `AI_DRAFT_INVALID`.
  
  Uz matnlari backend xabarlari bilan bir xil bo'ladi.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm run build`.
- [ ] **Step 5:** commit `chore(frontend): API schema and error texts for AI`, CHANGELOG.

---

## Task 14: Haqiqiy kalit bilan qo'lda tekshiruv

Foydalanuvchi `backend/.env` ga `GEMINI_API_KEY` ni o'zi yozadi. Kalit chatga, commitga va loglarga tushmaydi.

- [ ] **Step 1:** toza baza bilan backend va frontend ishga tushiriladi (2-bosqich qo'lda tekshiruvidagi kabi: `e2e/start-backend.mjs` + `vite`). `start-backend.mjs` `process.env` ni uzatadi, shuning uchun kalit `GEMINI_API_KEY=... node e2e/start-backend.mjs` ko'rinishida faqat shu jarayonga beriladi.
- [ ] **Step 2:** API orqali tekshiriladi:
  - PDF yuklash → `doc_chunks` to'ldi;
  - repetitor: mavzu savoli → manbali javob; aloqasiz savol → rad javobi; nashr qilingan test savoli matni → `mode=hint`;
  - test qoralamasi → `draft` → tasdiqlash;
  - matnli vazifa → `ai_status=done`;
  - `weekly-report`.
  
  Har natija qisqa yozib boriladi.
- [ ] **Step 3:** model nomi yoki SDK chaqiruvida xato chiqsa, tuzatiladi va alohida commit qilinadi. Bir xil xato ikki marta takrorlansa, to'xtab foydalanuvchiga hisobot beriladi.
- [ ] **Step 4:** CHANGELOG'ga tekshiruv natijasi yoziladi.

---

## Task 15: Hujjatlar va yakun

- [ ] Spec `2026-10-13-phase-3-ai-design.md` ga "Amalga oshirishdagi aniqliklar" bo'limi (shu rejaning boshidagi 5 band).
- [ ] `CLAUDE.md`:
  - loyiha holati: 3A qurilgan;
  - "Architecture (backend)" ga `app/ai/` bandi: `app.state.ai`, `Ai` alias, `JobContext.ai`, `VectorStore` ikki dialekti, `AI_PROVIDER=fake`, indekslash hook'lari, `weekly-report` CLI;
  - "Commands" ga `uv run python -m app.cli weekly-report`.
- [ ] Roadmap: 3A bajarildi, keyingisi 3B rejasi.
- [ ] Yakuniy tekshiruv:
  - backend: `uv run ruff format --check . && uv run ruff check . && uv run mypy app && uv run alembic check`;
  - frontend: `npm run lint && npm run typecheck && npm run build`, `npm run gen:api` farqsiz.
- [ ] CHANGELOG va commit. Push foydalanuvchi so'raganda.

---

## Loyiha oxirida yoziladigan testlar (eslatma)

| Fayl | Holatlar |
|---|---|
| `tests/test_ai_providers.py` | `FakeProvider` embedding deterministik va normallashgan; `TokenBucket` kutadi va `ProviderBusy` beradi; `with_retry` 429 da qayta urinadi, 400 da darhol `ProviderBusy` |
| `tests/test_ai_vectors.py` | ikkala store: `add`/`delete`/`search` tartibi va `topic_ids` filtri (PG — `TEST_DATABASE_URL` bilan) |
| `tests/test_ai_chunking.py` | `split_text` uzunligi, ustma-ustligi, bo'sh sahifa |
| `tests/test_ai_indexing.py` | PDF yuklash → bo'laklar; o'chirish → bo'laklar yo'q; savol bo'laklarida to'g'ri javob (variantlar, `answer`, krossvord so'zi) yo'q |
| `tests/test_ai_tutor.py` | `AI_DISABLED`; limit (429, o'qituvchi cheksiz); tayyor javob limitni yemaydi; rad javobi LLM'siz; maslahat rejimi faqat yakunlanmaganda; `activity`/`task` bo'laklari kontekstga kirmaydi; begona suhbat 404; SSE hodisalari tartibi |
| `tests/test_ai_drafts.py` | bosqich mosligi; noto'g'ri material; fake → `draft`; tasdiqlash nashr qilinmagan faoliyat, glossariy va vazifa yaratadi; holat xatolari (409); noto'g'ri payload 422 |
| `tests/test_ai_grading.py` | `extract_text` (txt/pdf/docx/unsupported); promptda ism va email yo'q; qayta yuborilgan javob natijasi tashlanadi; talaba sxemasida `ai_*` yo'q |
| `tests/test_ai_reports.py` | `week_bounds`; statistika; bo'sh hafta LLM'siz; takroriy ishga tushirish upsert |
| `tests/test_ai_admin.py` | sozlamalar (kalit qaytmaydi); usage; reindex 202; admin bo'lmaganga 403 |
| `tests/test_migrations.py` | mavjud test yangi jadvallar bilan o'tadi |
