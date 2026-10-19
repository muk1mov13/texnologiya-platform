# O'zgarishlar jurnali

Loyihadagi barcha o'zgarishlar shu yerda sana bo'yicha qayd etiladi: kod, hujjatlar, infratuzilma, shuningdek GitHub'dagi amallar (repo, PR, merge). Eng yangi yozuvlar yuqorida. Har bir yozuv yonida commit hash'i yoki tegishli havola bor.

---

## 2026-10-19 — Ochiq AI yordamchi: model va sozlamalar

- `ai/models.py`: `SupportMessage` (`support_messages`: `session_key`, savol, javob, `mode`, manbalar; IP/ism/email saqlanmaydi), `SupportMode`; `AiSettings` ga `public_enabled` va `public_daily_limit` (standart 300). Migratsiya `9602e09deacc`.
- `config.py`: `support_rate_limit=20`, `support_rate_window_seconds=3600` (bitta IP uchun); `constants.py`: `SUPPORT_MESSAGE_CHARS`, `SUPPORT_HISTORY_PAIRS`, `SUPPORT_RETENTION_DAYS`.

## 2026-10-19 — `main` GitHub'ga push qilindi

- `git push origin main`: `63ada65..6c4af05` — LibreOffice paketlari (README), konvertatsiya xatosi logi, D5 holati (3 ta commit); serverda `git pull` bilan olinadi.

## 2026-10-19 — D5 smoke test (ichki IP)

- `deploy-roadmap.md`: D5 🟡 — `http://172.20.172.121` da smoke test o'tdi (ochiq sahifalar, login + F5, PDF, PPTX → PDF, tutor SSE, admin AI, sitemap/robots); sinov materiali o'chirildi. Qolgan: zaxira cron'i va tiklab ko'rish, domen bilan takroriy test.

## 2026-10-19 — Konvertatsiya xatosi logga yoziladi

- `learning/convert.py`: soffice nolmas kod bilan tugasa yoki PDF chiqarmasa, `rc` va stderr oxiri (500 belgi) `logger.warning` bilan yoziladi — sabab `journalctl -u texnologiya-api` da ko'rinadi (D5'da Signal 6 sababini faqat qo'lda ishga tushirib topish mumkin bo'ldi).

## 2026-10-19 — Deploy: LibreOffice `-nogui` paketlarisiz

- `deploy/README.md` D2: `libreoffice-writer-nogui`/`-impress-nogui` o'rniga oddiy `libreoffice-writer`/`-impress` (headless'da ishlaydi). Serverda `-nogui` paketlar `libreoffice-core` bilan aralashib, soffice PPTX'ni ochishda Signal 6 bilan yiqilardi (D5 smoke testda material `CONVERSION_FAILED`); almashtirish buyrug'i qo'shildi. Serverda shu yo'l bilan tuzatildi.

## 2026-10-19 — `main` GitHub'ga push qilindi

- `git push origin main`: `e12c500..d1ca400` — muharrirda materialni ko'rish/yuklab olish, asl fayl endpoint'i, o'quv dasturini yuklab olish (4 ta commit); serverda `git pull` bilan olinadi.

## 2026-10-19 — CLAUDE.md: muharrirda fayllarni ko'rish

- `CLAUDE.md` frontend bo'limiga MaterialsTab'dagi ko'rish/yuklab olish va `/api/teach/materials/{id}/original` haqida qisqa yozuv.

## 2026-10-19 — Admin: fan o'quv dasturini yuklab olish

- Admin → Fanlar: dastur bor bo'lsa «Yuklab olish» tugmasi (`useProtectedDownload` → mavjud `/api/subjects/{slug}/syllabus`, u nashrsiz fanni ham tahrirlay oladiganga beradi; backend o'zgarmadi). i18n `admin.subjects.syllabusDownload`.

## 2026-10-19 — Material PDF va asl faylini yuklab olish

- Backend: `GET /api/teach/materials/{id}/original` (`StaffUser` + `ensure_can_edit_material`) — yuklangan asl fayl (PPT/DOC ham) asl nomi bilan, holatidan qat'i nazar (`failed` ham).
- `MaterialsTab`: «PDF yuklab olish» (tayyor bo'lsa) va «Asl faylni yuklab olish» tugmalari (`useProtectedDownload`); `materialOriginalUrl`, `schema.gen.ts` yangilandi, i18n `teach.downloadPdf`/`downloadOriginal`.

## 2026-10-19 — Muharrirda materialni ko'rish

- `MaterialsTab`: tayyor material qatorida «Ko'rish» (ko'z) tugmasi — keng `Modal` ichida lazy `PdfViewer` (`/api/materials/{id}/file`, admin va biriktirilgan o'qituvchiga nashrsiz mavzuda ham ochiladi).
- `Modal`: ixtiyoriy `size="xl"`; `api/teach.ts`: `materialFileUrl`; i18n `teach.viewMaterial`.

## 2026-10-19 — `main` GitHub'ga push qilindi

- `git push origin main`: `943bebb..ea1c35c` — nginx `.mjs` MIME tuzatishi; serverda `git pull` bilan olinadi.

## 2026-10-19 — Deploy: pdf.js worker (.mjs) to'g'ri MIME bilan

- `deploy/nginx/ip-http.conf`, `edubuxdpi.conf`: `/assets/` ichida `.mjs` uchun `text/javascript`. Ubuntu 22.04 dagi nginx 1.18 `.mjs` ni `application/octet-stream` deb berardi, brauzer modul worker'ni rad etib, talabaga "PDF faylni ochib bo'lmadi" chiqardi (serverda aniqlandi).

## 2026-10-19 — `main` GitHub'ga push qilindi

- `git push origin main`: `353e68d..4bdcbc6` — domensiz (IP + HTTP) rejim va deploy yo'riqnomasi (5 ta commit); server D3'da kodni shu yerdan oladi.

## 2026-10-19 — Deploy: Ubuntu 22.04 va server tajribasi yo'riqnomada

- `deploy/README.md` D2: ehtiyot choralari (tmux, uzilgan `apt upgrade` → `dpkg --configure -a`, needrestart oynasi, DHCP'da IP o'zgarishi), Ubuntu 22.04 uchun PGDG ombori orqali PostgreSQL 16 + pgvector, nginx 1.18 da `http2` eslatmasi. Institut VM'i 22.04 ekani aniqlandi; D2 shu yo'l bilan bajarildi.

## 2026-10-19 — Deploy: domensiz joylash yo'riqnomasi

- `deploy/README.md`: "D4 (vaqtincha). Domensiz: ochiq IP + oddiy HTTP" bo'limi — `.env` qiymatlari, `ip-http.conf` ni yoqish, tekshirish (login F5'dan keyin saqlanishi), xavf eslatmasi va domen + HTTPS'ga o'tish qadamlari; fayllar jadvaliga `ip-http.conf`.
- `deploy-roadmap.md`: D4 🟡 — vaqtincha IP + HTTP varianti, keyingi qadamlar yangilandi.

## 2026-10-19 — Deploy: `.env` namunasida domensiz variant

- `deploy/env.prod.example`: ochiq IP + HTTP uchun izohlangan qatorlar — `COOKIE_SECURE=false`, `ALLOW_INSECURE_HTTP=true`, `CORS_ORIGINS`/`PUBLIC_BASE_URL` = `http://<OCHIQ_IP>`.

## 2026-10-19 — Deploy: domensiz nginx konfiguratsiyasi (IP + HTTP)

