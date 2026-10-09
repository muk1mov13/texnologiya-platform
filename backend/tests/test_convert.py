import subprocess
from pathlib import Path

import pymupdf
import pytest

from app.learning import convert
from tests.factories import make_pdf_bytes


async def test_convert_uses_isolated_libreoffice_profile(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    soffice = tmp_path / "soffice"
    soffice.write_text("fake")
    source = tmp_path / "slides.pptx"
    source.write_bytes(b"fake")
    out_dir = tmp_path / "out"
    out_dir.mkdir()
    captured: dict[str, list[str]] = {}

    def fake_run(
        command: list[str], *, capture_output: bool, timeout: int, check: bool
    ) -> subprocess.CompletedProcess[bytes]:
        captured["command"] = command
        (out_dir / f"{source.stem}.pdf").write_bytes(make_pdf_bytes(1))
        return subprocess.CompletedProcess(command, 0)

    monkeypatch.setattr(convert.subprocess, "run", fake_run)

    await convert.convert_to_pdf(source, out_dir, soffice=str(soffice), timeout=5)

    profile_arg = next(a for a in captured["command"] if a.startswith("-env:UserInstallation="))
    expected = f"-env:UserInstallation={(out_dir / 'lo-profile').resolve().as_uri()}"
    assert profile_arg == expected


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


def test_count_pages_rejects_encrypted_pdf(tmp_path: Path) -> None:
    pdf = tmp_path / "secret.pdf"
    document = pymupdf.open()
    document.new_page()
    document.save(pdf, encryption=pymupdf.PDF_ENCRYPT_AES_256, user_pw="x", owner_pw="y")
    document.close()
    with pytest.raises(convert.ConversionError) as exc:
        convert.count_pages(pdf)
    assert exc.value.code == "INVALID_PDF"
