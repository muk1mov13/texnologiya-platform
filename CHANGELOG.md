# O'zgarishlar jurnali

Loyihadagi barcha o'zgarishlar shu yerda sana bo'yicha qayd etiladi: kod, hujjatlar, infratuzilma, shuningdek GitHub'dagi amallar (repo, PR, merge). Eng yangi yozuvlar yuqorida. Har bir yozuv yonida commit hash'i yoki tegishli havola bor.

---

## 2026-10-14 — 4B (frontend)

### 4B Task 5: guruhlangan admin menyusi va mobil menyu
- `paths.ts`: admin yuqori menyuda bitta "Boshqaruv" (`/admin`) havolasini ko'radi; yangi `ADMIN_NAV` guruhlari (Foydalanuvchilar · O'quv jarayoni; "Sayt" guruhi keyingi tasklarda to'ldiriladi).
- Yangi `AdminLayout`: `md` dan kengda chapda guruhlangan menyu, telefonda ochiladigan ro'yxat (tanlansa o'tadi); `/admin/*` marshrutlari shu layout ichida.
- `AppLayout`: menyu `lg` dan kichikda `MobileMenu` ga (☰) yig'iladi, `overflow-x-auto` olib tashlandi — 3B'da kuzatilgan gorizontal scroll hal qilindi; profil ismi faqat `xl` dan.
- `AppLayout.test.tsx`: admin kutilgan havolalari yangi tuzilishga moslandi (testlar ishga tushirilmadi — loyiha oxirida).
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 4: FAQ, "Biz haqimizda" va bog'lanish
- `FaqPage` (`/faq`): `<details>` akkordeon, oxirida bog'lanish sahifasiga havola.
- `AboutPage` (`/about`): `/api/site` dagi `about` markdown sifatida; bo'sh bo'lsa `EmptyState`.
- `ContactPage` (`/contact`): kontaktlar kartasi (bo'lsa) va forma (`contactSchema` — uzunliklar backend `ContactIn` bilan bir xil), ko'rinmas honeypot `website`, yuborilgach tasdiq kartasi va "Yana yozish"; `CONTACT_RATE_LIMITED` forma ichida.
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 3: ochiq kutubxona
- `LibraryPage` (`/library?tab=metodik|huquqiy|books`): bo'lim tablari URL'da.
- `FolderTree`: rekursiv `<details>` daraxt (yuqori papkalar ochiq), har papkada hujjatlar soni, hujjat qatorida turi, hajmi va to'g'ridan-to'g'ri yuklab olish havolasi (ochiq endpoint).
- `BookCatalog`: qidiruv (300 ms kechikish bilan), kategoriya filtri va sahifa URL'da; kitob kartasida muqova yoki belgi, muallif, kategoriya, hajm, yuklab olish.
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 2: bosh sahifa va yangiliklar
- `HomePage` yakuniy dizayni: hero, imkoniyatlar, so'nggi 3 yangilik (bo'lmasa blok yashirinadi), kutubxona bloki (metodik / huquqiy / kitoblar havolalari), AI repetitor bloki (kirgan foydalanuvchiga `/app/tutor`, mehmonga ro'yxatdan o'tish).
- Yangi `NewsCard`, `NewsListPage` (`/news?page=`, sahifalash) va `NewsPage` (`/news/:slug`: muqova, sana, ko'rishlar, markdown, `usePageMeta` bilan title/description/OG rasm).
- `useNews`: `staleTime: Infinity`, oynaga qaytganda qayta so'ralmaydi (har so'rov `views` ni oshiradi).
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 1: ochiq layout, markdown va sahifa meta'lari
- Yangi bog'liqlik `react-markdown@10.1.0`; `components/ui/Markdown.tsx` — xom HTML chizilmaydi (`skipHtml`), tashqi havolalar `noopener` bilan yangi oynada; uslub `index.css` dagi `.md`.
- `lib/usePageMeta.ts`: `document.title`, description va OG teglari, sahifadan chiqilganda sukut qiymatlari; `index.html` ga sukut description. `lib/format.ts` (`formatSize`, `formatDate`), `components/ui/Pagination.tsx`.
- `PublicLayout`: menyu (Bosh sahifa, Yangiliklar, Kutubxona, Savol-javob, Biz haqimizda, Bog'lanish — `paths.ts: PUBLIC_NAV`), `lg` dan kichikda `MobileMenu` (☰, Escape va tashqarini bosish bilan yopiladi), yangi `SiteFooter` (kontaktlar va ijtimoiy tarmoqlar `/api/site` dan). `navClass` umumiy faylga chiqarildi.
- `src/test/server.ts`: `/api/site` va `/api/news` uchun standart bo'sh javoblar (mavjud testlar yangi so'rovdan yiqilmasin).
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 0: API qatlami
- Backend: `GET /api/admin/books/{id}/file` (admin tasdiqlashdan oldin kutilayotgan kitob faylini ko'radi) va `GET /api/admin/news/{id}/cover` (qoralama yangilik muqovasi); `gen:api`.
- `types.ts`: kutubxona (`FolderNode`, `LibraryDocument`, `Book`, `BookAdmin`, `BookPage` ...) va CMS (`NewsCard`/`NewsDetail`/`NewsAdmin`, `FaqItem`, `SiteSettings`, `ContactIn`, `ContactMessage` ...) tiplari; `types.contract.ts` da ichma-ich sxemalar (`FolderOut`, `SiteOut`) alohida tekshiriladi.
- Yangi hook'lar: `api/library.ts` (ochiq daraxt, katalog, kategoriyalar, "Kitoblarim"), `api/cms.ts` (yangiliklar, FAQ, sayt, bog'lanish), `api/adminCms.ts` (papka/hujjat, kitoblar, yangiliklar, FAQ, xabarlar, sozlamalar; tartib almashtirish). Admin o'zgarishlari ochiq keshlarni ham yangilaydi.
- Tekshiruv: backend `ruff`, `mypy` toza; frontend lint, typecheck, build o'tdi.

## 2026-10-14 — 3B yakuni

### 4B (frontend) rejasi
- Yangi `docs/superpowers/plans/2026-10-14-phase-4b-frontend.md`: Task 0 — admin kitob fayli va qoralama yangilik muqovasi endpoint'lari, tiplar/kontrakt, `library.ts`/`cms.ts`/`adminCms.ts`; 1 — ochiq layout, mobil menyu, footer, `Markdown` (`react-markdown`), `usePageMeta`; 2 — bosh sahifa va yangiliklar; 3 — ochiq kutubxona; 4 — FAQ, biz haqimizda, bog'lanish; 5 — guruhlangan admin nav'i (`AdminLayout`); 6 — "Kitoblarim"; 7 — admin kutubxona va kitoblar navbati; 8 — admin yangiliklar va FAQ; 9 — xabarlar va sayt sozlamalari; 10 — yakun.
- Roadmap: keyingisi 4B Batch 1.

### 4A Task 8: API sxemasi, xato matnlari va hujjatlar
- `npm run gen:api` — `schema.gen.ts` ga kutubxona va CMS endpoint'lari (diff katta, chunki yangi yo'llar alifbo tartibida o'rtaga tushgan).
- Tuzatish: CMS'dagi `MessageOut`/`MessageUpdate` AI'dagi `MessageOut` bilan to'qnashib, OpenAPI'da `app__...` nomlarga aylangan va 3B tip kontraktini buzgan edi — `ContactMessageOut`/`ContactMessageUpdate` ga qayta nomlandi.
- `uz.json`/`ru.json` `errors.*`: `FOLDER_NOT_FOUND`, `FOLDER_NOT_EMPTY`, `FOLDER_SECTION_MISMATCH`, `DOCUMENT_NOT_FOUND`, `BOOK_NOT_FOUND`, `BOOK_ALREADY_APPROVED`, `NEWS_NOT_FOUND`, `NEWS_SLUG_TAKEN`, `FAQ_NOT_FOUND`, `MESSAGE_NOT_FOUND`, `CONTACT_RATE_LIMITED`.
- Mini-spec'ga 10-bo'lim "Amalga oshirishdagi aniqliklar (4A)"; `CLAUDE.md` — loyiha holati va `app/library`/`app/cms` bandi; roadmap — 4A ✅, keyingisi 4B rejasi.
- Tekshiruv: backend `ruff format --check`, `ruff check`, `mypy app` toza; frontend lint, typecheck, build o'tdi.

### 4A Task 7: sitemap va robots
- Yangi `app/cms/seo.py`: `sitemap_xml()` — ochiq statik sahifalar (`/`, `/news`, `/library`, `/faq`, `/about`, `/contact`) va nashr qilingan yangiliklar (`lastmod` — `updated_at`, 5000 tagacha, XML ekranlangan); `robots_txt()` — `/app`, `/teach`, `/admin`, `/api`, `/pending` yopiq, sitemap manzili. Manzillar `PUBLIC_BASE_URL` dan.
- Ochiq `GET /api/seo/sitemap.xml` (`application/xml`), `GET /api/seo/robots.txt` (`text/plain`), OpenAPI'da ko'rinmaydi; prod'da nginx `/sitemap.xml` va `/robots.txt` ni ularga proksilaydi (4C).
- Tekshiruv: `ruff`, `mypy` toza; qo'lda — XML parse qilinadi, qoralama yangilik sitemap'da yo'q.

### 4A Task 6: kutubxona AI indeksi
- `doc_chunks.subject_id` nullable — migratsiya `6f7e4555d66d_doc_chunks_subject_nullable` (`existing_type` BIGINT/SQLite INTEGER; `downgrade` avval kutubxona bo'laklarini o'chiradi); `LIBRARY_SOURCES` (`document`, `book`); `ChunkRow.subject_id` ixtiyoriy.
- `VectorStore.search(..., include_library=False)`: ikkala dialektda mavzusiz kutubxona bo'laklarini ham qamraydi (`_scope`).
- `ai/indexing.py`: `index_library` job'i (faqat PDF; kitob faqat tasdiqlangan bo'lsa; yozishdan oldin qayta tekshiradi), `delete_library_chunks()`, `reindex_all` kutubxonani ham qayta quradi (eskirgan yoki hammasi).
- Repetitor: uchinchi (platforma) daraja kutubxonani ham qidiradi; manba nomi hujjat/kitob sarlavhasidan.
- Ulanishlar: PDF hujjat yuklanganda va PDF kitob tasdiqlanganda (admin yuklagani darhol) indekslanadi; hujjat/kitob o'chirilganda va tasdiq bekor qilinganda bo'laklar o'chiriladi.
- Tekshiruv: `ruff`, `mypy` toza; `alembic upgrade` → `check` → `downgrade -1` → `upgrade`; `AI_PROVIDER=fake` bilan qo'lda: bo'laklar soni 1 → (tasdiqlanmagan kitob) 1 → (tasdiq) 2 → (bekor) 1 → (o'chirish) 0; mavzusiz suhbatda manba `document` "Attestatsiya nizomi".

### 4A Task 5: bog'lanish formasi va admin xabarlar
- Yangi `app/cms/contact.py`; ochiq `POST /api/contact` (204): IP bo'yicha `contact_limiter` (soatiga 5 ta, oshsa 429 `CONTACT_RATE_LIMITED`; honeypot yuborishlari ham sanaladi), honeypot `website` maydoni to'ldirilsa xabar jim tashlanadi, bo'sh maydonlar 422.
- Admin `/api/admin/messages`: `GET ?unread=` (yangidan eskiga, 200 ta), `PATCH /{id}` (`is_read`), `DELETE /{id}` (404 `MESSAGE_NOT_FOUND`).
- Tekshiruv: `ruff`, `mypy` toza; toza bazada qo'lda tekshiruv — hammasi kutilgandek.

### 4A Task 4: FAQ va sayt sozlamalari
- Yangi `app/cms/faq.py`: ochiq ro'yxat (faqat nashr qilingan, `order` bo'yicha), admin CRUD (404 `FAQ_NOT_FOUND`).
- Yangi `app/cms/site.py`: `contacts`, `socials`, `about` kalitlari (`site_settings`); `PUT` faqat yuborilgan bo'limlarni almashtiradi; noma'lum kalit — 422 (`extra="forbid"`, mini-spec'dagi `SETTING_UNKNOWN` o'rniga); ijtimoiy havolalar faqat `https://` (`javascript:` kabi sxemalar rad etiladi).
- Router'lar: ochiq `GET /api/faq`, `GET /api/site`; admin `/api/admin/faq` (`GET`, `POST`, `PATCH`, `DELETE`), `GET` / `PUT /api/admin/site`.
- Tekshiruv: `ruff`, `mypy` toza; toza bazada qo'lda tekshiruv — hammasi kutilgandek.

