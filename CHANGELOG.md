# O'zgarishlar jurnali

Loyihadagi barcha o'zgarishlar shu yerda sana bo'yicha qayd etiladi: kod, hujjatlar, infratuzilma, shuningdek GitHub'dagi amallar (repo, PR, merge). Eng yangi yozuvlar yuqorida. Har bir yozuv yonida commit hash'i yoki tegishli havola bor.

---

## 2026-10-10 — Texnik audit va frontend testlarini barqarorlashtirish

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
