# Texnologiya platformasi — backend

FastAPI + SQLAlchemy 2. Lokal ishlab chiqish uchun Docker, PostgreSQL yoki Redis kerak emas: baza SQLite, fon ishlari shu jarayon ichida bajariladi.

## O'rnatish

```bash
cd backend
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run python -m app.cli create-admin --email admin@example.uz --password "kuchli-parol-123" --name "Administrator"
```

## Ishga tushirish

```bash
uv run uvicorn app.main:create_app --factory --reload
```

API hujjatlari: http://localhost:8000/api/docs

## Testlar va tekshiruvlar

```bash
uv run pytest -q
uv run ruff check .
uv run mypy app
```

PostgreSQL'da test qilish uchun: `TEST_DATABASE_URL=postgresql+asyncpg://... uv run pytest -q`

## PPT/DOC → PDF

Taqdimot va Word fayllar LibreOffice orqali PDF'ga aylantiriladi. LibreOffice o'rnatilmagan bo'lsa, PDF yuklash ishlayveradi. PPT/DOC materiallar esa `failed` (`LIBREOFFICE_NOT_FOUND`) holatiga tushadi. LibreOffice'ni o'rnatgach, `.env` fayliga quyidagini yozing:

```
SOFFICE_PATH=C:/Program Files/LibreOffice/program/soffice.exe
```

So'ng o'qituvchi panelidagi "Qayta urinish" tugmasini bosing (`POST /api/teach/materials/{id}/retry`).

## Yangi migratsiya

```bash
uv run alembic revision --autogenerate -m "o'zgarish tavsifi"
uv run alembic upgrade head
```
