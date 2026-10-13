from fastapi import APIRouter, Response

from app.auth.deps import AdminUser
from app.core.deps import AppStorage, DbSession
from app.core.types import DbIdPath
from app.learning import editing
from app.learning.schemas import SubjectAdminOut, SubjectCreate, SubjectUpdate, TeachersIn

router = APIRouter(prefix="/admin/subjects", tags=["admin"])


@router.get("", response_model=list[SubjectAdminOut])
async def list_subjects(admin: AdminUser, db: DbSession) -> list[SubjectAdminOut]:
    return await editing.list_subjects_admin(db)


@router.post("", response_model=SubjectAdminOut, status_code=201)
async def create_subject(data: SubjectCreate, admin: AdminUser, db: DbSession) -> SubjectAdminOut:
    subject = await editing.create_subject(db, data)
    return await editing.subject_admin_out(db, subject)


@router.patch("/{subject_id}", response_model=SubjectAdminOut)
async def update_subject(
    subject_id: DbIdPath, data: SubjectUpdate, admin: AdminUser, db: DbSession
) -> SubjectAdminOut:
    subject = await editing.get_subject(db, subject_id)
    subject = await editing.update_subject(db, subject, data)
    return await editing.subject_admin_out(db, subject)


@router.delete("/{subject_id}", status_code=204)
async def delete_subject(
    subject_id: DbIdPath, admin: AdminUser, db: DbSession, storage: AppStorage
) -> Response:
    subject = await editing.get_subject(db, subject_id)
    storage.delete_quietly(await editing.delete_subject(db, subject))
    return Response(status_code=204)


@router.put("/{subject_id}/teachers", response_model=SubjectAdminOut)
async def set_teachers(
    subject_id: DbIdPath, data: TeachersIn, admin: AdminUser, db: DbSession
) -> SubjectAdminOut:
    await editing.set_subject_teachers(db, subject_id, data.teacher_ids)
    return await editing.subject_admin_out(db, await editing.get_subject(db, subject_id))
