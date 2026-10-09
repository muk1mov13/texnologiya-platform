# O'zgarishlar jurnali

Loyihadagi barcha o'zgarishlar shu yerda sana bo'yicha qayd etiladi: kod, hujjatlar, infratuzilma, shuningdek GitHub'dagi amallar (repo, PR, merge). Eng yangi yozuvlar yuqorida. Har bir yozuv yonida commit hash'i yoki tegishli havola bor.

---

## 2026-10-09 — 1B-bosqich (frontend) boshlandi

- `feat/phase-1b-frontend` branch'i yaratildi.
- `CHANGELOG.md` qo'shildi. Undagi barcha oldingi o'zgarishlar git tarixidan tiklangan.
- To'liq qurish yo'l xaritasi (0–4-bosqichlar) tuzildi va tasdiqlandi.
- 1B implementatsiya rejasi yozildi: `docs/superpowers/plans/2026-10-09-phase-1b-frontend.md` (18 task, TDD). Kutubxona versiyalari haqiqiy `npm install` bilan tekshirildi: TypeScript 6.0 (TS 7'ni typescript-eslint hali qo'llamaydi), React Router 8, Vitest 5, MSW 3, react-pdf 11. Frontend uchun Node `>=22.22.2` kerak.
- Lokal muhit: Node.js 24.20.0 LTS o'rnatildi (winget) — frontend Node >=22.22.2 talab qiladi.
- Frontend skeleti: Vite, React 19, TS 6, Tailwind v4, ESLint, Vitest.
- Frontend sozlamalari: ESLint .js/.mjs fayllarni ham tekshiradi, lockfile tozalandi, tsconfig'dan Jest tiplari olib tashlandi.
- i18n: to'liq uz/ru lug'atlari (backend xato kodlari bilan), til tanlovini eslab qolish, kalitlar mosligi testi.
- i18n: yetishmagan xato kodlari (GLOSSARY_TERM_NOT_FOUND, LITERATURE_NOT_FOUND) qo'shildi, testlarda til holati to'liq tiklanadi, matnlar aniqlashtirildi.
- 1B rejasi kod bilan sinxronlandi: test setup tilni `setLanguage('uz')` bilan tiklaydi, lug'atga yangi xato kodlari va aniqlashtirilgan matnlar kiritildi.

## 2026-10-09 — 1A yopildi va GitHub'ga joylandi

