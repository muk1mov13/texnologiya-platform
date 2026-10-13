# 2A-bosqich: Baholash va gamifikatsiya (backend) — implementatsiya rejasi

> Reja 2026-10-11 da tasdiqlangan. Bajarish `CLAUDE.md` "Execution Constraints" bo'yicha boradi: subagent ishlatilmaydi, bir vaqtda bitta task bajariladi, har task'dan keyin foydalanuvchi tasdig'i kutiladi. Test ikki marta yiqilsa, to'xtab xabar beriladi.

**Goal:** Mini-spec'dagi (`docs/superpowers/specs/2026-10-11-phase-2-assessment-design.md`) backend qismini qurish: test, ha/yo'q va krossvord faoliyatlari, urinishlar, vazifa va baholash, XP, seriya, nishonlar, talaba bosh sahifasi, natijalar va o'qituvchi statistikasi. Barchasi testlar bilan qoplanadi.

**Architecture:** Ikki yangi modul qo'shiladi:
- `app/gamification/` — boshqa modullarni import qilmaydi. `award()` XP hodisasini yozadi, seriyani yangilaydi va nishonlarni beradi;
- `app/assessment/` — `learning` va `gamification`'ga tayanadi.

`learning` ikki joyda kengayadi: `content.load_step_infos` kontent bor-yo'qligini faoliyat va vazifalar bo'yicha ham aniqlaydi, `progress` esa bosqich ko'rinishi va "Tugatdim"ga mukofotlarni qo'shadi.

Import tsikli bo'lmasligi uchun talabaga ko'rinadigan sxemalar alohida `assessment/view_schemas.py` da turadi:
- `learning.student_schemas` → `assessment.view_schemas`;
- `assessment.schemas` → `learning.student_schemas`.

**Tech Stack:** mavjud: FastAPI, SQLAlchemy 2 async, Alembic, Pydantic v2, pytest. Yangi bog'liqlik yo'q. Toshkent vaqti doimiy UTC+5 (yozgi vaqt yo'q), shuning uchun `tzdata` kerak emas.

**Konventsiyalar:**
- Buyruqlar Git Bash'da `backend/` dan ishga tushiriladi, boshqacha ko'rsatilmagan bo'lsa.
- Har task oxirida: `uv run ruff format . && uv run ruff check . && uv run mypy app && uv run pytest -q` yashil bo'lishi kerak.
- Har task commit'i bilan birga `CHANGELOG.md` ga (2026-10-11 bo'limi, eng yangisi yuqorida) qisqa yozuv qo'shiladi. Keyin hash yoziladi va alohida commit qilinadi: `docs: add commit hash to changelog entry`. Commit oxirida `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` qatori bo'ladi.
- Xatolar `AppError(status, "CODE", "o'zbekcha xabar", details)` orqali qaytariladi. Testlar `code` maydonini tekshiradi.

**Mini-spec'ga aniqlik kiritishlar (Task 0 da spec'ga yoziladi):**
1. Faoliyat va element formati Pydantic bilan tekshiriladi, shuning uchun bu xatolar 422 `VALIDATION_ERROR` bo'lib qaytadi: variantlar soni, bo'sh matn, element soni va krossvordda 3–20 so'z. `ACTIVITY_INVALID_ITEMS` faqat semantik xatolar uchun qoladi: takrorlangan so'z, katak uzunligi, turini o'zgartirishga urinish.
2. Yangi endpoint: `GET /teach/steps/{step_id}/task`. O'qituvchi muharriri mavjud vazifani shu orqali yuklaydi.
3. Bosh sahifa javobida `continue` maydoni o'rniga `continue_step` ishlatiladi, chunki `continue` Python'da kalit so'z.
4. Seriya ko'rsatilganda, agar `last_active_date` kechadan eski bo'lsa, `current` 0 deb ko'rsatiladi. `longest` saqlanib qoladi.
5. O'qituvchi o'zi biriktirilmagan fandagi javobni so'rasa, 403 o'rniga 404 `SUBMISSION_NOT_FOUND` oladi, shunda javobning borligi bilinmaydi.
6. "Parallel XP" testi o'rniga takroriy `award` chaqiruvi tekshiriladi, chunki u ham xuddi o'sha savepoint shoxini ishlatadi. SQLite'da parallel yozish testlari beqaror bo'ladi.

---

## Fayl xaritasi

```
backend/app/
  core/files.py                       # YANGI: magic bytes tekshiruvi (materials'dan ko'chadi) + file_response
  core/config.py                      # max_submission_mb
  gamification/
    __init__.py, models.py            # XpEvent, Streak, Badge, UserBadge
    rules.py                          # XpReason, XP qiymatlari, BADGES
    schemas.py                        # BadgeBrief, RewardsOut, BadgeOut, StreakOut, ProfileOut
    service.py                        # sync_badges, award, Rewards, rewards_out, xp_total, profile
  assessment/
    __init__.py, models.py            # Activity, QuizQuestion, YesNoItem, CrosswordWord, Attempt, Task, Submission
    crossword.py                      # normalize_word, build_layout, layout_to_json, word_matches
    view_schemas.py                   # talabaga ko'rinadigan sxemalar (javobsiz)
    schemas.py                        # o'qituvchi sxemalari, urinish/vazifa/hisobot sxemalari
    items.py                          # load_items
    activities.py                     # o'qituvchi: faoliyat CRUD
    views.py                          # talaba: bosqichdagi faoliyatlar va vazifa ko'rinishi
    attempts.py                       # urinishni tekshirish, bosqichni tugatish, XP
    tasks.py                          # vazifa CRUD, javob yuborish, fayl
    review.py                         # tekshirish navbati, baholash, qaytarish
    reports.py                        # natijalarim, urinish tahlili, o'qituvchi statistikasi
    teach_router.py                   # /teach: faoliyatlar va vazifa
    review_router.py                  # /teach: javoblar, summary, stats
    router.py                         # talaba: urinish, javob, fayl, natijalar
  learning/content.py                 # has_content: faoliyat va vazifa
  learning/progress.py                # get_or_create_progress, topic_completion_rewards, step_content, complete_step
  learning/student_schemas.py         # StepContentOut kengayadi, StepCompleteOut, DashboardOut
  learning/router.py, progress_router.py, editing.py, materials.py
  api.py, main.py, models_registry.py
backend/alembic/versions/             # 2 ta yangi migratsiya
backend/tests/                        # test_gamification, test_crossword, test_files, test_teach_activities,
                                      # test_student_activities, test_attempts, test_tasks, test_review, test_reports
frontend/src/api/types.ts, types.contract.ts, schema.gen.ts, src/test/fixtures.ts   # faqat Task 11
```

---

### Task 0: Rejani repoga qo'shish va spec'ga aniqliklar

**Files:**
- Create: `docs/superpowers/plans/2026-10-11-phase-2a-backend.md` (shu fayl)
- Modify: `docs/superpowers/specs/2026-10-11-phase-2-assessment-design.md`, `CHANGELOG.md`

- [ ] **Step 1:** Rejani `docs/superpowers/plans/2026-10-11-phase-2a-backend.md` ga ko'chirish.
- [ ] **Step 2:** Spec'ga yuqoridagi 6 ta aniqlikni kiritish:
  - 9-bo'limdagi xato kodlari jadvali ostiga 1-band;
  - 7-bo'lim o'qituvchi jadvaliga `GET /teach/steps/{step_id}/task` qatori;
  - 7-bo'lim `/me/dashboard` qatorida `continue` → `continue_step`;
  - 5-bo'lim seriya qoidasiga 4-band;
  - 9-bo'lim "Ruxsatlar"ga 5-band;
  - 9-bo'lim XP testi bandiga 6-band.
- [ ] **Step 3:** `CHANGELOG.md` yozuvi, commit `docs: phase 2A backend implementation plan`, so'ng hash commit'i.

---

### Task 1: Gamifikatsiya modellari, qoidalar va nishonlar sinxronizatsiyasi

**Files:**
- Create: `app/gamification/__init__.py` (bo'sh), `app/gamification/models.py`, `app/gamification/rules.py`, `app/gamification/service.py`
- Modify: `app/models_registry.py`, `app/main.py`, `tests/conftest.py`
- Create: `alembic/versions/<rev>_gamification_tables.py` (autogenerate)
- Test: `tests/test_gamification.py`

- [ ] **Step 1: Failing test** — `tests/test_gamification.py`:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.gamification.models import Badge
from app.gamification.rules import BADGES, activity_xp, graded_xp, round_half_up
from app.gamification.service import sync_badges


def test_xp_rounding_is_half_up() -> None:
    assert round_half_up(2.5) == 3
    assert round_half_up(2.4) == 2
    assert activity_xp(4, 5) == 18
    assert activity_xp(0, 3) == 10
    assert activity_xp(1, 4) == 13  # 10 * 0.25 = 2.5 -> 3
    assert graded_xp(1, 4) == 8  # 30 * 0.25 = 7.5 -> 8
    assert graded_xp(0, 10) == 0


async def test_sync_badges_is_idempotent(db: AsyncSession) -> None:
    await sync_badges(db)
    await sync_badges(db)
    badges = list(await db.scalars(select(Badge)))
    assert len(badges) == 10
    assert sorted(b.code for b in badges) == sorted(rule.code for rule in BADGES)


async def test_sync_badges_restores_titles(db: AsyncSession) -> None:
    badge = await db.scalar(select(Badge).where(Badge.code == "first_step"))
    assert badge is not None
    badge.title_uz = "Eski nom"
    await db.commit()
    await sync_badges(db)
    await db.refresh(badge)
    assert badge.title_uz == "Birinchi qadam"
    assert badge.icon == "👣"
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_gamification.py -q` → `ModuleNotFoundError: app.gamification`.

- [ ] **Step 3: `app/gamification/models.py`:**

```python
from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, utcnow


class XpEvent(IdMixin, CreatedAtMixin, Base):
    """Bitta XP hodisasi. Unique cheklov bir hodisa uchun XP ikki marta berilishini oldini oladi."""

    __tablename__ = "xp_events"
    __table_args__ = (UniqueConstraint("user_id", "reason", "ref_type", "ref_id"),)

    user_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(40))
    ref_type: Mapped[str] = mapped_column(String(20))
    ref_id: Mapped[int] = mapped_column(BigIntPK)


class Streak(Base):
    """Kunlik seriya. Sana Toshkent vaqti bo'yicha saqlanadi."""

    __tablename__ = "streaks"

    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    current: Mapped[int] = mapped_column(Integer, default=0)
    longest: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date)


class Badge(IdMixin, Base):
    __tablename__ = "badges"

    code: Mapped[str] = mapped_column(String(40), unique=True)
    icon: Mapped[str] = mapped_column(String(16))
    title_uz: Mapped[str] = mapped_column(String(100))
    title_ru: Mapped[str] = mapped_column(String(100))
    description_uz: Mapped[str] = mapped_column(String(300))
    description_ru: Mapped[str] = mapped_column(String(300))


class UserBadge(IdMixin, Base):
    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id"),)

    user_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("users.id", ondelete="CASCADE"))
    badge_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("badges.id", ondelete="CASCADE"), index=True
    )
    awarded_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow)
```

- [ ] **Step 4: `app/gamification/rules.py`:**

```python
"""Gamifikatsiya qoidalari: XP qiymatlari va nishonlar. Qiymatni o'zgartirish — kod o'zgarishi."""

import math
from dataclasses import dataclass
from enum import StrEnum


class XpReason(StrEnum):
    step_completed = "step_completed"
    activity_completed = "activity_completed"
    activity_perfect = "activity_perfect"
    task_submitted = "task_submitted"
    task_graded = "task_graded"
    topic_completed = "topic_completed"


STEP_COMPLETED_XP = 10
ACTIVITY_BASE_XP = 10
ACTIVITY_SCORE_XP = 10
ACTIVITY_PERFECT_XP = 10
TASK_SUBMITTED_XP = 20
TASK_GRADED_MAX_XP = 30
TOPIC_COMPLETED_XP = 50


def round_half_up(value: float) -> int:
    """Yarmi yuqoriga yaxlitlash (Python'ning `round()`i 2.5 ni 2 ga yaxlitlaydi)."""
    return math.floor(value + 0.5)


def activity_xp(score: int, max_score: int) -> int:
    return ACTIVITY_BASE_XP + round_half_up(ACTIVITY_SCORE_XP * score / max_score)


def graded_xp(score: int, max_score: int) -> int:
    return round_half_up(TASK_GRADED_MAX_XP * score / max_score)


@dataclass(frozen=True)
class BadgeRule:
    code: str
    icon: str
    title_uz: str
    title_ru: str
    description_uz: str
    description_ru: str
    threshold: int
    # Shu sabablar bo'yicha XP hodisalari soni olinadi; bo'sh bo'lsa — joriy seriya.
    reasons: tuple[XpReason, ...] = ()


_FIRST_STEP = (XpReason.step_completed, XpReason.activity_completed, XpReason.task_submitted)
_TOPIC = (XpReason.topic_completed,)
_PERFECT = (XpReason.activity_perfect,)
_TASK = (XpReason.task_submitted,)
_STREAK: tuple[XpReason, ...] = ()

# fmt: off
BADGES: tuple[BadgeRule, ...] = (
    BadgeRule("first_step", "👣", "Birinchi qadam", "Первый шаг",
              "Birinchi o'quv harakatingizni bajardingiz",
              "Вы выполнили первое учебное действие", 1, _FIRST_STEP),
    BadgeRule("first_topic", "🎯", "Mavzu yakunlandi", "Тема пройдена",
              "Birinchi mavzuni to'liq tugatdingiz", "Вы полностью прошли первую тему",
              1, _TOPIC),
    BadgeRule("topics_5", "📚", "Bilim yo'lida", "На пути знаний",
              "5 ta mavzuni tugatdingiz", "Вы прошли 5 тем", 5, _TOPIC),
    BadgeRule("topics_20", "🎓", "Bilimdon", "Знаток",
              "20 ta mavzuni tugatdingiz", "Вы прошли 20 тем", 20, _TOPIC),
    BadgeRule("perfect_1", "⭐", "A'lochi", "Отличник",
              "Faoliyatni birinchi marta 100% bajardingiz",
              "Вы впервые выполнили задание на 100%", 1, _PERFECT),
    BadgeRule("perfect_10", "🌟", "Mukammal", "Безупречно",
              "10 ta faoliyatni 100% bajardingiz", "Вы выполнили 10 заданий на 100%",
              10, _PERFECT),
    BadgeRule("first_task", "✍️", "Ijodkor", "Творец",
              "Birinchi vazifani yubordingiz", "Вы отправили первое задание", 1, _TASK),
    BadgeRule("streak_3", "🔥", "3 kunlik seriya", "Серия 3 дня",
              "3 kun ketma-ket o'qidingiz", "Вы занимались 3 дня подряд", 3, _STREAK),
    BadgeRule("streak_7", "🔥", "Bir haftalik seriya", "Серия неделя",
              "7 kun ketma-ket o'qidingiz", "Вы занимались 7 дней подряд", 7, _STREAK),
    BadgeRule("streak_30", "🔥", "Bir oylik seriya", "Серия месяц",
              "30 kun ketma-ket o'qidingiz", "Вы занимались 30 дней подряд", 30, _STREAK),
)
# fmt: on
```

- [ ] **Step 5: `app/gamification/service.py` (hozircha faqat sinxronizatsiya):**

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.gamification.models import Badge
from app.gamification.rules import BADGES


async def sync_badges(db: AsyncSession) -> None:
    """Kodda ta'riflangan nishonlarni bazaga yozadi (qo'shadi yoki yangilaydi). Idempotent;
    ro'yxatda yo'q nishonlar o'chirilmaydi."""
    existing = {badge.code: badge for badge in await db.scalars(select(Badge))}
    for rule in BADGES:
        badge = existing.get(rule.code)
        if badge is None:
            badge = Badge(code=rule.code)
            db.add(badge)
        badge.icon = rule.icon
        badge.title_uz = rule.title_uz
        badge.title_ru = rule.title_ru
        badge.description_uz = rule.description_uz
        badge.description_ru = rule.description_ru
    await db.commit()
```

- [ ] **Step 6: Ro'yxatga olish va ishga tushirish:**
  - `app/models_registry.py` ga `import app.gamification.models  # noqa: F401` qatorini qo'shish.
  - `app/main.py` ga `from app.gamification.service import sync_badges` import'ini qo'shish va `_lifespan` dagi `yield` dan oldin quyidagini yozish:

```python
    async with app.state.sessionmaker() as session:
        await sync_badges(session)
```

  - `tests/conftest.py` dagi `app` fixture'ida `create_all` blokidan keyin quyidagini qo'shish (`from app.gamification.service import sync_badges` import'i bilan):

```python
    async with application.state.sessionmaker() as session:
        await sync_badges(session)
```

- [ ] **Step 7: Migratsiya:**

```bash
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "gamification tables"
```

Natija: `alembic/versions/` da yangi fayl paydo bo'ladi. Unda `xp_events`, `streaks`, `badges` va `user_badges` jadvallari uchun `op.create_table` bo'lishi kerak. Faylni ochib tekshirish: `drop_table` / `drop_column` yoki boshqa jadvalga tegadigan o'zgarish bo'lmasligi kerak.

- [ ] **Step 8: Testlar:** `uv run pytest tests/test_gamification.py tests/test_migrations.py -q` → PASS. So'ng to'liq tekshiruv (ruff, mypy, pytest).
- [ ] **Step 9: Commit:** `feat(gamification): models, XP rules and badge definitions` + CHANGELOG + hash commit.

---

### Task 2: `award()` — XP, seriya va nishonlar

**Files:**
- Create: `app/gamification/schemas.py`
- Modify: `app/gamification/service.py`
- Test: `tests/test_gamification.py`

- [ ] **Step 1: Failing testlar** — `tests/test_gamification.py` ga qo'shiladi (import'lar fayl boshiga):

