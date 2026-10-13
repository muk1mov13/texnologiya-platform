"""PDF matnini sahifama-sahifa bo'laklarga bo'lish (sof funksiyalar, tokenizer'siz)."""

from dataclasses import dataclass
from pathlib import Path

import pymupdf

CHUNK_CHARS = 3200  # ~800 token
OVERLAP_CHARS = 400  # ~100 token
MIN_CHUNK_CHARS = 40


@dataclass(frozen=True)
class TextChunk:
    page: int | None
    text: str


def pdf_pages(path: Path) -> list[str]:
    with pymupdf.open(path) as doc:
        return [page.get_text() for page in doc]


def split_text(text: str) -> list[str]:
    """Bo'shliqlarni siqib, ~CHUNK_CHARS uzunlikda, so'z chegarasida, ustma-ust bo'laklar."""
    text = " ".join(text.split())
    pieces: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + CHUNK_CHARS)
        if end < len(text):
            cut = text.rfind(" ", start + CHUNK_CHARS // 2, end)
            if cut > start:
                end = cut
        piece = text[start:end].strip()
        if len(piece) >= MIN_CHUNK_CHARS:
            pieces.append(piece)
        if end >= len(text):
            break
        start = max(end - OVERLAP_CHARS, start + 1)
    return pieces


def chunk_pages(pages: list[str]) -> list[TextChunk]:
    """Bo'laklar sahifa chegarasidan o'tmaydi — iqtibosdagi sahifa raqami aniq bo'ladi."""
    return [
        TextChunk(page=number, text=piece)
        for number, page_text in enumerate(pages, start=1)
        for piece in split_text(page_text)
    ]
