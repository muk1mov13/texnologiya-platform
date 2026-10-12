# O'zgarishlar jurnali

Loyihadagi barcha o'zgarishlar shu yerda sana bo'yicha qayd etiladi: kod, hujjatlar, infratuzilma, shuningdek GitHub'dagi amallar (repo, PR, merge). Eng yangi yozuvlar yuqorida. Har bir yozuv yonida commit hash'i yoki tegishli havola bor.

---

## 2026-10-11 — 2-bosqich mini-spec'i va 2A rejasi

### 2A Task 8 — vazifalar va javob yuborish
- O'qituvchi (`/api/teach`):
  - `GET` va `PUT /steps/{id}/task` — bosqichda bitta vazifa, faqat `task` bosqichida (`TASK_WRONG_STEP`);
  - `DELETE /tasks/{id}` — javoblar va ularning fayllari bilan.
- Talaba:
  - `PUT /api/tasks/{id}/submission` (multipart: matn va/yoki fayl). Turi bo'yicha qoidalar: `SUBMISSION_FIELD_NOT_ALLOWED`, `SUBMISSION_EMPTY`. Baholangan javob tahrirlansa `SUBMISSION_GRADED` (409).
  - Javob yuborilganda bosqich tugaydi va birinchi marta `task_submitted` (20 XP) beriladi.
  - Kechikish `is_late` bilan belgilanadi.
  - `GET /api/submissions/{id}/file` — faqat javob egasiga.
- Fayl: 20 MB gacha, pdf/doc/docx/ppt/pptx/jpg/png, magic bytes bilan tekshiriladi. Almashtirilgan eski fayl diskdan o'chiriladi.
- `learning/editing.py`: fan yoki mavzu o'chirilganda javob fayllari ham diskdan o'chiriladi (`_submission_paths`).
- Yangi `assessment/tasks.py`.
- Testlar: `tests/test_tasks.py` (8 ta). Jami 204 test yashil.

### `79ff6b8` — 2A Task 7: urinishlar, bosqichni tugatish va XP
- Yangi `POST /api/activities/{id}/attempts`:
  - javoblar serverda tekshiriladi, natijada ball va to'liq tahlil qaytadi (to'g'ri javob va izoh bilan); natija urinish ichiga nusxa qilib saqlanadi;
  - noto'g'ri formatdagi javoblar `ATTEMPT_INVALID_ANSWERS` oladi;
  - nashr qilinmagan yoki yashirin mavzudagi faoliyat `ACTIVITY_NOT_FOUND` (404) oladi;
  - krossvord javoblari normallashtirib solishtiriladi.
- Bosqich nashr qilingan har bir faoliyatga urinish bo'lganda tugaydi. `best_score` — eng yaxshi foizlar o'rtachasi.
- XP:
  - `activity_completed` (10–20) va `activity_perfect` (+10) har faoliyat uchun bir marta beriladi;
  - "Tugatdim" uchun `step_completed` (10);
  - mavzuning barcha kontentli bosqichlari tugaganda `topic_completed` (50).
- `POST /api/steps/{id}/complete` javobi `StepCompleteOut` bo'ldi (`rewards` qo'shildi, eski maydonlar saqlangan).
- `progress._get_or_create_progress` nomi `get_or_create_progress` ga o'zgardi va yangi `topic_completion_rewards()` qo'shildi.
- Yangi fayllar: `assessment/attempts.py`, `assessment/router.py`.
- Testlar: `tests/test_attempts.py` (7 ta). Jami 196 test yashil.

### `2994808` — 2A Task 6: talaba bosqich ko'rinishi (javobsiz) va kontent hisobi
- `learning/content.py`: `review`/`practice` bosqichi nashr qilingan faoliyati bo'lsa, `task` bosqichi vazifasi bo'lsa "kontentli" hisoblanadi va mavzu progressiga kiradi.
- `GET /api/steps/{id}` javobiga yangi maydonlar qo'shildi:
  - `activities` — faqat nashr qilinganlar, to'g'ri javobsiz: test variantlari, ha/yo'q bayonotlari, krossvordda faqat koordinata, uzunlik va savol, hamda talabaning eng yaxshi foizi va urinishlar soni;
  - `task` va `submission`.
- Yangi `assessment/views.py` (`activity_views`, `task_view`, `submission_view`, `is_late`, `ATTEMPT_PERCENT`). `assessment/view_schemas.py` talaba sxemalari bilan to'ldirildi.
- Testlar: `tests/test_student_activities.py` (3 ta). Ulardan biri javobda `correct_index`, `answer`, `cells`, `word`, `word_id` va `explanation` kalitlari yo'qligini rekursiv tekshiradi. Jami 189 test yashil.

### `d420690` — 2A Task 5: o'qituvchi uchun faoliyatlar API
- Yangi endpoint'lar (`/api/teach`, faqat fanga biriktirilgan o'qituvchi yoki admin):
  - `GET` va `POST /steps/{id}/activities`;
  - `PUT /steps/{id}/activities/order`;
  - `PUT`, `PATCH` (nashr qilish) va `DELETE /activities/{id}`.
