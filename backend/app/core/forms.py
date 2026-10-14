"""Multipart formalar uchun umumiy maydon tiplari (fayl bilan birga yuboriladigan matnlar)."""

from typing import Annotated

from fastapi import Form
from pydantic import AfterValidator


def reject_blank(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("Bo'sh bo'lishi mumkin emas")
    return stripped


TitleForm = Annotated[str, Form(min_length=1, max_length=200), AfterValidator(reject_blank)]
LongTitleForm = Annotated[str, Form(min_length=1, max_length=300), AfterValidator(reject_blank)]
