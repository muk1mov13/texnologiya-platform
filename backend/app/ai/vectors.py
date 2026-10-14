"""Vektor ombori: yozish ikkala bazada bir xil, qidiruv SQLite'da numpy, PostgreSQL'da pgvector."""

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
from sqlalchemy import ColumnElement, Float, bindparam, delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.constants import EMBEDDING_DIM
from app.ai.models import LIBRARY_SOURCES, ChunkSource, DocChunk
from app.core.types import Vector


@dataclass(frozen=True)
class ChunkRow:
    source_type: ChunkSource
    source_id: int
    subject_id: int | None
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


def _scope(topic_ids: Sequence[int], include_library: bool) -> ColumnElement[bool]:
    """Qidiruv doirasi: berilgan mavzular va (ixtiyoriy) mavzusiz kutubxona bo'laklari."""
    scope: ColumnElement[bool] = DocChunk.topic_id.in_(topic_ids)
    if include_library:
        scope = or_(scope, DocChunk.source_type.in_(LIBRARY_SOURCES))
    return scope


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
        include_library: bool = False,
    ) -> list[Hit]:
        raise NotImplementedError


class SqliteVectorStore(VectorStore):
    """Lokal muhit: nomzodlar SQL filtri bilan, o'xshashlik numpy bilan (normallashgan → dot)."""

    async def search(
        self,
        db: AsyncSession,
        vec: Sequence[float],
        *,
        source_types: Sequence[ChunkSource],
        topic_ids: Sequence[int],
        k: int,
        include_library: bool = False,
    ) -> list[Hit]:
        if not topic_ids and not include_library:
            return []
        rows = (
            await db.execute(
                select(*_COLUMNS, DocChunk.embedding).where(
                    DocChunk.source_type.in_(source_types), _scope(topic_ids, include_library)
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
        include_library: bool = False,
    ) -> list[Hit]:
        if not topic_ids and not include_library:
            return []
        query = bindparam("query_vec", list(vec), type_=Vector(EMBEDDING_DIM))
        distance = DocChunk.embedding.op("<=>", return_type=Float)(query)
        rows = (
            await db.execute(
                select(*_COLUMNS, distance.label("distance"))
                .where(DocChunk.source_type.in_(source_types), _scope(topic_ids, include_library))
                .order_by(distance)
                .limit(k)
            )
        ).all()
        return [
            Hit(r.source_type, r.source_id, r.topic_id, r.page, r.text, 1.0 - float(r.distance))
            for r in rows
        ]
