# Texnologiya platformasi — to'liq qurish yo'l xaritasi

## Kontekst

Bu fayl platformani oxirigacha qurish va ishga tushirish uchun bosqichma-bosqich yo'l xaritasi. U 2026-10-09 da tasdiqlangan va dastlab faqat lokal saqlangan edi; 2026-10-10 da repoga ko'chirildi.

Hozirgi holat (2026-10-13):

- **1-bosqich tugadi.**
  - 1A (backend) — PR #1, merge commit `59def80`.
  - 1B (frontend) — PR #2, merge commit `0cc93d6`.
  - CI uchta job bilan yashil: `backend`, `frontend`, `e2e`.
- **2-bosqich jarayonda.**
  - Mini-spec: `docs/superpowers/specs/2026-10-11-phase-2-assessment-design.md`.
  - 2A (backend) bajarildi: reja `docs/superpowers/plans/2026-10-11-phase-2a-backend.md`.
  - 2B (frontend) bajarildi: reja `docs/superpowers/plans/2026-10-12-phase-2b-frontend.md` (Task 0–12).
  - Ikkalasi 2026-10-13 da `main`ga to'g'ridan-to'g'ri merge qilindi (`1f23fcc`). Feature branch'lar o'chirildi.
  - 2B uchun Vitest va E2E testlari foydalanuvchi qarori bilan loyiha oxiriga qoldirilgan: kod faqat lint, typecheck va build bilan tekshirilgan.
- **Qolganlari yozilmagan:** AI (3), kutubxona, CMS, ochiq sayt va deploy (4).
- **Lokal muhit:** `uv`, Python 3.12, Node 24, Playwright Chromium bor. LibreOffice va Docker o'rnatilmagan.

Manba: `docs/superpowers/specs/2026-10-08-texnologiya-platform-design.md`, 10-bo'lim. Yo'l xaritasi spec'dagi bosqichlar tartibiga amal qiladi va har bosqich uchun aniq qadamlar, bog'liqliklar hamda "tayyor" mezonini beradi. Bajarilgan ishlarning batafsil tarixi — `CHANGELOG.md`.

## Har bir bosqich uchun ish tartibi

