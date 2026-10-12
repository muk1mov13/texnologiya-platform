from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

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


@dataclass
class Course:
    teacher: User
    student: User
    subject: Subject
    topic1: Topic
    topic2: Topic
    hidden_topic: Topic
    teacher_headers: dict[str, str]
    student_headers: dict[str, str]
    material_ids: dict[str, int]


async def build_course(client: AsyncClient, db: AsyncSession, settings: Settings) -> Course:
    """Nashr qilingan fan: topic1 (bayon PDF + glossariy), topic2 (bayon PDF),
    hidden_topic (nashr qilinmagan, bayon PDF). Talaba uchun kontentli bosqichlar soni: 3."""
    teacher = await make_user(
        db, email="ustoz@mail.uz", role=Role.teacher, full_name="Nozima Hamdamova"
    )
    student = await make_user(db, email="talaba@mail.uz", full_name="Dilnoza Karimova")
    subject = await make_subject(db, teachers=[teacher])
    topic1 = await make_topic(db, subject, title="1-mavzu")
    topic2 = await make_topic(db, subject, title="2-mavzu")
    hidden = await make_topic(db, subject, title="Qoralama mavzu", published=False)
    teacher_headers = auth_headers(teacher, settings)

    material_ids: dict[str, int] = {}
    for key, topic in (("topic1", topic1), ("topic2", topic2), ("hidden", hidden)):
        lecture = await step_of(db, topic, StepKind.lecture)
        material = await add_ready_pdf(client, teacher_headers, lecture.id)
        material_ids[key] = int(str(material["id"]))

    response = await client.post(
        f"/api/teach/topics/{topic1.id}/glossary",
        headers=teacher_headers,
        json={"term": "Kasb", "definition": "Mehnat faoliyati turi"},
    )
    assert response.status_code == 201, response.text

    return Course(
        teacher=teacher,
        student=student,
        subject=subject,
        topic1=topic1,
        topic2=topic2,
        hidden_topic=hidden,
        teacher_headers=teacher_headers,
        student_headers=auth_headers(student, settings),
        material_ids=material_ids,
    )


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
