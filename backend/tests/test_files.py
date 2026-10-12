from pathlib import Path

import pytest

from app.core.files import signature_matches


@pytest.mark.parametrize(
    ("ext", "header", "ok"),
    [
        (".png", b"\x89PNG\r\n\x1a\n" + b"0" * 8, True),
        (".jpg", b"\xff\xd8\xff\xe0" + b"0" * 8, True),
        (".jpeg", b"\xff\xd8\xff\xdb" + b"0" * 8, True),
        (".pdf", b"%PDF-1.7" + b"0" * 8, True),
        (".png", b"%PDF-1.7" + b"0" * 8, False),
        (".docx", b"MZ\x90\x00" + b"0" * 8, False),
    ],
)
def test_signature_matches(tmp_path: Path, ext: str, header: bytes, ok: bool) -> None:
    path = tmp_path / f"file{ext}"
    path.write_bytes(header)
    assert signature_matches(path, ext) is ok