- **GitHub:** private repo yaratildi (https://github.com/muk1mov13/texnologiya-platform), `main` va `feat/phase-1a-backend` push qilindi.
- **PR #1** ("Phase 1A: backend") ochildi. CI birinchi marta ishga tushdi va yashil o'tdi: SQLite va PostgreSQL 16'dagi testlar, migratsiyalar va `alembic check`.
- **`59def80`:** PR #1 `main`ga merge commit bilan birlashtirildi. `feat/phase-1a-backend` branch'i o'chirildi.
- **`1a67b26`:**
  - `CLAUDE.md` qo'shildi: buyruqlar va backend arxitekturasi bo'yicha Claude Code uchun yo'riqnoma.
  - `resource/` (taxminan 73 MB o'quv materiallari) `.gitignore`ga qo'shildi. Fayllar diskda qoladi, git'ga tushmaydi.
- **Lokal tekshiruv:** 145 ta test o'tdi; ruff format, ruff check va mypy xatosiz.

## 2026-10-09 — 1A-bosqich: backend

### Xavfsizlik va barqarorlikni kuchaytirish
- `313df82` — Spec amalga oshirilgan sessiya, admin yaratish va yuklash tekshiruvlariga moslashtirildi.
- `8744df9` — CI uchun faqat o'qish ruxsatlari va `alembic check` (migratsiya drift tekshiruvi) qo'shildi. README'ga tekshiruv buyruqlari yozildi.
- `092ab05` — `create-admin` parolni `ADMIN_PASSWORD` muhit o'zgaruvchisidan yoki terminal so'rovidan oladi.
- `d7852bf` — DB'dan o'chirilgandan keyin fayllar "best-effort" usulda tozalanadi (qulflangan fayl xatosi so'rovni 500'ga aylantirmaydi).
- `3eff6a1` — Yuklangan fayllarning imzosi (magic bytes) tekshiriladi.
- `b61f8c5` — Faqat bo'sh joydan iborat nomlar va sarlavhalar rad etiladi.
- `fede6c8` — `id` va `order` qiymatlari diapazoni hamda uzun fayl nomlari tekshiriladi.
- `d785214` — Migratsiya paytida SQLite'da foreign key kaskadi o'chiriladi, shunda bola qatorlar tasodifan o'chib ketmaydi.
- `b0d074c` — Server qayta ishga tushganda yarim qolgan konvertatsiyalar `failed` (`INTERRUPTED`) deb belgilanadi.
- `dd75518` — Bosqich progressini yozish (upsert) poyga holatlariga chidamli qilindi.
- `6185faf` — Material konvertatsiyasi kuchaytirildi: alohida LibreOffice profili, osilib qolgan job'lar yo'q, shifrlangan PDF rad etiladi, `processing` holatida o'chirish bloklanadi.

### Infratuzilma
- `4d338f5` — Lint va tip xatolari tuzatildi. CI (SQLite + PostgreSQL) va README qo'shildi.
- `e935776` — Alembic sozlandi, boshlang'ich migratsiya yozildi.

### Talaba API
- `b471888` — "Davom ettirish" (`/me/continue`), progress xulosasi (`/me/progress`) va himoyalangan PDF'ni berish (`/materials/{id}/file`).
- `e5d2eb1` — Talaba uchun fan, mavzu va bosqich ko'rinishlari hamda bosqichni tugatish.

### O'qituvchi API
- `92bedd1` — Mavzu glossariysi va adabiyotlar uchun CRUD.
- `4284416` — Material yuklash va fonda PPT/DOC → PDF konvertatsiyasi.
- `66153c2` — Biriktirilgan o'qituvchi uchun mavzu yaratish, tahrirlash, o'chirish va tartiblash.
- `e9a0260` — Slug takrorlanganda 409 qaytariladi.

### Admin API
- `1ae5f09` — Fanlar CRUD va o'qituvchi biriktirish.
- `01174a6` — Foydalanuvchini tasdiqlash, rol berish, bloklash va vaqtinchalik parol.

### Learning modeli
- `5cea1cc` — Fan va mavzu modellari, mavzu yaratilganda 7 bosqich avtomatik yaratiladi, tahrirlash servisi va ruxsatlar.

### Auth
- `5f5aa9d` — `create-admin` CLI buyrug'i.
- `bc63780` — Ro'yxatdan o'tish va refresh rotatsiyasi poyga holatlariga chidamli qilindi. Prod'da secure cookie majburiy.
- `e65e394` — Joriy foydalanuvchi endpointlari (`/me`) va rolga asoslangan dependency'lar.
- `675bcef` — Refresh token rotatsiyasi (qayta ishlatilganini aniqlash bilan) va chiqish.
- `09dd30e` — Foydalanuvchi modeli, ro'yxatdan o'tish va rate limit bilan kirish.

### Core
- `2d08af4` — Fon ishlari nomi takrorlansa, ro'yxatdan o'tkazish rad etiladi.
- `e374471` — Noto'g'ri token `subject` maydoni rad etiladi. Rate limiter xotirasi chegaralangan.
- `dd0b3ee` — Fayl saqlash (`Storage`), inline job runner va umumiy dependency'lar.
- `08e0699` — Parol xeshlash (argon2), JWT yordamchilari va login rate limiter.
- `99e2e10` — Baza turlari, yagona xato formati, request ID va test fixture'lari.
- `4194ab2` — Backend skeleti, sozlamalar va health endpoint.

## 2026-10-08/09 — Loyihalash

- `7249d14` — Spec'ga Docker'siz lokal muhit qo'shildi. 1A-bosqich implementatsiya rejasi yozildi.
- `e0adc07` — Platformaning dizayn hujjati (spec) qo'shildi.
