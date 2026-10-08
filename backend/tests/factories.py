from collections.abc import Sequence

import pymupdf
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User, UserStatus
from app.core.config import Settings
from app.core.security import create_access_token, hash_password
from app.learning import editing
from app.learning.models import Step, StepKind, Subject, Topic
from app.learning.schemas import SubjectCreate, TopicCreate

DEFAULT_PASSWORD = "parol1234"


async def make_user(
    db: AsyncSession,
    *,
    email: str = "ali@mail.uz",
    password: str = DEFAULT_PASSWORD,
    role: Role = Role.student,
    status: UserStatus = UserStatus.active,
    full_name: str = "Ali Valiyev",
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role,
        status=status,
        full_name=full_name,
    )
    db.add(user)
    await db.commit()
    return user


def auth_headers(user: User, settings: Settings) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role, settings)}"}


async def make_subject(
    db: AsyncSession,
    *,
    title: str = "Kasb tanlash",
    published: bool = True,
    teachers: Sequence[User] = (),
    order: int = 0,
) -> Subject:
    subject = await editing.create_subject(
        db, SubjectCreate(title=title, is_published=published, order=order)
    )
    if teachers:
        await editing.set_subject_teachers(db, subject.id, [t.id for t in teachers])
    return subject


async def make_topic(
    db: AsyncSession, subject: Subject, *, title: str = "1-mavzu", published: bool = True
) -> Topic:
    return await editing.create_topic(
        db, subject.id, TopicCreate(title=title, is_published=published)
    )


async def step_of(db: AsyncSession, topic: Topic, kind: StepKind) -> Step:
    step = await db.scalar(select(Step).where(Step.topic_id == topic.id, Step.kind == kind))
    assert step is not None
    return step


def make_pdf_bytes(pages: int = 2) -> bytes:
    document = pymupdf.open()
    for _ in range(pages):
        document.new_page()
    data = document.tobytes()
    document.close()
    return data


async def add_ready_pdf(
    client: AsyncClient,
    headers: dict[str, str],
    step_id: int,
    *,
    title: str = "Mavzu bayoni",
    pages: int = 2,
) -> dict[str, object]:
    response = await client.post(
        f"/api/teach/steps/{step_id}/materials",
        headers=headers,
        data={"title": title},
        files={"file": ("bayon.pdf", make_pdf_bytes(pages), "application/pdf")},
    )
    assert response.status_code == 201, response.text
    body: dict[str, object] = response.json()
    return body