### 4A Task 3: yangiliklar
- Yangi `app/cms/news.py` va `cms/schemas.py` (yangiliklar qismi): slug sarlavhadan avtomatik (band bo'lsa `-2`, `-3`…), qo'lda berilgani band bo'lsa 409 `NEWS_SLUG_TAKEN`; markdown matndan `excerpt` (200 belgi, belgilarisiz); `published_at` NULL — qoralama, kelajakdagi sana — rejalashtirilgan; `PATCH` da aniq `null` — nashrdan olish; muqova (jpeg/png/webp, 5 MB).
- Ochiq `GET /api/news?page=&size=`, `GET /api/news/{slug}` (har ochilishda `views` atomar +1, `updated_at` o'zgarmaydi), `GET /api/news/{id}/cover` (faqat nashr qilingan); admin `/api/admin/news` (`GET`, `POST`, `GET /{id}`, `PATCH`, `PUT /{id}/cover`, `DELETE`).
- Qo'lda tekshiruvda topilib tuzatilgan: ORM `UPDATE` (`synchronize_session`) xotiradagi obyektni ham oshirgani uchun birinchi ko'rishda `views` 2 qaytardi — `synchronize_session=False`.
- Tekshiruv: `ruff`, `mypy` toza; toza bazada 19 ta tekshiruv — hammasi kutilgandek.

### 4A Task 2: kitoblar va tasdiqlash
- Yangi `app/library/books.py`: yuklash (kitob 50 MB, ixtiyoriy muqova jpeg/png/webp 5 MB; muqova yaroqsiz bo'lsa asosiy fayl ham o'chiriladi), admin yuklagani darhol tasdiqlangan; ochiq katalog (faqat tasdiqlangan, kategoriya va `title`/`author` bo'yicha qidiruv — `%`/`_` ekranlanadi, sahifalash); kategoriyalar; o'qituvchi faqat o'zining tasdiqlanmagan kitobini o'chiradi (boshqaniki — 404, tasdiqlangani — 409 `BOOK_ALREADY_APPROVED`); admin ro'yxati yuklovchi ismi bilan, tahrir/tasdiqlash, muqovani almashtirish, o'chirish.
- Router'lar: ochiq `GET /api/library/books`, `/books/categories`, `/books/{id}/file`, `/books/{id}/cover` (tasdiqlanmagani 404); `/api/teach/books` (`GET`, `POST` multipart, `DELETE`); `/api/admin/books` (`GET ?status=pending|approved`, `PATCH`, `PUT /{id}/cover`, `DELETE`).
- `core/forms.py`: `CategoryForm`.
- Tekshiruv: `ruff`, `mypy` toza; toza bazada 22 ta qo'lda tekshiruv (o'qituvchi → navbat → tasdiqlash → katalog, ruxsatlar, png/webp muqova) va media papkada ortiqcha fayl qolmagani.

### 4A Task 1: kutubxona papkalari va hujjatlari
- Yangi `app/library/`: `schemas.py`, `folders.py` (daraxt ikki so'rov bilan, ichki papka boshqa bo'limda bo'lmaydi — 400 `FOLDER_SECTION_MISMATCH`, bo'sh bo'lmagan papka — 409 `FOLDER_NOT_EMPTY`), `documents.py` (`save_checked`, 50 MB, pdf/doc/docx/ppt/pptx).
- Router'lar: ochiq `GET /api/library/folders?section=`, `GET /api/library/documents/{id}/file` (login'siz); admin `/api/admin/library/folders` (`POST`, `PATCH`, `DELETE`), `POST /folders/{id}/documents` (multipart), `PATCH` / `DELETE /documents/{id}`.
- `TitleForm` `learning/teach_materials_router.py` dan `app/core/forms.py` ga ko'chdi (+ `LongTitleForm`), xatti-harakat o'zgarmagan.
- Rejadan farq: hujjatni AI indeksiga yuborish va bo'laklarini o'chirish to'liq Task 6 ga qoldirildi (hozir `doc_chunks.subject_id` NOT NULL va job yo'q).
- Tekshiruv: `ruff`, `mypy` toza; toza bazada 15 ta qo'lda tekshiruv (httpx) — hammasi kutilgandek.

### 4A Task 0: kutubxona va CMS modellari, migratsiya
- Yangi `app/library/models.py`: `Folder` (`parent_id` o'z-o'ziga, `section` — `metodik|huquqiy`), `Document`, `Book` (`is_approved`, `uploaded_by`, ixtiyoriy muqova).
- Yangi `app/cms/models.py`: `News` (unikal `slug`, `published_at` NULL — qoralama, `views`), `FaqItem`, `ContactMessage`, `SiteSetting` (kalit → JSON).
- Migratsiya `8203a48f665c_library_and_cms_tables` (7 jadval); `models_registry` ga importlar.
- `core/config.py`: `max_library_mb`, `max_cover_mb`, `contact_rate_limit` (5) / `contact_rate_window_seconds` (3600), `public_base_url`; `.env.example` ga `PUBLIC_BASE_URL`.
- `core/files.py`: webp imzosi (`RIFF....WEBP`), `ALLOWED_DOC_EXT`, `ALLOWED_IMAGE_EXT`, `save_checked()` (saqlash + magic bytes + hajm).
- `app.state.contact_limiter` va `ContactLimiter` alias.
- Tekshiruv: `alembic upgrade head` + `alembic check` (vaqtinchalik baza), `ruff format --check`, `ruff check`, `mypy app` toza; ilova yig'iladi.

### 4A (backend) rejasi
- Yangi `docs/superpowers/plans/2026-10-14-phase-4a-backend.md`: Task 0 — sozlamalar, webp imzosi, `save_checked()`, `library`/`cms` modellari va migratsiya, `contact_limiter`; 1 — papkalar va hujjatlar; 2 — kitoblar va tasdiqlash; 3 — yangiliklar; 4 — FAQ va sayt sozlamalari; 5 — bog'lanish formasi (rate limit, honeypot) va admin xabarlar; 6 — kutubxona AI indeksi (`doc_chunks.subject_id` nullable, qidiruv va manbalar); 7 — `sitemap.xml`/`robots.txt`; 8 — `gen:api`, xato matnlari, hujjatlar.
- Mini-spec'dan aniqliklar: `FOLDER_SECTION_MISMATCH` (400) qo'shiladi, sozlamalarda noma'lum kalit `VALIDATION_ERROR` bilan (`SETTING_UNKNOWN` o'rniga).
- Roadmap: keyingisi 4A Batch 1.

