from fastapi import APIRouter, Response, UploadFile

from app.auth.deps import AdminUser
from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.forms import LongTitleForm
from app.core.types import DbIdPath
from app.library import documents, folders
from app.library.models import Document, Folder
from app.library.schemas import (
    DocumentOut,
    DocumentUpdate,
    FolderAdminOut,
    FolderIn,
    FolderUpdate,
)

router = APIRouter(prefix="/admin/library", tags=["admin-library"])


@router.post("/folders", response_model=FolderAdminOut, status_code=201)
async def create_folder(data: FolderIn, admin: AdminUser, db: DbSession) -> Folder:
    return await folders.create_folder(db, data)


@router.patch("/folders/{folder_id}", response_model=FolderAdminOut)
async def update_folder(
    folder_id: DbIdPath, data: FolderUpdate, admin: AdminUser, db: DbSession
) -> Folder:
    return await folders.update_folder(db, await folders.get_folder(db, folder_id), data)


@router.delete("/folders/{folder_id}", status_code=204)
async def delete_folder(folder_id: DbIdPath, admin: AdminUser, db: DbSession) -> Response:
    await folders.delete_folder(db, await folders.get_folder(db, folder_id))
    return Response(status_code=204)


@router.post("/folders/{folder_id}/documents", response_model=DocumentOut, status_code=201)
async def add_document(
    folder_id: DbIdPath,
    title: LongTitleForm,
    file: UploadFile,
    admin: AdminUser,
    db: DbSession,
    settings: AppSettings,
    storage: AppStorage,
) -> Document:
    return await documents.add_document(
        db, folder_id=folder_id, title=title, upload=file, storage=storage, settings=settings
    )


@router.patch("/documents/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: DbIdPath, data: DocumentUpdate, admin: AdminUser, db: DbSession
) -> Document:
    return await documents.update_document(db, await documents.get_document(db, document_id), data)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: DbIdPath, admin: AdminUser, db: DbSession, storage: AppStorage
) -> Response:
    rel = await documents.delete_document(db, await documents.get_document(db, document_id))
    storage.delete_quietly([rel])
    return Response(status_code=204)