```python
from datetime import UTC, datetime, timedelta

from app.gamification.models import Streak, XpEvent
from app.gamification.rules import XpReason
from app.gamification.service import award, xp_total
from tests.factories import make_user

NOON = datetime(2026, 10, 11, 7, 0, tzinfo=UTC)  # Toshkentda 12:00


async def test_award_writes_each_event_once(db: AsyncSession) -> None:
    user = await make_user(db)
    kwargs = {"ref_type": "activity", "ref_id": 1, "amount": 18, "now": NOON}
    first = await award(db, user.id, XpReason.activity_completed, **kwargs)
    second = await award(db, user.id, XpReason.activity_completed, **kwargs)
    await db.commit()
    assert first.xp == 18
    assert second.xp == 0 and second.new_badges == []
    assert await xp_total(db, user.id) == 18
    rows = list(await db.scalars(select(XpEvent).where(XpEvent.user_id == user.id)))
    assert len(rows) == 1


async def test_first_step_badge_is_awarded_once(db: AsyncSession) -> None:
    user = await make_user(db)
    first = await award(
        db, user.id, XpReason.step_completed, ref_type="step", ref_id=5, amount=10, now=NOON
    )
    again = await award(
        db, user.id, XpReason.step_completed, ref_type="step", ref_id=6, amount=10, now=NOON
    )
    assert [b.code for b in first.new_badges] == ["first_step"]
    assert again.new_badges == []


async def test_streak_grows_on_consecutive_days_and_awards_badge(db: AsyncSession) -> None:
    user = await make_user(db)
    rewards = []
    for day in range(3):
        rewards.append(
            await award(
                db, user.id, XpReason.step_completed, ref_type="step", ref_id=day + 1,
                amount=10, now=NOON + timedelta(days=day),
            )
        )
    await db.commit()
    streak = await db.get(Streak, user.id)
    assert streak is not None
    assert (streak.current, streak.longest) == (3, 3)
    assert [b.code for b in rewards[2].new_badges] == ["streak_3"]


async def test_streak_uses_tashkent_day_boundary(db: AsyncSession) -> None:
    user = await make_user(db)
    late = datetime(2026, 10, 11, 18, 59, tzinfo=UTC)  # Toshkentda 23:59
    await award(db, user.id, XpReason.step_completed, ref_type="step", ref_id=1, amount=10, now=late)
    await award(
        db, user.id, XpReason.step_completed, ref_type="step", ref_id=2, amount=10,
        now=late + timedelta(minutes=1),  # Toshkentda ertasi kun 00:00
    )
    streak = await db.get(Streak, user.id)
    assert streak is not None and streak.current == 2


async def test_streak_same_day_unchanged_and_resets_after_gap(db: AsyncSession) -> None:
    user = await make_user(db)
    moments = [NOON, NOON + timedelta(hours=3), NOON + timedelta(days=1), NOON + timedelta(days=4)]
    for index, moment in enumerate(moments, start=1):
        await award(
            db, user.id, XpReason.step_completed, ref_type="step", ref_id=index, amount=10,
            now=moment,
        )
    streak = await db.get(Streak, user.id)
    assert streak is not None
    assert (streak.current, streak.longest) == (1, 2)


async def test_zero_xp_event_does_not_touch_streak(db: AsyncSession) -> None:
    user = await make_user(db)
    rewards = await award(
        db, user.id, XpReason.task_graded, ref_type="submission", ref_id=1, amount=0, now=NOON
    )
    assert rewards.xp == 0
    assert await db.get(Streak, user.id) is None


async def test_topic_badges_follow_completed_topics(db: AsyncSession) -> None:
    user = await make_user(db)
    codes: list[str] = []
    for topic_id in range(1, 6):
        rewards = await award(
            db, user.id, XpReason.topic_completed, ref_type="topic", ref_id=topic_id,
            amount=50, now=NOON,
        )
        codes += [b.code for b in rewards.new_badges]
    assert codes == ["first_topic", "topics_5"]
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_gamification.py -q` → `ImportError: cannot import name 'award'`.

- [ ] **Step 3: `app/gamification/schemas.py`:**

```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BadgeBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    icon: str
    title_uz: str
    title_ru: str


class RewardsOut(BaseModel):
    xp: int = 0
    new_badges: list[BadgeBrief] = []


class BadgeOut(BadgeBrief):
    description_uz: str
    description_ru: str
    awarded_at: datetime | None


class StreakOut(BaseModel):
    current: int
    longest: int
    active_today: bool


class ProfileOut(BaseModel):
    xp_total: int
    streak: StreakOut
    badges: list[BadgeOut]
```

- [ ] **Step 4: `app/gamification/service.py` ni to'liq shu ko'rinishga keltirish:**

```python
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.types import utcnow
from app.gamification.models import Badge, Streak, UserBadge, XpEvent
from app.gamification.rules import BADGES, XpReason
from app.gamification.schemas import BadgeBrief, RewardsOut

# O'zbekistonda 1992 yildan beri yozgi vaqt yo'q: doimiy UTC+5.
TASHKENT = timezone(timedelta(hours=5), "Asia/Tashkent")


@dataclass
class Rewards:
    xp: int = 0
    new_badges: list[Badge] = field(default_factory=list)

    def __add__(self, other: "Rewards") -> "Rewards":
        return Rewards(self.xp + other.xp, [*self.new_badges, *other.new_badges])


def rewards_out(rewards: Rewards) -> RewardsOut:
    return RewardsOut(
        xp=rewards.xp, new_badges=[BadgeBrief.model_validate(b) for b in rewards.new_badges]
    )


def local_date(moment: datetime) -> date:
    return moment.astimezone(TASHKENT).date()


async def sync_badges(db: AsyncSession) -> None:
    """Kodda ta'riflangan nishonlarni bazaga yozadi (qo'shadi yoki yangilaydi). Idempotent;
    ro'yxatda yo'q nishonlar o'chirilmaydi."""
    existing = {badge.code: badge for badge in await db.scalars(select(Badge))}
    for rule in BADGES:
        badge = existing.get(rule.code)
        if badge is None:
            badge = Badge(code=rule.code)
            db.add(badge)
        badge.icon = rule.icon
        badge.title_uz = rule.title_uz
        badge.title_ru = rule.title_ru
        badge.description_uz = rule.description_uz
        badge.description_ru = rule.description_ru
    await db.commit()


async def award(
    db: AsyncSession,
    user_id: int,
    reason: XpReason,
    *,
    ref_type: str,
    ref_id: int,
    amount: int,
    now: datetime | None = None,
) -> Rewards:
    """XP hodisasini yozadi, seriyani yangilaydi va nishonlarni tekshiradi. Hodisa avval
    yozilgan bo'lsa (unique cheklov), hech narsa o'zgarmaydi. Commit qilmaydi."""
    moment = now or utcnow()
    event = XpEvent(
        user_id=user_id,
        amount=amount,
        reason=reason.value,
        ref_type=ref_type,
        ref_id=ref_id,
        created_at=moment,
    )
    try:
        async with db.begin_nested():
            db.add(event)
            await db.flush()
    except IntegrityError:
        return Rewards()
    if amount > 0:
        await _touch_streak(db, user_id, local_date(moment))
    return Rewards(xp=amount, new_badges=await _award_badges(db, user_id, moment))


async def _touch_streak(db: AsyncSession, user_id: int, today: date) -> None:
    streak = await db.get(Streak, user_id)
    if streak is None:
        candidate = Streak(user_id=user_id, current=0, longest=0)
        try:
            async with db.begin_nested():
                db.add(candidate)
                await db.flush()
            streak = candidate
        except IntegrityError:
            streak = await db.get(Streak, user_id)
            if streak is None:
                raise
    if streak.last_active_date == today:
        return
    if streak.last_active_date == today - timedelta(days=1):
        streak.current += 1
    else:
        streak.current = 1
    streak.longest = max(streak.longest, streak.current)
    streak.last_active_date = today
    await db.flush()


async def _award_badges(db: AsyncSession, user_id: int, moment: datetime) -> list[Badge]:
    owned = set(await db.scalars(select(UserBadge.badge_id).where(UserBadge.user_id == user_id)))
    badges = {badge.code: badge for badge in await db.scalars(select(Badge))}
    counts: dict[str, int] = {
        row.reason: int(row.n)
        for row in await db.execute(
            select(XpEvent.reason, func.count().label("n"))
            .where(XpEvent.user_id == user_id)
            .group_by(XpEvent.reason)
        )
    }
    streak = await db.get(Streak, user_id)
    current_streak = streak.current if streak is not None else 0
    new: list[Badge] = []
    for rule in BADGES:
        badge = badges.get(rule.code)
        if badge is None or badge.id in owned:
            continue
        if rule.reasons:
            value = sum(counts.get(reason.value, 0) for reason in rule.reasons)
        else:
            value = current_streak
        if value < rule.threshold:
            continue
        try:
            async with db.begin_nested():
                db.add(UserBadge(user_id=user_id, badge_id=badge.id, awarded_at=moment))
                await db.flush()
        except IntegrityError:
            continue
        new.append(badge)
    return new


async def xp_total(db: AsyncSession, user_id: int) -> int:
    total = await db.scalar(
        select(func.coalesce(func.sum(XpEvent.amount), 0)).where(XpEvent.user_id == user_id)
    )
    return int(total or 0)
```

- [ ] **Step 5: Testlar:** `uv run pytest tests/test_gamification.py -q` → PASS. So'ng to'liq tekshiruv.
- [ ] **Step 6: Commit:** `feat(gamification): award XP with streaks and badges` + CHANGELOG + hash commit.

### Task 3: Krossvord algoritmi (sof funksiyalar)

