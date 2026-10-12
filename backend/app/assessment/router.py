from fastapi import APIRouter

from app.assessment import attempts
from app.assessment.schemas import AttemptIn, AttemptOut
from app.auth.deps import ActiveUser
from app.core.deps import DbSession
from app.core.types import DbIdPath

router = APIRouter(tags=["assessment"])


@router.post("/activities/{activity_id}/attempts", response_model=AttemptOut, status_code=201)
async def submit_attempt(
    activity_id: DbIdPath, data: AttemptIn, user: ActiveUser, db: DbSession
) -> AttemptOut:
    return await attempts.submit_attempt(db, user, activity_id, data)
