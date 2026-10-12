import logging
import shutil
import uuid
from collections.abc import Iterable
from pathlib import Path

from fastapi import UploadFile

from app.core.errors import AppError

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1024 * 1024
MAX_ORIGINAL_NAME_LENGTH = 255


def _truncate_filename(name: str, max_length: int = MAX_ORIGINAL_NAME_LENGTH) -> str:
    """`name`ni kengaytmasini saqlab, `max_length` belgigacha qisqartiradi."""
    if len(name) <= max_length:
        return name
    suffix = Path(name).suffix
    if len(suffix) >= max_length:
        return name[:max_length]
    stem = Path(name).stem
    return stem[: max_length - len(suffix)] + suffix


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
        raw_name = Path(upload.filename or "").name
        ext = Path(raw_name).suffix.lower()
        original_name = _truncate_filename(raw_name)
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

    def delete_quietly(self, rels: Iterable[str | None]) -> None:
        """Fayllarni o'chiradi; o'chirib bo'lmaganini (qulflangan, ruxsatsiz) faqat logga
        yozadi. Baza o'zgarishi allaqachon saqlangandan keyin chaqiriladi, shuning uchun
        so'rov 500'ga aylantirilmaydi."""
        for rel in rels:
            try:
                self.delete(rel)
            except OSError:
                logger.warning("Faylni o'chirib bo'lmadi: %s", rel)
