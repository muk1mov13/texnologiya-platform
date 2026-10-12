"""Yuklangan fayllar uchun umumiy yordamchilar: haqiqiy formatni tekshirish va faylni berish."""

import mimetypes
from pathlib import Path

from fastapi import Response
from fastapi.responses import FileResponse

from app.core.config import Settings
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


def signature_matches(path: Path, ext: str) -> bool:
    signatures = FILE_SIGNATURES.get(ext)
    if not signatures:
        return True
    with path.open("rb") as fh:
        header = fh.read(8)
    return any(header.startswith(signature) for signature in signatures)


def file_response(settings: Settings, storage: Storage, rel: str, filename: str) -> Response:
    """Himoyalangan faylni beradi: prod'da nginx orqali (X-Accel-Redirect), lokal muhitda
    to'g'ridan-to'g'ri."""
    media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    if settings.media_accel_redirect:
        return Response(
            media_type=media_type, headers={"X-Accel-Redirect": f"/protected-media/{rel}"}
        )
    return FileResponse(storage.path(rel), media_type=media_type, filename=filename)
