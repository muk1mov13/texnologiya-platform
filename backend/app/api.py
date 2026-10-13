from fastapi import APIRouter

from app.ai.router import router as ai_router
from app.ai.teach_router import router as ai_teach_router
from app.assessment.review_router import router as assessment_review_router
from app.assessment.router import router as assessment_router
from app.assessment.teach_router import router as assessment_teach_router
from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router
from app.learning.admin_router import router as admin_subjects_router
from app.learning.progress_router import router as progress_router
from app.learning.router import router as learning_router
from app.learning.teach_items_router import router as teach_items_router
from app.learning.teach_materials_router import router as teach_materials_router
from app.learning.teach_router import router as teach_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(admin_users_router)
api_router.include_router(admin_subjects_router)
api_router.include_router(teach_router)
api_router.include_router(teach_materials_router)
api_router.include_router(teach_items_router)
api_router.include_router(assessment_teach_router)
api_router.include_router(assessment_review_router)
api_router.include_router(learning_router)
api_router.include_router(progress_router)
api_router.include_router(assessment_router)
api_router.include_router(ai_router)
api_router.include_router(ai_teach_router)
