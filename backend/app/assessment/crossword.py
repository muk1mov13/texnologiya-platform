"""Krossvord: so'zlarni normallashtirish va to'rni deterministik "ochko'z" algoritm bilan qurish.

Bazaga bog'liq emas, faqat sof funksiyalar."""

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, Literal

Direction = Literal["across", "down"]
ACROSS: Direction = "across"
DOWN: Direction = "down"

APOSTROPHES = "'ʻʼ’‘`"
MODIFIER = "ʻ"
DIGRAPH_BASES = ("O", "G")
MIN_CELLS = 2
MAX_CELLS = 20

Pos = tuple[int, int]


class InvalidWordError(ValueError):
    def __init__(self, word: str) -> None:
        super().__init__(word)
        self.word = word


class UnplaceableError(ValueError):
    def __init__(self, indexes: list[int]) -> None:
        super().__init__(indexes)
        self.indexes = indexes


def normalize_word(raw: str) -> list[str]:
    """So'zni kataklar ro'yxatiga aylantiradi: katta harf, Oʻ va Gʻ bitta katak."""
    text = raw.strip().upper()
    for mark in APOSTROPHES:
        text = text.replace(mark, MODIFIER)
    cells: list[str] = []
    for char in text:
        # MODIFIER (U+02BB) `isalpha()` uchun harf hisoblanadi, shuning uchun avval tekshiriladi.
        if char == MODIFIER:
            if cells and cells[-1] in DIGRAPH_BASES:
                cells[-1] += MODIFIER
                continue
            raise InvalidWordError(raw)
        if not char.isalpha():
            raise InvalidWordError(raw)
        cells.append(char)
    if not cells:
        raise InvalidWordError(raw)
    return cells


def word_matches(answer: str, cells: Sequence[str]) -> bool:
    try:
        return normalize_word(answer) == list(cells)
    except InvalidWordError:
        return False


@dataclass(frozen=True)
class PlacedWord:
    index: int  # kiritilgan ro'yxatdagi o'rni
    number: int
    row: int
    col: int
    direction: Direction
    cells: tuple[str, ...]


@dataclass(frozen=True)
class Layout:
    rows: int
    cols: int
    words: tuple[PlacedWord, ...]  # raqam bo'yicha, teng bo'lsa avval gorizontal


def _step(direction: Direction) -> Pos:
    return (0, 1) if direction == ACROSS else (1, 0)


def _direction_rank(direction: Direction) -> int:
    return 0 if direction == ACROSS else 1


class _Grid:
    def __init__(self) -> None:
        self.letters: dict[Pos, str] = {}
        self.dirs: dict[Pos, set[Direction]] = {}

    def put(self, cells: Sequence[str], row: int, col: int, direction: Direction) -> None:
        dr, dc = _step(direction)
        for k, char in enumerate(cells):
            pos = (row + dr * k, col + dc * k)
            self.letters[pos] = char
            self.dirs.setdefault(pos, set()).add(direction)

    def crossings(
        self, cells: Sequence[str], row: int, col: int, direction: Direction
    ) -> int | None:
        """Joy yaroqli bo'lsa kesishmalar sonini, aks holda None qaytaradi."""
        dr, dc = _step(direction)
        size = len(cells)
        before = (row - dr, col - dc)
        after = (row + dr * size, col + dc * size)
        if before in self.letters or after in self.letters:
            return None
        count = 0
        for k, char in enumerate(cells):
            r, c = row + dr * k, col + dc * k
            existing = self.letters.get((r, c))
            if existing is not None:
                if existing != char or direction in self.dirs[(r, c)]:
                    return None
                count += 1
            elif (r + dc, c + dr) in self.letters or (r - dc, c - dr) in self.letters:
                return None
        return count or None

    def area_with(self, cells: Sequence[str], row: int, col: int, direction: Direction) -> int:
        dr, dc = _step(direction)
        last = (row + dr * (len(cells) - 1), col + dc * (len(cells) - 1))
        rows = [r for r, _ in self.letters] + [row, last[0]]
        cols = [c for _, c in self.letters] + [col, last[1]]
        return (max(rows) - min(rows) + 1) * (max(cols) - min(cols) + 1)


