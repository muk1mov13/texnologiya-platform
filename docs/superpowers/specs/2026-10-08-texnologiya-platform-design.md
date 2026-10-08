# Texnologiya platformasi — dizayn hujjati (spec)

- **Sana:** 2026-10-08
- **Holat:** foydalanuvchi bilan bo'limma-bo'lim kelishilgan, ko'rib chiqishni kutmoqda
- **Asos:** https://texnologiyabuxdpi.uz/ (Django) saytining tahlili. Yangi versiya noldan yoziladi.

---

## 1. Maqsad va doira

Buxoro davlat pedagogika institutining "Metodik ta'minot" platformasini zamonaviy, tez va AI yordamchisi bor platforma sifatida qayta qurish. Platforma bo'lajak texnologik ta'lim o'qituvchilari uchun mo'ljallangan.

**Eski saytda saqlab qolinadigan narsalar:** fan → mavzu → 7 bosqich tuzilmasi, test / ha-yo'q / krossvord / vazifa, o'qituvchi baholashi, admin tasdig'i bilan ro'yxatdan o'tish, metodik va huquqiy hujjatlar papkalari, kitoblar, yangiliklar.

**Yangi imkoniyatlar:**
- yagona "dars pleyeri";
- taqdimotlarni avtomatik PDF'ga aylantirish;
- o'qituvchi uchun qulay muharrir (Django admin o'rniga);
- gamifikatsiya (XP, seriya, nishonlar);
- uz/ru interfeys;
- 4 vazifali AI: repetitor, kontent yaratish, vazifani tekshirish, haftalik tahlil.

**Doiradan tashqari (YAGNI):**
- eski saytdan ma'lumot ko'chirish (kontent qaytadan kiritiladi);
- talaba guruhlari;
- reyting jadvali (leaderboard);
- mobil ilova;
- to'lov tizimi;
- kontentni ko'p tilda saqlash (kontent kiritilgan tilida qoladi);
- email orqali parol tiklash (1-bosqichda parolni admin tiklaydi).

### Qabul qilingan qarorlar

| Mavzu | Qaror |
|---|---|
| Stack | Backend: Python FastAPI. Frontend: React + Vite (TypeScript) |
| Hosting | O'z VPS (Ubuntu) + Docker Compose |
| AI | RAG + provayder adapteri; vaqtincha Google Gemini bepul tarifi |
| AI vazifalari | O'qituvchiga kontent yaratish, vazifani tekshirish, talabaga repetitor, o'qituvchiga tahlil |
| AI chegarasi | Faqat platforma materiallari bo'yicha javob beradi, boshqa savollarni rad etadi |
| Dizayn | "Yorqin ilova" (C) uslubi: yumaloq shakllar, teal rang, do'stona ohang |
| Gamifikatsiya | O'rtacha: XP, kunlik seriya, nishonlar; reyting yo'q |
| Guruhlar | Yo'q: tasdiqlangan har bir talaba barcha nashr qilingan fanlarni ko'radi |
| Til | Interfeys: o'zbek (lotin) + rus. Kontent: kiritilgan tilida |
| Arxitektura | Modulli monolit + fon worker (A varianti) |
| Bosqichlar | Qulflanmaydi; tavsiya qilingan tartib ko'rsatib turiladi |

---

## 2. Arxitektura

Bitta VPS'da Docker Compose bilan 5 ta xizmat ishlaydi:

```
Brauzer ──HTTPS──> nginx ──/api──> api (FastAPI)
                     │                 │  ├─ PostgreSQL 16 + pgvector
                     │                 │  ├─ Redis (navbat, kesh, rate limit)
                     │                 │  └─ Gemini API (tashqi)
                     ├─ React build (statik)
                     └─ /media (X-Accel-Redirect orqali, faqat ruxsat bo'lsa)
worker (arq) <── Redis navbati ── api
   └─ LibreOffice (PPT→PDF), PyMuPDF (PDF→matn), embedding, AI ishlari, cron
```

