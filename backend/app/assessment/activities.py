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
            select(Activity)
            .where(Activity.step_id == step_id)
            .order_by(Activity.order, Activity.id)
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
        raise AppError(400, "INVALID_ORDER", "Faoliyatlar ro'yxati bosqich faoliyatlariga mos emas")
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