**Files:**
- Create: `app/assessment/__init__.py` (bo'sh), `app/assessment/crossword.py`
- Test: `tests/test_crossword.py`

- [ ] **Step 1: Failing test** — `tests/test_crossword.py`:

```python
import pytest

from app.assessment.crossword import (
    InvalidWordError,
    Layout,
    UnplaceableError,
    build_layout,
    layout_to_json,
    normalize_word,
    word_matches,
)

SYNTHETIC = [list("ABCDEFGHI"), list("PAQ"), list("RCS"), list("TEU"), list("VGW")]


def _cells(layout: Layout) -> dict[tuple[int, int], str]:
    cells: dict[tuple[int, int], str] = {}
    for word in layout.words:
        dr, dc = (0, 1) if word.direction == "across" else (1, 0)
        for k, char in enumerate(word.cells):
            pos = (word.row + dr * k, word.col + dc * k)
            assert 0 <= pos[0] < layout.rows and 0 <= pos[1] < layout.cols
            assert cells.setdefault(pos, char) == char
    return cells


def _runs(cells: dict[tuple[int, int], str]) -> list[str]:
    """To'rdagi uzunligi 2+ bo'lgan barcha uzluksiz harf qatorlari."""
    runs = []
    for row, col in cells:
        for dr, dc in ((0, 1), (1, 0)):
            if (row - dr, col - dc) in cells:
                continue
            run, k = [], 0
            while (row + dr * k, col + dc * k) in cells:
                run.append(cells[(row + dr * k, col + dc * k)])
                k += 1
            if len(run) > 1:
                runs.append("".join(run))
    return sorted(runs)


def test_normalize_uppercases_and_merges_o_and_g_apostrophes() -> None:
    assert normalize_word(" o'quvchi ") == ["Oʻ", "Q", "U", "V", "C", "H", "I"]
    assert normalize_word("Gʻisht") == ["Gʻ", "I", "S", "H", "T"]
    assert normalize_word("toʼg‘ri") == ["T", "Oʻ", "Gʻ", "R", "I"]
    assert normalize_word("мактаб") == ["М", "А", "К", "Т", "А", "Б"]


@pytest.mark.parametrize("raw", ["", "   ", "ab1", "ko'k-ko'l", "a'b", "ikki so'z"])
def test_normalize_rejects_non_letters(raw: str) -> None:
    with pytest.raises(InvalidWordError):
        normalize_word(raw)


def test_two_word_layout_is_exact() -> None:
    layout = build_layout([list("ABCD"), list("XBY")])
    assert (layout.rows, layout.cols) == (3, 4)
    assert [(w.number, w.direction, w.row, w.col, "".join(w.cells)) for w in layout.words] == [
        (1, "down", 0, 1, "XBY"),
        (2, "across", 1, 0, "ABCD"),
    ]


def test_synthetic_layout_is_exact_and_valid() -> None:
    layout = build_layout(SYNTHETIC)
    assert (layout.rows, layout.cols) == (3, 9)
    assert [(w.number, w.direction, w.row, w.col, w.index) for w in layout.words] == [
        (1, "down", 0, 0, 1),
        (2, "down", 0, 2, 2),
        (3, "down", 0, 4, 3),
        (4, "down", 0, 6, 4),
        (5, "across", 1, 0, 0),
    ]
    assert _runs(_cells(layout)) == sorted("".join(w) for w in SYNTHETIC)


def test_layout_is_deterministic() -> None:
    assert build_layout(SYNTHETIC) == build_layout([list(w) for w in SYNTHETIC])


def test_unplaceable_words_are_reported_by_input_index() -> None:
    with pytest.raises(UnplaceableError) as exc:
        build_layout([list("ABC"), list("DEF"), list("ABX")])
    assert exc.value.indexes == [1]


def test_layout_to_json_maps_word_ids_by_input_index() -> None:
    data = layout_to_json(build_layout([list("ABCD"), list("XBY")]), [70, 71])
    assert data["rows"] == 3 and data["cols"] == 4
    assert [(w["word_id"], w["number"], w["length"], w["cells"]) for w in data["words"]] == [
        (71, 1, 3, ["X", "B", "Y"]),
        (70, 2, 4, ["A", "B", "C", "D"]),
    ]


def test_word_matches_normalizes_answer() -> None:
    cells = normalize_word("O'QUVCHI")
    assert word_matches("o‘quvchi", cells)
    assert not word_matches("oquvchi", cells)
    assert not word_matches("", cells)
    assert not word_matches("abc1", cells)
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_crossword.py -q` → `ModuleNotFoundError`.

- [ ] **Step 3: `app/assessment/crossword.py`:**

```python
"""Krossvord: so'zlarni normallashtirish va to'rni deterministik "ochko'z" algoritm bilan qurish.

Bazaga bog'liq emas, faqat sof funksiyalar."""

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Literal

Direction = Literal["across", "down"]
ACROSS: Direction = "across"
DOWN: Direction = "down"

APOSTROPHES = "'ʻʼ’‘`"
MODIFIER = "ʻ"
DIGRAPH_BASES = ("O", "G")
MIN_CELLS = 2
MAX_CELLS = 20

Pos = tuple[int, int]


class InvalidWordError(ValueError):
    def __init__(self, word: str) -> None:
        super().__init__(word)
        self.word = word


class UnplaceableError(ValueError):
    def __init__(self, indexes: list[int]) -> None:
        super().__init__(indexes)
        self.indexes = indexes


def normalize_word(raw: str) -> list[str]:
    """So'zni kataklar ro'yxatiga aylantiradi: katta harf, Oʻ va Gʻ bitta katak."""
    text = raw.strip().upper()
    for mark in APOSTROPHES:
        text = text.replace(mark, MODIFIER)
    cells: list[str] = []
    for char in text:
        # MODIFIER (U+02BB) `isalpha()` uchun harf hisoblanadi, shuning uchun avval tekshiriladi.
        if char == MODIFIER:
            if cells and cells[-1] in DIGRAPH_BASES:
                cells[-1] += MODIFIER
                continue
            raise InvalidWordError(raw)
        if not char.isalpha():
            raise InvalidWordError(raw)
        cells.append(char)
    if not cells:
        raise InvalidWordError(raw)
    return cells


def word_matches(answer: str, cells: Sequence[str]) -> bool:
    try:
        return normalize_word(answer) == list(cells)
    except InvalidWordError:
        return False


@dataclass(frozen=True)
class PlacedWord:
    index: int  # kiritilgan ro'yxatdagi o'rni
    number: int
    row: int
    col: int
    direction: Direction
    cells: tuple[str, ...]


@dataclass(frozen=True)
class Layout:
    rows: int
    cols: int
    words: tuple[PlacedWord, ...]  # raqam bo'yicha, teng bo'lsa avval gorizontal


def _step(direction: Direction) -> Pos:
    return (0, 1) if direction == ACROSS else (1, 0)


def _direction_rank(direction: Direction) -> int:
    return 0 if direction == ACROSS else 1


class _Grid:
    def __init__(self) -> None:
        self.letters: dict[Pos, str] = {}
        self.dirs: dict[Pos, set[Direction]] = {}

    def put(self, cells: Sequence[str], row: int, col: int, direction: Direction) -> None:
        dr, dc = _step(direction)
        for k, char in enumerate(cells):
            pos = (row + dr * k, col + dc * k)
            self.letters[pos] = char
            self.dirs.setdefault(pos, set()).add(direction)

    def crossings(self, cells: Sequence[str], row: int, col: int, direction: Direction) -> int | None:
        """Joy yaroqli bo'lsa kesishmalar sonini, aks holda None qaytaradi."""
        dr, dc = _step(direction)
        size = len(cells)
        if (row - dr, col - dc) in self.letters or (row + dr * size, col + dc * size) in self.letters:
            return None
        count = 0
        for k, char in enumerate(cells):
            r, c = row + dr * k, col + dc * k
            existing = self.letters.get((r, c))
            if existing is not None:
                if existing != char or direction in self.dirs[(r, c)]:
                    return None
                count += 1
            elif (r + dc, c + dr) in self.letters or (r - dc, c - dr) in self.letters:
                return None
        return count or None

    def area_with(self, cells: Sequence[str], row: int, col: int, direction: Direction) -> int:
        dr, dc = _step(direction)
        last = (row + dr * (len(cells) - 1), col + dc * (len(cells) - 1))
        rows = [r for r, _ in self.letters] + [row, last[0]]
        cols = [c for _, c in self.letters] + [col, last[1]]
        return (max(rows) - min(rows) + 1) * (max(cols) - min(cols) + 1)


def _candidates(
    placed: Sequence[tuple[int, int, Direction, Sequence[str]]], cells: Sequence[str]
) -> set[tuple[int, int, Direction]]:
    result: set[tuple[int, int, Direction]] = set()
    for p_row, p_col, p_dir, p_cells in placed:
        dr, dc = _step(p_dir)
        new_dir: Direction = DOWN if p_dir == ACROSS else ACROSS
        ndr, ndc = _step(new_dir)
        for i, letter in enumerate(p_cells):
            r, c = p_row + dr * i, p_col + dc * i
            for j, char in enumerate(cells):
                if char == letter:
                    result.add((r - ndr * j, c - ndc * j, new_dir))
    return result


def build_layout(words: Sequence[Sequence[str]]) -> Layout:
    """`words` — normallashtirilgan so'zlar (kataklar ro'yxati). Joylashmagan so'zlar bo'lsa,
    `UnplaceableError` ularning kiritilgan tartibdagi indekslari bilan ko'tariladi."""
    if not words:
        raise ValueError("so'zlar ro'yxati bo'sh")
    order = sorted(range(len(words)), key=lambda i: (-len(words[i]), i))
    grid = _Grid()
    placed: dict[int, tuple[int, int, Direction]] = {}
    unplaced: list[int] = []

    first = order[0]
    grid.put(words[first], 0, 0, ACROSS)
    placed[first] = (0, 0, ACROSS)
    for index in order[1:]:
        cells = words[index]
        snapshot = [(r, c, d, words[i]) for i, (r, c, d) in placed.items()]
        best: tuple[tuple[int, int, int, int, int], tuple[int, int, Direction]] | None = None
        for row, col, direction in _candidates(snapshot, cells):
            count = grid.crossings(cells, row, col, direction)
            if count is None:
                continue
            key = (
                -count,
                grid.area_with(cells, row, col, direction),
                row,
                col,
                _direction_rank(direction),
            )
            if best is None or key < best[0]:
                best = (key, (row, col, direction))
        if best is None:
            unplaced.append(index)
            continue
        row, col, direction = best[1]
        grid.put(cells, row, col, direction)
        placed[index] = (row, col, direction)
    if unplaced:
        raise UnplaceableError(sorted(unplaced))

    min_row = min(r for r, _ in grid.letters)
    min_col = min(c for _, c in grid.letters)
    max_row = max(r for r, _ in grid.letters)
    max_col = max(c for _, c in grid.letters)
    starts = sorted({(r - min_row, c - min_col) for r, c, _ in placed.values()})
    numbers = {start: number for number, start in enumerate(starts, start=1)}
    result = [
        PlacedWord(
            index=index,
            number=numbers[(r - min_row, c - min_col)],
            row=r - min_row,
            col=c - min_col,
            direction=d,
            cells=tuple(words[index]),
        )
        for index, (r, c, d) in placed.items()
    ]
    result.sort(key=lambda w: (w.number, _direction_rank(w.direction)))
    return Layout(rows=max_row - min_row + 1, cols=max_col - min_col + 1, words=tuple(result))


def layout_to_json(layout: Layout, word_ids: Sequence[int]) -> dict[str, Any]:
    """Serverda saqlanadigan ko'rinish. `word_ids[i]` — kiritilgan tartibdagi i-so'zning ID'si."""
    return {
        "rows": layout.rows,
        "cols": layout.cols,
        "words": [
            {
                "word_id": word_ids[word.index],
                "number": word.number,
                "row": word.row,
                "col": word.col,
                "direction": word.direction,
                "length": len(word.cells),
                "cells": list(word.cells),
            }
            for word in layout.words
        ],
    }
```

- [ ] **Step 4: Testlar:** `uv run pytest tests/test_crossword.py -q` → PASS. `ruff format` uzun qatorlarni (masalan `crossings` imzosi) o'zi bo'ladi. So'ng to'liq tekshiruv.
- [ ] **Step 5: Commit:** `feat(assessment): deterministic crossword layout` + CHANGELOG + hash commit.

---

### Task 4: Baholash modellari, umumiy fayl yordamchilari va migratsiya

**Files:**
- Create: `app/core/files.py`, `app/assessment/models.py`
- Modify: `app/learning/materials.py`, `app/core/config.py`, `backend/.env.example`, `app/models_registry.py`
- Create: `alembic/versions/<rev>_assessment_tables.py` (autogenerate)
- Test: `tests/test_files.py`

- [ ] **Step 1: Failing test** — `tests/test_files.py`:

```python
from pathlib import Path

import pytest

from app.core.files import signature_matches


@pytest.mark.parametrize(
    ("ext", "header", "ok"),
    [
        (".png", b"\x89PNG\r\n\x1a\n" + b"0" * 8, True),
        (".jpg", b"\xff\xd8\xff\xe0" + b"0" * 8, True),
        (".jpeg", b"\xff\xd8\xff\xdb" + b"0" * 8, True),
        (".pdf", b"%PDF-1.7" + b"0" * 8, True),
        (".png", b"%PDF-1.7" + b"0" * 8, False),
        (".docx", b"MZ\x90\x00" + b"0" * 8, False),
    ],
)
def test_signature_matches(tmp_path: Path, ext: str, header: bytes, ok: bool) -> None:
    path = tmp_path / f"file{ext}"
    path.write_bytes(header)
    assert signature_matches(path, ext) is ok
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_files.py -q` → `ModuleNotFoundError: app.core.files`.

- [ ] **Step 3: `app/core/files.py`:**

```python
"""Yuklangan fayllar uchun umumiy yordamchilar: haqiqiy formatni tekshirish va faylni berish."""

import mimetypes
from pathlib import Path

from fastapi import Response
from fastapi.responses import FileResponse

from app.core.config import Settings
from app.core.storage import Storage

# Kengaytma mos kelsa ham, fayl mazmuni boshqa formatda bo'lishi mumkin (masalan
# nomi o'zgartirilgan .exe). Har bir ruxsat etilgan kengaytma uchun "magic bytes"
# orqali haqiqiy formatni tekshiramiz.
FILE_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    ".pdf": (b"%PDF-",),
    ".pptx": (b"PK\x03\x04",),
    ".docx": (b"PK\x03\x04",),
    ".ppt": (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",),
    ".doc": (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",),
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
}


def signature_matches(path: Path, ext: str) -> bool:
    signatures = FILE_SIGNATURES.get(ext)
    if not signatures:
        return True
    with path.open("rb") as fh:
        header = fh.read(8)
    return any(header.startswith(signature) for signature in signatures)


def file_response(settings: Settings, storage: Storage, rel: str, filename: str) -> Response:
    """Himoyalangan faylni beradi: prod'da nginx orqali (X-Accel-Redirect), lokal muhitda to'g'ridan-to'g'ri."""
    media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    if settings.media_accel_redirect:
        return Response(
            media_type=media_type, headers={"X-Accel-Redirect": f"/protected-media/{rel}"}
        )
    return FileResponse(storage.path(rel), media_type=media_type, filename=filename)
```

- [ ] **Step 4: `app/learning/materials.py`:**
  - `FILE_SIGNATURES` lug'ati va `_signature_matches` funksiyasi (izohi bilan) o'chiriladi;
  - `from app.core.files import signature_matches` import'i qo'shiladi;
  - `add_material` ichida `_signature_matches(` → `signature_matches(`;
  - endi ishlatilmaydigan import (`Path`) qolgan bo'lsa, `ruff check` ko'rsatadi.

- [ ] **Step 5: Sozlama.** `app/core/config.py` da `max_material_mb: int = 50` qatoridan keyin `max_submission_mb: int = 20` qo'shiladi. `backend/.env.example` oxiriga `MAX_SUBMISSION_MB=20` qatori qo'shiladi.

- [ ] **Step 6: `app/assessment/models.py`:**

```python
from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import JSON, Boolean, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, CreatedAtMixin, IdMixin
from app.core.types import BigIntPK, UTCDateTime, str_enum, utcnow
from app.learning.models import StepKind


class ActivityType(StrEnum):
    quiz = "quiz"
    yesno = "yesno"
    crossword = "crossword"


class TaskType(StrEnum):
    text = "text"
    file = "file"
    both = "both"


class SubmissionStatus(StrEnum):
    submitted = "submitted"
    graded = "graded"
    returned = "returned"


ACTIVITY_STEP_KINDS = frozenset({StepKind.review, StepKind.practice})


class Activity(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "activities"

    step_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[ActivityType] = mapped_column(str_enum(ActivityType))
    title: Mapped[str] = mapped_column(String(200))
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    # Faqat krossvordda: server qurgan to'r (crossword.layout_to_json).
    layout: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class QuizQuestion(IdMixin, Base):
    __tablename__ = "quiz_questions"

    activity_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("activities.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text)
    options: Mapped[list[str]] = mapped_column(JSON)
    correct_index: Mapped[int] = mapped_column(Integer)
    explanation: Mapped[str | None] = mapped_column(Text)


class YesNoItem(IdMixin, Base):
    __tablename__ = "yesno_items"

    activity_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("activities.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    statement: Mapped[str] = mapped_column(Text)
    answer: Mapped[bool] = mapped_column(Boolean)
    explanation: Mapped[str | None] = mapped_column(Text)


class CrosswordWord(IdMixin, Base):
    __tablename__ = "crossword_words"

    activity_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("activities.id", ondelete="CASCADE"), index=True
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    word: Mapped[str] = mapped_column(String(80))  # normallashtirilgan (crossword.normalize_word)
    clue: Mapped[str] = mapped_column(String(300))


class Attempt(IdMixin, CreatedAtMixin, Base):
    """Bitta urinish. `result` — har element bo'yicha natija nusxasi, shuning uchun faoliyat
    keyin tahrirlansa ham eski urinish to'g'ri ko'rinadi."""

    __tablename__ = "attempts"
    __table_args__ = (Index("ix_attempts_user_id_activity_id", "user_id", "activity_id"),)

    activity_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("activities.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("users.id", ondelete="CASCADE"))
    score: Mapped[int] = mapped_column(Integer)
    max_score: Mapped[int] = mapped_column(Integer)
    result: Mapped[list[dict[str, Any]]] = mapped_column(JSON)


class Task(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "tasks"

    step_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("steps.id", ondelete="CASCADE"), unique=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    type: Mapped[TaskType] = mapped_column(str_enum(TaskType))
    max_score: Mapped[int] = mapped_column(Integer)
    rubric: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[datetime | None] = mapped_column(UTCDateTime)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=utcnow, onupdate=utcnow)


class Submission(IdMixin, CreatedAtMixin, Base):
    __tablename__ = "submissions"
    __table_args__ = (UniqueConstraint("task_id", "user_id"),)

    task_id: Mapped[int] = mapped_column(BigIntPK, ForeignKey("tasks.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    text: Mapped[str | None] = mapped_column(Text)
    file: Mapped[str | None] = mapped_column(String(500))
    original_name: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[SubmissionStatus] = mapped_column(
        str_enum(SubmissionStatus), default=SubmissionStatus.submitted, index=True
    )
    score: Mapped[int | None] = mapped_column(Integer)
    feedback: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(UTCDateTime)
    graded_by: Mapped[int | None] = mapped_column(
        BigIntPK, ForeignKey("users.id", ondelete="SET NULL")
    )
    graded_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
```

  `app/models_registry.py` ga `import app.assessment.models  # noqa: F401` qo'shiladi.

- [ ] **Step 7: Migratsiya:**

```bash
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "assessment tables"
```

Natija: `activities`, `quiz_questions`, `yesno_items`, `crossword_words`, `attempts`, `tasks` va `submissions` uchun `create_table` va indekslar. Faylda boshqa jadvallarga o'zgarish bo'lmasligi tekshiriladi.

- [ ] **Step 8: Testlar:** `uv run pytest tests/test_files.py tests/test_materials.py tests/test_migrations.py -q` → PASS. So'ng to'liq tekshiruv.
- [ ] **Step 9: Commit:** `feat(assessment): models, shared file signatures and migration` + CHANGELOG + hash commit.

### Task 5: O'qituvchi — faoliyatlar API

**Files:**
- Create: `app/assessment/view_schemas.py`, `app/assessment/schemas.py`, `app/assessment/items.py`, `app/assessment/activities.py`, `app/assessment/teach_router.py`
- Modify: `app/api.py`, `tests/factories.py`
- Test: `tests/test_teach_activities.py`

- [ ] **Step 1: Test yordamchilari** — `tests/factories.py` oxiriga qo'shiladi (`from typing import Any` import'i bilan):

```python
CROSSWORD_WORDS = [
    ("ABCDEFGHI", "Alifbo boshi"),
    ("PAQ", "Birinchi so'z"),
    ("RCS", "Ikkinchi so'z"),
    ("TEU", "Uchinchi so'z"),
]


def quiz_payload(title: str = "Takrorlash testi", count: int = 2) -> dict[str, Any]:
    """`count` ta savol; i-savolning to'g'ri javobi `i % 4`."""
    return {
        "type": "quiz",
        "title": title,
        "items": [
            {
                "text": f"{i + 1}-savol",
                "options": ["A", "B", "C", "D"],
                "correct_index": i % 4,
                "explanation": f"{i + 1}-izoh",
            }
            for i in range(count)
        ],
    }


def yesno_payload(title: str = "Ha yoki yo'q") -> dict[str, Any]:
    return {
        "type": "yesno",
        "title": title,
        "items": [
            {"statement": "Yer dumaloq", "answer": True},
            {"statement": "Quyosh sovuq", "answer": False, "explanation": "Issiq"},
        ],
    }


def crossword_payload(title: str = "Krossvord") -> dict[str, Any]:
    return {
        "type": "crossword",
        "title": title,
        "items": [{"word": word, "clue": clue} for word, clue in CROSSWORD_WORDS],
    }


async def add_activity(
    client: AsyncClient,
    headers: dict[str, str],
    step_id: int,
    payload: dict[str, Any],
    *,
    publish: bool = True,
) -> dict[str, Any]:
    response = await client.post(
        f"/api/teach/steps/{step_id}/activities", headers=headers, json=payload
    )
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    if publish:
        published = await client.patch(
            f"/api/teach/activities/{body['id']}", headers=headers, json={"is_published": True}
        )
        assert published.status_code == 200, published.text
        body = published.json()
    return body
```

- [ ] **Step 2: Failing test** — `tests/test_teach_activities.py`:

```python
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.learning.models import StepKind
from tests.factories import (
    add_activity,
    auth_headers,
    build_course,
    crossword_payload,
    make_user,
    quiz_payload,
    step_of,
    yesno_payload,
)


async def test_teacher_creates_quiz_on_review_step(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    body = await add_activity(client, course.teacher_headers, review.id, quiz_payload(), publish=False)
    assert body["type"] == "quiz"
    assert body["is_published"] is False
    assert body["order"] == 1
    assert body["layout"] is None
    assert [item["correct_index"] for item in body["items"]] == [0, 1]
    assert body["items"][0]["explanation"] == "1-izoh"

    listed = await client.get(
        f"/api/teach/steps/{review.id}/activities", headers=course.teacher_headers
    )
    assert [a["id"] for a in listed.json()] == [body["id"]]


async def test_activity_only_on_review_or_practice(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    response = await client.post(
        f"/api/teach/steps/{lecture.id}/activities",
        headers=course.teacher_headers,
        json=quiz_payload(),
    )
    assert response.status_code == 400
    assert response.json()["code"] == "ACTIVITY_WRONG_STEP"


async def test_only_assigned_staff_can_edit(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    stranger = await make_user(db, email="begona@mail.uz", role=Role.teacher)
    url = f"/api/teach/steps/{review.id}/activities"
    denied = await client.post(url, headers=auth_headers(stranger, settings), json=quiz_payload())
    assert denied.status_code == 403
    assert denied.json()["code"] == "NOT_SUBJECT_TEACHER"
    student = await client.post(url, headers=course.student_headers, json=quiz_payload())
    assert student.status_code == 403
    assert student.json()["code"] == "FORBIDDEN"


async def test_quiz_needs_exactly_four_options(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    payload = quiz_payload()
    payload["items"][0]["options"] = ["A", "B", "C"]
    response = await client.post(
        f"/api/teach/steps/{review.id}/activities", headers=course.teacher_headers, json=payload
    )
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_crossword_layout_is_built_on_save(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    practice = await step_of(db, course.topic1, StepKind.practice)
    body = await add_activity(client, course.teacher_headers, practice.id, crossword_payload())
    layout = body["layout"]
    assert (layout["rows"], layout["cols"]) == (3, 9)
    words_by_id = {item["id"]: item["word"] for item in body["items"]}
    assert [("".join(w["cells"]), w["number"], w["direction"]) for w in layout["words"]] == [
        ("PAQ", 1, "down"),
        ("RCS", 2, "down"),
        ("TEU", 3, "down"),
        ("ABCDEFGHI", 4, "across"),
    ]
    assert all(words_by_id[w["word_id"]] == "".join(w["cells"]) for w in layout["words"])


async def test_crossword_word_errors(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    practice = await step_of(db, course.topic1, StepKind.practice)
    url = f"/api/teach/steps/{practice.id}/activities"

    def payload(words: list[str]) -> dict[str, object]:
        return {
            "type": "crossword",
            "title": "K",
            "items": [{"word": w, "clue": "Savol"} for w in words],
        }

    invalid = await client.post(url, headers=course.teacher_headers, json=payload(["ab1", "abc", "abd"]))
    assert invalid.status_code == 422
    assert invalid.json()["code"] == "CROSSWORD_INVALID_WORD"
    assert invalid.json()["details"]["word"] == "ab1"

    unplaceable = await client.post(url, headers=course.teacher_headers, json=payload(["ABC", "DEF", "ABX"]))
    assert unplaceable.status_code == 422
    assert unplaceable.json()["code"] == "CROSSWORD_UNPLACEABLE"
    assert unplaceable.json()["details"]["words"] == ["DEF"]

    duplicate = await client.post(url, headers=course.teacher_headers, json=payload(["abc", "ABC", "cab"]))
    assert duplicate.status_code == 422
    assert duplicate.json()["code"] == "ACTIVITY_INVALID_ITEMS"

    too_short = await client.post(url, headers=course.teacher_headers, json=payload(["a", "ab", "ba"]))
    assert too_short.status_code == 422
    assert too_short.json()["code"] == "ACTIVITY_INVALID_ITEMS"


async def test_put_replaces_items_and_keeps_type(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    body = await add_activity(client, course.teacher_headers, review.id, quiz_payload(count=2))
    url = f"/api/teach/activities/{body['id']}"

    updated = await client.put(
        url, headers=course.teacher_headers, json=quiz_payload(title="Yangi", count=1)
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Yangi"
    assert len(updated.json()["items"]) == 1
    assert updated.json()["is_published"] is True

    wrong_type = await client.put(url, headers=course.teacher_headers, json=yesno_payload())
    assert wrong_type.status_code == 422
    assert wrong_type.json()["code"] == "ACTIVITY_INVALID_ITEMS"


async def test_publish_reorder_and_delete(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    first = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    second = await add_activity(client, course.teacher_headers, review.id, yesno_payload())
    assert second["order"] == 2

    order_url = f"/api/teach/steps/{review.id}/activities/order"
    reordered = await client.put(
        order_url, headers=course.teacher_headers, json={"ids": [second["id"], first["id"]]}
    )
    assert reordered.status_code == 200
    assert [(a["id"], a["order"]) for a in reordered.json()] == [
        (second["id"], 1),
        (first["id"], 2),
    ]
    bad = await client.put(order_url, headers=course.teacher_headers, json={"ids": [first["id"]]})
    assert bad.status_code == 400
    assert bad.json()["code"] == "INVALID_ORDER"

    hidden = await client.patch(
        f"/api/teach/activities/{first['id']}",
        headers=course.teacher_headers,
        json={"is_published": False},
    )
    assert hidden.json()["is_published"] is False

    deleted = await client.delete(
        f"/api/teach/activities/{first['id']}", headers=course.teacher_headers
    )
    assert deleted.status_code == 204
    missing = await client.delete(
        f"/api/teach/activities/{first['id']}", headers=course.teacher_headers
    )
    assert missing.status_code == 404
    assert missing.json()["code"] == "ACTIVITY_NOT_FOUND"
```

- [ ] **Step 3: Yiqilishini tekshirish:** `uv run pytest tests/test_teach_activities.py -q` → 404 (yo'llar yo'q).

- [ ] **Step 4: `app/assessment/view_schemas.py` (Task 6 da kengaytiriladi):**

```python
"""Talabaga ko'rinadigan sxemalar. Bu yerda to'g'ri javob maydonlari hech qachon bo'lmaydi.

`learning.student_schemas` shu modulni import qiladi, shuning uchun bu modul `learning`
sxemalarini import qilmaydi."""

from typing import Literal

from pydantic import BaseModel


class LayoutWord(BaseModel):
    number: int
    row: int
    col: int
    direction: Literal["across", "down"]
    length: int
```

- [ ] **Step 5: `app/assessment/schemas.py`:**

```python
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.assessment.models import ActivityType
from app.assessment.view_schemas import LayoutWord
from app.core.types import DbId, trimmed_str


class QuizItemIn(BaseModel):
    text: trimmed_str(max_length=1000)  # type: ignore[valid-type]
    options: list[trimmed_str(max_length=300)] = Field(min_length=4, max_length=4)  # type: ignore[valid-type]
    correct_index: int = Field(ge=0, le=3)
    explanation: str | None = Field(default=None, max_length=2000)


class YesNoItemIn(BaseModel):
    statement: trimmed_str(max_length=1000)  # type: ignore[valid-type]
    answer: bool
    explanation: str | None = Field(default=None, max_length=2000)


class CrosswordItemIn(BaseModel):
    word: trimmed_str(max_length=60)  # type: ignore[valid-type]
    clue: trimmed_str(max_length=300)  # type: ignore[valid-type]


class QuizActivityIn(BaseModel):
    type: Literal["quiz"]
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    items: list[QuizItemIn] = Field(min_length=1, max_length=50)


class YesNoActivityIn(BaseModel):
    type: Literal["yesno"]
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    items: list[YesNoItemIn] = Field(min_length=1, max_length=50)


class CrosswordActivityIn(BaseModel):
    type: Literal["crossword"]
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    items: list[CrosswordItemIn] = Field(min_length=3, max_length=20)


# Router'da `Body(discriminator="type")` bilan ishlatiladi.
ActivityIn = QuizActivityIn | YesNoActivityIn | CrosswordActivityIn


class ActivityPublishIn(BaseModel):
    is_published: bool


class ActivityOrderIn(BaseModel):
    ids: list[DbId] = Field(max_length=100)


class QuizItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    options: list[str]
    correct_index: int
    explanation: str | None


class YesNoItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    statement: str
    answer: bool
    explanation: str | None


class CrosswordItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    word: str
    clue: str


class TeachLayoutWord(LayoutWord):
    word_id: int
    cells: list[str]


class TeachLayout(BaseModel):
    rows: int
    cols: int
    words: list[TeachLayoutWord]


class ActivityTeachOut(BaseModel):
    id: int
    step_id: int
    type: ActivityType
    title: str
    order: int
    is_published: bool
    items: list[QuizItemOut | YesNoItemOut | CrosswordItemOut]
    layout: TeachLayout | None
```

- [ ] **Step 6: `app/assessment/items.py`:**

```python
"""Faoliyat elementlarini (savollar, bayonotlar, so'zlar) yuklash."""

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import Activity, ActivityType, CrosswordWord, QuizQuestion, YesNoItem

ActivityItem = QuizQuestion | YesNoItem | CrosswordWord


async def _load[ItemT: (QuizQuestion, YesNoItem, CrosswordWord)](
    db: AsyncSession, model: type[ItemT], activity_ids: list[int]
) -> list[ItemT]:
    if not activity_ids:
        return []
    return list(
        await db.scalars(
            select(model)
            .where(model.activity_id.in_(activity_ids))
            .order_by(model.activity_id, model.order, model.id)
        )
    )


async def load_items(
    db: AsyncSession, activities: Sequence[Activity]
) -> dict[int, list[ActivityItem]]:
    """Har faoliyat uchun elementlar ro'yxati (tartib bo'yicha)."""
    result: dict[int, list[ActivityItem]] = {activity.id: [] for activity in activities}

    def ids_of(activity_type: ActivityType) -> list[int]:
        return [a.id for a in activities if a.type == activity_type]

    for question in await _load(db, QuizQuestion, ids_of(ActivityType.quiz)):
        result[question.activity_id].append(question)
    for statement in await _load(db, YesNoItem, ids_of(ActivityType.yesno)):
        result[statement.activity_id].append(statement)
    for word in await _load(db, CrosswordWord, ids_of(ActivityType.crossword)):
        result[word.activity_id].append(word)
    return result
```

- [ ] **Step 7: `app/assessment/activities.py`:**

```python
from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment import crossword
from app.assessment.items import ActivityItem, load_items
from app.assessment.models import (
    ACTIVITY_STEP_KINDS,
    Activity,
    ActivityType,
    CrosswordWord,
    QuizQuestion,
    YesNoItem,
)
from app.assessment.schemas import (
    ActivityIn,
    ActivityTeachOut,
    CrosswordActivityIn,
    CrosswordItemIn,
    CrosswordItemOut,
    QuizActivityIn,
    QuizItemOut,
    TeachLayout,
    YesNoActivityIn,
    YesNoItemOut,
)
from app.auth.models import User
from app.core.errors import AppError
from app.learning import editing
from app.learning.models import Step

PreparedCrossword = tuple[list[list[str]], crossword.Layout]


def _optional(text: str | None) -> str | None:
    if text is None:
        return None
    return text.strip() or None


async def activity_step(db: AsyncSession, user: User, step_id: int) -> Step:
    step, _topic = await editing.ensure_can_edit_step(db, user, step_id)
    if step.kind not in ACTIVITY_STEP_KINDS:
        raise AppError(
            400,
            "ACTIVITY_WRONG_STEP",
            "Faoliyat faqat takrorlash yoki amaliyot bosqichiga qo'shiladi",
        )
    return step


async def ensure_can_edit_activity(db: AsyncSession, user: User, activity_id: int) -> Activity:
    activity = await db.get(Activity, activity_id)
    if activity is None:
        raise AppError(404, "ACTIVITY_NOT_FOUND", "Faoliyat topilmadi")
    await editing.ensure_can_edit_step(db, user, activity.step_id)
    return activity


def _prepare_crossword(items: list[CrosswordItemIn]) -> PreparedCrossword:
    cells_list: list[list[str]] = []
    for item in items:
        try:
            cells = crossword.normalize_word(item.word)
        except crossword.InvalidWordError:
            raise AppError(
                422,
                "CROSSWORD_INVALID_WORD",
                "So'zda faqat harflar bo'lishi mumkin",
                {"word": item.word},
            ) from None
        if not crossword.MIN_CELLS <= len(cells) <= crossword.MAX_CELLS:
            raise AppError(
                422,
                "ACTIVITY_INVALID_ITEMS",
                "So'z uzunligi 2 dan 20 harfgacha bo'lishi kerak",
                {"word": item.word},
            )
        cells_list.append(cells)
    joined = ["".join(cells) for cells in cells_list]
    if len(set(joined)) != len(joined):
        raise AppError(
            422, "ACTIVITY_INVALID_ITEMS", "So'zlar takrorlanmasligi kerak", {"reason": "duplicate"}
        )
    try:
        layout = crossword.build_layout(cells_list)
    except crossword.UnplaceableError as exc:
        raise AppError(
            422,
            "CROSSWORD_UNPLACEABLE",
            "Ba'zi so'zlarni krossvordga joylab bo'lmadi",
            {"words": [items[i].word for i in exc.indexes]},
        ) from None
    return cells_list, layout


def _prepare(data: ActivityIn) -> PreparedCrossword | None:
    return _prepare_crossword(data.items) if isinstance(data, CrosswordActivityIn) else None


async def _write_items(
    db: AsyncSession, activity: Activity, data: ActivityIn, prepared: PreparedCrossword | None
) -> None:
    activity.layout = None
    if isinstance(data, QuizActivityIn):
        db.add_all(
            [
                QuizQuestion(
                    activity_id=activity.id,
                    order=index,
                    text=item.text,
                    options=list(item.options),
                    correct_index=item.correct_index,
                    explanation=_optional(item.explanation),
                )
                for index, item in enumerate(data.items)
            ]
        )
    elif isinstance(data, YesNoActivityIn):
        db.add_all(
            [
                YesNoItem(
                    activity_id=activity.id,
                    order=index,
                    statement=item.statement,
                    answer=item.answer,
                    explanation=_optional(item.explanation),
                )
                for index, item in enumerate(data.items)
            ]
        )
    else:
        assert prepared is not None
        cells_list, layout = prepared
        words = [
            CrosswordWord(activity_id=activity.id, order=index, word="".join(cells), clue=item.clue)
            for index, (item, cells) in enumerate(zip(data.items, cells_list, strict=True))
        ]
        db.add_all(words)
        await db.flush()
        activity.layout = crossword.layout_to_json(layout, [word.id for word in words])


async def list_step_activities(db: AsyncSession, step_id: int) -> list[Activity]:
    return list(
        await db.scalars(
            select(Activity).where(Activity.step_id == step_id).order_by(Activity.order, Activity.id)
        )
    )


async def create_activity(db: AsyncSession, step: Step, data: ActivityIn) -> Activity:
    prepared = _prepare(data)
    current = await db.scalar(select(func.max(Activity.order)).where(Activity.step_id == step.id))
    activity = Activity(
        step_id=step.id,
        type=ActivityType(data.type),
        title=data.title,
        order=(current or 0) + 1,
        is_published=False,
    )
    db.add(activity)
    await db.flush()
    await _write_items(db, activity, data, prepared)
    await db.commit()
    return activity


async def update_activity(db: AsyncSession, activity: Activity, data: ActivityIn) -> Activity:
    if data.type != activity.type:
        raise AppError(
            422,
            "ACTIVITY_INVALID_ITEMS",
            "Faoliyat turini o'zgartirib bo'lmaydi",
            {"reason": "type_mismatch"},
        )
    prepared = _prepare(data)
    await db.execute(delete(QuizQuestion).where(QuizQuestion.activity_id == activity.id))
    await db.execute(delete(YesNoItem).where(YesNoItem.activity_id == activity.id))
    await db.execute(delete(CrosswordWord).where(CrosswordWord.activity_id == activity.id))
    activity.title = data.title
    await _write_items(db, activity, data, prepared)
    await db.commit()
    return activity


async def set_published(db: AsyncSession, activity: Activity, published: bool) -> Activity:
    activity.is_published = published
    await db.commit()
    return activity


async def delete_activity(db: AsyncSession, activity: Activity) -> None:
    await db.delete(activity)
    await db.commit()


async def reorder_activities(db: AsyncSession, step_id: int, ids: list[int]) -> list[Activity]:
    existing = await list_step_activities(db, step_id)
    if len(set(ids)) != len(ids) or sorted(a.id for a in existing) != sorted(ids):
        raise AppError(
            400, "INVALID_ORDER", "Faoliyatlar ro'yxati bosqich faoliyatlariga mos emas"
        )
    by_id = {activity.id: activity for activity in existing}
    for position, activity_id in enumerate(ids, start=1):
        by_id[activity_id].order = position
    await db.commit()
    return [by_id[activity_id] for activity_id in ids]


def _item_out(item: ActivityItem) -> QuizItemOut | YesNoItemOut | CrosswordItemOut:
    if isinstance(item, QuizQuestion):
        return QuizItemOut.model_validate(item)
    if isinstance(item, YesNoItem):
        return YesNoItemOut.model_validate(item)
    return CrosswordItemOut.model_validate(item)


async def teach_out(db: AsyncSession, activities: Sequence[Activity]) -> list[ActivityTeachOut]:
    items = await load_items(db, activities)
    return [
        ActivityTeachOut(
            id=activity.id,
            step_id=activity.step_id,
            type=activity.type,
            title=activity.title,
            order=activity.order,
            is_published=activity.is_published,
            items=[_item_out(item) for item in items[activity.id]],
            layout=TeachLayout.model_validate(activity.layout) if activity.layout else None,
        )
        for activity in activities
    ]
```

- [ ] **Step 8: `app/assessment/teach_router.py`:**

```python
from typing import Annotated

from fastapi import APIRouter, Body, Response

from app.assessment import activities
from app.assessment.schemas import (
    ActivityIn,
    ActivityOrderIn,
    ActivityPublishIn,
    ActivityTeachOut,
)
from app.auth.deps import StaffUser
from app.core.deps import DbSession
from app.core.types import DbIdPath

router = APIRouter(prefix="/teach", tags=["teach"])

ActivityBody = Annotated[ActivityIn, Body(discriminator="type")]


@router.get("/steps/{step_id}/activities", response_model=list[ActivityTeachOut])
async def list_activities(
    step_id: DbIdPath, user: StaffUser, db: DbSession
) -> list[ActivityTeachOut]:
    step = await activities.activity_step(db, user, step_id)
    return await activities.teach_out(db, await activities.list_step_activities(db, step.id))


@router.post("/steps/{step_id}/activities", response_model=ActivityTeachOut, status_code=201)
async def create_activity(
    step_id: DbIdPath, data: ActivityBody, user: StaffUser, db: DbSession
) -> ActivityTeachOut:
    step = await activities.activity_step(db, user, step_id)
    activity = await activities.create_activity(db, step, data)
    return (await activities.teach_out(db, [activity]))[0]


@router.put("/steps/{step_id}/activities/order", response_model=list[ActivityTeachOut])
async def reorder_activities(
    step_id: DbIdPath, data: ActivityOrderIn, user: StaffUser, db: DbSession
) -> list[ActivityTeachOut]:
    step = await activities.activity_step(db, user, step_id)
    ordered = await activities.reorder_activities(db, step.id, data.ids)
    return await activities.teach_out(db, ordered)


@router.put("/activities/{activity_id}", response_model=ActivityTeachOut)
async def update_activity(
    activity_id: DbIdPath, data: ActivityBody, user: StaffUser, db: DbSession
) -> ActivityTeachOut:
    activity = await activities.ensure_can_edit_activity(db, user, activity_id)
    activity = await activities.update_activity(db, activity, data)
    return (await activities.teach_out(db, [activity]))[0]


@router.patch("/activities/{activity_id}", response_model=ActivityTeachOut)
async def publish_activity(
    activity_id: DbIdPath, data: ActivityPublishIn, user: StaffUser, db: DbSession
) -> ActivityTeachOut:
    activity = await activities.ensure_can_edit_activity(db, user, activity_id)
    activity = await activities.set_published(db, activity, data.is_published)
    return (await activities.teach_out(db, [activity]))[0]


@router.delete("/activities/{activity_id}", status_code=204)
async def delete_activity(activity_id: DbIdPath, user: StaffUser, db: DbSession) -> Response:
    activity = await activities.ensure_can_edit_activity(db, user, activity_id)
    await activities.delete_activity(db, activity)
    return Response(status_code=204)
```

  `app/api.py` ga quyidagilar qo'shiladi:

```python
from app.assessment.teach_router import router as assessment_teach_router
...
api_router.include_router(assessment_teach_router)
```

- [ ] **Step 9: Testlar:** `uv run pytest tests/test_teach_activities.py -q` → PASS. So'ng to'liq tekshiruv.
- [ ] **Step 10: Commit:** `feat(assessment): teacher activity editor API` + CHANGELOG + hash commit.

### Task 6: Talaba — bosqichdagi faoliyatlar (javobsiz) va kontent hisobi

**Files:**
- Modify: `app/assessment/view_schemas.py`, `app/learning/content.py`, `app/learning/student_schemas.py`, `app/learning/progress.py`
- Create: `app/assessment/views.py`
- Test: `tests/test_student_activities.py`

- [ ] **Step 1: Failing test** — `tests/test_student_activities.py`:

```python
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.learning.models import StepKind
from tests.factories import (
    add_activity,
    build_course,
    crossword_payload,
    quiz_payload,
    step_of,
    yesno_payload,
)

FORBIDDEN_KEYS = {"correct_index", "answer", "cells", "word", "word_id", "explanation"}


def _all_keys(value: object) -> set[str]:
    if isinstance(value, dict):
        return set(value) | set().union(*(_all_keys(v) for v in value.values()))
    if isinstance(value, list):
        return set().union(*(_all_keys(v) for v in value))
    return set()


async def test_published_activity_counts_as_step_content(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    draft = await add_activity(
        client, course.teacher_headers, review.id, quiz_payload(), publish=False
    )
    topic_url = f"/api/topics/{course.topic1.id}"
    before = (await client.get(topic_url, headers=course.student_headers)).json()
    assert before["progress"] == {"completed": 0, "total": 2}

    await client.patch(
        f"/api/teach/activities/{draft['id']}",
        headers=course.teacher_headers,
        json={"is_published": True},
    )
    after = (await client.get(topic_url, headers=course.student_headers)).json()
    assert after["progress"] == {"completed": 0, "total": 3}
    review_brief = next(s for s in after["steps"] if s["kind"] == "review")
    assert review_brief["has_content"] is True


async def test_step_content_shows_published_activities_without_answers(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    practice = await step_of(db, course.topic1, StepKind.practice)
    await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    await add_activity(client, course.teacher_headers, review.id, yesno_payload())
    await add_activity(
        client, course.teacher_headers, review.id, quiz_payload(title="Qoralama"), publish=False
    )
    await add_activity(client, course.teacher_headers, practice.id, crossword_payload())

    review_body = (
        await client.get(f"/api/steps/{review.id}", headers=course.student_headers)
    ).json()
    assert [a["type"] for a in review_body["activities"]] == ["quiz", "yesno"]
    quiz = review_body["activities"][0]
    assert quiz["items"][0] == {"text": "1-savol", "options": ["A", "B", "C", "D"]}
    assert (quiz["best_percent"], quiz["attempts_count"], quiz["layout"]) == (None, 0, None)
    assert review_body["activities"][1]["items"][1] == {"statement": "Quyosh sovuq"}
    assert review_body["task"] is None and review_body["submission"] is None

    practice_body = (
        await client.get(f"/api/steps/{practice.id}", headers=course.student_headers)
    ).json()
    crossword = practice_body["activities"][0]
    assert crossword["items"] == []
    assert crossword["layout"]["rows"] == 3 and crossword["layout"]["cols"] == 9
    assert [
        (w["number"], w["direction"], w["length"], w["clue"])
        for w in crossword["layout"]["words"]
    ] == [
        (1, "down", 3, "Birinchi so'z"),
        (2, "down", 3, "Ikkinchi so'z"),
        (3, "down", 3, "Uchinchi so'z"),
        (4, "across", 9, "Alifbo boshi"),
    ]

    for body in (review_body, practice_body):
        assert not (_all_keys(body) & FORBIDDEN_KEYS)


async def test_other_steps_have_empty_assessment_fields(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic1, StepKind.lecture)
    body = (await client.get(f"/api/steps/{lecture.id}", headers=course.student_headers)).json()
    assert (body["activities"], body["task"], body["submission"]) == ([], None, None)
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_student_activities.py -q` → `KeyError: 'activities'` va progress jami 2 bo'lib qoladi.

- [ ] **Step 3: `app/assessment/view_schemas.py` ni to'liq shu ko'rinishga keltirish:**

```python
"""Talabaga ko'rinadigan sxemalar. Bu yerda to'g'ri javob maydonlari hech qachon bo'lmaydi.

`learning.student_schemas` shu modulni import qiladi, shuning uchun bu modul `learning`
sxemalarini import qilmaydi."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.assessment.models import ActivityType, SubmissionStatus, TaskType


class LayoutWord(BaseModel):
    number: int
    row: int
    col: int
    direction: Literal["across", "down"]
    length: int


class StudentLayoutWord(LayoutWord):
    clue: str


class StudentLayout(BaseModel):
    rows: int
    cols: int
    words: list[StudentLayoutWord]


class QuizItemView(BaseModel):
    text: str
    options: list[str]


class YesNoItemView(BaseModel):
    statement: str


class ActivityView(BaseModel):
    id: int
    type: ActivityType
    title: str
    items: list[QuizItemView | YesNoItemView]
    layout: StudentLayout | None
    best_percent: float | None
    attempts_count: int


class TaskView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    type: TaskType
    max_score: int
    rubric: str | None
    deadline: datetime | None


class SubmissionView(BaseModel):
    id: int
    status: SubmissionStatus
    text: str | None
    original_name: str | None
    file_url: str | None
    score: int | None
    feedback: str | None
    submitted_at: datetime
    graded_at: datetime | None
    is_late: bool
```

- [ ] **Step 4: `app/assessment/views.py`:**

```python
"""Talaba uchun bosqich ko'rinishi: faoliyatlar (to'g'ri javobsiz), vazifa va talabaning javobi."""

from collections.abc import Sequence
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.items import load_items
from app.assessment.models import (
    Activity,
    ActivityType,
    Attempt,
    QuizQuestion,
    Submission,
    Task,
    YesNoItem,
)
from app.assessment.view_schemas import (
    ActivityView,
    QuizItemView,
    StudentLayout,
    StudentLayoutWord,
    SubmissionView,
    TaskView,
    YesNoItemView,
)

# Urinish foizi (0–100). Ikkala bazada ham haqiqiy son bo'lib hisoblanadi.
ATTEMPT_PERCENT = Attempt.score * 100.0 / Attempt.max_score


def is_late(submitted_at: datetime, deadline: datetime | None) -> bool:
    return deadline is not None and submitted_at > deadline


async def attempt_stats(
    db: AsyncSession, user_id: int, activity_ids: Sequence[int]
) -> dict[int, tuple[float, int]]:
    """Faoliyat bo'yicha (eng yaxshi foiz, urinishlar soni)."""
    if not activity_ids:
        return {}
    rows = await db.execute(
        select(
            Attempt.activity_id,
            func.max(ATTEMPT_PERCENT).label("best"),
            func.count().label("n"),
        )
        .where(Attempt.user_id == user_id, Attempt.activity_id.in_(activity_ids))
        .group_by(Attempt.activity_id)
    )
    return {row.activity_id: (round(float(row.best), 2), int(row.n)) for row in rows}


def student_layout(layout: dict[str, Any], clues: dict[int, str]) -> StudentLayout:
    return StudentLayout(
        rows=layout["rows"],
        cols=layout["cols"],
        words=[
            StudentLayoutWord(
                number=word["number"],
                row=word["row"],
                col=word["col"],
                direction=word["direction"],
                length=word["length"],
                clue=clues[word["word_id"]],
            )
            for word in layout["words"]
        ],
    )


async def activity_views(db: AsyncSession, user_id: int, step_id: int) -> list[ActivityView]:
    activities = list(
        await db.scalars(
            select(Activity)
            .where(Activity.step_id == step_id, Activity.is_published.is_(True))
            .order_by(Activity.order, Activity.id)
        )
    )
    if not activities:
        return []
    stats = await attempt_stats(db, user_id, [a.id for a in activities])
    items = await load_items(db, activities)
    views: list[ActivityView] = []
    for activity in activities:
        best, count = stats.get(activity.id, (None, 0))
        item_views: list[QuizItemView | YesNoItemView] = []
        clues: dict[int, str] = {}
        for item in items[activity.id]:
            if isinstance(item, QuizQuestion):
                item_views.append(QuizItemView(text=item.text, options=list(item.options)))
            elif isinstance(item, YesNoItem):
                item_views.append(YesNoItemView(statement=item.statement))
            else:
                clues[item.id] = item.clue
        layout = (
            student_layout(activity.layout, clues)
            if activity.type == ActivityType.crossword and activity.layout
            else None
        )
        views.append(
            ActivityView(
                id=activity.id,
                type=activity.type,
                title=activity.title,
                items=item_views,
                layout=layout,
                best_percent=best,
                attempts_count=count,
            )
        )
    return views


def submission_view(submission: Submission, task: Task) -> SubmissionView:
    return SubmissionView(
        id=submission.id,
        status=submission.status,
        text=submission.text,
        original_name=submission.original_name,
        file_url=f"/api/submissions/{submission.id}/file" if submission.file else None,
        score=submission.score,
        feedback=submission.feedback,
        submitted_at=submission.submitted_at,
        graded_at=submission.graded_at,
        is_late=is_late(submission.submitted_at, task.deadline),
    )


async def task_view(
    db: AsyncSession, user_id: int, step_id: int
) -> tuple[TaskView | None, SubmissionView | None]:
    task = await db.scalar(select(Task).where(Task.step_id == step_id))
    if task is None:
        return None, None
    submission = await db.scalar(
        select(Submission).where(Submission.task_id == task.id, Submission.user_id == user_id)
    )
    return (
        TaskView.model_validate(task),
        submission_view(submission, task) if submission is not None else None,
    )
```

- [ ] **Step 5: `app/learning/content.py`.** Import'larga `from app.assessment.models import ACTIVITY_STEP_KINDS, Activity, Task` qo'shiladi. `load_step_infos` ichida `literature_topics` dan keyin ikkita so'rov qo'shiladi:

```python
    activity_steps = set(
        await db.scalars(
            select(Activity.step_id)
            .where(Activity.step_id.in_(step_ids), Activity.is_published.is_(True))
            .distinct()
        )
    )
    task_steps = set(await db.scalars(select(Task.step_id).where(Task.step_id.in_(step_ids))))
```

  Sikldagi oxirgi `else` bloki (eski izoh bilan) quyidagiga almashtiriladi:

```python
        elif kind in ACTIVITY_STEP_KINDS:
            has_content = row.id in activity_steps
        else:  # StepKind.task
            has_content = row.id in task_steps
```

- [ ] **Step 6: `app/learning/student_schemas.py`.** `from app.assessment.view_schemas import ActivityView, SubmissionView, TaskView` import'i qo'shiladi. `StepContentOut` ga uchta maydon qo'shiladi:

```python
    activities: list[ActivityView] = []
    task: TaskView | None = None
    submission: SubmissionView | None = None
```

- [ ] **Step 7: `app/learning/progress.py`.**
  - Import'larga `from app.assessment import views` va `from app.assessment.models import ACTIVITY_STEP_KINDS` qo'shiladi.
  - `step_content` ichida `literature = ...` dan keyin quyidagi qo'shiladi:

```python
    activities = (
        await views.activity_views(db, user.id, step.id)
        if step.kind in ACTIVITY_STEP_KINDS
        else []
    )
    task, submission = (
        await views.task_view(db, user.id, step.id)
        if step.kind == StepKind.task
        else (None, None)
    )
```

  - `StepContentOut(...)` chaqiruviga `activities=activities, task=task, submission=submission` qo'shiladi.

- [ ] **Step 8: Testlar:** `uv run pytest tests/test_student_activities.py tests/test_student_learning.py tests/test_resume.py -q` → PASS. So'ng to'liq tekshiruv.
- [ ] **Step 9: Commit:** `feat(assessment): student step view with activities, answers hidden` + CHANGELOG + hash commit.

### Task 7: Urinishlar, bosqichni tugatish va XP

**Files:**
- Modify: `app/assessment/schemas.py`, `app/learning/progress.py`, `app/learning/student_schemas.py`, `app/learning/router.py`, `app/api.py`, `tests/test_student_learning.py` (faqat docstring)
- Create: `app/assessment/attempts.py`, `app/assessment/router.py`
- Test: `tests/test_attempts.py`

- [ ] **Step 1: Failing test** — `tests/test_attempts.py`:

```python
from typing import Any

from httpx import AsyncClient, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.learning.models import ProgressStatus, StepKind, StepProgress
from tests.factories import (
    add_activity,
    build_course,
    crossword_payload,
    quiz_payload,
    step_of,
    yesno_payload,
)


async def _attempt(
    client: AsyncClient, headers: dict[str, str], activity_id: int, answers: list[Any]
) -> Response:
    return await client.post(
        f"/api/activities/{activity_id}/attempts", headers=headers, json={"answers": answers}
    )


async def _progress(db: AsyncSession, user_id: int, step_id: int) -> StepProgress:
    row = await db.scalar(
        select(StepProgress).where(StepProgress.user_id == user_id, StepProgress.step_id == step_id)
    )
    assert row is not None
    return row


async def test_quiz_attempt_is_graded_with_full_review(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())

    response = await _attempt(client, course.student_headers, quiz["id"], [0, 2])
    assert response.status_code == 201, response.text
    body = response.json()
    assert (body["score"], body["max_score"]) == (1, 2)
    first, second = body["result"]
    assert first == {
        "prompt": "1-savol",
        "options": ["A", "B", "C", "D"],
        "given": 0,
        "correct": 0,
        "is_correct": True,
        "explanation": "1-izoh",
    }
    assert (second["given"], second["correct"], second["is_correct"]) == (2, 1, False)
    assert body["rewards"]["xp"] == 15
    assert [b["code"] for b in body["rewards"]["new_badges"]] == ["first_step"]
    assert body["step"]["status"] == "completed"  # bosqichda bitta faoliyat


async def test_retake_gives_no_xp_but_improves_best_score(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())

    first = (await _attempt(client, course.student_headers, quiz["id"], [0, 2])).json()
    second = (await _attempt(client, course.student_headers, quiz["id"], [0, 1])).json()
    third = (await _attempt(client, course.student_headers, quiz["id"], [0, 1])).json()
    assert [first["rewards"]["xp"], second["rewards"]["xp"], third["rewards"]["xp"]] == [15, 10, 0]
    assert [b["code"] for b in second["rewards"]["new_badges"]] == ["perfect_1"]

    row = await _progress(db, course.student.id, review.id)
    assert row.best_score == 100.0
    content = (await client.get(f"/api/steps/{review.id}", headers=course.student_headers)).json()
    assert (content["activities"][0]["best_percent"], content["activities"][0]["attempts_count"]) == (
        100.0,
        3,
    )


async def test_step_completes_when_every_activity_is_attempted(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    yesno = await add_activity(client, course.teacher_headers, review.id, yesno_payload())

    after_quiz = (await _attempt(client, course.student_headers, quiz["id"], [0, 1])).json()
    assert after_quiz["step"]["status"] == "in_progress"
    after_yesno = (await _attempt(client, course.student_headers, yesno["id"], [True, True])).json()
    assert (after_yesno["score"], after_yesno["max_score"]) == (1, 2)
    assert after_yesno["step"]["status"] == "completed"

    row = await _progress(db, course.student.id, review.id)
    assert row.status == ProgressStatus.completed
    assert row.best_score == 75.0


async def test_invalid_answers_are_rejected(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    for answers in ([0], [0, 1, 2], [True, 0], [0, 4], ["A", 0]):
        response = await _attempt(client, course.student_headers, quiz["id"], answers)
        assert response.status_code == 422, answers
        assert response.json()["code"] == "ATTEMPT_INVALID_ANSWERS"


async def test_hidden_activities_are_not_found(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    draft = await add_activity(
        client, course.teacher_headers, review.id, quiz_payload(), publish=False
    )
    hidden_review = await step_of(db, course.hidden_topic, StepKind.review)
    hidden = await add_activity(client, course.teacher_headers, hidden_review.id, quiz_payload())
    for activity_id in (draft["id"], hidden["id"], 999_999):
        response = await _attempt(client, course.student_headers, activity_id, [0, 1])
        assert response.status_code == 404
        assert response.json()["code"] == "ACTIVITY_NOT_FOUND"


async def test_crossword_attempt_normalizes_answers(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    practice = await step_of(db, course.topic1, StepKind.practice)
    crossword = await add_activity(client, course.teacher_headers, practice.id, crossword_payload())

    partial = (
        await _attempt(client, course.student_headers, crossword["id"], ["paq", "", None, "x"])
    ).json()
    assert (partial["score"], partial["max_score"]) == (1, 4)
    assert partial["result"][0]["prompt"] == "Birinchi so'z"
    assert partial["result"][3]["correct"] == "ABCDEFGHI"

    full = (
        await _attempt(
            client, course.student_headers, crossword["id"], ["paq", "Rcs", "TEU", "abcdefghi"]
        )
    ).json()
    assert (full["score"], full["max_score"]) == (4, 4)
    assert full["rewards"]["xp"] == 10  # faqat 100% bonusi; activity_completed avval berilgan


async def test_completing_last_step_awards_topic_xp(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic2, StepKind.lecture)  # topic2: yagona kontentli bosqich
    url = f"/api/steps/{lecture.id}/complete"
    first = (await client.post(url, headers=course.student_headers)).json()
    assert first["status"] == "completed"
    assert first["rewards"]["xp"] == 60
    assert [b["code"] for b in first["rewards"]["new_badges"]] == ["first_step", "first_topic"]
    again = (await client.post(url, headers=course.student_headers)).json()
    assert again["rewards"] == {"xp": 0, "new_badges": []}
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_attempts.py -q` → 404 va `KeyError: 'rewards'`.

- [ ] **Step 3: `app/assessment/schemas.py` ga qo'shiladi.**

Import'lar fayl boshiga:

```python
from typing import Annotated

from pydantic import StringConstraints

from app.gamification.schemas import RewardsOut
from app.learning.student_schemas import StepBrief
```

Fayl oxiriga:

```python
AnswerText = Annotated[str, StringConstraints(max_length=100)]


class AttemptIn(BaseModel):
    """Javoblar talabaga yuborilgan elementlar tartibida: test — 0..3, ha/yo'q — bool,
    krossvord — so'z satri; javobsiz element — null."""

    answers: list[int | bool | AnswerText | None] = Field(max_length=50)


class ResultItem(BaseModel):
    prompt: str
    options: list[str] | None = None
    given: int | bool | str | None
    correct: int | bool | str
    is_correct: bool
    explanation: str | None = None


class AttemptOut(BaseModel):
    attempt_id: int
    activity_id: int
    score: int
    max_score: int
    result: list[ResultItem]
    rewards: RewardsOut
    step: StepBrief
```

- [ ] **Step 4: `app/learning/student_schemas.py`.** `from app.gamification.schemas import RewardsOut` import'i qo'shiladi va `StepBrief` dan keyin quyidagi klass yoziladi:

```python
class StepCompleteOut(StepBrief):
    rewards: RewardsOut
```

- [ ] **Step 5: `app/learning/progress.py`.**
  - `_get_or_create_progress` → `get_or_create_progress` (faylning barcha joylarida). `tests/test_student_learning.py` docstring'idagi nom ham yangilanadi.
  - Import'lar:

```python
from datetime import datetime

from app.gamification import rules
from app.gamification.rules import XpReason
from app.gamification.service import Rewards, award, rewards_out
```

  `student_schemas` import ro'yxatiga `StepCompleteOut` qo'shiladi.

  - Yangi funksiya (`get_or_create_progress` dan keyin):

```python
async def topic_completion_rewards(
    db: AsyncSession, user_id: int, topic_id: int, now: datetime
) -> Rewards:
    """Mavzuning kontenti bor barcha bosqichlari tugagan bo'lsa, `topic_completed` XP'sini beradi."""
    await db.flush()
    infos = (await load_step_infos(db, [topic_id]))[topic_id]
    status = await load_progress(db, user_id, [info.id for info in infos])
    done, total = count_progress(infos, status)
    if total == 0 or done < total:
        return Rewards()
    return await award(
        db,
        user_id,
        XpReason.topic_completed,
        ref_type="topic",
        ref_id=topic_id,
        amount=rules.TOPIC_COMPLETED_XP,
        now=now,
    )
```

  - `complete_step` ning `row = ...` qatoridan oxirigacha bo'lgan qismi almashtiriladi (funksiya imzosi `-> StepCompleteOut`):

```python
    now = utcnow()
    row = await get_or_create_progress(db, user.id, step.id)
    if row.status != ProgressStatus.completed:
        row.status = ProgressStatus.completed
        row.completed_at = now
    row.updated_at = now
    rewards = await award(
        db,
        user.id,
        XpReason.step_completed,
        ref_type="step",
        ref_id=step.id,
        amount=rules.STEP_COMPLETED_XP,
        now=now,
    )
    rewards += await topic_completion_rewards(db, user.id, topic.id, now)
    await db.commit()
    return StepCompleteOut(
        id=step.id,
        kind=step.kind,
        order=step.order,
        has_content=True,
        status=ProgressStatus.completed,
        rewards=rewards_out(rewards),
    )
```

- [ ] **Step 6: `app/learning/router.py`:** `complete_step` endpoint'i `response_model=StepCompleteOut` va `-> StepCompleteOut` bilan yangilanadi (import ham qo'shiladi).

- [ ] **Step 7: `app/assessment/attempts.py`:**

```python
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment import crossword
from app.assessment.items import ActivityItem, load_items
from app.assessment.models import (
    Activity,
    ActivityType,
    Attempt,
    CrosswordWord,
    QuizQuestion,
    YesNoItem,
)
from app.assessment.schemas import AttemptIn, AttemptOut, ResultItem
from app.assessment.views import ATTEMPT_PERCENT
from app.auth.models import User
from app.core.errors import AppError
from app.core.types import utcnow
from app.gamification import rules
from app.gamification.rules import XpReason
from app.gamification.service import Rewards, award, rewards_out
from app.learning import progress
from app.learning.models import ProgressStatus, Step, Topic
from app.learning.student_schemas import StepBrief

Answer = int | bool | str | None


def _invalid() -> AppError:
    return AppError(422, "ATTEMPT_INVALID_ANSWERS", "Javoblar faoliyat savollariga mos emas")


def _not_found() -> AppError:
    return AppError(404, "ACTIVITY_NOT_FOUND", "Faoliyat topilmadi")


async def get_attemptable_activity(
    db: AsyncSession, user: User, activity_id: int
) -> tuple[Activity, Step, Topic]:
    """Nashr qilingan, talabaga ko'rinadigan mavzudagi faoliyat. Aks holda 404 (borligi oshkor
    qilinmaydi)."""
    activity = await db.get(Activity, activity_id)
    if activity is None or not activity.is_published:
        raise _not_found()
    step = await db.get(Step, activity.step_id)
    if step is None:
        raise _not_found()
    try:
        topic, _subject = await progress.get_visible_topic(db, user, step.topic_id)
    except AppError:
        raise _not_found() from None
    return activity, step, topic


def _grade_crossword(
    activity: Activity, items: list[ActivityItem], answers: list[Answer]
) -> list[dict[str, Any]]:
    words = {item.id: item for item in items if isinstance(item, CrosswordWord)}
    placed: list[dict[str, Any]] = (activity.layout or {}).get("words", [])
    if len(answers) != len(placed):
        raise _invalid()
    result = []
    for entry, answer in zip(placed, answers, strict=True):
        if answer is not None and not isinstance(answer, str):
            raise _invalid()
        word = words[entry["word_id"]]
        given = answer or ""
        result.append(
            {
                "prompt": word.clue,
                "options": None,
                "given": given,
                "correct": word.word,
                "is_correct": crossword.word_matches(given, entry["cells"]),
                "explanation": None,
            }
        )
    return result


def grade(
    activity: Activity, items: list[ActivityItem], answers: list[Answer]
) -> list[dict[str, Any]]:
    """Har element bo'yicha natija (urinish ichida nusxa sifatida saqlanadi)."""
    if activity.type == ActivityType.crossword:
        return _grade_crossword(activity, items, answers)
    if len(answers) != len(items):
        raise _invalid()
    result: list[dict[str, Any]] = []
    for item, answer in zip(items, answers, strict=True):
        if isinstance(item, QuizQuestion):
            if answer is not None and (
                isinstance(answer, bool) or not isinstance(answer, int) or not 0 <= answer <= 3
            ):
                raise _invalid()
            result.append(
                {
                    "prompt": item.text,
                    "options": list(item.options),
                    "given": answer,
                    "correct": item.correct_index,
                    "is_correct": answer is not None and answer == item.correct_index,
                    "explanation": item.explanation,
                }
            )
        elif isinstance(item, YesNoItem):
            if answer is not None and not isinstance(answer, bool):
                raise _invalid()
            result.append(
                {
                    "prompt": item.statement,
                    "options": None,
                    "given": answer,
                    "correct": item.answer,
                    "is_correct": answer is not None and answer == item.answer,
                    "explanation": item.explanation,
                }
            )
    return result


async def refresh_activity_step(
    db: AsyncSession, user: User, step: Step, topic: Topic
) -> tuple[StepBrief, Rewards]:
    """`best_score`ni qayta hisoblaydi; nashr qilingan har faoliyatda urinish bo'lsa, bosqichni
    tugatadi va mavzu tugaganini tekshiradi."""
    now = utcnow()
    published = list(
        await db.scalars(
            select(Activity.id).where(Activity.step_id == step.id, Activity.is_published.is_(True))
        )
    )
    best: dict[int, float] = {
        row.activity_id: float(row.best)
        for row in await db.execute(
            select(Attempt.activity_id, func.max(ATTEMPT_PERCENT).label("best"))
            .where(Attempt.user_id == user.id, Attempt.activity_id.in_(published))
            .group_by(Attempt.activity_id)
        )
    }
    row = await progress.get_or_create_progress(db, user.id, step.id)
    row.best_score = round(sum(best.values()) / len(best), 2) if best else None
    row.updated_at = now
    rewards = Rewards()
    if row.status != ProgressStatus.completed and published and all(a in best for a in published):
        row.status = ProgressStatus.completed
        row.completed_at = now
        rewards = await progress.topic_completion_rewards(db, user.id, topic.id, now)
    brief = StepBrief(
        id=step.id,
        kind=step.kind,
        order=step.order,
        has_content=bool(published),
        status=row.status,
    )
    return brief, rewards


async def submit_attempt(
    db: AsyncSession, user: User, activity_id: int, data: AttemptIn
) -> AttemptOut:
    activity, step, topic = await get_attemptable_activity(db, user, activity_id)
    items = (await load_items(db, [activity]))[activity.id]
    result = grade(activity, items, data.answers)
    score = sum(1 for entry in result if entry["is_correct"])
    max_score = len(result)
    now = utcnow()
    attempt = Attempt(
        activity_id=activity.id,
        user_id=user.id,
        score=score,
        max_score=max_score,
        result=result,
        created_at=now,
    )
    db.add(attempt)
    await db.flush()
    rewards = await award(
        db,
        user.id,
        XpReason.activity_completed,
        ref_type="activity",
        ref_id=activity.id,
        amount=rules.activity_xp(score, max_score),
        now=now,
    )
    if score == max_score:
        rewards += await award(
            db,
            user.id,
            XpReason.activity_perfect,
            ref_type="activity",
            ref_id=activity.id,
            amount=rules.ACTIVITY_PERFECT_XP,
            now=now,
        )
    brief, step_rewards = await refresh_activity_step(db, user, step, topic)
    rewards += step_rewards
    await db.commit()
    return AttemptOut(
        attempt_id=attempt.id,
        activity_id=activity.id,
        score=score,
        max_score=max_score,
        result=[ResultItem.model_validate(entry) for entry in result],
        rewards=rewards_out(rewards),
        step=brief,
    )
```

- [ ] **Step 8: `app/assessment/router.py`:**

```python
from fastapi import APIRouter

from app.assessment import attempts
from app.assessment.schemas import AttemptIn, AttemptOut
from app.auth.deps import ActiveUser
from app.core.deps import DbSession
from app.core.types import DbIdPath

router = APIRouter(tags=["assessment"])


@router.post("/activities/{activity_id}/attempts", response_model=AttemptOut, status_code=201)
async def submit_attempt(
    activity_id: DbIdPath, data: AttemptIn, user: ActiveUser, db: DbSession
) -> AttemptOut:
    return await attempts.submit_attempt(db, user, activity_id, data)
```

  `app/api.py` ga `from app.assessment.router import router as assessment_router` va `api_router.include_router(assessment_router)` qo'shiladi.

- [ ] **Step 9: Testlar:** `uv run pytest tests/test_attempts.py tests/test_student_learning.py tests/test_resume.py -q` → PASS. So'ng to'liq tekshiruv.
- [ ] **Step 10: Commit:** `feat(assessment): graded attempts, step completion and XP rewards` + CHANGELOG + hash commit.

### Task 8: Vazifalar va javob yuborish

**Files:**
- Modify: `app/assessment/schemas.py`, `app/assessment/teach_router.py`, `app/assessment/router.py`, `app/learning/editing.py`
- Create: `app/assessment/tasks.py`
- Test: `tests/test_tasks.py`

- [ ] **Step 1: Failing test** — `tests/test_tasks.py`:

```python
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import Submission, SubmissionStatus
from app.core.config import Settings
from app.learning.models import StepKind, Topic
from tests.factories import Course, auth_headers, build_course, make_pdf_bytes, make_user, step_of

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"0" * 16


def task_payload(**overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "title": "Esse",
        "description": "Kasb haqida esse yozing",
        "type": "both",
        "max_score": 10,
    }
    payload.update(overrides)
    return payload


async def _make_task(
    client: AsyncClient, db: AsyncSession, course: Course, topic: Topic, **overrides: Any
) -> tuple[int, dict[str, Any]]:
    step = await step_of(db, topic, StepKind.task)
    response = await client.put(
        f"/api/teach/steps/{step.id}/task",
        headers=course.teacher_headers,
        json=task_payload(**overrides),
    )
    assert response.status_code == 200, response.text
    body: dict[str, Any] = response.json()
    return step.id, body


async def test_teacher_creates_and_updates_task(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    empty_step = await step_of(db, course.topic2, StepKind.task)
    missing = await client.get(
        f"/api/teach/steps/{empty_step.id}/task", headers=course.teacher_headers
    )
    assert missing.status_code == 200 and missing.json() is None

    step_id, task = await _make_task(client, db, course, course.topic1)
    assert (task["type"], task["max_score"], task["deadline"]) == ("both", 10, None)
    _, again = await _make_task(client, db, course, course.topic1, title="Yangi esse")
    assert again["id"] == task["id"] and again["title"] == "Yangi esse"
    fetched = await client.get(f"/api/teach/steps/{step_id}/task", headers=course.teacher_headers)
    assert fetched.json()["title"] == "Yangi esse"

    lecture = await step_of(db, course.topic1, StepKind.lecture)
    wrong = await client.put(
        f"/api/teach/steps/{lecture.id}/task", headers=course.teacher_headers, json=task_payload()
    )
    assert wrong.status_code == 400
    assert wrong.json()["code"] == "TASK_WRONG_STEP"

    topic = (await client.get(f"/api/topics/{course.topic1.id}", headers=course.student_headers)).json()
    assert topic["progress"]["total"] == 3
    assert next(s for s in topic["steps"] if s["kind"] == "task")["has_content"] is True


async def test_text_submission_completes_step_and_awards_xp(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    step_id, task = await _make_task(client, db, course, course.topic1, type="text")
    url = f"/api/tasks/{task['id']}/submission"

    first = await client.put(url, headers=course.student_headers, data={"text": "Mening javobim"})
    assert first.status_code == 200, first.text
    body = first.json()
    submission = body["submission"]
    assert (submission["status"], submission["text"], submission["file_url"]) == (
        "submitted",
        "Mening javobim",
        None,
    )
    assert submission["is_late"] is False
    assert body["step"]["status"] == "completed"
    assert body["rewards"]["xp"] == 20
    assert [b["code"] for b in body["rewards"]["new_badges"]] == ["first_step", "first_task"]

    edited = (await client.put(url, headers=course.student_headers, data={"text": "Tuzatilgan"})).json()
    assert edited["rewards"]["xp"] == 0
    content = (await client.get(f"/api/steps/{step_id}", headers=course.student_headers)).json()
    assert content["task"]["id"] == task["id"]
    assert content["submission"]["text"] == "Tuzatilgan"


async def test_submission_field_rules(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _, text_task = await _make_task(client, db, course, course.topic1, type="text")
    _, file_task = await _make_task(client, db, course, course.topic2, type="file")
    text_url = f"/api/tasks/{text_task['id']}/submission"
    file_url = f"/api/tasks/{file_task['id']}/submission"
    pdf = ("javob.pdf", make_pdf_bytes(1), "application/pdf")

    cases = [
        (text_url, {"text": "Javob"}, {"file": pdf}, "SUBMISSION_FIELD_NOT_ALLOWED"),
        (text_url, {"text": "   "}, None, "SUBMISSION_EMPTY"),
        (file_url, {"text": "Javob"}, {"file": pdf}, "SUBMISSION_FIELD_NOT_ALLOWED"),
        (file_url, None, None, "SUBMISSION_EMPTY"),
    ]
    for url, data, files, code in cases:
        response = await client.put(url, headers=course.student_headers, data=data, files=files)
        assert response.status_code == 422, (url, code)
        assert response.json()["code"] == code


async def test_file_submission_access_and_replacement(
    app: FastAPI, client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _, task = await _make_task(client, db, course, course.topic1, type="file")
    url = f"/api/tasks/{task['id']}/submission"
    pdf = make_pdf_bytes(1)

    first = await client.put(
        url, headers=course.student_headers, files={"file": ("javob.pdf", pdf, "application/pdf")}
    )
    assert first.status_code == 200, first.text
    file_url = first.json()["submission"]["file_url"]
    own = await client.get(file_url, headers=course.student_headers)
    assert own.status_code == 200 and own.content == pdf
    other = await make_user(db, email="boshqa@mail.uz")
    denied = await client.get(file_url, headers=auth_headers(other, settings))
    assert denied.status_code == 404
    assert denied.json()["code"] == "SUBMISSION_NOT_FOUND"

    old_rel = await db.scalar(select(Submission.file).where(Submission.task_id == task["id"]))
    assert old_rel is not None
    second = await client.put(
        url, headers=course.student_headers, files={"file": ("rasm.png", PNG_BYTES, "image/png")}
    )
    assert second.status_code == 200
    assert second.json()["submission"]["original_name"] == "rasm.png"
    assert not app.state.storage.path(old_rel).exists()

    for name, content in (("rasm.png", pdf), ("virus.exe", b"MZ\x90\x00")):
        bad = await client.put(
            url, headers=course.student_headers, files={"file": (name, content, "image/png")}
        )
        assert bad.status_code == 400
        assert bad.json()["code"] == "UNSUPPORTED_FILE_TYPE"


async def test_late_submission_is_marked(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    deadline = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    _, task = await _make_task(client, db, course, course.topic1, type="text", deadline=deadline)
    response = await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, data={"text": "Kech"}
    )
    assert response.json()["submission"]["is_late"] is True


async def test_graded_submission_cannot_be_edited(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _, task = await _make_task(client, db, course, course.topic1, type="text")
    url = f"/api/tasks/{task['id']}/submission"
    await client.put(url, headers=course.student_headers, data={"text": "Javob"})
    await db.execute(update(Submission).values(status=SubmissionStatus.graded, score=8))
    await db.commit()
    response = await client.put(url, headers=course.student_headers, data={"text": "Yangi"})
    assert response.status_code == 409
    assert response.json()["code"] == "SUBMISSION_GRADED"


async def test_hidden_task_is_not_found(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    _, hidden = await _make_task(client, db, course, course.hidden_topic, type="text")
    for task_id in (hidden["id"], 999_999):
        response = await client.put(
            f"/api/tasks/{task_id}/submission", headers=course.student_headers, data={"text": "x"}
        )
        assert response.status_code == 404
        assert response.json()["code"] == "TASK_NOT_FOUND"


async def test_deleting_task_or_topic_removes_submission_files(
    app: FastAPI, client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    storage = app.state.storage
    pdf = ("javob.pdf", make_pdf_bytes(1), "application/pdf")

    _, task = await _make_task(client, db, course, course.topic1, type="file")
    await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, files={"file": pdf}
    )
    rel = await db.scalar(select(Submission.file).where(Submission.task_id == task["id"]))
    assert rel is not None
    deleted = await client.delete(f"/api/teach/tasks/{task['id']}", headers=course.teacher_headers)
    assert deleted.status_code == 204
    assert not storage.path(rel).exists()
    assert await db.scalar(select(func.count()).select_from(Submission)) == 0

    _, task2 = await _make_task(client, db, course, course.topic2, type="file")
    await client.put(
        f"/api/tasks/{task2['id']}/submission", headers=course.student_headers, files={"file": pdf}
    )
    rel2 = await db.scalar(select(Submission.file).where(Submission.task_id == task2["id"]))
    assert rel2 is not None
    removed = await client.delete(
        f"/api/teach/topics/{course.topic2.id}", headers=course.teacher_headers
    )
    assert removed.status_code == 204
    assert not storage.path(rel2).exists()
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_tasks.py -q` → 404/405.

- [ ] **Step 3: `app/assessment/schemas.py` ga qo'shiladi.**

Import'lar:

```python
from datetime import datetime

from pydantic import AwareDatetime

from app.assessment.models import ActivityType, TaskType
from app.assessment.view_schemas import LayoutWord, SubmissionView
```

`models` va `view_schemas` dan keladigan import'lar mavjud qatorlarga birlashtiriladi. Fayl oxiriga:

```python
class TaskIn(BaseModel):
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    description: trimmed_str(max_length=10000)  # type: ignore[valid-type]
    type: TaskType
    max_score: int = Field(ge=1, le=100)
    rubric: str | None = Field(default=None, max_length=5000)
    deadline: AwareDatetime | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    step_id: int
    title: str
    description: str
    type: TaskType
    max_score: int
    rubric: str | None
    deadline: datetime | None


class SubmitOut(BaseModel):
    submission: SubmissionView
    rewards: RewardsOut
    step: StepBrief
```

- [ ] **Step 4: `app/assessment/tasks.py`:**

```python
import logging
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment import views
from app.assessment.models import Submission, SubmissionStatus, Task, TaskType
from app.assessment.schemas import SubmitOut, TaskIn
from app.auth.models import User
from app.core.config import Settings
from app.core.errors import AppError
from app.core.files import signature_matches
from app.core.storage import Storage
from app.core.types import utcnow
from app.gamification import rules
from app.gamification.rules import XpReason
from app.gamification.service import award, rewards_out
from app.learning import editing, progress
from app.learning.models import ProgressStatus, Step, StepKind, Topic
from app.learning.student_schemas import StepBrief

logger = logging.getLogger(__name__)

ALLOWED_SUBMISSION_EXT = frozenset(
    {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png"}
)


def _task_not_found() -> AppError:
    return AppError(404, "TASK_NOT_FOUND", "Vazifa topilmadi")


# --- o'qituvchi -----------------------------------------------------------------------------


async def task_step(db: AsyncSession, user: User, step_id: int) -> Step:
    step, _topic = await editing.ensure_can_edit_step(db, user, step_id)
    if step.kind != StepKind.task:
        raise AppError(400, "TASK_WRONG_STEP", "Vazifa faqat vazifa bosqichiga qo'shiladi")
    return step


async def get_step_task(db: AsyncSession, step_id: int) -> Task | None:
    return await db.scalar(select(Task).where(Task.step_id == step_id))


async def upsert_task(db: AsyncSession, step: Step, data: TaskIn) -> Task:
    task = await get_step_task(db, step.id)
    if task is None:
        task = Task(step_id=step.id)
        db.add(task)
    task.title = data.title
    task.description = data.description
    task.type = data.type
    task.max_score = data.max_score
    task.rubric = (data.rubric or "").strip() or None
    task.deadline = data.deadline
    await db.commit()
    return task


async def ensure_can_edit_task(db: AsyncSession, user: User, task_id: int) -> Task:
    task = await db.get(Task, task_id)
    if task is None:
        raise _task_not_found()
    await editing.ensure_can_edit_step(db, user, task.step_id)
    return task


async def delete_task(db: AsyncSession, task: Task) -> list[str]:
    """Vazifani javoblari bilan o'chiradi va diskdan o'chiriladigan fayllarni qaytaradi."""
    paths = [
        path
        for path in await db.scalars(
            select(Submission.file).where(
                Submission.task_id == task.id, Submission.file.is_not(None)
            )
        )
        if path
    ]
    await db.delete(task)
    await db.commit()
    return paths


# --- talaba ---------------------------------------------------------------------------------


async def get_submittable_task(
    db: AsyncSession, user: User, task_id: int
) -> tuple[Task, Step, Topic]:
    task = await db.get(Task, task_id)
    if task is None:
        raise _task_not_found()
    step = await db.get(Step, task.step_id)
    if step is None:
        raise _task_not_found()
    try:
        topic, _subject = await progress.get_visible_topic(db, user, step.topic_id)
    except AppError:
        raise _task_not_found() from None
    return task, step, topic


def _check_fields(task: Task, text: str | None, has_file: bool, existing_file: bool) -> None:
    if task.type == TaskType.text and has_file:
        raise AppError(
            422, "SUBMISSION_FIELD_NOT_ALLOWED", "Bu vazifaga fayl yuklanmaydi", {"field": "file"}
        )
    if task.type == TaskType.file and text:
        raise AppError(
            422, "SUBMISSION_FIELD_NOT_ALLOWED", "Bu vazifaga matn yozilmaydi", {"field": "text"}
        )
    any_file = has_file or existing_file
    missing = (
        (task.type == TaskType.text and not text)
        or (task.type == TaskType.file and not any_file)
        or (task.type == TaskType.both and not text and not any_file)
    )
    if missing:
        raise AppError(422, "SUBMISSION_EMPTY", "Javob bo'sh")


async def submit(
    db: AsyncSession,
    user: User,
    task_id: int,
    *,
    text: str | None,
    upload: UploadFile | None,
    storage: Storage,
    settings: Settings,
) -> SubmitOut:
    task, step, topic = await get_submittable_task(db, user, task_id)
    clean_text = (text or "").strip() or None
    has_file = upload is not None and bool(upload.filename)
    submission = await db.scalar(
        select(Submission).where(Submission.task_id == task.id, Submission.user_id == user.id)
    )
    if submission is not None and submission.status == SubmissionStatus.graded:
        raise AppError(409, "SUBMISSION_GRADED", "Baholangan javobni o'zgartirib bo'lmaydi")
    _check_fields(task, clean_text, has_file, existing_file=bool(submission and submission.file))

    new_file: str | None = None
    original_name: str | None = None
    if upload is not None and has_file:
        new_file, original_name = await storage.save_upload(
            upload,
            "submissions",
            allowed_ext=ALLOWED_SUBMISSION_EXT,
            max_bytes=settings.max_submission_mb * 1024 * 1024,
        )
        if not signature_matches(storage.path(new_file), Path(new_file).suffix.lower()):
            storage.delete(new_file)
            raise AppError(
                400, "UNSUPPORTED_FILE_TYPE", "Fayl mazmuni e'lon qilingan turga mos emas"
            )

    now = utcnow()
    old_file: str | None = None
    try:
        if submission is None:
            submission = Submission(
                task_id=task.id,
                user_id=user.id,
                status=SubmissionStatus.submitted,
                submitted_at=now,
            )
            db.add(submission)
        submission.status = SubmissionStatus.submitted
        submission.submitted_at = now
        submission.text = clean_text
        if new_file is not None:
            old_file = submission.file
            submission.file = new_file
            submission.original_name = original_name
        await db.flush()
        rewards = await award(
            db,
            user.id,
            XpReason.task_submitted,
            ref_type="task",
            ref_id=task.id,
            amount=rules.TASK_SUBMITTED_XP,
            now=now,
        )
        row = await progress.get_or_create_progress(db, user.id, step.id)
        if row.status != ProgressStatus.completed:
            row.status = ProgressStatus.completed
            row.completed_at = now
        row.updated_at = now
        rewards += await progress.topic_completion_rewards(db, user.id, topic.id, now)
        await db.commit()
    except BaseException:
        storage.delete(new_file)
        raise
    if old_file:
        try:
            storage.delete(old_file)
        except OSError:
            logger.warning("Eski javob faylini o'chirib bo'lmadi: %s", old_file)
    return SubmitOut(
        submission=views.submission_view(submission, task),
        rewards=rewards_out(rewards),
        step=StepBrief(
            id=step.id,
            kind=step.kind,
            order=step.order,
            has_content=True,
            status=ProgressStatus.completed,
        ),
    )


async def own_submission_file(db: AsyncSession, user: User, submission_id: int) -> tuple[str, str]:
    """(nisbiy yo'l, fayl nomi) — faqat javob egasi uchun."""
    submission = await db.get(Submission, submission_id)
    if submission is None or submission.user_id != user.id or not submission.file:
        raise AppError(404, "SUBMISSION_NOT_FOUND", "Javob topilmadi")
    return submission.file, submission.original_name or Path(submission.file).name
```

- [ ] **Step 5: `app/assessment/teach_router.py` ga qo'shiladi.**

Import'lar:

```python
import logging

from app.assessment import tasks
from app.assessment.models import Task
from app.assessment.schemas import TaskIn, TaskOut
from app.core.deps import AppStorage

logger = logging.getLogger(__name__)
```

Endpoint'lar:

```python
@router.get("/steps/{step_id}/task", response_model=TaskOut | None)
async def get_task(step_id: DbIdPath, user: StaffUser, db: DbSession) -> Task | None:
    step = await tasks.task_step(db, user, step_id)
    return await tasks.get_step_task(db, step.id)


@router.put("/steps/{step_id}/task", response_model=TaskOut)
async def upsert_task(step_id: DbIdPath, data: TaskIn, user: StaffUser, db: DbSession) -> Task:
    step = await tasks.task_step(db, user, step_id)
    return await tasks.upsert_task(db, step, data)


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: DbIdPath, user: StaffUser, db: DbSession, storage: AppStorage
) -> Response:
    task = await tasks.ensure_can_edit_task(db, user, task_id)
    for path in await tasks.delete_task(db, task):
        try:
            storage.delete(path)
        except OSError:
            logger.warning("Faylni o'chirib bo'lmadi: %s", path)
    return Response(status_code=204)
```

- [ ] **Step 6: `app/assessment/router.py` ga qo'shiladi.**

Import'lar:

```python
from typing import Annotated

from fastapi import Form, Response, UploadFile

from app.assessment import tasks
from app.assessment.schemas import SubmitOut
from app.core.deps import AppSettings, AppStorage
from app.core.files import file_response
```

Endpoint'lar:

```python
@router.put("/tasks/{task_id}/submission", response_model=SubmitOut)
async def submit_task(
    task_id: DbIdPath,
    user: ActiveUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
    text: Annotated[str | None, Form(max_length=20000)] = None,
    file: UploadFile | None = None,
) -> SubmitOut:
    return await tasks.submit(
        db, user, task_id, text=text, upload=file, storage=storage, settings=settings
    )


@router.get("/submissions/{submission_id}/file", response_class=Response)
async def submission_file(
    submission_id: DbIdPath,
    user: ActiveUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> Response:
    rel, filename = await tasks.own_submission_file(db, user, submission_id)
    return file_response(settings, storage, rel, filename)
```

- [ ] **Step 7: `app/learning/editing.py` — fan yoki mavzu o'chirilganda javob fayllari ham o'chadi.**

`from app.assessment.models import Submission, Task` import'i qo'shiladi. `_material_paths` dan keyin quyidagi funksiya yoziladi:

```python
async def _submission_paths(db: AsyncSession, *conditions: ColumnElement[bool]) -> list[str]:
    rows = await db.scalars(
        select(Submission.file)
        .join(Task, Submission.task_id == Task.id)
        .join(Step, Task.step_id == Step.id)
        .join(Topic, Step.topic_id == Topic.id)
        .where(Submission.file.is_not(None), *conditions)
    )
    return sorted({path for path in rows if path})
```

  - `delete_subject`: `paths = await _material_paths(db, Topic.subject_id == subject.id)` → `paths = await _material_paths(db, Topic.subject_id == subject.id) + await _submission_paths(db, Topic.subject_id == subject.id)`.
  - `delete_topic`: shunga o'xshash, `Step.topic_id == topic.id` sharti bilan.

- [ ] **Step 8: Testlar:** `uv run pytest tests/test_tasks.py tests/test_teach_topics.py tests/test_admin_subjects.py -q` → PASS. So'ng to'liq tekshiruv.
- [ ] **Step 9: Commit:** `feat(assessment): tasks and student submissions with files` + CHANGELOG + hash commit.

### Task 9: O'qituvchi — tekshirish navbati, baholash va qaytarish

**Files:**
- Modify: `app/assessment/schemas.py`, `app/api.py`
- Create: `app/assessment/review.py`, `app/assessment/review_router.py`
- Test: `tests/test_review.py`

- [ ] **Step 1: Failing test** — `tests/test_review.py`:

```python
from typing import Any

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.gamification.models import XpEvent
from app.learning.models import StepKind
from tests.factories import Course, auth_headers, build_course, make_pdf_bytes, make_user, step_of


async def _submitted(
    client: AsyncClient, db: AsyncSession, course: Course, task_type: str = "both"
) -> tuple[dict[str, Any], dict[str, Any]]:
    step = await step_of(db, course.topic1, StepKind.task)
    task = (
        await client.put(
            f"/api/teach/steps/{step.id}/task",
            headers=course.teacher_headers,
            json={"title": "Esse", "description": "Yozing", "type": task_type, "max_score": 10},
        )
    ).json()
    response = await client.put(
        f"/api/tasks/{task['id']}/submission",
        headers=course.student_headers,
        data={"text": "Javobim"},
        files={"file": ("javob.pdf", make_pdf_bytes(1), "application/pdf")},
    )
    assert response.status_code == 200, response.text
    return task, response.json()["submission"]


async def test_queue_lists_submissions_of_assigned_subjects(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    task, submission = await _submitted(client, db, course)

    queue = await client.get("/api/teach/submissions", headers=course.teacher_headers)
    assert queue.status_code == 200
    [item] = queue.json()
    assert item["id"] == submission["id"]
    assert (item["student_name"], item["task_title"], item["topic_title"]) == (
        "Dilnoza Karimova",
        "Esse",
        "1-mavzu",
    )
    assert item["is_late"] is False

    stranger = await make_user(db, email="begona@mail.uz", role=Role.teacher)
    stranger_headers = auth_headers(stranger, settings)
    assert (await client.get("/api/teach/submissions", headers=stranger_headers)).json() == []
    hidden = await client.get(f"/api/teach/submissions/{submission['id']}", headers=stranger_headers)
    assert hidden.status_code == 404
    assert hidden.json()["code"] == "SUBMISSION_NOT_FOUND"

    admin = await make_user(db, email="admin@mail.uz", role=Role.admin)
    admin_queue = await client.get("/api/teach/submissions", headers=auth_headers(admin, settings))
    assert len(admin_queue.json()) == 1

    summary = await client.get("/api/teach/summary", headers=course.teacher_headers)
    assert summary.json() == {"pending_submissions": 1}


async def test_detail_and_file_for_teacher(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    task, submission = await _submitted(client, db, course)
    detail = (
        await client.get(f"/api/teach/submissions/{submission['id']}", headers=course.teacher_headers)
    ).json()
    assert (detail["text"], detail["original_name"], detail["max_score"]) == (
        "Javobim",
        "javob.pdf",
        10,
    )
    assert detail["task_description"] == "Yozing"
    file = await client.get(detail["file_url"], headers=course.teacher_headers)
    assert file.status_code == 200
    assert file.content.startswith(b"%PDF-")


async def test_grading_finalizes_and_rewards_student(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    task, submission = await _submitted(client, db, course)
    url = f"/api/teach/submissions/{submission['id']}"

    for score in (11, -1):
        bad = await client.post(f"{url}/grade", headers=course.teacher_headers, json={"score": score})
        assert bad.status_code == 422
        assert bad.json()["code"] == "SCORE_OUT_OF_RANGE"

    graded = await client.post(
        f"{url}/grade", headers=course.teacher_headers, json={"score": 8, "feedback": " Yaxshi "}
    )
    assert graded.status_code == 200
    assert (graded.json()["status"], graded.json()["score"], graded.json()["feedback"]) == (
        "graded",
        8,
        "Yaxshi",
    )
    event = await db.scalar(
        select(XpEvent).where(XpEvent.user_id == course.student.id, XpEvent.reason == "task_graded")
    )
    assert event is not None and event.amount == 24

    again = await client.post(f"{url}/grade", headers=course.teacher_headers, json={"score": 9})
    assert again.status_code == 409
    assert again.json()["code"] == "SUBMISSION_NOT_SUBMITTED"
    edit = await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, data={"text": "x"}
    )
    assert edit.status_code == 409

    step_id = (await step_of(db, course.topic1, StepKind.task)).id
    content = (await client.get(f"/api/steps/{step_id}", headers=course.student_headers)).json()
    assert (content["submission"]["status"], content["submission"]["score"]) == ("graded", 8)
    assert (await client.get("/api/teach/submissions", headers=course.teacher_headers)).json() == []


async def test_return_and_resubmit(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    task, submission = await _submitted(client, db, course)
    url = f"/api/teach/submissions/{submission['id']}"

    empty = await client.post(f"{url}/return", headers=course.teacher_headers, json={"feedback": " "})
    assert empty.status_code == 422
    assert empty.json()["code"] == "VALIDATION_ERROR"
    returned = await client.post(
        f"{url}/return", headers=course.teacher_headers, json={"feedback": "Manba qo'shing"}
    )
    assert returned.json()["status"] == "returned"
    twice = await client.post(f"{url}/return", headers=course.teacher_headers, json={"feedback": "x"})
    assert twice.status_code == 409
    not_resubmitted = await client.post(f"{url}/grade", headers=course.teacher_headers, json={"score": 5})
    assert not_resubmitted.status_code == 409

    resubmitted = await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, data={"text": "Tuzatdim"}
    )
    assert resubmitted.json()["submission"]["status"] == "submitted"
    assert resubmitted.json()["submission"]["feedback"] == "Manba qo'shing"
    graded = await client.post(f"{url}/grade", headers=course.teacher_headers, json={"score": 10})
    assert graded.status_code == 200
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_review.py -q` → 404.

- [ ] **Step 3: `app/assessment/schemas.py` ga qo'shiladi** (`SubmissionStatus` import'i `models` qatoriga qo'shiladi):

```python
class SubmissionQueueItem(BaseModel):
    id: int
    status: SubmissionStatus
    student_name: str
    subject_id: int
    subject_title: str
    topic_id: int
    topic_title: str
    task_id: int
    task_title: str
    submitted_at: datetime
    is_late: bool


class SubmissionDetailOut(SubmissionQueueItem):
    task_description: str
    rubric: str | None
    max_score: int
    text: str | None
    original_name: str | None
    file_url: str | None
    score: int | None
    feedback: str | None
    graded_at: datetime | None


class GradeIn(BaseModel):
    # Oraliq (0..max_score) servisda tekshiriladi: SCORE_OUT_OF_RANGE.
    score: int = Field(ge=-1_000_000, le=1_000_000)
    feedback: str | None = Field(default=None, max_length=5000)


class ReturnIn(BaseModel):
    feedback: trimmed_str(max_length=5000)  # type: ignore[valid-type]


class TeachSummaryOut(BaseModel):
    pending_submissions: int
```

- [ ] **Step 4: `app/assessment/review.py`:**

```python
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import Submission, SubmissionStatus, Task
from app.assessment.schemas import GradeIn, SubmissionDetailOut, SubmissionQueueItem
from app.assessment.views import is_late
from app.auth.models import Role, User
from app.core.errors import AppError
from app.core.types import utcnow
from app.gamification import rules
from app.gamification.rules import XpReason
from app.gamification.service import award
from app.learning.models import Step, Subject, Topic, subject_teachers

QUEUE_LIMIT = 200

ReviewRow = tuple[Submission, Task, Topic, Subject, str]


def _base_query(user: User) -> Select[ReviewRow]:
    """Foydalanuvchi tekshira oladigan javoblar: admin — hammasi, o'qituvchi — biriktirilgan fanlar."""
    stmt = (
        select(Submission, Task, Topic, Subject, User.full_name)
        .join(Task, Submission.task_id == Task.id)
        .join(Step, Task.step_id == Step.id)
        .join(Topic, Step.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .join(User, Submission.user_id == User.id)
    )
    if user.role != Role.admin:
        stmt = stmt.join(subject_teachers, subject_teachers.c.subject_id == Subject.id).where(
            subject_teachers.c.user_id == user.id
        )
    return stmt


def _queue_item(row: ReviewRow) -> SubmissionQueueItem:
    submission, task, topic, subject, student_name = row
    return SubmissionQueueItem(
        id=submission.id,
        status=submission.status,
        student_name=student_name,
        subject_id=subject.id,
        subject_title=subject.title,
        topic_id=topic.id,
        topic_title=topic.title,
        task_id=task.id,
        task_title=task.title,
        submitted_at=submission.submitted_at,
        is_late=is_late(submission.submitted_at, task.deadline),
    )


def _detail(row: ReviewRow) -> SubmissionDetailOut:
    submission, task, *_ = row
    return SubmissionDetailOut(
        **_queue_item(row).model_dump(),
        task_description=task.description,
        rubric=task.rubric,
        max_score=task.max_score,
        text=submission.text,
        original_name=submission.original_name,
        file_url=(
            f"/api/teach/submissions/{submission.id}/file" if submission.file else None
        ),
        score=submission.score,
        feedback=submission.feedback,
        graded_at=submission.graded_at,
    )


async def list_queue(
    db: AsyncSession, user: User, status: SubmissionStatus, subject_id: int | None
) -> list[SubmissionQueueItem]:
    stmt = _base_query(user).where(Submission.status == status)
    if subject_id is not None:
        stmt = stmt.where(Subject.id == subject_id)
    stmt = stmt.order_by(Submission.submitted_at, Submission.id).limit(QUEUE_LIMIT)
    return [_queue_item(row.tuple()) for row in await db.execute(stmt)]


async def get_reviewable(db: AsyncSession, user: User, submission_id: int) -> ReviewRow:
    """Ruxsat bo'lmasa ham 404 qaytadi: javobning borligi oshkor qilinmaydi."""
    row = (await db.execute(_base_query(user).where(Submission.id == submission_id))).first()
    if row is None:
        raise AppError(404, "SUBMISSION_NOT_FOUND", "Javob topilmadi")
    return row.tuple()


async def submission_detail(db: AsyncSession, user: User, submission_id: int) -> SubmissionDetailOut:
    return _detail(await get_reviewable(db, user, submission_id))


def _ensure_submitted(submission: Submission) -> None:
    if submission.status != SubmissionStatus.submitted:
        raise AppError(
            409, "SUBMISSION_NOT_SUBMITTED", "Faqat tekshiruvdagi javob bilan ishlash mumkin"
        )


async def grade(
    db: AsyncSession, user: User, submission_id: int, data: GradeIn
) -> SubmissionDetailOut:
    row = await get_reviewable(db, user, submission_id)
    submission, task, *_ = row
    _ensure_submitted(submission)
    if not 0 <= data.score <= task.max_score:
        raise AppError(
            422,
            "SCORE_OUT_OF_RANGE",
            "Ball 0 va maksimal ball oralig'ida bo'lishi kerak",
            {"max_score": task.max_score},
        )
    now = utcnow()
    submission.status = SubmissionStatus.graded
    submission.score = data.score
    submission.feedback = (data.feedback or "").strip() or None
    submission.graded_by = user.id
    submission.graded_at = now
    await award(
        db,
        submission.user_id,
        XpReason.task_graded,
        ref_type="submission",
        ref_id=submission.id,
        amount=rules.graded_xp(data.score, task.max_score),
        now=now,
    )
    await db.commit()
    return _detail(row)


async def return_submission(
    db: AsyncSession, user: User, submission_id: int, feedback: str
) -> SubmissionDetailOut:
    row = await get_reviewable(db, user, submission_id)
    submission = row[0]
    _ensure_submitted(submission)
    submission.status = SubmissionStatus.returned
    submission.feedback = feedback
    await db.commit()
    return _detail(row)


async def pending_count(db: AsyncSession, user: User) -> int:
    subquery = _base_query(user).where(Submission.status == SubmissionStatus.submitted).subquery()
    return int(await db.scalar(select(func.count()).select_from(subquery)) or 0)
```

- [ ] **Step 5: `app/assessment/review_router.py`:**

```python
from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.assessment import review
from app.assessment.models import SubmissionStatus
from app.assessment.schemas import (
    GradeIn,
    ReturnIn,
    SubmissionDetailOut,
    SubmissionQueueItem,
    TeachSummaryOut,
)
from app.auth.deps import StaffUser
from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.errors import AppError
from app.core.files import file_response
from app.core.types import DB_ID_MAX, DbIdPath

router = APIRouter(prefix="/teach", tags=["teach"])


@router.get("/submissions", response_model=list[SubmissionQueueItem])
async def list_submissions(
    user: StaffUser,
    db: DbSession,
    status: SubmissionStatus = SubmissionStatus.submitted,
    subject_id: Annotated[int | None, Query(ge=1, le=DB_ID_MAX)] = None,
) -> list[SubmissionQueueItem]:
    return await review.list_queue(db, user, status, subject_id)


@router.get("/submissions/{submission_id}", response_model=SubmissionDetailOut)
async def get_submission(
    submission_id: DbIdPath, user: StaffUser, db: DbSession
) -> SubmissionDetailOut:
    return await review.submission_detail(db, user, submission_id)


@router.get("/submissions/{submission_id}/file", response_class=Response)
async def submission_file(
    submission_id: DbIdPath,
    user: StaffUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> Response:
    submission = (await review.get_reviewable(db, user, submission_id))[0]
    if not submission.file:
        raise AppError(404, "SUBMISSION_NOT_FOUND", "Javob topilmadi")
    return file_response(settings, storage, submission.file, submission.original_name or "javob")


@router.post("/submissions/{submission_id}/grade", response_model=SubmissionDetailOut)
async def grade_submission(
    submission_id: DbIdPath, data: GradeIn, user: StaffUser, db: DbSession
) -> SubmissionDetailOut:
    return await review.grade(db, user, submission_id, data)


@router.post("/submissions/{submission_id}/return", response_model=SubmissionDetailOut)
async def return_submission(
    submission_id: DbIdPath, data: ReturnIn, user: StaffUser, db: DbSession
) -> SubmissionDetailOut:
    return await review.return_submission(db, user, submission_id, data.feedback)


@router.get("/summary", response_model=TeachSummaryOut)
async def teach_summary(user: StaffUser, db: DbSession) -> TeachSummaryOut:
    return TeachSummaryOut(pending_submissions=await review.pending_count(db, user))
```

  `app/api.py` ga `from app.assessment.review_router import router as assessment_review_router` va `api_router.include_router(assessment_review_router)` qo'shiladi.

- [ ] **Step 6: Testlar:** `uv run pytest tests/test_review.py -q` → PASS. So'ng to'liq tekshiruv.
- [ ] **Step 7: Commit:** `feat(assessment): teacher review queue, grading and returns` + CHANGELOG + hash commit.

### Task 10: Bosh sahifa, natijalarim va o'qituvchi statistikasi

**Files:**
- Modify: `app/gamification/service.py`, `app/learning/student_schemas.py`, `app/learning/progress_router.py`, `app/assessment/schemas.py`, `app/assessment/router.py`, `app/assessment/review_router.py`
- Create: `app/assessment/reports.py`
- Test: `tests/test_reports.py`

- [ ] **Step 1: Failing test** — `tests/test_reports.py`:

```python
from datetime import timedelta

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role
from app.core.config import Settings
from app.core.types import utcnow
from app.gamification.models import Streak
from app.gamification.service import local_date
from app.learning.models import StepKind
from tests.factories import add_activity, auth_headers, build_course, make_user, quiz_payload, step_of


async def test_dashboard_for_new_student(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    body = (await client.get("/api/me/dashboard", headers=course.student_headers)).json()
    assert body["xp_total"] == 0
    assert body["streak"] == {"current": 0, "longest": 0, "active_today": False}
    assert len(body["badges"]) == 10
    assert body["badges"][0]["code"] == "first_step"
    assert all(badge["awarded_at"] is None for badge in body["badges"])
    assert body["continue_step"]["topic_id"] == course.topic1.id


async def test_dashboard_after_learning(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic2, StepKind.lecture)
    await client.post(f"/api/steps/{lecture.id}/complete", headers=course.student_headers)
    body = (await client.get("/api/me/dashboard", headers=course.student_headers)).json()
    assert body["xp_total"] == 60
    assert body["streak"] == {"current": 1, "longest": 1, "active_today": True}
    awarded = {badge["code"] for badge in body["badges"] if badge["awarded_at"] is not None}
    assert awarded == {"first_step", "first_topic"}


async def test_dashboard_hides_broken_streak(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    db.add(
        Streak(
            user_id=course.student.id,
            current=5,
            longest=7,
            last_active_date=local_date(utcnow()) - timedelta(days=3),
        )
    )
    await db.commit()
    body = (await client.get("/api/me/dashboard", headers=course.student_headers)).json()
    assert body["streak"] == {"current": 0, "longest": 7, "active_today": False}


async def test_results_and_attempt_detail(
    client: AsyncClient, db: AsyncSession, settings: Settings
) -> None:
    course = await build_course(client, db, settings)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    for answers in ([0, 2], [0, 1]):
        await client.post(
            f"/api/activities/{quiz['id']}/attempts",
            headers=course.student_headers,
            json={"answers": answers},
        )
    task_step = await step_of(db, course.topic1, StepKind.task)
    task = (
        await client.put(
            f"/api/teach/steps/{task_step.id}/task",
            headers=course.teacher_headers,
            json={"title": "Esse", "description": "Yozing", "type": "text", "max_score": 10},
        )
    ).json()
    await client.put(
        f"/api/tasks/{task['id']}/submission", headers=course.student_headers, data={"text": "J"}
    )

    results = (await client.get("/api/me/results", headers=course.student_headers)).json()
    [subject] = results
    assert subject["subject_slug"] == course.subject.slug
    [topic] = subject["topics"]
    assert topic["topic_id"] == course.topic1.id
    [activity] = topic["activities"]
    assert (activity["best_percent"], activity["attempts_count"]) == (100.0, 2)
    [task_result] = topic["tasks"]
    assert (task_result["status"], task_result["max_score"]) == ("submitted", 10)

    detail_url = f"/api/me/attempts/{activity['last_attempt_id']}"
    detail = (await client.get(detail_url, headers=course.student_headers)).json()
    assert (detail["score"], detail["max_score"], detail["activity_title"]) == (
        2,
        2,
        "Takrorlash testi",
    )
    assert len(detail["result"]) == 2
    other = await make_user(db, email="boshqa@mail.uz")
    denied = await client.get(detail_url, headers=auth_headers(other, settings))
    assert denied.status_code == 404
    assert denied.json()["code"] == "ATTEMPT_NOT_FOUND"


async def test_teacher_stats(client: AsyncClient, db: AsyncSession, settings: Settings) -> None:
    course = await build_course(client, db, settings)
    lecture = await step_of(db, course.topic2, StepKind.lecture)
    await client.post(f"/api/steps/{lecture.id}/complete", headers=course.student_headers)
    review = await step_of(db, course.topic1, StepKind.review)
    quiz = await add_activity(client, course.teacher_headers, review.id, quiz_payload())
    await client.post(
        f"/api/activities/{quiz['id']}/attempts",
        headers=course.student_headers,
        json={"answers": [0, 2]},
    )

    url = f"/api/teach/stats?subject_id={course.subject.id}"
    stats = (await client.get(url, headers=course.teacher_headers)).json()
    by_topic = {row["topic_id"]: row for row in stats}
    assert len(stats) == 3  # o'qituvchi nashr qilinmagan mavzuni ham ko'radi
    topic1, topic2 = by_topic[course.topic1.id], by_topic[course.topic2.id]
    assert (topic2["started"], topic2["completed"], topic2["avg_best_percent"]) == (1, 1, None)
    assert (topic1["started"], topic1["completed"], topic1["avg_best_percent"]) == (1, 0, 50.0)
    assert topic1["pending_submissions"] == 0

    stranger = await make_user(db, email="begona@mail.uz", role=Role.teacher)
    denied = await client.get(url, headers=auth_headers(stranger, settings))
    assert denied.status_code == 403
    assert denied.json()["code"] == "NOT_SUBJECT_TEACHER"
```

- [ ] **Step 2: Yiqilishini tekshirish:** `uv run pytest tests/test_reports.py -q` → 404.

- [ ] **Step 3: `app/gamification/service.py`.** Import'larga `BadgeOut, ProfileOut, StreakOut` (`app.gamification.schemas` dan) qo'shiladi va fayl oxiriga quyidagi funksiya yoziladi:

```python
async def profile(db: AsyncSession, user_id: int, now: datetime) -> ProfileOut:
    """XP, seriya va nishonlar. Seriya kechadan eski bo'lsa, `current` 0 deb ko'rsatiladi."""
    today = local_date(now)
    streak = await db.get(Streak, user_id)
    current = longest = 0
    active_today = False
    if streak is not None:
        longest = streak.longest
        last = streak.last_active_date
        if last is not None and last >= today - timedelta(days=1):
            current = streak.current
        active_today = last == today
    owned = {
        row.badge_id: row.awarded_at
        for row in await db.execute(
            select(UserBadge.badge_id, UserBadge.awarded_at).where(UserBadge.user_id == user_id)
        )
    }
    by_code = {badge.code: badge for badge in await db.scalars(select(Badge))}
    badges = [
        BadgeOut(
            code=badge.code,
            icon=badge.icon,
            title_uz=badge.title_uz,
            title_ru=badge.title_ru,
            description_uz=badge.description_uz,
            description_ru=badge.description_ru,
            awarded_at=owned.get(badge.id),
        )
        for rule in BADGES
        if (badge := by_code.get(rule.code)) is not None
    ]
    return ProfileOut(
        xp_total=await xp_total(db, user_id),
        streak=StreakOut(current=current, longest=longest, active_today=active_today),
        badges=badges,
    )
```

- [ ] **Step 4: `app/learning/student_schemas.py`.** Import `from app.gamification.schemas import ProfileOut, RewardsOut` ko'rinishiga keltiriladi va `ContinueOut` dan keyin quyidagi klass yoziladi:

```python
class DashboardOut(ProfileOut):
    continue_step: ContinueOut | None
```

- [ ] **Step 5: `app/learning/progress_router.py`** ga endpoint qo'shiladi (`from app.core.types import utcnow`, `from app.gamification import service as gamification` va `DashboardOut` import'lari bilan):

```python
@router.get("/me/dashboard", response_model=DashboardOut)
async def dashboard(user: ActiveUser, db: DbSession) -> DashboardOut:
    profile = await gamification.profile(db, user.id, utcnow())
    return DashboardOut(
        **profile.model_dump(), continue_step=await resume.continue_target(db, user)
    )
```

- [ ] **Step 6: `app/assessment/schemas.py` ga qo'shiladi:**

```python
class AttemptDetailOut(BaseModel):
    id: int
    activity_id: int
    activity_title: str
    activity_type: ActivityType
    score: int
    max_score: int
    result: list[ResultItem]
    created_at: datetime


class ActivityResultOut(BaseModel):
    activity_id: int
    title: str
    type: ActivityType
    best_percent: float
    attempts_count: int
    last_attempt_id: int
    last_attempt_at: datetime


class TaskResultOut(BaseModel):
    task_id: int
    title: str
    status: SubmissionStatus
    score: int | None
    max_score: int
    feedback: str | None
    is_late: bool
    submitted_at: datetime


class TopicResultsOut(BaseModel):
    topic_id: int
    topic_title: str
    activities: list[ActivityResultOut]
    tasks: list[TaskResultOut]


class SubjectResultsOut(BaseModel):
    subject_id: int
    subject_title: str
    subject_slug: str
    topics: list[TopicResultsOut]


class TopicStatsOut(BaseModel):
    topic_id: int
    topic_title: str
    started: int
    completed: int
    avg_best_percent: float | None
    pending_submissions: int
```

- [ ] **Step 7: `app/assessment/reports.py`:**

```python
from collections import defaultdict
from statistics import mean

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.assessment.models import Activity, Attempt, Submission, SubmissionStatus, Task
from app.assessment.schemas import (
    ActivityResultOut,
    AttemptDetailOut,
    ResultItem,
    SubjectResultsOut,
    TaskResultOut,
    TopicResultsOut,
    TopicStatsOut,
)
from app.assessment.views import ATTEMPT_PERCENT, is_late
from app.auth.models import Role, User
from app.core.errors import AppError
from app.learning import editing
from app.learning.content import load_step_infos
from app.learning.models import ProgressStatus, Step, StepProgress, Subject, Topic


async def my_results(db: AsyncSession, user: User) -> list[SubjectResultsOut]:
    """Talabaning urinishlari va javoblari, fan va mavzu bo'yicha guruhlangan."""
    stats = {
        row.activity_id: row
        for row in await db.execute(
            select(
                Attempt.activity_id,
                func.max(ATTEMPT_PERCENT).label("best"),
                func.count().label("n"),
                func.max(Attempt.id).label("last_id"),
                func.max(Attempt.created_at).label("last_at"),
            )
            .where(Attempt.user_id == user.id)
            .group_by(Attempt.activity_id)
        )
    }
    subjects: dict[int, Subject] = {}
    topics: dict[int, Topic] = {}
    activities_by_topic: dict[int, list[ActivityResultOut]] = defaultdict(list)
    tasks_by_topic: dict[int, list[TaskResultOut]] = defaultdict(list)

    if stats:
        activity_rows = await db.execute(
            select(Activity, Topic, Subject)
            .join(Step, Activity.step_id == Step.id)
            .join(Topic, Step.topic_id == Topic.id)
            .join(Subject, Topic.subject_id == Subject.id)
            .where(Activity.id.in_(list(stats)))
            .order_by(Step.order, Activity.order, Activity.id)
        )
        for activity, topic, subject in activity_rows.tuples():
            stat = stats[activity.id]
            subjects[subject.id] = subject
            topics[topic.id] = topic
            activities_by_topic[topic.id].append(
                ActivityResultOut(
                    activity_id=activity.id,
                    title=activity.title,
                    type=activity.type,
                    best_percent=round(float(stat.best), 2),
                    attempts_count=int(stat.n),
                    last_attempt_id=int(stat.last_id),
                    last_attempt_at=stat.last_at,
                )
            )

    submission_rows = await db.execute(
        select(Submission, Task, Topic, Subject)
        .join(Task, Submission.task_id == Task.id)
        .join(Step, Task.step_id == Step.id)
        .join(Topic, Step.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .where(Submission.user_id == user.id)
    )
    for submission, task, topic, subject in submission_rows.tuples():
        subjects[subject.id] = subject
        topics[topic.id] = topic
        tasks_by_topic[topic.id].append(
            TaskResultOut(
                task_id=task.id,
                title=task.title,
                status=submission.status,
                score=submission.score,
                max_score=task.max_score,
                feedback=submission.feedback,
                is_late=is_late(submission.submitted_at, task.deadline),
                submitted_at=submission.submitted_at,
            )
        )

    result = []
    for subject in sorted(subjects.values(), key=lambda s: (s.order, s.id)):
        subject_topics = sorted(
            (t for t in topics.values() if t.subject_id == subject.id),
            key=lambda t: (t.order, t.id),
        )
        result.append(
            SubjectResultsOut(
                subject_id=subject.id,
                subject_title=subject.title,
                subject_slug=subject.slug,
                topics=[
                    TopicResultsOut(
                        topic_id=t.id,
                        topic_title=t.title,
                        activities=activities_by_topic[t.id],
                        tasks=tasks_by_topic[t.id],
                    )
                    for t in subject_topics
                ],
            )
        )
    return result


async def attempt_detail(db: AsyncSession, user: User, attempt_id: int) -> AttemptDetailOut:
    row = (
        await db.execute(
            select(Attempt, Activity)
            .join(Activity, Attempt.activity_id == Activity.id)
            .where(Attempt.id == attempt_id, Attempt.user_id == user.id)
        )
    ).first()
    if row is None:
        raise AppError(404, "ATTEMPT_NOT_FOUND", "Urinish topilmadi")
    attempt, activity = row.tuple()
    return AttemptDetailOut(
        id=attempt.id,
        activity_id=activity.id,
        activity_title=activity.title,
        activity_type=activity.type,
        score=attempt.score,
        max_score=attempt.max_score,
        result=[ResultItem.model_validate(entry) for entry in attempt.result],
        created_at=attempt.created_at,
    )


async def teach_stats(db: AsyncSession, user: User, subject_id: int) -> list[TopicStatsOut]:
    """Mavzular bo'yicha statistika (faqat talabalar hisobga olinadi)."""
    await editing.ensure_can_edit_subject(db, user, subject_id)
    topics = list(
        await db.scalars(
            select(Topic).where(Topic.subject_id == subject_id).order_by(Topic.order, Topic.id)
        )
    )
    if not topics:
        return []
    topic_ids = [t.id for t in topics]
    infos = await load_step_infos(db, topic_ids)
    step_topic = {info.id: tid for tid, topic_infos in infos.items() for info in topic_infos}
    content_steps = {
        tid: {info.id for info in topic_infos if info.has_content}
        for tid, topic_infos in infos.items()
    }

    started: dict[int, set[int]] = defaultdict(set)
    completed_steps: dict[tuple[int, int], set[int]] = defaultdict(set)
    progress_rows = await db.execute(
        select(StepProgress.user_id, StepProgress.step_id, StepProgress.status)
        .join(User, StepProgress.user_id == User.id)
        .where(StepProgress.step_id.in_(list(step_topic)), User.role == Role.student)
    )
    for row in progress_rows:
        tid = step_topic[row.step_id]
        started[tid].add(row.user_id)
        if row.status == ProgressStatus.completed:
            completed_steps[(tid, row.user_id)].add(row.step_id)

    bests: dict[int, list[float]] = defaultdict(list)
    best_rows = await db.execute(
        select(Step.topic_id, func.max(ATTEMPT_PERCENT).label("best"))
        .select_from(Attempt)
        .join(Activity, Attempt.activity_id == Activity.id)
        .join(Step, Activity.step_id == Step.id)
        .join(User, Attempt.user_id == User.id)
        .where(Step.topic_id.in_(topic_ids), User.role == Role.student)
        .group_by(Step.topic_id, Attempt.user_id, Attempt.activity_id)
    )
    for row in best_rows:
        bests[row.topic_id].append(float(row.best))

    pending = {
        row.topic_id: int(row.n)
        for row in await db.execute(
            select(Step.topic_id, func.count().label("n"))
            .select_from(Submission)
            .join(Task, Submission.task_id == Task.id)
            .join(Step, Task.step_id == Step.id)
            .where(Step.topic_id.in_(topic_ids), Submission.status == SubmissionStatus.submitted)
            .group_by(Step.topic_id)
        )
    }

    return [
        TopicStatsOut(
            topic_id=topic.id,
            topic_title=topic.title,
            started=len(started[topic.id]),
            completed=sum(
                1
                for uid in started[topic.id]
                if content_steps[topic.id]
                and content_steps[topic.id] <= completed_steps[(topic.id, uid)]
            ),
            avg_best_percent=round(mean(bests[topic.id]), 1) if bests[topic.id] else None,
            pending_submissions=pending.get(topic.id, 0),
        )
        for topic in topics
    ]
```

- [ ] **Step 8: Router'lar.**
  - `app/assessment/router.py`:

```python
from app.assessment import reports
from app.assessment.schemas import AttemptDetailOut, SubjectResultsOut


@router.get("/me/results", response_model=list[SubjectResultsOut])
async def my_results(user: ActiveUser, db: DbSession) -> list[SubjectResultsOut]:
    return await reports.my_results(db, user)


@router.get("/me/attempts/{attempt_id}", response_model=AttemptDetailOut)
async def attempt_detail(attempt_id: DbIdPath, user: ActiveUser, db: DbSession) -> AttemptDetailOut:
    return await reports.attempt_detail(db, user, attempt_id)
```

  - `app/assessment/review_router.py`:

```python
from app.assessment import reports
from app.assessment.schemas import TopicStatsOut


@router.get("/stats", response_model=list[TopicStatsOut])
async def teach_stats(
    subject_id: Annotated[int, Query(ge=1, le=DB_ID_MAX)], user: StaffUser, db: DbSession
) -> list[TopicStatsOut]:
    return await reports.teach_stats(db, user, subject_id)
```

- [ ] **Step 9: Testlar:** `uv run pytest tests/test_reports.py -q` → PASS. So'ng to'liq tekshiruv.
- [ ] **Step 10: Commit:** `feat: student dashboard, results and teacher stats` + CHANGELOG + hash commit.

---

### Task 11: API tiplari, hujjatlar va yakuniy tekshiruv

**Files:**
- Modify: `frontend/src/api/schema.gen.ts` (generatsiya), `frontend/src/api/types.ts`, `frontend/src/api/types.contract.ts`, `frontend/src/test/fixtures.ts`
- Modify: `CLAUDE.md`, `docs/superpowers/roadmap.md`, `CHANGELOG.md`

- [ ] **Step 1: Backend to'liq tekshiruv** (`backend/`): `uv run ruff format --check . && uv run ruff check . && uv run mypy app && uv run pytest -q` → hammasi yashil.

- [ ] **Step 2: API tiplarini generatsiya qilish** (`frontend/`): `npm run gen:api`. Shundan keyin `npm run typecheck` ishga tushiriladi. Kutilgan xato: `types.contract.ts` da `StepContent` kalitlari mos emas (`activities`, `task`, `submission`).

- [ ] **Step 3: `frontend/src/api/types.ts`.** `StepContent` dan oldin quyidagi tiplar qo'shiladi:

```ts
export type ActivityType = 'quiz' | 'yesno' | 'crossword'
export type TaskType = 'text' | 'file' | 'both'
export type SubmissionStatus = 'submitted' | 'graded' | 'returned'

export interface StudentLayoutWord {
  number: number
  row: number
  col: number
  direction: 'across' | 'down'
  length: number
  clue: string
}

export interface StudentLayout {
  rows: number
  cols: number
  words: StudentLayoutWord[]
}

export interface QuizItemView {
  text: string
  options: string[]
}

export interface YesNoItemView {
  statement: string
}

export interface ActivityView {
  id: number
  type: ActivityType
  title: string
  items: (QuizItemView | YesNoItemView)[]
  layout: StudentLayout | null
  best_percent: number | null
  attempts_count: number
}

export interface TaskView {
  id: number
  title: string
  description: string
  type: TaskType
  max_score: number
  rubric: string | null
  deadline: string | null
}

export interface SubmissionView {
  id: number
  status: SubmissionStatus
  text: string | null
  original_name: string | null
  file_url: string | null
  score: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  is_late: boolean
}
```

  `StepContent` interfeysiga quyidagi maydonlar qo'shiladi:

```ts
  activities: ActivityView[]
  task: TaskView | null
  submission: SubmissionView | null
```

- [ ] **Step 4: `types.contract.ts`** — `ResponseContract` ga qo'shiladi:

```ts
  Check<Receives<T.ActivityView, S['ActivityView']>>,
  Check<Receives<T.TaskView, S['TaskView']>>,
  Check<Receives<T.SubmissionView, S['SubmissionView']>>,
  Check<Receives<T.StudentLayout, S['StudentLayout']>>,
```

- [ ] **Step 5: `frontend/src/test/fixtures.ts`** — `stepContent()` qaytaradigan obyektga `activities: [], task: null, submission: null` qo'shiladi.

- [ ] **Step 6: Frontend tekshiruvi** (`frontend/`): `npm run lint && npm run typecheck && npm test && npm run build` → yashil. `git diff --stat src/api/schema.gen.ts` faqat generatsiya qilingan o'zgarishlarni ko'rsatishi kerak.

- [ ] **Step 7: E2E** (`frontend/`): `npm run e2e` → mavjud oqim o'tadi. Baholash oqimi E2E'ga 2B'da qo'shiladi.

- [ ] **Step 8: Hujjatlar.**
  - `CLAUDE.md` "Architecture (backend)" bo'limiga `app/assessment/` va `app/gamification/` haqida qisqa band qo'shiladi:
    - fayllar bo'linishi;
    - `award()` commit qilmaydi va unique cheklovga tayanadi;
    - talaba sxemalari `view_schemas.py` da turadi, import tsikli shu bilan oldi olinadi;
    - `sync_badges` lifespan'da va `app` fixture'ida chaqiriladi.
  - `docs/superpowers/roadmap.md`: "Hozirgi holat"da 2A bajarilgani, "Keyingi aniq qadam" — 2B frontend rejasi.

- [ ] **Step 9: Commit:** `chore: regenerate API types and document phase 2A` + CHANGELOG + hash commit. So'ng to'xtab, foydalanuvchidan push va PR ochish uchun ruxsat so'raladi.

---

## O'z-o'zini tekshirish (spec bilan solishtirish)

| Spec bo'limi | Task |
|---|---|
| 3. Modellar (assessment, gamification) | 1, 4 |
| 4. Kontent bor-yo'qligi | 6 |
| 4. Urinish, bosqichni tugatish, `best_score` | 7 |
| 4. Vazifa holatlari, kechikish, fayl | 8, 9 |
| 5. XP jadvali, `award`, seriya, nishonlar, `sync_badges` | 1, 2, 7, 8, 9 |
| 6. Krossvord algoritmi | 3, 5 |
| 7. O'qituvchi API (faoliyat, vazifa, javob, summary, stats) | 5, 8, 9, 10 |
| 7. Talaba API (bosqich, urinish, javob, fayl, dashboard, results, attempts) | 6, 7, 8, 10 |
| 9. Xato kodlari va ruxsatlar | 5–10 testlari |
| 9. Backend testlari, migratsiyalar | har task, 1, 4 |
| 8. Frontend, E2E baholash oqimi | 2B rejasi (bu reja doirasidan tashqari) |

