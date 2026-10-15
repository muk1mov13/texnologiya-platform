"""`resource/` papkasidagi tayyor o'quv materiallarini o'qish (bazaga bog'liq emas).

Tuzilma: `<ildiz>/<fan>/<N bo'lim>/<mavzu papkasi>/<N) fayl>`. Bo'lim nomidagi kalit so'z
mashg'ulot turini, `dastur` so'zi esa o'quv dasturi papkasini bildiradi. Mavzu papkasidagi
fayllar nomi bilan emas, `N)` prefiksi bilan aniqlanadi (nomlarda imlo xatolari bor):

1) krossvord, 2) ma'ruza matni, 3) test, 4) topshiriq, 5) glossariy, 6) adabiyotlar, 7) o'yin.

Matn doim DOC/DOCX'dan o'qiladi. 2) va 7) yonida shu raqamli PDF bo'lsa, material sifatida o'sha
olinadi; `dastur` papkasida ham PDF DOC/DOCX'dan ustun.
"""

import re
import shutil
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

import docx

from app.assessment import crossword
from app.learning import convert
from app.learning.models import LessonType

# Bo'lim papkasi nomidagi kalit so'z -> mashg'ulot turi (kichik harflarda qidiriladi).
SECTION_KEYWORDS: tuple[tuple[str, LessonType], ...] = (
    ("ma'ruza", LessonType.lecture),
    ("maruza", LessonType.lecture),
    ("amaliy", LessonType.practical),
    ("seminar", LessonType.seminar),
    ("laborator", LessonType.lab),
)
SYLLABUS_KEYWORD = "dastur"
APOSTROPHES = "ʻʼ’‘`"

FILE_KEYS = {
    1: "crossword",
    2: "lecture",
    3: "quiz",
    4: "task",
    5: "glossary",
    6: "literature",
    7: "presentation",
}
TEXT_EXT = frozenset({".doc", ".docx"})
SLIDE_EXT = frozenset({".ppt", ".pptx"})
PDF_EXT = ".pdf"
# Fayli material bo'ladigan kalitlar; ularning `N)` raqamli PDF'i `<kalit>_pdf` bo'lib yoziladi.
MATERIAL_KEYS = ("lecture", "presentation")

TITLE_MAX = 200
CLUE_MAX = 300
OPTION_MAX = 300
LIT_TITLE_MAX = 300
LIT_AUTHOR_MAX = 200
TERM_MAX = 200


# --- tuzilma -------------------------------------------------------------------------------


@dataclass
class TopicSource:
    lesson_type: LessonType
    number: int
    folder: Path
    files: dict[str, Path] = field(default_factory=dict)


@dataclass
class SubjectSource:
    title: str
    folder: Path
    topics: list[TopicSource] = field(default_factory=list)
    syllabus: Path | None = None


def _plain(text: str) -> str:
    """Taqqoslash uchun: kichik harf, barcha apostroflar oddiy `'`."""
    text = text.lower()
    for mark in APOSTROPHES:
        text = text.replace(mark, "'")
    return text


def section_type(name: str) -> LessonType | None:
    plain = _plain(name)
    for keyword, lesson_type in SECTION_KEYWORDS:
        if keyword in plain:
            return lesson_type
    return None


def _first_number(name: str) -> int | None:
    match = re.search(r"\d+", name)
    return int(match.group()) if match else None


def topic_files(folder: Path) -> dict[str, Path]:
    files: dict[str, Path] = {}
    for path in sorted(folder.iterdir()):
        match = re.match(r"^\s*(\d+)\s*\)", path.name)
        if not path.is_file() or match is None:
            continue
        key = FILE_KEYS.get(int(match.group(1)))
        ext = path.suffix.lower()
        if ext == PDF_EXT and key in MATERIAL_KEYS:
            # Tayyor PDF: material sifatida asl fayl o'rniga olinadi (LibreOffice kerak emas).
            files.setdefault(f"{key}_pdf", path)
            continue
        allowed = SLIDE_EXT if key == "presentation" else TEXT_EXT
        if key is not None and ext in allowed and key not in files:
            files[key] = path
    subdirs = [p for p in folder.iterdir() if p.is_dir()]
    if not files and len(subdirs) == 1:
        # Ba'zi mavzularda fayllar yana bitta ichki papkada (`14-maruza/14-ma'ruza/`).
        return topic_files(subdirs[0])
    return files


