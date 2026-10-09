from fastapi import APIRouter

from app.auth.admin_router import router as admin_users_router
from app.auth.router import router as auth_router
from app.learning.admin_router import router as admin_subjects_router
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
api_router.include_router(learning_router)
