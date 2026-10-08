from pathlib import Path

import pytest

from app.learning import convert
from tests.factories import make_pdf_bytes


async def test_missing_libreoffice_is_reported(tmp_path: Path) -> None:
    source = tmp_path / "slides.pptx"
    source.write_bytes(b"fake")
    with pytest.raises(convert.ConversionError) as exc:
        await convert.convert_to_pdf(
            source, tmp_path, soffice=str(tmp_path / "no-soffice.exe"), timeout=5
        )
    assert exc.value.code == "LIBREOFFICE_NOT_FOUND"


def test_count_pages(tmp_path: Path) -> None:
    pdf = tmp_path / "doc.pdf"
    pdf.write_bytes(make_pdf_bytes(5))
    assert convert.count_pages(pdf) == 5


def test_count_pages_rejects_garbage(tmp_path: Path) -> None:
    broken = tmp_path / "broken.pdf"
    broken.write_bytes(b"this is not a pdf")
    with pytest.raises(convert.ConversionError) as exc:
        convert.count_pages(broken)
    assert exc.value.code == "INVALID_PDF"
