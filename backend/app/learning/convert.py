import asyncio
import logging
import shutil
import subprocess
from pathlib import Path

import pymupdf

logger = logging.getLogger(__name__)


class ConversionError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


def resolve_soffice(soffice: str) -> str | None:
    found = shutil.which(soffice)
    if found:
        return found
    return soffice if Path(soffice).is_file() else None


async def convert_to_pdf(
    source: Path,
    out_dir: Path,
    *,
    soffice: str,
    timeout: int,  # noqa: ASYNC109 (subprocess uchun, asyncio scope emas)
) -> Path:
    """LibreOffice (headless) yordamida PPT/PPTX/DOC/DOCX faylni PDF'ga aylantiradi."""
    return await convert_to(source, out_dir, "pdf", soffice=soffice, timeout=timeout)


async def convert_to(
    source: Path,
    out_dir: Path,
    fmt: str,
    *,
    soffice: str,
    timeout: int,  # noqa: ASYNC109 (subprocess uchun, asyncio scope emas)
) -> Path:
    """LibreOffice (headless) yordamida faylni `fmt` formatiga (pdf, docx, ...) aylantiradi."""
    executable = resolve_soffice(soffice)
    if executable is None:
        raise ConversionError("LIBREOFFICE_NOT_FOUND")
    # Har bir konvertatsiya o'ziga xos profil bilan ishga tushadi: parallel yoki
    # timeout bo'lib qolgan jarayonlar standart profil qulfini bo'lishib olmaydi.
    profile_dir = (out_dir / "lo-profile").resolve()
    command = [
        executable,
        f"-env:UserInstallation={profile_dir.as_uri()}",
        "--headless",
        "--norestore",
        "--convert-to",
        fmt,
        "--outdir",
        str(out_dir),
        str(source),
    ]
    try:
        # Windows'da ham ishonchli ishlashi uchun subprocess alohida thread'da ishga tushiriladi.
        result = await asyncio.to_thread(
            subprocess.run, command, capture_output=True, timeout=timeout, check=False
        )
    except subprocess.TimeoutExpired as exc:
        raise ConversionError("CONVERSION_TIMEOUT") from exc
    output = out_dir / f"{source.stem}.{fmt}"
    if result.returncode != 0 or not output.is_file():
        # Fayl nomi emas, faqat soffice javobi yoziladi — sababini journalctl'da ko'rish uchun.
        stderr = result.stderr.decode(errors="replace").strip()
        logger.warning(
            "LibreOffice konvertatsiyasi muvaffaqiyatsiz: rc=%s, stderr=%s",
            result.returncode,
            stderr[-500:],
        )
        raise ConversionError("CONVERSION_FAILED")
    return output


def count_pages(pdf: Path) -> int:
    try:
        with pymupdf.open(pdf) as document:
            if not document.is_pdf:
                raise ConversionError("INVALID_PDF")
            if document.needs_pass or document.page_count == 0:
                raise ConversionError("INVALID_PDF")
            return int(document.page_count)
    except ConversionError:
        raise
    except Exception as exc:
        raise ConversionError("INVALID_PDF") from exc
