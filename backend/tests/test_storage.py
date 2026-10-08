import io
from pathlib import Path

import pytest
from fastapi import UploadFile

from app.core.errors import AppError
from app.core.storage import Storage

PDF_ONLY = frozenset({".pdf"})


def _upload(data: bytes, name: str) -> UploadFile:
    return UploadFile(file=io.BytesIO(data), filename=name)


async def test_save_upload_uses_uuid_name_and_lowercase_extension(tmp_path: Path) -> None:
    storage = Storage(tmp_path)
    rel, original = await storage.save_upload(
        _upload(b"%PDF-1.4", "Darslik 1.PDF"), "materials", allowed_ext=PDF_ONLY, max_bytes=1024
    )
    assert original == "Darslik 1.PDF"
    assert rel.startswith("materials/") and rel.endswith(".pdf")
    assert "Darslik" not in rel
    assert storage.path(rel).read_bytes() == b"%PDF-1.4"


async def test_save_upload_rejects_unknown_extension(tmp_path: Path) -> None:
    with pytest.raises(AppError) as exc:
        await Storage(tmp_path).save_upload(
            _upload(b"x", "virus.exe"), "materials", allowed_ext=PDF_ONLY, max_bytes=1024
        )
    assert exc.value.status_code == 400
    assert exc.value.code == "UNSUPPORTED_FILE_TYPE"


async def test_save_upload_rejects_too_large_and_cleans_up(tmp_path: Path) -> None:
    storage = Storage(tmp_path)
    with pytest.raises(AppError) as exc:
        await storage.save_upload(
            _upload(b"x" * 2048, "big.pdf"), "materials", allowed_ext=PDF_ONLY, max_bytes=1024
        )
    assert exc.value.status_code == 413
    assert exc.value.code == "FILE_TOO_LARGE"
    assert list((tmp_path / "materials").iterdir()) == []


def test_path_rejects_escaping_media_root(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        Storage(tmp_path / "media").path("../secret.txt")


def test_import_file_and_delete(tmp_path: Path) -> None:
    source = tmp_path / "source.pdf"
    source.write_bytes(b"data")
    storage = Storage(tmp_path / "media")
    rel = storage.import_file(source, "materials", ".pdf")
    assert storage.path(rel).read_bytes() == b"data"
    storage.delete(rel)
    assert not storage.path(rel).exists()
    storage.delete(None)