def _candidates(
    placed: Sequence[tuple[int, int, Direction, Sequence[str]]], cells: Sequence[str]
) -> set[tuple[int, int, Direction]]:
    result: set[tuple[int, int, Direction]] = set()
    for p_row, p_col, p_dir, p_cells in placed:
        dr, dc = _step(p_dir)
        new_dir: Direction = DOWN if p_dir == ACROSS else ACROSS
        ndr, ndc = _step(new_dir)
        for i, letter in enumerate(p_cells):
            r, c = p_row + dr * i, p_col + dc * i
            for j, char in enumerate(cells):
                if char == letter:
                    result.add((r - ndr * j, c - ndc * j, new_dir))
    return result


def build_layout(words: Sequence[Sequence[str]]) -> Layout:
    """`words` — normallashtirilgan so'zlar (kataklar ro'yxati). Joylashmagan so'zlar bo'lsa,
    `UnplaceableError` ularning kiritilgan tartibdagi indekslari bilan ko'tariladi."""
    if not words:
        raise ValueError("so'zlar ro'yxati bo'sh")
    order = sorted(range(len(words)), key=lambda i: (-len(words[i]), i))
    grid = _Grid()
    placed: dict[int, tuple[int, int, Direction]] = {}
    unplaced: list[int] = []

    first = order[0]
    grid.put(words[first], 0, 0, ACROSS)
    placed[first] = (0, 0, ACROSS)
    for index in order[1:]:
        cells = words[index]
        snapshot = [(r, c, d, words[i]) for i, (r, c, d) in placed.items()]
        best: tuple[tuple[int, int, int, int, int], tuple[int, int, Direction]] | None = None
        for row, col, direction in _candidates(snapshot, cells):
            count = grid.crossings(cells, row, col, direction)
            if count is None:
                continue
            key = (
                -count,
                grid.area_with(cells, row, col, direction),
                row,
                col,
                _direction_rank(direction),
            )
            if best is None or key < best[0]:
                best = (key, (row, col, direction))
        if best is None:
            unplaced.append(index)
            continue
        row, col, direction = best[1]
        grid.put(cells, row, col, direction)
        placed[index] = (row, col, direction)
    if unplaced:
        raise UnplaceableError(sorted(unplaced))

    min_row = min(r for r, _ in grid.letters)
    min_col = min(c for _, c in grid.letters)
    max_row = max(r for r, _ in grid.letters)
    max_col = max(c for _, c in grid.letters)
    starts = sorted({(r - min_row, c - min_col) for r, c, _ in placed.values()})
    numbers = {start: number for number, start in enumerate(starts, start=1)}
    result = [
        PlacedWord(
            index=index,
            number=numbers[(r - min_row, c - min_col)],
            row=r - min_row,
            col=c - min_col,
            direction=d,
            cells=tuple(words[index]),
        )
        for index, (r, c, d) in placed.items()
    ]
    result.sort(key=lambda w: (w.number, _direction_rank(w.direction)))
    return Layout(rows=max_row - min_row + 1, cols=max_col - min_col + 1, words=tuple(result))


def layout_to_json(layout: Layout, word_ids: Sequence[int]) -> dict[str, Any]:
    """Serverda saqlanadigan ko'rinish. `word_ids[i]` — kiritilgan tartibdagi i-so'zning ID'si."""
    return {
        "rows": layout.rows,
        "cols": layout.cols,
        "words": [
            {
                "word_id": word_ids[word.index],
                "number": word.number,
                "row": word.row,
                "col": word.col,
                "direction": word.direction,
                "length": len(word.cells),
                "cells": list(word.cells),
            }
            for word in layout.words
        ],
    }
