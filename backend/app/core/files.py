"""Yuklangan fayllar uchun umumiy yordamchilar: haqiqiy formatni tekshirish va faylni berish."""

import mimetypes
from pathlib import Path
from urllib.parse import quote

from fastapi import Response, UploadFile
from fastapi.responses import FileResponse

from app.core.config import Settings
from app.core.errors import AppError
from app.core.storage import Storage

# Kengaytma mos kelsa ham, fayl mazmuni boshqa formatda bo'lishi mumkin (masalan
# nomi o'zgartirilgan .exe). Har bir ruxsat etilgan kengaytma uchun "magic bytes"
# orqali haqiqiy formatni tekshiramiz.
FILE_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    ".pdf": (b"%PDF-",),
    ".pptx": (b"PK\x03\x04",),
    ".docx": (b"PK\x03\x04",),
    ".ppt": (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",),
    ".doc": (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1",),
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
}


ALLOWED_DOC_EXT = frozenset({".pdf", ".doc", ".docx", ".ppt", ".pptx"})
ALLOWED_IMAGE_EXT = frozenset({".jpg", ".jpeg", ".png", ".webp"})


def signature_matches(path: Path, ext: str) -> bool:
    with path.open("rb") as fh:
        header = fh.read(12)
    if ext == ".webp":  # RIFF....WEBP: imzo 8-baytdan keyin davom etadi
        return header[:4] == b"RIFF" and header[8:12] == b"WEBP"
    signatures = FILE_SIGNATURES.get(ext)
    if not signatures:
        return True
    return any(header.startswith(signature) for signature in signatures)


async def save_checked(
    storage: Storage, upload: UploadFile, subdir: str, *, allowed_ext: frozenset[str], max_mb: int
) -> tuple[str, str, int]:
    """Saqlaydi va magic bytes'ni tekshiradi; mos kelmasa faylni o'chirib 400. (rel, nom, hajm)."""
    rel, original_name = await storage.save_upload(
        upload, subdir, allowed_ext=allowed_ext, max_bytes=max_mb * 1024 * 1024
    )
    path = storage.path(rel)
    if not signature_matches(path, Path(rel).suffix.lower()):
        storage.delete(rel)
        raise AppError(400, "UNSUPPORTED_FILE_TYPE", "Fayl mazmuni e'lon qilingan turga mos emas")
    return rel, original_name, path.stat().st_size


def file_response(settings: Settings, storage: Storage, rel: str, filename: str) -> Response:
    """Himoyalangan faylni beradi: prod'da nginx orqali (X-Accel-Redirect), lokal muhitda
    to'g'ridan-to'g'ri."""
    media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    if settings.media_accel_redirect:
        # nginx faylni o'zi beradi, lekin asl nomini bilmaydi: sarlavhani FileResponse
        # bilan bir xil qilib shu yerda qo'yamiz (aks holda brauzer UUID nom bilan saqlaydi).
        return Response(
            media_type=media_type,
            headers={
                "X-Accel-Redirect": f"/protected-media/{rel}",
                "Content-Disposition": _attachment(filename),
            },
        )
    return FileResponse(storage.path(rel), media_type=media_type, filename=filename)


def _attachment(filename: str) -> str:
    """Starlette FileResponse'dagi kabi: lotin bo'lmagan nom RFC 5987 (filename*) bilan."""
    quoted = quote(filename)
    if quoted != filename:
        return f"attachment; filename*=utf-8''{quoted}"
    return f'attachment; filename="{filename}"'
