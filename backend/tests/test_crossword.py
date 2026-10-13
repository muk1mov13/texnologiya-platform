import pytest

from app.assessment.crossword import (
    InvalidWordError,
    Layout,
    UnplaceableError,
    build_layout,
    layout_to_json,
    normalize_word,
    word_matches,
)

SYNTHETIC = [list("ABCDEFGHI"), list("PAQ"), list("RCS"), list("TEU"), list("VGW")]


def _cells(layout: Layout) -> dict[tuple[int, int], str]:
    cells: dict[tuple[int, int], str] = {}
    for word in layout.words:
        dr, dc = (0, 1) if word.direction == "across" else (1, 0)
        for k, char in enumerate(word.cells):
            pos = (word.row + dr * k, word.col + dc * k)
            assert 0 <= pos[0] < layout.rows and 0 <= pos[1] < layout.cols
            assert cells.setdefault(pos, char) == char
    return cells


def _runs(cells: dict[tuple[int, int], str]) -> list[str]:
    """To'rdagi uzunligi 2+ bo'lgan barcha uzluksiz harf qatorlari."""
    runs = []
    for row, col in cells:
        for dr, dc in ((0, 1), (1, 0)):
            if (row - dr, col - dc) in cells:
                continue
            run, k = [], 0
            while (row + dr * k, col + dc * k) in cells:
                run.append(cells[(row + dr * k, col + dc * k)])
                k += 1
            if len(run) > 1:
                runs.append("".join(run))
    return sorted(runs)


def test_normalize_uppercases_and_merges_o_and_g_apostrophes() -> None:
    assert normalize_word(" o'quvchi ") == ["Oʻ", "Q", "U", "V", "C", "H", "I"]
    assert normalize_word("Gʻisht") == ["Gʻ", "I", "S", "H", "T"]
    assert normalize_word("toʼg‘ri") == ["T", "Oʻ", "Gʻ", "R", "I"]
    assert normalize_word("мактаб") == ["М", "А", "К", "Т", "А", "Б"]


@pytest.mark.parametrize("raw", ["", "   ", "ab1", "ko'k-ko'l", "a'b", "ikki so'z"])
def test_normalize_rejects_non_letters(raw: str) -> None:
    with pytest.raises(InvalidWordError):
        normalize_word(raw)


def test_two_word_layout_is_exact() -> None:
    layout = build_layout([list("ABCD"), list("XBY")])
    assert (layout.rows, layout.cols) == (3, 4)
    assert [(w.number, w.direction, w.row, w.col, "".join(w.cells)) for w in layout.words] == [
        (1, "down", 0, 1, "XBY"),
        (2, "across", 1, 0, "ABCD"),
    ]


def test_synthetic_layout_is_exact_and_valid() -> None:
    layout = build_layout(SYNTHETIC)
    assert (layout.rows, layout.cols) == (3, 9)
    assert [(w.number, w.direction, w.row, w.col, w.index) for w in layout.words] == [
        (1, "down", 0, 0, 1),
        (2, "down", 0, 2, 2),
        (3, "down", 0, 4, 3),
        (4, "down", 0, 6, 4),
        (5, "across", 1, 0, 0),
    ]
    assert _runs(_cells(layout)) == sorted("".join(w) for w in SYNTHETIC)


def test_layout_is_deterministic() -> None:
    assert build_layout(SYNTHETIC) == build_layout([list(w) for w in SYNTHETIC])


def test_unplaceable_words_are_reported_by_input_index() -> None:
    with pytest.raises(UnplaceableError) as exc:
        build_layout([list("ABC"), list("DEF"), list("ABX")])
    assert exc.value.indexes == [1]


def test_layout_to_json_maps_word_ids_by_input_index() -> None:
    data = layout_to_json(build_layout([list("ABCD"), list("XBY")]), [70, 71])
    assert data["rows"] == 3 and data["cols"] == 4
    assert [(w["word_id"], w["number"], w["length"], w["cells"]) for w in data["words"]] == [
        (71, 1, 3, ["X", "B", "Y"]),
        (70, 2, 4, ["A", "B", "C", "D"]),
    ]


def test_word_matches_normalizes_answer() -> None:
    cells = normalize_word("O'QUVCHI")
    assert word_matches("o‘quvchi", cells)
    assert not word_matches("oquvchi", cells)
    assert not word_matches("", cells)
    assert not word_matches("abc1", cells)
