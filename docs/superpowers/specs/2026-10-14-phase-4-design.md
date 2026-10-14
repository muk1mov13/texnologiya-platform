# 4-bosqich: kutubxona, CMS, ochiq sayt va deploy — mini-spec

Asosiy spec: `2026-10-08-texnologiya-platform-design.md` (3, 4, 6 va 10-bo'limlar). Bu hujjat 4-bosqichning ochiq masalalarini hal qiladi va 4A (backend), 4B (frontend), 4C (deploy) rejalariga asos bo'ladi.

## 1. Maqsad va doira

- **Kutubxona:** metodik va huquqiy hujjatlar papkalari, kitoblar katalogi.
- **CMS:** yangiliklar, FAQ, bog'lanish formasi, sayt sozlamalari (kontaktlar, ijtimoiy tarmoqlar, "Biz haqimizda").
- **Ochiq sayt:** bosh sahifaning yakuniy dizayni, yangiliklar, kutubxona, FAQ, biz haqimizda, bog'lanish; SEO.
- **Deploy:** arq worker, Redis, Docker Compose, nginx, backup — fayllar va CI tekshiruvi.

Doiradan tashqari: real serverga chiqarish (server va domen paydo bo'lganda alohida qadam), kontentni ikki tilda saqlash (yangilik, FAQ va "Biz haqimizda" bir marta, kiritilgan tilda yoziladi; interfeys uz/ru bo'lib qoladi).

## 2. Qabul qilingan qarorlar (2026-10-14)

| Masala | Qaror |
|---|---|
| Deploy | Server va domen hali yo'q: `deploy/` fayllari yoziladi va CI'da tekshiriladi |
| Kitoblar | O'qituvchi va admin yuklaydi; o'qituvchiniki admin tasdiqlagach ochiq bo'ladi, adminniki darhol tasdiqlangan |
| SEO | Prerender yo'q: meta'lar JS orqali, backend `sitemap.xml` va `robots.txt` beradi |
| Tartib | 4A backend → 4B frontend → 4C deploy |
| Testlar | Loyiha oxirida (oldingi bosqichlar kabi); har task'da `ruff`, `mypy`, `alembic check`, lint, typecheck, build |

## 3. Arxitektura

Ikki yangi backend moduli, mavjud uslubda (`models.py`, `schemas.py`, mantiq sohalar bo'yicha alohida fayllarda, ingichka router'lar):

- `app/library/`: `folders.py`, `documents.py`, `books.py`; router'lar: ochiq (`/api/library`), o'qituvchi (`/api/teach/books`), admin (`/api/admin/library`, `/api/admin/books`).
- `app/cms/`: `news.py`, `faq.py`, `site.py`, `contact.py`, `seo.py`; router'lar: ochiq (`/api/news`, `/api/faq`, `/api/site`, `/api/contact`, `/api/seo`), admin (`/api/admin/news`, `/api/admin/faq`, `/api/admin/messages`, `/api/admin/site`).

`library` va `cms` boshqa modullarning jadvallariga to'g'ridan-to'g'ri murojaat qilmaydi. AI indeksi `ai/indexing.py` dagi job'lar orqali chaqiriladi (materiallar uchun mavjud naqsh kabi). Yangi modellar `models_registry.py` ga qo'shiladi, har o'zgarishga migratsiya yoziladi.

## 4. Ma'lumotlar modeli

- `folders`: `id`, `parent_id` (o'z-o'ziga FK, ixtiyoriy), `section` (`metodik|huquqiy`, `str_enum`), `title`, `order`.
- `documents`: `id`, `folder_id` (FK), `title`, `file`, `original_name`, `size`, `created_at`.
- `books`: `id`, `category` (qisqa matn), `title`, `author`, `cover` (ixtiyoriy), `file`, `original_name`, `size`, `is_approved`, `uploaded_by` (FK users, `SET NULL`), `created_at`.
- `news`: `id`, `title`, `slug` (unikal), `body` (markdown), `cover` (ixtiyoriy), `published_at` (null — qoralama), `views`, `created_at`, `updated_at`.
- `faq_items`: `id`, `question`, `answer`, `order`, `is_published`.
- `contact_messages`: `id`, `name`, `contact` (email yoki telefon), `message`, `is_read`, `created_at`.
- `site_settings`: `key` (PK), `value` (JSON). Ruxsat etilgan kalitlar kodda: `contacts` (`phone`, `email`, `address`), `socials` (`telegram`, `instagram`, `facebook`, `youtube`), `about` (markdown).
- `doc_chunks.subject_id` nullable bo'ladi: kutubxona bo'laklari fanga bog'lanmagan.

Barcha tiplar `app/core/types.py` dan (`BigIntPK`, `UTCDateTime`, `str_enum`).

## 5. Xatti-harakat qoidalari

**Ruxsatlar:**
- Ochiq (login'siz): papkalar daraxti va hujjatlar, tasdiqlangan kitoblar, nashr qilingan yangiliklar (`published_at <= now`), nashr qilingan FAQ, sayt sozlamalari, bog'lanish formasi, sitemap/robots. Fayllarni yuklab olish ham ochiq (spec 6: "kutubxonaning ochiq qismi ochiq qoladi").
- O'qituvchi: o'z kitoblarini yuklaydi, ro'yxatini va holatini ko'radi, tasdiqlanmagan o'z kitobini o'chiradi.
- Admin: hammasi; kitoblar tasdiqlash navbati; yangilik, FAQ, sozlamalar, xabarlar.

**Fayllar** (mavjud `Storage` + `core/files.py`):
- Hujjat va kitob: pdf, doc, docx, ppt, pptx, 50 MB; magic bytes tekshiriladi. Muqova: jpeg, png, webp (webp imzosi qo'shiladi), 5 MB.
- Yuklab olish `file_response()` orqali (prod'da `X-Accel-Redirect`), `original_name` bilan.
- O'chirishda fayl ham o'chiriladi; papka bo'sh bo'lmasa (ichki papka yoki hujjat bor) o'chirilmaydi — 409.

**Yangiliklar:** `slug` sarlavhadan avtomatik (mavjud `slugify`), band bo'lsa raqam qo'shiladi; qo'lda ham berish mumkin. Ochiq ro'yxat sahifalab (`page`, `size`), yangidan eskiga. `GET /api/news/{slug}` har chaqiruvda `views` ni 1 ga oshiradi (takrorlanuvchi ko'rishlar filtrlanmaydi). Markdown frontend'da xom HTML'siz chiziladi.

**Bog'lanish formasi:** IP bo'yicha `InMemoryRateLimiter` (soatiga 5 ta), honeypot maydon (to'ldirilsa — jim 204, saqlanmaydi), matn uzunligi cheklangan. Admin xabarlarni ko'radi, o'qilgan deb belgilaydi, o'chiradi.

**AI indeksi:** PDF hujjatlar va tasdiqlangan PDF kitoblar `ChunkSource.document` / `book` bilan indekslanadi (`pdf_pages` + `chunk_pages`, `subject_id = NULL`, `topic_id = NULL`). Kitob tasdiqlanganda indekslanadi; hujjat yoki kitob o'chirilsa (yoki tasdiq bekor qilinsa) bo'laklari o'chiriladi. `VectorStore.search` kutubxona manbalarini `topic_ids` siz qidira oladi; repetitor uchinchi bosqichida (butun platforma) kutubxona ham qidiriladi. `reindex_all` kutubxonani ham qamraydi. DOC/PPT fayllar indekslanmaydi (konvertatsiya yo'q).

**SEO:** `GET /api/seo/sitemap.xml` — ochiq statik sahifalar va nashr qilingan yangiliklar (`lastmod`); `GET /api/seo/robots.txt` — `/app`, `/teach`, `/admin`, `/api` yopiq, sitemap manzili. Sayt manzili `PUBLIC_BASE_URL` sozlamasidan. Frontend `usePageMeta(title, description, image?)` hook'i `document.title`, description va OG teglarini yangilaydi.

## 6. API

| Kim | Endpoint |
|---|---|
| Ochiq | `GET /api/library/folders?section=` (daraxt + hujjatlar), `GET /api/library/documents/{id}/file`, `GET /api/library/books?category=&q=&page=`, `GET /api/library/books/categories`, `GET /api/library/books/{id}/file`, `GET /api/library/books/{id}/cover` |
| Ochiq | `GET /api/news?page=&size=`, `GET /api/news/{slug}`, `GET /api/news/{id}/cover`, `GET /api/faq`, `GET /api/site`, `POST /api/contact`, `GET /api/seo/sitemap.xml`, `GET /api/seo/robots.txt` |
| O'qituvchi/admin | `GET` / `POST /api/teach/books`, `DELETE /api/teach/books/{id}` |
| Admin | `/api/admin/library/folders` (CRUD, tartib), `POST /api/admin/library/folders/{id}/documents`, `PATCH` / `DELETE /api/admin/library/documents/{id}` |
| Admin | `GET /api/admin/books?status=pending|approved`, `PATCH` / `DELETE /api/admin/books/{id}` (tasdiqlash, tahrir, muqova) |
| Admin | `/api/admin/news` (CRUD, muqova, nashr), `/api/admin/faq` (CRUD, tartib), `GET` / `PATCH` / `DELETE /api/admin/messages`, `GET` / `PUT /api/admin/site` |

**Yangi xato kodlari** (uz matn backend'da, uz/ru matn frontend'da):

| Kod | Status |
|---|---|
| `FOLDER_NOT_FOUND` | 404 |
| `FOLDER_NOT_EMPTY` | 409 |
| `DOCUMENT_NOT_FOUND` | 404 |
| `BOOK_NOT_FOUND` | 404 |
| `BOOK_ALREADY_APPROVED` | 409 (o'qituvchi tasdiqlangan kitobni o'chira olmaydi) |
| `NEWS_NOT_FOUND` | 404 |
| `NEWS_SLUG_TAKEN` | 409 |
| `FAQ_NOT_FOUND` | 404 |
| `MESSAGE_NOT_FOUND` | 404 |
| `CONTACT_RATE_LIMITED` | 429 |
| `SETTING_UNKNOWN` | 422 |

Fayl xatolari mavjud kodlardan foydalanadi.

## 7. Frontend (4B)

- **Ochiq layout:** nav (Bosh sahifa, Yangiliklar, Kutubxona, FAQ, Biz haqimizda, Bog'lanish), mobil menyu, footer'da kontaktlar va ijtimoiy tarmoqlar (`/api/site`).
- **Bosh sahifa** (yakuniy dizayn): hero, so'nggi 3 yangilik, kutubxona va AI repetitor bloklari, kirish/ro'yxatdan o'tish.
- **Sahifalar:** yangiliklar ro'yxati va sahifasi (`react-markdown`, xom HTML'siz), kutubxona (bo'lim tablari, papka daraxti, hujjatlar; kitoblar katalogi — kategoriya va qidiruv), FAQ (akkordeon), Biz haqimizda, Bog'lanish formasi.
- **Admin CMS:** kutubxona (papkalar va hujjatlar), kitoblar navbati, yangiliklar muharriri (markdown + ko'rinish), FAQ, xabarlar, sayt sozlamalari. Admin nav'i bo'limlarga ajratiladi (3B'da kuzatilgan gorizontal scroll hal qilinadi).
- **O'qituvchi:** "Kitoblarim" (yuklash, holat).
- Hamma matnlar `uz.json` / `ru.json` da, xato kodlari `errors.<CODE>` ga, tiplar `types.ts` + `types.contract.ts` orqali tekshiriladi.

## 8. Deploy (4C)

- `ArqJobRunner` (`JOB_RUNNER=arq`, `JobRunner` protokoliga mos), `backend/worker/` (`WorkerSettings`, haftalik `weekly-report` cron, dushanba ertalab Asia/Tashkent).
- Rate limiter Redis'ga (`RATE_LIMIT_BACKEND=redis`); lokal muhit o'zgarmaydi.
- Dockerfile'lar: api; worker (+ LibreOffice headless); frontend (build → nginx).
- `docker-compose.yml`: nginx, api, worker, PostgreSQL 16 + pgvector, Redis; `docker-compose.dev.yml`.
- `nginx.conf`: HTTPS (certbot), `/api` proksi, SSE uchun buffering o'chiq, ichki `/protected-media/`, SPA fallback, `/sitemap.xml` va `/robots.txt` proksi, CSP, HSTS, X-Content-Type-Options.
- Prod `.env.example` (`ENV=prod`, kuchli `JWT_SECRET`, `COOKIE_SECURE=true`, CORS, `MEDIA_ACCEL_REDIRECT=true`, `PUBLIC_BASE_URL`), `backup.sh` (kunlik `pg_dump` + media arxivi, 14 kun), `deploy/README.md` (ishga tushirish, `alembic upgrade head`, `create-admin`, tiklash).
- CI'da yangi `deploy` jobi: `docker compose config` va image'larni build qilish.

## 9. Tayyor bo'lish mezoni

- Admin papka va hujjat qo'shadi, mehmon (login'siz) ularni ko'radi va yuklab oladi.
- O'qituvchi kitob yuklaydi, admin tasdiqlagach u katalogda paydo bo'ladi.
- Admin yangilik va FAQ qo'shadi, ular ochiq saytda ko'rinadi; bog'lanish xabari admin'ga keladi.
- Repetitor kutubxona PDF'lari asosida javob beradi va manba sifatida ularni ko'rsatadi.
- `sitemap.xml` va `robots.txt` to'g'ri; ochiq sahifalarda title va OG bor.
- `deploy/` fayllari CI'da tekshiriladi (compose config, build).
- Interfeys uz/ru'da, 375px kenglikda gorizontal scroll yo'q.

## 10. Amalga oshirishdagi aniqliklar (4A)

1. **`FOLDER_SECTION_MISMATCH` (400)** qo'shildi: ichki papka ota papka bilan bir bo'limda bo'lishi kerak.
2. **`SETTING_UNKNOWN` kiritilmadi:** `SiteUpdate` `extra="forbid"` bilan, noma'lum kalit umumiy `VALIDATION_ERROR` (422) qaytaradi. Ijtimoiy havolalar faqat `https://`.
3. **Multipart matn maydonlari** (`TitleForm`, `LongTitleForm`, `CategoryForm`) `app/core/forms.py` da; materiallar router'i ham shulardan foydalanadi.
4. **Fayl yordamchisi** `core/files.py: save_checked()` — saqlash, magic bytes (webp — `RIFF....WEBP`), hajm; kutubxona va CMS shundan foydalanadi.
5. **AI ulanishi** to'liq Task 6 da (Task 1 da emas): `doc_chunks.subject_id` nullable bo'lmaguncha indekslash yuklashni buzardi.
6. **Yangiliklar `views`:** `UPDATE ... SET views = views + 1` (`synchronize_session=False`, `updated_at` o'zgarmaydi — sitemap `lastmod` buzilmasin).
7. **CMS xabar sxemalari** `ContactMessageOut` / `ContactMessageUpdate` deb nomlandi: AI'dagi `MessageOut` bilan bir xil nom OpenAPI'da `app__...` nomlarga aylanib, frontend tip kontraktini buzgan edi.
8. **Bog'lanish limiti:** `InMemoryRateLimiter` har yuborishni sanaydi (honeypot ham); validatsiyadan o'tmagan so'rov sanalmaydi.
