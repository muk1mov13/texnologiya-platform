from typing import Annotated

from fastapi import APIRouter, Body, Response

from app.ai.indexing import enqueue_questions_for_step
from app.assessment import activities, tasks
from app.assessment.models import Task
from app.assessment.schemas import (
    ActivityIn,
    ActivityOrderIn,
    ActivityPublishIn,
    ActivityTeachOut,
    TaskIn,
    TaskOut,
)
from app.auth.deps import StaffUser
from app.core.deps import AppStorage, DbSession, Jobs
from app.core.types import DbIdPath

router = APIRouter(prefix="/teach", tags=["teach"])

ActivityBody = Annotated[ActivityIn, Body(discriminator="type")]


@router.get("/steps/{step_id}/activities", response_model=list[ActivityTeachOut])
async def list_activities(
    step_id: DbIdPath, user: StaffUser, db: DbSession
) -> list[ActivityTeachOut]:
    step = await activities.activity_step(db, user, step_id)
    return await activities.teach_out(db, await activities.list_step_activities(db, step.id))


@router.post("/steps/{step_id}/activities", response_model=ActivityTeachOut, status_code=201)
async def create_activity(
    step_id: DbIdPath, data: ActivityBody, user: StaffUser, db: DbSession, jobs: Jobs
) -> ActivityTeachOut:
    step = await activities.activity_step(db, user, step_id)
    activity = await activities.create_activity(db, step, data)
    await enqueue_questions_for_step(db, jobs, step.id)
    return (await activities.teach_out(db, [activity]))[0]


@router.put("/steps/{step_id}/activities/order", response_model=list[ActivityTeachOut])
async def reorder_activities(
    step_id: DbIdPath, data: ActivityOrderIn, user: StaffUser, db: DbSession
) -> list[ActivityTeachOut]:
    step = await activities.activity_step(db, user, step_id)
    ordered = await activities.reorder_activities(db, step.id, data.ids)
    return await activities.teach_out(db, ordered)


@router.put("/activities/{activity_id}", response_model=ActivityTeachOut)
async def update_activity(
    activity_id: DbIdPath, data: ActivityBody, user: StaffUser, db: DbSession, jobs: Jobs
) -> ActivityTeachOut:
    activity = await activities.ensure_can_edit_activity(db, user, activity_id)
    activity = await activities.update_activity(db, activity, data)
    await enqueue_questions_for_step(db, jobs, activity.step_id)
    return (await activities.teach_out(db, [activity]))[0]


@router.patch("/activities/{activity_id}", response_model=ActivityTeachOut)
async def publish_activity(
    activity_id: DbIdPath, data: ActivityPublishIn, user: StaffUser, db: DbSession, jobs: Jobs
) -> ActivityTeachOut:
    activity = await activities.ensure_can_edit_activity(db, user, activity_id)
    activity = await activities.set_published(db, activity, data.is_published)
    await enqueue_questions_for_step(db, jobs, activity.step_id)
    return (await activities.teach_out(db, [activity]))[0]


@router.delete("/activities/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: DbIdPath, user: StaffUser, db: DbSession, jobs: Jobs
) -> Response:
    activity = await activities.ensure_can_edit_activity(db, user, activity_id)
    step_id = activity.step_id  # o'chirilgandan keyin obyekt atributlari o'qilmaydi
    await activities.delete_activity(db, activity)
    await enqueue_questions_for_step(db, jobs, step_id)
    return Response(status_code=204)


@router.get("/steps/{step_id}/task", response_model=TaskOut | None)
async def get_task(step_id: DbIdPath, user: StaffUser, db: DbSession) -> Task | None:
    step = await tasks.task_step(db, user, step_id)
    return await tasks.get_step_task(db, step.id)


@router.put("/steps/{step_id}/task", response_model=TaskOut)
async def upsert_task(
    step_id: DbIdPath, data: TaskIn, user: StaffUser, db: DbSession, jobs: Jobs
) -> Task:
    step = await tasks.task_step(db, user, step_id)
    task = await tasks.upsert_task(db, step, data)
    await enqueue_questions_for_step(db, jobs, step.id)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: DbIdPath, user: StaffUser, db: DbSession, storage: AppStorage, jobs: Jobs
) -> Response:
    task = await tasks.ensure_can_edit_task(db, user, task_id)
    step_id = task.step_id  # o'chirilgandan keyin obyekt atributlari o'qilmaydi
    storage.delete_quietly(await tasks.delete_task(db, task))
    await enqueue_questions_for_step(db, jobs, step_id)
    return Response(status_code=204)