1. **Mini-spec:** asosiy spec'ga tayanib qisqa qo'shimcha spec yoziladi (brainstorming). 1B uchun asosiy spec yetarli edi.
2. **Reja:** `docs/superpowers/plans/<sana>-phase-N-*.md`, TDD tasklari bilan (writing-plans).
3. **Amalga oshirish:** 2026-10-13 dan boshlab faqat `main` branch'ida (foydalanuvchi qarori, feature branch va PR ishlatilmaydi), task ketma-task. Bir vaqtda faqat bitta task bajariladi, har task'dan keyin foydalanuvchi tasdig'i kutiladi; subagent ishlatilmaydi (`CLAUDE.md`, "Execution Constraints").
4. **Yopish:** code review, CI yashil bo'lishi, tayyor bo'lish mezonini qo'lda tekshirish, so'ng `main`ga push (foydalanuvchi so'raganda). 1- va 2A-bosqichlar PR orqali (#1–#3), 2-bosqich oxiri to'g'ridan-to'g'ri `main`ga kirdi.

---

## 0-qadam: 1A'ni yopish — ✅ bajarildi

GitHub repo (`muk1mov13/texnologiya-platform`) yaratildi, CI birinchi marta SQLite va PostgreSQL'da yashil o'tdi, PR #1 `main`ga merge qilindi (`59def80`).

Qolgan ixtiyoriy band: Windows'ga LibreOffice o'rnatib, `.env`ga `SOFFICE_PATH` yozish va PPTX konvertatsiyasini qo'lda tekshirish.

---

## 1B-bosqich: Frontend (1-bosqichni yakunlaydi) — ✅ bajarildi

Reja: `docs/superpowers/plans/2026-10-09-phase-1b-frontend.md` (18 task). PR #2, merge commit `0cc93d6`.

`frontend/` ichida: React, Vite, TypeScript, React Router, TanStack Query, Tailwind v4, react-i18next, react-hook-form + zod, react-pdf.

1. **Skelet.**
   - Vite loyihasi, ESLint va `tsc`.
   - Vite dev proxy `/api` → `localhost:8000`. CORS'da `localhost:5173` allaqachon ruxsat etilgan (`app/core/config.py`).
2. **Dizayn tizimi "Yorqin ilova".**
   - Ranglar teal va slate, katta radiuslar, asosiy tugmalarda "3D" soya, Onest shrifti.
   - Asosiy komponentlar: Button, Card, Input, ProgressRing, Toast, Modal, Tabs.
   - `prefers-reduced-motion` hurmat qilinadi. Telefon ekrani asosiy holat sifatida loyihalanadi.
3. **API qatlami.**
   - fetch client, access token xotirada saqlanadi.
   - 401 kelsa `/auth/refresh` chaqiriladi va so'rov bir marta qayta yuboriladi, yana xato bo'lsa login sahifasiga o'tiladi.
   - Xatolar `{code, message, details}` formatida keladi, matni `code` bo'yicha i18n'dan olinadi.
   - Har endpoint uchun TanStack Query hook'lari.
4. **i18n.** `uz.json` va `ru.json`. Til `PATCH /me` orqali saqlanadi.
5. **Routing va layout'lar.**
   - Bo'limlar: public `/`, talaba `/app`, o'qituvchi `/teach`, admin `/admin`.
   - Rol va holat bo'yicha guard'lar (`pending` foydalanuvchi "tasdiq kutilmoqda" ekraniga yo'naltiriladi).
6. **Ochiq sahifalar:** bosh sahifa skeleti, kirish, ro'yxatdan o'tish, tasdiq kutish.
7. **Talaba.**
   - Fanlar ro'yxati va mavzu yo'li (har mavzuda 7 bosqichli progress halqasi).
   - Dars pleyeri `/app/topics/:id/:step`: chapda bosqichlar, markazda PDF ko'ruvchi, glossariy, adabiyotlar va "Tugatdim" tugmasi.
   - "Davom ettirish" (`/me/continue`), profil.
8. **O'qituvchi — mavzu muharriri.**
   - Mavzu CRUD va tartiblash.
   - 7 bosqich tablari.
   - Fayl yuklash; `processing` holatida polling, `failed` bo'lsa "Qayta urinish" tugmasi.
   - Glossariy va adabiyotlar CRUD.
9. **Admin.**
   - Foydalanuvchilar: tasdiqlash navbati, rol, bloklash, vaqtinchalik parol.
   - Fanlar: CRUD, nashr qilish, o'qituvchi biriktirish.
10. **Testlar.**
    - Vitest + RTL (komponentlar va hook'lar).
    - Playwright E2E: ro'yxatdan o'tish → admin tasdig'i → fanni ochish → bosqichni tugatish → progress yangilanadi.
11. **CI.**
    - `frontend` job: ESLint, `tsc`, Vitest, build.
    - `e2e` job (`backend` va `frontend` dan keyin): API tiplari drift tekshiruvi (`npm run gen:api` → `schema.gen.ts` o'zgarmasligi), so'ng Playwright.

Backend'ga 1B davomida 3 ta ataylab qilingan auth tuzatishi kirdi (refresh grace window va muvaffaqiyatsiz refresh'da cookie tozalash).

**Tayyor (spec 10-bo'limidagi mezon):**
- Admin o'qituvchini tasdiqlaydi va fanga biriktiradi.
- O'qituvchi PDF va PPTX yuklaydi, PPTX avtomatik PDF'ga aylanadi.
- Talaba bosqichlarni tugatadi va progressni ko'radi.
- Interfeys uz va ru tillarida ishlaydi.
- E2E test o'tadi. ✅

**Qo'lda hali tekshirilmagan:**
- PPTX → PDF konvertatsiyasi (LibreOffice o'rnatilishi kerak);
- interfeys ru tilida to'liq;
- 375px kenglikda gorizontal scroll yo'qligi;
- o'qituvchini fanga biriktirib, uning `/teach` da fanni ko'rishi.

---

## 2-bosqich: Baholash va gamifikatsiya — 🟡 2A va 2B bajarildi; testlar va merge qoldi

**Mini-spec'da hal qilinadigan masalalar:**
- XP qiymatlari konfiguratsiyasi;
- nishonlar ro'yxati;
- krossvord algoritmi;
- vazifa fayllari uchun 20 MB cheklovi.

**Backend.** Yangi modullar `app/assessment/` va `app/gamification/`. Har yangi model `models_registry.py`ga import qilinadi va unga migratsiya yoziladi.

1. **Faoliyatlar.**
   - `activities` (turi `quiz`, `yesno` yoki `crossword`), `quiz_questions` (aynan 4 variant), `yesno_items`, `crossword_words`.
   - O'qituvchi muharriri API'si; ruxsatlar `editing.ensure_can_edit_step` orqali.
2. **Krossvord to'ri.** Deterministik Python algoritmi; natija `activities.layout` (jsonb) maydoniga yoziladi.
3. **Urinishlar.**
   - `attempts`: javoblar faqat serverda tekshiriladi.
   - Talabaga yuboriladigan javoblarda to'g'ri javob hech qachon bo'lmaydi; buning uchun alohida test yoziladi.
   - `review` va `practice` bosqichlari urinish yakunlanganda tugaydi, `best_score` yangilanadi.
4. **Vazifalar.**
   - `tasks` va `submissions` (matn va/yoki fayl, magic bytes tekshiriladi).
   - Javob yuborilganda bosqich tugaydi.
   - O'qituvchi uchun tekshirish navbati, ball va izoh qo'yish.
5. **Gamifikatsiya.**
   - `xp_events`: unique cheklov XP ikki marta berilishini oldini oladi; buning uchun ham test bor.
   - `streaks`: sana Asia/Tashkent vaqti bo'yicha hisoblanadi.
   - `badges` va `user_badges`, nishonlar seed qilinadi.
6. **Hisobotlar.**
   - Talaba bosh sahifasi API'si: XP, seriya, nishonlar, davom ettirish.
   - "Natijalarim" sahifasi.
   - O'qituvchi statistikasi (fan va mavzu bo'yicha).

**Frontend:**
- test, ha/yo'q va krossvord muharrirlari hamda o'ynash ekranlari;
- vazifa yuborish;
- o'qituvchi tekshirish navbati va statistika;
- talaba bosh sahifasi, natijalarim;
- XP "pop" va progress to'lish animatsiyalari.

**Tayyor:**
- Talaba test yechadi, XP va seriya oladi.
- O'qituvchi vazifani baholaydi, talaba balli ko'radi.
- E2E testga baholash oqimi qo'shiladi.

---

## 3-bosqich: AI

**Mini-spec'da hal qilinishi shart bo'lgan masalalar:**
- **Vektor qidiruv lokal muhitda.** `doc_chunks.embedding` uchun pgvector kerak, lokal baza esa SQLite. Variantlar:
  - (a) lokalda embedding'larni JSON yoki BLOB qilib saqlash va o'xshashlikni Python'da cosine bilan hisoblash, prod'da pgvector ishlatish (ikkalasi bir `VectorStore` interfeysi orqali);
  - (b) 3-bosqichdan boshlab lokalda ham PostgreSQL ishlatish.
- **Haftalik cron lokal muhitda.** arq cron 4-bosqichda paydo bo'ladi. Ungacha CLI buyrug'i yoki oddiy asyncio scheduler ishlatiladi.
- **Provayder.** Gemini model nomlari va bepul tarif limitlarini rasmiy hujjatdan tekshirish. `ClaudeProvider` adapter orqali keyin qo'shiladi.

**Qadamlar:**
1. **Adapter.** `LLMProvider` va `EmbeddingProvider` interfeyslari, `GeminiProvider`, testlar uchun `FakeProvider`. Sozlamalar `.env`da: `AI_PROVIDER`, `AI_MODEL_*`, `GEMINI_API_KEY`.
2. **Indekslash.**
   - Material `ready` bo'lgach job ishga tushadi: PyMuPDF'dan sahifama-sahifa matn, taxminan 800 tokenlik va 100 token ustma-ust tushadigan bo'laklar, embedding, `doc_chunks`.
   - Glossariy atamalari ham indekslanadi.
   - Material o'chirilsa, uning bo'laklari ham o'chiriladi. Indeksni qayta qurish imkoni bor.
3. **Talaba repetitori.**
   - Qidiruv tartibi: avval mavzu, keyin fan, keyin butun platforma (top-6).
   - O'xshashlik chegaradan past bo'lsa, LLM chaqirilmay rad javobi qaytariladi.
   - Yakunlanmagan test yoki vazifaga o'xshash savolda "maslahat rejimi" yoqiladi.
   - Javob SSE orqali oqim bilan beriladi, manbalar `[n]` ko'rinishida.
   - Kunlik limit `ai_usage` jadvalida hisoblanadi.
4. **Kontent yaratish.**
   - `ai_drafts` qatori yaratiladi, LLM qat'iy JSON sxemasi bilan chaqiriladi va natija Pydantic bilan tekshiriladi.
   - Tekshiruvdan o'tmasa 1 marta qayta so'raladi. Muvaffaqiyatli bo'lsa `draft`; o'qituvchi tasdiqlagach, haqiqiy `activities` / glossariy / vazifa yozuvlari yaratiladi.
5. **Vazifani tekshirish.**
   - Matn textarea, PDF yoki DOCX'dan olinadi (`python-docx` qo'shiladi). Rasm yoki skan bo'lsa `unsupported`.
   - LLM `ai_score` va `ai_feedback` beradi. AI'ga shaxsiy ma'lumot yuborilmaydi.
6. **Haftalik tahlil.** Statistika SQL bilan hisoblanadi; LLM faqat shu raqamlar asosida qisqa xulosa va 3 ta tavsiya yozadi.
7. **Barqarorlik.** 429 yoki 5xx kelsa, eksponensial kutish bilan 3 marta qayta urinish. Global tezlik cheklovi. AI ishlamasa ham sayt to'liq ishlaydi.
8. **Frontend.**
   - Pleyerning o'ng panelida repetitor, mobil qurilmada pastdan ochiladigan panel; repetitor alohida sahifada ham bor.
   - "✨ AI bilan yaratish" tugmasi va qoralamalar ekrani.
   - Tekshirish navbatida AI tavsiyasi ko'rinadi.
   - O'qituvchi bosh sahifasida haftalik tahlil.
   - Admin AI sahifasi: limitlar, sarf statistikasi, indeksni qayta qurish.

**Tayyor:**
- Repetitor platforma mavzusidan tashqari savollarni rad etadi va manbalarni ko'rsatadi.
- Qoralama tasdiqlangach, haqiqiy testga aylanadi.
- Barcha AI testlari `FakeProvider` bilan o'tadi.

---

## 4-bosqich: Kutubxona, ochiq sayt va production deploy

**Backend:**
- `library` moduli: `folders` (metodik va huquqiy) va `documents`; `books` (tasdiqlash bilan).
- `cms` moduli: `news`, `faq_items`, `contact_messages`, `site_settings`.
- Kutubxona hujjatlari va kitoblar AI indeksiga qo'shiladi.

**Frontend:**
- ochiq sayt: bosh sahifaning yakuniy dizayni, biz haqimizda, FAQ, bog'lanish, yangiliklar, kutubxona;
- admin CMS sahifalari.

**SEO.** Meta, OG, `sitemap.xml`, `robots.txt`. SPA'da ochiq sahifalar qidiruv tizimlariga yaxshi ko'rinmaydi. Mini-spec'da ochiq sahifalar uchun prerender kerakmi, shu hal qilinadi.

**Deploy (`deploy/` papkasi):**
1. **Worker.** `ArqJobRunner` qo'shiladi; u `JobRunner` protokoliga mos keladi, shuning uchun almashtirish faqat sozlama orqali bo'ladi. `backend/worker/` ichida `WorkerSettings` va cron.
2. **Redis'ga ko'chirish.** Rate limiter va AI limitlari xotiradan Redis'ga o'tadi.
3. **Dockerfile'lar.** api va worker uchun; worker image'ida LibreOffice headless o'rnatiladi. Frontend build qilinib, statik fayllar nginx'ga beriladi.
4. **`docker-compose.yml`.** nginx, api, worker, PostgreSQL 16 + pgvector, Redis. Lokal muhit uchun `docker-compose.dev.yml`.
5. **nginx.**
   - HTTPS (Let's Encrypt), `/api` proksi.
   - Himoyalangan fayllar uchun ichki `/media` location va `MEDIA_ACCEL_REDIRECT=true`.
   - Xavfsizlik sarlavhalari: CSP, HSTS, X-Content-Type-Options.
6. **Prod `.env`.** `ENV=prod`, kuchli `JWT_SECRET`, `COOKIE_SECURE=true`, CORS faqat o'z domeni uchun. Bu sozlamalar `Settings` validatori tomonidan majburan tekshiriladi.
7. **Ishga tushirish.**
   - `backup.sh`: kunlik `pg_dump` va media arxivi, 14 kun saqlanadi.
   - `alembic upgrade head`, so'ng `create-admin`.
   - Smoke test: health endpoint, login, fayl yuklash, konvertatsiya.

**Tayyor:**
- Sayt domen orqali HTTPS'da ishlaydi.
- Zaxira nusxa olinadi va undan tiklash sinab ko'rilgan.
- E2E prod'ga o'xshash muhitda o'tadi.

---

## Tavsiya

Spec'da deploy 4-bosqichga qo'yilgan. Lekin 1B tugagach, oddiy staging serverga erta joylashni ko'rib chiqish foydali: o'qituvchilar real kontent kiritishni boshlaydi va fikr-mulohazalar ertaroq keladi. Buning uchun 4-bosqichdagi deploy qadamlari (3–7) ikki qismga bo'linadi va bir qismi oldinga suriladi.

## Tekshirish (har bosqichda)

- **Backend (`backend/`):** `uv run pytest -q`, `ruff format --check .`, `ruff check .`, `mypy app`. CI'da PostgreSQL'da `alembic check` ham o'tadi.
- **Frontend (`frontend/`):** `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e`. Backend sxemasi o'zgarsa, `npm run gen:api` va `types.ts` ni moslash.
- **Qo'lda tekshiruv:** backend (`uvicorn --factory`) va `vite dev` ishga tushiriladi, bosqichning "Tayyor" mezoni brauzerda bosqichma-bosqich o'tib ko'riladi.

## Keyingi aniq qadam

1. ✅ 2-bosqich `main`ga merge qilindi va push qilindi (2026-10-13). Push'dan keyingi CI natijasini tekshirish kerak: 2B uchun testlar yozilmagan, `frontend`/`e2e` joblari yiqilishi mumkin.
2. 2-bosqichning "Tayyor" mezonini qo'lda brauzerda tekshirish: talaba test yechadi va XP oladi, o'qituvchi vazifani baholaydi, talaba ballni ko'radi.
3. Qoldirilgan testlar: 2B uchun Vitest testlari va E2E baholash oqimi (testlarni loyiha oxirida yozish qarori o'zgarmasa, bu band 4-bosqichdan keyinga qoladi; o'shanda CI'dagi `frontend` va `e2e` joblari ham tekshiriladi).
4. 3-bosqich (AI) mini-spec'i.
