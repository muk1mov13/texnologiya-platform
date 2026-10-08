import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.errors import AppError

CHUNK_SIZE = 1024 * 1024


class Storage:
    """Media fayllarini `root` ichida tasodifiy (UUID) nomlar bilan saqlaydi."""

    def __init__(self, root: Path) -> None:
        self.root = root.resolve()

    def path(self, rel: str) -> Path:
        resolved = (self.root / rel).resolve()
        if not resolved.is_relative_to(self.root):
            raise ValueError("path escapes media root")
        return resolved

    def _new_rel(self, subdir: str, ext: str) -> str:
        return f"{subdir}/{uuid.uuid4().hex}{ext}"

    async def save_upload(
        self,
        upload: UploadFile,
        subdir: str,
        *,
        allowed_ext: frozenset[str],
        max_bytes: int,
    ) -> tuple[str, str]:
        original_name = Path(upload.filename or "").name
        ext = Path(original_name).suffix.lower()
        if ext not in allowed_ext:
            raise AppError(
                400,
                "UNSUPPORTED_FILE_TYPE",
                "Bu turdagi fayl qabul qilinmaydi",
                {"allowed": sorted(allowed_ext)},
            )
        rel = self._new_rel(subdir, ext)
        destination = self.path(rel)
        destination.parent.mkdir(parents=True, exist_ok=True)
        size = 0
        try:
            with destination.open("wb") as fh:
                while chunk := await upload.read(CHUNK_SIZE):
                    size += len(chunk)
                    if size > max_bytes:
                        raise AppError(
                            413, "FILE_TOO_LARGE", "Fayl hajmi juda katta", {"max_bytes": max_bytes}
                        )
                    fh.write(chunk)
        except BaseException:
            destination.unlink(missing_ok=True)
            raise
        return rel, original_name or f"file{ext}"

    def import_file(self, source: Path, subdir: str, ext: str) -> str:
        rel = self._new_rel(subdir, ext)
        destination = self.path(rel)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        return rel

    def delete(self, rel: str | None) -> None:
        if rel:
            self.path(rel).unlink(missing_ok=True)
