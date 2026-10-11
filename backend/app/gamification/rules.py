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
