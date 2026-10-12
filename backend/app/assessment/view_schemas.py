"""Talabaga ko'rinadigan sxemalar. Bu yerda to'g'ri javob maydonlari hech qachon bo'lmaydi.

`learning.student_schemas` shu modulni import qiladi, shuning uchun bu modul `learning`
sxemalarini import qilmaydi."""

from typing import Literal

from pydantic import BaseModel


class LayoutWord(BaseModel):
    number: int
    row: int
    col: int
    direction: Literal["across", "down"]
    length: int
