from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.types import DbId, Order31, trimmed_str
from app.library.models import LibrarySection

# --- papkalar va hujjatlar ------------------------------------------------------------------


class FolderIn(BaseModel):
    section: LibrarySection
    parent_id: DbId | None = None
    title: trimmed_str(max_length=200)  # type: ignore[valid-type]
    order: Order31 = 0


class FolderUpdate(BaseModel):
    title: trimmed_str(max_length=200) | None = None  # type: ignore[valid-type]
    order: Order31 | None = None


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    folder_id: int
    title: str
    original_name: str
    size: int
    created_at: datetime


class FolderOut(BaseModel):
    """Daraxt tuguni: ichki papkalar va hujjatlar bilan."""

    id: int
    parent_id: int | None
    section: LibrarySection
    title: str
    order: int
    documents: list[DocumentOut] = Field(default_factory=list)
    children: list["FolderOut"] = Field(default_factory=list)


class FolderAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int | None
    section: LibrarySection
    title: str
    order: int


class DocumentUpdate(BaseModel):
    title: trimmed_str(max_length=300) | None = None  # type: ignore[valid-type]
    folder_id: DbId | None = None
