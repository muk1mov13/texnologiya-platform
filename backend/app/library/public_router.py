"""Kutubxonaning ochiq qismi: login talab qilinmaydi (spec 6 — "kutubxonaning ochiq qismi")."""

from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.core.deps import AppSettings, AppStorage, DbSession
from app.core.files import file_response
from app.core.types import DbIdPath
from app.library import documents, folders
from app.library.models import LibrarySection
from app.library.schemas import FolderOut

router = APIRouter(prefix="/library", tags=["library"])


@router.get("/folders", response_model=list[FolderOut])
async def folder_tree(
    db: DbSession, section: Annotated[LibrarySection, Query()]
) -> list[FolderOut]:
    return await folders.tree(db, section)


@router.get("/documents/{document_id}/file", response_class=Response)
async def document_file(
    document_id: DbIdPath, db: DbSession, settings: AppSettings, storage: AppStorage
) -> Response:
    document = await documents.get_document(db, document_id)
    return file_response(settings, storage, document.file, document.original_name)