def scan(root: Path) -> list[SubjectSource]:
    """Ildiz papkani o'qib, fanlar ro'yxatini qaytaradi (mavzular tur va raqam bo'yicha)."""
    order = {lesson_type: index for index, lesson_type in enumerate(LessonType)}
    subjects: list[SubjectSource] = []
    for subject_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        subject = SubjectSource(title=subject_dir.name.strip(), folder=subject_dir)
        for section in sorted(p for p in subject_dir.iterdir() if p.is_dir()):
            if SYLLABUS_KEYWORD in _plain(section.name):
                pdfs = sorted(p for p in section.iterdir() if p.suffix.lower() == PDF_EXT)
                docs = sorted(p for p in section.iterdir() if p.suffix.lower() in TEXT_EXT)
                found = pdfs or docs
                subject.syllabus = found[0] if found else None
                continue
            lesson_type = section_type(section.name)
            if lesson_type is None:
                continue
            for folder in (p for p in section.iterdir() if p.is_dir()):
                number = _first_number(folder.name)
                if number is not None:
                    subject.topics.append(
                        TopicSource(lesson_type, number, folder, topic_files(folder))
                    )
        subject.topics.sort(key=lambda t: (order[t.lesson_type], t.number))
        subjects.append(subject)
    return subjects


# --- matnni o'qish -------------------------------------------------------------------------


async def read_lines(path: Path, *, soffice: str, timeout: int) -> list[str]:  # noqa: ASYNC109
    """DOCX/DOC faylning bo'sh bo'lmagan xatboshilari. DOC avval LibreOffice bilan DOCX'ga
    o'giriladi (`convert.ConversionError` ko'tarishi mumkin)."""
    if path.suffix.lower() == ".docx":
        return _docx_lines(path)
    with tempfile.TemporaryDirectory() as tmp:
        # Nomda apostrof va ketma-ket nuqtalar bor: oddiy nomli nusxa bilan ishlaymiz.
        source = Path(tmp) / f"source{path.suffix.lower()}"
        shutil.copyfile(path, source)
        out = await convert.convert_to(source, Path(tmp), "docx", soffice=soffice, timeout=timeout)
        return _docx_lines(out)


