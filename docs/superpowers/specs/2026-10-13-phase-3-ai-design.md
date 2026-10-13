# 3-bosqich: AI — mini-spec

Sana: 2026-10-13. Asosiy spec: `2026-10-08-texnologiya-platform-design.md` (3-bo'lim "ai", 5-bo'lim "AI dizayni", 10-bo'lim). Bu hujjat asosiy spec'ni takrorlamaydi: u ochiq qolgan masalalarni hal qiladi va 3A/3B rejalari uchun aniq qoidalarni beradi. Ziddiyat bo'lsa, shu hujjat ustun.

## 1. Maqsad va doira

- **Talaba:** dars materiallari asosida javob beradigan AI repetitor. U manbalarni ko'rsatadi, mavzudan tashqari savolni rad etadi va yechilmagan topshiriq javobini aytmaydi.
- **O'qituvchi:**
  - material asosida test, ha/yo'q, krossvord, glossariy va vazifa qoralamalarini yaratish;
  - vazifa javobiga AI tavsiya qilgan ball va izoh;
  - fan bo'yicha haftalik tahlil.
- **Admin:** AI'ni yoqish/o'chirish, talabaning kunlik limiti, sarf statistikasi, indeksni qayta qurish.

**Bo'linish:**
- **3A:** butun AI backend.
- **3B:** butun AI frontend.

2-bosqichdagidek: 3A tugab, `npm run gen:api` bilan tiplar olingach 3B boshlanadi.

**Doiradan tashqari:**
- kutubxona hujjatlari va kitoblarni indekslash (4-bosqich, `source_type` ro'yxatida joyi bor);
- Redis (4-bosqich, hozircha xotira va DB);
- `ClaudeProvider` (interfeys tayyor turadi, provayder keyin qo'shiladi);
- arq worker va cron (4-bosqich).

## 2. Qabul qilingan qarorlar

| Masala | Qaror |
|---|---|
| Lokal vektor qidiruv | `VectorStore` interfeysi. SQLite'da embedding BLOB (float32), o'xshashlik `numpy` bilan; PostgreSQL'da (CI, prod) `pgvector`. Lokal ishlab chiqish Docker'siz qoladi. |
| Haftalik tahlil lokal muhitda | CLI: `uv run python -m app.cli weekly-report`. 4-bosqichda arq cron shu funksiyani chaqiradi. |
| Provayder | Gemini, Python SDK `google-genai`. |
| Sukut modellar | `AI_MODEL_CHAT=gemini-2.5-flash`, `AI_MODEL_FAST=gemini-2.5-flash-lite`, `AI_EMBEDDING_MODEL=gemini-embedding-001`, `AI_EMBEDDING_DIM=768` (`output_dimensionality`). Hammasi `.env` da almashtiriladi. |
| Bepul tarif limitlari | Sozlanadigan: `AI_RPM` (daqiqasiga global so'rov, sukut 10). Aniq raqamlar implementatsiyada ai.google.dev dan tekshiriladi va `.env.example` ga izoh bilan yoziladi. |
| Kalit yo'q bo'lsa | `AI_PROVIDER=gemini` va `GEMINI_API_KEY` bo'sh bo'lsa, AI o'chiq: AI endpoint'lari 503 `AI_DISABLED`, qolgan sayt to'liq ishlaydi. `AI_PROVIDER=fake` lokal sinov uchun (deterministik javoblar). Testlar doim `fake`. |
| Bo'linish | 3A backend, 3B frontend. |

`GEMINI_API_KEY` faqat `.env` da turadi. `.env.example` da bo'sh qiymat bo'ladi, kalit repoga va loglarga tushmaydi.

## 3. Arxitektura

Yangi modul `app/ai/`. U loyihaning mavjud naqshlariga amal qiladi:
- `app.state` va `create_app(settings)`;
- `Annotated` dependency alias'lari;
- `JobRunner` va `@job`;
- `AppError`;
- `BigIntPK`, `UTCDateTime`, `str_enum`.

| Fayl | Vazifasi |
|---|---|
| `providers.py` | `LLMProvider` (`generate(messages, *, json_schema=None)`, `stream(messages)`) va `EmbeddingProvider` (`embed(texts, *, task)`) protokollari; `GeminiProvider`, `FakeProvider`. 429/5xx kelsa, eksponensial kutish (1, 2, 4 s) bilan 3 marta qayta urinish, so'ng `ProviderBusy`. |
| `limits.py` | Global token bucket (`AI_RPM`, `core/ratelimit.py` naqshi), `ai_usage` bo'yicha talabaning kunlik limiti. |
| `vectors.py` | `VectorStore`: `replace_source(source, chunks)`, `delete_source(source)`, `search(vec, scope, k, source_types)`. `SqliteVectorStore` va `PgVectorStore`, engine dialektiga qarab `create_app` da tanlanadi. |
| `chunking.py` | Sof funksiyalar: PDF sahifalari → bo'laklar. Hajm ~3200 belgi (~800 token), ustma-ustlik ~400 belgi, sahifa raqami saqlanadi. Tokenizer ishlatilmaydi. |
| `indexing.py` | Job'lar: `index_material`, `index_topic_questions`, `reindex_all`. |
| `tutor.py` | Qidiruv, chegaralar, maslahat rejimi, prompt yig'ish, oqim. |
| `drafts.py` | Qoralama yaratish (job `generate_draft`), tekshirish va tasdiqlash. |
| `grading.py` | Job `ai_check_submission`: matn olish va LLM bahosi. |
| `reports.py` | Haftalik statistika (SQL) va xulosa, CLI shuni chaqiradi. |
| `models.py`, `schemas.py`, `router.py`, `teach_router.py`, `admin_router.py` | Odatdagi bo'linish. Yangi modellar `models_registry.py` ga import qilinadi. |

**Provayder va vektor ombori** `app.state.ai` ga yig'iladi (`AiServices`: llm, embedder, vectors, limiter). Routerlar ularni `deps.py` dagi `Ai` alias'i orqali oladi. Testlar `Settings(ai_provider="fake")` bilan app quradi.

**Vektor tipi.** `core/types.py` ga `Vector(dim)` qo'shiladi:
- PostgreSQL'da `pgvector.sqlalchemy.Vector(dim)`;
- SQLite'da `LargeBinary` (float32 baytlar).

Embedding'lar saqlashdan oldin L2 bo'yicha normallashtiriladi, shuning uchun cosine o'xshashlik = skalyar ko'paytma.
- **SQLite qidiruvi:** avval doira bo'yicha SQL filtr (`topic_id` / `subject_id` / hammasi, `source_types`), so'ng `numpy` bilan skalyar ko'paytma va top-k.
- **PostgreSQL qidiruvi:** `ORDER BY embedding <=> :vec LIMIT k`, `embedding` ustunida HNSW (`vector_cosine_ops`) indeksi.

**Yangi bog'liqliklar:** `google-genai`, `pgvector`, `numpy`, `python-docx`.

**Job'lar** mavjud `InlineJobRunner` orqali ishlaydi. Ular `convert_material` dagi kabi qisqa umrli DB sessiyalaridan foydalanadi va natijani yozishdan oldin manba hali borligini qayta tekshiradi. Inline job'lar saqlanmaydi, shuning uchun startup lifespan `generating` holatidagi qoralamalarni `failed` (`INTERRUPTED`) ga, `pending` AI tekshiruvlarini `failed` ga o'tkazadi (materiallar uchun mavjud naqsh).

## 4. Ma'lumotlar modeli

Asosiy spec'dagi jadvallar quyidagi aniqliklar bilan:

- **`doc_chunks`:**
  - ustunlar: `id`, `source_type`, `source_id`, `subject_id`, `topic_id` (nullable), `page` (nullable), `chunk_index`, `text`, `embedding Vector(AI_EMBEDDING_DIM)`, `embedding_model`, `created_at`;
  - `source_type` qiymatlari: `material | glossary | question | document | book`. Oxirgi ikkitasi 4-bosqich uchun;
  - indeks `(source_type, source_id)`; PostgreSQL'da HNSW;
  - `question` turi qidiruv kontekstiga **hech qachon** kirmaydi. U faqat maslahat rejimini aniqlash uchun ishlatiladi va unda faqat savol matni bor, javob yo'q.
- **`ai_conversations`:** `id`, `user_id`, `topic_id` (nullable), `title` (birinchi savoldan 80 belgi), `created_at`, `updated_at`.
- **`ai_messages`:** `id`, `conversation_id`, `role` (`user|assistant`), `content`, `citations` (JSON: `[{n, source_type, source_id, title, page}]`), `mode` (`answer|hint|refusal`), `created_at`.
- **`ai_drafts`:**
  - ustunlar: `id`, `topic_id`, `step_id`, `requested_by`, `kind` (`quiz|yesno|crossword|glossary|task`), `params` (JSON: `material_ids`, `count`, `difficulty`), `status` (`generating|draft|approved|rejected|failed`), `payload` (JSON), `error` (nullable), `created_at`, `updated_at`;
  - `approved_ref` (JSON, nullable): yaratilgan yozuv(lar) ID'si.
- **`ai_reports`:** `id`, `subject_id`, `locale`, `period_start`, `period_end` (sana), `stats` (JSON), `content`, `created_at`. Unique `(subject_id, locale, period_start)`.
- **`ai_usage`:** `user_id`, `date` (Asia/Tashkent sanasi), `requests`. Unique `(user_id, date)`, oshirish atomik.
- **`ai_settings`:** bitta qator, `id=1`. Ustunlar: `enabled` (bool, sukut true), `student_daily_limit` (int, sukut 30), `updated_at`.
- **`submissions` ga yangi ustunlar:**
  - `ai_status` (`none|pending|done|unsupported|failed`, sukut `none`);
  - `ai_score` (int, nullable), `ai_feedback` (JSON: `{feedback, strengths[], issues[]}`, nullable).

**Migratsiya:** PostgreSQL'da avval `CREATE EXTENSION IF NOT EXISTS vector`. SQLite'da bu qadam o'tkazib yuboriladi. `tests/test_migrations.py` va `alembic check` ikkala dialektda o'tishi kerak.

**CI:** `postgres:16` image'i `pgvector/pgvector:pg16` ga almashtiriladi.

## 5. Xatti-harakat qoidalari

### 5.1. Indekslash
- **Material:** `status=ready` bo'lganda `index_material(material_id)` navbatga qo'yiladi. Ikki joyda: PDF yuklanganda (`materials.py`, sinxron `ready`) va `convert_material` muvaffaqiyatli tugaganda.
  - Job PDF'dan sahifama-sahifa matn oladi (PyMuPDF), bo'laklarga bo'ladi, 100 tadan paket qilib embedding qiladi va `replace_source` bilan yozadi (eski bo'laklar o'chadi).
  - Matnsiz (skan) PDF bo'lsa, bo'lak yozilmaydi. Bu xato hisoblanmaydi.
- **Material o'chirilsa:** `delete_source` chaqiriladi, xuddi shu tranzaksiyada.
- **Glossariy:** atama qo'shilsa, o'zgarsa yoki o'chsa, mavzu bo'yicha qayta indekslanadi. Har atama alohida bo'lak: `"atama — ta'rif"`.
- **Savollar (`question`):** faoliyat saqlanganda yoki o'chirilganda va vazifa saqlanganda yoki o'chirilganda `index_topic_questions(topic_id)` ishlaydi.
  - Faqat nashr qilingan faoliyatlar olinadi: test savoli matni, ha/yo'q bayonoti, krossvord izohi; vazifa uchun nom va tavsif.
  - To'g'ri javoblar indeksga **kirmaydi**.
- **`reindex_all`** (admin): `embedding_model` joriy sozlamadan farq qiladigan barcha bo'laklarni, yoki so'ralsa hammasini, qayta quradi.
- AI o'chiq bo'lsa yoki kalit yo'q bo'lsa, indekslash job'lari hech narsa qilmaydi. Admin keyin `reindex_all` bilan to'ldiradi.

### 5.2. Talaba repetitori
`POST /api/ai/chat`, tana: `{message, topic_id?, conversation_id?}`. Javob oqim bilan keladi (`text/event-stream`, `fetch` + `ReadableStream`, chunki `EventSource` Bearer token yubora olmaydi). Hodisalar:
- `meta` — `conversation_id`, `mode`, `citations`;
- `delta` — matn bo'lagi;
- `done`;
- `error` — `{code, message}`.

**Tartib:**
1. **Tekshiruvlar:**
   - foydalanuvchi faol bo'lishi kerak;
   - AI yoqilgan bo'lishi kerak, aks holda 503 `AI_DISABLED`;
   - talaba kunlik limitdan oshmagan bo'lishi kerak, aks holda 429 `AI_LIMIT_REACHED` (`details.limit`). O'qituvchi va admin limitga tushmaydi;
   - xabar uzunligi 1–1000 belgi.
2. **Kichik qoidalar to'plami** (salomlashish, "platformadan qanday foydalanaman"): oddiy kalit so'z mosligi, tayyor javob qaytariladi, LLM va limit ishlatilmaydi.
3. **Qidiruv:** savol embedding qilinadi (`task=query`), so'ng doira bosqichma-bosqich kengaytiriladi:
   - `topic_id` berilgan bo'lsa, mavzu;
   - so'ng shu fan;
   - so'ng butun platforma.
   
   Talabaga ko'rinadigan (nashr qilingan fan va mavzu) `material` va `glossary` bo'laklari olinadi. Har bosqichda top-6 tanlanadi; eng yaxshi o'xshashlik `AI_MIN_SIMILARITY` (sukut 0,55) dan yuqori bo'lsa, o'sha bosqichda to'xtaladi.
4. **Rad javobi:** eng yaxshi o'xshashlik chegaradan past bo'lsa, LLM chaqirilmaydi va `mode=refusal` tayyor javobi qaytariladi. Limitdan ayriladi, xabar saqlanadi.
5. **Maslahat rejimi:** `topic_id` berilgan bo'lsa, savol shu mavzuning `question` bo'laklari bilan solishtiriladi. O'xshashlik `AI_HINT_SIMILARITY` (sukut 0,85) dan yuqori va talaba o'sha faoliyatda urinishsiz yoki vazifaga javob yubormagan bo'lsa, `mode=hint` bo'ladi: tizim ko'rsatmasiga "tayyor javobni, variant harfini yoki so'zni aytma, faqat tushunchani tushuntir" qo'shiladi.
6. **Prompt:**
   - tizim ko'rsatmasi: faqat parchalar asosida javob ber, manbani `[n]` bilan ko'rsat, savol tilida javob ber, javob topilmasa ochiq ayt;
   - so'ng parchalar `[n] (manba nomi, sahifa)`;
   - so'ng suhbatning oxirgi 6 ta xabari;
   - LLM `AI_MODEL_CHAT` bilan oqim rejimida chaqiriladi.
7. **Saqlash:** savol va javob `ai_messages` ga yoziladi. `citations` faqat javobda haqiqatan uchragan `[n]` lar bo'yicha qoladi. `ai_usage` ning `requests` qiymati 1 ga oshadi.
8. **Provayder xatolari:** 3 urinishdan keyin ham xato bo'lsa, `error` hodisasi `AI_BUSY` bilan yuboriladi va javob saqlanmaydi. Limit faqat muvaffaqiyatli LLM javobi va rad javobida ayriladi.

Suhbatlar: `GET /api/ai/conversations`, `GET /api/ai/conversations/{id}`, `DELETE /api/ai/conversations/{id}`. Faqat egasiga ochiq, aks holda 404 `CONVERSATION_NOT_FOUND`.

### 5.3. Kontent yaratish
1. O'qituvchi (`ensure_can_edit_step` bilan) quyidagilarni tanlaydi:
   - `step_id`;
   - `kind`;
   - `material_ids` (shu mavzuning `ready` materiallari, 1–3 ta);
   - `count`: test va ha/yo'q uchun 3–15, krossvord 5–12 so'z, glossariy 3–15, vazifa uchun 1;
   - `difficulty` (`easy|medium|hard`).
   
   `kind` bilan bosqich mosligi:
   - `quiz|yesno|crossword` faqat `review|practice` bosqichiga;
   - `glossary` faqat `glossary` bosqichiga;
   - `task` faqat `task` bosqichiga;
   - aks holda 400 `AI_DRAFT_WRONG_STEP`.
2. `ai_drafts` qatori `generating` holatida yaratiladi va `generate_draft` job'i navbatga qo'yiladi.
3. Job tanlangan materiallarning bo'laklarini (tartib bo'yicha, ~24 000 belgigacha) oladi. LLM `AI_MODEL_CHAT` bilan qat'iy JSON sxemasi (Pydantic modelidan) orqali chaqiriladi.
4. Javob mavjud kirish sxemalari (`QuizItemIn`, `YesNoItemIn`, `CrosswordItemIn`, `GlossaryIn`, `TaskIn`) bilan tekshiriladi, qo'shimcha qoidalar:
   - takrorlangan savol yoki so'z bo'lmasligi;
   - testda aynan 4 ta turli variant;
   - krossvord so'zlari `normalize_word` dan o'tishi va `build_layout` bilan joylashishi.
   
   Xato bo'lsa, xato matni bilan 1 marta qayta so'raladi. Yana xato bo'lsa, `failed` (`error` bilan).
5. Muvaffaqiyatli bo'lsa, holat `draft` bo'ladi va `payload = {title, items}` (vazifa uchun `TaskIn` maydonlari) saqlanadi.
6. O'qituvchi `PUT …/drafts/{id}` bilan `payload` ni tahrirlay oladi; o'sha sxemalar bilan tekshiriladi. "Tasdiqlash" (`POST …/approve`) mavjud funksiyalarni chaqiradi:
   - `assessment.activities.create_activity(step, ActivityIn)`, faoliyat **nashr qilinmagan** holda yaratiladi;
   - `learning.topic_items.add_glossary_term` (har atama uchun);
   - `assessment.tasks.upsert_task` (mavjud vazifa almashtiriladi, shuning uchun UI ogohlantiradi).
   
   Holat `approved` ga o'tadi, `approved_ref` yoziladi.
7. Holatlar:
   - `generating` holatidagi qoralamani tahrirlash yoki tasdiqlash → 409 `AI_DRAFT_NOT_READY`;
   - `approved`/`rejected` qoralamani o'zgartirish → 409 `AI_DRAFT_CLOSED`;
   - tasdiqlashdagi sxema xatosi → 422 `AI_DRAFT_INVALID`, `details` bilan; krossvord xatolari mavjud kodlar bilan.

### 5.4. Vazifani AI bilan tekshirish
- Talaba javob yuborganda (`tasks.submit` muvaffaqiyatli bo'lgach) AI yoqilgan bo'lsa, `ai_status=pending` qo'yiladi va `ai_check_submission` navbatga qo'yiladi. O'qituvchi `POST /api/teach/submissions/{id}/ai-check` bilan qayta ishga tushira oladi.
- **Matn olish:** textarea; PDF (PyMuPDF); DOCX (`python-docx`). DOC/PPT/rasm yoki matnsiz PDF bo'lsa, `ai_status=unsupported`. Matn 20 000 belgida kesiladi.
- **LLM'ga beriladi:** vazifa nomi, tavsifi, mezoni, `max_score`, mavzuning eng o'xshash 4 ta material bo'lagi va javob matni. Talabaning ismi, emaili va fayl nomi **yuborilmaydi**.
- **Javob sxemasi:** `{score: 0..max_score, feedback, strengths[≤5], issues[≤5]}`.
- **Natija:** `ai_score` va `ai_feedback` ga yoziladi, `ai_status=done`. Xato bo'lsa, `failed`.
- Javob yozishdan oldin submission qayta yuklanadi. U shu orada qayta yuborilgan bo'lsa (`submitted_at` o'zgargan), natija tashlab yuboriladi.
- `ai_*` maydonlari faqat o'qituvchi javoblarida (`SubmissionDetail`) bor. Talaba sxemalarida yo'q.
- Yakuniy ballni faqat o'qituvchi qo'yadi; AI bahosi XP bermaydi.

### 5.5. Haftalik tahlil
- **CLI:** `weekly-report [--week-start YYYY-MM-DD] [--subject ID]`. Sukut: o'tgan to'liq hafta (Asia/Tashkent bo'yicha dushanba–yakshanba).
- **Har fan uchun SQL statistikasi:**
  - har mavzuning tugatish foizi;
  - faoliyatlardagi o'rtacha eng yaxshi natija;
  - to'g'ri javob foizi eng past 5 ta savol;
  - shu hafta yuborilgan va baholangan vazifalar soni;
  - 7 kundan ortiq faolligi bo'lmagan talabalar soni (`xp_events` bo'yicha).
- **Xulosa:** fanga biriktirilgan o'qituvchilarning har bir tili (`locale`) uchun LLM (`AI_MODEL_FAST`) faqat shu `stats` JSON asosida qisqa xulosa va 3 ta tavsiya yozadi. Natija `ai_reports` ga yoziladi; takroriy ishga tushirishda shu davr qatori almashtiriladi.
- **Statistika bo'sh bo'lsa** (hafta davomida faollik yo'q), LLM chaqirilmaydi va tayyor matn yoziladi.
- **O'qituvchi:** `GET /api/teach/ai/reports?subject_id=` o'z tilidagi oxirgi 4 ta hisobotni qaytaradi.

### 5.6. Admin
- `GET/PATCH /api/admin/ai/settings` — `enabled`, `student_daily_limit` (0–500).
- `GET /api/admin/ai/usage?days=30` — kunlar bo'yicha so'rovlar soni va faol foydalanuvchilar, jami bo'laklar soni, joriy model, `enabled`/kalit holati. Kalitning o'zi qaytarilmaydi.
- `POST /api/admin/ai/reindex` — `{all: bool}`, `reindex_all` job'ini navbatga qo'yadi (202).
- Admin sahifasida maxfiylik ogohlantirishi turadi: bepul tarifda provayder yuborilgan matndan foydalanishi mumkin, shuning uchun shaxsiy ma'lumot yuborilmaydi.

## 6. API

| Kim | Endpoint |
|---|---|
| Talaba (faol foydalanuvchi) | `POST /api/ai/chat` (SSE), `GET /api/ai/conversations`, `GET` / `DELETE /api/ai/conversations/{id}`, `GET /api/ai/usage` (`{used, limit}`) |
| O'qituvchi/admin | `POST /api/teach/ai/drafts`, `GET /api/teach/ai/drafts?topic_id=`, `GET` / `PUT /api/teach/ai/drafts/{id}`, `POST /api/teach/ai/drafts/{id}/approve`, `POST …/reject`, `POST /api/teach/submissions/{id}/ai-check`, `GET /api/teach/ai/reports?subject_id=` |
| Admin | `GET` / `PATCH /api/admin/ai/settings`, `GET /api/admin/ai/usage`, `POST /api/admin/ai/reindex` |

`SubmissionDetail` ga `ai_status`, `ai_score`, `ai_feedback` qo'shiladi.

**Yangi xato kodlari** (uz matn backend'da, uz/ru matn frontend'da):

| Kod | Status |
|---|---|
| `AI_DISABLED` | 503 |
| `AI_BUSY` | 503 |
| `AI_LIMIT_REACHED` | 429 |
| `CONVERSATION_NOT_FOUND` | 404 |
| `AI_DRAFT_NOT_FOUND` | 404 |
| `AI_DRAFT_WRONG_STEP` | 400 |
| `AI_DRAFT_NOT_READY` | 409 |
| `AI_DRAFT_CLOSED` | 409 |
| `AI_DRAFT_INVALID` | 422 |

## 7. Frontend (3B)

Barcha matnlar `uz.json` / `ru.json` da bo'ladi, xato kodlari `errors.<CODE>` ga qo'shiladi, tiplar `types.ts` va `types.contract.ts` orqali tekshiriladi.

- **Repetitor:**
  - pleyerning o'ng panelida; telefonda pastdan ochiladigan panel;
  - alohida sahifa `/app/tutor` (suhbatlar ro'yxati bilan);
  - oqimli javob; `[n]` havolalari manba nomi va sahifasini ko'rsatadi;
  - "maslahat" va "rad" rejimlari belgisi; qolgan kunlik limit;
  - `AI_DISABLED` bo'lsa, panel yashiriladi.
- **"✨ AI bilan yaratish":**
  - mavzu muharririning faoliyat, glossariy va vazifa tablarida;
  - forma: materiallar, soni, qiyinlik;
  - qoralamalar ro'yxati (`generating` bo'lsa so'rov bilan kuzatiladi);
  - qoralama mavjud `ActivityEditor` / glossariy / vazifa formalari bilan tahrirlanadi, so'ng "Tasdiqlash" yoki "Rad etish".
- **Tekshirish navbati:** javob sahifasida "AI tavsiyasi" kartasi (ball, izoh, kuchli tomonlar, kamchiliklar, holat) va "Qayta tekshirish" tugmasi. Ball avtomatik qo'yilmaydi.
- **O'qituvchi bosh sahifasi:** fan bo'yicha oxirgi haftalik tahlil.
- **Admin `/admin/ai`:** sozlamalar, sarf grafigi yoki jadvali, "Indeksni qayta qurish", maxfiylik ogohlantirishi.

## 8. Xatolar, ruxsatlar, maxfiylik va testlar

- **Ruxsatlar:**
  - talaba faqat o'z suhbatlarini ko'radi;
  - qoralama va AI tekshiruvi `ensure_can_edit_step` / `ensure_can_edit_task` qoidalariga bo'ysunadi;
  - hisobotlar faqat fanga biriktirilgan o'qituvchi va adminga ochiq.
- **AI ishlamasa ham sayt to'liq ishlaydi.** Indekslash va tekshirish job'larining xatolari material yoki javob yuborishni to'xtatmaydi.
- **Loglarga** prompt va javob matni yozilmaydi, faqat model, token soni (bo'lsa), davomiylik va xato kodi yoziladi.
- **AI'ga** foydalanuvchi ismi, emaili, telefoni va fayl nomi yuborilmaydi.
- **Testlar:**
  - `FakeProvider` bilan yoziladi: deterministik hash-embedding va sxemaga mos tayyor JSON;
  - `VectorStore` ikkala dialektda (SQLite lokal, PostgreSQL CI'da) bir xil testlar bilan tekshiriladi;
  - majburiy testlar:
    - talaba javoblarida AI maydonlari va to'g'ri javoblar yo'qligi;
    - `question` bo'laklari kontekstga kirmasligi;
    - limit;
    - rad javobi va maslahat rejimi;
    - qoralamani tasdiqlash mavjud yozuvlarni to'g'ri yaratishi;
    - shaxsiy ma'lumot promptga tushmasligi.
  - Foydalanuvchi qarori bo'yicha testlar loyiha oxirida yoziladi va ishga tushiriladi. 3A/3B davomida faqat `ruff`, `mypy`, `tsc`, lint va build.

## 9. Tayyor bo'lish mezoni (asosiy spec 10-bo'limidan)

- Repetitor platforma mavzusidan tashqari savolni rad etadi va javobida manbalarni ko'rsatadi.
- Yechilmagan test savoliga repetitor tayyor javob bermaydi.
- AI qoralamasi tasdiqlangach, haqiqiy (nashr qilinmagan) faoliyatga aylanadi.
- O'qituvchi tekshirish navbatida AI tavsiyasini ko'radi.
- `weekly-report` buyrug'i fan uchun hisobot yaratadi va u o'qituvchi bosh sahifasida ko'rinadi.
- `GEMINI_API_KEY` bo'lmasa ham sayt xatosiz ishlaydi.
