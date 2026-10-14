"""Kutubxona papkalari: daraxt va CRUD. Bo'sh bo'lmagan papka o'chirilmaydi."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.library.models import Document, Folder, LibrarySection
from app.library.schemas import DocumentOut, FolderIn, FolderOut, FolderUpdate


async def get_folder(db: AsyncSession, folder_id: int) -> Folder:
    folder = await db.get(Folder, folder_id)
    if folder is None:
        raise AppError(404, "FOLDER_NOT_FOUND", "Papka topilmadi")
    return folder


async def tree(db: AsyncSession, section: LibrarySection) -> list[FolderOut]:
    """Bo'limning butun daraxti ikki so'rov bilan: papkalar va ulardagi hujjatlar."""
    folders = list(
        await db.scalars(
            select(Folder).where(Folder.section == section).order_by(Folder.order, Folder.id)
        )
    )
    ids = [f.id for f in folders]
    docs = (
        list(
            await db.scalars(
                select(Document)
                .where(Document.folder_id.in_(ids))
                .order_by(Document.title, Document.id)
            )
        )
        if ids
        else []
    )
    nodes = {
        f.id: FolderOut(
            id=f.id, parent_id=f.parent_id, section=f.section, title=f.title, order=f.order
        )
        for f in folders
    }
    for doc in docs:
        nodes[doc.folder_id].documents.append(DocumentOut.model_validate(doc))
    roots: list[FolderOut] = []
    for f in folders:
        parent = nodes.get(f.parent_id) if f.parent_id is not None else None
        (parent.children if parent else roots).append(nodes[f.id])
    return roots


async def create_folder(db: AsyncSession, data: FolderIn) -> Folder:
    if data.parent_id is not None:
        parent = await get_folder(db, data.parent_id)
        if parent.section != data.section:
            raise AppError(
                400, "FOLDER_SECTION_MISMATCH", "Ichki papka boshqa bo'limda bo'la olmaydi"
            )
    folder = Folder(**data.model_dump())
    db.add(folder)
    await db.commit()
    return folder


async def update_folder(db: AsyncSession, folder: Folder, data: FolderUpdate) -> Folder:
    for key, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(folder, key, value)
    await db.commit()
    return folder


async def delete_folder(db: AsyncSession, folder: Folder) -> None:
    children = await db.scalar(
        select(func.count()).select_from(Folder).where(Folder.parent_id == folder.id)
    )
    docs = await db.scalar(
        select(func.count()).select_from(Document).where(Document.folder_id == folder.id)
    )
    if children or docs:
        raise AppError(409, "FOLDER_NOT_EMPTY", "Papka bo'sh emas")
    await db.delete(folder)
    await db.commit()
