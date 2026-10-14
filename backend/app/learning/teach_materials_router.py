from fastapi import APIRouter, Response, UploadFile

from app.auth.deps import StaffUser
from app.core.deps import AppSettings, AppStorage, DbSession, Jobs
from app.core.forms import TitleForm
from app.core.types import DbIdPath
from app.learning import editing, materials
from app.learning.models import Material
from app.learning.schemas import MaterialOut

router = APIRouter(prefix="/teach", tags=["teach"])


@router.post("/steps/{step_id}/materials", response_model=MaterialOut, status_code=201)
async def upload_material(
    step_id: DbIdPath,
    title: TitleForm,
    file: UploadFile,
    user: StaffUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
    jobs: Jobs,
) -> Material:
    step, _topic = await editing.ensure_can_edit_step(db, user, step_id)
    return await materials.add_material(
        db,
        step=step,
        title=title,
        upload=file,
        user=user,
        storage=storage,
        settings=settings,
        jobs=jobs,
    )


@router.delete("/materials/{material_id}", status_code=204)
async def delete_material(
    material_id: DbIdPath, user: StaffUser, db: DbSession, storage: AppStorage
) -> Response:
    material = await materials.ensure_can_edit_material(db, user, material_id)
    await materials.delete_material(db, material, storage)
    return Response(status_code=204)


@router.post("/materials/{material_id}/retry", response_model=MaterialOut)
async def retry_material(
    material_id: DbIdPath, user: StaffUser, db: DbSession, jobs: Jobs
) -> Material:
    material = await materials.ensure_can_edit_material(db, user, material_id)
    return await materials.retry_material(db, material, jobs)