- `deploy/nginx/ip-http.conf`: 80-port, `default_server` (IP orqali kelgan har qanday so'rov). `edubuxdpi.conf` dagi hamma narsa — SPA, `/assets/` keshi, `/api/` (SSE, 60 MB yuklash), `/protected-media/` (internal), sitemap/robots, CSP — faqat ssl va HSTS'siz. Domen tayyor bo'lgach o'chiriladi (u bilan bir vaqtda yoqilmaydi: `upstream` nomi bir xil).

## 2026-10-19 — Prod domensiz, oddiy HTTP'da ishga tushishi mumkin

- `core/config.py`: yangi `ALLOW_INSECURE_HTTP` (standart `false`). `true` bo'lsa prod `COOKIE_SECURE=false` bilan ham yuklanadi — domen va HTTPS hali yo'q, sayt ochiq IP orqali `http://` da ochiladi (Secure cookie HTTP'da saqlanmaydi, login yangilanmay qolardi). `JWT_SECRET` tekshiruvi o'zgarmadi.
- `main.py`: prod HTTPS'siz ishga tushganda ogohlantirish logi. `.env.example` ga izoh.
- Tekshiruv: ruff, mypy; `Settings()` bayroq bilan yuklanadi, bayroqsiz xato beradi.

## 2026-10-17 — `main` GitHub'ga push qilindi

- `git push origin main`: `de47bd0..f34d65c` — deploy yo'l xaritasi, `deploy/` fayllari (D1) va fayl nomi tuzatishi (6 ta commit) `origin/main` ga chiqdi; server kodni shu yerdan oladi.

## 2026-10-17 — Prod'da yuklab olingan fayl asl nomi bilan saqlanadi

- `core/files.py: file_response`: `MEDIA_ACCEL_REDIRECT=true` bo'lganda javobga `Content-Disposition` qo'shildi (Starlette `FileResponse` bilan bir xil, lotin bo'lmagan nom `filename*=utf-8''...`). Oldin nginx orqali berilgan kutubxona hujjatlari, kitoblar, topshiriq fayllari va o'quv dasturi brauzerda UUID nom bilan saqlanardi; lokal muhitda bu ko'rinmasdi.
- Tekshiruv: ruff, mypy, sarlavha qiymati qo'lda.

## 2026-10-17 — Deploy D1: zaxira skripti va yo'riqnoma

- `deploy/backup.sh`: kunlik `pg_dump -Fc` + `media/` arxivi `/srv/texnologiya/backups` ga, 14 kundan eskilari o'chiriladi; cron qatori va tiklash buyruqlari izohda.
- `deploy/README.md`: Ubuntu 24.04 VM uchun D2–D5 buyruqlari — paketlar (PostgreSQL 16 + pgvector, LibreOffice nogui, Node 22, uv, certbot), `texnologiya` foydalanuvchisi, baza, `.env`, migratsiya, admin, kontent importi, frontend build, systemd, nginx + Let's Encrypt (webroot), ichki tarmoq uchun self-signed varianti, smoke test, zaxira, yangilash va kuzatish.
- `.gitattributes`: `deploy/**` har doim LF (Windows'dan commit qilinganda ham).
- `deploy-roadmap.md`: D0 holati (VM resurslari, domen `edubuxdpi.uz`), D1 ✅.

## 2026-10-17 — Deploy D1: systemd xizmatlari

- `deploy/systemd/texnologiya-api.service`: `texnologiya` foydalanuvchisi nomidan `uv run --no-sync uvicorn app.main:create_app --factory`, `127.0.0.1:8000`, bitta worker (inline job va xotiradagi limitlar sabab), `--proxy-headers` (login/kontakt limiti haqiqiy IP bo'yicha), `Restart=always`, `MemoryMax=2500M`.
- `deploy/systemd/texnologiya-weekly.service` + `.timer`: har dushanba 07:00 (Asia/Tashkent) `app.cli weekly-report`, `Persistent=true`.

## 2026-10-17 — Deploy D1: nginx konfiguratsiyasi

- `deploy/nginx/edubuxdpi-http.conf`: 80-port, Let's Encrypt webroot (`/var/www/certbot`) va qolgan so'rovlar `https://edubuxdpi.uz` ga.
- `deploy/nginx/edubuxdpi.conf`: 443-port, `www` → asosiy domen; frontend `dist/` + SPA fallback (`/assets/` 1 yil kesh, `index.html` keshsiz); `/api/` → `127.0.0.1:8000` (SSE uchun `proxy_buffering off`, `client_max_body_size 60m`); `/sitemap.xml`, `/robots.txt` → `/api/seo/...`; `internal` `/protected-media/` → `/srv/texnologiya/media/`; HSTS, CSP (faqat o'z resurslari, `blob:`, pdf.js uchun `wasm-unsafe-eval`), `nosniff`, `X-Frame-Options`, `Referrer-Policy`.

## 2026-10-17 — Deploy D1: prod `.env` namunasi

- Yangi `deploy/env.prod.example` (`edubuxdpi.uz`): `ENV=prod`, PostgreSQL URL, `JWT_SECRET`, `COOKIE_SECURE=true`, CORS va `PUBLIC_BASE_URL` domen bilan, `MEDIA_ROOT=/srv/texnologiya/media`, `MEDIA_ACCEL_REDIRECT=true`, Groq asosiy + Gemini zaxira, lokal embedding va e5 chegaralari. Parol va kalitlar o'rnida `<...>` belgilari.

## 2026-10-17 — Serverga joylash yo'l xaritasi

- Yangi `docs/superpowers/deploy-roadmap.md`: institut Proxmox serveriga oddiy usulda (systemd + nginx, Docker'siz, bitta uvicorn worker) joylash bosqichlari D0–D5 — tayyorgarlik (resurslar, domen, DNS, port yo'naltirish, chiquvchi internet), `deploy/` fayllari, server sozlash, ishga tushirish, HTTPS (certbot yoki ichki tarmoq uchun self-signed), smoke test va zaxira nusxa.
- `roadmap.md` 13-band va `CLAUDE.md` shu faylga havola qiladi.

## 2026-10-16 — `main` GitHub'ga push qilindi

- `git push origin main`: `8e75aaa..6cf412f` — oldin yuborilmagan 140 ta commit (oxirgisi `6cf412f`, yangiliklar karuseli) `origin/main` ga chiqdi.

## 2026-10-16 — Bosh sahifada yangiliklar karuseli

- `/` dagi "So'nggi yangiliklar" bo'limi 3 ta kartali grid o'rniga karusel: katta muqovali slayd (butunligicha `/news/:slug` havolasi), pastdan gradient ustida sana, sarlavha, qisqa matn va "O'qish" tugmasi; burchakda `02 / 05` hisoblagich va oldingi/keyingi tugmalar. Endi so'nggi 5 ta yangilik.
- Animatsiya (`motion`): muqova crossfade + yengil "Ken Burns" (scale 1.08→1), matn yo'nalish bo'yicha blur bilan kiradi; reduced-motion'da faqat opacity.
- Slayd ostida avtoplay chizig'li ro'yxat (desktopda sana + sarlavha, mobilda faqat chiziqlar); 6 s'lik CSS animatsiya tugaganda keyingi slayd. Sichqoncha ustida, klaviatura fokusi ichida yoki tab yashirin bo'lsa pauza; reduced-motion'da avtoplay yo'q. Mobilda swipe (masofa yoki tezlik bo'yicha), `←/→` tugmalari.
- Yangi: `features/public/home/NewsCarousel.tsx`, `useCarousel.ts`; muqovasiz bezak `NewsCoverFallback.tsx` ga chiqarildi (`NewsCard` ham ishlatadi). i18n: `home.newsPrev`/`newsNext`.
- Tekshiruv: eslint, typecheck, build; Playwright'da desktop (1280) va mobil (390) ko'rinish, avtoplay va tugmalar.

## 2026-10-16 — Admin yangiliklar ro'yxatida muqova rasmi

- `/admin/news` ro'yxatida har bir qator boshida endi muqova rasmi (kichik 16:9 thumb) ko'rinadi; muqova yuklanayotganda skeleton, muqova bo'lmasa holat rangidagi ikonka. Tahrirlash sahifasidagi rasm o'z joyida.
- Blob URL bilan olish mantig'i `NewsEditorPage` dan `features/admin/cms/useNewsCover.ts` ga ko'chirildi (qoralama muqovasi ham admin endpoint'idan olinadi), ikkala sahifa shuni ishlatadi.
- Tekshiruv: eslint, typecheck.

## 2026-10-16 — Tutor: mavzu ichida manba qidiruvi mavzu nomi bilan

- `tutor.prepare`: mavzu berilgan bo'lsa, manba qidiruvi `"<mavzu nomi>. <savol>"` embedding'i bilan qilinadi (ikkalasi bitta `embed()` chaqiruvida). "Ushbu mavzu bo'yicha 3 ta atamani tushuntiring" kabi savollarda mazmunli so'z yo'q edi: o'xshashlik 0.78 → rad etilardi; nom bilan 0.82 → javob. Ishora rejimi (`_is_hint`) savolning o'zi bilan qoladi, aks holda nom uni topshiriq savollariga yaqinlashtirib yuboradi.
- Mavzu ichidagi mavzudan tashqari savol endi chegaradan o'tishi mumkin, lekin LLM o'zi "materiallarda yo'q" deb javob beradi (sinovda shunday bo'ldi).
- Tekshiruv: ruff, mypy; 5 ta haqiqiy savol — 4 tasi manba bilan javob, mavzusiz "ob-havo" savoli LLM'siz rad etildi. Bir savolda Groq 429 qaytardi va oqim birinchi bo'lakdan oldin Gemini'ga o'tdi (fallback ishlaydi).

## 2026-10-16 — Jarayon ichidagi embedding (`EMBEDDING_PROVIDER=local`)

- Sabab: bepul Gemini kalitida embedding kuniga 1000 so'rov — bitta qayta indekslash (1002 bo'lak) limitni tugatdi va tutor 6 soat 503 `AI_BUSY` qaytardi. TEI konteyneri (WSL, `cpu-1.8`) esa bo'sh turganda 2.8–3.1 GB RAM oldi — 7.7 GB'li kompyuterda backend, nginx va LibreOffice'ga joy qolmaydi.
- Yangi `app/ai/local_embed.py`: `LocalEmbeddingProvider` — `Xenova/multilingual-e5-base` ning int8 ONNX nusxasi (`onnx/model_quantized.onnx`, ~280 MB) `onnxruntime` bilan backend jarayonining o'zida; `query: `/`passage: ` prefikslari, mean pooling, L2. Model birinchi chaqiruvda `LOCAL_EMBED_CACHE` ga yuklanadi, keyin keshdan (internetsiz). Bitta sessiya + lock, `LOCAL_EMBED_THREADS` (default 2), CPU arena o'chiq.
- `config.py`: `embedding_provider` ga `local`, `local_embed_repo/file/cache/threads`; `services.build_ai` va `ai-check` uni quradi. Yangi bog'liqliklar: `onnxruntime`, `tokenizers`, `huggingface-hub`. `.gitignore`: `backend/models/`.
- O'lchovlar: model yuklangach ~570 MB (64 ta uzun bo'lakda cho'qqi ~1.1 GB), ~0.5 s/bo'lak; to'liq qayta indekslash 3275 bo'lak ~6 daqiqada, xatosiz.
- Kalibrlash (haqiqiy kurs ma'lumotlari): kurs savollari 0.82–0.85, mavzudan tashqari 0.78–0.81, topshiriq savolining aynan nusxasi 0.90–0.92. `.env.example`: `EMBEDDING_PROVIDER=local`, `AI_MIN_SIMILARITY=0.815`, `AI_HINT_SIMILARITY=0.89`.
- Tekshiruv: ruff, mypy; `ai-check` hammasi OK; tutor SSE orqali bo'laklab javob beradi va manba (glossariy, ma'ruza sahifasi) ko'rsatadi; AI test qoralamasi (Groq) 5 savolni ~10 s'da yaratdi.

## 2026-10-15 — Gemini modellari yangilandi va so'rov timeout'i

- `gemini-2.5-flash`/`-flash-lite` yangi kalitlar uchun 404 qaytaradi — default'lar (`config.py`, `.env.example`) `gemini-3.5-flash` / `gemini-3.5-flash-lite` ga o'tdi (ikkalasi ~2–3 s'da javob beradi; `gemini-3.8-flash` hozir 503/osilib qoladi).
- `GeminiProvider`: `genai.Client` ga 60 s timeout (`GEMINI_TIMEOUT_MS`). Avval band model javobini cheksiz kutib qolar edi (`ai-check` 5 daqiqada ham tugamadi), endi timeout → qayta urinish → `AI_BUSY`/zaxira provayder.
- Tekshiruv: ruff, mypy; `ai-check` — compat chat/fast, Gemini chat/fast, embedding hammasi OK.

## 2026-10-15 — `ai-check` CLI buyrug'i

- Yangi `app/ai/check.py` va `python -m app.cli ai-check`: kaliti bor har bir provayder (compat chat/fast, Gemini chat/fast, embedding — Gemini yoki TEI) fallback'siz alohida tekshiriladi; har biri uchun OK/XATO, xato sababi va vaqt chiqadi. Prompt va javob matni chiqarilmaydi. Hammasi OK bo'lmasa chiqish kodi 1.
- CLAUDE.md buyruqlar ro'yxatiga qo'shildi.
- Birinchi ishga tushirish: Groq (`gpt-oss-120b`/`20b`) va `gemini-embedding-001` ishlaydi; `gemini-2.5-flash`/`-lite` yangi kalitlar uchun o'chirilgan (404) — keyingi commit'da tuzatiladi.

## 2026-10-15 — Ochiq sahifalar redizayni: yakuniy tekshiruv

- `NewsListPage`, `FolderTree`, `BookCatalog`: bo'sh holatlarda emoji o'rniga SVG ikonkalar (`news`, `folder`, `book`) — endi yangilangan ochiq sahifalarda emoji qolmadi.
- Tekshiruv: lint, typecheck, build; brauzerda `/news`, `/news/:slug`, `/library` (uchala bo'lim), `/faq`, `/about`, `/contact` 1280px va 375px kenglikda (gorizontal siljish yo'q); kutubxona bo'limlari strelka tugmalari bilan almashadi va fokus to'g'ri ko'chadi.

## 2026-10-15 — Bog'lanish sahifasi yangi dizaynda

- `ContactPage.tsx`: `PageHero`; ikki ustun — chapda to'q `brand-950` panel (glow, katak naqsh, kontaktlar, ijtimoiy tarmoqlar), o'ngda forma kartasi (sarlavha, ikonkali maydonlar, ism va kontakt yonma-yon, "Yuborish" ikonkasi bilan). Telefonda forma birinchi chiqadi. Muvaffaqiyat holati: emoji o'rniga animatsiyali `check` doirasi. Honeypot va zod sxemasi o'zgarmadi.
- Yangi `ContactDetails.tsx` (kontakt qatorlari, `light`/`dark` ohang, manzil uchun xarita havolasi) va `contacts.ts` (`hasAnyContact`).
- i18n (uz + ru): `contact.eyebrow`, `contact.infoText`, `contact.formTitle`, `contact.formHint`.
- Tekshiruv: lint, typecheck; brauzerda 1280px (bo'sh forma yuborilganda xatolar) va 375px.

## 2026-10-15 — "Biz haqimizda" sahifasi yangi dizaynda

- `AboutPage.tsx`: `PageHero` (yorliq va izoh bilan); CMS matni oq kartada, o'qishga qulay kenglikda; o'ngda sticky "Tezkor havolalar" (Kutubxona, Yangiliklar, Savol-javob, Bog'lanish — ikonkali kartalar); yuklanishda skelet, bo'sh holatda `users` ikonkasi.
- i18n (uz + ru): `about.eyebrow`, `about.subtitle`, `about.quickLinks`; `about` obyekti ko'p qatorli ko'rinishga o'tdi; keyingi vazifa uchun `contact.phone/email/address/hours`.
- Tekshiruv: lint, typecheck; brauzerda 1280px va 375px.

## 2026-10-15 — Savol-javob sahifasi qidiruv bilan

- `FaqPage.tsx`: `PageHero` ichida qidiruv (savol va javob matni bo'yicha, brauzerning o'zida; topilganlar soni `role="status"` bilan e'lon qilinadi, natija bo'lmasa alohida holat); savollar chapda, o'ngda sticky to'q "Javob topmadingizmi?" kartasi (bog'lanish sahifasiga havola); yuklanishda skelet; bo'sh holatda emoji o'rniga `help` ikonkasi.
- i18n (uz + ru): `faq.eyebrow`, `faq.search`, `faq.searchPlaceholder`, `faq.noResults`, `faq.found`, `faq.moreText`.
- Tekshiruv: lint, typecheck, build; brauzerda 1280px va 375px (gorizontal siljish yo'q).

## 2026-10-15 — Kitoblar katalogi yangi dizaynda

- `BookCatalog.tsx`: qidiruv (ichida `search` ikonkasi) va kategoriya bitta oq panelda; kitob kartasi `SURFACE` sirtida, muqova "kitob" ko'rinishida (chap qirrada umurtqa soyasi, hover'da biroz ko'tarilib qiyshayadi), muqovasiz kitobda brand gradientli muqova va nomi; kategoriya kvadrat yorliq, "Yuklab olish" to'liq tugma + hajm; grid 1→2→3 ustun; yuklanishda skelet.
- Tekshiruv: lint, typecheck; brauzerda 1280px (kitoblar API javobi vaqtincha soxtalashtirilib).

## 2026-10-15 — Kutubxona sahifasi va papkalar daraxti yangi dizaynda

- `LibraryPage.tsx`: `PageHero`; oddiy tablar o'rniga hero ichida 3 ta bo'lim kartasi (ikonka + izoh, tanlangani brand gradientda, `layoutId` bilan siljiydi). `tablist`/`tab` semantikasi va strelka bilan almashtirish saqlandi.
- `FolderTree.tsx`: har bir yuqori papka alohida karta (gradient papka ikonkasi, hujjatlar soni, aylanadigan chevron); hujjat qatorida fayl turi "varaq" belgisi, hajm va `download` ikonkali tugma (telefonda faqat ikonka); yuklanishda skelet. `<details>` saqlandi.
- i18n (uz + ru): `library.eyebrow`, `library.tabHints.*`.
- Tekshiruv: lint, typecheck; brauzerda 1280px.

## 2026-10-15 — Yangilik sahifasi yangi dizaynda

- `NewsPage.tsx`: "orqaga" chip (`BACK_LINK`), ikonli yorliq, katta sarlavha, sana va ko'rishlar soni ikonkalar bilan; muqova `rounded-3xl` + yumshoq soya; matn o'qish uchun qulay kenglikda (`68ch`, katta qator oralig'i); yuklanishda maqola shaklidagi skelet; pastda "Boshqa yangiliklar" paneli.
- i18n (uz + ru): `news.moreTitle`.
- Tekshiruv: lint, typecheck, build; brauzerda 1280px va 375px (gorizontal siljish yo'q).

## 2026-10-15 — Yangiliklar ro'yxati yangi dizaynda

- `NewsListPage.tsx`: `PageHero` sarlavhasi; 1-sahifada eng yangi xabar katta gorizontal "featured" karta, qolganlari 3 ustunli grid (ketma-ket paydo bo'ladi); yuklanishda kartaga mos skelet.
- `NewsCard.tsx`: `SURFACE_LINK` sirti, rasm hover'da sekin kattalashadi, sana rasm ustida chip, pastda "O'qish →"; muqovasiz yangilikda emoji o'rniga brand gradient + `news` ikonka; `featured` varianti.
- `home/NewsSection.tsx`: karta o'z hover/soyasiga ega bo'lgani uchun o'ramdagi takroriy effekt olib tashlandi.
- i18n (uz + ru): `news.eyebrow`, `news.read`.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Ochiq sahifalar uchun umumiy `PageHero`

- Yangi `features/public/PageHero.tsx`: ichki ochiq sahifalar (yangiliklar, kutubxona, FAQ, biz haqimizda, bog'lanish) uchun sarlavha bloki — ikonli yorliq, katta sarlavha, izoh, ixtiyoriy yon ustun; fonda gradient, katak va xira bloblar (bosh sahifa hero'si uslubida, `motion-reduce` hisobga olinadi).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — "EDU 🔬" logosi barcha panellarda

- Yangi `components/icons/MicroscopeMark.tsx`: mikroskop belgisi umumiy komponent; `BrandLogo` undan foydalanadi va `to` propini oladi.
- `AppLayout` (talaba/o'qituvchi paneli): "layers" ikonkali eski belgi va "Texnologiya" nomi o'rniga `BrandLogo` (EDU + mikroskop).
- `AdminShell`: menyuda "EDU" yozuvi + mikroskop, ostida "Boshqaruv"; yig'ilgan menyuda faqat mikroskop belgisi.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Qolgan "texnologik ta'lim" matnlari biologiyaga

- `i18n/uz.json`, `ru.json`: footer mualliflik qatori, ro'yxatdan o'tish paneli matni (`auth.aside.registerText`, `institute`) va yangiliklar sahifasi tavsifi "Biologiya ta'limi" ga o'tkazildi. Endi tarjimalarda "texnologik ta'lim" qolmadi.

## 2026-10-15 — Sayt sarlavhasi va mikroskop favicon

- `index.html`: tab sarlavhasi "Texnologiya platformasi" o'rniga "EDU — Biologiya ta'limi metodik platformasi", meta tavsif biologiyaga; favicon ulandi.
- Yangi `public/favicon.svg`: brand gradientli dumaloq kvadratda oq chiziqli mikroskop (logodagi `MicroscopeMark` asosida).
- i18n (uz + ru): `meta.siteTitle`, `meta.description`, `footer.tagline` biologiyaga; `app.name` → "EDU" (sahifa sarlavhalari endi "Kutubxona — EDU" kabi).
- Tekshiruv: lint, typecheck, build; brauzerda 1366px va 375px (gorizontal siljish yo'q).

## 2026-10-15 — Kutubxona kartasi: telefon ko'rinishi tuzatildi

- `ExploreSection.tsx`: karta grid ichida `min-w-0` (375px ekranda gorizontal siljish yo'qoldi), kitob javoni bezagi faqat `sm+` ekranda, bo'lim izohlari kesilmasdan qatorga o'raladi.

## 2026-10-15 — "Platformadan foydalanish bosqichlari" rasmiy uslubda

- `i18n/uz.json`, `ru.json` (`home.how.*`): "To'rt qadamda boshlang" bo'limi matnlari rasmiy uslubga o'tkazildi — "Foydalanish tartibi", "Platformadan foydalanish bosqichlari"; bosqichlar: ro'yxatdan o'tish, hisobning tasdiqlanishi, fan va mavzuni tanlash, o'quv jarayoni.

## 2026-10-15 — Bosh sahifadagi kutubxona kartasi premium ko'rinishda

- `features/public/home/ExploreSection.tsx`: kutubxona kartasi alohida `LibraryCard` — gradient ramka, yumshoq nur va katak fon, o'ng burchakda kitob javoni SVG bezagi, "Ochiq kutubxona" yorlig'i.
- Bo'limlar (metodik / huquqiy / kitoblar) boy plitkalar: rangli gradient ikonka, nom va qisqa izoh, hover'da ko'tarilish va strelka; pastda "Kutubxonaga o'tish" havolasi. `motion-reduce` hurmat qilinadi.
- i18n: `home.library.eyebrow`, `items.*`, `open` (uz + ru), tavsif biologiya yo'nalishiga moslandi.

## 2026-10-15 — Bosh sahifa hero matni biologiya yo'nalishiga

- `i18n/uz.json`, `ru.json` (`home.hero.*`): sarlavha "Bo'lajak biologiya o'qituvchilari uchun metodik platforma", badge "BuxDPI · Biologiya ta'limi", tavsif platformadagi resurslarga mos (biologiya o'qitish metodikasi va o'simliklar fiziologiyasi: ma'ruza, amaliy va seminar mashg'ulotlari).
- Hero mockup va AI repetitor namunasi ham biologiyaga: "Fotosintez jarayoni", "Fotosintez nima?".

## 2026-10-15 — Yangi logo: "EDU 🔬" (ochiq sayt)

- `app/layouts/BrandLogo.tsx`: "T" gradient belgi va "Texnologiya" nomi o'rniga loyiha logosi (`src/logo.png` asosida) — "EDU" yozuvi va chiziqli mikroskop belgisi, inline SVG (har o'lchamda tiniq, fon bilan qo'shilib ketadi). "PLATFORM" so'zi olib tashlandi. Footerdagi to'q fonda och rangli; hover'da mikroskop egiladi (`motion-reduce` hurmat qilinadi).
- Hozircha faqat ochiq sayt (header va footer); talaba/admin panellari, login sahifalari va favicon keyingi bosqichda.
- Tekshiruv: lint, typecheck, brauzerda 1366px va 375px (gorizontal siljish yo'q).

## 2026-10-15 — Admin profili boshqaruv panelida

- Yangi marshrut `/admin/profile`: admin profili `AdminShell` ichida (chap menyu va breadcrumb "Boshqaruv › Profil" bilan) ochiladi, yuqori navbarli `AppLayout`da emas.
- `AdminShell`: menyu pastidagi avatar kartasi `/admin/profile` ga olib boradi, profil ochiq bo'lsa karta ajratiladi (`aria-current`); telefondagi panel bosilganda yopiladi.
- Yangi `app/ProfileRoute.tsx`: admin `/app/profile` ga kirsa `/admin/profile` ga yo'naltiriladi; `AppLayout`dagi ("Talaba ko'rinishi") avatar havolasi ham adminda `/admin/profile`.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Fanlar yig'iladigan ro'yxatda (mavzular va statistika)

- Yangi `features/teach/SubjectAccordion.tsx`: fan kartasi — sarlavha qatori (fan nomi, mavzular soni, nashr holati, `aria-expanded`) bosilganda ichidagi tarkib ochiladi; yopiq fanning tarkibi chizilmaydi (so'rov ham yuborilmaydi).
- Yangi `features/teach/openSubject.ts` (`useOpenSubject`): bir vaqtda bitta fan ochiq, manzilda `?subject=<id>`; fan bitta bo'lsa doim ochiq.
- `TeachHomePage`: fanlar yig'ilgan holda, mavzular fan bosilgandagina ochiladi (fan ko'p bo'lsa sahifa uzayib ketmaydi); ↑/↓/🗑️ belgilari SVG ikonkalarga almashdi.
- `StatsPage`: fan tanlash (`Select`) o'rniga xuddi shu yig'iladigan ro'yxat — ochilgan fanda ko'rsatkichlar va mavzular jadvali.
- `TopicEditorPage`: "Mavzular ro'yxati" havolasi `/teach?subject=<id>` — qaytganda shu fan ochiq turadi.
- i18n: `teach.topicsCount` (uz/ru).
- Tekshiruv: lint, typecheck, build.

## 2026-10-15 — Statistika qayta dizayni (2/2): mavzular jadvali

- `StatsPage`: jadval ustun sarlavhasini bosib saralanadi (`aria-sort`; raqamli ustunlarda avval eng kattasi, `null` qiymatlar oxirida); "Tugatgan" ustunida son, foiz va ingichka progress chizig'i (`role=progressbar`); o'rtacha natija rangli belgi (80%+ yashil, 50–79% sariq, <50% qizil); tekshirilmagan javoblar bor bo'lsa `/teach/review` ga havola; mavzu nomi muharrirga olib boradi.
- Telefonda (`md` dan past) jadval o'rniga kartochkalar ro'yxati — gorizontal surish yo'q. Yuklanishda qator skeleti, bo'sh holat — `EmptyBlock`.
- Oldingi commitda `StatsPage.tsx` loyiha sozlamasisiz `prettier` bilan boshqa uslubga (qo'sh tirnoq, nuqta-vergul) o'tib qolgan edi — fayl qayta loyiha uslubida yozildi.
- `statsSummary.ts`: `sortRows()`, `scoreTone()`.
- i18n: `stats.topicsHint`, `stats.completionOf`, `stats.emptyText` (uz/ru).
- Tekshiruv: lint, typecheck, build.

## 2026-10-15 — Statistika qayta dizayni (1/2): umumiy ko'rsatkichlar

- `StatsPage`: fan tanlash sarlavhaga ko'chdi (fan bitta bo'lsa — tanlash o'rniga fan nomi); 4 ta `StatCard`: faol talabalar, tugatish darajasi, o'rtacha natija, tekshirilmagan javoblar (bor bo'lsa sariq va `/teach/review` ga havola). Jadval `Panel` ichida.
- Yangi `features/teach/statsSummary.ts`: `summarize()`, `percent()`, `completionOf()` — sof hisob-kitob funksiyalari.
- i18n: `stats.subtitle`, `stats.topicsTitle`, `stats.kpi.*` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Bosqich tablari qayta dizayni (3/3): faoliyatlar va vazifa

- `ActivitiesTab`: emoji o'rniga SVG ikonkalar (`quiz`/`check`/`grid`); faoliyatlar `DataList flat`/`ListRow` qatorlarida, holat `Badge dot`; ↑/↓, ko'rib chiqish, tahrirlash va o'chirish — `IconAction`; krossvord ko'rinishi qator ostida to'liq kenglikda. "Yangi test/ha-yo'q/krossvord" — ikonkali uchta karta-tugma, yangi faoliyat formasi `AddSection` ichida; bo'sh holat — `EmptyBlock`.
- `TaskTab`: "hali vazifa yo'q" eslatmasi ikonkali sariq blokka aylandi.
- `ListRow`: `below` slot (qator ostidagi to'liq kenglikdagi tarkib); `IconAction`: `pressed` (`aria-pressed`).
- i18n: `activityEditor.emptyText` qo'shildi; `activityEditor.new*` matnlaridan "+ " olib tashlandi ("Yangi test" va h.k.) (uz/ru).
- Tekshiruv: lint, typecheck, build.

## 2026-10-15 — Bosqich tablari qayta dizayni (2/3): glossariy va adabiyotlar

- `GlossaryTab`, `LiteratureTab`: elementlar `DataList flat`/`ListRow` qatorlarida (ikonka plitkasi, tahrirlash va o'chirish `IconAction`), tahrirlash formasi qatorning o'zida ochiladi; bo'sh holat — `EmptyBlock`.
- Yangi `features/teach/AddSection.tsx`: "yangi element qo'shish" bloki (glossariy, adabiyotlar).
- i18n: `teach.noGlossaryText`, `teach.noLiteratureText` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Bosqich tablari qayta dizayni (1/3): materiallar

- `MaterialsTab`: yuklash formasi sudrab tashlash (drag-and-drop) zonasiga aylandi — tanlangan fayl nomi va hajmi ko'rsatiladi, ruxsat etilmagan kengaytma tashlansa xabar chiqadi, nom maydoni bo'sh bo'lsa fayl nomidan to'ldiriladi. Materiallar `DataList`/`ListRow` qatorlarida (PDF ikonkasi, holat `Badge dot`, o'chirish `IconAction`), bo'sh holat — `EmptyBlock`.
- `DataList`: `flat` varianti (panel ichida soyasiz); yangi `RowIcon` (qator ikonka plitkasi).
- i18n: `teach.noMaterialsText`, `teach.addMaterial`, `teach.materialDrop`, `teach.materialWrongType` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Mavzu muharriri qayta dizayni (3/3): mavzu ma'lumotlari paneli

- `TopicDetailsForm`: sahifa tepasidagi katta forma o'rniga yig'iladigan panel (sarlavhada qisqacha mazmun, `aria-expanded`); yopiq holatda forma `hidden` bilan DOM'da qoladi. Ichida nom + mashg'ulot turi bir qatorda, nashr holati almashtirgich (switch) ko'rinishida; "Saqlash" faqat o'zgarish bo'lsa faol, "Bekor qilish" o'zgarishlarni qaytaradi, saqlangach forma yangi qiymatlar bilan tiklanadi.
- i18n: `teach.detailsTitle`, `teach.detailsNoSummary` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Mavzu muharriri qayta dizayni (2/3): bosqichlar menyusi

- Yangi `features/teach/StepNav.tsx`: 7 bosqich `role=tablist` menyusi — SVG ikonka, tartib raqami, elementlar soni; katta ekranda chapda yopishqoq vertikal ro'yxat, telefonda gorizontal suriladigan qator; ←↑/→↓ klaviatura bilan almashtirish.
- `TopicEditorPage`: emoji'li chiziqli tablar o'rniga ikki ustunli layout (menyu + `Panel`); panel sarlavhasi — bosqich nomi va qisqa izohi, tab almashganda yengil fade (`m.div`, `motion-reduce` hurmat qilinadi). `?tab=` avvalgidek saqlanadi.
- i18n: `teach.stepHints.*` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Mavzu muharriri qayta dizayni (1/3): sarlavha

- `TopicEditorPage`: "← orqaga" havolasi o'rniga `PageHeader` — fan nomi (eyebrow), mavzu nomi, mashg'ulot turi, tartib raqami ("3-mavzu, jami 12 ta") va nashr holati; amallar: "Talaba ko'rinishi" (faqat nashr qilingan mavzuda, yangi oynada) va oldingi/keyingi mavzuga o'tish.
- Yangi `features/admin/ui/EmptyBlock.tsx`: panel ichidagi ixcham bo'sh holat (keyingi qadamlarda ishlatiladi).
- i18n: `teach.studentView`, `teach.prevTopic`, `teach.nextTopic`, `teach.topicPosition` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — O'qituvchida logo landing sahifaga olib boradi

- `AppLayout`: o'qituvchi logoni bossa `/` (landing) ga o'tadi (avval `/teach` edi); adminda logo avvalgidek `/admin` ga.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — O'qituvchi menyusidan "Talaba ko'rinishi" olib tashlandi

- `paths.ts: navLinksFor('teacher')`: `/app` ("Talaba ko'rinishi") havolasi o'chirildi; u endi faqat adminda (`AppLayout` va `AdminShell` footeri).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin va o'qituvchi paneli birlashtirildi (4/4): sarlavhalar va hujjat

- `TeachHomePage`, `ReviewQueuePage`, `StatsPage`: sarlavha `PageHeader` (ikonka + "O'quv jarayoni" yorlig'i), shunda ular `AdminShell` ichida boshqa admin sahifalari bilan bir xil ko'rinadi.
- `CLAUDE.md`: yagona panel (`StaffLayout`, admin bosh sahifasi `/admin`, `ADMIN_NAV` dagi `/teach` sahifalari, `activePrefix`) qayd etildi.
- Tekshiruv: lint, typecheck, build.

## 2026-10-15 — Admin va o'qituvchi paneli birlashtirildi (3/4): bosh sahifa

- `AdminOverviewPage`: birinchi ko'rsatkich — "Tekshirilmagan javoblar" (`useTeachSummary`, `/teach/review` ga havola); ko'rsatkichlar 5 ta (telefonda birinchisi to'liq kenglikda).
- `TeachHomePage`: "Tasdiq kutayotgan talabalar" eslatmasi olib tashlandi (sidebar va bosh sahifada bor).
- i18n: `adminOverview.stats.pendingReviews` qo'shildi, `teach.pendingStudents` o'chirildi (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin va o'qituvchi paneli birlashtirildi (2/4): yon menyu

- `ADMIN_NAV`: "O'quv jarayoni" guruhiga "Mavzu muharriri" (`/teach`), "Tekshirish" va "Statistika" qo'shildi.
- `NavItem.activePrefix`: mavzu tahririda (`/teach/topics/:id`) ham "Mavzu muharriri" faol ko'rinadi; `SidebarLink` faollikni `matches()` dan oladi.
- "Tekshirish" yonida tekshirilmagan javoblar soni (`useTeachSummary`).
- Pastki havolalar: "O'qituvchi paneli" o'rniga "Talaba ko'rinishi" (`/app`). Breadcrumb: javob sahifasida "Javob".
- i18n: `adminShell.teachPanel` o'chirildi, `adminShell.submission/reviewCount` qo'shildi (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin va o'qituvchi paneli birlashtirildi (1/4): marshrutlar

- Yangi `StaffLayout`: `/teach/*` sahifalari admin uchun `AdminShell` ichida, oddiy o'qituvchi uchun avvalgidek `AppLayout` da ochiladi. URL'lar o'zgarmadi.
- `homePathFor`: admin kirganda `/admin` (boshqaruv bosh sahifasi) ochiladi, o'qituvchi uchun `/teach`.
- `navLinksFor('admin')`: talaba ko'rinishida yuqori menyuda faqat "Boshqaruv" va "Talaba ko'rinishi".
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin menyusi: pastki havolalar yozuv bilan

- `AdminShell`: yon menyuning pastidagi "O'qituvchi paneli" va "Saytga o'tish" endi ikonka va yozuv bilan alohida qatorlarda (avval faqat ikonka edi); menyu yig'ilganda avvalgidek faqat ikonka. Yig'ish tugmasi "Saytga o'tish" qatorining o'ng tomonida.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin panel redizayni: savol-javob, xabarlar, sayt sozlamalari (9/9)

- `AdminFaqPage`: `PageHeader`, `DataList` qatorlari tartib raqami belgisi, nuqtali holat, javobdan 2 qator; tartib/tahrir/o'chirish ixcham ikonka-tugmalar. Yuklanishda skelet.
- `AdminMessagesPage`: pochta qutisi ko'rinishi — o'qilmagan xabar chap chetida brand chiziq, och fon va to'q bosh harf belgisi; kontakt email/telefon ikonkasi bilan; "Faqat o'qilmaganlar" belgilash qutisi o'rniga segment filtr (Hammasi / Faqat o'qilmaganlar).
- `AdminSitePage`: bo'limlar izohli `Panel` larda, kontakt va ijtimoiy tarmoq maydonlari ikonkali, "Biz haqimizda" `Tabs pill` bilan; yuklanishda skelet.
- `IconAction` `features/admin/ui/` ga ko'chirildi (kutubxona va savol-javob umumiy). CLAUDE.md da admin primitivlari qayd etildi. i18n: `adminMessages.filter/filterAll`, `adminSite.contactsHint/socialsHint/aboutHint` (uz/ru).
- Shu bilan admin panel redizayni rejasi (9 vazifa) yakunlandi.
- Tekshiruv: lint, typecheck, build.

## 2026-10-15 — Admin panel redizayni: kutubxona va kitoblar (8/9)

- `AdminLibraryPage`: `PageHeader`, bo'limlar `Tabs pill`, daraxt `Panel` ichida. Emoji o'rniga ikonkalar (papka, PDF). Papka qatorida tartib, tahrirlash va o'chirish ixcham ikonka-tugmalar (nomi `aria-label`/`title`: "Tahrirlash: <nom>"), "+ Hujjat"/"+ Ichki papka" ikonkali; ichki daraja uzuq chiziq bilan.
- `AdminBooksPage`: `PageHeader` (yuklash tugmasi), `Tabs pill`, kitoblar `md` dan ikki ustunli kartalarda: katta muqova (yo'q bo'lsa ikonka), nuqtali holat, muallif/turkum, yuklagan, `formatDate` va hajm; pastki qatorda tasdiqlash va amallar ikonkalar bilan. Yuklanishda skelet.
- Yangi `arrowDown` ikonkasi. `LibraryModals` va `BookEditModal` o'zgarmadi (umumiy `Modal` allaqachon yangi uslubda).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin panel redizayni: yangiliklar (7/9)

- `AdminNewsPage`: `PageHeader` ("Yangi yangilik" tugmasi ikonka bilan), `DataList` qatorlari: holat rangidagi belgi (muqova bo'lsa kamera ikonkasi), sana va ko'rishlar ikonkalar bilan, nuqtali holat belgisi, o'ng strelka; yuklanishda skelet. Har qatorga muqova rasmi yuklanmaydi (qoralama muqovalari himoyalangan, alohida so'rov og'ir).
- `NewsEditorPage`: ikki ustun (`lg`) — chapda sarlavha/slug va matn (`Tabs pill` bilan yozish/ko'rinish) kartalarda; o'ngda yopishqoq panel: "Nashr" (vaqt, saqlash, hozir nashr qilish, nashrdan olish, saytda ko'rish), muqova (bo'sh holat ikonka bilan), ma'lumot (ko'rishlar, yaratilgan/o'zgartirilgan vaqt) va o'chirish. "Orqaga" havolasi chip ko'rinishida, yuklanishda skelet. Forma mantig'i o'zgarmadi.
- i18n: `adminNews.publishTitle/viewsLabel/createdAt/updatedAt` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin yon menyusida scroll olib tashlandi

- `AdminShell` yon menyusi ixchamlashtirildi, oddiy noutbuk ekraniga (~700px balandlik) scrollsiz sig'adi: header 56px, guruhlar orasi va bandlar balandligi kichraytirildi.
- Pastdagi "O'qituvchi paneli", "Saytni ko'rish" va "Menyuni yig'ish" bitta ikonka qatoriga o'tdi (nomi `aria-label` va hover'da `title`).
- Menyu scrollbar'i yashirildi; juda past ekranda baribir g'ildirak/klaviatura bilan aylantirish mumkin.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin panel redizayni: fanlar va AI sozlamalari (6/9)

- `AdminSubjectsPage`: `PageHeader` ("Yangi fan" tugmasi bilan), fanlar `lg` da ikki ustunli kartalar to'rida — tartib raqami belgisi, slug, tavsif (2 qator), nuqtali nashr holati, o'quv dasturi alohida blokda PDF ikonkasi bilan, amallar ikonkali. Yuklanishda skelet.
- `AdminAiPage`: sozlamalar va indeks yonma-yon (`lg`), provayder/modellar kichik kartalarda, maxfiylik eslatmasi emoji o'rniga ikonka bilan. Sarf bo'limi: ko'rsatkichlar (so'rovlar, indeksdagi va eskirgan bo'laklar), jadval yopishqoq sarlavha, `tabular-nums` va `formatDate` bilan.
- `SubjectFormModal` o'zgarmadi (umumiy `Modal` allaqachon yangi uslubda). i18n: `admin.subjects.subtitle`, `adminAi.subtitle/chunksLabel/staleLabel` qo'shildi, ishlatilmay qolgan `adminAi.chunks/stale` o'chirildi (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin panel redizayni: foydalanuvchilar (5/9)

- `AdminUsersPage`: `PageHeader`, bir qatorda segment filtr (`Tabs pill`) va ikonkali qidiruv, `DataList` qatorlari Avatar, email/telefon ikonkalari va nuqtali holat belgisi bilan; yuklanishda skelet, bo'sh holatda SVG ikonka.
- Vaqtinchalik parol oynasi: to'q mono blok va "Nusxa olish" tugmasi (ruxsat bo'lmasa parol baribir ko'rinadi).
- Accessible nomlar (qator nomi, tugmalar) o'zgarmadi. i18n: `admin.users.subtitle/copy/copied` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin panel redizayni: dashboard (4/9)

- Yangi `AdminOverviewPage` (`/admin`; avval `/admin/users` ga yo'naltirardi). Backend o'zgarmadi — faqat mavjud so'rovlar.
- Ko'rsatkichlar: tasdiq kutayotgan talabalar, o'qilmagan xabarlar, tasdiq kutayotgan kitoblar, nashr qilinmagan yangiliklar (har biri tegishli sahifaga havola, kutayotgan ish bo'lsa rang o'zgaradi).
- Tasdiq kutayotgan talabalar (5 tasi, shu yerda tasdiqlash), o'qilmagan xabarlar, AI holati (yoqilgan/o'chirilgan/sozlanmagan, provayder, model, kunlik limit), tezkor amallar.
- Menyuda yangi "Asosiy" guruhi va "Umumiy ko'rinish" bandi. i18n: `adminOverview.*`, `nav.adminOverview`, `navGroups.main` (uz/ru).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin panel redizayni: UI primitivlari (3/9)

- `features/admin/ui/`: `PageHeader` (ikonka, eyebrow, sarlavha, izoh, amallar), `Panel` (sarlavhali bo'lim kartasi, `flush`), `StatCard` (ko'rsatkich, skelet, havola), `DataList` + `ListRow` (eski `border-2` qatorlar o'rniga bitta kartada ajratilgan qatorlar), `Toolbar` (filtr + qidiruv), `ListSkeleton`.
- `Badge`: `dot` ko'rinishi (oq fon, rangli nuqta) — holatlar uchun. `Tabs`: `variant="pill"` (segment ko'rinishi). Mavjud chaqiruvlar o'zgarmaydi.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin panel redizayni: alohida `AdminShell` (2/9)

- `/admin/*` endi `AppLayout` ichida emas, o'z karkasida (`app/layouts/AdminShell.tsx`); `AdminLayout` o'chirildi.
- Kompyuterda chapda to'q (`brand-950`, yumshoq nur va katak bezagi) yon menyu: guruhlar, ikonkalar, faol band uchun suriluvchi indikator (`layoutId`), hisoblagichlar (kutayotgan talabalar, o'qilmagan xabarlar), pastda "O'qituvchi paneli", "Saytni ko'rish", profil va chiqish. Menyu ikonka rejimiga yig'iladi (holat `localStorage` da, xato bo'lsa e'tiborsiz).
- Tepada joylashuv (Boshqaruv › guruh › bo'lim › tahrirlash) va til tanlash. Telefonda `<select>` o'rniga chapdan chiquvchi panel (Escape/fon/havola bilan yopiladi, fokus qaytariladi).
- CLAUDE.md dagi admin karkasi tavsifi yangilandi.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Admin panel redizayni: ikonkalar va menyu (1/9)

- Admin panelni "premium" ko'rinishga o'tkazish rejasi boshlandi (alohida admin shell, dashboard, sahifalar yangi uslubda).
- `components/icons/paths.ts`: yangi ikonkalar `users`, `news`, `help`, `inbox`, `settings`, `grid`, `panelLeft`, `copy`.
- `ADMIN_NAV` (`paths.ts`): har bir bandga ikonka. i18n: `adminShell.*` (uz/ru) — keyingi qadamdagi shell uchun.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Odamlar uchun sayt xaritasi sahifasi

- Yangi `SitemapPage` (`/sitemap`): ochiq sahifalar guruhlab — asosiy sahifalar (bosh sahifa, biz haqimizda, savol-javob, bog'lanish), kutubxona va uning bo'limlari, platforma (kirish/ro'yxatdan o'tish yoki kabinet), yangiliklar ro'yxati va oxirgi 10 ta yangilik.
- Footerdagi "Sayt xaritasi" endi xom XML (`/api/seo/sitemap.xml`) o'rniga shu sahifaga olib boradi; XML sitemap qidiruv tizimlari uchun `robots.txt` orqali qoladi.
- `LIBRARY_TABS` footer'dan `paths.ts` ga ko'chirildi (footer va sayt xaritasi umumiy ishlatadi). Backend `seo.py: STATIC_PATHS` ga `/sitemap` qo'shildi. i18n: `sitemap.*` (uz/ru).
- Tekshiruv: lint, typecheck, ruff.

## 2026-10-15 — Footer'dan so'nggi yangiliklar olib tashlandi

- `SiteFooter`: "So'nggi yangiliklar" ustuni (3 ta yangilik) olib tashlandi, grid 4 ustunga o'tdi. Ishlatilmay qolgan `footer.latestNews` i18n kaliti (uz/ru) o'chirildi. "Bo'limlar" ustunidagi "Yangiliklar" havolasi qoldi.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Fan kartasidagi halqa mavzular sonini ko'rsatadi

- Talaba fan kartalaridagi halqa ichida avval bosqichlar soni (masalan, `0/210`) chiqardi; endi tugatilgan mavzular / mavzular soni (`0/30`).
- Backend: `SubjectCard`ga `topics_completed` maydoni (kontentli barcha bosqichlari bajarilgan mavzular). `schema.gen.ts` qayta generatsiya qilindi.
- Tekshiruv: ruff, mypy, lint, typecheck.

## 2026-10-15 — Talaba uchun logo bosh sahifaga olib boradi

- `AppLayout`: talaba header'dagi logoni bossa endi landing sahifaga (`/`) o'tadi (avval `/app` ga). O'qituvchi va admin uchun logo avvalgidek o'z paneliga olib boradi.

## 2026-10-15 — AI repetitor: tarjima kalitlari tuzatildi

- `tutor.subtitle`, `tutor.noConversations`, `tutor.suggestionsTitle`, `tutor.suggestion1..3` kalitlari `uz.json`/`ru.json`da xato bilan `home.features.tutor` ichiga tushib qolgan edi, shuning uchun `/app/tutor` sahifasida matn o'rniga kalit nomlari chiqardi. Kalitlar `tutor` bo'limiga ko'chirildi.

## 2026-10-15 — Profil rasmi (avatar) va profil kartasi

Foydalanuvchi o'z rasmini yuklay oladi; rasm bo'lmasa har kimga o'ziga xos standart avatar chiziladi. Profil kartasi va maydonlari tuzatildi.

### Task 3: profil kartasi, rasm yuklash va placeholder'lar
- Profil kartasi: avatar bannerga qo'shilib ketmasligi uchun oq halqa va soya bilan ajratildi; ism, rol va email endi banner ostida alohida qatorda (avval avatar yonida, banner chegarasida edi). Banner to'qroq gradient.
- `features/profile/AvatarEditor.tsx`: katta avatar ustida kamera tugmasi — rasm tanlanishi bilan yuklanadi (tur va 2 MB chegarasi oldindan tekshiriladi, `avatarRules.ts`), yuklanayotganda spinner; rasm bo'lsa "Rasmni o'chirish". Muvaffaqiyatda toast.
- Profil maydonlariga placeholder: ism, telefon, joriy/yangi/takroriy parol.
- `paths.ts`: `camera` ikonka. i18n (uz/ru): `profile.avatar*`, `profile.currentPasswordPlaceholder`.
- Tekshiruv: lint, typecheck, build; avatar endpointlari bir martalik skript bilan (yuklash, ochiq URL, noto'g'ri fayl → 400, almashtirganda eski fayl o'chadi, o'chirish).

### Task 2: avatar komponenti va hook'lar
- `components/ui/Avatar.tsx`: yuklangan rasm (`object-cover`, yuklanmasa standartga qaytadi) yoki o'ziga xos standart avatar — `lib/avatar.ts` foydalanuvchi ID'sidan (FNV-1a hash) 10 ta rang juftligidan birini, 4 ta naqshdan birini (`orbs`, `waves`, `grid`, `rays`) va burilishni tanlaydi, ustida bosh harflar.
- `api/auth.ts`: `useUploadAvatar` (`PUT /api/me/avatar`, FormData), `useDeleteAvatar`; javob sessiyaga yoziladi.
- `AppLayout` header'idagi avatar endi `Avatar`.
- Tekshiruv: lint, typecheck.

### Task 1: backend — profil rasmi
- `users.avatar` (storage'dagi nisbiy yo'l, NULL — standart avatar) va migratsiya `53dd6bb26442`; `User.avatar_url` (`/api/avatars/<uuid>.<ext>`), `UserOut.avatar_url`.
- `PUT /api/me/avatar` (multipart `file`; JPG/PNG/WEBP, magic bytes, `MAX_AVATAR_MB`=2) — eski fayl commit'dan keyin o'chiriladi; `DELETE /api/me/avatar`; ochiq `GET /api/avatars/{name}` (nom UUID formatida tekshiriladi va bazada bo'lishi shart, `Cache-Control: immutable`).
- Frontend: `schema.gen.ts` qayta yaratildi, `User.avatar_url`; test fixture'lariga `avatar_url: null`.
- Tekshiruv: ruff, mypy, `alembic upgrade head`, `alembic check`, typecheck.

## 2026-10-15 — Talaba paneli: premium dizayn

Talaba paneli (`/app/*`) ochiq sayt va auth sahifalari bilan bir xil premium uslubga o'tadi (reja: yuqori menyu saqlanadi, barcha talaba sahifalari). Mantiq va backend o'zgarmaydi.

### Task 16: yuklanish skeletlari
- `QueryState`: ixtiyoriy `loading` — birinchi yuklanishda spinner o'rniga sahifa shaklidagi skelet (`role="status"` + "Yuklanmoqda" yorlig'i bilan o'raladi); berilmasa avvalgidek `PageSpinner`.
- Skeletlar: `SubjectsPage` (fan kartalari — endi `loading` orqali), `SubjectPage` (hero + timeline), `PlayerPage` (bosqichlar paneli + kontent), `ResultsPage` (xulosa + bo'lim).
- `Skeleton`: `className`da radius berilsa standart `rounded-xl` qo'shilmaydi.
- Tekshiruv: lint, typecheck, build.

### Task 15: profil sahifasi
- `ProfilePage`: yuqori karta — gradient banner, ustiga chiqib turgan bosh harfli avatar, ism, rol belgisi, email; talabada seriya va XP chiplari (`useDashboard`). Bo'lim sarlavhalari ikonkali (`SectionTitle`), ism/telefon maydonlari ikonkali `Input`, parol maydonlari `PasswordInput` (ko'rsatish/yashirish). Maydon yorliqlari va tugma nomlari o'zgarmadi.
- Tekshiruv: lint, typecheck.

### Task 14: AI repetitor sahifasi
- `TutorPage`: sarlavha + izoh; chapda suhbatlar kartasi (asosiy "Yangi suhbat" tugmasi, chat ikonkali elementlar, faol suhbat halqa bilan, sana `formatDate`, o'chirish — `trash` ikonka, bo'sh ro'yxat matni, uzun ro'yxat scroll), o'ngda `SURFACE` panel (`100dvh`).
- `TutorPanel`: ixtiyoriy `suggestions` — bo'sh umumiy suhbatda namuna savollar chiplari (bosilsa yuboriladi; limit tugagan yoki javob kutilayotganda o'chiq).
- `paths.ts`: `trash` ikonka.
- i18n (uz/ru): `tutor.subtitle`, `tutor.noConversations`, `tutor.suggestionsTitle`, `tutor.suggestion1..3`.
- Tekshiruv: lint, typecheck.

### Task 13: "Natijalarim" sahifasi
- `ResultsPage`: sarlavha + izoh; tepada xulosa (bajarilgan faoliyatlar, o'rtacha eng yaxshi natija `ProgressBar` bilan, baholangan/jami vazifalar — faqat kelgan ma'lumotdan); fanlar `details` bilan yig'iladigan kartalar; faoliyat qatori — tur ikonkasi, ball chizig'i + foiz (ekran o'quvchiga "Eng yaxshi: N%"), "Tahlil →"; vazifa qatori — ikonka, holat belgisi, izoh alohida blokda. Sana `formatDate` orqali.
- `AttemptDetailPage`: "orqaga" chip, `PAGE_TITLE`, sana `formatDateTime`.
- i18n (uz/ru): `results.subtitle`, `results.summaryActivities`, `results.summaryAverage`, `results.summaryTasks`.
- Tekshiruv: lint, typecheck.

### Task 12: AI repetitor paneli
- `TutorPanel`: shishasimon sarlavha (gradient avatar, foydalanish hisoblagichi chipda, ikonkali "Yangi suhbat"), xabarlar fonida yumshoq kulrang; pufakchalar — talaba: brand gradient (o'ngda), repetitor: oq karta + kichik avatar (chapda); manbalar alohida blokda; bo'sh holat ikonkali; "Yuborish" ikonkali.
- `TutorDock`: keng ekranda `SURFACE` panel (`100dvh`), telefonda gradient suzuvchi tugma va pastki panel (`85dvh`, tutqich chizig'i, xiralashgan fon).
- Tekshiruv: lint, typecheck, build.

### Task 11: bosqich kontenti va faoliyatlar
- `StepContent`: material tanlagich — PDF ikonkali chiplar (`ring` holatlari); lug'at — 2 ustunli kartalar (chapda gradient chiziq); adabiyotlar — raqamli kartalar, havola tashqi-havola ikonkasi bilan; pastda amallar paneli (`StepFooter`): "Tugatdim" belgi ikonkasi bilan, tugatilgan holat yashil yorliq, "Keyingi bosqich →" (bosqich tugagan bo'lsa asosiy tugma).
- `ActivityList`: faoliyat turi SVG ikonkasi (emoji o'rniga), "Boshlash/Qayta" ikonkali, "Orqaga" ikonkali secondary tugma. `ChoicePlayer` (ha/yo'q va variantlar — `ring` tanlov holatlari, variantda klaviatura fokusi `has-[:focus-visible]`), `CrosswordPlayer` (katakchalar, ko'rsatmalar kartalarda), `AttemptResult`, `TaskStep`, `PdfViewer` — yangi sirtlar; mantiq o'zgarmadi.
- `components/ui/styles.ts`: `SURFACE_SM`, `SURFACE_LINK_SM` (kichik radiusli sirtlar — `cx` bilan ikki `rounded-*` to'qnashmasligi uchun); `SubjectPage` mavzu kartasi shunga o'tdi.
- Tekshiruv: lint, typecheck.

### Task 10: pleyer paneli va bosqichlar
- `PlayerPage`: "orqaga" chip (fan nomi), chap panelda mavzu sarlavhasi + `ProgressRing` va `ProgressBar`; bosqichlar stepper'i — SVG ikonkali kvadratchalar (tugatilgan: gradient + belgi, joriy: brand halqa, qolganlar: kulrang), faol bosqichda chapda gradient chiziq (md+), mobilda avvalgidek gorizontal scroll.
- Bosqich sarlavhasi: ikonka kvadrati + `text-2xl font-extrabold`; fokus/scroll mantiqi va `aria-current="step"` o'zgarmadi. Bo'sh holatlar SVG ikonkali.
- Tekshiruv: lint, typecheck.

### Task 9: fan sahifasi
- `SubjectPage`: "orqaga" chip (`BACK_LINK`), hero (mavzular soni yorlig'i, katta sarlavha, tavsif, yuklab olish ikonkali "O'quv dasturi", tugatilgan mavzular halqasi); bir nechta mashg'ulot turi bo'lsa segment-filtr ("Barchasi" + turlar, `aria-pressed`), guruh sarlavhasida soni.
- Mavzular yo'li: zig-zag o'rniga bog'langan vertikal timeline — tugun (tugatilgan: gradient belgi, boshlangan: brand halqa, boshlanmagan: kulrang raqam) va karta (yorliq, "Tugatilgan" belgisi, sarlavha, boshlanganlarda bosqichlar chizig'i, chevron).
- i18n (uz/ru): `student.topicsDone`, `student.allTypes`, `student.lessonFilter`, `student.stepsDone`.
- Tekshiruv: lint, typecheck.

### Task 8: fan kartalari
- `SubjectsPage`: fan kartasi — gradient banner (brand soyalari, katak naqsh, katta bosh harf, kitob ikonkasi), sarlavha + `ProgressRing`, tavsif, pastda `ProgressBar`, mavzular soni va foiz; hover'da ko'tariladi (`SURFACE_LINK`). Ro'yxat `stagger` bilan ochiladi, birinchi yuklanishda skelet kartalar; bo'sh holat SVG ikonkali.
- Tekshiruv: lint, typecheck, build.

### Task 7: yutuqlar bento-bloki
- `DashboardStats`: uchta bir xil karta o'rniga bento — seriya (olov ikonka, katta raqam, bugungi faollik nuqtasi, eng uzun seriya), XP (yulduz, katta `tabular-nums` raqam, izoh), nishonlar (ikki ustun kenglikda, `ProgressBar` olingan/jami, qulflanganlar xira + qulf belgisi). Ekran o'quvchi uchun to'liq matnlar va `aria-label`lar saqlandi.
- i18n (uz/ru): `dashboard.streakLabel`, `dashboard.xpLabel`, `dashboard.xpHint`, `dashboard.badgesTitle`.
- Tekshiruv: lint, typecheck.

### Task 6: bosh panel hero
- `SubjectsPage`: tepada hero-karta — kun vaqtiga qarab salomlashuv (`lib/greeting.ts`, `student.greeting.*`), bugungi sana, sarlavha, izoh; o'ngda to'q "Davom ettirish" kartasi (bosqich SVG ikonkasi, mavzu, fan, "Davom etish →"). Davom ettirish yo'q bo'lsa — fan tanlashga undovchi matn. `fadeUp`/`stagger` bilan kirish.
- i18n (uz/ru): `student.greeting.*`, `student.heroText`, `student.startHint`, `student.continueCta`.
- Tekshiruv: lint, typecheck.

### Task 5: premium yuqori menyu
- `AppLayout`: shishasimon header (`backdrop-blur-xl`), gradient logo belgisi, ikonali tablar (`m.span layoutId` bilan suriladigan faol fon), talaba uchun seriya/XP chipi (`useDashboard`, `/app/results` ga havola), bosh harfli avatar (`lib/initials.ts`), ikonali "Chiqish"; `main` → `max-w-7xl`, sahifa tepasida yumshoq radial nur.
- `paths.ts`: `NavItem.icon` (ilova menyusi ikonkalari); `MobileMenu` ikonkalarni ko'rsatadi, `LanguageSwitch`/`navClass` yangi uslubda, yangi `appNavClass`.
- Tekshiruv: lint, typecheck.

### Task 4: umumiy uslublar
- Yangi `components/ui/styles.ts`: `SURFACE`, `SURFACE_LINK`, `PAGE_TITLE`, `SECTION_HEADING`, `EYEBROW`, `BACK_LINK`; `home/styles.ts` `EYEBROW`ni shu yerdan qayta eksport qiladi.
- `SpotlightCard` `features/public/home/` dan `components/ui/` ga ko'chirildi (ilova ham ishlatadi).
- Tekshiruv: lint, typecheck, build.

### Task 3: progress halqasi va chizig'i
- `ProgressRing`: gradient chiziq (`useId` bilan alohida gradient), kulrang iz, `tabular-nums`; 100% bo'lsa raqam o'rniga belgi (aria-label o'zgarmaydi).
- Yangi `ProgressBar` (gradient, `label` berilsa `role="progressbar"`, aks holda bezak).
- Tekshiruv: lint, typecheck.

### Task 2: UI primitivlar premium uslubda
- `Card`: `rounded-3xl`, `shadow-soft`, `ring-1` (border-2 o'rniga) — barcha sahifalarda.
- `button-classes.ts`: primary — gradient + `shadow-glow-sm` (yangi `@theme` soya), secondary — `ring-1` + `shadow-soft`, danger — `red-600` (AA kontrast), bosilganda `scale(0.98)`; border olib tashlandi, padding moslandi.
- `EmptyState`: gradient kvadrat ichida SVG ikonka (`IconName`; eski emoji ham ishlaydi, `isIconName`), yumshoq radial fon.
- Yangi `Skeleton` (yuklanish shakli, `motion-reduce`).
- Tekshiruv: lint, typecheck.

### Task 1: talaba paneli ikonkalari
- `components/icons/paths.ts`: `flame`, `star`, `medal`, `home`, `chart`, `chat`, `logout`, `chevronRight`, `chevronDown`, `arrowLeft`, `download`, `play`, `target`, `refresh`, `presentation`, `pencil`, `clipboard`, `glossary`, `library`, `bolt`, `folder`, `search`, `send`.
- `lib/steps.ts`: `STEP_ICON_NAMES` — bosqich turlari uchun SVG ikonka nomlari (emoji `STEP_ICONS` o'qituvchi muharririda qoladi).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Kirish va ro'yxatdan o'tish maydonlariga placeholder

- `LoginPage`/`RegisterPage`: barcha maydonlarda placeholder (email, parol, ism, telefon, parolni takrorlash).
- i18n `auth.placeholders.*` (uz/ru).
- `Field.tsx`: umumiy maydon uslubiga `placeholder:text-slate-400`.
- Tekshiruv: lint, typecheck.

## 2026-10-15 — Kirish va ro'yxatdan o'tish: premium dizayn

`/login` va `/register` bosh sahifa uslubidagi split-screen layoutga o'tadi (chapda to'q brand panel, o'ngda forma). Mantiq va backend o'zgarmaydi.

### Task 1: yangi ikonkalar
- `components/icons/paths.ts`: `lock`, `eye`, `eyeOff`.
- Tekshiruv: lint, typecheck.

### Task 2: ikonkali maydon, parol maydoni va kuch ko'rsatkichi
- `Field.tsx`: `Input` ixtiyoriy `icon` (chapda) va `trailing` (o'ngda) oladi; ularsiz avvalgidek.
- `PasswordInput`: qulf ikonka + ko'rsatish/yashirish tugmasi (`aria-pressed`).
- `lib/passwordStrength.ts` (0–4 ball, faqat ko'rsatish uchun) va `PasswordStrength` (4 segment, `aria-live`).
- i18n `auth.showPassword`, `auth.hidePassword`, `auth.strength.*` (uz/ru).
- Tekshiruv: lint, typecheck.

### Task 3: split-screen `AuthCard`
- `AuthCard`: `lg+` da ikki ustunli karta (`scaleIn`), yangi `subtitle` va `variant: 'login' | 'register'` proplari; telefonda faqat forma.
- `AuthAside`: to'q gradient panel (bloblar, katak), eyebrow, sahifaga mos sarlavha, 3 ta afzallik (`stagger`), institut nomi.
- `LoginPage`/`RegisterPage` yangi proplarni uzatadi.
- i18n `auth.aside.*`, `auth.login.subtitle`, `auth.register.subtitle`, `auth.register.pendingNote` (uz/ru).
- Tekshiruv: lint, typecheck.

### Task 4: yangi `RegisterPage`
- Maydonlarda ikonkalar (`user`, `mail`, `phone`), ikkala parolda `PasswordInput`, parol ostida `PasswordStrength`.
- Tugma oldida "administrator tasdiqlaydi" eslatmasi; gradient tugma o'q bilan.
- `authStyles.ts`: umumiy `AUTH_SUBMIT`, `AUTH_LINK`.
- Tuzatish: parol kuchi uchun `watch()` o'rniga `useWatch` (React Compiler ogohlantirishi).
- Tekshiruv: lint, typecheck.

### Task 5: yangi `LoginPage`
- Email maydonida `mail` ikonka, parolda `PasswordInput`, `RegisterPage` dagi kabi gradient tugma va havola uslubi.
- Tekshiruv: lint, typecheck.

### Task 6: `PublicLayout` da auth sahifalar foni
- `/login` va `/register` da `main` to'liq kenglikda: karta vertikal markazda, orqasida yumshoq `brand-50` gradient va niqoblangan katak.
- Tekshiruv: lint, typecheck, build.

### Task 7: `PendingPage` ham shu uslubda
- `PendingPage` endi `AuthCard` (`variant="pending"`) ichida: matn, 3 bosqichli holat ro'yxati (ro'yxatdan o'tildi → admin tasdig'i → to'liq kirish), gradient "Holatni tekshirish" tugmasi, "Chiqish" pastki havola sifatida; "hali tasdiqlanmagan" xabari amber blokda. Mantiq o'zgarmaydi.
- `AuthAside`/`AuthCard`: `pending` varianti; `PublicLayout`: `/pending` ham auth foniga ega.
- i18n `auth.aside.pendingTitle`, `auth.aside.pendingText`, `pending.subtitle`, `pending.steps.*` (uz/ru).
- Tekshiruv: lint, typecheck, i18n kalitlar testi.

## 2026-10-15 — Yangi talabalar haqida adminga bildirish

Ro'yxatdan o'tgan talaba `pending` bo'ladi; endi kutayotganlar soni admin kiradigan joylarda ko'rinadi. Backend o'zgarmaydi (`GET /api/admin/users?status=pending`).

### Task 1: kutayotganlar soni uchun hook
- `api/admin.ts`: `usePendingUsersCount()` (har 60 s yangilanadi, `AdminUsersPage` keshi bilan umumiy); `useAdminUsers` ixtiyoriy `enabled`/`refetchInterval` oladi.
- Tekshiruv: lint, typecheck.

### Task 2: admin menyusida badge
- `AdminLayout`: "Foydalanuvchilar" yonida tasdiq kutayotganlar soni (sidebar `Badge`, telefonda `Select` ichida "(N)"); sr-only matni yo'lga qarab.
- i18n `admin.users.pendingCount` (uz/ru).
- Tekshiruv: lint, typecheck.

### Task 3: bosh sahifada kutayotgan talabalar kartasi
- `TeachHomePage`: admin uchun "Tasdiq kutayotgan talabalar: N ta" kartasi → `/admin/users` (o'qituvchi rolida so'rov yuborilmaydi); karta uslubi `NoticeLink` ga ajratildi, `PendingReviews` ham undan foydalanadi.
- i18n `teach.pendingStudents` (uz/ru).
- Tekshiruv: lint, typecheck, i18n kalitlar testi.

## 2026-10-15 — Bitta o'qituvchi = admin: soddalashtirish

Saytdan faqat talabalar va bitta o'qituvchi foydalanadi, u admin ham (bitta `admin` akkaunt). Backend o'zgarmaydi, faqat ortiqcha UI olib tashlanadi.

### Task 2: fanga o'qituvchi biriktirish UI olib tashlandi
- `AdminSubjectsPage`: "O'qituvchilar" tugmasi va biriktirilganlar qatori yo'q; `TeachersModal.tsx` o'chirildi.
- `api/admin.ts`: `useTeachers`, `useSetTeachers`, `adminKeys.teachers` olib tashlandi; i18n kalitlari (`admin.subjects.teachers/teachersTitle/noTeachers/noAssigned`) uz/ru dan olib tashlandi.
- Backend `PUT /api/admin/subjects/{id}/teachers` va `teacher_ids` qoldi (admin hamma fanni baribir tahrirlaydi).
- Unit test: biriktirish testi olib tashlandi.
- Tekshiruv: lint, typecheck.

### Task 3: kitoblar bitta admin sahifasida
- `/admin/books`: "Kitob yuklash" tugmasi (mavjud `BookUploadModal`, admin kitobi darhol tasdiqlanadi); standart tab "Tasdiqlanganlar", "Tasdiq kutayotganlar" ikkinchi tab.
- Menyu: "Kitoblarim" (`/teach/books`) faqat `teacher` roliga; admin ko'rmaydi (marshrut qoldi).
- `adminBooks.subtitle` matni uz/ru yangilandi.
- Tekshiruv: lint, typecheck, build.

### Task 4: foydalanuvchilar sahifasida rol tanlash yo'q
- `AdminUsersPage`: rol `Select` olib tashlandi; talaba bo'lmagan foydalanuvchida (admin, eski o'qituvchi) faqat rol belgisi ko'rinadi. Sahifada tasdiqlash, bloklash va vaqtinchalik parol qoldi.
- i18n `admin.users.roleFor` uz/ru dan olib tashlandi; backend `PATCH /api/admin/users/{id}` `role` maydoni qoldi (yangi admin — `create-admin` CLI orqali).
- Unit test: rol o'zgartirish testi olib tashlandi, o'z akkaunti testi rol belgisini tekshiradi.
- Tekshiruv: lint, typecheck.

### Task 5: o'qituvchi/admin menyusi ixchamroq
- `paths.ts: navLinksFor`: o'qituvchi va admin uchun ish bo'limlari oldinda (Mavzu muharriri, Tekshirish, Statistika, Boshqaruv), oxirida bitta "Talaba ko'rinishi" (`/app`). "AI repetitor" yuqori menyudan olindi (pleyerdagi `TutorDock` va `/app/tutor` marshruti qoldi). Admin menyusi 6 tadan 5 ta havolaga tushdi. Talaba menyusi o'zgarmadi.
- i18n: `nav.studentView` (uz/ru); `AppLayout.test` yangi havolani tekshiradi.
- Tekshiruv: lint, typecheck, build.

### Task 1: admin bosh sahifasi `/teach`
- `paths.ts: homePathFor` admin uchun `/admin/users` o'rniga `/teach` (kirish, `RedirectIfAuthed`, noto'g'ri rol yo'naltirishi shu orqali).
- Tekshiruv: lint, typecheck.

## 2026-10-15 — AI: almashtiriladigan provayder va lokal embedding

Gemini'ning bepul limiti kam: matn asosan OpenAI'ga mos API'da (Groq/Cerebras/OpenRouter), Gemini zaxirada; embedding lokal `multilingual-e5-base` (TEI konteyneri).

### Task 3: hujjatlar va deploy eslatmalari
- `CLAUDE.md`: AI provayderlari bandi (compat/gemini, zaxira, TEI embedder, yangi sozlama nomlari, eskirgan chunk'lar va chegaralarni kalibrlash).
- Phase-3 spec: provayder, model va limit qatorlari yangi nomlarga.
- Phase-4 spec 8-bo'lim (4C): `embeddings` konteyneri (TEI CPU image, model volume, ichki tarmoq, ~1–1.5 GB RAM, server kamida 4 GB, birinchi ishga tushirishdan keyin qayta indekslash).
- Roadmap: 12-band (bajarildi, ochiq masalalar: chegaralarni kalibrlash, serverni O'zbekistonda joylash).

### Task 2: lokal embedding (TEI, multilingual-e5-base)
- `providers.TeiEmbeddingProvider`: `POST {TEI_URL}/embed` (32 tadan, `normalize`/`truncate`), e5 prefikslari `query: ` / `passage: `, o'lcham `EMBEDDING_DIM` (768) bilan tekshiriladi — migratsiya kerak emas.
- Sozlamalar: `EMBEDDING_PROVIDER=gemini|tei`, `TEI_URL`, `TEI_MODEL`; embedding matn provayderidan mustaqil tanlanadi, `tei` bo'lsa Gemini kaliti shart emas.
- Model nomi chunk'larda saqlangani uchun almashtirilganda eski chunk'lar eskirgan deb ko'rinadi; admin sahifasidagi "Qayta indekslash" yangilaydi.
- `.env.example`: TEI va e5 uchun o'xshashlik chegaralari (kalibrlash kerak) izohi.
- Tekshiruv: ruff, mypy o'tdi; `build_ai` compat+tei -> `TeiEmbeddingProvider`, `configured=True`; soxta HTTP bilan 70 matn 32+32+6 partiyada, prefikslar va normalizatsiya to'g'ri.

### Task 1: OpenAI'ga mos asosiy provayder, Gemini zaxira
- `providers.GroqProvider` -> `OpenAICompatProvider(base_url, ...)`: istalgan `/chat/completions` API (`LLM_BASE_URL`).
- `AI_PROVIDER=compat|gemini|fake`: asosiy matn provayderi; ikkinchisining kaliti bo'lsa `FallbackProvider` orqali zaxira (modellar juftlab almashtiriladi). `AiServices.chat_model/fast_model` asosiy provayderdan.
- Sozlamalar nomlari: `AI_MODEL_*`/`AI_EMBEDDING_MODEL`/`AI_RPM` -> `GEMINI_*`, `GROQ_*` -> `LLM_*` (`.env.example`, lokal `.env` ham). `ai_configured`: asosiy provayder kaliti va embedding bo'lishi kerak.
- Admin: `provider` endi `compat+gemini` / `gemini+compat`, `chat_model` haqiqiy asosiy model.
- Tekshiruv: ruff, mypy o'tdi; `build_ai` 5 kombinatsiyada (fake, compat+gemini, faqat compat, gemini+compat, kalitsiz) to'g'ri provayder, model xaritasi va `configured`.

## 2026-10-15 — import: tayyor PDF va yangi fayl formatlari

Foydalanuvchi materiallarni o'zi tayyorladi: 2) va 7) uchun PDF, barcha matnli fayllar `.docx`. Avvalgi chala import natijasi (2 fan, 51 mavzu, 96 material, `media/` fayllari) lokal dev bazadan o'chirildi.

### Task 4: krossvord — bir necha so'zli javoblar
- `crossword.normalize_word`: bo'sh joy va chiziqcha (`SEPARATORS`) tashlanadi, "Oziqa eritmasi" -> `OZIQAERITMASI`. Ilgari bunday so'zlar rad etilardi (import ularni tashlab yuborardi, o'qituvchi esa `CROSSWORD_INVALID_WORD` olardi).
- Resurs: lab 14 krossvordiga mavzuga doir 6 so'z qo'shildi (Antagonizm, Sinergizm, Koleoptil, Gidratatsiya, Bidistillat, Nihol); eski 5 savol bilan birga 11 so'z to'rga joylashadi.
- Tekshiruv: ruff, mypy o'tdi; `_prepare_crossword` lab 14 ning 11 so'zini joyladi.

### Task 3: test variantlarini aralashtirish
- `assessment/options.py: option_order(user_id, question_id, n)`: har talaba va savol uchun deterministik tartib (saqlanmaydi; bazada o'qituvchi tartibi qoladi).
- `views.activity_views`: variantlar talabaga shu tartibda; `attempts.grade(..., user_id)`: javob ko'rsatilgan tartibdagi indeks deb baholanadi, urinish `result`i (variantlar, `given`, `correct`) ham shu tartibda — natija sahifasi talaba ko'rgan tartibni ko'rsatadi. Frontend o'zgarmadi.
- Sabab: import qilingan ko'p testlarda to'g'ri javob doim `A` edi.
- `CLAUDE.md`: `attempts.py` bandi.
- Tekshiruv: dev bazadagi 60 test × 2 foydalanuvchi — ko'rsatilgan tartib bo'yicha 1490/1490 to'g'ri, siljitilgan javoblar 0 ta to'g'ri; to'g'ri javob o'rni A/B/C/D: 355/399/352/384. ruff, mypy o'tdi.

### Task 2: import — tayyor PDF materiallar
- `resource_parse.topic_files`: `2)`/`7)` raqamli `.pdf` `lecture_pdf`/`presentation_pdf` kalitlariga yoziladi (matn esa DOC/DOCX'dan o'qilishda davom etadi); `dastur` papkasida PDF DOC/DOCX'dan ustun.
- `resource_import._add_material`: PDF manba konvertatsiyasiz darhol `ready` (sahifalar `count_pages`, buzilgan bo'lsa `failed`/`INVALID_PDF`), keyin AI indeksi; PDF bo'lmasa avvalgidek `convert_material_job`.
- LibreOffice faqat kerak bo'lganda talab qilinadi (`_needs_soffice`: .doc matn, PDF'siz material, DOC/DOCX o'quv dasturi). `--dry-run` har mavzu uchun `pdf=2,7` ko'rsatadi.
- `CLAUDE.md`: import bandi yangilandi.
- Tekshiruv: ruff, mypy o'tdi; `--dry-run` 60 mavzuda PDF topdi (45 tasida 2 va 7, 15 labda 2); vaqtinchalik bazaga 1 mavzu noto'g'ri `SOFFICE_PATH` bilan import qilindi — 2 material PDF'dan `ready`.

### Task 1: parser — prefikssiz javob kaliti, lab sarlavhasi
- `resource_parse.parse_quiz`: `Javoblar:` so'zisiz kalit ham taniladi: faqat `raqam–harf` juftlaridan iborat qator (`1–B 2–A`, `1 — b; 2 — a.`, har juft alohida qatorda `1-B`).
- `parse_title`: birinchi qator faqat `1-LABORATORIYA MASHG'ULOTI` kabi sarlavhasiz bo'lsa, sarlavha keyingi qatordan olinadi.
- Tekshiruv: `--dry-run` "O'simliklar fiziologiyasi" uchun 30/30 test (avval 0) va 15 ta lab sarlavhasini ko'rsatdi; ruff, mypy o'tdi.

## 2026-10-14 — `resource/` materiallarini import qilish

Reja: `~/.claude/plans/loyihada-resource-papka-bor-snug-pine.md`.

### Task 9: admin — o'quv dasturi
- `api/admin.ts`: `useUploadSyllabus()` (`PUT`, `FormData`), `useDeleteSyllabus()`; ikkalasi admin va talaba keshlarini yangilaydi.
- `AdminSubjectsPage`: har fan qatorida `SyllabusControls` — dastur nomi yoki "yuklanmagan", yuklash/almashtirish (PDF/DOC/DOCX, yashirin `input`), o'chirish.
- i18n: `admin.subjects.syllabus*`, `errors.SYLLABUS_NOT_FOUND`, `errors.CONVERSION_FAILED|CONVERSION_TIMEOUT|LIBREOFFICE_NOT_FOUND` (uz + ru).
- Tekshiruv: typecheck, lint, build o'tdi.

### Task 8: o'qituvchi — mavzu turi
- `TopicDetailsForm`: "Mashg'ulot turi" `Select` (`LESSON_TYPES`), `topicSchema`ga `lesson_type`. Saqlanganda talaba keshlari ham yangilanadi (mavjud `useUpdateTopic`).
- `TeachHomePage`: ma'ruza bo'lmagan mavzular qatorida tur `Badge`i.
- i18n: `teach.topicLessonType` (uz + ru).
- Tekshiruv: typecheck, lint o'tdi.

### Task 7: talaba fan sahifasi — mashg'ulot turlari va o'quv dasturi
- `SubjectPage`: mavzular `lesson_type` bo'yicha guruhlanadi (Ma'ruzalar → Amaliy → Seminar → Laboratoriya, har biri `h2` bilan); bitta tur bo'lsa sarlavhasiz, avvalgidek. Karta `TopicPath` komponentiga ajratildi, yorliq turga qarab (`student.topicLabel.*`: "1-ma'ruza", "2-seminar"...; avvalgi "1-mavzu" o'rniga).
- `syllabus_name` bo'lsa "O'quv dasturi" tugmasi (`useProtectedDownload`, `/api/subjects/{slug}/syllabus`).
- `lib/lessonType.ts: LESSON_TYPES`; i18n: `lessonType.*`, `student.syllabus`, `student.lessonGroups.*`, `student.topicLabel.*` (uz + ru).
- Tekshiruv: typecheck, lint o'tdi. `SubjectPage.test.tsx` "1-mavzu" yorlig'iga tayansa, testlar ishga tushirilganda yangilanadi.

### Task 6: CLAUDE.md
- Commands: `import-resources`; Architecture (backend): `syllabus.py`, `resource_parse.py`/`resource_import.py` va `resource/` tuzilmasi.

### Task 5: `import-resources` buyrug'i
- `app/learning/resource_import.py` + `python -m app.cli import-resources --path <papka> [--force] [--dry-run]`. Fan slug bo'yicha, mavzu (fan, `lesson_type`, sarlavha) bo'yicha topiladi: mavjudi o'tkazib yuboriladi, `--force` — o'chirib qayta import. Hammasi nashr qilinadi.
- Mavzu: ma'ruza matni → `lecture`, o'yin → `presentation` materiali (navbatsiz, ketma-ket `convert_material_job` — bir vaqtda o'nlab LibreOffice jarayoni ishga tushmaydi), krossvord → `review`, test → `practice` (joylab bo'lmagan krossvord so'zlari tashlanib qayta uriniladi), topshiriq (`both`, 10 ball), glossariy, adabiyotlar; so'ng AI indekslari (xatosi importni to'xtatmaydi).
- O'quv dasturi: `Subject.syllabus` + kutubxona `metodik` bo'limida "O'quv dasturlari" papkasiga hujjat.
- LibreOffice topilmasa haqiqiy import to'xtaydi (`--dry-run` ishlaydi). `convert._resolve_soffice` → `resolve_soffice`.
- Tekshiruv: ruff, mypy o'tdi. `--dry-run`: 2 fan, 60 mavzu (Biologiya to'liq; Fiziologiya `.doc` — LibreOffice yo'q). Vaqtinchalik bazada Biologiya importi: 30 mavzu, 30 test, 30 krossvord, 30 topshiriq, 300 atama, 150 adabiyot; ikkinchi ishga tushirishda 30 tasi o'tkazib yuborildi.

### Task 4: `resource/` parserlari
- `app/learning/resource_parse.py`: `scan()` — fan → bo'lim (kalit so'z bo'yicha `lesson_type`, `dastur` papkasi → o'quv dasturi) → mavzu papkalari (raqam bo'yicha; fayllar `N)` prefiksi bilan aniqlanadi, bitta ichki papka ham o'qiladi). Parserlar: `parse_title` (KATTA harfli sarlavha → oddiy), `parse_quiz` (`Javoblar:` kaliti), `parse_crossword` (`N. (H): savol` + `N. So'z`, yaroqsiz/takror so'zlar tashlanadi), `parse_glossary`, `parse_literature` (muallif, yil, URL), `parse_task`. `.doc` avval LibreOffice bilan `.docx`ga o'giriladi.
- `convert.py`: umumiy `convert_to(source, out_dir, fmt)`; `convert_to_pdf` uni chaqiradi.
- Tekshiruv: ruff, mypy o'tdi; `scan()` 60 mavzu topdi (30 + 30). Biologiya `.docx` fayllarida har bir mavzu: 10 test, 7–14 krossvord so'zi, 10 atama, 5 adabiyot. Fiziologiya `.doc` fayllari LibreOffice yo'qligi sababli hali tekshirilmadi.

### Task 3: frontend API turlari
- `npm run gen:api` — `schema.gen.ts` yangilandi; `types.ts`: `LessonType`, `lesson_type` (`TopicCard`, `TopicDetail`, `TopicEditor`, `TeachTopicBrief`, `TopicCreate`), `syllabus_name` (`SubjectDetail`, `SubjectAdmin`).
- Test fixture'lari yangi maydonlar bilan to'ldirildi (faqat typecheck uchun; testlar ishga tushirilmadi).
- Tekshiruv: typecheck, lint o'tdi.

### Task 2: fanning o'quv dasturi (`Subject.syllabus`)
- `Subject.syllabus_pdf`, `syllabus_name` (migratsiya `f2dac920e580`); `SubjectAdminOut` va `SubjectDetailOut` da `syllabus_name` (null — dastur yo'q).
- `app/learning/syllabus.py`: PDF/DOC/DOCX qabul qilinadi, DOC/DOCX so'rov ichida PDF'ga o'giriladi (rejadan farqi: fon ishi va `processing` holati yo'q, faqat PDF saqlanadi). `attach_syllabus()` diskdagi fayl bilan ham ishlaydi (import uchun).
- Endpointlar: `PUT/DELETE /api/admin/subjects/{id}/syllabus`, `GET /api/subjects/{slug}/syllabus` (faol foydalanuvchi; nashr qilinmagan fan — faqat tahrirlovchilar). Fan o'chirilganda dastur fayli ham o'chadi.
- Tekshiruv: `alembic upgrade head`, `alembic check`, ruff, mypy o'tdi.

### Task 1: mavzu turi (`lesson_type`)
- `Topic.lesson_type` (`LessonType`: `lecture`, `practical`, `seminar`, `lab`; standart `lecture`), migratsiya `6771fa5f102b`.
- `TopicCreate/Update`, `TopicEditorOut`, `TeachTopicBrief`, `TopicCard`, `TopicDetailOut` maydonni qabul qiladi/qaytaradi.
- Tekshiruv: `alembic upgrade head`, `alembic check`, ruff, mypy o'tdi.

## 2026-10-14 — Landing: zebra fonlar, footer chegarasidagi CTA

Reja: `~/.claude/plans/landing-pageni-sectionlarini-zebra-zippy-spark.md`.

### Task 3: CTA footer chegarasida
- `CtaSection`: bo'limning pastki yarmi `brand-950` — panel oq fon bilan footer chegarasida turadi; FAQ bilan oradagi bo'shliq qisqardi (`pt-4 sm:pt-8`), to'q fonda cheti ko'rinishi uchun `ring-white/10`.
- `SiteFooter`: `flush` prop — tepa chegara bezagi (`edge`: hairline va nur) chiqmaydi, kontent tepadan `pt-20`; `PublicLayout` uni faqat bosh sahifada beradi.
- Tekshiruv: lint, typecheck, build o'tdi; `/` 1280px va 375px da ko'rildi — zebra ritmi, to'q bo'lim kontrasti, CTA→footer choksiz, gorizontal scroll yo'q.

### Task 2: "Qanday ishlaydi" — to'q bo'lim
- `HowItWorksSection`: fon `brand-950` (footer rangi). Bezak footer'ning A temasidan: tepada nur, xira katak, tepa va pastda yorug' hairline. Matnlar `text-white` / `text-brand-100/75`, bog'lovchi chiziq asosi `bg-white/15`, to'lish `brand-300→500`, ikonka halqasi `ring-brand-950`.
- `styles.ts`: `EYEBROW_DARK`, `SECTION_TITLE_DARK`.
- Tekshiruv: lint, typecheck o'tdi.

### Task 1: och zebra fonlari
- Bosh sahifa bo'limlari endi body rangiga tayanmaydi: Hero `bg-white` (pastki so'nish ham oqqa), Features va Explore `bg-brand-50/60` (tepada `via-brand-100` hairline), News `bg-white` va o'z pastki bo'shlig'i bilan (`py-20 sm:py-24`), FAQ oq.
- Tekshiruv: lint, typecheck o'tdi.

## 2026-10-14 — Landing: demo kontent, boyitilgan footer, footer ranglari

Reja: `~/.claude/plans/demo-news-bilan-tez-jazzy-sunrise.md`.

### Header menyusi o'ngga surildi
- `PublicLayout`: `lg+` dagi menyu havolalari logo yonida emas, o'ng tomonda (til almashtirgich va tugmalar oldida) — `justify-end`.
- Tekshiruv: lint, typecheck o'tdi.

### Menyudan "Bosh sahifa" olib tashlandi
- `paths.ts: PUBLIC_NAV` dan `/` bandi o'chirildi (bosh sahifaga logo orqali o'tiladi) — header, mobil menyu va footerdagi "Bo'limlar" ustuniga taalluqli; i18n `nav.home` (uz/ru) o'chirildi.
- Tekshiruv: lint, typecheck o'tdi; 1280px da menyu ko'rildi.

### Task 5: footer rangi — A (chuqur teal)
- `SiteFooter`: `FOOTER_THEME = 'a'` doimiy; B va C `THEMES` ichida zaxira sifatida qoldi (almashtirish — bitta konstanta). Vaqtinchalik `?footer=` switch o'chirildi.
- Tekshiruv: lint, typecheck, build o'tdi.

### Task 4: footer rang variantlari (vaqtinchalik)
- `SiteFooter`: `THEMES` — A (chuqur teal `brand-950` + nur, CTA panelining davomi), B (yorug' oq→`brand-50` gradient, katak naqsh), C (teal→slate→sky gradient, bloblar). `?footer=a|b|c` bilan almashtiriladi, standart — A. Tanlovdan keyin bittasi qoladi, switch o'chiriladi.
- Tekshiruv: lint, typecheck o'tdi; `seed-demo` ma'lumoti bilan `/` da yangiliklar, FAQ va footer ko'rindi; 1280px da uchala variant, 375px da C — gorizontal scroll yo'q.

### Task 3: footer boyitildi
- `SiteFooter`: 5 ustun — brend + ijtimoiy tarmoqlar; Bo'limlar; Platforma (Kirish/Ro'yxatdan o'tish yoki Kabinet, kutubxona bo'limlari); So'nggi yangiliklar (3 ta, sana bilan; `NewsSection` bilan umumiy kesh); Kontaktlar (telefon, email, ish vaqti, manzil + "Xaritada ko'rish"). Pastki qatorda FAQ, Bog'lanish, Sayt xaritasi havolalari va "Yuqoriga".
- Ranglar `THEME` tokenlariga ajratildi (keyingi vazifada variantlar uchun). Ikonkalar: `clock`, `externalLink`. i18n: `footer.platform|latestNews|map|sitemap` (uz/ru).
- Tekshiruv: lint, typecheck o'tdi.

### Task 2: kontaktlarda "Ish vaqti"
- `cms/schemas.py: Contacts.hours` (≤100 belgi; JSON ustun, migratsiya shart emas). Admin "Sayt sozlamalari" formasida yangi maydon, `/contact` sahifasida ko'rsatiladi; demo ma'lumotga ham qo'shildi.
- `types.ts`, `schema.gen.ts` (`gen:api`), i18n `adminSite.hours` (uz/ru).
- Tekshiruv: ruff, mypy, lint, typecheck o'tdi.

### Task 1: `seed-demo` CLI
- `app/cms/demo.py`: 6 ta demo yangilik (oxirgi 1–30 kun), 8 ta FAQ, sayt sozlamalari (kontaktlar, ijtimoiy tarmoqlar, "Biz haqimizda"). Qayta ishga tushirish xavfsiz (slug/savol bo'yicha o'tkazib yuboradi); `--force` sayt sozlamalarini almashtiradi.
- `python -m app.cli seed-demo [--force]`; `CLAUDE.md` buyruqlar ro'yxatiga qo'shildi.
- Tekshiruv: ruff, mypy o'tdi; lokal bazada 1-marta 6/8/3, 2-marta 0/0/0 qo'shildi.

---

## 2026-10-14 — Bosh sahifa redizayni (premium, animatsiyali UI)

intertalim.uz tuzilmasi asosida ochiq sayt bo'limlari (navbar, hero, xususiyatlar, "qanday ishlaydi", FAQ, CTA, footer) qayta chiziladi. Reja: `~/.claude/plans/serene-puzzling-fox.md`.

### Redizayn Task 11: sayqal va hujjatlar
- `LazyMotion strict` (`main.tsx`): barcha komponentlar `motion.*` → `m.*`; animatsiya imkoniyatlari (`domMax`, `layoutId` uchun) alohida chunk — `lib/motionFeatures.ts`. Asosiy bundle gzip 322.5 → 302.5 KB, `motionFeatures` 28.3 KB keyin yuklanadi.
- `index.css`: chop etishda hali ko'rinmagan (`whileInView`) bo'limlar ham chiqadi.
- `CLAUDE.md`: frontend arxitekturasiga "Motion (public site)" bandi.
- Tekshiruv: lint, typecheck, build o'tdi; 375/768/1280px da gorizontal scroll yo'q, scroll qilinganda barcha bo'limlar ochiladi; `prefers-reduced-motion: reduce` da kontent darhol ko'rinadi; `/faq` yangi accordion bilan ishlaydi. Vitest/E2E ishga tushirilmadi (loyiha qoidasi: testlar oxirida) — `PublicLayout.test`/FAQ testlari yangi markupga moslashtirilishi kerak bo'lishi mumkin.

### Redizayn Task 10: footer
- `SiteFooter`: to'q fon (`slate-950`) va yuqori chetida gradient chiziq; ustunlar — `BrandLogo` + tagline + ijtimoiy tarmoqlar (SVG ikonka tugmalar, `aria-label` bilan), Bo'limlar, Kutubxona (3 bo'lim), Kontaktlar (telefon/email/manzil SVG ikonkalar bilan). Pastki qatorda © va "Yuqoriga" tugmasi (silliq scroll).
- Avvalgi mantiq saqlandi: kontakt yoki ijtimoiy tarmoq kiritilmagan bo'lsa, ular chiqmaydi. i18n: `footer.toTop` (uz/ru).
- Tekshiruv: lint, typecheck o'tdi; 1280px va 375px da `/api/site` mock bilan ko'rildi, gorizontal scroll yo'q.

### Redizayn Task 9: "Ta'limingizni yangi bosqichga olib chiqmoqchimisiz?"
- `home/CtaSection.tsx`: to'q teal gradient panel (ko'rinishga kirganda kattalashib ochiladi), ichida suzuvchi bloblar, katak naqsh va ustidan o'tib turadigan yaltiroq chiziq (`animate-shine`, reduced-motion'da yashirin). "Boshlash" (`/register`, kirganga — kabinet) va "Bog'lanish" (`/contact`) tugmalari.
- i18n: `home.cta.*` (uz/ru).
- Tekshiruv: lint, typecheck o'tdi; 1280px da ko'rildi.

### Redizayn Task 8: FAQ
- Umumiy `components/ui/FaqAccordion.tsx`: `button` + `aria-expanded`/`aria-controls`, javob balandligi `AnimatePresence` bilan ochiladi, "+" aylanib "×" ga aylanadi, ochiq savol ajralib turadi. `/faq` sahifasi ham shunga o'tdi (`<details>` o'rniga).
- `home/FaqSection.tsx` (`#faq`): chapda sarlavha (`lg` da sticky), "Barcha savollar →" va "Bizga yozing"; o'ngda CMS'dagi (`useFaq`) birinchi 6 savol. Ro'yxat bo'sh yoki xato bo'lsa bo'lim chiqmaydi.
- i18n: `home.faq.*` (uz/ru).
- Tekshiruv: lint, typecheck o'tdi; 1280px da Playwright mock bilan (7 savol → 6 tasi chiqadi, accordion ochiladi) va yangiliklar bloki ham mock bilan ko'rildi.

### Redizayn Task 7: yangiliklar, kutubxona va AI repetitor bloklari
- `home/NewsSection.tsx`: yorliq + sarlavha, "Barcha yangiliklar →", 3 ta `NewsCard` stagger va hover ko'tarilishi bilan; yangilik bo'lmasa bo'lim chiqmaydi.
- `home/ExploreSection.tsx`: Kutubxona kartasi (3 bo'lim havolasi SVG ikonkalar va strelka bilan) va to'q gradient AI repetitor kartasi (suzuvchi blob, oq CTA).
- `HomePage` endi faqat bo'limlarni yig'adi. i18n: `home.newsEyebrow`, `home.exploreLabel` (uz/ru).
- Tekshiruv: lint, typecheck o'tdi; 1280px da ko'rildi (lokal bazada yangilik yo'q — yangiliklar bloki vizual tekshirilmadi).

### Redizayn Task 6: "Platforma qanday ishlaydi"
- `home/HowItWorksSection.tsx` (`#how-it-works`): 4 qadam — ro'yxatdan o'tish, administrator tasdig'i, fan va mavzuni tanlash, 7 bosqich va XP. Gradient raqamli ikonkalar; ularni bog'lovchi chiziq scroll bilan to'ladi (`useScroll` + `useSpring`; `lg` da gorizontal, telefonda vertikal).
- i18n: `home.how.*` (uz/ru).
- Tekshiruv: lint, typecheck o'tdi; 1280px da ko'rildi.

### Redizayn Task 5: platforma xususiyatlari
- `home/FeaturesSection.tsx` (`#features`): sarlavha bloki va 4 ustunli bento grid, 6 karta — 7 bosqichli mavzular (bosqichlar chiplari bilan), dars pleyeri, test/ha-yo'q/krossvord, XP va nishonlar, AI repetitor (namuna savol-javob pufakchalari bilan), ochiq kutubxona. Kartalar stagger bilan paydo bo'ladi.
- `home/SpotlightCard.tsx`: kursorni kuzatuvchi yorug'lik dog'i, hoverda ko'tarilish va ikonka aylanishi.
- Hero foni pastga qarab silliq so'nadi (keskin chegara yo'q). i18n: `home.featuresSection.*`, `home.features.*` (uz/ru); eski `language` kartasi chipga o'tgan.
- Tekshiruv: lint, typecheck o'tdi; 1280px da ko'rildi.

### Redizayn Task 4: hero bo'limi
- `features/public/home/HeroSection.tsx`: fonda suzuvchi gradient bloblar va nozik katak; pulslanuvchi badge; sarlavha so'zma-so'z (blur + yuqoriga) ochiladi, oxirgi qismi gradient matnda; "Boshlash"/"Kirish" (kirganga — "Kabinetga o'tish") tugmalari; 3 ta fakt chipi; "Pastga" ko'rsatkichi.
- `HeroMockup.tsx` (bezak, `aria-hidden`): mavzu kartasida 7 bosqich ketma-ket belgilanadi, progress chizig'i o'sadi, atrofida "+10 XP", "Yangi nishon", "AI: savol bering" kartalari suzadi.
- `home/styles.ts`: bosh sahifa CTA va sarlavha klasslari. i18n: `home.hero.*` (uz/ru), eski `home.badge/title/subtitle` o'chirildi.
- Tekshiruv: lint, typecheck, build o'tdi; 1280px va 360px da ko'rildi, gorizontal scroll yo'q. Bundle: gzip 270.6 → 322.5 KB (`motion`).

### Redizayn Task 3: bosh sahifa uchun to'liq kenglik
- `PublicLayout`: `/` da `main` konteynersiz (`useMatch`), bosh sahifa bo'limlari to'liq kenglikdagi fon oladi va konteynerni o'zi qo'yadi. Boshqa ochiq sahifalar o'zgarmadi.
- Tekshiruv: lint, typecheck o'tdi.

### Redizayn Task 2: navbar
- `PublicLayout` header'i: shaffof glass fon, scroll boshlanganda (`useScroll`) soya va kichikroq balandlik; faol menyu bandi ostida siljiydigan "pill" (`layoutId`); "Ro'yxatdan o'tish"/"Kabinet" — gradient tugma.
- Yangi `BrandLogo` (gradient "T" belgisi + nom), footer'da ham ishlatiladi.
- `MobileMenu`: ☰/✕ SVG ikonka aylanib almashadi, panel va fon `AnimatePresence` bilan ochiladi/yopiladi, bandlar stagger bilan. API o'zgarmadi (`AppLayout` ham ishlatadi).
- Tekshiruv: lint, typecheck o'tdi.

### Redizayn Task 1: animatsiya poydevori
- `motion` 14.2.0 paketi; butun ilova `MotionConfig reducedMotion="user"` ichida (`main.tsx`).
- `index.css`: `brand-300/400/800/950` ranglari, `shadow-glow`/`shadow-soft`, `blob-float`/`shine`/`float-y` keyframes, `bg-grid` va `text-gradient` utility'lari.
- `lib/motion.ts` (`fadeUp`, `scaleIn`, `stagger`, `withDelay`, `VIEWPORT_ONCE`), `components/motion/Reveal.tsx` (ekranga kirganda paydo bo'lish).
- `components/icons/` — inline SVG ikonkalar (`Icon name=...`), emoji o'rniga.
- Tekshiruv: lint, typecheck, build o'tdi.

---

## 2026-10-14 — 4B (frontend)

### 4B Task 10: yakun va qo'lda tekshiruv
- `npm run gen:api` — `schema.gen.ts` farqsiz.
- Qo'lda tekshiruv alohida toza backend'da (`e2e/start-backend.mjs`, port 8011) va vite'da (5174, `API_PROXY_TARGET`): o'qituvchi kitob yukladi → admin faylni ochdi va tasdiqladi → mehmon katalogda ko'rdi va yuklab oldi; admin papka va hujjat qo'shdi (bo'sh bo'lmagan papkani o'chirish — `FOLDER_NOT_EMPTY` toast) → mehmon yuklab oldi; yangilik yaratildi va nashr qilindi (bosh sahifada, `<script>` chizilmaydi, title/OG to'g'ri, sitemap'da); FAQ, kontaktlar, ijtimoiy tarmoqlar (`http://` rad etiladi); mehmon RU tilida xabar yubordi → admin "Xabarlar (1)" da ko'rdi. 375px da 15 ta ilova/admin sahifasi va ochiq sahifalarda gorizontal scroll yo'q.
- Tekshiruvda topilgan tuzatishlar: ilova header'i 360px da 27px chiqib ketardi — telefonda "Chiqish" ☰ menyuga ko'chirildi; `uz` lokalida ba'zi brauzerlar oy nomini "M10" deb chiqaradi — `formatDate`/`formatDateTime` o'zbekcha oy nomlarini qo'lda yig'adi (admin yangiliklar va xabarlar ham shundan foydalanadi); footer © qatoriga yon chekinish.
- Kuzatuv (backend, tuzatilmadi): yangilik `excerpt` markdown/HTML belgilarini to'liq tozalamaydi (`<scriptalert(1)</script` matn sifatida description'ga tushadi — xavfsiz, lekin xunuk).
- `CLAUDE.md`: loyiha holati (4B qurilgan) va frontend arxitekturasiga "Public site and CMS" bandi; roadmap: 4B ✅, keyingisi 4C rejasi.
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 9: admin xabarlar va sayt sozlamalari
- `AdminMessagesPage` (`/admin/messages`): "faqat o'qilmaganlar" filtri, xabar kartasi (kontakt email bo'lsa `mailto:`, telefon bo'lsa `tel:`), o'qilgan/o'qilmagan, o'chirish. Admin menyusida "Xabarlar" yonida o'qilmaganlar soni.
- `AdminSitePage` (`/admin/site`): uchta alohida forma — kontaktlar, ijtimoiy tarmoqlar (faqat `https://`), "Biz haqimizda" (markdown + ko'rinish); har biri faqat o'z kalitini `PUT` qiladi, ochiq sayt keshi darhol yangilanadi.
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 8: admin yangiliklar va FAQ
- `AdminNewsPage` (`/admin/news`): ro'yxat — holat belgisi (qoralama / rejalashtirilgan / nashr qilingan, `newsStatus.ts`), sana, ko'rishlar.
- `NewsEditorPage` (`/admin/news/new`, `/admin/news/:id`): sarlavha, slug (bo'sh — avtomatik), markdown matn "Yozish / Ko'rinish" tablari bilan, nashr vaqti (`datetime-local`), "Hozir nashr qilish", "Nashrdan olish" (`published_at: null`), saytda ko'rish; yaratilgach tahrir sahifasiga o'tadi. Muqova faqat saqlangan yangilikka, ko'rinishi admin endpoint'dan blob URL bilan (qoralama uchun ham). `NEWS_SLUG_TAKEN` slug maydoni ostida. O'chirish tasdiq bilan.
- `AdminFaqPage` (`/admin/faq`): ↑/↓ tartib, "Nashr qilingan" checkbox, qo'shish/tahrir modali, o'chirish.
- Admin menyusidagi "Sayt" guruhiga Yangiliklar va Savol-javob qo'shildi.
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 7: admin kutubxona va kitoblar navbati
- `AdminLibraryPage` (`/admin/library`): bo'lim tablari; papkalar daraxti — papka/ichki papka qo'shish, nomini o'zgartirish, ↑/↓ tartib (`useSwapFolders`, juftlik ko'rinish tartibida), o'chirish (`FOLDER_NOT_EMPTY` umumiy toast); hujjat qo'shish (nom fayl nomidan to'ldiriladi), tahrir (nom va boshqa papkaga ko'chirish), o'chirish. Modallar `LibraryModals.tsx` da.
- `AdminBooksPage` (`/admin/books?status=`): tasdiq kutayotgan / tasdiqlangan tablari; har kitobda yuklovchi, hajm, sana, faylni ochish (admin endpoint, `useProtectedDownload`), tasdiqlash / tasdiqni bekor qilish, tahrir (`BookEditModal`: nom, muallif, kategoriya, muqova almashtirish), o'chirish.
- Admin menyusiga "Sayt" guruhi (Kutubxona, Kitoblar); zod sxemalar `features/admin/cms/schemas.ts`.
- Tekshiruv: lint, typecheck, build o'tdi.

### 4B Task 6: "Kitoblarim"
- Yangi `MyBooksPage` (`/teach/books`, o'qituvchi va admin menyusida): kitoblar ro'yxati, holat belgisi (tasdiqlangan / tasdiq kutilmoqda), tasdiqlanmaganini o'chirish (`ConfirmDialog`), tasdiqlanganini yuklab olish.
- `BookUploadModal`: nom, muallif, kategoriya (mavjudlari `<datalist>` da), fayl va ixtiyoriy muqova; `bookUploadSchema` (uzunliklar backend bilan bir xil); admin uchun "darhol tasdiqlanadi" eslatmasi; xato forma ichida.
- `lib/files.ts`: `DOC_ACCEPT`, `IMAGE_ACCEPT`, `FILE_INPUT_CLASS`.
- Tekshiruv: lint, typecheck, build o'tdi.

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
