# 4A-bosqich: kutubxona, CMS, AI indeksi va SEO (backend) — implementatsiya rejasi

> Bajarish `CLAUDE.md` "Execution Constraints" bo'yicha: subagent yo'q, 3–5 tasklik batch'lar, har task bitta commit + `CHANGELOG.md` yozuvi (o'sha commitda), faqat `main`.
>
> **Foydalanuvchi qarori:** testlar loyiha oxirida. Har task oxirida `uv run ruff format --check . && uv run ruff check . && uv run mypy app`; model o'zgargan task'da `uv run alembic upgrade head && uv run alembic check` (toza `dev.db` nusxasida). Ruxsatlar va asosiy oqim `uvicorn` + `curl` bilan qo'lda tekshiriladi.
>
> Modellar, sxemalar, mantiq funksiyalari va AI/SEO o'zgarishlari to'liq kod bilan. Router'lar endpoint jadvali + bitta to'liq namuna bilan; qolganlari xuddi shu uslubda (ingichka: ruxsat → mantiq funksiyasi → javob).

**Goal:** Mini-spec `docs/superpowers/specs/2026-10-14-phase-4-design.md` ning backend qismi: `app/library/` (papkalar, hujjatlar, kitoblar), `app/cms/` (yangiliklar, FAQ, sayt sozlamalari, bog'lanish), kutubxona PDF'larini AI indeksiga qo'shish, `sitemap.xml` / `robots.txt`.

**Architecture:** ikki yangi modul mavjud `learning`/`assessment` uslubida; fayllar `Storage` + `core/files.py`; ochiq endpoint'lar auth'siz; bog'lanish formasi uchun `app.state.contact_limiter` (`InMemoryRateLimiter`); AI indeksi `ai/indexing.py` dagi yangi job'lar orqali.

**Tech Stack:** mavjud (FastAPI, SQLAlchemy 2 async, Alembic, Pydantic v2). Yangi bog'liqlik yo'q.

---

## Fayl xaritasi

| Fayl | Vazifa |
|---|---|
| `app/core/config.py` (o'zg.) | `max_library_mb`, `max_cover_mb`, `contact_rate_limit`, `contact_rate_window_seconds`, `public_base_url` |
| `app/core/files.py` (o'zg.) | `.webp` imzosi, `ALLOWED_DOC_EXT`, `ALLOWED_IMAGE_EXT`, `save_checked()` |
| `app/main.py`, `app/core/deps.py` (o'zg.) | `contact_limiter`, `ContactLimiter` alias |
| `app/library/models.py`, `app/cms/models.py` | modellar |
| `app/models_registry.py` (o'zg.) | importlar |
| `alembic/versions/*_library_and_cms_tables.py` | migratsiya |
| `app/library/schemas.py`, `folders.py`, `documents.py`, `books.py` | mantiq |
| `app/library/public_router.py`, `admin_router.py`, `teach_router.py` | router'lar |
| `app/cms/schemas.py`, `news.py`, `faq.py`, `site.py`, `contact.py`, `seo.py` | mantiq |
| `app/cms/public_router.py`, `admin_router.py` | router'lar |
| `app/api.py` (o'zg.) | router'larni ulash |
| `app/ai/models.py`, `vectors.py`, `indexing.py`, `tutor.py`, `constants.py` (o'zg.) + migratsiya | kutubxona indeksi |

---

## Task 0: sozlamalar, fayl yordamchilari, modellar va migratsiya

- [ ] **Step 1: `core/config.py`** (`max_submission_mb` dan keyin):

```python
    max_library_mb: int = 50
    max_cover_mb: int = 5
    contact_rate_limit: int = 5
    contact_rate_window_seconds: int = 3600
    # Sitemap va robots.txt dagi to'liq manzillar uchun (prod'da haqiqiy domen).
    public_base_url: str = "http://localhost:5173"
```

`.env.example` ga `PUBLIC_BASE_URL=http://localhost:5173` (izoh bilan).

- [ ] **Step 2: `core/files.py`** — webp imzosi (`RIFF....WEBP`, 12 bayt) va umumiy saqlash:

```python
ALLOWED_DOC_EXT = frozenset({".pdf", ".doc", ".docx", ".ppt", ".pptx"})
ALLOWED_IMAGE_EXT = frozenset({".jpg", ".jpeg", ".png", ".webp"})


def signature_matches(path: Path, ext: str) -> bool:
    with path.open("rb") as fh:
        header = fh.read(12)
    if ext == ".webp":
        return header[:4] == b"RIFF" and header[8:12] == b"WEBP"
    signatures = FILE_SIGNATURES.get(ext)
    if not signatures:
        return True
    return any(header.startswith(signature) for signature in signatures)


async def save_checked(
    storage: Storage, upload: UploadFile, subdir: str, *, allowed_ext: frozenset[str], max_mb: int
) -> tuple[str, str, int]:
    """Saqlaydi va magic bytes'ni tekshiradi; mos kelmasa faylni o'chirib 400. (rel, nom, hajm)."""
    rel, original_name = await storage.save_upload(
        upload, subdir, allowed_ext=allowed_ext, max_bytes=max_mb * 1024 * 1024
    )
    path = storage.path(rel)
    if not signature_matches(path, Path(rel).suffix.lower()):
        storage.delete(rel)
        raise AppError(400, "UNSUPPORTED_FILE_TYPE", "Fayl mazmuni e'lon qilingan turga mos emas")
    return rel, original_name, path.stat().st_size
```

(`UploadFile`, `AppError` importlari qo'shiladi; mavjud `signature_matches` almashtiriladi — xatti-harakati boshqa kengaytmalar uchun o'zgarmaydi.)

- [ ] **Step 3: `app/library/models.py`**

```python
from enum import StrEnum

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, str_enum


class LibrarySection(StrEnum):
    metodik = "metodik"
    huquqiy = "huquqiy"


class Folder(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "folders"

    # RESTRICT: bo'sh bo'lmagan papka o'chirilmaydi (kod ham 409 bilan tekshiradi).
    parent_id: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("folders.id", ondelete="RESTRICT"), index=True
    )
    section: Mapped[LibrarySection] = mapped_column(str_enum(LibrarySection), index=True)
    title: Mapped[str] = mapped_column(String(200))
    order: Mapped[int] = mapped_column(Integer, default=0)


class Document(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "documents"

    folder_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("folders.id", ondelete="RESTRICT"), index=True
    )
    title: Mapped[str] = mapped_column(String(300))
    file: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)


class Book(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "books"

    category: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(300))
    author: Mapped[str] = mapped_column(String(200), default="")
    cover: Mapped[str | None] = mapped_column(String(500))
    file: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    uploaded_by: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
```

- [ ] **Step 4: `app/cms/models.py`**

```python
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import UTCDateTime, utcnow


class News(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "news"

    title: Mapped[str] = mapped_column(String(300))
    slug: Mapped[str] = mapped_column(String(220), unique=True)
    body: Mapped[str] = mapped_column(Text, default="")
    cover: Mapped[str | None] = mapped_column(String(500))
    # NULL — qoralama; kelajakdagi sana — rejalashtirilgan (ochiq API'da hali ko'rinmaydi).
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime, index=True)
    views: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class FaqItem(IdMixin, Base):
    __tablename__ = "faq_items"

    question: Mapped[str] = mapped_column(String(500))
    answer: Mapped[str] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)


class ContactMessage(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "contact_messages"

    name: Mapped[str] = mapped_column(String(150))
    contact: Mapped[str] = mapped_column(String(150))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)


class SiteSetting(Base):
    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    value: Mapped[Any] = mapped_column(JSON)
```

- [ ] **Step 5:** `models_registry.py` ga `import app.cms.models` va `import app.library.models`; `app/library/__init__.py`, `app/cms/__init__.py`.
- [ ] **Step 6:** `uv run alembic revision --autogenerate -m "library and cms tables"`; faylni ko'zdan kechirish (FK nomlari `NAMING_CONVENTION` dan, `render_as_batch`); `alembic upgrade head`, `alembic check` toza.
- [ ] **Step 7: `main.py` / `deps.py`**: `app.state.contact_limiter = InMemoryRateLimiter(settings.contact_rate_limit, settings.contact_rate_window_seconds)`; `get_contact_limiter` + `ContactLimiter = Annotated[InMemoryRateLimiter, Depends(get_contact_limiter)]`.
- [ ] **Step 8:** ruff, mypy, alembic; CHANGELOG + commit `feat(library,cms): models and migration`.

---

## Task 1: papkalar va hujjatlar

- [ ] **Step 1: `library/schemas.py`** (shu task qismi):

```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.types import DbId, Order31, trimmed_str
from app.library.models import LibrarySection


class FolderIn(BaseModel):
    section: LibrarySection
    parent_id: DbId | None = None
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    order: Order31 = 0


class FolderUpdate(BaseModel):
    title: trimmed_str(max_length=200) | None = None  # type: ignore[valid-type]
    order: Order31 | None = None


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    folder_id: int
    title: str
    original_name: str
    size: int
    created_at: datetime


class FolderOut(BaseModel):
    """Daraxt tugunlari: ichki papkalar va hujjatlar bilan."""

    id: int
    parent_id: int | None
    section: LibrarySection
    title: str
    order: int
    documents: list[DocumentOut] = Field(default_factory=list)
    children: list["FolderOut"] = Field(default_factory=list)


class DocumentUpdate(BaseModel):
    title: trimmed_str(max_length=300) | None = None  # type: ignore[valid-type]
    folder_id: DbId | None = None
```

- [ ] **Step 2: `library/folders.py`**

```python
"""Kutubxona papkalari: daraxt, CRUD. Bo'sh bo'lmagan papka o'chirilmaydi."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.library.models import Document, Folder, LibrarySection
from app.library.schemas import DocumentOut, FolderIn, FolderOut, FolderUpdate


async def get_folder(db: AsyncSession, folder_id: int) -> Folder:
    folder = await db.get(Folder, folder_id)
    if folder is None:
        raise AppError(404, "FOLDER_NOT_FOUND", "Papka topilmadi")
    return folder


async def tree(db: AsyncSession, section: LibrarySection) -> list[FolderOut]:
    folders = list(
        await db.scalars(
            select(Folder).where(Folder.section == section).order_by(Folder.order, Folder.id)
        )
    )
    ids = [f.id for f in folders]
    docs = (
        list(
            await db.scalars(
                select(Document)
                .where(Document.folder_id.in_(ids))
                .order_by(Document.title, Document.id)
            )
        )
        if ids
        else []
    )
    nodes = {
        f.id: FolderOut(id=f.id, parent_id=f.parent_id, section=f.section, title=f.title, order=f.order)
        for f in folders
    }
    for doc in docs:
        nodes[doc.folder_id].documents.append(DocumentOut.model_validate(doc))
    roots: list[FolderOut] = []
    for f in folders:
        node = nodes[f.id]
        parent = nodes.get(f.parent_id) if f.parent_id is not None else None
        (parent.children if parent else roots).append(node)
    return roots


async def create_folder(db: AsyncSession, data: FolderIn) -> Folder:
    if data.parent_id is not None:
        parent = await get_folder(db, data.parent_id)
        if parent.section != data.section:
            raise AppError(400, "FOLDER_SECTION_MISMATCH", "Ichki papka boshqa bo'limda bo'la olmaydi")
    folder = Folder(**data.model_dump())
    db.add(folder)
    await db.commit()
    return folder


async def update_folder(db: AsyncSession, folder: Folder, data: FolderUpdate) -> Folder:
    for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(folder, key, value)
    await db.commit()
    return folder


async def delete_folder(db: AsyncSession, folder: Folder) -> None:
    children = await db.scalar(select(func.count()).where(Folder.parent_id == folder.id))
    docs = await db.scalar(select(func.count()).where(Document.folder_id == folder.id))
    if children or docs:
        raise AppError(409, "FOLDER_NOT_EMPTY", "Papka bo'sh emas")
    await db.delete(folder)
    await db.commit()
```

Mini-spec'ga qo'shimcha xato kodi: `FOLDER_SECTION_MISMATCH` (400) — `errors.*` ga 4A Task 8 da qo'shiladi.

- [ ] **Step 3: `library/documents.py`**

```python
"""Kutubxona hujjatlari: yuklash, tahrir, o'chirish. PDF bo'lsa AI indeksiga yuboriladi."""

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.constants import INDEX_LIBRARY_JOB
from app.core.config import Settings
from app.core.errors import AppError
from app.core.files import ALLOWED_DOC_EXT, save_checked
from app.core.jobs import JobRunner
from app.core.storage import Storage
from app.library.folders import get_folder
from app.library.models import Document
from app.library.schemas import DocumentUpdate


async def get_document(db: AsyncSession, document_id: int) -> Document:
    document = await db.get(Document, document_id)
    if document is None:
        raise AppError(404, "DOCUMENT_NOT_FOUND", "Hujjat topilmadi")
    return document


async def add_document(
    db: AsyncSession,
    *,
    folder_id: int,
    title: str,
    upload: UploadFile,
    storage: Storage,
    settings: Settings,
    jobs: JobRunner,
) -> Document:
    await get_folder(db, folder_id)
    rel, original_name, size = await save_checked(
        storage, upload, "library", allowed_ext=ALLOWED_DOC_EXT, max_mb=settings.max_library_mb
    )
    document = Document(
        folder_id=folder_id, title=title.strip(), file=rel, original_name=original_name, size=size
    )
    db.add(document)
    await db.commit()
    if rel.endswith(".pdf"):
        await jobs.enqueue(INDEX_LIBRARY_JOB, source="document", source_id=document.id)
    return document


async def update_document(db: AsyncSession, document: Document, data: DocumentUpdate) -> Document:
    values = data.model_dump(exclude_unset=True, exclude_none=True)
    if "folder_id" in values:
        await get_folder(db, values["folder_id"])
    for key, value in values.items():
        setattr(document, key, value)
    await db.commit()
    return document


async def delete_document(db: AsyncSession, document: Document) -> str:
    """Yozuv va AI bo'laklarini o'chiradi; o'chiriladigan fayl yo'lini qaytaradi."""
    from app.ai.indexing import delete_library_chunks

    rel = document.file
    await delete_library_chunks(db, "document", document.id)
    await db.delete(document)
    await db.commit()
    return rel
```

(`INDEX_LIBRARY_JOB` va `delete_library_chunks` Task 6 da qo'shiladi; Task 1 da vaqtincha ularsiz yozib, Task 6 da ulash ham mumkin — tartibni saqlash uchun Task 6 ni Task 1 dan oldin bajarish ham mumkin. **Qaror: Task 6 ning `constants`/`delete_library_chunks` qismi Task 1 ichida birga qo'shiladi** (subject_id migratsiyasi va qidiruv Task 6 da qoladi).)

- [ ] **Step 4: router'lar**

| Router | Endpoint | Ruxsat | Mantiq |
|---|---|---|---|
| `library/public_router.py` (`/library`) | `GET /folders?section=` → `list[FolderOut]` | ochiq | `folders.tree` |
| | `GET /documents/{id}/file` | ochiq | `file_response(settings, storage, d.file, d.original_name)` |
| `library/admin_router.py` (`/admin/library`) | `POST /folders` (201), `PATCH /folders/{id}`, `DELETE /folders/{id}` (204) | `AdminUser` | `folders.*` |
| | `POST /folders/{id}/documents` (multipart: `title` + `file`, 201 → `DocumentOut`) | `AdminUser` | `documents.add_document` |
| | `PATCH /documents/{id}`, `DELETE /documents/{id}` (204, `storage.delete_quietly([rel])`) | `AdminUser` | `documents.*` |

Namuna (`library/public_router.py`):

```python
from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.files import file_response
from app.core.types import DbIdPath
from app.library import documents, folders
from app.library.models import LibrarySection
from app.library.schemas import FolderOut

router = APIRouter(prefix="/library", tags=["library"])


@router.get("/folders", response_model=list[FolderOut])
async def folder_tree(
    db: DbSession, section: Annotated[LibrarySection, Query()]
) -> list[FolderOut]:
    return await folders.tree(db, section)


@router.get("/documents/{document_id}/file", response_class=Response)
async def document_file(
    document_id: DbIdPath, db: DbSession, settings: AppSettings, storage: AppStorage
) -> Response:
    document = await documents.get_document(db, document_id)
    return file_response(settings, storage, document.file, document.original_name)
```

Multipart `title` uchun `teach_materials_router.TitleForm` naqshi (`Form(min_length=1, max_length=300)` + `_reject_blank`) — `app/core/forms.py` ga ko'chirib, ikkala joyda ishlatiladi (kichik refaktor, xatti-harakat o'zgarmaydi).

- [ ] **Step 5:** `app/api.py` ga ulash; ruff, mypy; qo'lda: admin papka + PDF hujjat qo'shadi, mehmon (`curl` tokensiz) daraxtni va faylni oladi; bo'sh bo'lmagan papkani o'chirish 409. CHANGELOG + commit `feat(library): folders and documents`.

---

## Task 2: kitoblar

- [ ] **Step 1: sxemalar** (`library/schemas.py` ga):

```python
class BookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    title: str
    author: str
    has_cover: bool
    original_name: str
    size: int
    is_approved: bool
    created_at: datetime


class BookAdminOut(BookOut):
    uploaded_by: int | None
    uploader_name: str | None


class BookUpdate(BaseModel):
    category: trimmed_str(max_length=100) | None = None  # type: ignore[valid-type]
    title: trimmed_str(max_length=300) | None = None  # type: ignore[valid-type]
    author: str | None = Field(default=None, max_length=200)
    is_approved: bool | None = None


class BookPage(BaseModel):
    items: list[BookOut]
    total: int
    page: int
    size: int
```

`has_cover` — `Book.cover is not None` (`BookOut.model_validate` dan oldin hisoblanadi yoki `@computed_field` emas, oddiy `@property` `Book` modelida: `has_cover`).

- [ ] **Step 2: `library/books.py`** — funksiyalar:
  - `get_book(db, id)` → 404 `BOOK_NOT_FOUND`;
  - `add_book(db, *, user, category, title, author, upload, cover, storage, settings, jobs)`: fayl `save_checked(..., "books", ALLOWED_DOC_EXT, max_library_mb)`, muqova (bo'lsa) `save_checked(..., "covers", ALLOWED_IMAGE_EXT, max_cover_mb)` — muqova xato bersa asosiy fayl ham o'chiriladi; `is_approved = user.role == Role.admin`; tasdiqlangan PDF bo'lsa `INDEX_LIBRARY_JOB(source="book")`;
  - `public_page(db, *, category, q, page, size)`: faqat `is_approved`, `q` — `title`/`author` bo'yicha `ilike`, `order_by(created_at desc)`, `total` bilan;
  - `categories(db)`: tasdiqlanganlarning `distinct(category)` alfavit tartibida;
  - `own_books(db, user)`; `delete_own(db, user, book)`: o'ziniki emas → 404, `is_approved` → 409 `BOOK_ALREADY_APPROVED`;
  - `admin_list(db, status)` (`pending|approved`, yuklovchi ismi bilan);
  - `update_book(db, book, data, jobs)`: `is_approved` `False→True` — `INDEX_LIBRARY_JOB`; `True→False` — `delete_library_chunks`;
  - `replace_cover(db, book, upload, storage, settings)` → eski muqova fayli qaytariladi (o'chirish uchun);
  - `delete_book(db, book)` → bo'laklar o'chiriladi, `[file, cover]` qaytariladi.
- [ ] **Step 3: router'lar**

| Router | Endpoint | Ruxsat |
|---|---|---|
| `public_router` | `GET /library/books?category=&q=&page=1&size=20` → `BookPage`; `GET /library/books/categories` → `list[str]`; `GET /library/books/{id}/file`, `GET /library/books/{id}/cover` (faqat tasdiqlangan, aks holda 404) | ochiq |
| `library/teach_router.py` (`/teach/books`) | `GET` → `list[BookOut]` (o'ziniki); `POST` (multipart: `category`, `title`, `author`, `file`, ixtiyoriy `cover`) → 201; `DELETE /{id}` → 204 | `StaffUser` |
| `admin_router` (`/admin/books`) | `GET ?status=pending|approved` → `list[BookAdminOut]`; `PATCH /{id}`; `PUT /{id}/cover` (multipart); `DELETE /{id}` → 204 | `AdminUser` |

- [ ] **Step 4:** ruff, mypy; qo'lda: o'qituvchi yuklaydi → katalogda yo'q; admin tasdiqlaydi → bor; o'qituvchi tasdiqlanganini o'chira olmaydi (409). CHANGELOG + commit `feat(library): books with approval`.

---

## Task 3: yangiliklar

- [ ] **Step 1: `cms/schemas.py`** (yangiliklar qismi):

```python
class NewsIn(BaseModel):
    title: trimmed_str(max_length=300)  # type: ignore[valid-type]
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    body: str = Field(default="", max_length=50000)
    published_at: AwareDatetime | None = None


class NewsUpdate(BaseModel):
    title: trimmed_str(max_length=300) | None = None  # type: ignore[valid-type]
    slug: str | None = Field(default=None, max_length=220, pattern=SLUG_PATTERN)
    body: str | None = Field(default=None, max_length=50000)
    published_at: AwareDatetime | None = None


class NewsCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    excerpt: str
    has_cover: bool
    published_at: datetime | None
    views: int


class NewsOut(NewsCard):
    body: str


class NewsAdminOut(NewsOut):
    created_at: datetime
    updated_at: datetime


class NewsPage(BaseModel):
    items: list[NewsCard]
    total: int
    page: int
    size: int
```

`SLUG_PATTERN` — `learning/schemas.py` dagi bilan bir xil (import qilinadi). `excerpt` — body'dan markdown belgilarisiz birinchi 200 belgi (`cms/news.py: excerpt()`), `has_cover` — `News` dagi `@property`. `NewsUpdate` da `published_at` ni `None` ga o'rnatish (nashrdan olish) `model_fields_set` orqali farqlanadi.

- [ ] **Step 2: `cms/news.py`** — `get_news`, `create_news` (slug: berilgan bo'lsa band → 409 `NEWS_SLUG_TAKEN`, aks holda `slugify(title)` + unikal qo'shimcha, `learning.editing` dagi `_unique_slug` naqshi `News` uchun), `update_news`, `delete_news` (cover yo'li qaytadi), `set_cover`, `public_page(page, size)` (`published_at <= now`, yangidan eskiga), `public_by_slug` (topilmasa yoki nashr qilinmagan → 404 `NEWS_NOT_FOUND`; `views += 1` `UPDATE ... SET views = views + 1` bilan, so'ng commit), `admin_list`.
- [ ] **Step 3: router'lar** — ochiq `cms/public_router.py`: `GET /news?page=&size=` → `NewsPage`, `GET /news/{slug}` → `NewsOut`, `GET /news/{id}/cover` (nashr qilingan, aks holda 404). Admin `cms/admin_router.py` (`/admin/news`): `GET` → `list[NewsAdminOut]`, `POST` 201, `GET /{id}`, `PATCH /{id}`, `PUT /{id}/cover` (multipart, `ALLOWED_IMAGE_EXT`, `max_cover_mb`), `DELETE /{id}` 204.
- [ ] **Step 4:** ruff, mypy; qo'lda: qoralama ochiq ro'yxatda yo'q; nashr qilingan bor; `views` oshadi; band slug 409. CHANGELOG + commit `feat(cms): news`.

---

## Task 4: FAQ va sayt sozlamalari

- [ ] **Step 1: sxemalar**

```python
class FaqIn(BaseModel):
    question: trimmed_str(max_length=500)  # type: ignore[valid-type]
    answer: trimmed_str(max_length=5000)  # type: ignore[valid-type]
    order: Order31 = 0
    is_published: bool = True


class FaqUpdate(BaseModel):
    question: trimmed_str(max_length=500) | None = None  # type: ignore[valid-type]
    answer: trimmed_str(max_length=5000) | None = None  # type: ignore[valid-type]
    order: Order31 | None = None
    is_published: bool | None = None


class FaqOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question: str
    answer: str
    order: int
    is_published: bool


class Contacts(BaseModel):
    phone: str = Field(default="", max_length=50)
    email: str = Field(default="", max_length=150)
    address: str = Field(default="", max_length=300)


class Socials(BaseModel):
    telegram: str = Field(default="", max_length=300)
    instagram: str = Field(default="", max_length=300)
    facebook: str = Field(default="", max_length=300)
    youtube: str = Field(default="", max_length=300)


class SiteOut(BaseModel):
    contacts: Contacts = Field(default_factory=Contacts)
    socials: Socials = Field(default_factory=Socials)
    about: str = Field(default="", max_length=20000)


class SiteUpdate(BaseModel):
    """Faqat yuborilgan bo'limlar almashtiriladi; noma'lum kalit — 422 (`extra="forbid"`)."""

    model_config = ConfigDict(extra="forbid")

    contacts: Contacts | None = None
    socials: Socials | None = None
    about: str | None = Field(default=None, max_length=20000)
```

Ijtimoiy havolalar `https://` bilan boshlanishi validator bilan tekshiriladi (bo'sh qiymat mumkin). `extra="forbid"` xatosi umumiy `VALIDATION_ERROR` sifatida qaytadi — mini-spec'dagi `SETTING_UNKNOWN` kodi kerak bo'lmaydi (spec'ga eslatma Task 8 da).

- [ ] **Step 2: `cms/faq.py`** — `public_list` (nashr qilingan, `order, id`), `admin_list`, `create`, `update`, `delete` (404 `FAQ_NOT_FOUND`).
- [ ] **Step 3: `cms/site.py`**

```python
SITE_KEYS = ("contacts", "socials", "about")


async def get_site(db: AsyncSession) -> SiteOut:
    rows = {s.key: s.value for s in await db.scalars(select(SiteSetting))}
    return SiteOut.model_validate({k: rows[k] for k in SITE_KEYS if k in rows})


async def update_site(db: AsyncSession, data: SiteUpdate) -> SiteOut:
    for key, value in data.model_dump(exclude_none=True).items():
        row = await db.get(SiteSetting, key)
        if row is None:
            db.add(SiteSetting(key=key, value=value))
        else:
            row.value = value
    await db.commit()
    return await get_site(db)
```

- [ ] **Step 4: router'lar** — ochiq: `GET /faq` → `list[FaqOut]`, `GET /site` → `SiteOut`; admin: `/admin/faq` (`GET`, `POST` 201, `PATCH /{id}`, `DELETE /{id}` 204), `GET` / `PUT /admin/site`.
- [ ] **Step 5:** ruff, mypy; qo'lda curl. CHANGELOG + commit `feat(cms): faq and site settings`.

---

## Task 5: bog'lanish formasi va admin xabarlar

- [ ] **Step 1: sxemalar**

```python
class ContactIn(BaseModel):
    name: trimmed_str(max_length=150)  # type: ignore[valid-type]
    contact: trimmed_str(max_length=150)  # type: ignore[valid-type]
    message: trimmed_str(max_length=5000)  # type: ignore[valid-type]
    # Honeypot: odam ko'rmaydi va to'ldirmaydi; bot to'ldirsa xabar jim tashlanadi.
    website: str = Field(default="", max_length=200)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    contact: str
    message: str
    is_read: bool
    created_at: datetime


class MessageUpdate(BaseModel):
    is_read: bool
```

- [ ] **Step 2: `cms/contact.py`** + ochiq router:

```python
@router.post("/contact", status_code=204)
async def contact(
    data: ContactIn, request: Request, db: DbSession, limiter: ContactLimiter
) -> Response:
    key = request.client.host if request.client else "-"
    if limiter.is_blocked(key):
        raise AppError(429, "CONTACT_RATE_LIMITED", "Juda ko'p xabar. Birozdan so'ng urinib ko'ring")
    limiter.record_failure(key)  # bu yerda "urinish" sifatida sanaladi
    if not data.website:
        await contact_mod.save_message(db, data)
    return Response(status_code=204)
```

`InMemoryRateLimiter` nomlari (`record_failure`) login uchun yozilgan, lekin har qanday "hisoblanadigan urinish" uchun ishlaydi — kommentariya bilan.

- [ ] **Step 3:** admin `/admin/messages`: `GET ?unread=` → `list[MessageOut]` (yangidan eskiga, 200 ta), `PATCH /{id}` (`is_read`), `DELETE /{id}` 204 (404 `MESSAGE_NOT_FOUND`).
- [ ] **Step 4:** ruff, mypy; qo'lda: 6-xabar 429; honeypot to'ldirilsa saqlanmaydi. CHANGELOG + commit `feat(cms): contact form and messages`.

---

## Task 6: kutubxona AI indeksi

- [ ] **Step 1: `ai/models.py`** — `DocChunk.subject_id: Mapped[int | None]` (nullable); `LIBRARY_SOURCES = (ChunkSource.document, ChunkSource.book)`. Migratsiya `alembic revision --autogenerate -m "doc chunks subject nullable"` (SQLite'da batch), `alembic check`. `vectors.ChunkRow.subject_id: int | None`.
- [ ] **Step 2: `ai/constants.py`** — `INDEX_LIBRARY_JOB = "index_library"` (Task 1 da qo'shilgan bo'ladi).
- [ ] **Step 3: `ai/indexing.py`**

```python
from app.library.models import Book, Document

_LIBRARY_MODELS = {"document": (Document, ChunkSource.document), "book": (Book, ChunkSource.book)}


async def delete_library_chunks(db: AsyncSession, source: str, source_id: int) -> None:
    """Hujjat/kitob o'chirilganda yoki tasdiq bekor qilinganda; commit chaqiruvchida."""
    _, chunk_source = _LIBRARY_MODELS[source]
    await db.execute(
        delete(DocChunk).where(DocChunk.source_type == chunk_source, DocChunk.source_id == source_id)
    )


@job(INDEX_LIBRARY_JOB)
async def index_library_job(ctx: JobContext, source: str, source_id: int) -> None:
    ai = await _ready_ai(ctx)
    if ai is None:
        return
    model, chunk_source = _LIBRARY_MODELS[source]
    async with ctx.sessionmaker() as db:
        row = await db.get(model, source_id)
        rel = row.file if row is not None else None
        approved = row is not None and (not isinstance(row, Book) or row.is_approved)
    if rel is None or not approved or not rel.endswith(".pdf"):
        return
    pages = await asyncio.to_thread(pdf_pages, ctx.storage.path(rel))
    chunks = chunk_pages(pages)
    vectors = await ai.embedder.embed([c.text for c in chunks], "document") if chunks else []
    async with ctx.sessionmaker() as db:
        if await db.get(model, source_id) is None:  # orada o'chirilgan
            return
        await ai.vectors.delete(db, source_types=[chunk_source], source_id=source_id)
        await ai.vectors.add(
            db,
            [
                ChunkRow(chunk_source, source_id, None, None, c.page, i, c.text, v)
                for i, (c, v) in enumerate(zip(chunks, vectors, strict=True))
            ],
            ai.embedder.model_name,
        )
        await db.commit()
```

`reindex_all_job`: `everything` da barcha PDF hujjatlar va tasdiqlangan PDF kitoblar; aks holda eskirgan `document`/`book` bo'laklarining `source_id` lari — har biri `index_library_job` (xatosi logga).

- [ ] **Step 4: `ai/vectors.py`** — `search(..., topic_ids: Sequence[int], k, include_library: bool = False)`; filtr:

```python
        scope = DocChunk.topic_id.in_(topic_ids)
        if include_library:
            scope = or_(scope, DocChunk.source_type.in_(LIBRARY_SOURCES))
        # ... .where(DocChunk.source_type.in_(source_types), scope)
```

`if not topic_ids: return []` faqat `include_library=False` bo'lsa.

- [ ] **Step 5: `ai/tutor.py`** — oxirgi (platforma) daraja: `source_types=CONTEXT_SOURCES + LIBRARY_SOURCES, include_library=True`; `_citations` kutubxona nomlarini oladi (`Document.title`, `Book.title`); glossariy uchun avvalgidek "Glossariy".
- [ ] **Step 6:** ruff, mypy, alembic; qo'lda (`AI_PROVIDER=fake` va haqiqiy kalit bilan): kutubxonaga PDF → `doc_chunks` (`source_type=document`) → mavzusiz suhbatda savol → manba hujjat nomi bilan. CHANGELOG + commit `feat(ai): index library documents and books`.

---

## Task 7: SEO — sitemap va robots

- [ ] **Step 1: `cms/seo.py`**

```python
"""Qidiruv tizimlari uchun: sitemap.xml va robots.txt (ochiq sahifalar va nashr qilingan yangiliklar)."""

from xml.sax.saxutils import escape

STATIC_PATHS = ("/", "/news", "/library", "/faq", "/about", "/contact")
PRIVATE_PREFIXES = ("/app", "/teach", "/admin", "/api", "/pending")


async def sitemap_xml(db: AsyncSession, base_url: str) -> str:
    base = base_url.rstrip("/")
    urls = [f"<url><loc>{escape(base + p)}</loc></url>" for p in STATIC_PATHS]
    rows = await db.execute(
        select(News.slug, News.updated_at)
        .where(News.published_at.is_not(None), News.published_at <= utcnow())
        .order_by(News.published_at.desc())
        .limit(5000)
    )
    for slug, updated in rows:
        urls.append(
            f"<url><loc>{escape(f'{base}/news/{slug}')}</loc>"
            f"<lastmod>{updated.date().isoformat()}</lastmod></url>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(urls) + "</urlset>"
    )


def robots_txt(base_url: str) -> str:
    lines = ["User-agent: *", *(f"Disallow: {p}" for p in PRIVATE_PREFIXES)]
    lines.append(f"Sitemap: {base_url.rstrip('/')}/sitemap.xml")
    return "\n".join(lines) + "\n"
```

- [ ] **Step 2:** ochiq router: `GET /seo/sitemap.xml` (`Response(media_type="application/xml")`), `GET /seo/robots.txt` (`text/plain`), `include_in_schema=False`.
- [ ] **Step 3:** ruff, mypy; qo'lda curl. CHANGELOG + commit `feat(cms): sitemap and robots`.

---

## Task 8: frontend uchun API sxemasi, xato matnlari va hujjatlar

- [ ] `npm run gen:api` (frontend'da) — `schema.gen.ts` ga yangi endpoint'lar; `typecheck` (`types.contract.ts` o'zgarmaydi, yangi tiplar 4B da qo'shiladi).
- [ ] `uz.json` / `ru.json` `errors.*`: `FOLDER_NOT_FOUND`, `FOLDER_NOT_EMPTY`, `FOLDER_SECTION_MISMATCH`, `DOCUMENT_NOT_FOUND`, `BOOK_NOT_FOUND`, `BOOK_ALREADY_APPROVED`, `NEWS_NOT_FOUND`, `NEWS_SLUG_TAKEN`, `FAQ_NOT_FOUND`, `MESSAGE_NOT_FOUND`, `CONTACT_RATE_LIMITED`.
- [ ] Mini-spec'ga "Amalga oshirishdagi aniqliklar (4A)" bo'limi: `FOLDER_SECTION_MISMATCH` qo'shildi, `SETTING_UNKNOWN` o'rniga `VALIDATION_ERROR` (`extra="forbid"`), `TitleForm` `core/forms.py` ga ko'chdi, `INDEX_LIBRARY_JOB` / `delete_library_chunks` Task 1 da.
- [ ] `CLAUDE.md` "Architecture (backend)" ga `app/library/` va `app/cms/` bandi (ochiq endpoint'lar auth'siz, `contact_limiter`, kitob tasdiqlash, kutubxona AI indeksi, `PUBLIC_BASE_URL`); roadmap: 4A ✅, keyingisi 4B rejasi.
- [ ] Yakuniy: ruff, mypy, `alembic check`; frontend lint, typecheck, build. CHANGELOG + commit `docs: close phase 4A backend`. Push — foydalanuvchi so'raganda.

---

## Batch'lar

- **Batch 1:** Task 0, 1, 2 (modellar, papkalar va hujjatlar, kitoblar).
- **Batch 2:** Task 3, 4, 5 (yangiliklar, FAQ va sozlamalar, bog'lanish).
- **Batch 3:** Task 6, 7, 8 (AI indeksi, SEO, yakun).

## Loyiha oxirida yoziladigan testlar (eslatma)

| Fayl | Holatlar |
|---|---|
| `tests/test_library_folders.py` | daraxt (ichki papkalar, hujjatlar), bo'lim mos kelmasligi 400, bo'sh bo'lmagan papka 409, mehmon o'qiydi, admin bo'lmaganga 403 |
| `tests/test_library_documents.py` | yuklash (magic bytes, hajm), ochiq yuklab olish, o'chirishda fayl va bo'laklar yo'q |
| `tests/test_library_books.py` | o'qituvchi yuklaydi → tasdiqlanmagan va ochiq ro'yxatda yo'q; admin tasdiqlaydi → bor; tasdiqlanganini o'qituvchi o'chira olmaydi 409; kategoriya va qidiruv; muqova webp |
| `tests/test_cms_news.py` | slug (avto, band 409), qoralama yashirin, rejalashtirilgan sana, `views`, sahifalash |
| `tests/test_cms_faq_site.py` | nashr qilinmagan FAQ yashirin; sozlamalar oq ro'yxati, `extra` 422, ijtimoiy havola validatsiyasi |
| `tests/test_cms_contact.py` | saqlanadi; honeypot jim; 6-so'rov 429; admin o'qilgan belgisi |
| `tests/test_ai_library.py` | PDF hujjat indekslanadi (`subject_id` NULL); tasdiqlanmagan kitob indekslanmaydi; tasdiq bekor qilinganda bo'laklar o'chadi; repetitor platforma darajasida kutubxona manbasini keltiradi |
| `tests/test_seo.py` | sitemap'da statik sahifalar va faqat nashr qilingan yangiliklar; robots yopiq prefikslar |
| `tests/test_migrations.py` | yangi jadvallar bilan mavjud test o'tadi |
