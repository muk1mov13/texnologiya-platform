"""`ai-coverage` CLI: mavzuning barcha fayllari repetitor indeksiga tushganini ko'rsatadi.

Har mavzu bo'yicha materiallar (holati, bo'laklar soni, eskirgan model), glossariy va
`topic_info` bo'laklari sanaladi; muammolar matn ko'rinishida qaytariladi.
"""

from collections import Counter
from dataclasses import dataclass, field

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.models import ChunkSource, DocChunk
from app.ai.services import build_ai
from app.core.config import Settings
from app.core.db import make_engine, make_sessionmaker
from app.learning.models import GlossaryTerm, Material, MaterialStatus, Step, Subject, Topic

_COUNTED = (ChunkSource.material, ChunkSource.glossary, ChunkSource.topic_info)


@dataclass
class MaterialCoverage:
    title: str
    status: MaterialStatus
    error: str | None
    chunks: int
    stale: int


@dataclass
class TopicCoverage:
    subject: str
    title: str
    published: bool
    materials: list[MaterialCoverage] = field(default_factory=list)
    glossary_terms: int = 0
    glossary_chunks: int = 0
    info_chunks: int = 0
    stale: int = 0

    @property
    def problems(self) -> list[str]:
        out: list[str] = []
        for m in self.materials:
            if m.status == MaterialStatus.failed:
                out.append(f"«{m.title}» PDF'ga o'girilmagan ({m.error or '-'})")
            elif m.status == MaterialStatus.processing:
                out.append(f"«{m.title}» hali qayta ishlanmoqda")
            elif m.chunks == 0:
                out.append(f"«{m.title}» indeksda yo'q (matnsiz PDF yoki indekslanmagan)")
        if not any(m.status == MaterialStatus.ready for m in self.materials):
            out.append("tayyor o'quv materiali yo'q")
        if self.glossary_terms and not self.glossary_chunks:
            out.append("glossariy indekslanmagan")
        if not self.info_chunks:
            out.append("mavzu haqidagi bo'lak yo'q")
        if self.stale:
            out.append(f"{self.stale} ta bo'lak eski model bilan (qayta indekslash kerak)")
        return out


async def topic_coverage(
    db: AsyncSession, model_name: str, subject_id: int | None = None
) -> list[TopicCoverage]:
    chunk_rows = await db.execute(
        select(
            DocChunk.source_type,
            DocChunk.source_id,
            func.count(),
            func.sum(case((DocChunk.embedding_model != model_name, 1), else_=0)),
        )
        .where(DocChunk.source_type.in_(_COUNTED))
        .group_by(DocChunk.source_type, DocChunk.source_id)
    )
    chunks = {(s, i): (n, int(stale or 0)) for s, i, n, stale in chunk_rows}
    term_rows = await db.execute(
        select(GlossaryTerm.topic_id, func.count()).group_by(GlossaryTerm.topic_id)
    )
    terms = Counter({topic_id: n for topic_id, n in term_rows})

    stmt = (
        select(Topic.id, Topic.title, Topic.is_published, Subject.title)
        .join(Subject, Subject.id == Topic.subject_id)
        .order_by(Subject.order, Subject.id, Topic.order, Topic.id)
    )
    if subject_id is not None:
        stmt = stmt.where(Topic.subject_id == subject_id)
    topics: dict[int, TopicCoverage] = {}
    for topic_id, title, published, subject in await db.execute(stmt):
        glossary = chunks.get((ChunkSource.glossary, topic_id), (0, 0))
        info = chunks.get((ChunkSource.topic_info, topic_id), (0, 0))
        topics[topic_id] = TopicCoverage(
            subject=subject,
            title=title,
            published=published,
            glossary_terms=terms[topic_id],
            glossary_chunks=glossary[0],
            info_chunks=info[0],
            stale=glossary[1] + info[1],
        )

    materials = await db.execute(
        select(Step.topic_id, Material.id, Material.title, Material.status, Material.error)
        .join(Step, Step.id == Material.step_id)
        .where(Step.topic_id.in_(topics))
        .order_by(Step.topic_id, Material.id)
    )
    for topic_id, material_id, title, status, error in materials:
        count, stale = chunks.get((ChunkSource.material, material_id), (0, 0))
        topic = topics[topic_id]
        topic.materials.append(MaterialCoverage(title, status, error, count, stale))
        topic.stale += stale
    return list(topics.values())


async def run_coverage(settings: Settings, subject_id: int | None) -> list[TopicCoverage]:
    engine = make_engine(settings.database_url)
    try:
        model_name = build_ai(settings, engine.dialect.name).embedder.model_name
        async with make_sessionmaker(engine)() as db:
            return await topic_coverage(db, model_name, subject_id)
    finally:
        await engine.dispose()
