from fastapi import APIRouter, Response
from fastapi.responses import FileResponse

from app.auth.deps import ActiveUser
from app.core.deps import AppSettings, AppStorage, DbSession
from app.learning import resume
from app.learning.student_schemas import ContinueOut, SubjectProgressOut

router = APIRouter(tags=["learning"])


@router.get("/me/continue", response_model=ContinueOut | None)
async def continue_learning(user: ActiveUser, db: DbSession) -> ContinueOut | None:
    return await resume.continue_target(db, user)


@router.get("/me/progress", response_model=list[SubjectProgressOut])
async def my_progress(user: ActiveUser, db: DbSession) -> list[SubjectProgressOut]:
    return await resume.progress_summary(db, user)


@router.get("/materials/{material_id}/file", response_class=Response)
async def material_file(
    material_id: int,
    user: ActiveUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> Response:
    material = await resume.material_for_viewer(db, user, material_id)
    pdf_file = material.pdf_file or ""
    if settings.media_accel_redirect:
        # Prod: ruxsat API'da tekshiriladi, faylni nginx o'zi beradi (internal location).
        return Response(
            media_type="application/pdf",
            headers={"X-Accel-Redirect": f"/protected-media/{pdf_file}"},
        )
    return FileResponse(
        storage.path(pdf_file),
        media_type="application/pdf",
        filename=f"{material.title}.pdf",
        content_disposition_type="inline",
    )