- Faoliyat butunligicha saqlanadi: elementlar to'liq almashtiriladi, krossvord to'ri serverda qayta quriladi. So'rov tanasi `type` bo'yicha discriminator bilan tekshiriladi (test / ha-yo'q / krossvord).
- Faoliyat faqat `review` yoki `practice` bosqichiga qo'shiladi (`ACTIVITY_WRONG_STEP`). Krossvord xatolari:
  - `CROSSWORD_INVALID_WORD`;
  - `CROSSWORD_UNPLACEABLE` (joylashmagan so'zlar bilan);
  - `ACTIVITY_INVALID_ITEMS` (takrorlangan so'z, uzunlik, turni o'zgartirish).
- Yangi fayllar: `assessment/schemas.py`, `view_schemas.py`, `items.py`, `activities.py`, `teach_router.py`. `tests/factories.py` ga faoliyat yordamchilari qo'shildi.
- Testlar: `tests/test_teach_activities.py` (8 ta). Jami 186 test yashil.

### `d229654` — 2A Task 4: baholash modellari va umumiy fayl yordamchilari
- Yangi `app/assessment/models.py`:
  - jadvallar `activities` (krossvordda `layout` JSON), `quiz_questions`, `yesno_items`, `crossword_words`, `attempts` (`result` — har element bo'yicha natija nusxasi), `tasks` (`step_id` unique) va `submissions` ((task, user) unique, `submitted_at`);
  - enum'lar `ActivityType`, `TaskType`, `SubmissionStatus`;
  - `ACTIVITY_STEP_KINDS` (review, practice).
- Yangi `app/core/files.py`:
  - `signature_matches()` — magic bytes tekshiruvi `learning/materials.py` dan ko'chirildi, jpg/jpeg/png imzolari qo'shildi;
  - `file_response()` — himoyalangan faylni beradi (prod'da X-Accel-Redirect).
- `Settings.max_submission_mb = 20`. `.env.example` ga qo'shilmadi, chunki u yerda `MAX_MATERIAL_MB` ham yo'q va sukut qiymatlari koddan olinadi.
- Migratsiya `19d9e2025f03_assessment_tables`: 7 jadval va indekslar. Generatsiyadan keyin `ruff format` bilan formatlandi.
- Testlar: `tests/test_files.py` (6 holat). Jami 178 test yashil.

### `33f878b` — 2A Task 3: krossvord algoritmi
- Yangi `app/assessment/crossword.py` (sof funksiyalar, baza bilan ishlamaydi):
  - `normalize_word()` so'zni katta harfli kataklarga bo'ladi. Oʻ va Gʻ bitta katak, apostrof turlari (`'`, `ʻ`, `ʼ`, `’`, `‘`, `` ` ``) birlashtiriladi, harf bo'lmagan belgi bo'lsa xato beradi.
  - `build_layout()` deterministik "ochko'z" algoritm. Uzun so'z birinchi joylashadi, tanlash tartibi: ko'p kesishma, kichik maydon, koordinata. Yon tomondan tegish taqiqlanadi. Joylashmagan so'zlar `UnplaceableError` bilan qaytadi. Raqamlash `(row, col)` bo'yicha.
  - `layout_to_json()` va `word_matches()`.
- Testlar: `tests/test_crossword.py` (13 ta). Ular aniq to'r koordinatalarini, to'rning to'g'riligini (ortiqcha harf qatori yo'qligi), deterministiklikni, joylashmaydigan so'zni va javobni normallashtirishni tekshiradi. Jami 172 test yashil.
- CHANGELOG yozuvi hook tufayli kod commit'iga tushmay qoldi va alohida commit qilindi.

### `cc875f6` — 2A Task 2: XP berish, seriya va nishonlar
- `app/gamification/service.py`:
  - `award()` XP hodisasini savepoint ichida yozadi. Unique to'qnashuvda hech narsa o'zgarmaydi, shuning uchun XP ikki marta berilmaydi.
  - Seriya Toshkent kuni bo'yicha yangilanadi (doimiy UTC+5, `tzdata` kerak emas). 0 XP'lik hodisa seriyaga ta'sir qilmaydi.
  - Nishon shartlari `xp_events` sonlari va joriy seriyadan tekshiriladi.
  - `award()` commit qilmaydi. Yangi `Rewards`, `rewards_out()`, `xp_total()`.
- `app/gamification/schemas.py`: `BadgeBrief`, `RewardsOut`, `BadgeOut`, `StreakOut`, `ProfileOut`.
- Testlar: takroriy hodisa, nishon bir marta berilishi, ketma-ket kunlar, Toshkent kun chegarasi (UTC 18:59 / 19:00), uzilish, 0 XP, mavzu nishonlari. Jami 159 test yashil.

### `9e9666c` — 2A Task 1: gamifikatsiya modellari va nishonlar
- Yangi `app/gamification/` moduli:
  - `models.py` — `xp_events` ((user, reason, ref_type, ref_id) unique), `streaks`, `badges`, `user_badges`;
  - `rules.py` — `XpReason`, XP qiymatlari, yarmi yuqoriga yaxlitlash (`round_half_up`), 10 ta nishon ta'rifi (`BADGES`);
  - `service.py` — `sync_badges()`: nishonlarni bazaga idempotent yozadi.
- `sync_badges` ilova lifespan'ida va testlardagi `app` fixture'ida chaqiriladi.
- Migratsiya `c82b084aa586_gamification_tables`.
- Testlar: `tests/test_gamification.py` (XP yaxlitlash, sinxronizatsiya idempotentligi). Jami 152 test yashil.

### `0e631a6` — 2A (backend) implementatsiya rejasi
- Yangi `docs/superpowers/plans/2026-10-11-phase-2a-backend.md`: 12 ta task (0–11), TDD bilan:
  - gamifikatsiya modellari va `award()`;
  - krossvord algoritmi;
  - baholash modellari;
  - o'qituvchi faoliyat muharriri;
  - talaba bosqich ko'rinishi;
  - urinishlar;
  - vazifalar;
  - tekshirish navbati;
  - bosh sahifa, natijalar va statistika;
  - API tiplari.
- Mini-spec'ga 6 ta aniqlik kiritildi:
  - format xatolari `VALIDATION_ERROR` bilan qaytadi;
  - yangi `GET /teach/steps/{id}/task`;
  - bosh sahifada `continue` → `continue_step`;
  - uzilgan seriya 0 deb ko'rsatiladi;
  - biriktirilmagan o'qituvchiga javob 404 bilan qaytadi;
  - XP testi takroriy chaqiruv orqali tekshiriladi.

### `3880fb3` — 2-bosqich mini-spec'i
- Yangi `docs/superpowers/specs/2026-10-11-phase-2-assessment-design.md` (baholash va gamifikatsiya). Brainstorming'da hal qilingan qarorlar:
  - reja 2A (backend) va 2B (frontend) ga bo'linadi;
  - `review`/`practice` bosqichida bir nechta faoliyat bo'lishi mumkin, bosqich hammasi yakunlanganda tugaydi;
  - urinishdan keyin to'liq tahlil ko'rsatiladi;
  - har talabada vazifaga bitta javob, o'qituvchi uni qaytara oladi;
  - muddat o'tsa javob "kechikkan" belgisi bilan qabul qilinadi.
- Gamifikatsiya: XP jadvali kodda, seriya Toshkent kuni bo'yicha, 10 ta nishon.
- Krossvord uchun deterministik ochko'z algoritm tanlandi.
- Asosiy spec'dagi modellarga soddalashtirishlar kiritildi, API, frontend sahifalari, xato kodlari va testlar ro'yxati yozildi.

### `feat/phase-2-assessment` GitHub'ga push qilindi
- Branch `origin/feat/phase-2-assessment` ga upstream bilan push qilindi (`b467a71` gacha). PR hali ochilmagan.

### `b5c3925` — `.gitignore`: Playwright MCP papkasi
- `.gitignore`ga `.playwright-mcp/` qo'shildi: Playwright MCP vositasi yaratadigan vaqtinchalik fayllar repoga tushmaydi.

## 2026-10-10 — Texnik audit va frontend testlarini barqarorlashtirish

### `125b8f5` — Roadmap repoga ko'chirildi (`feat/phase-2-assessment` branch'i)
- 2-bosqich uchun `feat/phase-2-assessment` branch'i lokal `main` dan ochildi; `main` faqat PR orqali o'zgargani uchun PR #2 merge qaydi (`263c327`) ham shu branch bilan kiradi.
- Yangi `docs/superpowers/roadmap.md`: 2026-10-09 da tasdiqlangan, shu paytgacha faqat lokal (`~/.claude/plans/`) turgan yo'l xaritasi. Ko'chirishda yangilandi:
  - "Kontekst": 1A (PR #1, `59def80`) va 1B (PR #2, `0cc93d6`) `main` da, CI uch job bilan yashil;
  - ish tartibi: subagent o'rniga task ketma-task, har task'dan keyin tasdiq;
  - 0-qadam va 1B "bajarildi" deb belgilandi, 1B'ning CI bandi haqiqatga moslandi, qo'lda tekshirilmagan bandlar ro'yxati qo'shildi;
  - "Keyingi aniq qadam": 2-bosqich mini-spec'i.
  - 2–4-bosqich bo'limlari o'zgarishsiz.
- `CLAUDE.md`: "Project" bandiga roadmap havolasi qo'shildi.

### 1B GitHub'ga joylandi — PR #2
- `feat/phase-1b-frontend` branch'i push qilindi va `main` ga PR ochildi: https://github.com/muk1mov13/texnologiya-platform/pull/2 ("Phase 1B: frontend").
- CI birinchi urinishda yashil o'tdi: `backend` (1m42s), `frontend` (1m18s), `e2e` (59s, API tiplari drift tekshiruvi va Playwright bilan).
- **`0cc93d6`:** PR #2 foydalanuvchi tasdig'i bilan `main` ga merge commit bilan birlashtirildi. `feat/phase-1b-frontend` branch'i GitHub'da o'chirildi. 1-bosqich (1A backend + 1B frontend) yopildi.

### `6d4a974` — Task 18: CI, hujjatlar, API tiplari mosligi va yakuniy tekshiruv
- `.github/workflows/ci.yml`: `backend` job'i o'zgarmadi, ikkita yangi job qo'shildi:
  - `frontend`: lint, typecheck, Vitest, build;
  - `e2e` (`backend` va `frontend` dan keyin): API tiplari drift tekshiruvi, so'ng Playwright; yiqilsa hisobot artefakt sifatida saqlanadi.
- G-band (`openapi-typescript`) — tanlangan variant: generatsiya + moslik tekshiruvi, mavjud kod o'zgarmaydi:
  - `frontend/scripts/gen-api-types.mjs` (`npm run gen:api`): sxema server ishga tushirilmasdan `create_app().openapi()` dan olinadi va `src/api/schema.gen.ts` ga yoziladi; `defaultNonNullable: false` — so'rovlarda sukut qiymatli maydon ixtiyoriy;
  - `src/api/types.contract.ts`: qo'lda yozilgan `types.ts` dagi 34 ta tip generatsiya qilingan sxema bilan tip darajasida solishtiriladi (javoblar: backend qiymati frontend tipiga sig'adi; so'rovlar: aksincha; maydon nomlari to'liq bir xil). Tekshiruv sinab ko'rildi: `types.ts` vaqtincha buzilganda (`token_type` tipi, `teacher_ids` olib tashlandi) `tsc` ikkalasini ham ushladi;
  - CI `gen:api` ni qayta ishga tushirib, `schema.gen.ts` commit qilingan nusxadan farq qilmasligini tekshiradi;
  - `openapi-typescript` 7.13.0 peer sifatida TypeScript `^5` so'raydi; `package.json` dagi `overrides` bilan loyihadagi TS 6.0.3 berildi (`--force` va `--legacy-peer-deps` ishlatilmadi).
- `frontend/README.md`: ishga tushirish, tekshiruvlar, E2E, tiplar mosligi, tuzilma.
- `CLAUDE.md`: loyiha holati yangilandi; frontend buyruqlari, uchta CI job'i va yangi "Architecture (frontend)" bo'limi (auth, guard'lar, `QueryState`, xatolar, API tiplari, i18n, testlar).
- **Yakuniy tekshiruv:**
  - frontend: ESLint, `tsc`, 33/33 fayl va 178/178 test, build, E2E 1 passed;
  - backend: 149 test, `ruff format --check`, `ruff check`, `mypy` — hammasi o'tdi;
  - rejadagi "1B'da backend o'zgarmagan" sharti eskirgan: branch'da backend'ga 3 ta ataylab qilingan auth tuzatishi kirgan (`5713b46`, `4d7b3b5`, `4dbbaa6` — refresh grace window va cookie tozalash), ular CHANGELOG va `CLAUDE.md` da hujjatlangan;
  - spec'dagi qo'lda tekshiruv (PPTX → PDF LibreOffice bilan, uz/ru interfeys, 375px'da gorizontal scroll yo'qligi, o'qituvchi biriktirish oqimi) hali qilinmagan.

### `348ae58` — Task 17: Playwright E2E: to'liq o'quv oqimi
- `frontend/e2e/learning-flow.spec.ts` — bitta stsenariy:
  1. admin fan yaratadi, mavzu qo'shadi, PDF yuklaydi va nashr qiladi;
  2. talaba ro'yxatdan o'tadi va `/pending` ga tushadi;
  3. admin talabani tasdiqlaydi;
  4. talaba kirib mavzuni ochadi, PDF ko'rsatiladi, "Tugatdim" bosiladi;
  5. `/app` da progress 1/1 bo'ladi.
- `frontend/e2e/start-backend.mjs`: E2E uchun toza backend. 8001 portda; `e2e/.data/` dagi yangi SQLite, migratsiyalar, admin va `pymupdf` bilan namuna PDF yaratiladi, so'ng uvicorn ishga tushadi.
- `frontend/playwright.config.ts`: backend va `vite preview` (4174 port, `/api` → 8001) webServer sifatida; bitta worker, Chromium.
- `frontend/e2e/i18n.ts`: testlar matnlarni `uz.json` dan oladi.
- Shu test Task 13 va Task 16 da qolgan qo'lda tekshiruvning asosiy qismini (PDF yuklash → "Tayyor", fan yaratish va nashr) haqiqiy backend bilan qamradi. PPTX konvertatsiyasi va o'qituvchi biriktirish E2E'da tekshirilmaydi.
- **Tekshiruv:**
  - `npx playwright install chromium`, so'ng `npm run e2e`: 1 passed (~26 s);
  - ESLint va `tsc` xatosiz (E2E fayllari `tsconfig.node.json` ga kiradi).

### `b8848d0` — Task 16: Admin: fanlar (yaratish, tahrirlash, nashr, o'qituvchi biriktirish, o'chirish)
- `frontend/src/features/admin/AdminSubjectsPage.tsx` (stub o'rniga to'liq sahifa):
  - fanlar ro'yxati: slug, biriktirilgan o'qituvchilar, "nashr qilingan" yoki "qoralama" belgisi;
  - bitta tugma bilan nashr qilish yoki nashrdan olish, tasdiq bilan o'chirish.
  - Rejadan farqi: yuklanish va xato holati `QueryState` orqali.
- `SubjectFormModal.tsx`:
  - fan yaratish va tahrirlash formasi (nomi, slug, tavsif, tartib raqami, nashr);
  - bo'sh slug `null` bo'lib yuboriladi va backend uni nomdan yaratadi;
  - server xatosi (masalan, `SLUG_TAKEN`) modal ichida ko'rsatiladi.
- `TeachersModal.tsx`: faol o'qituvchilar ro'yxatidan belgilab biriktirish (`PUT .../teachers`).
- `schemas.ts`: fan formasining zod sxemasi.
- `AdminSubjectsPage.test.tsx`: 5 ta test.
- **Tekshiruv:**
  - to'liq suite 33/33 fayl va 178/178 test;
  - ESLint va `tsc` xatosiz;
  - backend bilan qo'lda tekshiruv (fan yaratish, o'qituvchi biriktirish, o'qituvchi `/teach` da fanni ko'rishi) hali qilinmagan.

### `660fb12` — Task 15: Admin: API hook'lari va foydalanuvchilar sahifasi
- Yangi `frontend/src/api/admin.ts`:
  - foydalanuvchilar: ro'yxat (holat filtri, qidiruv), rol yoki holatni o'zgartirish, vaqtinchalik parol;
  - fanlar (Task 16 uchun): ro'yxat, yaratish, tahrirlash, o'chirish, o'qituvchi biriktirish; faol o'qituvchilar ro'yxati.
- `frontend/src/features/admin/AdminUsersPage.tsx` (stub o'rniga to'liq sahifa):
  - sukut bo'yicha "tasdiq kutayotganlar" filtri bilan ochiladi; holat tablari va ism yoki email bo'yicha qidiruv;
  - tasdiqlash, bloklash, blokdan chiqarish va rol tanlash;
  - vaqtinchalik parol modal oynada faqat bir marta ko'rsatiladi;
  - adminning o'z qatorida "(siz)" belgisi bor, rol tanlovi o'chirilgan, amal tugmalari yo'q.
  - Rejadan farqi: yuklanish va xato holati `QueryState` orqali; rol tanlovida `as Role` o'rniga `isRole` tekshiruvi.
- `AdminUsersPage.test.tsx`: 5 ta test.
- **Tekshiruv:**
  - to'liq suite 32/32 fayl va 173/173 test;
  - ESLint va `tsc` xatosiz.

### `318512e` — Task 14: Mavzu muharriri: glossariy va adabiyotlar
- `frontend/src/features/teach/GlossaryTab.tsx` va `LiteratureTab.tsx`:
  - yozuvlar ro'yxati;
  - har bir qator joyida formaga aylanib tahrirlanadi, o'chirish tasdiq oynasi bilan;
  - pastda yangi yozuv qo'shish formasi, muvaffaqiyatdan keyin forma tozalanadi;
  - adabiyotda bo'sh yil va havola `null` bo'lib, yil esa son bo'lib yuboriladi; yil (1900–2100) va havola (`http(s)://`) tekshiriladi.
- `TopicEditorPage.tsx`: `glossary` va `literature` tablari shu komponentlarga ulandi.
- Testlar: `GlossaryTab.test.tsx` (4 ta), `LiteratureTab.test.tsx` (3 ta).
- **Tekshiruv:**
  - to'liq suite 31/31 fayl va 168/168 test;
  - ESLint va `tsc` xatosiz.

### `5c639f7` — Task 13: Mavzu muharriri: mavzu ma'lumotlari, 7 bosqich tablari, material yuklash
- `frontend/src/features/teach/TopicEditorPage.tsx` (stub o'rniga to'liq sahifa):
  - mavzu ma'lumotlari formasi, 7 bosqich tablari;
  - tanlangan tab manzilda `?tab=` sifatida saqlanadi;
  - `review`, `practice` va `task` tablarida "keyingi yangilanishda" bo'sh holati;
  - rejadan farqi: yuklanish va xato holati umumiy `QueryState` orqali; noto'g'ri mavzu ID'sida (`/teach/topics/abc`) spinner to'xtamay aylanmaydi, "topilmadi" holati chiqadi.
- `TopicDetailsForm.tsx`: nomi, qisqacha mazmuni va "nashr qilingan" belgisi (`PATCH`).
- `MaterialsTab.tsx`:
  - `lecture` va `presentation` tablarida fayl yuklash;
  - material holati (qayta ishlanmoqda, tayyor · N bet, xato va uning sababi);
  - qayta urinish va tasdiq bilan o'chirish.
- `schemas.ts`: mavzu, glossariy va adabiyot formalarining zod sxemalari (glossariy va adabiyot Task 14 da ulanadi).
- `TopicEditorPage.test.tsx`: 6 ta test.
- **Tekshiruv:**
  - to'liq suite 29/29 fayl va 161/161 test;
  - ESLint va `tsc` xatosiz;
  - backend bilan qo'lda tekshiruv (PDF/PPTX yuklash) hali qilinmagan.

### `88e447f` — Ish tartibi cheklovlari hujjatlashtirildi
- `CLAUDE.md`: yangi "Execution Constraints" bo'limi:
  - subagent ishlatilmaydi;
  - bir vaqtda faqat bitta task bajariladi, tugagach tasdiq kutiladi;
  - test ikki marta yiqilsa, ish to'xtatilib hisobot beriladi.
  - Shuningdek, ro'yxatlardan oldin bo'sh qatorlar qo'shildi (markdown formati).
- `docs/superpowers/plans/2026-10-09-phase-1a-backend.md` va `2026-10-09-phase-1b-frontend.md`: "subagent-driven-development" ko'rsatmasi olib tashlandi, yangi cheklovlarga mos.

### Texnik audit (faqat o'qish rejimida)
- Frontend (1–12 task'lar) mustaqil tekshirildi: tiplar, backend bilan moslik, arxitektura, testlar sifati, ishlatilmayotgan kod.
- Topilgan yaxshi tomonlar:
  - `any` va `@ts-ignore` yo'q.
  - `api/types.ts` backend sxemalariga maydonma-maydon mos, endpoint yo'llari ham mos.
  - Backend'ning barcha xato kodlari uz/ru lug'atida bor.
  - ESLint va tsc toza.
- Kritik muammolar:
  1. Frontend testlari beqaror edi (worker'lar yiqilib qolardi) — **shu yozuvda tuzatildi**.
  2. `REFRESH_ROTATED` holatida backend cookie'ni o'chiradi, frontend esa 401'ni "sessiya yo'qoldi" deb hisoblaydi. Natijada parallel tab yoki uzilgan sahifa yangilanishi baribir tizimdan chiqarib yuboradi (`backend/app/auth/router.py`, `frontend/src/api/client.ts`). Qayta ko'rib chiqildi va ma'lum cheklov sifatida hujjatlandi, tuzatish keyinga qoldirildi (pastga qarang).
  3. Task 12 review tuzatishlari hali commit qilinmagan edi — **tuzatildi** (pastga qarang).
- Zaif joylar (navbatda turibdi):
  - `PlayerPage` bo'sh `steps` yoki topilmagan `kind` holatida yiqiladi.
  - O'qituvchi o'zgarishlaridan keyin talabaning `['steps']` keshi yangilanmaydi (`api/teach.ts`).
  - Logout va yo'naltirish mantig'i 3 joyda takrorlangan.
  - Har sahifada "avval ma'lumot, keyin spinner yoki xato" bloki qo'lda yozilgan.
  - `LanguageSwitch` xato bo'lsa tilni orqaga qaytarmaydi.
  - Javoblar runtime'da tekshirilmaydi (`as T`).
- Tuzatish tartibi: testlar barqarorligi → Task 12 commit → `PlayerPage` → `teach.ts` keshlari → `REFRESH_ROTATED` → refaktor → OpenAPI'dan tiplar va frontend CI.

### `b5c18ba` — 1-kritik muammo tuzatildi: frontend testlari beqarorligi
- **Belgi:** `vitest run` har safar boshqa fayllarda `Worker exited unexpectedly` (kod `0xC0000409` / `134`) bilan yiqilardi. Ishga tushgan testlar o'tardi, lekin buyruq xato bilan tugardi.
- **Sabab:** Vitest sukut bo'yicha yadrolar soniga teng (8 ta) worker ochadi. Har biri o'z jsdom muhitini yaratadi. Bo'sh xotira ~0.6 GB bo'lgan mashinada ular RAM'ni to'ldirib yuborardi. `--maxWorkers=2` bilan yiqilish yo'qolgani sababni tasdiqladi.
- `frontend/vite.config.ts`: `test.maxWorkers: 2`.
- `frontend/src/test/setup.ts`: MSW handler'i yo'q so'rovlar endi yig'iladi va `afterEach`da testni aniq xabar bilan yiqitadi. Ilgari `onUnhandledFrame: 'error'` faqat konsolga yozardi, test esa o'tib ketardi. Himoya vaqtinchalik test bilan tekshirildi (test yiqildi, fayl o'chirildi).
- Shu himoya yashirin muammoni topdi: "parol almashgach sessiya yopiladi" testi mock'siz `POST /api/auth/logout` yuborardi. Xatoni `.catch` yutgani uchun test shu paytgacha o'tib kelgan. `ProfilePage.test.tsx`ga handler qo'shildi va logout so'rovi yuborilgani ham tekshiriladi.
- **Natija:**
  - ketma-ket 2 marta 27/27 fayl va 145/145 test o'tdi (ilgari 1–3 fayl ishga tushmasdan yiqilardi), har biri ~37 s;
  - ESLint va `tsc` (app + node) xatosiz.

### `d5ff311` — 2-kritik muammo (`REFRESH_ROTATED`) ma'lum cheklov sifatida hujjatlandi
- **Qayta baholash:** auditdagi baho oshirib yuborilgan edi.
  - Muvaffaqiyatsiz refresh'da cookie'ni o'chirish ataylab qilingan, test bilan himoyalangan qaror (`test_failed_refresh_clears_cookie`). U uzilgan sahifa yangilanishidan keyin `REFRESH_REUSED` barcha qurilmalardagi sessiyalarni yopishining oldini oladi.
  - Parallel tablar poygasini frontend Web Locks navbati (`client.ts`, `withAuthLock`) allaqachon yopib qo'ygan.
  - Muammo faqat Web Locks yo'q eski brauzerlarda (masalan, Safari 15.4 dan eski) qoladi va faqat shu brauzerdagi sessiyaga ta'sir qiladi.
- **Qaror:** kod o'zgartirilmadi. Spec'ning 6-bo'limiga (Xavfsizlik → Tokenlar) cookie o'chirish sababi, "Ma'lum cheklov" va kelajakdagi yechim yozildi. Yechim: `REFRESH_ROTATED` da cookie o'chirilmaydi, frontend bir marta qayta urinadi, bo'lmasa `/api/auth/logout` orqali eski cookie'ni tozalaydi.

### `9cc2674` — 3-kritik muammo: Task 12 review tuzatishlari commit qilindi
- `frontend/src/api/teach.ts`:
  - o'qituvchi mavzu yaratsa, tahrirlasa, tartiblasa yoki o'chirsa, glossariy yoki adabiyotni o'zgartirsa, talabaning `['subjects']` va `['topics']` keshlari ham yangilanadi;
  - o'chirilgan mavzuning muharrir keshi tozalanadi;
  - so'rov xato bilan tugasa, material holatini so'rab turish (polling) to'xtaydi;
  - yangi mavzu yaratilgach muharrirga o'tish `invalidateQueries`ni kutmaydi.
- `frontend/src/features/teach/TeachHomePage.tsx`:
  - tartiblash xato bilan tugasa, fokus surilgan tugmaga qaytadi;
  - so'rov paytida tugmalar `disabled` emas, `aria-disabled` bo'ladi, shunda fokus yo'qolmaydi;
  - mavzu havolasida fokus halqasi bor, tartib raqami kontrasti oshirildi.
- Testlar: `api/teach.test.ts` o'rniga kengaytirilgan `api/teach.test.tsx`, `TeachHomePage.test.tsx`ga xato, fokus va o'chirish ssenariylari qo'shildi.
- **Tekshiruv:**
  - to'liq suite 27/27 fayl va 145/145 test (ikki marta);
  - Task 12 testlari 21/21;
  - ESLint, `tsc` va `npm run build` xatosiz (`PdfViewer` chunk'i 632 kB ekani haqida ogohlantirish bor — u ataylab lazy yuklanadi).

### "Sayoz/zaif yechimlar" bo'limi qayta baholandi
- Har bir band kodning hozirgi holati bilan qayta tekshirildi:
  - **A.** `PlayerPage` bo'sh `steps` yoki topilmagan `kind` da yiqiladi — tuzatiladi.
  - **B.** Talaba keshi: Task 12 da qisman tuzatilgan. `['steps']` va material mutatsiyalari qoldi — tuzatiladi.
  - **C.** `LanguageSwitch` xatoda tilni qaytarmaydi — tuzatiladi.
  - **D.** `TeachHomePage` dagi `as`-cast va `eslint-disable` — tuzatiladi, kod tozaligi uchun.
  - **E.** Takrorlangan logout — oshirib baholangan: bir xil kod 3 emas, 2 joyda, `auth.ts` dagisi ataylab boshqacha. O'zgartirilmaydi.
  - **F.** "Ma'lumot → spinner → xato" bloki 5 joyda takrorlangan — Task 13 dan boshlab umumiy `QueryState` yordamchisi bilan.
  - **G.** Javoblar runtime'da tekshirilmaydi (`as T`) — Task 18 da `openapi-typescript` bilan tiplar generatsiyasi va CI'da drift tekshiruvi.
- Tartib: A → B → C → D, har biri alohida commit.

### `e6bcdf2` — A-band: `PlayerPage` chegaraviy holatlarda yiqilmaydi
- `frontend/src/features/student/PlayerPage.tsx`:
  - mavzuda bosqich umuman bo'lmasa, xato sahifasi o'rniga "material yo'q" bo'sh holati ko'rsatiladi;
  - manzildagi bosqich turi to'g'ri, lekin shu mavzuda bo'lmasa, birinchi kontentli bosqichga yo'naltiriladi (ilgari `current.id` da xato berardi).
- `PlayerPage.test.tsx`: shu ikki holat uchun testlar.
- **Tekshiruv:**
  - to'liq suite 27/27 fayl va 147/147 test;
  - ESLint va `tsc` xatosiz.
  - Eslatma: birinchi to'liq ishga tushirishda deyarli barcha fayllar o'zgarishga aloqasi bo'lmagan holda ochilish bosqichida yiqildi. Bitta fayl alohida, keyin to'liq suite qayta ishga tushirilganda xatosiz o'tdi. Ehtimol sabab yana kam xotira (bo'sh RAM ~0.8 GB); aniq sababi ushlanmadi.

### `f1e561b` — B-band: o'qituvchi o'zgarishlaridan keyin talaba bosqich keshi ham yangilanadi
- `frontend/src/api/teach.ts`:
  - `invalidateStudentCaches` endi `['subjects']` va `['topics']` dan tashqari `['steps']` ni ham yangilaydi. Bosqich kontenti (materiallar, glossariy, adabiyotlar) shu keshda turadi.
  - Material yuklash, o'chirish va qayta urinish (`useUploadMaterial`, `useDeleteMaterial`, `useRetryMaterial`) talaba keshlarini ham yangilaydi. Ilgari faqat o'qituvchi muharriri yangilanardi.
  - Amaldagi ta'sir: o'qituvchi talaba ko'rinishini (`/app`) ochganda endi 30 soniyagacha eski kontentni ko'rmaydi.
- `api/teach.test.tsx`: retry, delete va glossariy mutatsiyalaridan keyin `['steps', id]` keshi invalidatsiya qilingani tekshiriladi.
- **Tekshiruv:**
  - to'liq suite 27/27 fayl va 147/147 test;
  - ESLint va `tsc` xatosiz.

### `15c2c4b` — C-band: til saqlanmasa interfeys avvalgi tilga qaytadi
- **Muammo:** til almashtirilganda `PATCH /api/me` xato bersa, ekran yangi tilda qolardi, serverda esa eski til saqlanardi. Keyingi kirishda til "o'zidan" o'zgarib qolardi.
- **Birinchi urinish ishlamadi:** qaytarish `LanguageSwitch` dagi `mutate(..., { onError })` ga qo'yilgan edi. Yangi test ikki marta yiqildi (til `ru` bo'lib qoldi), CLAUDE.md qoidasi bo'yicha ish to'xtatilib hisobot berildi. Sabab: komponent darajasidagi callback chaqirilmadi (TanStack Query uni faqat kuzatuvchi hali o'sha mutatsiyaga bog'liq bo'lsa chaqiradi). `useChangePassword` dagi kabi holat.
- **Yechim:** `frontend/src/api/auth.ts` → `useUpdateMe`:
  - `onMutate`: so'rovda `locale` bo'lsa, avvalgi til eslab qolinadi va yangi til darhol o'rnatiladi;
  - `onError`: til hali o'sha bo'lsa (foydalanuvchi shu orada boshqa tilni tanlamagan bo'lsa), avvalgisiga qaytariladi.
  - `ProfilePage` `locale` yubormaydi, unga ta'sir yo'q.
- `frontend/src/app/layouts/LanguageSwitch.tsx`: kirgan foydalanuvchida tilni hook almashtiradi, mehmonda avvalgidek `setLanguage`.
- `AppLayout.test.tsx`: server 500 qaytarsa, til `uz` ga, `<html lang>` ham `uz` ga qaytadi va xato toast chiqadi.
- Kichik eslatma: xato toast'i til qaytarilishidan oldin chiqadi, shuning uchun uning matni yangi tanlangan tilda bo'ladi.
- **Tekshiruv:**
  - to'liq suite 27/27 fayl va 148/148 test;
  - ESLint va `tsc` xatosiz.

### `1114f70` — D-band: `TeachHomePage` dan `as`-cast va `eslint-disable` olib tashlandi
- `frontend/src/features/teach/TeachHomePage.tsx`:
  - `isUsable`: `el as HTMLButtonElement` o'rniga `el instanceof HTMLButtonElement` tekshiruvi;
  - fokusni qaytarish effekti: mantiq `useEffectEvent` ichiga ko'chirildi, effekt faqat `topics` o'zgarganda ishlaydi, `eslint-disable-next-line react-hooks/exhaustive-deps` kerak bo'lmay qoldi (eslint-plugin-react-hooks 7.1.1).
- Xatti-harakat o'zgarmadi: mavjud fokus testlari o'zgarishsiz o'tdi.
- **Tekshiruv:**
  - to'liq suite 27/27 fayl va 148/148 test;
  - ESLint va `tsc` xatosiz.
- Shu bilan "Sayoz/zaif yechimlar" bo'limidagi A–D bandlar yopildi. E o'zgartirilmaydi, F (Task 13 da `QueryState`) va G (Task 18 da `openapi-typescript`) keyinga qoldirildi.

### Qayta ko'rib chiqish: E va F bandlar bo'yicha qaror o'zgardi
- Foydalanuvchi auditning qolgan qismlarini qayta yubordi va quyidagilarni tanladi:
  - **E:** takrorlangan logout faqat 2 joyda birlashtiriladi;
  - **F:** `QueryState` hozir yoziladi va 5 ta sahifa unga ko'chiriladi.
- Qolgan ishlar tartibi:
  1. `useLogoutAndRedirect`;
  2. `QueryState`;
  3. chegara holat testlari (`REFRESH_ROTATED`, "Tugatdim" ni ikki marta bosish).

### `b341ad4` — 1-qadam: `useLogoutAndRedirect` — takrorlangan logout birlashtirildi
- `frontend/src/api/auth.ts`: yangi `useLogoutAndRedirect()` hook'i (`useLogout` + `useNavigate`). U `{ logout, isPending }` qaytaradi va muvaffaqiyatda `/login` ga qaytish manzilisiz, `flushSync` bilan o'tadi. Bu tartibning sababi endi bitta joyda yozilgan.
- `AppLayout.tsx` va `PendingPage.tsx` shu hook'ga o'tdi, ikki joydagi takror kod va izoh olib tashlandi.
- `useChangePassword` o'zgarmadi: unda navigatsiya ataylab hook darajasida (sahifa unmount bo'lgandan keyin ham ishlashi kerak).
- **Tekshiruv:**
  - mavjud logout testlari o'zgarishsiz o'tdi;
  - to'liq suite 27/27 fayl va 148/148 test;
  - ESLint va `tsc` xatosiz.

### `63be210` — 2-qadam: `QueryState` — "ma'lumot → spinner → xato" takrori birlashtirildi
- Yangi `frontend/src/components/ui/QueryState.tsx`:
  - ma'lumot bor bo'lsa (fon qayta so'rovi xato bersa ham) uni chizadi;
  - yuklanayotganda `PageSpinner`;
  - aks holda `ErrorState`, qayta urinish tugmasi faqat `canRetry` rost bo'lsa (5xx yoki tarmoq xatosi).
  - O'chiq (`enabled: false`) so'rov abadiy `isPending` bo'lgani uchun bunday holat chaqiruvchida oldindan ajratiladi.
- Ko'chirilgan joylar:
  - `SubjectsPage` (`SubjectList`), `SubjectPage`, `TeachHomePage`;
  - `PlayerPage`: tana yangi `PlayerBody` komponentiga chiqdi, hook'lar tartibi o'zgarmadi;
  - `StepContent`: kontentsiz bosqich `QueryState` dan oldin ajratiladi.
  - Har biridagi takrorlangan izoh va importlar olib tashlandi.
- `PdfViewer` ko'chirilmadi: spinner va xato konteyner ichida, shakli boshqa.
- `QueryState.test.tsx`: 5 ta test — spinner, ma'lumot, 4xx (tugmasiz), 5xx (tugma so'rovni qayta yuboradi), ma'lumot bor paytda fon so'rovi xatosi.
- **Tekshiruv:**
  - sahifalarning mavjud testlari o'zgarishsiz o'tdi;
  - to'liq suite 28/28 fayl va 153/153 test;
  - ESLint, `tsc` va `npm run build` xatosiz.

### `0c9aaa2` — 3-qadam: chegara holatlar testlari (faqat testlar, kod o'zgarmadi)
- `frontend/src/api/client.test.ts`: refresh 401 `REFRESH_ROTATED` qaytarsa, sessiya yopiladi (`onLost`, token `null`) va refresh qayta urinilmaydi. Bu spec'dagi "ma'lum cheklov"ni test bilan qayd etadi: xatti-harakat o'zgarsa, test buni ko'rsatadi.
- `frontend/src/features/student/PlayerPage.test.tsx`: "Tugatdim" so'rovi kutilayotganda tugma o'chiq va qayta bosish ikkinchi `POST /api/steps/{id}/complete` yubormaydi.
  - Cheklov: test ikkinchi bosishdan oldin tugma o'chishini kutadi, ya'ni odatdagi qayta bosishni tekshiradi. React qayta render qilishga ulgurmasdan bir lahzada sodir bo'ladigan ikki marta bosish alohida tekshirilmagan.
- Ikkala test ham birinchi urinishda o'tdi — yangi xato topilmadi.
- **Ochiq savol — `/api/me/progress`:** backend endpoint'i tayyor va spec'da (1-bosqich API ro'yxati) bor. Lekin 1B rejasida uni ishlatadigan sahifa yo'q (`SubjectProgress` tipi ham ishlatilmaydi). Profil yoki bosh sahifada progress xulosasi kerakmi, yoki endpoint 2-bosqichga qoldiriladimi — qaror kerak.
- **Tekshiruv:**
  - to'liq suite 28/28 fayl va 155/155 test;
  - ESLint va `tsc` xatosiz.
- Shu bilan audit hisobotidagi zaif joylar va test bo'shliqlari bo'yicha rejadagi barcha qadamlar yopildi.
  - Qolganlari reja bo'yicha keyingi task'larda: stub sahifalar va ishlatilmagan tiplar — Task 13–16; frontend CI va `openapi-typescript` — Task 18.

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
- Dizayn tizimi: Button, Card, Badge, Spinner, EmptyState, Field komponentlari.
- UI: ProgressRing, Modal/ConfirmDialog, Tabs, Toast.
- UI tuzatishlari: tab ostidagi chiziq, xatoli maydonlarda fokus ko'rinishi, modalda fokus tutish va scroll qulfi, maydon xatolari aria-describedby orqali bog'landi, toast taymerlari tozalanadi.
- 1B rejasiga Task 3–4 review tuzatishlari haqida eslatma qo'shildi (haqiqiy manba — repodagi komponentlar).
- Modal: Shift+Tab ham oyna ichida qoladi, bir nechta modal uchun scroll qulfi hisoblagich bilan, tasdiqlash oynasida "Bekor qilish" so'rov paytida o'chiriladi.
- API qatlami: tiplar, token xotirada, single-flight refresh, yagona xato matnlari, QueryClient.
- Sessiya: refresh orqali tiklash, login/logout/profil hook'lari, rol bo'yicha route guard'lar.
- Sessiya ishonchliligi: tablar orasida refresh navbatlanadi (Web Locks), logout parallel refresh'ni kutadi va xatoda sessiyani saqlaydi, parol almashgach cookie tozalanadi, 5xx/tarmoq xatolari sessiyani yopmaydi, bloklangan foydalanuvchi chiqariladi, qaytish manzili tekshiriladi.
- Backend: refresh token qayta ishlatilganda 30 soniyalik imtiyoz oynasi (REFRESH_ROTATED) — parallel tablar yoki uzilgan sahifa yangilanishi barcha qurilmalardan chiqarib yubormaydi; spec va CLAUDE.md yangilandi.
- Backend: refresh muvaffaqiyatsiz bo'lsa cookie o'chiriladi (uzilgan sahifa yangilanishi keyinchalik barcha sessiyalarni yopmaydi), muddati o'tgan token qayta ishlatish tekshiruvidan oldin rad etiladi.
- Sessiya: logout ham tablararo qulf ostida ishlaydi, sessiyani tozalash bitta yordamchida, refresh 15 soniyalik timeout bilan, login generation'ni yangilaydi.
- Sessiya: eskirgan refresh natijasi yangi sessiyani yopmaydi, Web Locks bo'lmagan brauzerlarda logout refresh'ni kutadi, logout'ga timeout qo'shildi.
- 1B rejasi yangilandi: logout'dan keyin /login'ga qaytish manzilisiz o'tiladi (Task 7), tasdiq kutish sahifasida "Holatni tekshirish" tugmasi (Task 8).
- Sessiya: logout tartibi testi haqiqiy ketma-ketlikni tekshiradi; cookie yo'q bo'lsa /auth/refresh uni o'chirmaydi.
- Router, ochiq va ichki layout'lar (rol bo'yicha menyu, til almashtirish, chiqish), 404 sahifa va sahifa stub'lari.
- Ochiq sahifalar: bosh sahifa skeleti, kirish, ro'yxatdan o'tish, tasdiq kutish.
- Tasdiq kutish sahifasi: holatni tekshirish natijasi ko'rsatiladi (hali tasdiqlanmagan / sessiya tugagan / xato), sessiya qayta so'rovidagi xato butun ilovani yopmaydi, chiqishdan keyin /login.
- Chiqishdan keyingi yo'naltirish poygasi tuzatildi (flushSync): /login'ga eski sahifa manzilisiz o'tiladi; testlarda qayta urinish kechikishi olib tashlandi; kutish sahifasida status hududi doim mavjud.
- Talaba: fanlar ro'yxati (davom ettirish kartasi, progress halqalari) va mavzu yo'li.
- Talaba sahifalari review tuzatishlari: mavzu yo'li kichik ekranlarda toshmaydi, "Davom ettirish" kartasi doim yangi, bosqich tugatilgani keshga darhol yoziladi, hook testlari, kontrast (WCAG AA), 404'da qayta urinish yo'q.
- Dars pleyeri: 7 bosqich paneli, himoyalangan PDF ko'ruvchi (bir vaqtda bitta material chiziladi, bir nechtasi bo'lsa tanlagich bilan), glossariy, adabiyotlar, "Tugatdim".
- Dars pleyeri review tuzatishlari: PDF ko'ruvchi alohida yuklanadi (asosiy JS ~2x kichik), qayta so'rov xatosi ochiq darsni yopmaydi, 404'da qayta urinish yo'q (umumiy canRetry), bosqich almashganda fokus sarlavhaga o'tadi, PdfViewer testlari.
- Pleyer va talaba sahifalari: sarlavha header ostida qolmaydi, ekran o'quvchi uchun sahifa raqami, umumiy xato sahifasi (lazy chunk xatolari ham), ro'yxat sahifalarida qayta so'rov xatosi kontentni yopmaydi, bo'sh bosqich so'ralmaydi.
- Profil sahifasi: shaxsiy ma'lumotlar, til, parolni almashtirish.
- Profil review tuzatishlari: xato bir marta ko'rsatiladi, saqlangach forma yangilanadi, til faqat locale so'rovida almashadi, validatsiya testlari.
- O'qituvchi: API hook'lari, mavzular ro'yxati (yaratish, ↑/↓ tartiblash, o'chirish).

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