- **api.** FastAPI ilovasi, ichida modullar: `auth`, `learning`, `assessment`, `gamification`, `library`, `cms`, `ai`. Har bir modulning o'z `models.py`, `schemas.py`, `service.py` va `router.py` fayllari bor. Modullar bir-birining jadvaliga to'g'ridan-to'g'ri emas, faqat `service` funksiyalari orqali murojaat qiladi.
- **worker.** Og'ir va uzoq ishlar shu yerda bajariladi: konvertatsiya, indekslash, AI generatsiya, tekshirish, haftalik hisobot. api bilan bir xil kod bazasidan, alohida jarayon sifatida ishga tushadi. Docker image'ida LibreOffice headless o'rnatilgan.
- **PostgreSQL.** Barcha ma'lumotlar va pgvector (RAG indeksi) shu yerda. Alohida vektor bazasi ishlatilmaydi.
- **Redis.** arq navbati, rate limit hisoblagichlari va qisqa muddatli kesh.
- **nginx.** HTTPS (Let's Encrypt), React build'ni beradi, `/api`ni proksilaydi. Himoyalangan fayllarni api ruxsat tekshirgandan keyin `X-Accel-Redirect` orqali beradi.

### Texnologiyalar

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2 (async, asyncpg), Alembic, Pydantic v2, arq, redis-py, argon2-cffi, PyJWT, PyMuPDF, python-docx. Paketlar `uv` bilan boshqariladi.
- **Frontend:** React, Vite, TypeScript, React Router, TanStack Query, Tailwind CSS v4, react-i18next, react-hook-form + zod, pdf.js (`react-pdf`).
- **Test:** pytest, testcontainers (PostgreSQL), Vitest, React Testing Library, Playwright.
- **CI:** GitHub Actions (lint, type check, testlar).

---

## 3. Ma'lumotlar modeli

Barcha jadvallarda `id` (bigint) va `created_at` bor, kerakli joylarda `updated_at` ham. Fayl maydonlarida diskdagi nisbiy yo'l saqlanadi (`/data/media/...`).

### auth
- `users`: email (unique), phone, password_hash, full_name, role (`student|teacher|admin`), status (`pending|active|blocked`), locale (`uz|ru`), last_seen_at.
- `refresh_sessions`: user_id, token_hash, expires_at, revoked_at, user_agent.

### learning
- `subjects`: title, slug (unique), description, cover, order, is_published.
- `subject_teachers`: subject_id, user_id (PK juftligi).
- `topics`: subject_id, order, title, summary, is_published.
- `steps`: topic_id, kind, order. `kind` qiymatlari: `review | lecture | presentation | practice | task | glossary | literature`. Mavzu yaratilganda 7 ta bosqich avtomatik yaratiladi, (topic_id, kind) unique.
- `materials`: step_id, title, original_file, original_name, pdf_file, page_count, status (`processing|ready|failed`), error, uploaded_by.
- `glossary_terms`: topic_id, term, definition, order.
- `literature`: topic_id, title, author, year, url (ixtiyoriy), order.
- `step_progress`: user_id, step_id (unique juftlik), status (`in_progress|completed`), best_score, completed_at.

### assessment (2-bosqich)
- `activities`: step_id, type (`quiz|yesno|crossword`), title, is_published, source (`manual|ai`).
- `quiz_questions`: activity_id, text, options (jsonb, aynan 4 ta), correct_index, explanation, source_ref (material_id + sahifa, ixtiyoriy).
- `yesno_items`: activity_id, statement, answer (bool), explanation.
- `crossword_words`: activity_id, word, clue. To'r (`layout` jsonb) `activities` darajasida saqlanadi va server algoritmi bilan quriladi.
- `attempts`: activity_id, user_id, answers (jsonb), score, max_score, started_at, finished_at.
- `tasks`: step_id, title, description, type (`text|file|both`), max_score, rubric (ixtiyoriy), deadline (ixtiyoriy).
- `submissions`: task_id, user_id, text, file, status (`submitted|graded|returned`), score, feedback, ai_score, ai_feedback, ai_status (`pending|done|unsupported|failed`), graded_by, graded_at.

### gamification (2-bosqich)
- `xp_events`: user_id, amount, reason, ref_type, ref_id. (user_id, reason, ref_type, ref_id) unique, bu bir hodisa uchun ikki marta XP berilishini oldini oladi.
- `streaks`: user_id (PK), current, longest, last_active_date (Asia/Tashkent bo'yicha sana).
- `badges`: code (unique), title_uz, title_ru, description_uz, description_ru, icon.
- `user_badges`: user_id, badge_id, awarded_at.

### library + cms (4-bosqich)
- `folders`: parent_id, section (`metodik|huquqiy`), title, order.
- `documents`: folder_id, title, file.
- `books`: category, title, author, cover, file, is_approved, uploaded_by.
- `news`: title, body (markdown), cover, published_at, views.
- `faq_items`, `contact_messages`, `site_settings` (kalit-qiymat: kontaktlar, ijtimoiy tarmoqlar).

### ai (3-bosqich)
- `doc_chunks`: source_type (`material|document|book|glossary`), source_id, subject_id, topic_id, page, chunk_index, text, embedding (vector), embedding_model.
- `ai_conversations`: user_id, topic_id (ixtiyoriy).
- `ai_messages`: conversation_id, role (`user|assistant`), content, citations (jsonb).
- `ai_drafts`: topic_id, requested_by, kind (`quiz|yesno|crossword|glossary|task`), params (jsonb), status (`generating|draft|approved|rejected|failed`), payload (jsonb).
- `ai_reports`: subject_id, period_start, period_end, stats (jsonb), content.
- `ai_usage`: user_id, date, requests (kunlik limit uchun).

**Qoidalar:**
- To'g'ri javoblar (`correct_index`, `answer`, krossvord so'zlari) talabaga yuboriladigan API javoblariga hech qachon kirmaydi. Tekshirish faqat serverda bo'ladi.
- XP qiymatlari kodda emas, konfiguratsiyada saqlanadi. Jami XP `xp_events` yig'indisi orqali hisoblanadi.

---

## 4. Sahifalar va oqimlar

### Ochiq sayt `/`
- Bosh sahifa; Biz haqimizda; FAQ; Bog'lanish.
- Yangiliklar (ro'yxat va batafsil sahifa).
- Kutubxona: metodik / huquqiy papkalar, kitoblar.
- Kirish; Ro'yxatdan o'tish. Ro'yxatdan o'tgach "tasdiq kutilmoqda" ekrani chiqadi.

### Talaba `/app`
- **Bosh sahifa:** salomlashuv, 🔥 seriya, XP, "Davom ettirish" (oxirgi tugatilmagan bosqich), nishonlar.
- **Fanlar → mavzu yo'li:** Duolingo uslubidagi yo'l xaritasi, har bir mavzuda 7 bosqichli progress halqasi.
- **Dars pleyeri** `/app/topics/:id/:step`:
  - chap panel: 7 bosqich va progress;
  - markaz: bosqich kontenti;
  - o'ng panel: AI repetitor (mobil qurilmada pastdan ochiladigan panel).
- **Natijalarim:** test urinishlari, vazifa baholari va o'qituvchi izohlari.
- **AI repetitor** alohida sahifada ham bor.
- **Profil:** ism, til (uz/ru), parol.

### O'qituvchi `/teach`
- **Bosh sahifa:** tekshirilishi kerak vazifalar soni, AI haftalik tahlili.
- **Mavzu muharriri:** mavzu yaratish va tartiblash; 7 bosqich tablari. Ularda fayl yuklash, glossariy, adabiyotlar, test / ha-yo'q / krossvord va vazifa kiritiladi, hamda "✨ AI bilan yaratish" tugmasi bor.
- **Tekshirish navbati:** talaba javobi, AI tavsiya qilgan ball va izoh, yakuniy ball qo'yish.
- **Statistika:** fan va mavzu bo'yicha.

### Admin `/admin`
- Foydalanuvchilar: tasdiqlash navbati, rol berish, bloklash, vaqtinchalik parol berish.
- Fanlar: yaratish va nashr qilish, o'qituvchi biriktirish.
- Kutubxona papkalari, kitoblar, yangiliklar, FAQ, sayt sozlamalari.
- AI: kunlik limitlar, sarf statistikasi, indeksni qayta qurish.

### Bosqichni tugatish qoidalari
- `lecture`, `presentation`, `glossary`, `literature`: "Tugatdim" tugmasi bosilganda tugaydi.
- `review`, `practice`: shu bosqichdagi faoliyat bo'yicha urinish yakunlanganda tugaydi. Qayta topshirish mumkin, `best_score` saqlanadi.
- `task`: javob yuborilganda tugaydi. Ball o'qituvchi baholagach ko'rinadi.
- Kontenti yo'q bosqich "Hozircha material yo'q" deb ko'rsatiladi va progress hisobiga kirmaydi. Mavzu progressi "tugatilgan bosqichlar / kontenti bor bosqichlar" formulasi bilan hisoblanadi.
- Bosqichlar qulflanmaydi.

### Dizayn tizimi ("Yorqin ilova")
- **Ranglar:** asosiy teal (`#14b8a6`, to'q `#0f766e`, och `#ccfbf1` / `#f0fdfa`), neytral slate.
- **Shakllar:** katta radiuslar (12–16px). Asosiy tugmalarda pastki "3D" soya bor (`0 3px 0` to'q rang).
- **Shrift:** Onest (Google Fonts), lotin va kirillni to'liq qo'llaydi. Butun interfeysda shu bitta shrift ishlatiladi.
- **Animatsiya:** bosqich tugaganda XP "pop" va progress to'lishi. `prefers-reduced-motion` hurmat qilinadi.
- **Moslashuvchanlik:** telefon ekrani ham asosiy ish holati sifatida loyihalanadi.

---

## 5. AI dizayni

### Adapter
- `LLMProvider.generate(messages, *, json_schema=None, stream=False)` va `EmbeddingProvider.embed(texts)` interfeyslari.
- Hozir `GeminiProvider` ishlatiladi, keyin `ClaudeProvider` qo'shiladi. Testlar uchun `FakeProvider` bor.
- Provayder `.env` orqali tanlanadi: `AI_PROVIDER`, `AI_MODEL_CHAT`, `AI_MODEL_FAST`, `AI_EMBEDDING_MODEL`, `GEMINI_API_KEY`.
- Bepul tarifning aniq limitlari va model nomlari implementatsiya paytida rasmiy hujjatdan tekshiriladi.

### Indekslash
1. Material `ready` holatiga o'tadi.
2. Worker PDF'dan sahifama-sahifa matn oladi.
3. Matn taxminan 800 tokenlik, 100 token ustma-ust tushadigan bo'laklarga bo'linadi. Sahifa raqami saqlanadi.
4. Bo'laklar embedding qilinadi va `doc_chunks`ga yoziladi.

Glossariy atamalari ham indekslanadi. 4-bosqichda kutubxona hujjatlari va kitoblar qo'shiladi.

Fayl o'chirilsa yoki almashtirilsa, uning bo'laklari ham o'chiriladi yoki qayta yaratiladi. `embedding_model` o'zgarsa, admin "indeksni qayta qurish" ishini ishga tushiradi.

### Talaba repetitori
1. Qidiruv tartibi: avval joriy mavzu, keyin fan, keyin butun platforma (top-k = 6).
2. Eng yaxshi o'xshashlik chegaradan past bo'lsa, LLM chaqirilmaydi. Talabaga "bu savol platforma mavzulariga tegishli emas" degan tayyor javob qaytariladi. Salomlashish va platformadan foydalanish savollari kichik qoidalar to'plami orqali alohida o'tkaziladi.
3. Tizim ko'rsatmasi:
   - faqat berilgan parchalar asosida javob ber;
   - manbani `[n]` ko'rinishida ko'rsat;
   - savol tilida javob ber;
   - kontekstda javob bo'lmasa, buni ochiq ayt.
4. **Ko'chirtirmaslik:** savol talaba hali yakunlamagan test yoki vazifa savoliga juda o'xshash bo'lsa, javob "maslahat rejimi"da beriladi: tayyor javob yoki variant harfi aytilmaydi, faqat tushuncha tushuntiriladi.
5. Javob SSE orqali oqim bilan uzatiladi. `ai_messages`ga matn va `citations` (material, sahifa) yoziladi.

### Kontent yaratish
1. O'qituvchi material(lar), tur, soni va qiyinlikni tanlaydi. `ai_drafts` yozuvi `generating` holatida yaratiladi.
2. Worker LLM'ni qat'iy JSON sxemasi bilan chaqiradi.
3. Natija Pydantic bilan tekshiriladi: testda 4 ta variant va aynan 1 ta to'g'ri javob, takrorlar yo'q, bo'sh matn yo'q. Tekshiruvdan o'tmasa, 1 marta qayta so'raladi, yana o'tmasa `failed`.
4. Muvaffaqiyatli bo'lsa `draft`. O'qituvchi tahrirlaydi, "Tasdiqlash" bosilganda tegishli `activities` / `glossary_terms` / `tasks` yozuvlari yaratiladi.
5. Krossvord uchun AI faqat so'z va izoh beradi, to'rni deterministik Python algoritmi quradi.

### Vazifani tekshirish
- Talaba javob yuboradi va worker ishga tushadi.
- Matn olinadi: textarea'dan, PDF'dan (PyMuPDF) yoki DOCX'dan (python-docx). Rasm yoki skan bo'lsa `ai_status=unsupported`.
- LLM'ga vazifa matni, rubrika, `max_score` va tegishli mavzu parchalari beriladi. U `{score, feedback, strengths[], issues[]}` qaytaradi va natija `ai_score` / `ai_feedback`ga yoziladi.
- AI'ga talabaning ismi va boshqa shaxsiy ma'lumotlari yuborilmaydi.
- Yakuniy `score`ni faqat o'qituvchi qo'yadi.

### Haftalik tahlil
- arq cron har dushanba soat 06:00 da (Asia/Tashkent) ishlaydi.
- Har bir fan bo'yicha SQL hisoblaydi:
  - mavzular bo'yicha tugatish foizi;
  - o'rtacha ball;
  - eng past to'g'ri javob foiziga ega 5 ta savol;
  - 7 kundan ortiq kirmagan talabalar soni.
- LLM faqat shu `stats` asosida o'qituvchi tilida qisqa xulosa va 3 ta tavsiya yozadi. Raqamlarni LLM o'zi hisoblamaydi.

### Limitlar va barqarorlik
- Har bir talabaga kunlik xabar limiti (admin sozlaydi, standart 30 ta). Hisob `ai_usage` va Redis'da yuritiladi.
- Provayderga global tezlik cheklovi qo'llanadi (Redis token bucket).
- Navbat ustuvorligi: repetitor > tekshirish > generatsiya va hisobot.
- Provayder 429 yoki 5xx qaytarsa, eksponensial kutish bilan 3 marta qayta uriniladi. Bo'lmasa, foydalanuvchiga "AI hozir band, birozdan so'ng urinib ko'ring" deyiladi.
- AI ishlamasa ham sayt to'liq ishlaydi.
- **Maxfiylik:** bepul tarifda provayder ma'lumotlardan foydalanishi mumkin. Shuning uchun AI'ga shaxsiy ma'lumotlar yuborilmaydi, admin panelida bu haqda ogohlantirish turadi.

---

## 6. Xavfsizlik

- **Tokenlar:** JWT access token 15 daqiqa amal qiladi. Refresh token `httpOnly`, `Secure`, `SameSite=Lax` cookie'da, 30 kun amal qiladi va har ishlatilganda almashtiriladi. Bazada faqat token hash saqlanadi. Chiqish, parol o'zgarishi yoki bloklashda barcha sessiyalar bekor qilinadi.
- **Parollar:** argon2id bilan saqlanadi, kamida 8 belgi. Kirishga urinishlar IP va login bo'yicha cheklanadi (15 daqiqada 10 ta).
- **Birinchi admin:** `ADMIN_EMAIL` / `ADMIN_PASSWORD` orqali CLI buyrug'i bilan yaratiladi. Kodda standart parol bo'lmaydi.
- **Production rejimi:** debug o'chiq, `/docs` (OpenAPI) faqat dev muhitida. Ichki xatolar foydalanuvchiga faqat `request_id` bilan qaytadi, tafsilotlar logga yoziladi.
- **Ruxsatlar:** har bir endpoint backend tomonda rolni tekshiradi (`require_role`). O'qituvchi faqat `subject_teachers` orqali biriktirilgan fanlarni tahrirlay oladi. `pending` va `blocked` foydalanuvchilar `/app` API'lariga kira olmaydi.
- **Fayllar:**
  - kengaytma va MIME tekshiriladi: pdf, ppt, pptx, doc, docx, rasmlar;
  - hajm cheklovi: material 50 MB, vazifa javobi 20 MB;
  - fayl nomi UUID bilan almashtiriladi;
  - himoyalangan fayllar `X-Accel-Redirect` orqali beriladi;
  - kutubxonaning ochiq qismi ochiq qoladi.
- **Brauzer himoyasi:** CORS faqat o'z domeni uchun ochiq. Xavfsizlik sarlavhalari (CSP, HSTS, X-Content-Type-Options) nginx'da sozlanadi.
- **Zaxira nusxa:** `deploy/backup.sh` kunlik `pg_dump` va media fayllar arxivini oladi, 14 kun saqlaydi.

## 7. Xatolarni boshqarish

- **Yagona format:** API xatolari bir xil ko'rinishda qaytadi: `{"code": "TOPIC_NOT_FOUND", "message": "...", "details": {...}}`. Frontend `code` bo'yicha uz/ru matnini i18n'dan oladi.
- **Validatsiya:** Pydantic xatolari `VALIDATION_ERROR` kodi va maydonlar ro'yxati bilan qaytadi.
- **Worker ishlari:** 3 marta qayta urinadi. Bo'lmasa, holat `failed` bo'ladi, `error` maydoni to'ldiriladi va UI'da "Qayta urinish" tugmasi chiqadi.
- **Frontend:** TanStack Query xatolari umumiy toast orqali ko'rsatiladi. 401 kelganda token yangilanadi va so'rov bir marta qayta yuboriladi, yana muvaffaqiyatsiz bo'lsa login sahifasiga yo'naltiriladi.

## 8. Testlash

- **Backend:**
  - har bir modulning `service` va `router` qismlari uchun pytest;
  - haqiqiy PostgreSQL (testcontainers) ishlatiladi;
  - AI uchun `FakeProvider` (deterministik javoblar);
  - asosiy holatlar: ruxsatlar, to'g'ri javob talabaga chiqib ketmasligi, XP ikki marta berilmasligi, AI rad etish chegarasi.
- **Frontend:** Vitest + RTL bilan komponent va hook'lar testlanadi.
- **E2E (Playwright):** ro'yxatdan o'tish → admin tasdig'i → fanni ochish → bosqichni tugatish → progress yangilanishi.
- **CI:** ruff, mypy, eslint, `tsc --noEmit` va barcha testlar.

## 9. Loyiha tuzilmasi

```
texnologiya-platform/
  backend/
    app/
      core/          # config, db, security, errors, deps
      auth/ learning/ assessment/ gamification/ library/ cms/ ai/
      main.py
    worker/          # arq WorkerSettings, ishlar, cron
    alembic/
    tests/
    pyproject.toml
  frontend/
    src/
      app/           # router, providers, layout'lar (public/app/teach/admin)
      features/      # auth, subjects, player, teach-editor, admin-users, ...
      components/    # umumiy UI (Button, Card, ProgressRing, ...)
      i18n/uz.json, i18n/ru.json
      api/           # API client + TanStack Query hook'lari
    package.json
  deploy/
    docker-compose.yml  docker-compose.dev.yml  nginx.conf  backup.sh
  docs/
```

---

## 10. Qurish bosqichlari

Har bir bosqich oxirida ishlaydigan va testlangan sayt bo'ladi. Har bosqich uchun alohida implementatsiya rejasi yoziladi. 2–4-bosqichlar uchun ish boshlanishidan oldin shu spec asosida qisqa qo'shimcha spec tuziladi.

### 1-bosqich: Asos (ushbu spec'ning to'liq qamrovi)
- **Infratuzilma:** monorepo; backend va frontend skeleti; dev uchun Docker Compose (api, worker, postgres+pgvector, redis); Alembic; CI.
- **auth:** ro'yxatdan o'tish (`pending`), kirish, refresh, chiqish, `/me`, til tanlash, parol almashtirish. Admin: tasdiqlash navbati, rol va holatni o'zgartirish, vaqtinchalik parol berish.
- **learning:** fanlar va o'qituvchi biriktirish (admin); mavzular (o'qituvchi); 7 bosqichni avtomatik yaratish; materiallarni yuklash; worker'da PPT/PPTX/DOC/DOCX → PDF konvertatsiyasi; glossariy; adabiyotlar; `step_progress`.
- **Frontend:**
  - dizayn tizimi va layout'lar;
  - uz/ru i18n;
  - ochiq sahifalar skeleti (bosh sahifa, kirish, ro'yxatdan o'tish, tasdiq kutish);
  - talaba: fanlar, mavzu yo'li, dars pleyeri (PDF ko'ruvchi, glossariy, adabiyotlar, "Tugatdim");
  - o'qituvchi: mavzu muharriri;
  - admin: foydalanuvchilar va fanlar.
- `review`, `practice`, `task` bosqichlari bu bosqichda "Hozircha material yo'q" holatini ko'rsatadi.

**1-bosqich API'si (`/api` prefiksi bilan):**
- **auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, `PATCH /me`, `POST /me/password`.
- **admin:**
  - `GET /admin/users?status=`, `PATCH /admin/users/{id}`, `POST /admin/users/{id}/temp-password`;
  - `GET /admin/subjects`, `POST /admin/subjects`, `PATCH /admin/subjects/{id}`, `DELETE /admin/subjects/{id}`, `PUT /admin/subjects/{id}/teachers`.
- **talaba:**
  - `GET /subjects`, `GET /subjects/{slug}` (mavzular va progress bilan);
  - `GET /topics/{id}` (bosqichlar va progress), `GET /steps/{id}`, `POST /steps/{id}/complete`;
  - `GET /me/continue`, `GET /me/progress`;
  - `GET /materials/{id}/file` (ruxsat tekshirilgach, X-Accel-Redirect).
- **o'qituvchi:**
  - `GET /teach/subjects`;
  - `POST /teach/subjects/{id}/topics`, `PATCH /teach/topics/{id}`, `DELETE /teach/topics/{id}`, `PUT /teach/subjects/{id}/topics/order`;
  - `POST /teach/steps/{id}/materials` (multipart), `DELETE /teach/materials/{id}`, `POST /teach/materials/{id}/retry`;
  - `GET|POST|PATCH|DELETE /teach/topics/{id}/glossary[/{term_id}]`;
  - `GET|POST|PATCH|DELETE /teach/topics/{id}/literature[/{item_id}]`.

**Tayyor bo'lish mezoni:**
- Admin o'qituvchini tasdiqlaydi va fanga biriktiradi.
- O'qituvchi mavzu yaratib, PDF va PPTX yuklaydi. PPTX avtomatik PDF'ga aylanadi.
- Talaba ro'yxatdan o'tadi, tasdiqlangach mavzuni pleyerda ochadi, bosqichlarni tugatadi va progress ko'rinadi.
- Interfeys uz va ru tillarida ishlaydi.
- E2E test o'tadi.

### 2-bosqich: Baholash va gamifikatsiya
Test, ha/yo'q, krossvord (muharrir va o'ynash), urinishlar, vazifa yuborish va baholash, XP, seriya, nishonlar, talaba bosh sahifasi, natijalarim, o'qituvchi statistikasi.

### 3-bosqich: AI
Adapter va GeminiProvider, indekslash, repetitor (SSE, manbalar, rad etish, ko'chirtirmaslik), kontent yaratish va qoralamalar, vazifani tekshirish, haftalik tahlil, limitlar, admin AI sahifasi.

### 4-bosqich: Kutubxona, ochiq sayt va deploy
Papkalar va hujjatlar, kitoblar, yangiliklar, FAQ, bog'lanish formasi, bosh sahifaning yakuniy dizayni, SEO (meta, OG, sitemap, robots), VPS'ga production deploy (HTTPS, backup).