def _docx_lines(path: Path) -> list[str]:
    document = docx.Document(str(path))
    lines = [_clean(p.text) for p in document.paragraphs]
    return [line for line in lines if line]


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def _cut(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


# --- parserlar -----------------------------------------------------------------------------

DASH = r"[–—-]"
# Faqat `raqam–harf` juftlaridan iborat qator — `Javoblar:` so'zisiz yozilgan kalit
# (`1–B 2–A`, `1 — b; 2 — a.`, yoki har juft alohida qatorda: `1-B`).
_KEY_LINE = re.compile(rf"^(?:\d+\s*{DASH}\s*[a-dA-D]\b[\s;,.]*)+$")
_KEY_PAIR = re.compile(rf"(\d+)\s*{DASH}?\s*([a-dA-D])\b")
# Sarlavhasiz sarlavha qatori: `1-LABORATORIYA MASHG'ULOTI`, `A2-amaliy mashg'ulot`.
_BARE_HEADING = re.compile(
    r"^[a-z]?\d+\s*-?\s*(?:mavzu|ma'?ruza|amaliy|seminar|laborator\w*|lab)"
    r"(?:\s+(?:mashg'ulot\w*|ishi))?\s*\.?$"
)


def _sentence_case(text: str) -> str:
    letters = [c for c in text if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) / len(letters) > 0.7:
        text = text.lower()
        return text[:1].upper() + text[1:]
    return text


def parse_title(lines: list[str]) -> str | None:
    """`1-mavzu. SARLAVHA` yoki `A1-AMALIY MASHG'ULOT. SARLAVHA` -> `Sarlavha`. Birinchi qator
    faqat `1-LABORATORIYA MASHG'ULOTI` bo'lsa, sarlavha keyingi qatordan olinadi."""
    if not lines:
        return None
    first = lines[0]
    if _BARE_HEADING.match(_plain(first)) and len(lines) > 1:
        first = lines[1]
    match = re.match(r"^[A-Za-z]?\d+\s*-[^.]{0,40}\.\s*(.+)$", first)
    title = (match.group(1) if match else first).strip(" .")
    return _cut(_sentence_case(title), TITLE_MAX) if len(title) >= 2 else None


@dataclass
class QuizItem:
    text: str
    options: list[str]
    correct_index: int


def parse_quiz(lines: list[str]) -> list[QuizItem]:
    """`N. savol` + `a) ... d)` variantlar + `Javoblar: 1–a; 2–c; ...` kaliti (`Javoblar:`
    so'zisiz, bir yoki bir necha qatorda ham bo'lishi mumkin)."""
    answers: dict[int, int] = {}
    questions: list[tuple[int, str, list[str]]] = []
    for line in lines:
        if _plain(line).startswith("javob") or _KEY_LINE.match(line):
            for number, letter in _KEY_PAIR.findall(line):
                answers[int(number)] = "abcd".index(letter.lower())
            continue
        option = re.match(r"^([a-dA-D])\s*[).]\s*(.+)$", line)
        if option and questions:
            questions[-1][2].append(_cut(option.group(2), OPTION_MAX))
            continue
        question = re.match(r"^(\d+)\s*[.)]\s*(.+)$", line)
        if question:
            questions.append((int(question.group(1)), question.group(2), []))
    items: list[QuizItem] = []
    for number, text, options in questions:
        if len(options) == 4 and number in answers:
            items.append(QuizItem(_cut(text, 1000), options, answers[number]))
    return items


@dataclass
class CrosswordItem:
    word: str
    clue: str


def parse_crossword(lines: list[str]) -> list[CrosswordItem]:
    """Savollar `N. (H): savol?`, javoblar `N. So'z`. Krossvordga yaroqsiz so'zlar tashlanadi."""
    clues: dict[int, str] = {}
    words: dict[int, str] = {}
    for line in lines:
        clue = re.match(r"^(\d+)\s*\.\s*\([^)]*\)\s*:?\s*(.+)$", line)
        if clue:
            clues[int(clue.group(1))] = clue.group(2)
            continue
        word = re.match(r"^(\d+)\s*\.\s*([^\s(].*)$", line)
        if word:
            words[int(word.group(1))] = word.group(2).strip(" .")
    items: list[CrosswordItem] = []
    seen: set[str] = set()
    for number in sorted(clues):
        raw = words.get(number)
        if raw is None:
            continue
        try:
            cells = crossword.normalize_word(raw)
        except crossword.InvalidWordError:
            continue
        key = "".join(cells)
        if not crossword.MIN_CELLS <= len(cells) <= crossword.MAX_CELLS or key in seen:
            continue
        seen.add(key)
        items.append(CrosswordItem(raw, _cut(clues[number], CLUE_MAX)))
    return items


@dataclass
class GlossaryItem:
    term: str
    definition: str


def parse_glossary(lines: list[str]) -> list[GlossaryItem]:
    items: list[GlossaryItem] = []
    for line in lines:
        match = re.match(rf"^(.{{1,{TERM_MAX}}}?)\s+{DASH}\s+(.+)$", line) or re.match(
            r"^([^:]{1,200}):\s+(.+)$", line
        )
        if match:
            items.append(GlossaryItem(match.group(1).strip(" •-"), match.group(2).strip()))
    return items


@dataclass
class LiteratureEntry:
    title: str
    author: str
    year: int | None
    url: str | None


# `Familiya I.O.,` ko'rinishidagi mualliflar ketma-ketligi (initsiallarda Gʻ/Oʻ bo'lishi mumkin).
_AUTHORS = re.compile(r"^((?:[^\s,.]+\s+(?:[A-ZА-Я][ʻʼ’‘'`]?\.\s?){1,3},?\s*)+)")


def parse_literature(lines: list[str]) -> list[LiteratureEntry]:
    entries: list[LiteratureEntry] = []
    for raw in lines:
        line = raw.lstrip("•·●▪-–*0123456789.) \t")
        if len(line) < 3:
            continue
        url_match = re.search(r"https?://\S+", line)
        url = url_match.group().rstrip(".,;)") if url_match else None
        text = (line[: url_match.start()] if url_match else line).strip(" .")
        years = re.findall(r"\b(19\d{2}|20\d{2})\b", text)
        author_match = _AUTHORS.match(text)
        author = author_match.group(1).strip(" ,") if author_match else ""
        title = text[author_match.end() :].strip(" .") if author_match else text
        entries.append(
            LiteratureEntry(
                title=_cut(title or text, LIT_TITLE_MAX),
                author=_cut(author, LIT_AUTHOR_MAX),
                year=int(years[-1]) if years else None,
                url=url if url and len(url) <= 500 else None,
            )
        )
    return entries


@dataclass
class TaskText:
    title: str
    description: str


def parse_task(lines: list[str], default_title: str) -> TaskText | None:
    if not lines:
        return None
    title = default_title
    body = lines
    quoted = re.match(r"^[“\"«](.+?)[”\"»]\.?$", lines[0])
    if quoted:
        title = quoted.group(1).strip()
        body = lines[1:]
    description = "\n".join(re.sub(r"^[○•●▪]\s*", "- ", line) for line in body)
    if not description:
        return None
    return TaskText(_cut(title, TITLE_MAX), _cut(description, 10000))
