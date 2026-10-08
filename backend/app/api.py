from fastapi import APIRouter

from app.auth.router import router as auth_router

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