### 4-bosqich mini-spec'i
- Push: `a1cd33e..a268662`, so'ng CI tuzatishi `0f19675`; CI uchala job bilan yashil.
- Yangi `docs/superpowers/specs/2026-10-14-phase-4-design.md`: kutubxona (papkalar, hujjatlar, kitoblar), CMS (yangiliklar, FAQ, bog'lanish, sayt sozlamalari), ochiq sayt, SEO va deploy.
- Foydalanuvchi qarorlari: server/domen hali yo'q — deploy fayllari CI'da tekshiriladi; kitoblarni o'qituvchi va admin yuklaydi, admin tasdiqlaydi; SEO prerender'siz (sitemap/robots backend'da); tartib 4A → 4B → 4C.
- Kutubxona PDF'lari AI indeksiga qo'shiladi: `doc_chunks.subject_id` nullable bo'ladi, qidiruv kutubxona manbalarini qamraydi.
- Roadmap: 4-bosqich — mini-spec yozildi; keyingisi 4A rejasi.

### CI tuzatish: `useMediaQuery` jsdom'da
- Push (`a1cd33e..a268662`) dan keyin CI `frontend` jobi yiqildi: `PlayerPage.test.tsx` dagi 14 test — `TypeError: window.matchMedia is not a function`. Sabab: `TutorDock` AI o'chiq bo'lsa ham `useMediaQuery` ni chaqiradi, jsdom'da esa `matchMedia` yo'q.
- `lib/useMediaQuery.ts`: `matchMedia` bo'lmagan muhitda `false` qaytaradi va obuna bo'lmaydi.
- Tekshiruv: lint, typecheck; testlar CI'da.

### 3B Task 9: qo'lda tekshiruv, tuzatishlar va hujjatlar
- `npm run gen:api` — `schema.gen.ts` farqsiz.
- Brauzerda (toza baza, backend 8011, `vite` 5174, Playwright) Gemini+Groq bilan tekshirildi:
  - pleyerdagi repetitor: oqimli javob, `[1] Ma'ruza, 1-bet` manbasi, limit 3/30 → 4/30;
  - 375px: "🤖 Repetitor" tugmasi va pastdan ochiladigan panel;
  - "✨ AI bilan yaratish" → qoralama (5 savol) → mavjud test muharririda saqlash → tasdiqlash → nashr qilinmagan faoliyat;
  - tekshirish sahifasida AI tavsiyasi (9/10, izoh, kuchli tomonlar, kamchiliklar), baholash maydoni bo'sh qoladi;
  - o'qituvchi bosh sahifasida haftalik tahlil; `/admin/ai` (`gemini+groq`, sarf, indeks);
  - admin AI'ni o'chirganda pleyer repetitori, "AI bilan yaratish" yashirindi, `/app/tutor` "o'chirilgan" holatini ko'rsatdi.
- Topilgan va tuzatilgan:
  - `TopicEditorPage`: `AiDraftsSection` va `ActivitiesTab` bir xil `key={step.id}` olgan edi (React ogohlantirishi) → `ai-${step.id}`;
  - `PlayerPage` (oldindan bor xato): telefonda sahifa gorizontal scroll bo'lardi — grid ustunlari `minmax(0,1fr)` emas edi va bosqich havolalaridagi `sr-only` (absolute) matn scroll konteynerdan chiqardi (`ol` ga `relative`). 375px'da `scrollWidth` 917 → 360;
  - `TutorPanel`: "Yangi suhbat" chiqqanda sarlavha ikki qatorga tushmaydi (`truncate`);
  - `AdminAiPage`: kunlar tanlovi va limit maydoni tor o'ramda.
- Kuzatuv (tuzatilmagan): admin nav'ida havolalar ko'payib, u gorizontal scroll bo'ladi (mavjud nav xatti-harakati).
- `CLAUDE.md`: loyiha holati (3B qurilgan), frontend "AI (phase 3)" bandi, `src/test/server.ts` dagi `/api/ai/usage` handleri. Roadmap: 3-bosqich ✅, keyingisi 4-bosqich mini-spec'i.
- Tekshiruv: lint, typecheck, build o'tdi.

## 2026-10-13 — 2B frontend davomi

### 3B Task 8: admin `/admin/ai` sahifasi
- Yangi `features/admin/AdminAiPage.tsx`:
  - **Sozlamalar:** kalit sozlanmaganligi haqida ogohlantirish, provayder (`gemini+groq`), chat va embedding modellari; "AI yoqilgan" va talaba kunlik limiti (0–500) formasi;
  - **Sarf:** 7/30/90 kun, jami so'rovlar, kunlar jadvali (so'rovlar soniga proporsional chiziq, foydalanuvchilar), indeksdagi va eskirgan bo'laklar soni;
  - **Indeks:** "Eskirganlarini qayta qurish" va "Hammasini qayta qurish" (tasdiqlash oynasi bilan), navbatga qo'yilgani toast bilan;
  - maxfiylik eslatmasi.
- `admin/schemas.ts`: `aiSettingsSchema`. Marshrut `admin/ai`, admin nav'ga "AI sozlamalari".
- i18n `adminAi.*` (uz/ru).
- Tekshiruv: lint, typecheck, build o'tdi.

### 3B Task 7: o'qituvchi bosh sahifasida haftalik tahlil
- Yangi `features/teach/WeeklyReport.tsx`: fan kartasida oxirgi haftalik AI tahlili yig'iladigan `<details>` blokda (davr sanalari bilan, markdown belgilarisiz). Hisobot yo'q, AI o'chiq yoki xato bo'lsa chizilmaydi; AI o'chiq bo'lsa so'rov ham yuborilmaydi.
- `TeachHomePage`: `WeeklyReport` fan sarlavhasidan keyin.
- i18n `aiReport.title` (uz/ru).
- Tekshiruv: lint, typecheck, build o'tdi.

### 3B Task 6: tekshirish sahifasida AI tavsiyasi
- Yangi `features/teach/AiSuggestionCard.tsx`: holatlar `none` (tugma "AI bilan tekshirish"), `pending` (spinner, sahifa 3 s polling bilan yangilanadi), `done` (taklif qilingan ball / maksimal, izoh, kuchli tomonlar, kamchiliklar, "ballni o'qituvchi qo'yadi" eslatmasi), `unsupported`, `failed`; `pending` dan boshqa holatda "Qayta tekshirish". AI o'chiq va tekshiruv bo'lmagan bo'lsa karta chizilmaydi.
- `ReviewDetailPage`: karta baholash formasi/natijasidan oldin.
- i18n `aiReview.*` (uz/ru).
- Tekshiruv: lint, typecheck, build o'tdi.

### 3B Task 5: "✨ AI bilan yaratish" va qoralamalar
- Yangi `features/teach/ai/`:
  - `AiDraftsSection` — takrorlash, amaliyot, glossariy va vazifa tablari tepasida "✨ AI bilan yaratish" tugmasi va shu bosqichning ochiq (`generating`/`draft`/`failed`) qoralamalari; AI o'chiq bo'lsa chizilmaydi va qoralamalar so'ralmaydi;
  - `DraftCreateModal` — turi (faoliyat bosqichida test/ha-yo'q/krossvord), `ready` ma'ruza/taqdimot materiallari (1–3), soni (tur oralig'ida), qiyinlik;
  - `DraftCard` — holat belgisi, yaratilmoqda spinneri (3 s polling), xato va yopish, qisqa ko'rinish, tahrirlash, tasdiqlash (toast) va rad etish (tasdiqlash oynasi);
  - `DraftEditor` — mavjud `ActivityEditor`/`TaskForm` tashqi saver bilan, `DraftGlossaryEditor` — `GlossaryForm` bilan atamalarni tahrirlash/o'chirish;
  - `draftKinds.ts` (son oraliqlari, ikonlar, bosqich → turlar), `schemas.ts` (zod).
- `useDrafts(topicId, enabled)` — AI o'chiq bo'lsa so'rov yuborilmaydi (mavjud `TopicEditorPage` testlari uchun ham).
- `TopicEditorPage`: `AiDraftsSection` tab kontentidan oldin.
- i18n `aiDraft.*` (uz/ru).
- Tekshiruv: lint (`watch` o'rniga `useWatch` — React Compiler ogohlantirishi), typecheck, build o'tdi.

### 3B Task 4: muharrirlarga tashqi saqlash
- Yangi `features/teach/assessment/saver.ts`: `ActivitySaver`, `TaskSaver` tiplari.
- `ActivityEditor`: ixtiyoriy `saver` prop (berilsa faoliyat API'si o'rniga ishlatiladi); `initial` endi `id` siz ham bo'lishi mumkin (AI qoralamasi) — yangilash/yaratish `initial.id` bo'yicha tanlanadi.
- `TaskTab`: `TaskForm` eksport qilindi, ixtiyoriy `draft` (`initial` + `saver`) — qoralama rejimida o'chirish tugmasi va "vazifa yo'q" matni ko'rsatilmaydi.
- `GlossaryTab`: `GlossaryForm` eksport qilindi, `initial` faqat `term`/`definition` talab qiladi.
- Mavjud xatti-harakat o'zgarmagan. Tekshiruv: lint, typecheck, build o'tdi.

### 3B Task 3: `/app/tutor` sahifasi
- Yangi `features/student/TutorPage.tsx`:
  - chapda suhbatlar ro'yxati (sana, tanlangani belgilangan), "Yangi suhbat" va o'chirish (tasdiqlash oynasi bilan);
  - o'ngda tanlangan suhbat davomi (mavzu konteksti saqlanadi) yoki yangi umumiy suhbat;
  - AI o'chiq bo'lsa "AI repetitor hozircha o'chirilgan" holati.
- Marshrut `app/tutor`; nav'da barcha rollar uchun "AI repetitor" havolasi.
- i18n: `nav.tutor`, `nav.adminAi` (8-task uchun oldindan).
- Tekshiruv: lint, typecheck, build o'tdi; mavjud nav testlari faqat ma'lum havolalar borligini tekshiradi — yangi havola ularni buzmaydi.

### 3B Task 2: pleyerda repetitor
- Yangi `features/student/tutor/TutorDock.tsx`:
  - keng ekranda (≥1024px) pleyerning o'ng ustunidagi sticky panel;
  - telefonda pastki o'ngdagi "🤖 Repetitor" tugmasi orqali pastdan ochiladigan panel (Escape va fonni bosish bilan yopiladi, yopilganda suhbat saqlanadi);
  - AI o'chiq bo'lsa (`/api/ai/usage` → `enabled: false`) hech narsa chizilmaydi.
- Yangi `lib/useMediaQuery.ts` (`useSyncExternalStore`).
- `PlayerPage`: grid `lg:grid-cols-[240px_1fr_340px]`, `TutorDock` qo'shildi.
- `src/test/server.ts`: `/api/ai/usage` uchun standart javob (AI o'chiq) — mavjud pleyer testlari ishlov berilmagan so'rov bilan yiqilmasligi uchun; yangi test yozilmagan.
- Tekshiruv: lint, typecheck, build o'tdi.

### 3B Task 1: repetitor holati va paneli
- Yangi `features/student/tutor/useTutorChat.ts`: suhbat holati — optimistik talaba xabari, `delta` bo'laklari bilan oqimli javob, `meta` dan rejim (`answer`/`hint`/`refusal`) va manbalar; xatoda bo'sh javob olib tashlanadi; tugagach `usage` va suhbatlar keshi yangilanadi; unmount'da oqim bekor qilinadi.
- Yangi `TutorPanel.tsx`: sarlavha va kunlik limit, `role="log"` xabarlar ro'yxati, maslahat/rad belgisi, `[n]` manbalar (nom va sahifa), Enter bilan yuborish, limit tugasa forma o'chadi, xato `FormError` da.
- Yangi `lib/plainText.ts`: LLM javobidagi `**`/`__`/`#` belgilarini olib tashlaydi.
- i18n: `tutor.*` (uz/ru; Task 2–3 kalitlari ham shu bo'limda).
- Tekshiruv: lint, typecheck, build o'tdi.

### 3B Task 0: AI tiplari, API hook'lari va SSE klient
- `src/api/types.ts`: AI tiplari (`Citation`, `ConversationBrief`/`Detail`, `ChatMessageView`, `AiUsageMe`, `ChatIn`, `ChatMeta`, `AiDraft`, `DraftCreateIn`/`UpdateIn`, `AiReport`, `AiSettingsView`/`Update`, `AiUsageStats`, `ReindexIn`); `types.contract.ts` ga 10 ta javob va 5 ta so'rov kontrakti — hammasi birinchi urinishda mos keldi.
- `client.ts`: `apiStream()` — 401/refresh va xato formati `apiFetch` bilan bir xil, tana oqim sifatida qaytadi.
- Yangi `lib/sse.ts`: `readSse()` SSE parser. Rejadagi `TextDecoderStream` TS DOM tiplariga mos kelmadi, o'rniga `TextDecoder` `stream: true` bilan.
- Yangi `api/ai.ts` (`useAiUsage`, suhbatlar, `streamChat`), `api/teachAi.ts` (qoralamalar `generating` da 3 s polling, tasdiqlash keshlarni yangilaydi, `useAiCheck`, `useAiReports`), `api/adminAi.ts` (sozlamalar, sarf, reindex).
- `useSubmission`: `ai_status=pending` da 3 s polling.
- Tekshiruv: `npm run lint`, `typecheck`, `build` o'tdi.

### 3B (AI frontend) rejasi
- Push: `main` → `origin/main` (30 commit, `a1cd33e` gacha); CI uchala job yashil.
- Yangi reja `docs/superpowers/plans/2026-10-13-phase-3b-frontend.md` (spec 7-bo'lim): Task 0 — AI tiplari, kontrakt, `apiStream`, SSE parser va hook'lar; 1–3 — repetitor (panel, pleyerda o'ng panel/mobil bottom sheet, `/app/tutor`); 4–5 — muharrirlarga tashqi saver va "✨ AI bilan yaratish" qoralamalari; 6 — AI tavsiyasi kartasi; 7 — haftalik tahlil; 8 — `/admin/ai`; 9 — hujjatlar va qo'lda smoke. uz/ru i18n kalitlari rejada.
- Roadmap: 3B rejasi yozildi, keyingisi Batch 1.

### 3A Task 14 yakuni: Gemini + Groq bilan qayta smoke
- Toza baza (`e2e/start-backend.mjs`, port 8011), ikkala kalit bilan. `.env` dagi `AI_MODEL_CHAT=gemini-2.5-flash` Gemini'da 404 berdi, shuning uchun matn so'rovlari Groq'ga o'tdi (logda `AI fallback`), embedding Gemini'da ishladi.
- Natija: PDF → `doc_chunks` ✅; repetitor `answer` + `[1]` ✅, `refusal` ✅, `hint` ✅; qoralama → tasdiqlash → faoliyat ✅; vazifa AI tekshiruvi `done`, ball 9/10 ✅; `weekly-report` ✅; admin sozlamalarida `provider=gemini+groq` ✅.
- Kuzatuv: yangi `hint` ko'rsatmasi bilan javob `[1]` ga yo'naltiradi va yo'naltiruvchi savol beradi, lekin model beshala turni qavs ichida yana sanadi — ochiq masala.
- Roadmap: Task 14 ✅. `CLAUDE.md`: `FallbackProvider`/`GroqProvider` bandi.

### AI: hint rejimi ko'rsatmasi kuchaytirildi
- Smoke'da repetitor yechilmagan test savoliga (Klimov tasnifi, "nechta tur?") beshala turni sanab berdi, ya'ni javobni bilvosita aytdi.
- `app/ai/tutor.py` `HINT`: son, sana, atama yoki ta'rifni aytmaslik va javob bo'ladigan ro'yxatni to'liq sanamaslik; o'rniga 2-3 jumlada tushuncha, materialning qaysi qismini `[n]` o'qishni ko'rsatish va bitta yo'naltiruvchi savol.
- Tekshiruv: `ruff`, `mypy` toza; natija Task 14 qayta smoke'ida ko'riladi.

### AI: Groq zaxira provayderi
- Foydalanuvchi qarori: Gemini band bo'lsa (429/5xx) matn Groq'da yaratilsin.
- `app/ai/providers.py`:
  - yangi `GroqProvider` (`httpx`, OpenAI'ga mos `chat/completions`): `generate`, `generate_json` (`json_schema`, `strict: false`, Pydantic bilan tekshiruv), SSE `stream`;
  - yangi `FallbackProvider`: asosiy provayder `ProviderBusy` bersa zaxiraga o'tadi va model nomini almashtiradi; oqim faqat birinchi bo'lakdan oldin o'tkaziladi;
  - `with_retry` endi `httpx` xatolarini ham taniydi.
- Groq'da embedding yo'q, shuning uchun indeks va qidiruv Gemini'da qoladi.
- Sozlamalar: `GROQ_API_KEY` (bo'sh bo'lsa zaxira o'chiq), `GROQ_MODEL_CHAT=openai/gpt-oss-120b`, `GROQ_MODEL_FAST=openai/gpt-oss-20b`, `GROQ_RPM=30`.
- `GET /api/admin/ai/settings`: zaxira ulangan bo'lsa `provider` maydoni `gemini+groq` bo'ladi (sxema o'zgarmagan).
- `httpx` asosiy bog'liqliklarga ko'chirildi.
- Tekshiruv: `ruff`, `mypy` toza; `AI_PROVIDER=fake` bilan ilova yig'iladi; o'tish mantig'i bir martalik skriptda tekshirildi.

### 3A Task 14: haqiqiy Gemini kaliti bilan qo'lda tekshiruv (oraliq)
- Tuzatish `app/ai/providers.py`: `GeminiProvider.stream()` da 503/429 xatosi birinchi bo'lakni o'qishda chiqardi va `with_retry` uni ushlamasdi — repetitor darhol `AI_BUSY` berardi, logga ham yozilmasdi. Endi oqim ochilishi va birinchi bo'lak retry ichida; oqim o'rtasidagi xato logga yoziladi.
- `app/ai/grading.py`: AI tekshiruvi yiqilganda sabab turi logga yoziladi (matnsiz).
- Natija (toza baza, `e2e/start-backend.mjs`, port 8011):
  - PDF → `doc_chunks` to'ldi ✅;
  - repetitor: mavzu savoli → `answer` + `[1]` manba ✅; aloqasiz savol → `refusal` (LLM'siz) ✅; nashr qilingan test savoli → `hint` ✅;
  - test qoralamasi → `draft` (3 savol) → tasdiqlash → faoliyat ✅ (bir urinishda 429, daqiqadan keyin o'tdi);
  - `weekly-report --week-start 2026-10-12` → hisobot yaratildi va `GET /teach/ai/reports` da ko'rinadi ✅;
  - matnli vazifani AI tekshirish → ikki marta `ClientError 429` → `failed` ❌ (ochiq).
- Tekshiruv: `ruff format`, `ruff check`, `mypy app` toza.

### 3A Task 15: hujjatlar va yakun
- Spec `2026-10-13-phase-3-ai-design.md`: yangi 10-bo'lim "Amalga oshirishdagi aniqliklar (3A)" (5 band).
- `CLAUDE.md`: loyiha holati (3A qurilgan), `app/ai/` arxitektura bandi, `weekly-report` buyrug'i.
- Roadmap: 3A qurildi; Task 14 (haqiqiy kalit bilan qo'lda tekshiruv) kalitni kutmoqda; keyingisi — 3B rejasi.
- Yakuniy tekshiruv: `ruff format --check`, `ruff check`, `mypy app`, `alembic check` toza; frontend lint, typecheck va build o'tdi, `gen:api` farqsiz.

### 3A Task 13: frontend uchun AI API sxemasi va xato matnlari
- `npm run gen:api` — `schema.gen.ts` ga AI endpoint'lari tushdi.
- `src/api/types.ts`: `SubmissionDetail` ga `ai_status`, `ai_score`, `ai_feedback`; yangi `AiCheckStatus`, `AiFeedback` (kontrakt tekshiruvi talab qildi).
- `uz.json` / `ru.json` `errors.*`: `AI_DISABLED`, `AI_BUSY`, `AI_LIMIT_REACHED`, `CONVERSATION_NOT_FOUND`, `AI_DRAFT_NOT_FOUND`, `AI_DRAFT_WRONG_STEP`, `AI_DRAFT_NOT_READY`, `AI_DRAFT_CLOSED`, `AI_DRAFT_INVALID`.
- Tekshiruv: lint, typecheck, build o'tdi; `gen:api` qayta ishga tushirilganda farq yo'q.

### 3A Task 12: admin AI API
- Yangi `app/ai/admin_router.py` (`/api/admin/ai`, faqat admin):
  - `GET` / `PATCH /settings` — `enabled`, `student_daily_limit` (0–500), shuningdek `configured`, provayder va modellar; kalitning o'zi qaytarilmaydi;
  - `GET /usage?days=1..90` — kunlar bo'yicha so'rovlar va foydalanuvchilar soni, jami va eskirgan bo'laklar;
  - `POST /reindex` (202) — `reindex_all` job'i; AI o'chiq bo'lsa 503.
- `schemas.py`: `AiSettingsOut`, `AiSettingsUpdate`, `AiUsageDay` (`day`), `AiUsageOut`, `ReindexIn`.
- Tekshiruv (smoke): sozlamalar o'qildi va o'zgartirildi, javobda kalit yo'q; limit 9999 → 422; AI o'chiqda reindex 503, yoqilganda 202; o'qituvchiga 403. ruff va mypy toza.

### 3A Task 11: haftalik AI tahlili (CLI)
- `assessment/reports.py`: hisob ruxsatsiz `topic_stats(db, subject_id)` ga ajratildi; `teach_stats` endi ruxsat + `topic_stats` (xatti-harakati o'zgarmadi).
- Yangi `app/ai/reports.py`:
  - `week_bounds` — sukut o'tgan dushanba–yakshanba (Tashkent), dushanba bo'lmagan sana rad etiladi;
  - `subject_week_stats` — mavzular statistikasi, hafta urinishlari, eng qiyin 5 savol (kamida 3 javob), yuborilgan/baholangan vazifalar, 7 kun faolsiz talabalar;
  - `weekly_report` — fanga biriktirilgan o'qituvchilarning har tili uchun hisobot (`ai_reports`, upsert); faollik bo'lmasa LLM chaqirilmaydi.
- CLI: `uv run python -m app.cli weekly-report [--week-start YYYY-MM-DD] [--subject ID]`; AI sozlanmagan bo'lsa xato matni va exit 1.
- `GET /api/teach/ai/reports?subject_id=` — o'qituvchi tilidagi oxirgi 4 ta hisobot.
- Tekshiruv (smoke, `fake`):
  - hafta chegaralari to'g'ri, dushanba bo'lmagan sana rad etildi;
  - faolliksiz hafta → tayyor matn, faollik qo'shilgach shu qator yangilandi (1 ta hisobot, `ru`);
  - `hardest` to'g'ri hisoblandi; endpoint 200;
  - lokal `.env` bilan CLI tushunarli xato berdi.
  - ruff va mypy toza.

### 3A Task 10: vazifa javobini AI bilan tekshirish
- Yangi `app/ai/grading.py`:
  - `extract_text` — textarea, PDF, DOCX; boshqa turlar `unsupported`; matn 20 000 belgida kesiladi;
  - `queue_check` — AI yoqilgan bo'lsa `ai_status=pending` va job; xatosi javob yuborishni to'xtatmaydi;
  - `ai_check_job` — LLM'ga faqat topshiriq, mezon, `max_score`, mavzu parchalari va javob matni ketadi (ism, email, fayl nomi yo'q); ball `0..max_score` ga qisiladi; javob orada qayta yuborilgan bo'lsa, natija yozilmaydi.
- `assessment/router.py`: talaba javob yuborgach `queue_check`.
- `assessment/schemas.py` / `review.py`: `SubmissionDetailOut` ga `ai_status`, `ai_score`, `ai_feedback` (faqat o'qituvchi uchun; talaba sxemalari o'zgarmadi).
- `POST /api/teach/submissions/{id}/ai-check` (202) — qayta tekshirish.
- Tekshiruv (HTTP smoke, `fake`):
  - talaba javobida `ai_*` maydonlari yo'q;
  - o'qituvchi tafsilotida `done`, ball 5 (7 → `max_score` 5 ga qisildi), izoh;
  - qayta tekshirish 202 → `done`.
  - ruff va mypy toza.

### 3A Task 9: AI qoralamalari (kontent yaratish)
- Yangi `app/ai/drafts.py` va `app/ai/teach_router.py`; `api.py` ga ulandi.
- Oqim:
  - `POST /api/teach/ai/drafts` (`step_id`, `kind`, `material_ids` 1–3, `count`, `difficulty`);
  - `generate_draft` job'i LLM'ni JSON sxemasi bilan chaqiradi; natija mavjud kirish sxemalari (`QuizActivityIn`, `YesNoActivityIn`, `CrosswordActivityIn`, `GlossaryIn`, `TaskIn`) va qo'shimcha qoidalar bilan tekshiriladi (4 ta turli variant, takror yo'q, krossvord so'zlari joylashadi);
  - xato bo'lsa, xato matni bilan bir marta qayta so'raladi; bo'lmasa `failed`.
- `GET` (ro'yxat / bitta), `PUT` (tahrir), `POST …/approve`, `POST …/reject`.
- Tasdiqlash mavjud `create_activity` / `add_glossary_term` / `upsert_task` ni chaqiradi; faoliyat **nashr qilinmagan** holda yaratiladi.
- Xato kodlari: `AI_DRAFT_WRONG_STEP` 400, `AI_DRAFT_INVALID` 422, `AI_DRAFT_NOT_READY` / `AI_DRAFT_CLOSED` 409, `AI_DRAFT_NOT_FOUND` 404 (ruxsat bo'lmasa ham 404).
- Tekshiruv (HTTP smoke, `fake`):
  - test, krossvord, glossariy va vazifa qoralamalari `generating → draft → approve` dan o'tdi;
  - 2 ta nashr qilinmagan faoliyat, 3 ta atama va 1 ta vazifa yaratildi;
  - noto'g'ri bosqich 400, begona material 422, qayta tasdiqlash 409, noto'g'ri tahrir 422, rad etish ishladi.
  - ruff va mypy toza.

### 3A Task 8: talaba repetitori (SSE) va suhbatlar
- Yangi `app/ai/schemas.py` (chat, suhbat, usage va qoralama sxemalari), `app/ai/tutor.py`, `app/ai/router.py`; `api.py` ga ulandi.
- `POST /api/ai/chat` — `text/event-stream`, hodisalar `delta`… → `meta` (`conversation_id`, `mode`, javobda haqiqatan ishlatilgan `citations`) → `done`; provayder xatosida `error` (`AI_BUSY`).
- Ishlash tartibi:
  - tekshiruvlar oqimdan oldin oddiy JSON xato bilan: `AI_DISABLED` 503, `AI_LIMIT_REACHED` 429, `CONVERSATION_NOT_FOUND` / `TOPIC_NOT_FOUND` 404;
  - salomlashish va "qanday foydalanaman" savollariga tayyor javob (`canned`) — LLM va limit ishlatilmaydi;
  - qidiruv kaskadi: mavzu → fan → platforma (faqat nashr qilingan, `material`/`glossary` bo'laklari);
  - chegaradan past bo'lsa, LLM'siz rad javobi (`refusal`, limitdan ayiriladi);
  - yakunlanmagan faoliyat yoki vazifaga juda o'xshash savolda maslahat rejimi (`hint`).
- `GET /api/ai/usage`, `GET /api/ai/conversations`, `GET` / `DELETE /api/ai/conversations/{id}` (faqat egasiga).
- Tuzatish (Task 7): `usage.py` `zoneinfo("Asia/Tashkent")` o'rniga gamifikatsiyadagi `TASHKENT` (UTC+5) ni ishlatadi. Sabab: Windows'da `tzdata` yo'q, import paytida xato berardi.
- Tekshiruv (HTTP smoke, `fake`):
  - mavzu savoli `delta, delta, meta, done` va 1 ta iqtibos (3-sahifa) berdi;
  - aloqasiz savol → rad javobi;
  - "Salom!" → tayyor javob, limitdan ayirilmadi;
  - suhbat tafsilotida savol va javob saqlandi;
  - limit 2 da 429, AI o'chirilganda 503.
  - ruff va mypy toza.

### 3A Task 7: talabaning kunlik AI limiti
- Yangi `app/ai/usage.py`:
  - `today()` (Asia/Tashkent), `used_today`;
  - `ensure_within_limit` — 429 `AI_LIMIT_REACHED`, `details.limit`;
  - `record_request` — atomik +1, parallel so'rovda `IntegrityError` dan keyin qayta `UPDATE`.
- O'qituvchi va admin limitga tushmaydi.
- Tekshiruv: ruff, mypy toza.

### Ish tartibi tezlashtirildi
- Sabab: ko'p kunlik ishda ko'rinadigan natija kam bo'ldi, tokenlar esa tez sarflandi. Asosiy sabablar:
  - bitta juda uzun sessiya (~740k token kontekst);
  - ECC "GateGuard" hook'i (35+ blok, kod qayta yuborildi);
  - 13 ta plagin;
  - har task'dan keyin tasdiq va ikki commit.
- `CLAUDE.md` "Execution Constraints":
  - reja 3–5 tasklik bo'laklarda bajariladi, tasdiq bo'lak oxirida;
  - har task uchun bitta commit, CHANGELOG yozuvi shu commit ichida;
  - hisobotlar qisqa.
- Claude Code sozlamasi (repodan tashqarida): `ecc`, `vercel`, `task-observer`, `claude-mem`, `claude-code-setup` va `skill-creator` plaginlari o'chirildi.
- Ustuvorlik (foydalanuvchi qarori): avval AI (3A qolgan tasklari, 3B), keyin deploy. Server hali yo'q.

### `69eae22` — 3A Task 6: indekslash job'lari va hook'lar
- Yangi `app/ai/indexing.py`. Job'lar AI o'chiq bo'lsa hech narsa qilmaydi:
  - `index_material` — PDF sahifalari → bo'laklar → embedding → `doc_chunks`. Material orada o'chirilgan bo'lsa, natija yozilmaydi;
  - `index_topic_glossary` — mavzu glossariysi bitta manba (`source_id = topic_id`), har atama alohida bo'lak;
  - `index_topic_questions` — faqat nashr qilingan faoliyatlarning savol matni (test savoli, ha/yo'q bayonoti, krossvord izohi) va vazifa nomi/tavsifi; to'g'ri javoblar kirmaydi;
  - `reindex_all` — model o'zgargan yoki hamma bo'laklar;
  - yordamchilar: `index_material_quietly`, `enqueue_questions_for_step`.
- Hook'lar:
  - `learning/materials.py`:
    - PDF yuklanganda `index_material` navbatga qo'yiladi;
    - konvertatsiya job'i oxirida indekslash chaqiriladi (job ichidan job qo'yilmaydi; xatosi konvertatsiyaga ta'sir qilmaydi);
    - material o'chirilganda bo'laklari ham o'chadi (`doc_chunks.source_id` FK emas).
  - `learning/teach_items_router.py`: glossariy qo'shish/tahrirlash/o'chirish → `index_topic_glossary`.
  - `assessment/teach_router.py`: faoliyat yaratish/tahrirlash/nashr/o'chirish va vazifa saqlash/o'chirish → `index_topic_questions`. O'chirishda `step_id` oldindan olinadi.
  
  API (URL, tana, javob) o'zgarmadi.
- Tekshiruv:
  - ruff va mypy toza; import tsikli yo'q; 5 ta job ro'yxatdan o'tdi;
  - smoke (`fake`, vaqtinchalik SQLite):
    - material, glossariy, faoliyat va vazifa — har biri 1 bo'lak;
    - test variantlari (to'g'ri javob ham) va nashr qilinmagan faoliyat indeksga tushmadi;
    - qayta indekslash bo'laklarni takrorlamadi;
    - material o'chirilganda uning bo'laklari ham o'chdi.

### `785d686` — 3A Task 5: AI xizmatlarini ilovaga ulash
- Yangi `app/ai/services.py`:
  - `AiServices` (llm, embedder, vectors, `configured`, chat/fast modellar);
  - `build_ai` — baza dialektiga qarab SQLite/PG vektor ombori; kalit bo'lsa `GeminiProvider`, bo'lmasa `FakeProvider` (`configured=False`);
  - `get_ai_settings` — bitta qatorli sozlamalar, yo'q bo'lsa yaratiladi;
  - `ai_enabled` / `require_ai` — 503 `AI_DISABLED`;
  - `recover_interrupted_ai` — qayta ishga tushganda `generating` qoralamalar `failed`/`INTERRUPTED` ga, `pending` AI tekshiruvlari `failed` ga o'tadi.
- `core/jobs.py`: `JobContext.ai` (sukut `None`; tip faqat `TYPE_CHECKING` da, import tsiklisiz).
- `core/deps.py`: `get_ai` va `Ai` alias'i.
- `main.py`: `app.state.ai`, `JobContext(..., ai=ai)`, lifespan'da `recover_interrupted_ai` (faqat `InlineJobRunner` bo'lsa).
- Tekshiruv (smoke, vaqtinchalik SQLite):
  - `fake` → `FakeProvider`, yoqilgan;
  - kalitsiz `gemini` → o'chiq;
  - kalitli `gemini` → `GeminiProvider`, yoqilgan (tarmoqqa so'rov yuborilmadi);
  - job konteksti o'sha `AiServices` ni oladi;
  - `generating` qoralama qayta ishga tushganda `failed`/`INTERRUPTED` bo'ldi;
  - admin `enabled=False` qilganda AI o'chdi.
  - ruff va mypy toza.

### `9863190` — 3A Task 4: vektor ombori va bo'laklash
- Yangi `app/ai/vectors.py`:
  - `ChunkRow`, `Hit` tiplari;
  - `VectorStore` bazasi: `delete` (manba turi / manba / mavzu bo'yicha) va `add` umumiy, commit qilmaydi;
  - `SqliteVectorStore` — SQL filtri, so'ng numpy bilan skalyar ko'paytma va top-k;
  - `PgVectorStore` — `<=>` (cosine masofa), HNSW indeksi, `score = 1 - distance`;
  - bo'sh `topic_ids` bo'lsa, so'rov yuborilmaydi.
- Yangi `app/ai/chunking.py`:
  - `pdf_pages` (PyMuPDF);
  - `split_text` — ~3200 belgi, so'z chegarasida, ~400 belgi ustma-ust, 40 belgidan qisqa bo'laklar tashlanadi;
  - `chunk_pages` — bo'laklar sahifa chegarasidan o'tmaydi, shunda iqtibosdagi sahifa raqami aniq.
- Tekshiruv (smoke, `FakeProvider` bilan, xotiradagi SQLite):
  - 8000 belgili matn → 3 bo'lak (eng uzuni 3199), ustma-ustlik bor;
  - 2 sahifali PDF'ning bo'sh sahifasi bo'lak bermadi;
  - qidiruvda eng o'xshash bo'lak birinchi (0,8 va 0,447);
  - mavzu va tur filtrlari ishladi;
  - o'chirilgan manba qidiruvdan yo'qoldi.
  - ruff va mypy toza. `PgVectorStore` lokal tekshirilmadi (PostgreSQL yo'q), loyiha oxiridagi testlarda va CI'da tekshiriladi.

### `b623637` — 3A Task 3: AI provayder adapteri
- Yangi `app/ai/providers.py`:
  - `LLMProvider` (`generate`, `generate_json`, `stream`) va `EmbeddingProvider` (`embed`) protokollari;
  - `ChatMessage`, `ProviderBusy`;
  - `normalize` (L2, cosine = skalyar ko'paytma).
- `TokenBucket` — provayderga umumiy so'rov oqimi (`AI_RPM`). `max_wait` soniyadan ko'p kutish kerak bo'lsa `ProviderBusy`.
- `with_retry`:
  - 429/5xx/tarmoq xatosida 1, 2, 4 s kutib 3 marta qayta urinadi;
  - boshqa API xatolari (noto'g'ri kalit yoki model) darhol `ProviderBusy`;
  - logga faqat xato turi va kodi yoziladi, prompt matni yozilmaydi.
- `GeminiProvider` (`google-genai`): chat, JSON sxemali javob (`response_schema`), oqim, embedding (`output_dimensionality=768`, `RETRIEVAL_QUERY`/`RETRIEVAL_DOCUMENT`, 100 tadan paket).
- `FakeProvider`: internetsiz, deterministik hash-embedding, sxemaning `fake_sample()` dan JSON va qisqa oqim.
- Rejadan farq (ruff talabi): `TokenBucket.acquire(timeout)` → `acquire(max_wait)` (ASYNC109); `with_retry` PEP 695 generik sintaksisiga o'tdi (UP047).
- Tekshiruv:
  - ruff va mypy toza;
  - `FakeProvider` embedding: o'lcham 768, `olma anor` ↔ `olma` o'xshashligi 0,707;
  - offlayn tekshiruv: 429→429→ok 3 chaqiruvda o'tdi; 400 darhol `ProviderBusy`; doimiy 429 4 urinishdan keyin `ProviderBusy`; bo'sh `TokenBucket` `ProviderBusy` berdi, 30 s dan keyin token qaytdi.
  - Haqiqiy Gemini chaqiruvi Task 14 da tekshiriladi.

### `b1d039c` — 3A Task 2: AI modellari, `Vector` tipi va migratsiya
- `core/types.py`: yangi `Vector(dim)` tipi:
  - PostgreSQL'da pgvector `vector(dim)`, SQLite'da float32 BLOB;
  - noto'g'ri o'lcham yozishda rad etiladi.
- Yangi `app/ai/models.py`:
  - jadvallar: `doc_chunks`, `ai_conversations`, `ai_messages`, `ai_drafts`, `ai_reports`, `ai_usage`, `ai_settings`;
  - enum'lar: `ChunkSource`, `MessageRole`/`MessageMode`, `DraftKind`/`DraftStatus`;
  - PostgreSQL uchun `vector` kengaytmasi va HNSW indeksi DDL hodisalari orqali (SQLite'da hech narsa qilmaydi).
- `assessment/models.py`: `AiCheckStatus` enum'i va `submissions` ga `ai_status` (sukut `none`), `ai_score`, `ai_feedback` ustunlari.
- `models_registry.py` ga `app.ai.models`.
- `alembic/env.py`: HNSW indeksi taqqoslashdan chiqarildi, `Vector` ustun turi taqqoslanmaydi (pgvector reflektsiyasi farq bermasligi uchun).
- Migratsiya `60d2171f1205_ai_tables`:
  - autogenerate `Vector` ni o'lchamsiz yozgan edi, `Vector(dim=768)` ga tuzatildi;
  - PostgreSQL uchun kengaytma va HNSW indeksi qo'lda qo'shildi (downgrade'da olib tashlanadi).
- CI: PostgreSQL image'i `postgres:16` → `pgvector/pgvector:pg16`.
- Rejadan farq: `ai_usage` dagi sana ustuni `date` emas, `day` deb nomlandi, chunki `date: Mapped[date]` sinf ichida `datetime.date` tipini soya qiladi. Reja hujjatidagi murojaatlar ham yangilandi (`5130fb2`).
- Tekshiruv:
  - `alembic upgrade head` → `downgrade -1` → `upgrade head` lokal SQLite'da o'tdi;
  - `alembic check` farqsiz;
  - `create_all` yangi jadvallar bilan ishladi;
  - `Vector` 768 o'lchamda o'zgarmasdan qaytdi, noto'g'ri o'lcham rad etildi;
  - ruff va mypy toza. PostgreSQL yo'li lokal tekshirilmadi (CI'da tekshiriladi).

### `7075f69` — 3A Task 1: AI bog'liqliklari va sozlamalari
- Yangi bog'liqliklar (`uv add`): `google-genai` 2.30.0, `pgvector` 0.5.1, `numpy` 2.5.4, `python-docx` 1.2.0. Yon ta'sir: `google-genai` talabi bilan `websockets` 17.2 → 16.1.1 ga tushdi (loyiha websocket ishlatmaydi).
- `Settings` ga AI maydonlari qo'shildi:
  - `ai_provider` (`gemini|fake`), `gemini_api_key`;
  - `ai_model_chat` / `ai_model_fast` / `ai_embedding_model`;
  - `ai_rpm` (sukut 10), `ai_min_similarity` (0,55), `ai_hint_similarity` (0,85);
  - `ai_configured` xossasi.
- `.env.example`: AI bo'limi, kalit bo'sh. Rasmiy "Rate limits" sahifasida bepul tarifning aniq raqamlari yo'q (limitlar akkauntga bog'liq va AI Studio'da ko'rsatiladi). Shuning uchun `AI_RPM=10` ehtiyotkor sukut qiymat sifatida qoldirildi va izohda AI Studio havolasi berildi.
- Yangi `app/ai/` paketi va `constants.py`: `EMBEDDING_DIM=768`, job nomlari, chegaralar.
- Tekshiruv: `ruff format --check`, `ruff check`, `mypy app` toza; `Settings()` lokal `.env` bilan `ai_configured=False` (kalit yo'q).

### `149d4a9` — 3A (AI backend) implementatsiya rejasi
- Yangi `docs/superpowers/plans/2026-10-13-phase-3a-backend.md`: 16 task (0–15), har birida aniq fayllar va kod:
  - bog'liqliklar va sozlamalar;
  - `Vector` tipi, modellar va migratsiya;
  - Gemini/Fake provayderlar;
  - vektor ombori va bo'laklash;
  - xizmatlarni ulash;
  - indekslash hook'lari;
  - kunlik limit;
  - SSE repetitor;
  - qoralamalar;
  - vazifani AI bilan tekshirish;
  - haftalik tahlil CLI;
  - admin API;
  - frontend sxemasi;
  - haqiqiy kalit bilan qo'lda tekshiruv;
  - hujjatlar.
- Kodni o'qish paytida spec'dan 5 ta aniqlik qilindi. Ular rejaning boshida yozilgan va Task 15 da spec'ga ham kiritiladi:
  - `EMBEDDING_DIM` konstanta;
  - `question` o'rniga `activity`/`task` manba turlari;
  - glossariy `source_id=topic_id`;
  - SSE `meta` oxirida;
  - `canned` rejimi.
- Ish tartibi: bir vaqtda bitta task, har biridan keyin tasdiq, faqat `main`. Testlar loyiha oxirida, ro'yxati reja oxirida.

### `497967f` — 3-bosqich (AI) mini-spec'i
- Yangi `docs/superpowers/specs/2026-10-13-phase-3-ai-design.md`. Foydalanuvchi qarorlari:
  - lokalda `VectorStore` (SQLite BLOB + numpy), CI/prod'da pgvector;
  - haftalik tahlil CLI `weekly-report` orqali;
  - provayder Gemini (`google-genai`; sukut modellar `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-embedding-001` / 768);
  - 3A backend, 3B frontend.
- Spec mazmuni:
  - `app/ai/` arxitekturasi va ma'lumotlar modeli;
  - indekslash (`question` bo'laklari maslahat rejimi uchun, javobsiz);
  - repetitor oqimi (SSE, rad javobi, maslahat rejimi);
  - qoralama yaratish va tasdiqlash (mavjud `create_activity` / `upsert_task` / `add_glossary_term` qayta ishlatiladi);
  - vazifani AI bilan tekshirish, haftalik tahlil, admin;
  - API, xato kodlari, maxfiylik va tayyor bo'lish mezoni.
- Roadmap'ning 3-bosqich bo'limi va keyingi qadamlari yangilandi.

### `1f23fcc` — 2-bosqich `main`ga merge qilindi; endi faqat `main`da ishlanadi
- Foydalanuvchi qarori: barcha ish `main`ga push qilinadi, `main`dan boshqa branch'lar o'chiriladi, keyingi ish faqat `main`da olib boriladi (feature branch va PR'siz).
- `feat/phase-2-assessment` (2A + 2B, 67 commit) lokal `main`ga `--no-ff` bilan merge qilindi (`1f23fcc`), konflikt bo'lmadi. Oldin lokal `main` `origin/main`ga (PR #3 merge, `878e50d`) yetkazildi.
- Push tartibi:
  - avval `feat/phase-2-assessment` push qilindi, shunda PR #4 ning oxirgi commiti yangilandi;
  - so'ng `main` push qilindi;
  - keyin remote `feat/phase-2-assessment` va lokal `feat/phase-1b-frontend`, `feat/phase-2-assessment` o'chirildi.
  
  `feat/phase-1b-frontend` dagi barcha commitlar avvaldan `main`da edi.
- Roadmap: ish tartibidagi "alohida branch, PR orqali merge" qoidasi "faqat `main`" ga almashtirildi, keyingi qadamlar yangilandi. `CLAUDE.md`: 2-bosqich `main`da.
- Push'dan keyingi CI (`d671806`, run 38388329700): `backend`, `frontend` va `e2e` joblari yashil. 2B uchun yangi Vitest/E2E testlari hali yozilmagan; mavjud testlar o'tdi.

### `db8b1c5` — Krossvord: "begona" so'z to'g'ri ko'rsatiladi
- Muammo: `build_layout` eng uzun so'zni to'rga birinchi qo'yadi. Boshqalar bilan umumiy harfi yo'q so'z eng uzun bo'lsa (masalan, `OLMA`, `ANOR`, `BUXGU`), `CROSSWORD_UNPLACEABLE` xatosi to'g'ri so'zlarga (`OLMA`, `ANOR`) tushardi.
- `backend/app/assessment/crossword.py`: yangi sof funksiya `_detached`:
  - so'zlarni umumiy kataklar bo'yicha guruhlaydi (`Oʻ`/`Gʻ` bitta katak);
  - guruh bittadan ko'p bo'lsa, asosiy guruhni tanlaydi: eng ko'p so'z, so'ng eng ko'p katak, so'ng eng kichik indeks;
  - qolgan so'zlar darhol `UnplaceableError` bilan qaytariladi.
  
  Endi misol `BUXGU` ni qaytaradi.
- So'zlar bitta guruhda bo'lsa, algoritm avvalgidek ishlaydi. Yetti misolda o'zgarishdan oldingi va keyingi natijalar taqqoslandi: faqat yuqoridagi misol o'zgardi, barcha muvaffaqiyatli layout'lar va mavjud `ABC, DEF, ABX → [1]` holati bir xil qoldi. API, xato kodi va frontend o'zgarmadi.
- Spec, 6-bo'lim: "Joylashtirish"ga 0-qadam yozildi.
- Tekshiruv: `ruff format --check`, `ruff check`, `mypy app` toza. Testlar lokal ishga tushirilmadi.
- Loyiha oxirida `tests/test_crossword.py` ga qo'shiladigan holatlar:
  - begona so'z eng uzun bo'lsa, faqat u qaytariladi;
  - teng guruhlarda tanlov deterministik (`AB, BA, XY, YX → [2, 3]`);
  - `Oʻ` umumiy katak hisoblanadi.

### `1d3eb85` — Qo'lda tekshiruvdan keyingi a11y tuzatishlari
- 2-bosqichning "Tayyor" mezoni lokal toza bazada (port 8001) brauzerda qo'lda tekshirildi. Talaba test yechib XP oldi, o'qituvchi vazifani baholadi, talaba ballni ko'rdi; uchalasi ishladi. Repoga o'zgarish kiritilmagan, faqat quyidagi ikki kichik kamchilik tuzatildi.
- `ProgressRing`: ixtiyoriy `decorative` prop qo'shildi (`Spinner` dagi kabi). U halqani ekran o'quvchidan yashiradi. `AttemptResult` uni ishlatadi: ball yonidagi matnda yozilgan, halqaning "Bajarildi: 1 / 2" yozuvi esa ball uchun noto'g'ri edi.
- `TaskStep`: vazifa nomi `<h2>` dan `<h3>` ga o'tkazildi. Bosqich sarlavhasi `<h2>`, faoliyat sarlavhasi ham `<h3>`.
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.
- Qayd: krossvordda joylashmagan so'zlar uzun so'z atrofida qurilgan to'rga nisbatan aniqlanadi. Shuning uchun "begona" so'z uzunroq bo'lsa, qizil bilan to'g'ri so'zlar belgilanadi. Bu backend algoritmining xatti-harakati, ma'lumot buzilmaydi. `db8b1c5` da hal qilindi.

### `73a20c9` — 2B Task 12: yakuniy tekshiruv va hujjatlar
- Yakuniy tekshiruv: `npm run lint`, `typecheck` va `build` o'tdi. `npm run gen:api` `schema.gen.ts` da farq bermadi.
- Spec 8-bo'limiga amalga oshirishdagi farqlar yozildi:
  - `/app` soddalashtirildi: fanlar `/app` da qoldi, XP/seriya/nishonlar bloki shu sahifada;
  - menyu tarkibi;
  - krossvord preview "To'r ko'rinishi" tugmasi orqali ochiladi;
  - "Natijalarim" har faoliyatning eng yaxshi natijasini ko'rsatadi.
- `CLAUDE.md`: loyiha holati (2B qurilgan, testlari qoldirilgan) va frontend arxitekturasiga "Assessment" bandi qo'shildi.
- Roadmap: 2B bajarildi. Keyingi qadamlar: push va PR #4 tavsifini yangilash, "Tayyor" mezonini qo'lda tekshirish, qoldirilgan testlar, merge.
- Push qilinmadi va PR #4 yangilanmadi: bu foydalanuvchi qaroriga qoldirildi.

### `980f10d` — 2B Task 11: o'qituvchi statistikasi
- Yangi `features/teach/StatsPage.tsx` (`/teach/stats`):
  - fan tanlanadi (sukut bo'yicha birinchisi), tanlov manzilda saqlanadi (`?subject=`);
  - jadval ustunlari: mavzu, boshlagan, tugatgan, o'rtacha natija ("—" yoki "78%"), tekshirilmagan javoblar;
  - telefonda jadval faqat o'z konteynerida suriladi, sahifada gorizontal scroll paydo bo'lmaydi;
  - o'qituvchiga fan biriktirilmagan bo'lsa, bo'sh holat ko'rsatiladi.
- Menyu: o'qituvchi va admin uchun "Statistika" havolasi.
- i18n: `nav.stats`, yangi `stats.*` bo'limi (uz/ru).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `10d6c7c` — 2B Task 10: o'qituvchi uchun tekshirish navbati
- Yangi `features/teach/ReviewQueuePage.tsx` (`/teach/review`):
  - "Tekshirilmagan", "Qaytarilgan" va "Baholangan" tablari; tanlangan tab manzilda saqlanadi (`?status=`);
  - har javob kartasida: talaba, vazifa, fan · mavzu, sana va "Kechikkan" belgisi; karta tafsilotlar sahifasiga olib boradi.
- Yangi `ReviewDetailPage.tsx` (`/teach/review/:submissionId`):
  - topshiriq matni va mezoni, talaba javobi va faylini yuklab olish;
  - tekshirilmagan javob uchun forma: ball (0–maks) va izoh, "Baholash" va "Qayta ishlashga qaytarish" tugmalari (qaytarishda izoh majburiy);
  - boshqa holatda natija (ball, izoh) ko'rsatiladi. Muvaffaqiyatdan keyin toast chiqadi va navbatga qaytiladi;
  - ID noto'g'ri bo'lsa, "Sahifa topilmadi" chiqadi.
- `TeachHomePage`: tekshirilmagan javoblar bo'lsa, "Tekshirilishi kerak: N ta javob" kartasi navbatga olib boradi.
- Menyu (`paths.ts`):
  - o'qituvchi va admin uchun "Tekshirish" havolasi; "Mavzu muharriri" endi faqat `/teach` da faol ko'rinadi, aks holda u navbat sahifasida ham ajralib turardi;
  - talaba uchun "Natijalarim" havolasi (Task 7 da qo'shilmay qolgan edi);
  - "Statistika" havolasi Task 11 da, sahifa bilan birga qo'shiladi.
- `lib/download.ts`: `useProtectedDownload` hook'i (yuklanish holati va xato toast'i). `TaskStep` ham shu hook'ka o'tkazildi.
- `test/server.ts`: `/api/teach/summary` uchun standart nol javob (dashboard mock'i kabi).
- i18n: `nav.results`, `nav.review`, yangi `review.*` bo'limi (uz/ru).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `66f73b0` — 2B Task 9: o'qituvchi uchun vazifa formasi
- Yangi `features/teach/assessment/TaskTab.tsx` (mavzu muharririning `task` tabi):
  - bitta forma ham yaratadi, ham tahrirlaydi: nom, topshiriq matni, javob turi (matn / fayl / ikkalasi), maksimal ball (1–100), muddat (ixtiyoriy) va baholash mezoni;
  - saqlanganda toast chiqadi. Xatolar (masalan, `MAX_SCORE_BELOW_GRADED`) forma ostida ko'rsatiladi;
  - "Vazifani o'chirish" tasdiqlash oynasi bilan ishlaydi; oynada talabalar javoblari ham o'chirilishi ogohlantiriladi.
- `schemas.ts` ga `taskSchema` qo'shildi.
- Yangi `lib/datetime.ts`: `toLocalInput` / `fromLocalInput`. `datetime-local` maydoni mahalliy vaqtda ko'rsatiladi, backend'ga esa ISO UTC yuboriladi.
- `TopicEditorPage.test.tsx`: Task 8 dan beri yiqilayotgan "tez kunda" testi amaliyot tabidagi faoliyatlar ro'yxatini tekshiradigan qilib moslandi. Endi barcha 7 tab ishlaydi.
- i18n: yangi `taskEdit.*` bo'limi (uz/ru).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `0d3bc4f` — 2B Task 8: o'qituvchi uchun faoliyat muharrirlari
- Yangi `features/teach/assessment/schemas.ts`: test, ha/yo'q va krossvord uchun zod sxemalari. Cheklovlar backend `assessment/schemas.py` bilan bir xil.
- Yangi `ActivitiesTab.tsx` (mavzu muharririning `review`/`practice` tablari, oldingi "Tez orada" o'rniga):
  - har faoliyat: tur, nom, elementlar soni, "Nashr qilingan"/"Qoralama", "Nashr qilish"/"Yashirish", ↑/↓ tartib, tahrirlash va o'chirish (tasdiqlash oynasi bilan);
  - krossvordda saqlangan to'rni harflari bilan ko'rsatuvchi "To'r ko'rinishi" tugmasi bor;
  - pastda "+ Test", "+ Ha/yo'q", "+ Krossvord" tugmalari.
- Yangi `ActivityEditor.tsx` (`react-hook-form` + `useFieldArray`), yaratish va tahrirlashda inline ochiladi:
  - test: savol, 4 variant va to'g'ri variant (radio), izoh;
  - ha/yo'q: bayonot, to'g'ri javob, izoh;
  - krossvord: so'z va ta'rif;
  - elementlarni qo'shish, o'chirish va ↑/↓ ko'chirish; bo'sh izoh `null` bo'lib yuboriladi;
  - backend xatosi forma ostida chiqadi. `CROSSWORD_UNPLACEABLE` / `CROSSWORD_INVALID_WORD` dagi so'zlar mos maydonda ham belgilanadi.
- `TopicEditorPage`: faoliyat tablarida son belgisi ko'rsatilmaydi.
- i18n: yangi `activityEditor.*` bo'limi (uz/ru).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `9e46bbf` — 2B Task 7: "Natijalarim" va urinish tahlili
- Yangi `features/student/ResultsPage.tsx` (`/app/results`): fan → mavzu bo'yicha guruhlangan natijalar.
  - Faoliyatlar: nom, tur, urinishlar soni, oxirgi sana, eng yaxshi foiz va "Tahlil" havolasi (oxirgi urinishga).
  - Vazifalar: holat ("Tekshirilmoqda" / "Qaytarildi" / "Baholandi: ball / maks"), "Kechikkan" belgisi va o'qituvchi izohi.
  - Rejadagi jadval o'rniga kartali ro'yxat ishlatildi, shunda 375px kenglikda gorizontal scroll bo'lmaydi.
  - Natija bo'lmasa, bo'sh holat ko'rsatiladi.
- Yangi `features/student/AttemptDetailPage.tsx` (`/app/results/attempts/:attemptId`): faoliyat nomi, turi va sanasi, so'ng `AttemptResult` (qayta urinish tugmasisiz). ID noto'g'ri bo'lsa, abadiy spinner o'rniga "Sahifa topilmadi" chiqadi.
- `router.tsx`: ikkita yangi marshrut. Menyudagi "Natijalarim" havolasi bu task'da qo'shilmay qolgan edi; u `10d6c7c` (Task 10) da qo'shildi.
- i18n: yangi `results.*` bo'limi (uz/ru).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `f31dd94` — 2B Task 6: vazifa bosqichi (talaba)
- Yangi `lib/download.ts`: `downloadProtected(url, filename)` himoyalangan faylni Bearer token bilan yuklab, brauzerda saqlaydi.
- Yangi `features/student/assessment/TaskStep.tsx`:
  - topshiriq kartasi: sarlavha, tavsif, maksimal ball, muddat (o'tgan bo'lsa "Muddat o'tgan"), baholash mezoni;
  - javob holati: "Tekshirilmoqda", "Qaytarildi" yoki "Baholandi: ball / maks", "Kechikkan" belgisi, o'qituvchi izohi va yuborilgan faylni yuklab olish;
  - forma (baholanmaguncha ko'rinadi): vazifa turiga qarab matn va/yoki fayl (20 MB gacha), "Yuborish" / "Qayta yuborish"; xato forma ichida, muvaffaqiyatda toast. Qayta yuborishda yangi fayl tanlanmasa, eski fayl saqlanib qoladi (backend xatti-harakati).
- `StepContent.tsx`: `task` bosqichida `TaskStep` va "Keyingi bosqich" havolasi.
- i18n: yangi `task.*` bo'limi (uz/ru).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

## 2026-10-12 — Texnik audit va 2A'ni CI'da tekshirish

### `9480c38` — 2B Task 5: krossvord pleyeri
- Yangi `features/student/assessment/crossword.ts` — sof yordamchilar: `cellKey`, `wordCells`, `cellOwners`, `answersFromCells`, `normalizeCellInput` (Oʻ / Gʻ bitta katak, apostrof turlari birlashtiriladi), `mayTakeApostrophe`.
- Yangi `CrosswordPlayer.tsx`:
  - katakli to'r: ustunlar `minmax(0, 2.5rem)`, shuning uchun 375px kenglikda gorizontal scroll yo'q; so'z boshida raqam, faol so'z ajratib ko'rsatiladi;
  - harf yozilgach fokus keyingi katakka o'tadi. "O"/"G" dan keyin apostrof kutiladi, boshqa harf yozilsa u keyingi katakka o'tadi. Bo'sh katakda Backspace oldingisiga qaytadi;
  - kesishgan katakni qayta bosish yo'nalishni almashtiradi;
  - "Gorizontal" va "Vertikal" savollar ro'yxati, bosilsa o'sha so'z faollashadi;
  - har katakda `aria-label` (so'z raqami, yo'nalish, harf o'rni).
- `ActivityList`: krossvord uchun "Tez orada" o'rniga pleyer ulandi.
- i18n: yangi `crossword.*` bo'limi (uz/ru).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `1768bc9` — 2B Task 4: pleyerda test va ha/yo'q faoliyatlari, natija ekrani
- Yangi `features/student/assessment/`:
  - `ActivityList`: faoliyat kartalari (tur, urinishlar soni, eng yaxshi foiz, "Boshlash" / "Qayta urinish"), yechish va natija o'rtasida o'tish;
  - `ChoicePlayer`: test savollari bitta-bitta (radio variantlar, oldingi/keyingi), ha/yo'q bayonotlari ro'yxati (`aria-pressed` tugmalar); javobsiz savol bo'lsa tasdiqlash oynasi chiqadi;
  - `AttemptResult`: ball va foiz (`ProgressRing`), har element bo'yicha ✓/✗, talaba javobi, to'g'ri javob va izoh; Task 7 da ham ishlatiladi.
- `StepContent.tsx`: `review`/`practice` bosqichlarida faoliyatlar ro'yxati va "Keyingi bosqich" havolasi. `lib/steps.ts` ga `ACTIVITY_KINDS` qo'shildi.
- Krossvord tanlansa, hozircha "Tez orada" holati ko'rinadi (pleyer Task 5 da).
- i18n: yangi `activity.*` bo'limi (uz/ru).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `6d12350` — 2B Task 3: bosh sahifada XP, seriya va nishonlar
- Yangi `features/student/DashboardStats.tsx` (`useDashboard`):
  - uchta karta: seriya ("bugun o'qidingizmi" izohi bilan), XP (eng uzun seriya izohi bilan), olingan nishonlar soni;
  - 10 ta nishon to'ri: olinmagani xira va kulrang, nomi va ta'rifi tilga qarab;
  - ma'lumot yuklanmasa blok ko'rinmaydi, fanlar ro'yxatiga ta'sir qilmaydi.
- `SubjectsPage.tsx`: blok salomlashuvdan keyin, faqat talaba rolida ko'rsatiladi.
- i18n: yangi `dashboard.*` bo'limi (uz/ru).
- `test/server.ts`: `/api/me/dashboard` uchun standart bo'sh mock (kelishilgan minimal mock yangilash, yangi test yo'q).
- Rejadan farq: menyudagi "Natijalarim" havolasi Task 7 ga ko'chirildi. Sahifa o'sha task'da yaratiladi, hozir qo'shilsa havola 404 ga olib borardi.
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `e2e3f98` — 2B Task 2: "Tugatdim" mukofotlari va toast animatsiyasi
- `api/student.ts`:
  - `useCompleteStep` javobi `StepCompleteResult` (rewards bilan) deb tiplandi;
  - muvaffaqiyatda `announceRewards()` "+N XP" va yangi nishon toast'larini chiqaradi;
  - `['me']` prefiksi invalidatsiya qilinadi (davom ettirish, bosh sahifa, natijalar). `assessmentKeys` import qilinmadi, chunki import tsikl hosil qilardi.
- `components/ui/Toast.tsx` va `index.css`: toast'lar `toast-pop` animatsiyasi bilan chiqadi, faqat `motion-safe`, ya'ni harakatni kamaytirish sozlamasida animatsiyasiz.
- Mavjud testlar: `PlayerPage.test.tsx` va `api/student.test.tsx` dagi 5 ta "Tugatdim" mock'iga `rewards` maydoni qo'shildi (kelishilgan minimal mock yangilash, yangi test yo'q).
- Tekshiruv: lint, typecheck va build. Testlar lokal ishga tushirilmadi.

### `0c80037` — 2B Task 1: API tiplari, hook'lar va xato matnlari
- `frontend/src/api/types.ts`: 2A'ning barcha javob va so'rov tiplari qo'shildi (mukofotlar, urinish, vazifa javobi, bosh sahifa, natijalar, o'qituvchi faoliyatlari, vazifa, navbat, statistika). `types.contract.ts` da 23 ta javob va 8 ta so'rov tekshiruvi qo'shildi.
- Yangi `api/assessment.ts` (talaba): `useSubmitAttempt`, `useSubmitTask`, `useDashboard`, `useResults`, `useAttemptDetail`.
- Yangi `api/teachAssessment.ts` (o'qituvchi): faoliyatlar CRUD, nashr qilish va tartiblash; vazifa; navbat, baholash va qaytarish; summary va statistika. `api/teach.ts` dagi `invalidateStudentCaches` eksport qilindi.
- Yangi `lib/rewards.ts` (`announceRewards`) va `rewards.*` i18n kalitlari. Ular rejada Task 2 da edi, `assessment.ts` build'dan o'tishi uchun shu task'ga ko'chirildi.
- `errors` i18n'ga 2A'ning 16 ta xato kodi qo'shildi (uz/ru).
- Backend: `RewardsOut` va `ResultItem` dagi sukut qiymatlari olib tashlandi. Ular doim to'liq qaytariladi, lekin sukut qiymat tufayli OpenAPI'da ixtiyoriy chiqib, ichma-ich kontrakt tekshiruvini buzayotgan edi. `schema.gen.ts` qayta generatsiya qilindi.
- Tekshiruv: lint, typecheck, build, ruff va mypy. Testlar foydalanuvchi qaroriga ko'ra lokal ishga tushirilmadi.

### `f123da4` — 2B (frontend) implementatsiya rejasi
- Yangi `docs/superpowers/plans/2026-10-12-phase-2b-frontend.md`: 13 ta task (0–12):
  - API tiplari va hook'lar;
  - mukofot toast'lari;
  - bosh sahifada XP, seriya va nishonlar;
  - test va ha/yo'q pleyeri, krossvord pleyeri;
  - vazifa bosqichi;
  - natijalarim;
  - o'qituvchi muharrirlari va vazifa formasi;
  - tekshirish navbati va statistika;
  - hujjatlar.
- Foydalanuvchi qarorlari:
  - testlar yozilmaydi va lokal ishga tushirilmaydi, faqat lint, typecheck va build;
  - CI'da buzilgan mavjud testlarning mock'lari minimal yangilanadi;
  - E2E baholash oqimi loyiha oxiriga qoldi.
- Spec 8-bo'limidan soddalashtirish: `/app` alohida bosh sahifaga ko'chirilmaydi, mavjud sahifa XP, seriya va nishonlar bilan to'ldiriladi.

### `1c6f5bd` — Audit 8-band: kichik tuzatishlar (7-band esa keyinga qoldirildi)
- **Foydalanuvchi qarorlari:**
  - yangi testlar (audit 7-band) loyiha yakunlangandan keyin yoziladi;
  - hozircha testlar umuman ishga tushirilmaydi, faqat statik tekshiruvlar (ruff, mypy, `tsc`) qoladi;
  - XP, seriya va nishonlar faqat talabalarga beriladi.
- XP faqat talabalarga:
  - yangi `learning.progress.reward(db, user, ...)` talaba bo'lmasa bo'sh mukofot qaytaradi;
  - "Tugatdim", urinish, vazifa yuborish, mavzu mukofoti va baholash shu orqali o'tadi (baholashda javob muallifining roli olinadi);
  - `mark_step_completed` va `topic_completion_rewards` endi `user` qabul qiladi;
  - `gamification` boshqa modullarni import qilmaydi.
- `GradeIn.score`: sun'iy ±1 000 000 chegarasi olib tashlandi, oraliq servisda tekshiriladi (`SCORE_OUT_OF_RANGE`).
- `GET /api/teach/submissions` ga `limit` (1–200, sukut 50) va `offset` qo'shildi. Javob shakli o'zgarmadi.
- `PUT /api/teach/steps/{id}/task`: maksimal ballni baholangan javoblardagi eng katta baldan pastga tushirib bo'lmaydi — yangi 409 `MAX_SCORE_BELOW_GRADED` (`details.max_graded_score`).
- Mini-spec yangilandi: xato kodlari jadvali, 5-bo'lim (kimga XP beriladi, seriya qarori) va 7-bo'lim (navbat parametrlari, vazifa cheklovi).
- `frontend/src/api/schema.gen.ts` qayta generatsiya qilindi.
- Tekshiruv: ruff, mypy va `tsc` toza. Testlar foydalanuvchi qaroriga ko'ra lokal ishga tushirilmadi. Ular push'dan keyin CI'da avtomatik ishlaydi.

### `5c0c393` — Audit 6-band: takrorlangan bloklar umumiy funksiyalarga ajratildi (xatti-harakat o'zgarmadi)
- `Storage.delete_quietly(paths)` diskdan o'chirish va xatoni logga yozishni bir joyga to'pladi. Avval bu sikl 5 joyda takrorlangan edi: `learning/teach_router.py`, `admin_router.py`, `materials.py`, `assessment/teach_router.py`, `tasks.py`.
- `progress.mark_step_completed(db, row, topic_id, now)` bosqichni tugatish va mavzu mukofotini bir joyga to'pladi. Avval 3 joyda edi: `complete_step`, `attempts.refresh_activity_step`, `tasks.submit`.
- `progress.visible_topic_or(db, user, topic_id, error)` — "mavzu ko'rinmasa ichki obyekt uchun 404" bloki. Avval `attempts.py` va `tasks.py` da takrorlangan edi.
- `attempts.refresh_activity_step` endi o'z so'rovi o'rniga `views.attempt_stats()` ni ishlatadi. `reports.py` dagi ikkita foiz so'rovi boshqa shakldagi natija qaytaradi (oxirgi urinish, talabalar bo'yicha guruhlash), shuning uchun ataylab qoldirildi.
- 4 ta modulda keraksiz bo'lib qolgan `logger` olib tashlandi.
- Test: `test_delete_quietly_skips_missing_and_logs_os_errors`. Jami 219 test yashil.

### `818d7e2` — Audit 5-band: `award()` faqat takroriy hodisani yutadi
- `gamification/service.py`:
  - `IntegrityError` dan keyin hodisa bazada haqiqatan bormi, tekshiriladi (`_event_exists`). Bor bo'lsa, bu takror va 0 XP qaytadi. Yo'q bo'lsa, masalan mavjud bo'lmagan foydalanuvchi (FK xatosi), xato ko'tariladi.
  - Nishon berishda ham shunday (`_badge_owned`).
  - SQLite unique xatosida constraint nomini bermaydi, shuning uchun xato matni o'rniga bazaning o'zi tekshiriladi: usul ikkala bazada bir xil ishlaydi.
- Test: `test_award_does_not_hide_other_integrity_errors`. Avval xato jimgina yutilardi. Jami 218 test yashil.
- CHANGELOG yozuvi hook tufayli kod commit'iga tushmay qoldi va alohida commit qilindi.

### `84e219b` — Audit 3-band: `sync_badges` parallel ishga tushishga chidamli
- `gamification/service.py`:
  - `sync_badges()` yangi nishonni savepoint ichida qo'shadi. Boshqa server jarayoni uni shu orada qo'shgan bo'lsa (`badges.code` unique to'qnashuvi), nishon qayta o'qiladi va yangilanadi, jarayon qulamaydi.
  - `_existing_badges()` va `_apply_rule()` ajratildi.
- Migratsiya qilinmagan bazada ilova avvalgidek ochiq xato bilan to'xtaydi. Bu ataylab qoldirildi.
- Test: `test_sync_badges_survives_concurrent_insert`. Jami 217 test yashil.

### `870c7bb` — Audit 2-band: parallel yaratishda 500 o'rniga davom etish
- `assessment/tasks.py`:
  - `submit()` birinchi javobni savepoint ichida yaratadi. Agar parallel so'rov (masalan, tugma ikki marta bosilgan) uni allaqachon yaratgan bo'lsa, mavjud javob qayta o'qiladi va so'rov tahrir sifatida davom etadi; baholangan bo'lsa `SUBMISSION_GRADED` (409) qaytadi.
  - `upsert_task()` ham shu uslubda ishlaydi.
  - Avval ikkala holat ham 500 qaytarardi (testda takrorlandi).
- Yangi xato kodi kerak bo'lmadi. `_find_submission()` va `_ensure_editable()` ajratildi.
- Testlar: `tests/test_tasks.py` ga 3 ta yangi test (parallel birinchi yuborish, baholangan javobga parallel yuborish, parallel vazifa yaratish). Jami 216 test yashil.
- **Audit 4-band, foydalanuvchi qarori:** o'qituvchi baho qo'yganda talabaning seriyasi oshaveradi. Bu hozirgi xatti-harakat va spec 5-bo'limidagi "XP hodisasi bo'lgan kun faol" qoidasiga mos, kod o'zgarmadi.

### Texnik audit (faqat o'qish)
- Kod o'zgartirilmadi.
- Kritik xavflar:
  - 2A Postgres'da tekshirilmagan edi (quyida yopildi);
  - `sync_badges` bir nechta worker ishga tushganda to'qnashishi mumkin;
  - vazifaga ikki marta yuborish 500 qaytaradi;
  - o'qituvchi baho qo'yganda talaba seriyasi oshadi.
- Zaif joylar: takrorlangan bloklar (bosqichni tugatish, fayl o'chirish, eng yaxshi foiz so'rovi), `award()` barcha `IntegrityError` larni yutadi, navbatda sahifalash yo'q, testi yo'q chegara holatlari.
- 9 bandlik tuzatish rejasi tuzildi. 1-band (push va CI) bajarildi.

### GitHub: PR #3 (avval qayd etilmagan) va draft PR #4
- **PR #3** (`878e50d`, 2026-10-11, foydalanuvchi tomonidan) `feat/phase-2-assessment` dan `main` ga faqat 5 ta hujjat commit'ini qo'shgan: `263c327`, `125b8f5`, `7f3c56a`, `b5c3925`, `b467a71`. Bu yozuv kechikib qayd etildi.
- 2A'ning 26 ta commit'i push qilindi (`b467a71..98f91f0`). CI faqat `main` push'ida va PR'da ishlagani uchun **draft PR #4** ochildi: https://github.com/muk1mov13/texnologiya-platform/pull/4 ("Phase 2A: assessment and gamification backend"). Merge qilinmagan.
- CI run `38243313479` — uchala job yashil:
  - `backend`: ruff, mypy, SQLite'da 213 test; PostgreSQL'da migratsiyalar, `alembic check` (drift yo'q) va 213 test;
  - `frontend`;
  - `e2e`.

## 2026-10-11 — 2-bosqich mini-spec'i va 2A rejasi

### `7e615ae` — 2A Task 11: API tiplari, hujjatlar va yakuniy tekshiruv (2A yopildi)
- `frontend/src/api/schema.gen.ts` `npm run gen:api` bilan qayta generatsiya qilindi.
- `types.ts` ga talaba ko'rinishi tiplari qo'shildi: `ActivityView`, `TaskView`, `SubmissionView`, `StudentLayout` va boshqalar. `StepContent` ga `activities`, `task`, `submission` qo'shildi, ular `types.contract.ts` da tekshiriladi. `test/fixtures.ts` yangilandi. UI o'zgarmadi.
- `CLAUDE.md`: 2-bosqich holati, `app/assessment/` va `app/gamification/` arxitekturasi (import yo'nalishi, `award()` idempotentligi, `sync_badges`) va bosqichni tugatish qoidalari yozildi.
- `docs/superpowers/roadmap.md`: "Hozirgi holat"da 2A bajarildi, "Keyingi aniq qadam" — 2B frontend rejasi.
- Yakuniy tekshiruv:
  - backend: ruff, mypy, 213 pytest;
  - frontend: lint, typecheck, 178 Vitest, build;
  - E2E: Playwright 1/1, yangi migratsiyalar bilan toza bazada.

### `d2a6c06` — 2A Task 10: bosh sahifa, natijalarim va o'qituvchi statistikasi
- `GET /api/me/dashboard`: `xp_total`, `streak` (`current`, `longest`, `active_today`), 10 ta nishon (`awarded_at` yoki `null`) va `continue_step`. Seriya kechadan eski bo'lsa `current` 0 ko'rsatiladi. Yangi `gamification.service.profile()` va `DashboardOut`.
- `GET /api/me/results`: fan va mavzu bo'yicha har faoliyatning eng yaxshi foizi, urinishlar soni va oxirgi urinishi, hamda vazifa javoblari (holat, ball, izoh, `is_late`).
- `GET /api/me/attempts/{id}`: urinish tahlili, faqat egasiga (`ATTEMPT_NOT_FOUND`).
- `GET /api/teach/stats?subject_id=`: mavzular bo'yicha boshlagan va tugatgan talabalar soni, o'rtacha eng yaxshi foiz va tekshirilmagan javoblar. Faqat talabalar hisobga olinadi. Biriktirilmagan o'qituvchi `NOT_SUBJECT_TEACHER` oladi.
- Yangi `assessment/reports.py`.
- Testlar: `tests/test_reports.py` (5 ta). Jami 213 test yashil.

### `6ad0405` — 2A Task 9: tekshirish navbati, baholash va qaytarish
- Yangi endpoint'lar (`/api/teach`, o'qituvchi faqat biriktirilgan fanlar bo'yicha, admin hammasi bo'yicha):
  - `GET /submissions?status=&subject_id=` — navbat, sukut bo'yicha `submitted`, eng eskisi birinchi, ko'pi bilan 200 ta;
  - `GET /submissions/{id}` va `/file`;
  - `POST /submissions/{id}/grade` — `graded`. Ball 0..max oralig'idan tashqarida bo'lsa `SCORE_OUT_OF_RANGE`. Talabaga `task_graded` XP beriladi (30 × ball/max);
  - `POST /submissions/{id}/return` — `returned`, izoh majburiy;
  - `GET /summary` — `pending_submissions`.
- Baholash va qaytarish faqat `submitted` holatidan mumkin, aks holda `SUBMISSION_NOT_SUBMITTED` (409). Biriktirilmagan o'qituvchi javobni so'rasa 404 oladi.
- SQLAlchemy 2.1 da `Row.tuple()` eskirgan, shuning uchun qatorlar to'g'ridan-to'g'ri ochiladi. `Select`/`Row` annotatsiyalari yangi generik ko'rinishda (`Select[A, B, ...]`) yozildi.
- Yangi fayllar: `assessment/review.py`, `assessment/review_router.py`.
- Testlar: `tests/test_review.py` (4 ta). Jami 208 test yashil.

### `55d7667` — 2A Task 8: vazifalar va javob yuborish
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
