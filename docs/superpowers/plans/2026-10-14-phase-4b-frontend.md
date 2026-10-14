# 4B-bosqich: kutubxona, CMS va ochiq sayt (frontend) — implementatsiya rejasi

## Context

4A (backend: `library`, `cms`, SEO) `main`da qurilgan (`8e75aaa`). Frontend hali eski: ochiq sayt faqat bosh sahifa skeleti + login/register, admin nav'i 375px da gorizontal scroll beradi, kutubxona/yangiliklar/FAQ/bog'lanish sahifalari va admin CMS yo'q. Bu reja mini-spec `docs/superpowers/specs/2026-10-14-phase-4-design.md` 7-bo'limini (va 9-bo'lim mezonlarining frontend qismini) quradi.

Ish tartibi (`CLAUDE.md` + memory): subagent yo'q, faqat `main`, 3–5 tasklik batch, har task bitta commit + `CHANGELOG.md` yozuvi o'sha commitda. Testlar loyiha oxirida — har task'da faqat `npm run lint && npm run typecheck && npm run build` (backend tegilsa `ruff format --check`, `ruff check`, `mypy app`). CI'dagi mavjud Vitest yangi so'rov sabab yiqilsa — faqat minimal MSW mock.

## Topilgan bo'shliqlar va qarorlar

1. **Admin kutilayotgan kitob faylini ko'ra olmaydi:** `GET /api/library/books/{id}/file` faqat tasdiqlanganlarni beradi, admin endpoint yo'q. → Task 0 da backend'ga `GET /api/admin/books/{id}/file` (admin, `file_response`) qo'shiladi; frontend `useProtectedDownload` (`lib/download.ts`) bilan yuklaydi.
2. **Qoralama yangilik muqovasi** ochiq `/api/news/{id}/cover` dan kelmaydi (faqat nashr qilingan). → `GET /api/admin/news/{id}/cover` qo'shiladi; admin muharriri rasmni `apiBuffer` → blob URL bilan ko'rsatadi.
3. **Muqova keshi:** URL o'zgarmaydi → `?v=${updated_at|created_at}` qo'shiladi.
4. **Admin papkalar ro'yxati** uchun alohida endpoint yo'q — ochiq daraxt (`/api/library/folders?section=`) ishlatiladi; tartib `PATCH {order}` bilan (yuqoriga/pastga tugmalari, qo'shni bilan `order` almashadi).
5. **Admin nav'i:** yuqori nav'da admin uchun bitta "Boshqaruv" havolasi; `/admin/*` sahifalari `AdminLayout` ichida guruhlangan ichki nav (Foydalanuvchilar · O'quv: fanlar, AI · Sayt: kutubxona, kitoblar, yangiliklar, FAQ, xabarlar, sozlamalar). `AppLayout` va `PublicLayout` da `md` dan kichik ekranda nav "☰" menyuga yig'iladi — gorizontal scroll yo'qoladi.
6. **Markdown:** `react-markdown@10.1.0` (yangi bog'liqlik, aniq versiya). `skipHtml`, havolalar `rel="noopener noreferrer"`, faqat `http(s)/mailto` (`urlTransform` default xavfsiz). Bitta `components/ui/Markdown.tsx`.
7. **Yo'llar backend sitemap bilan mos:** `/`, `/news`, `/news/:slug`, `/library`, `/faq`, `/about`, `/contact` (`backend/app/cms/seo.py: STATIC_PATHS`). Kutubxona bo'limi `?tab=metodik|huquqiy|books` query'da.

## Fayl xaritasi

| Fayl | Vazifa |
|---|---|
| `backend/app/library/admin_router.py`, `backend/app/cms/admin_router.py` (o'zg.) | admin kitob fayli, admin yangilik muqovasi |
| `src/api/types.ts`, `types.contract.ts` (o'zg.) | Folder/Document/Book/News/Faq/Site/Contact tiplari va kontrakti |
| `src/api/library.ts` (yangi) | ochiq kutubxona + `teach/books` hook'lari |
| `src/api/cms.ts` (yangi) | ochiq news/faq/site/contact |
| `src/api/adminCms.ts` (yangi) | admin kutubxona, kitoblar, news, faq, messages, site |
| `src/lib/usePageMeta.ts` (yangi) | title, description, OG teglari |
| `src/lib/format.ts` (yangi) | `formatDate`, `formatSize` (Intl, joriy til) |
| `src/components/ui/Markdown.tsx` (yangi) | xavfsiz markdown |
| `src/components/ui/Pagination.tsx` (yangi) | oldingi/keyingi + "N / M" |
| `src/app/layouts/PublicLayout.tsx`, `AppLayout.tsx` (o'zg.), `MobileMenu.tsx`, `AdminLayout.tsx`, `SiteFooter.tsx` (yangi) | nav, mobil menyu, footer |
| `src/app/router.tsx`, `paths.ts` (o'zg.) | marshrutlar, nav guruhlari |
| `src/features/public/*` | `HomePage` (qayta), `NewsListPage`, `NewsPage`, `LibraryPage` (+ `FolderTree`, `BookCatalog`), `FaqPage`, `AboutPage`, `ContactPage`, `schemas.ts` |
| `src/features/teach/MyBooksPage.tsx`, `BookUploadModal.tsx` | o'qituvchi kitoblari |
| `src/features/admin/cms/*` | `AdminLibraryPage`, `AdminBooksPage`, `AdminNewsPage`, `NewsEditorPage`, `AdminFaqPage`, `AdminMessagesPage`, `AdminSitePage`, `schemas.ts` |
| `src/i18n/uz.json`, `ru.json` | kalitlar (xato kodlari allaqachon bor) |

---

## Task 0: Backend bo'shliqlari, tiplar va API hook'lari

- [ ] Backend: `GET /api/admin/books/{id}/file` (`books.get_book` + `file_response`), `GET /api/admin/news/{id}/cover` (`news.get_news`; cover yo'q → 404 `NEWS_NOT_FOUND`). `ruff`, `mypy`.
- [ ] `npm run gen:api`; `types.ts` ga: `LibrarySection`, `FolderNode` (`documents`, `children`), `FolderAdmin`, `FolderIn/Update`, `LibraryDocument`, `DocumentUpdate`, `Book`, `BookAdmin`, `BookUpdate`, `BookPage`, `NewsCard`, `NewsDetail`, `NewsAdmin`, `NewsIn/Update`, `NewsPage`, `FaqItem`, `FaqIn/Update`, `SiteSettings` (`contacts`, `socials`, `about`), `SiteUpdate`, `ContactIn` (`website` honeypot bilan), `ContactMessage`. `types.contract.ts` ga har biri uchun `Receives`/`Sends`.
- [ ] Hook'lar mavjud `api/admin.ts` naqshida (kalitlar obyekti, `apiFetch`, `invalidateQueries`, forma mutatsiyalari `meta: { silent: true }`):
  - `library.ts`: `libraryKeys`; `useFolderTree(section)`, `useBooks({category,q,page})` (`placeholderData: keepPreviousData`), `useBookCategories()`, `documentFileUrl(id)`, `bookFileUrl(id)`, `bookCoverUrl(book)`; `useMyBooks`, `useUploadBook` (FormData: `category,title,author,file,cover?`), `useDeleteMyBook`.
  - `cms.ts`: `useNewsPage(page)`, `useNews(slug)`, `newsCoverUrl(card)`, `useFaq()`, `useSite()` (`staleTime: 5 min`), `useSendContact()` (silent).
  - `adminCms.ts`: papka CRUD + `useMoveFolder` (ikki PATCH), `useAddDocument` (FormData), `useUpdateDocument`, `useDeleteDocument`; `useAdminBooks(status)`, `useUpdateBook`, `useReplaceBookCover`, `useDeleteBook`; news CRUD + `useSetNewsCover`; faq CRUD; `useMessages(unread)`, `useUpdateMessage`, `useDeleteMessage`; `useAdminSite`, `useUpdateSite`. Admin o'zgarishlari tegishli ochiq kalitlarni ham invalidatsiya qiladi.
- [ ] Commit `feat(frontend): library and cms api layer` (+ backend endpoint'lar shu commitda).

## Task 1: Umumiy qismlar va ochiq layout

- [ ] `npm i react-markdown@10.1.0 --save-exact`; `Markdown.tsx` (`skipHtml`, `prose`-ga o'xshash Tailwind klasslari `index.css` da `.md` ostida).
- [ ] `usePageMeta(title, description?, image?)`: `document.title = \`${title} — ${t('app.name')}\``, `meta[name=description]`, `og:title/description/image/url/type` (bo'lmasa yaratadi), unmount'da qiymatlarni default'ga qaytaradi. `index.html` ga default description.
- [ ] `format.ts`: `formatDate(iso, lang)`, `formatSize(bytes)`.
- [ ] `Pagination.tsx`.
- [ ] `PublicLayout`: nav (Bosh sahifa, Yangiliklar, Kutubxona, FAQ, Biz haqimizda, Bog'lanish) `NavLink` bilan; `md` dan kichikda `MobileMenu` (☰ tugma, `aria-expanded`, ochiladigan panel, Escape/marshrut o'zgarsa yopiladi). `SiteFooter`: `useSite()` dan kontaktlar (`tel:`, `mailto:`), ijtimoiy havolalar (`target=_blank rel=noopener`), qisqa nav, ©.
- [ ] Commit `feat(frontend): public layout, markdown and page meta`.

## Task 2: Bosh sahifa (yakuniy dizayn) va yangiliklar

- [ ] `HomePage`: hero (mavjud matnlar + CTA), "So'nggi yangiliklar" (`useNewsPage(1)` dan 3 ta karta, bo'sh bo'lsa blok yashirinadi), kutubxona bloki (metodik / huquqiy / kitoblar havolalari), AI repetitor bloki (`/app/tutor` yoki ro'yxatdan o'tish), mavjud 3 feature kartasi; `usePageMeta`.
- [ ] `NewsCard` komponenti (muqova `loading="lazy"`, sana, excerpt) — `features/public/NewsCard.tsx`.
- [ ] `NewsListPage` (`/news?page=`): grid, `Pagination`, `EmptyState`.
- [ ] `NewsPage` (`/news/:slug`): `QueryState` (404 → `NEWS_NOT_FOUND` matni + orqaga havola), muqova, sana, ko'rishlar, `Markdown`; `usePageMeta(title, excerpt, coverUrl)`.
- [ ] Commit `feat(frontend): home page and news`.

## Task 3: Kutubxona (ochiq)

- [ ] `LibraryPage` (`/library?tab=`): `Tabs` (metodik, huquqiy, kitoblar), tab URL'da.
- [ ] `FolderTree`: `useFolderTree(section)`; rekursiv `<details>`/`<summary>` (klaviatura bilan ishlaydi), har hujjat — nom, hajm, oddiy `<a href download>` (ochiq endpoint). Bo'sh → `EmptyState`.
- [ ] `BookCatalog`: qidiruv (`q`, debounce 300ms), kategoriya `Select`, karta (muqova yoki 📘, nom, muallif, kategoriya, yuklab olish), `Pagination`; filtrlar URL'da.
- [ ] Commit `feat(frontend): public library`.

## Task 4: FAQ, Biz haqimizda, Bog'lanish

- [ ] `FaqPage`: `<details>` akkordeon, javob `whitespace-pre-line`.
- [ ] `AboutPage`: `useSite().about` → `Markdown`; bo'sh bo'lsa `EmptyState`.
- [ ] `ContactPage`: chapda kontaktlar, o'ngda forma (`contactSchema` zod: name, contact, message uzunliklari backend bilan bir xil); honeypot `website` — ko'rinmas (`sr-only`-dan farqli: `absolute -left-[9999px]`, `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`); muvaffaqiyatda forma tozalanadi + "Xabaringiz yuborildi" kartasi; `CONTACT_RATE_LIMITED` → `FormError`.
- [ ] Commit `feat(frontend): faq, about and contact pages`.

## Task 5: Nav qayta tuzilishi va `AdminLayout`

- [ ] `paths.ts`: `navLinksFor` admin uchun faqat `{ to: '/admin', label: 'nav.admin' }`; yangi `adminNavGroups` (users; learning: subjects, ai; site: library, books, news, faq, messages, site). O'qituvchi/admin uchun `/teach/books` ("Kitoblarim").
- [ ] `AdminLayout`: `md+` da chap ustun (guruh sarlavhalari bilan), mobil'da `Select`-uslubidagi ochiladigan ro'yxat; `<Outlet/>`. Router'da admin bolalari shu layout ichiga; `/admin` → `/admin/users`.
- [ ] `AppLayout`: `md` dan kichikda nav `MobileMenu` ga (Task 1 komponenti qayta ishlatiladi), `overflow-x-auto` olib tashlanadi. `homePathFor` o'zgarmaydi.
- [ ] Commit `feat(frontend): grouped admin navigation and mobile menu`.

## Task 6: O'qituvchi — "Kitoblarim"

- [ ] `MyBooksPage` (`/teach/books`): ro'yxat (holat `Badge`: kutilmoqda / tasdiqlangan), tasdiqlanmaganini o'chirish (`ConfirmDialog`), "Kitob yuklash" → `BookUploadModal` (kategoriya `Input` + `<datalist>` `useBookCategories`, nom, muallif, fayl `.pdf,.doc,.docx,.ppt,.pptx`, muqova `image/jpeg,image/png,image/webp`; zod `bookUploadSchema`; xato `FormError`). Admin yuklasa darhol tasdiqlangan — matnda aytiladi.
- [ ] Commit `feat(frontend): teacher books`.

## Task 7: Admin — kutubxona va kitoblar navbati

- [ ] `AdminLibraryPage` (`/admin/library`): bo'lim `Tabs`; daraxt (`useFolderTree`), har papkada: ichki papka qo'shish, nomini o'zgartirish, ↑/↓, o'chirish (`FOLDER_NOT_EMPTY` toast), hujjat qo'shish (modal: nom + fayl); har hujjatda: nom tahriri, boshqa papkaga ko'chirish (`Select` — shu bo'lim papkalari tekislangan), o'chirish.
- [ ] `AdminBooksPage` (`/admin/books`): `Tabs` pending/approved; qatorda muqova, nom, muallif, kategoriya, yuklovchi, hajm, fayl (`useProtectedDownload` admin endpoint), tasdiqlash / tasdiqni bekor qilish, tahrir modali (kategoriya, nom, muallif, muqova almashtirish), o'chirish.
- [ ] Commit `feat(frontend): admin library and books`.

## Task 8: Admin — yangiliklar va FAQ

- [ ] `AdminNewsPage` (`/admin/news`): jadval/kartalar — holat (qoralama / rejalashtirilgan / nashr), sana, ko'rishlar; "Yangi yangilik".
- [ ] `NewsEditorPage` (`/admin/news/new`, `/admin/news/:id`): sarlavha, slug (ixtiyoriy, bo'sh = avtomatik), body `Textarea` + "Tahrir / Ko'rinish" tablari (`Markdown`), `published_at` (`toLocalInput`/`fromLocalInput` — `lib/datetime.ts`), tugmalar: saqlash, "Hozir nashr qilish", "Nashrdan olish" (`published_at: null`). Muqova faqat saqlangandan keyin (PUT), admin endpoint'dan blob preview. `NEWS_SLUG_TAKEN` → slug maydoni ostida.
- [ ] `AdminFaqPage`: ro'yxat, ↑/↓, nashr checkbox, inline tahrir/qo'shish modali, o'chirish.
- [ ] Commit `feat(frontend): admin news and faq`.

## Task 9: Admin — xabarlar va sayt sozlamalari

- [ ] `AdminMessagesPage`: filtr "faqat o'qilmagan", karta (ism, kontakt — email bo'lsa `mailto:`, sana, matn), o'qilgan/o'qilmagan, o'chirish. Admin nav'idagi "Xabarlar" yonida o'qilmaganlar soni `Badge` (`useMessages(true)`).
- [ ] `AdminSitePage`: uchta forma bo'limi — kontaktlar, ijtimoiy tarmoqlar (zod: bo'sh yoki `https://`), "Biz haqimizda" (markdown + ko'rinish). Har biri faqat o'z kalitini `PUT` qiladi.
- [ ] Commit `feat(frontend): admin messages and site settings`.

## Task 10: Yakun

- [ ] `npm run gen:api` → `git diff --exit-code src/api/schema.gen.ts`.
- [ ] Qo'lda smoke (backend `:8000` + `vite`): spec 9-bo'lim — admin papka/hujjat qo'shadi, mehmon (yashirin oyna) ko'radi va yuklab oladi; o'qituvchi kitob yuklaydi → admin tasdiqlaydi → katalogda; yangilik/FAQ ochiq saytda; bog'lanish xabari admin'ga keladi; sahifa `<title>`/OG (DevTools); uz/ru; 375px da gorizontal scroll yo'q (ochiq sayt, `/app`, `/admin/*`).
- [ ] `CLAUDE.md` (frontend arxitekturasi: `library.ts`/`cms.ts`/`adminCms.ts`, `Markdown`, `usePageMeta`, `AdminLayout`; holat: 4B qurilgan), roadmap (4B ✅, keyingisi 4C), CHANGELOG; commit `docs: close phase 4B frontend`. Push — so'ralganda.

## Batch'lar
- **Batch 1:** Task 0, 1, 2 (API, layout, bosh sahifa + yangiliklar).
- **Batch 2:** Task 3, 4, 5 (kutubxona, FAQ/about/contact, nav).
- **Batch 3:** Task 6, 7, 8 (kitoblar, admin kutubxona, yangiliklar/FAQ).
- **Batch 4:** Task 9, 10 (xabarlar, sozlamalar, yakun).

## i18n
Yangi bo'limlar (uz + ru birga, har task o'z kalitlarini qo'shadi): `nav.{news,library,faq,about,contact,admin,myBooks,adminLibrary,adminBooks,adminNews,adminFaq,adminMessages,adminSite}`, `navGroups.*`, `home.{latestNews,libraryBlock,tutorBlock}.*`, `news.*`, `library.*`, `faq.*`, `about.*`, `contact.*`, `footer.*`, `myBooks.*`, `adminLibrary.*`, `adminBooks.*`, `adminNews.*`, `adminFaq.*`, `adminMessages.*`, `adminSite.*`, `pagination.*`, `meta.*`. Xato kodlari (`FOLDER_*`, `BOOK_*`, `NEWS_*`, `CONTACT_RATE_LIMITED`) `errors.*` da allaqachon bor.

## Loyiha oxirida yoziladigan testlar (eslatma)
`Markdown` xom HTML'ni chizmaydi; `usePageMeta`; `ContactPage` honeypot va 429; `BookCatalog` filtrlar URL'da; `NewsEditorPage` nashr/nashrdan olish; `AdminLibraryPage` 409; E2E: admin hujjat → mehmon yuklab oladi, o'qituvchi kitob → admin tasdiq → katalog.

## Tekshirish
- Har task: `npm run lint && npm run typecheck && npm run build` (Task 0 da qo'shimcha `uv run ruff format --check . && uv run ruff check . && uv run mypy app`).
- Task 10: `gen:api` farqsiz; brauzerda spec 9-bo'lim mezonlari, uz/ru, 375px.
