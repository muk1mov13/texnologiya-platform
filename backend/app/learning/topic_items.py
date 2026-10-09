from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.learning.editing import apply_update
from app.learning.models import GlossaryTerm, LiteratureItem
from app.learning.schemas import GlossaryIn, GlossaryUpdate, LiteratureIn, LiteratureUpdate

_LITERATURE_NULLABLE = frozenset({"year", "url"})


async def _next_order[ItemT: (GlossaryTerm, LiteratureItem)](
    db: AsyncSession, model: type[ItemT], topic_id: int
) -> int:
    current = await db.scalar(select(func.max(model.order)).where(model.topic_id == topic_id))
    return (current or 0) + 1


async def _get_owned[ItemT: (GlossaryTerm, LiteratureItem)](
    db: AsyncSession, model: type[ItemT], topic_id: int, item_id: int, code: str
) -> ItemT:
    item = await db.get(model, item_id)
    if item is None or item.topic_id != topic_id:
        raise AppError(404, code, "Element topilmadi")
    return item


async def list_glossary(db: AsyncSession, topic_id: int) -> list[GlossaryTerm]:
    return list(
        await db.scalars(
            select(GlossaryTerm)
            .where(GlossaryTerm.topic_id == topic_id)
            .order_by(GlossaryTerm.order, GlossaryTerm.id)
        )
    )


async def add_glossary_term(db: AsyncSession, topic_id: int, data: GlossaryIn) -> GlossaryTerm:
    term = GlossaryTerm(
        topic_id=topic_id,
        term=data.term.strip(),
        definition=data.definition.strip(),
        order=await _next_order(db, GlossaryTerm, topic_id),
    )
    db.add(term)
    await db.commit()
    return term


async def get_glossary_term(db: AsyncSession, topic_id: int, term_id: int) -> GlossaryTerm:
    return await _get_owned(db, GlossaryTerm, topic_id, term_id, "GLOSSARY_TERM_NOT_FOUND")


async def update_glossary_term(
    db: AsyncSession, term: GlossaryTerm, data: GlossaryUpdate
) -> GlossaryTerm:
    apply_update(term, data.model_dump(exclude_unset=True), frozenset())
    await db.commit()
    return term


async def list_literature(db: AsyncSession, topic_id: int) -> list[LiteratureItem]:
    return list(
        await db.scalars(
            select(LiteratureItem)
            .where(LiteratureItem.topic_id == topic_id)
            .order_by(LiteratureItem.order, LiteratureItem.id)
        )
    )


async def add_literature(db: AsyncSession, topic_id: int, data: LiteratureIn) -> LiteratureItem:
    item = LiteratureItem(
        topic_id=topic_id,
        title=data.title.strip(),
        author=data.author.strip(),
        year=data.year,
        url=data.url,
        order=await _next_order(db, LiteratureItem, topic_id),
    )
    db.add(item)
    await db.commit()
    return item


async def get_literature_item(db: AsyncSession, topic_id: int, item_id: int) -> LiteratureItem:
    return await _get_owned(db, LiteratureItem, topic_id, item_id, "LITERATURE_NOT_FOUND")


async def update_literature_item(
    db: AsyncSession, item: LiteratureItem, data: LiteratureUpdate
) -> LiteratureItem:
    apply_update(item, data.model_dump(exclude_unset=True), _LITERATURE_NULLABLE)
    await db.commit()
    return item


async def delete_item(db: AsyncSession, item: GlossaryTerm | LiteratureItem) -> None:
    await db.delete(item)
    await db.commit()
