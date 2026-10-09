# 1B-bosqich: Frontend — implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1-bosqichni yakunlaydigan React frontend'ni qurish:
- "Yorqin ilova" dizayn tizimi, uz/ru interfeys;
- ochiq sahifalar (bosh sahifa skeleti, kirish, ro'yxatdan o'tish, tasdiq kutish);
- talaba qismi (fanlar, mavzu yo'li, dars pleyeri, profil);
- o'qituvchining mavzu muharriri;
- admin paneli (foydalanuvchilar, fanlar);
- Vitest + RTL testlari, Playwright E2E va CI.

**Architecture:**
- `frontend/` ichida Vite SPA. Barcha so'rovlar `/api`ga ketadi: dev'da Vite proxy orqali backend'ga (`localhost:8000`), prod'da nginx orqali.
- Access token faqat xotirada saqlanadi, refresh token esa backend qo'ygan httpOnly cookie'da. Ilova yuklanganda `POST /api/auth/refresh` bilan sessiya tiklanadi.
- Server holati TanStack Query'da saqlanadi. Har domen (`auth`, `student`, `teach`, `admin`) o'z hook'lariga ega.
- Xatolar backend'ning `{code, message, details}` formatida keladi. Ularning matni `code` bo'yicha i18n'dan olinadi.

**Tech Stack:** Node 22, npm, Vite, React 19, TypeScript, React Router, TanStack Query 5, Tailwind CSS v4, react-i18next, react-hook-form + zod 4, react-pdf, Vitest + React Testing Library + MSW, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-08-texnologiya-platform-design.md` (4-bo'lim "Sahifalar va oqimlar", "Dizayn tizimi", 10-bo'lim 1-bosqich). Backend API: `backend/app/**/schemas.py`, `student_schemas.py` va router'lar.

**Konventsiyalar:**
- Barcha buyruqlar Git Bash'da `frontend/` papkasidan ishga tushiriladi, agar boshqacha ko'rsatilmagan bo'lsa.
- Interfeys matnlari kodda yozilmaydi. Hammasi `src/i18n/uz.json` va `src/i18n/ru.json` orqali `t('...')` bilan olinadi. Kalitlar ikkala faylda ham bo'lishi shart, buni `i18n.test.ts` tekshiradi.
- Komponentlar `export function Name()` ko'rinishida yoziladi, default export ishlatilmaydi.
- Import'lar `@/` alias'i orqali (`@/api/client`). Alias `src/`ga ishora qiladi.
- Testlar tekshiriladigan fayl yonida turadi (`Button.tsx` va `Button.test.tsx`).
- Har task oxirida `CHANGELOG.md`ning "1B-bosqich" bo'limiga bir qatorlik yozuv qo'shiladi va u task kodi bilan bitta commit'ga kiradi (loyiha qoidasi, `CLAUDE.md`ga qarang). Yozuvda commit hash'i bo'lmaydi: commit qilinmaguncha hash noma'lum. Hash'lar Task 18'da `git log` asosida qo'yib chiqiladi.
- Bu bosqichda backend o'zgarmaydi. Kerakli barcha endpoint'lar 1A'da bor.

---

## Fayl xaritasi

```
frontend/
  package.json, package-lock.json, index.html, vite.config.ts, tsconfig.json,
  tsconfig.app.json, tsconfig.node.json, eslint.config.js, playwright.config.ts, README.md
  src/
    main.tsx                  # React root: providers + router
    index.css                 # Tailwind v4 + @theme dizayn tokenlari + Onest
    test/setup.ts             # jest-dom, MSW server, i18n, har testdan keyin tozalash
    test/server.ts            # MSW setupServer
    test/render.tsx           # renderRoute/renderRoutes (QueryClient, memory router, sessiya, Toaster)
    test/fixtures.ts          # talaba sahifalari uchun namunaviy ma'lumotlar
    i18n/
      index.ts                # i18next init, setLanguage()
      uz.json, ru.json
      i18n.test.ts            # kalitlar va o'zgaruvchilar mosligi
    api/
      types.ts                # backend sxemalarining TS ko'rinishi
      client.ts               # apiFetch, apiBuffer, ApiError, xotiradagi token, single-flight refresh
      errors.ts               # errorText(err)
      queryClient.ts          # QueryClient + mutatsiya xatolari uchun global toast
      auth.ts                 # useSession, useLogin, useRegister, useLogout, useUpdateMe, useChangePassword
      student.ts              # useSubjects, useSubject, useTopic, useStep, useCompleteStep, useContinue, useMaterialPdf
      teach.ts                # useTeachSubjects, useEditorTopic, mavzu/material/glossariy/adabiyot mutatsiyalari
      admin.ts                # foydalanuvchilar, o'qituvchilar, admin fanlar
    components/ui/
      Button.tsx, button-classes.ts, Card.tsx, Field.tsx, Spinner.tsx, EmptyState.tsx, Badge.tsx,
      ErrorState.tsx, FormError.tsx, ProgressRing.tsx, Modal.tsx, Tabs.tsx, Toast.tsx, toast-store.ts
    app/
      router.tsx              # barcha route'lar
      paths.ts                # homePathFor(), navLinksFor()
      guards.tsx              # RequireAuth, RedirectIfAuthed
      SessionGate.tsx         # sessiya tiklanguncha splash
      layouts/PublicLayout.tsx, AppLayout.tsx, LanguageSwitch.tsx
    features/
      public/HomePage.tsx, LoginPage.tsx, RegisterPage.tsx, PendingPage.tsx, NotFoundPage.tsx, AuthCard.tsx, schemas.ts
      student/SubjectsPage.tsx, SubjectPage.tsx, PlayerPage.tsx, StepContent.tsx, PdfViewer.tsx
      profile/ProfilePage.tsx, schemas.ts
      teach/TeachHomePage.tsx, TopicEditorPage.tsx, TopicDetailsForm.tsx, MaterialsTab.tsx,
            GlossaryTab.tsx, LiteratureTab.tsx, schemas.ts
      admin/AdminUsersPage.tsx, AdminSubjectsPage.tsx, SubjectFormModal.tsx, TeachersModal.tsx, schemas.ts
    lib/cx.ts                 # className birlashtirish
    lib/steps.ts              # bosqich turlari tartibi, ikonkalar, "Tugatdim" bilan yakunlanadigan bosqichlar
  e2e/
    start-backend.mjs         # toza e2e baza, migratsiyalar, admin, namuna PDF, uvicorn (:8001)
    i18n.ts                   # testlar uchun uz.json'dan matn olish
    learning-flow.spec.ts     # ro'yxatdan o'tish → tasdiq → bosqichni tugatish → progress
.github/workflows/ci.yml      # + frontend va e2e job'lari
```

## Versiyalar haqida muhim eslatmalar

Quyidagi versiyalar 2026-10-09 holatiga ko'ra haqiqiy `npm install` orqali tekshirilgan (`tsc -b`, `eslint .`, `vite build`, `vitest run` o'tdi). Rejadagi kod shu versiyalar API'siga yozilgan:

- **TypeScript `6.0.3`.** TS 7 (Go'da yozilgan kompilator) olinmaydi, chunki typescript-eslint 8.71 uni qo'llamaydi. TS 6'da `baseUrl` eskirgan, shuning uchun `paths` `baseUrl`siz yoziladi.
- **React Router 8.** `react-router-dom` paketi yo'q. Hamma narsa `react-router`dan import qilinadi, faqat `RouterProvider` `react-router/dom`dan olinadi.
- **MSW 3.** `http` va `HttpResponse` `msw/http`dan, `setupServer` `msw/node`dan import qilinadi. `onUnhandledRequest` endi `onUnhandledFrame` deb ataladi.
- **Vitest 5.** `clearMocks` sukut bo'yicha yoqilgan, `vi.mock` faqat modulning yuqori darajasida ishlatiladi. Natijalar `.vitest/` papkasiga yoziladi (u git'ga kirmaydi).
- **react-pdf 11.** U `pdfjs-dist@6.3.289`ni o'zi olib keladi, shuning uchun `pdfjs-dist` alohida o'rnatilmaydi. Worker `<Document>` render qilinadigan modulda sozlanadi. `suspense={false}` berilganda `loading` va `error` prop'lari ishlaydi.
- **ESLint 10.** `eslint-plugin-react-refresh` 0.5'da named export (`reactRefresh.configs.vite()`) ishlatiladi. Komponent faylidan komponent bo'lmagan narsa (zod sxema, yordamchi funksiya) export qilinmaydi, ular alohida `.ts` fayllarga chiqariladi.
- **zod 4.** Email `z.email()` bilan tekshiriladi.
- **Node `>=22.22.2`.** Bu react-router 8 va jsdom 30 talabi. Lokal muhitda ham, CI'da ham Node 24 LTS tavsiya etiladi.

---

### Task 1: Frontend skeleti, asboblar va smoke test

**Files:**
- Create: `frontend/package.json`, `frontend/index.html`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `frontend/eslint.config.js`
- Create: `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/App.test.tsx`, `frontend/src/index.css`, `frontend/src/test/setup.ts`, `frontend/src/vite-env.d.ts`
- Modify: `.gitignore`

- [ ] **Step 0: Node versiyasini tekshirish**

Run: `node --version`
Expected: `v22.22.2` yoki undan yangi (tavsiya: `v24.x`). Versiya eskiroq bo'lsa, Node 24 LTS o'rnatiladi. Windows'da buyruq: `winget install OpenJS.NodeJS.LTS`, so'ng terminal qayta ochiladi. Bu qadam foydalanuvchi tomonidan bajariladi.

- [ ] **Step 1: `frontend/package.json` yozish**

```json
{
  "name": "texnologiya-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=22.22.2" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "preview": "vite preview"
  },
  "dependencies": {
    "@fontsource-variable/onest": "5.3.1",
    "@hookform/resolvers": "5.9.1",
    "@tanstack/react-query": "5.104.1",
    "i18next": "26.4.2",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-hook-form": "7.89.0",
    "react-i18next": "17.0.16",
    "react-pdf": "11.0.0",
    "react-router": "8.4.0",
    "zod": "4.6.5"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@playwright/test": "1.64.0",
    "@tailwindcss/vite": "4.3.3",
    "@testing-library/dom": "10.4.2",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.7",
    "@types/node": "24.19.1",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.2",
    "eslint": "10.12.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "eslint-plugin-react-refresh": "0.5.7",
    "globals": "17.13.0",
    "jsdom": "30.1.2",
    "msw": "3.0.2",
    "tailwindcss": "4.3.3",
    "typescript": "6.0.3",
    "typescript-eslint": "8.71.1",
    "vite": "8.3.4",
    "vitest": "5.0.3"
  }
}
```

- [ ] **Step 2: TypeScript konfiguratsiyasi**

`frontend/tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`frontend/tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`frontend/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["vite.config.ts", "playwright.config.ts", "e2e/**/*.ts"]
}
```

- [ ] **Step 3: `frontend/vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// E2E testlar backend'ni boshqa portda ishga tushiradi (playwright.config.ts).
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'
const proxy = { '/api': { target: apiTarget, changeOrigin: true } }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
```

- [ ] **Step 4: `frontend/eslint.config.js`**

```js
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', '.vitest']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite(),
    ],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
  },
  {
    // Test yordamchilari komponent va funksiyalarni birga export qiladi — HMR bu yerda ahamiyatsiz.
    files: ['src/test/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['e2e/**/*.ts', 'playwright.config.ts', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
])
```

- [ ] **Step 5: HTML, CSS va kirish nuqtasi**

`frontend/index.html`:

```html
<!doctype html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#14b8a6" />
    <title>Texnologiya platformasi</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`frontend/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`frontend/src/index.css` ("Yorqin ilova" tokenlari; Onest shrifti Google Fonts o'rniga `@fontsource` orqali o'z serverimizdan beriladi — xuddi shu shrift, lekin tashqi so'rovsiz va CSP uchun qulay):

```css
@import "tailwindcss";
@import "@fontsource-variable/onest";

@theme {
  --font-sans: "Onest Variable", ui-sans-serif, system-ui, sans-serif;

  --color-brand-50: #f0fdfa;
  --color-brand-100: #ccfbf1;
  --color-brand-200: #99f6e4;
  --color-brand-500: #14b8a6;
  --color-brand-600: #0d9488;
  --color-brand-700: #0f766e;
  --color-brand-900: #134e4a;

  --shadow-press: 0 3px 0 var(--color-brand-700);
  --shadow-press-slate: 0 3px 0 var(--color-slate-300);
  --shadow-press-danger: 0 3px 0 var(--color-red-700);
}

@layer base {
  body {
    @apply bg-slate-50 font-sans text-slate-900 antialiased;
  }
}
```

`frontend/src/App.tsx` (vaqtinchalik; Task 7'da router bilan almashtiriladi):

```tsx
export function App() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold text-brand-700">Texnologiya platformasi</h1>
    </main>
  )
}
```

`frontend/src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`frontend/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 6: Smoke testni yozish**

`frontend/src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { App } from './App'

test('App sarlavhani ko\'rsatadi', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Texnologiya platformasi' })).toBeInTheDocument()
})
```

- [ ] **Step 7: `.gitignore`ni kengaytirish**

Repo ildizidagi `.gitignore` oxiriga quyidagilar qo'shiladi (`node_modules/` allaqachon bor):

```
dist/
.vitest/
frontend/playwright-report/
frontend/test-results/
frontend/e2e/.data/
```

- [ ] **Step 8: O'rnatish va barcha tekshiruvlar**

Run: `npm install`
Expected: peer-dependency xatolarisiz tugaydi va `package-lock.json` yaratiladi.

Run: `npm test`
Expected: `1 passed`.

Run: `npm run lint && npm run build`
Expected: lint xatosiz o'tadi, `tsc -b` xatosiz o'tadi, `vite build` `dist/` yaratadi.

Run: `npm run dev`, so'ng brauzerda `http://localhost:5173` ochiladi.
Expected: Onest shriftida, teal rangdagi "Texnologiya platformasi" sarlavhasi ko'rinadi. Tekshirgach, server `Ctrl+C` bilan to'xtatiladi.

- [ ] **Step 9: CHANGELOG va commit**

`CHANGELOG.md`dagi "1B-bosqich" bo'limiga qator qo'shiladi: `- Frontend skeleti: Vite, React 19, TS 6, Tailwind v4, ESLint, Vitest.`

```bash
cd .. && git add .gitignore frontend CHANGELOG.md
git commit -m "feat(frontend): vite + react skeleton with tailwind, eslint and vitest"
```

---

### Task 2: i18n — uz/ru lug'atlari va til almashtirish

**Files:**
- Create: `frontend/src/i18n/index.ts`, `frontend/src/i18n/uz.json`, `frontend/src/i18n/ru.json`
- Modify: `frontend/src/test/setup.ts`
- Test: `frontend/src/i18n/i18n.test.ts`

Lug'atlar butun 1B bosqichi uchun shu taskda to'liq yoziladi. Keyingi tasklar faqat shu kalitlardan foydalanadi. Yangi kalit kerak bo'lib qolsa, u ikkala faylga ham qo'shiladi.

`errors.*` bo'limida backend'ning barcha xato kodlari bor (`backend/app/**` dagi `AppError` kodlari), shuningdek `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR` va frontend'ning o'z `NETWORK` kodi. `materialErrors.*` bo'limi `Material.error` qiymatlarini (konvertatsiya xatolarini) tarjima qiladi.

- [ ] **Step 1: Muvaffaqiyatsiz testni yozish**

`frontend/src/i18n/i18n.test.ts`:

```ts
import { i18n, setLanguage } from '.'
import ru from './ru.json'
import uz from './uz.json'

type Dict = { [key: string]: string | Dict }

function flatten(dict: Dict, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(dict)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[path] = value
    else Object.assign(result, flatten(value, path))
  }
  return result
}

const flatUz = flatten(uz as Dict)
const flatRu = flatten(ru as Dict)

function variables(text: string): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
}

test('uz va ru lug\'atlarida kalitlar bir xil', () => {
  expect(Object.keys(flatRu).sort()).toEqual(Object.keys(flatUz).sort())
})

test('bo\'sh tarjima yo\'q', () => {
  for (const [key, value] of [...Object.entries(flatUz), ...Object.entries(flatRu)]) {
    expect(value.trim(), key).not.toBe('')
  }
})

test('interpolatsiya o\'zgaruvchilari ikkala tilda bir xil', () => {
  for (const key of Object.keys(flatUz)) {
    expect(variables(flatRu[key]), key).toEqual(variables(flatUz[key]))
  }
})

test('setLanguage tilni almashtiradi va html lang ni yangilaydi', () => {
  setLanguage('ru')
  expect(i18n.t('steps.lecture')).toBe(flatRu['steps.lecture'])
  expect(document.documentElement.lang).toBe('ru')
  setLanguage('uz')
  expect(i18n.t('steps.lecture')).toBe(flatUz['steps.lecture'])
})
```

- [ ] **Step 2: Test yiqilishini tekshirish**

Run: `npm test -- src/i18n`
Expected: FAIL — `Cannot find module '.'`.

- [ ] **Step 3: `frontend/src/i18n/index.ts`**

```ts
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './ru.json'
import uz from './uz.json'

export const LANGUAGES = ['uz', 'ru'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'locale'

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // localStorage yopiq (masalan, maxfiy rejim) — sukut bo'yicha o'zbekcha.
  }
  return 'uz'
}

export const i18n = i18next

void i18n.use(initReactI18next).init({
  resources: { uz: { translation: uz }, ru: { translation: ru } },
  lng: initialLanguage(),
  fallbackLng: 'uz',
  supportedLngs: [...LANGUAGES],
  interpolation: { escapeValue: false },
  initAsync: false,
})

document.documentElement.lang = i18n.language

/** Interfeys tilini almashtiradi va tanlovni brauzerda eslab qoladi. */
export function setLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Saqlab bo'lmasa ham til almashadi.
  }
  document.documentElement.lang = lang
  void i18n.changeLanguage(lang)
}
```

- [ ] **Step 4: `frontend/src/i18n/uz.json`**

```json
{
  "app": { "name": "Texnologiya" },
  "nav": {
    "main": "Asosiy menyu",
    "subjects": "Fanlar",
    "teach": "Mavzu muharriri",
    "adminUsers": "Foydalanuvchilar",
    "adminSubjects": "Fanlarni boshqarish",
    "profile": "Profil",
    "logout": "Chiqish",
    "login": "Kirish",
    "register": "Ro'yxatdan o'tish",
    "cabinet": "Kabinet",
    "language": "Interfeys tili"
  },
  "languages": { "uz": "O'zbekcha", "ru": "Русский" },
  "footer": { "text": "© {{year}} Buxoro davlat pedagogika instituti · Texnologik ta'lim" },
  "common": {
    "loading": "Yuklanmoqda",
    "close": "Yopish",
    "cancel": "Bekor qilish",
    "save": "Saqlash",
    "add": "Qo'shish",
    "edit": "Tahrirlash",
    "delete": "O'chirish",
    "retry": "Qayta urinish",
    "search": "Qidirish",
    "done": "Tushunarli",
    "published": "Nashr qilingan",
    "draft": "Qoralama",
    "errorTitle": "Nimadir xato ketdi",
    "progress": "Bajarildi: {{completed}} / {{total}}"
  },
  "validation": {
    "required": "Bu maydon to'ldirilishi shart",
    "email": "Email manzil noto'g'ri",
    "nameMin": "Ism kamida 2 ta belgidan iborat bo'lsin",
    "titleMin": "Nom kamida 2 ta belgidan iborat bo'lsin",
    "tooLong": "Matn juda uzun",
    "passwordMin": "Parol kamida 8 ta belgidan iborat bo'lsin",
    "passwordMismatch": "Parollar bir xil emas",
    "year": "Yil 1900–2100 oralig'idagi 4 xonali son bo'lsin",
    "url": "Havola http:// yoki https:// bilan boshlansin",
    "slug": "Faqat kichik lotin harflari, raqamlar va chiziqcha (-)",
    "order": "0 yoki undan katta butun son kiriting"
  },
  "errors": {
    "NETWORK": "Serverga ulanib bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring",
    "VALIDATION_ERROR": "Kiritilgan ma'lumotlar noto'g'ri",
    "NOT_FOUND": "Ma'lumot topilmadi",
    "INTERNAL_ERROR": "Serverda xato yuz berdi. Birozdan so'ng qayta urinib ko'ring",
    "INVALID_CREDENTIALS": "Email yoki parol noto'g'ri",
    "ACCOUNT_BLOCKED": "Akkauntingiz bloklangan. Administratorga murojaat qiling",
    "ACCOUNT_PENDING": "Akkauntingiz hali tasdiqlanmagan",
    "TOO_MANY_ATTEMPTS": "Juda ko'p urinish. 15 daqiqadan so'ng qayta urinib ko'ring",
    "EMAIL_TAKEN": "Bu email bilan allaqachon ro'yxatdan o'tilgan",
    "WRONG_PASSWORD": "Joriy parol noto'g'ri",
    "NOT_AUTHENTICATED": "Tizimga qayta kiring",
    "INVALID_TOKEN": "Sessiya muddati tugadi. Qayta kiring",
    "NO_REFRESH_TOKEN": "Sessiya topilmadi. Qayta kiring",
    "INVALID_REFRESH_TOKEN": "Sessiya yaroqsiz. Qayta kiring",
    "REFRESH_EXPIRED": "Sessiya muddati tugadi. Qayta kiring",
    "REFRESH_REUSED": "Xavfsizlik uchun sessiya yopildi. Qayta kiring",
    "FORBIDDEN": "Bu amal uchun ruxsat yo'q",
    "NOT_SUBJECT_TEACHER": "Siz bu fanga biriktirilmagansiz",
    "NOT_A_TEACHER": "Faqat o'qituvchilarni biriktirish mumkin",
    "CANNOT_MODIFY_SELF": "O'z akkauntingizni bu yerda o'zgartira olmaysiz",
    "USER_NOT_FOUND": "Foydalanuvchi topilmadi",
    "SUBJECT_NOT_FOUND": "Fan topilmadi",
    "TOPIC_NOT_FOUND": "Mavzu topilmadi",
    "STEP_NOT_FOUND": "Bosqich topilmadi",
    "MATERIAL_NOT_FOUND": "Material topilmadi",
    "GLOSSARY_TERM_NOT_FOUND": "Atama topilmadi",
    "LITERATURE_NOT_FOUND": "Adabiyot topilmadi",
    "SLUG_TAKEN": "Bu slug band. Boshqasini kiriting",
    "INVALID_ORDER": "Mavzular ro'yxati eskirgan. Sahifani yangilang",
    "STEP_DOES_NOT_ACCEPT_FILES": "Bu bosqichga fayl yuklab bo'lmaydi",
    "STEP_EMPTY": "Bu bosqichda hali material yo'q",
    "STEP_NOT_COMPLETABLE": "Bu bosqich topshiriq orqali yakunlanadi",
    "UNSUPPORTED_FILE_TYPE": "Faqat PDF, PPT, PPTX, DOC yoki DOCX fayl yuklash mumkin",
    "FILE_TOO_LARGE": "Fayl hajmi juda katta (50 MB gacha)",
    "INVALID_PDF": "PDF fayl buzilgan, shifrlangan yoki bo'sh",
    "MATERIAL_PROCESSING": "Material hali qayta ishlanmoqda. Tugashini kuting",
    "MATERIAL_NOT_FAILED": "Faqat xato bilan tugagan materialni qayta ishlash mumkin"
  },
  "materialErrors": {
    "CONVERSION_FAILED": "Faylni PDF'ga aylantirib bo'lmadi. Faylni tekshirib, qayta urinib ko'ring",
    "CONVERSION_TIMEOUT": "Konvertatsiya juda uzoq davom etdi. Qayta urinib ko'ring",
    "LIBREOFFICE_NOT_FOUND": "Serverda LibreOffice o'rnatilmagan. Administratorga murojaat qiling yoki PDF yuklang",
    "STORAGE_FAILED": "Faylni saqlab bo'lmadi. Qayta urinib ko'ring",
    "INTERRUPTED": "Server qayta ishga tushgani uchun konvertatsiya to'xtadi. Qayta urinib ko'ring",
    "INVALID_PDF": "Natijaviy PDF buzilgan. Asl faylni tekshiring"
  },
  "roles": { "student": "Talaba", "teacher": "O'qituvchi", "admin": "Administrator" },
  "steps": {
    "review": "Takrorlash",
    "lecture": "Ma'ruza",
    "presentation": "Taqdimot",
    "practice": "Amaliy mashg'ulot",
    "task": "Vazifa",
    "glossary": "Glossariy",
    "literature": "Adabiyotlar"
  },
  "notFound": {
    "title": "Sahifa topilmadi",
    "text": "Havola eskirgan yoki noto'g'ri yozilgan bo'lishi mumkin",
    "home": "Bosh sahifaga"
  },
  "home": {
    "badge": "BuxDPI · Texnologik ta'lim",
    "title": "Bo'lajak texnologiya o'qituvchilari uchun metodik platforma",
    "subtitle": "Ma'ruzalar, taqdimotlar, glossariy va adabiyotlar — har bir mavzu 7 bosqichli aniq yo'l sifatida",
    "start": "Boshlash",
    "continue": "Kabinetga o'tish",
    "features": {
      "steps": {
        "title": "7 bosqichli mavzular",
        "text": "Takrorlashdan adabiyotlargacha — har bir mavzu bir xil, tushunarli tartibda"
      },
      "player": {
        "title": "Qulay dars pleyeri",
        "text": "Ma'ruza va taqdimotlarni brauzerning o'zida, telefonda ham o'qing"
      },
      "language": {
        "title": "O'zbek va rus tillarida",
        "text": "Interfeys tilini istalgan vaqtda almashtiring"
      }
    }
  },
  "auth": {
    "email": "Email",
    "password": "Parol",
    "passwordConfirm": "Parolni takrorlang",
    "passwordHint": "Kamida 8 ta belgi",
    "fullName": "To'liq ism",
    "phone": "Telefon",
    "phoneHint": "Ixtiyoriy",
    "login": { "title": "Kirish", "submit": "Kirish", "noAccount": "Akkauntingiz yo'qmi?" },
    "register": { "title": "Ro'yxatdan o'tish", "submit": "Ro'yxatdan o'tish", "haveAccount": "Akkauntingiz bormi?" }
  },
  "pending": {
    "title": "Tasdiq kutilmoqda",
    "textUser": "{{name}}, akkauntingiz administrator tasdig'ini kutmoqda. Tasdiqlangach, platformadan to'liq foydalanishingiz mumkin.",
    "textGuest": "Ro'yxatdan o'tdingiz! Administrator akkauntingizni tasdiqlagach, tizimga kira olasiz."
  },
  "student": {
    "hello": "Salom, {{name}}!",
    "continue": "Davom ettirish",
    "subjects": "Fanlar",
    "noSubjects": "Hozircha fanlar yo'q",
    "noSubjectsText": "Fanlar nashr qilinishi bilan shu yerda paydo bo'ladi",
    "topicCount": "{{count}} ta mavzu",
    "allSubjects": "Barcha fanlar",
    "noTopics": "Bu fanda hali mavzular yo'q",
    "topicNumber": "{{number}}-mavzu",
    "topicDone": "Tugatilgan"
  },
  "player": {
    "steps": "Mavzu bosqichlari",
    "noContent": "Hozircha material yo'q",
    "noContentText": "O'qituvchi bu bosqichga material qo'shgach, u shu yerda paydo bo'ladi",
    "complete": "Tugatdim",
    "completed": "Tugatilgan",
    "completedToast": "Bosqich tugatildi! Barakalla 🎉",
    "next": "Keyingi bosqich",
    "openLink": "Havolani ochish",
    "pdfError": "PDF faylni ochib bo'lmadi",
    "prevPage": "Oldingi sahifa",
    "nextPage": "Keyingi sahifa",
    "pageOf": "{{page}} / {{total}}"
  },
  "profile": {
    "title": "Profil",
    "role": "Rol",
    "personal": "Shaxsiy ma'lumotlar",
    "language": "Interfeys tili",
    "saved": "O'zgarishlar saqlandi",
    "passwordTitle": "Parol",
    "currentPassword": "Joriy parol",
    "newPassword": "Yangi parol",
    "changePassword": "Parolni almashtirish",
    "passwordChanged": "Parol almashtirildi. Yangi parol bilan qayta kiring"
  },
  "teach": {
    "title": "Mavzu muharriri",
    "noSubjects": "Sizga hali fan biriktirilmagan",
    "noSubjectsText": "Administrator sizni fanga biriktirgach, mavzular shu yerda paydo bo'ladi",
    "noTopics": "Bu fanda hali mavzular yo'q",
    "newTopicLabel": "Yangi mavzu nomi",
    "newTopicPlaceholder": "Masalan: Kasb tanlash asoslari",
    "addTopic": "Mavzu qo'shish",
    "moveUp": "«{{title}}»ni yuqoriga surish",
    "moveDown": "«{{title}}»ni pastga surish",
    "deleteTopic": "«{{title}}»ni o'chirish",
    "deleteTopicTitle": "Mavzuni o'chirish",
    "deleteTopicText": "«{{title}}» mavzusi barcha materiallari bilan o'chiriladi. Bu amalni qaytarib bo'lmaydi.",
    "backToTopics": "Mavzular ro'yxati",
    "topicTitle": "Mavzu nomi",
    "topicSummary": "Qisqacha mazmuni",
    "topicPublished": "Talabalarga ko'rsatilsin (nashr qilingan)",
    "topicSaved": "Mavzu saqlandi",
    "stepsLabel": "Mavzu bosqichlari",
    "comingSoon": "Bu bosqich keyingi yangilanishda qo'shiladi",
    "comingSoonText": "Testlar, ha/yo'q savollari, krossvord va vazifalar platformaning keyingi versiyasida paydo bo'ladi",
    "materialTitle": "Material nomi",
    "materialFile": "Fayl",
    "materialFileHint": "PDF, PPT, PPTX, DOC yoki DOCX · 50 MB gacha",
    "upload": "Yuklash",
    "materialUploaded": "Fayl yuklandi",
    "noMaterials": "Bu bosqichda hali material yo'q",
    "deleteMaterialTitle": "Materialni o'chirish",
    "deleteMaterialText": "«{{title}}» materiali o'chiriladi.",
    "pagesCount": "{{count}} bet",
    "status": { "processing": "Qayta ishlanmoqda", "ready": "Tayyor", "failed": "Xato" },
    "term": "Atama",
    "definition": "Izoh",
    "addTerm": "Yangi atama",
    "noGlossary": "Glossariy hali bo'sh",
    "deleteTermTitle": "Atamani o'chirish",
    "deleteItemText": "«{{title}}» o'chiriladi.",
    "litTitle": "Nomi",
    "litAuthor": "Muallif",
    "litYear": "Yil",
    "litUrl": "Havola (ixtiyoriy)",
    "addLiterature": "Yangi adabiyot",
    "noLiterature": "Adabiyotlar ro'yxati hali bo'sh",
    "deleteLiteratureTitle": "Adabiyotni o'chirish"
  },
  "admin": {
    "users": {
      "title": "Foydalanuvchilar",
      "filter": "Holat bo'yicha filtr",
      "filters": { "pending": "Tasdiq kutayotganlar", "active": "Faol", "blocked": "Bloklangan", "all": "Hammasi" },
      "statuses": { "pending": "Kutmoqda", "active": "Faol", "blocked": "Bloklangan" },
      "searchLabel": "Ism yoki email bo'yicha qidirish",
      "searchPlaceholder": "Ism yoki email",
      "empty": "Foydalanuvchilar topilmadi",
      "approve": "Tasdiqlash",
      "block": "Bloklash",
      "unblock": "Blokdan chiqarish",
      "tempPassword": "Vaqtinchalik parol",
      "tempTitle": "Yangi vaqtinchalik parol",
      "tempText": "{{name}} uchun yangi parol. Uni foydalanuvchiga xavfsiz yo'l bilan yetkazing — oyna yopilgach parol qayta ko'rsatilmaydi.",
      "roleFor": "{{name}} roli",
      "you": "(siz)"
    },
    "subjects": {
      "title": "Fanlarni boshqarish",
      "new": "Yangi fan",
      "newTitle": "Yangi fan yaratish",
      "editTitle": "Fanni tahrirlash",
      "empty": "Hali fanlar yo'q",
      "titleLabel": "Fan nomi",
      "slugLabel": "Slug (manzil)",
      "slugHint": "Bo'sh qoldirilsa, nomdan avtomatik yaratiladi",
      "descriptionLabel": "Tavsif",
      "orderLabel": "Tartib raqami",
      "publishedLabel": "Talabalarga ko'rsatilsin (nashr qilingan)",
      "publish": "Nashr qilish",
      "unpublish": "Nashrdan olish",
      "teachers": "O'qituvchilar",
      "teachersTitle": "«{{title}}» o'qituvchilari",
      "noTeachers": "Faol o'qituvchilar yo'q. Avval foydalanuvchiga «O'qituvchi» rolini bering.",
      "noAssigned": "O'qituvchi biriktirilmagan",
      "saved": "Saqlandi",
      "deleteTitle": "Fanni o'chirish",
      "deleteText": "«{{title}}» fani barcha mavzu va materiallari bilan o'chiriladi. Bu amalni qaytarib bo'lmaydi."
    }
  }
}
```

- [ ] **Step 5: `frontend/src/i18n/ru.json`**

```json
{
  "app": { "name": "Texnologiya" },
  "nav": {
    "main": "Главное меню",
    "subjects": "Предметы",
    "teach": "Редактор тем",
    "adminUsers": "Пользователи",
    "adminSubjects": "Управление предметами",
    "profile": "Профиль",
    "logout": "Выйти",
    "login": "Войти",
    "register": "Регистрация",
    "cabinet": "Кабинет",
    "language": "Язык интерфейса"
  },
  "languages": { "uz": "O'zbekcha", "ru": "Русский" },
  "footer": { "text": "© {{year}} Бухарский государственный педагогический институт · Технологическое образование" },
  "common": {
    "loading": "Загрузка",
    "close": "Закрыть",
    "cancel": "Отмена",
    "save": "Сохранить",
    "add": "Добавить",
    "edit": "Изменить",
    "delete": "Удалить",
    "retry": "Повторить",
    "search": "Найти",
    "done": "Понятно",
    "published": "Опубликовано",
    "draft": "Черновик",
    "errorTitle": "Что-то пошло не так",
    "progress": "Выполнено: {{completed}} из {{total}}"
  },
  "validation": {
    "required": "Это поле обязательно",
    "email": "Неверный адрес электронной почты",
    "nameMin": "Имя должно содержать не менее 2 символов",
    "titleMin": "Название должно содержать не менее 2 символов",
    "tooLong": "Слишком длинный текст",
    "passwordMin": "Пароль должен содержать не менее 8 символов",
    "passwordMismatch": "Пароли не совпадают",
    "year": "Год — четырёхзначное число от 1900 до 2100",
    "url": "Ссылка должна начинаться с http:// или https://",
    "slug": "Только строчные латинские буквы, цифры и дефис (-)",
    "order": "Введите целое число не меньше 0"
  },
  "errors": {
    "NETWORK": "Не удалось связаться с сервером. Проверьте подключение и попробуйте снова",
    "VALIDATION_ERROR": "Введены неверные данные",
    "NOT_FOUND": "Данные не найдены",
    "INTERNAL_ERROR": "Ошибка на сервере. Попробуйте немного позже",
    "INVALID_CREDENTIALS": "Неверный email или пароль",
    "ACCOUNT_BLOCKED": "Ваш аккаунт заблокирован. Обратитесь к администратору",
    "ACCOUNT_PENDING": "Ваш аккаунт ещё не подтверждён",
    "TOO_MANY_ATTEMPTS": "Слишком много попыток. Попробуйте через 15 минут",
    "EMAIL_TAKEN": "Этот email уже зарегистрирован",
    "WRONG_PASSWORD": "Текущий пароль неверен",
    "NOT_AUTHENTICATED": "Войдите в систему снова",
    "INVALID_TOKEN": "Сессия истекла. Войдите снова",
    "NO_REFRESH_TOKEN": "Сессия не найдена. Войдите снова",
    "INVALID_REFRESH_TOKEN": "Сессия недействительна. Войдите снова",
    "REFRESH_EXPIRED": "Сессия истекла. Войдите снова",
    "REFRESH_REUSED": "Сессия закрыта в целях безопасности. Войдите снова",
    "FORBIDDEN": "Недостаточно прав для этого действия",
    "NOT_SUBJECT_TEACHER": "Вы не закреплены за этим предметом",
    "NOT_A_TEACHER": "Закрепить можно только преподавателей",
    "CANNOT_MODIFY_SELF": "Свой аккаунт здесь изменить нельзя",
    "USER_NOT_FOUND": "Пользователь не найден",
    "SUBJECT_NOT_FOUND": "Предмет не найден",
    "TOPIC_NOT_FOUND": "Тема не найдена",
    "STEP_NOT_FOUND": "Этап не найден",
    "MATERIAL_NOT_FOUND": "Материал не найден",
    "GLOSSARY_TERM_NOT_FOUND": "Термин не найден",
    "LITERATURE_NOT_FOUND": "Источник не найден",
    "SLUG_TAKEN": "Такой slug уже занят. Введите другой",
    "INVALID_ORDER": "Список тем устарел. Обновите страницу",
    "STEP_DOES_NOT_ACCEPT_FILES": "На этот этап нельзя загружать файлы",
    "STEP_EMPTY": "На этом этапе пока нет материалов",
    "STEP_NOT_COMPLETABLE": "Этот этап завершается выполнением задания",
    "UNSUPPORTED_FILE_TYPE": "Можно загрузить только PDF, PPT, PPTX, DOC или DOCX",
    "FILE_TOO_LARGE": "Файл слишком большой (до 50 МБ)",
    "INVALID_PDF": "PDF повреждён, зашифрован или пуст",
    "MATERIAL_PROCESSING": "Материал ещё обрабатывается. Дождитесь завершения",
    "MATERIAL_NOT_FAILED": "Повторно обработать можно только материал с ошибкой"
  },
  "materialErrors": {
    "CONVERSION_FAILED": "Не удалось преобразовать файл в PDF. Проверьте файл и попробуйте снова",
    "CONVERSION_TIMEOUT": "Преобразование заняло слишком много времени. Попробуйте снова",
    "LIBREOFFICE_NOT_FOUND": "На сервере не установлен LibreOffice. Обратитесь к администратору или загрузите PDF",
    "STORAGE_FAILED": "Не удалось сохранить файл. Попробуйте снова",
    "INTERRUPTED": "Преобразование прервано перезапуском сервера. Попробуйте снова",
    "INVALID_PDF": "Полученный PDF повреждён. Проверьте исходный файл"
  },
  "roles": { "student": "Студент", "teacher": "Преподаватель", "admin": "Администратор" },
  "steps": {
    "review": "Повторение",
    "lecture": "Лекция",
    "presentation": "Презентация",
    "practice": "Практическое занятие",
    "task": "Задание",
    "glossary": "Глоссарий",
    "literature": "Литература"
  },
  "notFound": {
    "title": "Страница не найдена",
    "text": "Возможно, ссылка устарела или набрана с ошибкой",
    "home": "На главную"
  },
  "home": {
    "badge": "БухГПИ · Технологическое образование",
    "title": "Методическая платформа для будущих учителей технологии",
    "subtitle": "Лекции, презентации, глоссарий и литература — каждая тема как понятный путь из 7 этапов",
    "start": "Начать",
    "continue": "Перейти в кабинет",
    "features": {
      "steps": {
        "title": "Темы из 7 этапов",
        "text": "От повторения до литературы — каждая тема в одном понятном порядке"
      },
      "player": {
        "title": "Удобный плеер уроков",
        "text": "Читайте лекции и презентации прямо в браузере, даже с телефона"
      },
      "language": {
        "title": "На узбекском и русском",
        "text": "Меняйте язык интерфейса в любой момент"
      }
    }
  },
  "auth": {
    "email": "Email",
    "password": "Пароль",
    "passwordConfirm": "Повторите пароль",
    "passwordHint": "Не менее 8 символов",
    "fullName": "Имя и фамилия",
    "phone": "Телефон",
    "phoneHint": "Необязательно",
    "login": { "title": "Вход", "submit": "Войти", "noAccount": "Нет аккаунта?" },
    "register": { "title": "Регистрация", "submit": "Зарегистрироваться", "haveAccount": "Уже есть аккаунт?" }
  },
  "pending": {
    "title": "Ожидает подтверждения",
    "textUser": "{{name}}, ваш аккаунт ожидает подтверждения администратором. После подтверждения вы получите полный доступ к платформе.",
    "textGuest": "Вы зарегистрировались! Войти можно будет после подтверждения аккаунта администратором."
  },
  "student": {
    "hello": "Здравствуйте, {{name}}!",
    "continue": "Продолжить",
    "subjects": "Предметы",
    "noSubjects": "Пока нет предметов",
    "noSubjectsText": "Предметы появятся здесь сразу после публикации",
    "topicCount": "Тем: {{count}}",
    "allSubjects": "Все предметы",
    "noTopics": "В этом предмете пока нет тем",
    "topicNumber": "Тема {{number}}",
    "topicDone": "Пройдено"
  },
  "player": {
    "steps": "Этапы темы",
    "noContent": "Пока нет материалов",
    "noContentText": "Материал появится здесь, когда преподаватель его добавит",
    "complete": "Готово",
    "completed": "Пройдено",
    "completedToast": "Этап пройден! Отлично 🎉",
    "next": "Следующий этап",
    "openLink": "Открыть ссылку",
    "pdfError": "Не удалось открыть PDF",
    "prevPage": "Предыдущая страница",
    "nextPage": "Следующая страница",
    "pageOf": "{{page}} / {{total}}"
  },
  "profile": {
    "title": "Профиль",
    "role": "Роль",
    "personal": "Личные данные",
    "language": "Язык интерфейса",
    "saved": "Изменения сохранены",
    "passwordTitle": "Пароль",
    "currentPassword": "Текущий пароль",
    "newPassword": "Новый пароль",
    "changePassword": "Сменить пароль",
    "passwordChanged": "Пароль изменён. Войдите с новым паролем"
  },
  "teach": {
    "title": "Редактор тем",
    "noSubjects": "За вами пока не закреплён ни один предмет",
    "noSubjectsText": "Темы появятся здесь, когда администратор закрепит вас за предметом",
    "noTopics": "В этом предмете пока нет тем",
    "newTopicLabel": "Название новой темы",
    "newTopicPlaceholder": "Например: Основы выбора профессии",
    "addTopic": "Добавить тему",
    "moveUp": "Переместить «{{title}}» выше",
    "moveDown": "Переместить «{{title}}» ниже",
    "deleteTopic": "Удалить «{{title}}»",
    "deleteTopicTitle": "Удаление темы",
    "deleteTopicText": "Тема «{{title}}» будет удалена вместе со всеми материалами. Это действие нельзя отменить.",
    "backToTopics": "Список тем",
    "topicTitle": "Название темы",
    "topicSummary": "Краткое содержание",
    "topicPublished": "Показывать студентам (опубликовано)",
    "topicSaved": "Тема сохранена",
    "stepsLabel": "Этапы темы",
    "comingSoon": "Этот этап появится в следующем обновлении",
    "comingSoonText": "Тесты, вопросы «да/нет», кроссворды и задания появятся на 2-м этапе разработки",
    "materialTitle": "Название материала",
    "materialFile": "Файл",
    "materialFileHint": "PDF, PPT, PPTX, DOC или DOCX · до 50 МБ",
    "upload": "Загрузить",
    "materialUploaded": "Файл загружен",
    "noMaterials": "На этом этапе пока нет материалов",
    "deleteMaterialTitle": "Удаление материала",
    "deleteMaterialText": "Материал «{{title}}» будет удалён.",
    "pagesCount": "{{count}} стр.",
    "status": { "processing": "Обрабатывается", "ready": "Готово", "failed": "Ошибка" },
    "term": "Термин",
    "definition": "Определение",
    "addTerm": "Новый термин",
    "noGlossary": "Глоссарий пока пуст",
    "deleteTermTitle": "Удаление термина",
    "deleteItemText": "Элемент «{{title}}» будет удалён.",
    "litTitle": "Название",
    "litAuthor": "Автор",
    "litYear": "Год",
    "litUrl": "Ссылка (необязательно)",
    "addLiterature": "Новый источник",
    "noLiterature": "Список литературы пока пуст",
    "deleteLiteratureTitle": "Удаление источника"
  },
  "admin": {
    "users": {
      "title": "Пользователи",
      "filter": "Фильтр по статусу",
      "filters": { "pending": "Ожидают подтверждения", "active": "Активные", "blocked": "Заблокированные", "all": "Все" },
      "statuses": { "pending": "Ожидает", "active": "Активен", "blocked": "Заблокирован" },
      "searchLabel": "Поиск по имени или email",
      "searchPlaceholder": "Имя или email",
      "empty": "Пользователи не найдены",
      "approve": "Подтвердить",
      "block": "Заблокировать",
      "unblock": "Разблокировать",
      "tempPassword": "Временный пароль",
      "tempTitle": "Новый временный пароль",
      "tempText": "Новый пароль для {{name}}. Передайте его пользователю безопасным способом — после закрытия окна пароль больше не будет показан.",
      "roleFor": "Роль: {{name}}",
      "you": "(вы)"
    },
    "subjects": {
      "title": "Управление предметами",
      "new": "Новый предмет",
      "newTitle": "Создание предмета",
      "editTitle": "Редактирование предмета",
      "empty": "Предметов пока нет",
      "titleLabel": "Название предмета",
      "slugLabel": "Slug (адрес)",
      "slugHint": "Если оставить пустым, создаётся автоматически из названия",
      "descriptionLabel": "Описание",
      "orderLabel": "Порядковый номер",
      "publishedLabel": "Показывать студентам (опубликовано)",
      "publish": "Опубликовать",
      "unpublish": "Снять с публикации",
      "teachers": "Преподаватели",
      "teachersTitle": "Преподаватели предмета «{{title}}»",
      "noTeachers": "Нет активных преподавателей. Сначала назначьте пользователю роль «Преподаватель».",
      "noAssigned": "Преподаватели не закреплены",
      "saved": "Сохранено",
      "deleteTitle": "Удаление предмета",
      "deleteText": "Предмет «{{title}}» будет удалён вместе со всеми темами и материалами. Это действие нельзя отменить."
    }
  }
}
```

- [ ] **Step 6: Test setup'ga i18n'ni ulash**

`frontend/src/test/setup.ts` (to'liq yangi ko'rinishi):

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { setLanguage } from '@/i18n'

beforeEach(() => {
  // Til, localStorage'dagi tanlov va <html lang> har test oldidan tiklanadi.
  setLanguage('uz')
})

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 7: Testlar o'tishini tekshirish**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS (5 ta test: App smoke + 4 ta i18n), xatosiz.

- [ ] **Step 8: CHANGELOG va commit**

CHANGELOG qatori: `- i18n: to'liq uz/ru lug'atlari (backend xato kodlari bilan), til tanlovini eslab qolish, kalitlar mosligi testi.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): uz/ru i18n dictionaries and language switching"
```

---

### Task 3: Dizayn tizimi — asosiy UI komponentlari

**Files:**
- Create: `frontend/src/lib/cx.ts`, `frontend/src/components/ui/button-classes.ts`
- Create: `frontend/src/components/ui/Button.tsx`, `Spinner.tsx`, `Card.tsx`, `Badge.tsx`, `EmptyState.tsx`, `Field.tsx`
- Test: `frontend/src/components/ui/Button.test.tsx`, `frontend/src/components/ui/Field.test.tsx`

Dizayn qoidalari (spec, "Yorqin ilova"):
- asosiy rang teal, neytral rang slate;
- radiuslar 12–16px (`rounded-xl` va `rounded-2xl`);
- asosiy tugmalarda pastki "3D" soya (`shadow-press`), bosilganda tugma pastga siljiydi;
- animatsiyalar `motion-reduce:` orqali o'chiriladi.

- [ ] **Step 1: Yordamchi funksiyalar**

`frontend/src/lib/cx.ts`:

```ts
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
```

`frontend/src/components/ui/button-classes.ts` (`Link`ni tugma ko'rinishida chiqarish uchun ham ishlatiladi):

```ts
import { cx } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const PRESS = 'active:translate-y-[3px] active:shadow-none motion-reduce:active:translate-y-0'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: cx('bg-brand-500 text-white shadow-press hover:bg-brand-600', PRESS),
  secondary: cx(
    'border-2 border-slate-200 bg-white text-slate-800 shadow-press-slate hover:bg-slate-50',
    PRESS,
  ),
  danger: cx('bg-red-500 text-white shadow-press-danger hover:bg-red-600', PRESS),
  ghost: 'text-brand-700 hover:bg-brand-50',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition',
    'motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2',
    'focus-visible:outline-brand-500 disabled:pointer-events-none disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
```

- [ ] **Step 2: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/components/ui/Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

test('bosilganda onClick chaqiriladi', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Saqlash</Button>)
  await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }))
  expect(onClick).toHaveBeenCalledOnce()
})

test('loading holatida tugma bloklanadi va nomi o\'zgarmaydi', () => {
  render(<Button loading>Saqlash</Button>)
  const button = screen.getByRole('button', { name: 'Saqlash' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
})

test('sukut bo\'yicha type="button"', () => {
  render(<Button>OK</Button>)
  expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
})
```

`frontend/src/components/ui/Field.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { Field, Input } from './Field'

test('label input bilan bog\'langan', () => {
  render(
    <Field id="email" label="Email">
      <Input id="email" />
    </Field>,
  )
  expect(screen.getByLabelText('Email')).toBeInstanceOf(HTMLInputElement)
})

test('xato kaliti i18n orqali tarjima qilinadi', () => {
  render(
    <Field id="email" label="Email" error="validation.required">
      <Input id="email" />
    </Field>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('validation.required'))
})
```

- [ ] **Step 3: Testlar yiqilishini tekshirish**

Run: `npm test -- src/components/ui`
Expected: FAIL — `Cannot find module './Button'` / `'./Field'`.

- [ ] **Step 4: Komponentlarni yozish**

`frontend/src/components/ui/Spinner.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { cx } from '@/lib/cx'

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-10' } as const

interface SpinnerProps {
  size?: keyof typeof SIZES
  /** Tugma ichida: ekran o'quvchiga e'lon qilinmaydi, tugma nomini buzmaydi. */
  decorative?: boolean
}

export function Spinner({ size = 'md', decorative = false }: SpinnerProps) {
  const { t } = useTranslation()
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'status', 'aria-label': t('common.loading') }
  return (
    <svg
      className={cx(SIZES[size], 'animate-spin motion-reduce:animate-none')}
      viewBox="0 0 24 24"
      fill="none"
      {...a11y}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-16 text-brand-500">
      <Spinner size="lg" />
    </div>
  )
}
```

`frontend/src/components/ui/Button.tsx`:

```tsx
import type { ComponentProps } from 'react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-classes'
import { Spinner } from './Spinner'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant,
  size,
  loading = false,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size="sm" decorative />}
      {children}
    </button>
  )
}
```

`frontend/src/components/ui/Card.tsx`:

```tsx
import type { ComponentProps } from 'react'
import { cx } from '@/lib/cx'

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cx('rounded-2xl border-2 border-slate-100 bg-white p-5', className)} {...rest} />
}
```

`frontend/src/components/ui/Badge.tsx`:

```tsx
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Tone = 'brand' | 'slate' | 'amber' | 'red' | 'green'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-100 text-brand-900',
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  green: 'bg-emerald-100 text-emerald-800',
}

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONES[tone],
      )}
    >
      {children}
    </span>
  )
}
```

`frontend/src/components/ui/EmptyState.tsx`:

```tsx
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  text?: string
  action?: ReactNode
}

export function EmptyState({ icon = '📭', title, text, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      {text && <p className="max-w-md text-slate-600">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
```

`frontend/src/components/ui/Field.tsx` (`error` — i18n kaliti, masalan zod xabaridagi `validation.required`):

```tsx
import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/lib/cx'

const CONTROL =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-base outline-none transition ' +
  'focus:border-brand-500 aria-[invalid=true]:border-red-400 disabled:bg-slate-50'

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Field({ id, label, error, hint, children }: FieldProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {t(error)}
        </p>
      )}
    </div>
  )
}

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={cx(CONTROL, className)} {...rest} />
}

export function Textarea({ className, rows = 4, ...rest }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cx(CONTROL, 'resize-y', className)} {...rest} />
}

export function Select({ className, ...rest }: ComponentProps<'select'>) {
  return <select className={cx(CONTROL, 'pr-8', className)} {...rest} />
}

export function Checkbox({ label, className, ...rest }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className={cx('inline-flex items-center gap-2 text-sm font-medium', className)}>
      <input type="checkbox" className="size-4 accent-brand-500" {...rest} />
      {label}
    </label>
  )
}
```

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `npm test -- src/components/ui`
Expected: PASS (5 ta test).

Run: `npm run lint && npm run typecheck`
Expected: xatosiz.

- [ ] **Step 6: CHANGELOG va commit**

CHANGELOG qatori: `- Dizayn tizimi: Button, Card, Badge, Spinner, EmptyState, Field komponentlari.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): design tokens and base ui components"
```

---

### Task 4: UI — ProgressRing, Modal, Tabs, Toast

**Files:**
- Create: `frontend/src/components/ui/ProgressRing.tsx`, `Modal.tsx`, `Tabs.tsx`, `toast-store.ts`, `Toast.tsx`
- Modify: `frontend/src/test/setup.ts`
- Test: `frontend/src/components/ui/ProgressRing.test.tsx`, `Modal.test.tsx`, `Tabs.test.tsx`, `Toast.test.tsx`

- [ ] **Step 1: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/components/ui/ProgressRing.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { ProgressRing } from './ProgressRing'

test('progress matn va aria-label bilan ko\'rsatiladi', () => {
  render(<ProgressRing completed={3} total={7} />)
  const ring = screen.getByRole('img', { name: i18n.t('common.progress', { completed: 3, total: 7 }) })
  expect(ring).toHaveTextContent('3/7')
})

test('total=0 bo\'lsa halqa bo\'sh', () => {
  const { container } = render(<ProgressRing completed={0} total={0} size={56} />)
  const arc = container.querySelectorAll('circle')[1]
  expect(arc.getAttribute('stroke-dashoffset')).toBe(arc.getAttribute('stroke-dasharray'))
})
```

`frontend/src/components/ui/Modal.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog, Modal } from './Modal'

test('ochiq modal dialog sifatida ko\'rinadi va Escape bilan yopiladi', async () => {
  const onClose = vi.fn()
  render(
    <Modal open title="Fan" onClose={onClose}>
      <input aria-label="Nomi" />
    </Modal>,
  )
  expect(screen.getByRole('dialog', { name: 'Fan' })).toBeInTheDocument()
  expect(screen.getByLabelText('Nomi')).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledOnce()
})

test('yopiq modal hech narsa chizmaydi', () => {
  render(
    <Modal open={false} title="Fan" onClose={() => {}}>
      x
    </Modal>,
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('ConfirmDialog tasdiqlash tugmasini chaqiradi', async () => {
  const onConfirm = vi.fn()
  render(
    <ConfirmDialog open title="O'chirish" text="Ishonchingiz komilmi?" confirmLabel="Ha" onConfirm={onConfirm} onCancel={() => {}} />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Ha' }))
  expect(onConfirm).toHaveBeenCalledOnce()
})
```

`frontend/src/components/ui/Tabs.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Tabs } from './Tabs'

function Harness() {
  const [value, setValue] = useState<'a' | 'b'>('a')
  return (
    <Tabs
      label="Bo'limlar"
      value={value}
      onChange={setValue}
      items={[
        { id: 'a', label: 'Birinchi' },
        { id: 'b', label: 'Ikkinchi' },
      ]}
    />
  )
}

test('bosilgan tab tanlanadi, strelka bilan o\'tiladi', async () => {
  render(<Harness />)
  expect(screen.getByRole('tab', { name: 'Birinchi' })).toHaveAttribute('aria-selected', 'true')
  await userEvent.click(screen.getByRole('tab', { name: 'Ikkinchi' }))
  expect(screen.getByRole('tab', { name: 'Ikkinchi' })).toHaveAttribute('aria-selected', 'true')
  await userEvent.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Birinchi' })).toHaveAttribute('aria-selected', 'true')
})
```

`frontend/src/components/ui/Toast.test.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from './Toast'
import { pushToast } from './toast-store'

test('pushToast xabarni ko\'rsatadi va yopish tugmasi uni olib tashlaydi', async () => {
  render(<Toaster />)
  act(() => pushToast('success', 'Saqlandi'))
  expect(screen.getByText('Saqlandi')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /yopish|закрыть/i }))
  expect(screen.queryByText('Saqlandi')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Testlar yiqilishini tekshirish**

Run: `npm test -- src/components/ui`
Expected: FAIL — yangi modullar topilmaydi.

- [ ] **Step 3: Komponentlarni yozish**

`frontend/src/components/ui/ProgressRing.tsx`:

```tsx
import { useTranslation } from 'react-i18next'

interface ProgressRingProps {
  completed: number
  total: number
  size?: number
}

export function ProgressRing({ completed, total, size = 56 }: ProgressRingProps) {
  const { t } = useTranslation()
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? Math.min(completed / total, 1) : 0
  const center = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={t('common.progress', { completed, total })}
      className="shrink-0"
    >
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-brand-100)" strokeWidth={stroke} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-brand-500)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-slate-700 text-xs font-bold"
      >
        {completed}/{total}
      </text>
    </svg>
  )
}
```

`frontend/src/components/ui/Modal.tsx` (native `<dialog>` ishlatilmaydi, chunki jsdom'da `showModal()` qo'llab-quvvatlanmaydi):

```tsx
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const first =
      panel?.querySelector<HTMLElement>('input, select, textarea') ??
      panel?.querySelector<HTMLElement>('button')
    first?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg px-2 text-xl leading-none text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  text: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  pending?: boolean
}

export function ConfirmDialog({ open, title, text, confirmLabel, onConfirm, onCancel, pending }: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-slate-700">{text}</p>
    </Modal>
  )
}
```

`frontend/src/components/ui/Tabs.tsx`:

```tsx
import type { KeyboardEvent, ReactNode } from 'react'
import { cx } from '@/lib/cx'

export interface TabItem<T extends string> {
  id: T
  label: string
  badge?: ReactNode
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
}

export function Tabs<T extends string>({ items, value, onChange, label }: TabsProps<T>) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const index = items.findIndex((item) => item.id === value)
    const step = event.key === 'ArrowRight' ? 1 : -1
    const next = items[(index + step + items.length) % items.length]
    onChange(next.id)
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex gap-1 overflow-x-auto border-b-2 border-slate-100"
    >
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            data-tab={item.id}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cx(
              '-mb-0.5 inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold whitespace-nowrap',
              selected ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {item.label}
            {item.badge}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className="pt-5">
      {children}
    </div>
  )
}
```

`frontend/src/components/ui/toast-store.ts` (React'dan tashqarida ham chaqiriladi, masalan TanStack Query'ning global `onError`'idan):

```ts
export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  kind: ToastKind
  text: string
}

const TOAST_MS = 5000
let items: ToastItem[] = []
let nextId = 1
const subscribers = new Set<() => void>()

function emit(): void {
  subscribers.forEach((notify) => notify())
}

export function pushToast(kind: ToastKind, text: string): void {
  const id = nextId++
  items = [...items, { id, kind, text }]
  emit()
  setTimeout(() => dismissToast(id), TOAST_MS)
}

export function dismissToast(id: number): void {
  items = items.filter((item) => item.id !== id)
  emit()
}

export function clearToasts(): void {
  items = []
  emit()
}

export function subscribeToasts(callback: () => void): () => void {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}

export function getToasts(): ToastItem[] {
  return items
}
```

`frontend/src/components/ui/Toast.tsx`:

```tsx
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/lib/cx'
import { dismissToast, getToasts, subscribeToasts, type ToastKind } from './toast-store'

const KIND_CLASSES: Record<ToastKind, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-brand-200 bg-brand-50 text-brand-900',
}

export function Toaster() {
  const { t } = useTranslation()
  const toasts = useSyncExternalStore(subscribeToasts, getToasts)
  return (
    <div aria-live="polite" className="fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:items-end">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          className={cx('flex w-full max-w-sm items-start gap-3 rounded-xl border-2 px-4 py-3 shadow-lg', KIND_CLASSES[toast.kind])}
        >
          <p className="flex-1 text-sm font-medium">{toast.text}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label={t('common.close')}
            className="text-lg leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Test setup'da toast'larni tozalash**

`frontend/src/test/setup.ts` (to'liq yangi ko'rinishi):

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { clearToasts } from '@/components/ui/toast-store'
import { setLanguage } from '@/i18n'

beforeEach(() => {
  // Til, localStorage'dagi tanlov va <html lang> har test oldidan tiklanadi.
  setLanguage('uz')
})

afterEach(() => {
  cleanup()
  clearToasts()
})
```

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `npm test`
Expected: PASS (barcha testlar, shu jumladan oldingi tasklarniki).

Run: `npm run lint && npm run typecheck`
Expected: xatosiz.

- [ ] **Step 6: CHANGELOG va commit**

CHANGELOG qatori: `- UI: ProgressRing, Modal/ConfirmDialog, Tabs, Toast.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): progress ring, modal, tabs and toast components"
```

---

> **Amalga oshirishdagi farqlar (Task 3–4, kod review'dan keyin, `27eb657`):** quyidagi komponentlar yuqoridagi koddan biroz farq qiladi, haqiqiy manba — repodagi fayllar.
> - `Tabs`: chiziq `shadow-[inset_...]` bilan chiziladi, `-mb-0.5` yo'q.
> - `Field`: fokus halqasi (`focus:ring-*`) qo'shildi. Xato va izoh matnlari `aria-describedby`/`aria-invalid` orqali kontekst bilan `Input`/`Textarea`/`Select`ga bog'lanadi.
> - `Modal`: Tab tugmasi bilan fokus oyna ichida qoladi, sahifa scroll'i qulflanadi, `describedBy` prop'i bor. `ConfirmDialog` `pending` paytida yopilmaydi.
> - `toast-store`: taymerlar tozalanadi, xato toast'i 10 soniya turadi.
> - `Button`: primary va danger variantlarida `border-transparent`, fokus chizig'i `brand-700` rangida.

### Task 5: API qatlami — tiplar, client (refresh bilan), xatolar, QueryClient

**Files:**
- Create: `frontend/src/api/types.ts`, `client.ts`, `errors.ts`, `queryClient.ts`
- Create: `frontend/src/components/ui/ErrorState.tsx`, `frontend/src/components/ui/FormError.tsx`
- Create: `frontend/src/test/server.ts`
- Modify: `frontend/src/test/setup.ts`
- Test: `frontend/src/api/client.test.ts`, `frontend/src/api/errors.test.ts`

**Asosiy qoidalar:**
- Access token faqat modul o'zgaruvchisida (xotirada) turadi. `localStorage`ga yozilmaydi, shunda XSS orqali o'g'irlanmaydi.
- 401 javobi `INVALID_TOKEN` yoki `NOT_AUTHENTICATED` kodi bilan kelsa, client `POST /api/auth/refresh` qiladi va so'rovni **bir marta** qayta yuboradi.
- Bir vaqtda kelgan bir nechta 401 uchun refresh faqat bitta bo'ladi (single-flight). Agar 401 kelgan paytda token boshqa so'rov tomonidan allaqachon yangilangan bo'lsa, refresh qilinmaydi, so'rov yangi token bilan darhol qayta yuboriladi.
- Refresh muvaffaqiyatsiz bo'lsa, `onLost()` chaqiriladi va sessiya yopiladi (Task 6).
- `auth: false` bo'lgan so'rovlar (login, register, logout) hech qachon refresh qilinmaydi.

- [ ] **Step 1: `frontend/src/api/types.ts` — backend sxemalarining aniq aksi**

```ts
// backend/app/auth/schemas.py, learning/schemas.py, learning/student_schemas.py bilan mos.

export type Role = 'student' | 'teacher' | 'admin'
export type UserStatus = 'pending' | 'active' | 'blocked'
export type Locale = 'uz' | 'ru'
export type StepKind = 'review' | 'lecture' | 'presentation' | 'practice' | 'task' | 'glossary' | 'literature'
export type MaterialStatus = 'processing' | 'ready' | 'failed'
export type ProgressStatus = 'in_progress' | 'completed'

export interface ApiErrorBody {
  code: string
  message: string
  details: Record<string, unknown>
}

// --- auth ---
export interface User {
  id: number
  email: string
  phone: string | null
  full_name: string
  role: Role
  status: UserStatus
  locale: Locale
}

export interface TokenOut {
  access_token: string
  token_type: string
  user: User
}

export interface LoginIn {
  email: string
  password: string
}

export interface RegisterIn {
  email: string
  password: string
  full_name: string
  phone: string | null
  locale: Locale
}

export interface MeUpdateIn {
  full_name?: string
  phone?: string | null
  locale?: Locale
}

export interface PasswordChangeIn {
  current_password: string
  new_password: string
}

export interface AdminUserUpdateIn {
  role?: Role
  status?: UserStatus
}

export interface TempPasswordOut {
  temp_password: string
}

// --- talaba ---
export interface Progress {
  completed: number
  total: number
}

export interface SubjectCard {
  id: number
  title: string
  slug: string
  description: string
  cover: string | null
  topic_count: number
  progress: Progress
}

export interface TopicCard {
  id: number
  title: string
  summary: string
  order: number
  progress: Progress
}

export interface SubjectDetail {
  id: number
  title: string
  slug: string
  description: string
  cover: string | null
  topics: TopicCard[]
}

export interface StepBrief {
  id: number
  kind: StepKind
  order: number
  has_content: boolean
  status: ProgressStatus | null
}

export interface TopicDetail {
  id: number
  title: string
  summary: string
  subject: { id: number; title: string; slug: string }
  steps: StepBrief[]
  progress: Progress
}

export interface MaterialView {
  id: number
  title: string
  page_count: number | null
  file_url: string
}

export interface GlossaryTerm {
  id: number
  term: string
  definition: string
  order: number
}

export interface LiteratureItem {
  id: number
  title: string
  author: string
  year: number | null
  url: string | null
  order: number
}

export interface StepContent {
  id: number
  topic_id: number
  kind: StepKind
  order: number
  has_content: boolean
  status: ProgressStatus | null
  materials: MaterialView[]
  glossary: GlossaryTerm[]
  literature: LiteratureItem[]
}

export interface ContinueTarget {
  subject_id: number
  subject_slug: string
  subject_title: string
  topic_id: number
  topic_title: string
  step_id: number
  step_kind: StepKind
}

export interface SubjectProgress {
  subject_id: number
  subject_title: string
  subject_slug: string
  progress: Progress
}

// --- o'qituvchi ---
export interface Material {
  id: number
  step_id: number
  title: string
  original_name: string
  page_count: number | null
  status: MaterialStatus
  error: string | null
}

export interface StepEditor {
  id: number
  kind: StepKind
  order: number
  materials: Material[]
}

export interface TopicEditor {
  id: number
  subject_id: number
  title: string
  summary: string
  order: number
  is_published: boolean
  steps: StepEditor[]
  glossary: GlossaryTerm[]
  literature: LiteratureItem[]
}

export interface TeachTopicBrief {
  id: number
  title: string
  order: number
  is_published: boolean
}

export interface TeachSubject {
  id: number
  title: string
  slug: string
  is_published: boolean
  topics: TeachTopicBrief[]
}

export interface TopicCreate {
  title: string
  summary?: string
  is_published?: boolean
}

export type TopicUpdate = Partial<TopicCreate>

export interface GlossaryIn {
  term: string
  definition: string
}

export interface LiteratureIn {
  title: string
  author: string
  year: number | null
  url: string | null
}

// --- admin ---
export interface SubjectAdmin {
  id: number
  title: string
  slug: string
  description: string
  cover: string | null
  order: number
  is_published: boolean
  teacher_ids: number[]
}

export interface SubjectCreate {
  title: string
  slug: string | null
  description: string
  order: number
  is_published: boolean
}

export type SubjectUpdate = Partial<SubjectCreate>
```

- [ ] **Step 2: MSW server va test setup**

`frontend/src/test/server.ts`:

```ts
import { setupServer } from 'msw/node'

// Har test o'ziga kerakli handler'larni `server.use(...)` bilan qo'shadi.
export const server = setupServer()
```

`frontend/src/test/setup.ts` (to'liq yangi ko'rinishi):

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { resetAuthHandlers, setAccessToken } from '@/api/client'
import { clearToasts } from '@/components/ui/toast-store'
import { setLanguage } from '@/i18n'
import { server } from './server'

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

beforeEach(() => {
  // Til, localStorage'dagi tanlov va <html lang> har test oldidan tiklanadi.
  setLanguage('uz')
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  clearToasts()
  setAccessToken(null)
  resetAuthHandlers()
})

afterAll(() => {
  server.close()
})
```

- [ ] **Step 3: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/api/client.test.ts`:

```ts
import { http, HttpResponse } from 'msw/http'
import { server } from '@/test/server'
import { ApiError, apiFetch, getAccessToken, setAccessToken, setAuthHandlers } from './client'
import type { TokenOut } from './types'

const session: TokenOut = {
  access_token: 'new-token',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'talaba@example.uz',
    phone: null,
    full_name: 'Dilnoza Karimova',
    role: 'student',
    status: 'active',
    locale: 'uz',
  },
}

const invalidToken = () =>
  HttpResponse.json({ code: 'INVALID_TOKEN', message: 'Token yaroqsiz', details: {} }, { status: 401 })

test('Bearer token yuboriladi va JSON qaytadi', async () => {
  setAccessToken('abc')
  server.use(
    http.get('/api/me', ({ request }) => HttpResponse.json({ auth: request.headers.get('Authorization') })),
  )
  await expect(apiFetch('/api/me')).resolves.toEqual({ auth: 'Bearer abc' })
})

test('JSON body Content-Type bilan yuboriladi', async () => {
  server.use(
    http.post('/api/echo', async ({ request }) =>
      HttpResponse.json({ type: request.headers.get('Content-Type'), body: await request.json() }),
    ),
  )
  await expect(apiFetch('/api/echo', { method: 'POST', json: { a: 1 } })).resolves.toEqual({
    type: 'application/json',
    body: { a: 1 },
  })
})

test('204 javobda undefined qaytadi', async () => {
  server.use(http.delete('/api/teach/topics/1', () => new HttpResponse(null, { status: 204 })))
  await expect(apiFetch('/api/teach/topics/1', { method: 'DELETE' })).resolves.toBeUndefined()
})

test('xato javob ApiError ga aylanadi', async () => {
  server.use(
    http.get('/api/topics/1', () =>
      HttpResponse.json({ code: 'TOPIC_NOT_FOUND', message: 'Mavzu topilmadi', details: {} }, { status: 404 }),
    ),
  )
  const error = await apiFetch('/api/topics/1').catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  expect(error).toMatchObject({ status: 404, code: 'TOPIC_NOT_FOUND', message: 'Mavzu topilmadi' })
})

test('JSON bo\'lmagan xato HTTP_<status> kodini oladi', async () => {
  server.use(http.get('/api/subjects', () => HttpResponse.text('Bad gateway', { status: 502 })))
  await expect(apiFetch('/api/subjects')).rejects.toMatchObject({ status: 502, code: 'HTTP_502' })
})

test('401 da bitta refresh, so\'ng so\'rovlar yangi token bilan qayta yuboriladi', async () => {
  setAccessToken('old')
  const onRefreshed = vi.fn()
  setAuthHandlers({ onRefreshed, onLost: vi.fn() })
  let refreshCalls = 0
  server.use(
    http.post('/api/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.json(session)
    }),
    http.get('/api/subjects', ({ request }) =>
      request.headers.get('Authorization') === 'Bearer new-token' ? HttpResponse.json([]) : invalidToken(),
    ),
  )
  await expect(Promise.all([apiFetch('/api/subjects'), apiFetch('/api/subjects')])).resolves.toEqual([[], []])
  expect(refreshCalls).toBe(1)
  expect(getAccessToken()).toBe('new-token')
  expect(onRefreshed).toHaveBeenCalledWith(session)
})

test('refresh muvaffaqiyatsiz bo\'lsa onLost chaqiriladi va asl xato tashlanadi', async () => {
  setAccessToken('old')
  const onLost = vi.fn()
  setAuthHandlers({ onRefreshed: vi.fn(), onLost })
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ code: 'NO_REFRESH_TOKEN', message: 'Sessiya topilmadi', details: {} }, { status: 401 }),
    ),
    http.get('/api/subjects', invalidToken),
  )
  await expect(apiFetch('/api/subjects')).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
  expect(onLost).toHaveBeenCalledOnce()
  expect(getAccessToken()).toBeNull()
})

test('auth: false so\'rovlarda refresh qilinmaydi', async () => {
  const refresh = vi.fn(() => HttpResponse.json(session))
  server.use(
    http.post('/api/auth/refresh', refresh),
    http.post('/api/auth/login', invalidToken),
  )
  await expect(apiFetch('/api/auth/login', { method: 'POST', json: {}, auth: false })).rejects.toMatchObject({
    code: 'INVALID_TOKEN',
  })
  expect(refresh).not.toHaveBeenCalled()
})
```

`frontend/src/api/errors.test.ts`:

```ts
import { i18n } from '@/i18n'
import { ApiError } from './client'
import { errorText } from './errors'

test('ma\'lum kod i18n orqali tarjima qilinadi', () => {
  const error = new ApiError(401, { code: 'INVALID_CREDENTIALS', message: 'server matni', details: {} })
  expect(errorText(error)).toBe(i18n.t('errors.INVALID_CREDENTIALS'))
})

test('noma\'lum kodda server xabari ko\'rsatiladi', () => {
  const error = new ApiError(400, { code: 'SOMETHING_NEW', message: 'Server xabari', details: {} })
  expect(errorText(error)).toBe('Server xabari')
})

test('tarmoq xatosi umumiy matn bilan', () => {
  expect(errorText(new TypeError('Failed to fetch'))).toBe(i18n.t('errors.NETWORK'))
})
```

- [ ] **Step 4: Testlar yiqilishini tekshirish**

Run: `npm test -- src/api`
Expected: FAIL — `./client` va `./errors` modullari topilmaydi.

- [ ] **Step 5: `frontend/src/api/client.ts`**

```ts
import type { ApiErrorBody, TokenOut } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || body.code)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.details = body.details
  }
}

interface AuthHandlers {
  onRefreshed: (session: TokenOut) => void
  onLost: () => void
}

const NOOP_HANDLERS: AuthHandlers = { onRefreshed: () => {}, onLost: () => {} }
const REFRESHABLE_CODES = new Set(['INVALID_TOKEN', 'NOT_AUTHENTICATED'])

let accessToken: string | null = null
let handlers: AuthHandlers = NOOP_HANDLERS
let refreshing: Promise<TokenOut | null> | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function setAuthHandlers(next: AuthHandlers): void {
  handlers = next
}

export function resetAuthHandlers(): void {
  handlers = NOOP_HANDLERS
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallback: ApiErrorBody = { code: `HTTP_${response.status}`, message: response.statusText, details: {} }
  try {
    const data = (await response.json()) as Partial<ApiErrorBody> | null
    if (data && typeof data.code === 'string') {
      return new ApiError(response.status, {
        code: data.code,
        message: data.message ?? data.code,
        details: data.details ?? {},
      })
    }
  } catch {
    // Javob JSON emas (masalan, proksi HTML sahifasi) — fallback ishlatiladi.
  }
  return new ApiError(response.status, fallback)
}

/** Refresh cookie orqali yangi access token oladi. Parallel chaqiruvlar bitta so'rovni bo'lishadi. */
export function refreshSession(): Promise<TokenOut | null> {
  refreshing ??= (async () => {
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
      if (!response.ok) {
        accessToken = null
        return null
      }
      const session = (await response.json()) as TokenOut
      accessToken = session.access_token
      handlers.onRefreshed(session)
      return session
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export interface RequestOptions {
  method?: string
  json?: unknown
  body?: FormData
  signal?: AbortSignal
  /** false: 401 kelganda refresh qilinmaydi (login, register, logout). */
  auth?: boolean
}

function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers = new Headers()
  if (options.json !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    signal: options.signal,
    credentials: 'same-origin',
  })
}

async function request(path: string, options: RequestOptions): Promise<Response> {
  const tokenUsed = accessToken
  let response = await send(path, options, tokenUsed)
  if (response.status === 401 && options.auth !== false) {
    const error = await toApiError(response.clone())
    if (REFRESHABLE_CODES.has(error.code)) {
      if (accessToken && accessToken !== tokenUsed) {
        // Token boshqa so'rov tomonidan allaqachon yangilangan.
        response = await send(path, options, accessToken)
      } else {
        const session = await refreshSession()
        if (session) {
          response = await send(path, options, session.access_token)
        } else {
          handlers.onLost()
        }
      }
    }
  }
  if (!response.ok) throw await toApiError(response)
  return response
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function apiBuffer(path: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await request(path, { signal })
  return response.arrayBuffer()
}
```

- [ ] **Step 6: `frontend/src/api/errors.ts`**

```ts
import { i18n } from '@/i18n'
import { ApiError } from './client'

/** Backend xato kodini joriy tilga o'giradi; tarjimasi yo'q kod uchun server xabari qaytadi. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    return i18n.t(`errors.${error.code}`, { defaultValue: error.message })
  }
  return i18n.t('errors.NETWORK')
}
```

- [ ] **Step 7: `frontend/src/api/queryClient.ts`**

```ts
import { MutationCache, QueryClient } from '@tanstack/react-query'
import { pushToast } from '@/components/ui/toast-store'
import { ApiError } from './client'
import { errorText } from './errors'

declare module '@tanstack/react-query' {
  interface Register {
    // silent: xato forma ichida ko'rsatiladi, umumiy toast chiqmaydi.
    mutationMeta: { silent?: boolean }
  }
}

function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 2
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silent) return
        pushToast('error', errorText(error))
      },
    }),
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: shouldRetry },
      mutations: { retry: false },
    },
  })
}
```

- [ ] **Step 8: Xato komponentlari**

`frontend/src/components/ui/ErrorState.tsx` (query xatolari sahifa ichida ko'rsatiladi):

```tsx
import { useTranslation } from 'react-i18next'
import { errorText } from '@/api/errors'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="⚠️"
      title={t('common.errorTitle')}
      text={errorText(error)}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )
      }
    />
  )
}
```

`frontend/src/components/ui/FormError.tsx`:

```tsx
import { errorText } from '@/api/errors'

export function FormError({ error }: { error: unknown }) {
  return (
    <div role="alert" className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
      {errorText(error)}
    </div>
  )
}
```

- [ ] **Step 9: Testlar o'tishini tekshirish**

Run: `npm test`
Expected: PASS.

Run: `npm run lint && npm run typecheck`
Expected: xatosiz.

- [ ] **Step 10: CHANGELOG va commit**

CHANGELOG qatori: `- API qatlami: tiplar, token xotirada, single-flight refresh, yagona xato matnlari, QueryClient.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): api client with token refresh, typed backend schemas, query client"
```

---

### Task 6: Sessiya, auth hook'lari va route guard'lari

**Files:**
- Create: `frontend/src/api/auth.ts`, `frontend/src/app/paths.ts`, `frontend/src/app/guards.tsx`, `frontend/src/app/SessionGate.tsx`
- Create: `frontend/src/test/render.tsx`
- Test: `frontend/src/app/guards.test.tsx`, `frontend/src/app/SessionGate.test.tsx`

**Sessiya modeli:**
- Joriy foydalanuvchi TanStack Query'da `['session']` kalitida turadi: `User` yoki `null` (mehmon).
- Ilova ochilganda `useSession()` refresh cookie orqali sessiyani tiklaydi. Shu vaqt ichida `SessionGate` splash ko'rsatadi.
- Login qilinganda, profil yangilanganda yoki refresh bo'lganda `['session']` darhol yangilanadi.
- Logout qilinganda yoki parol almashtirilganda `['session']` `null`ga o'rnatiladi va boshqa barcha kesh o'chiriladi.

- [ ] **Step 1: Test yordamchisi `frontend/src/test/render.tsx`**

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { installAuthHandlers, sessionKey } from '@/api/auth'
import { setAccessToken } from '@/api/client'
import { createQueryClient } from '@/api/queryClient'
import type { User } from '@/api/types'
import { Toaster } from '@/components/ui/Toast'

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'talaba@example.uz',
    phone: null,
    full_name: 'Dilnoza Karimova',
    role: 'student',
    status: 'active',
    locale: 'uz',
    ...overrides,
  }
}

export const studentUser = makeUser()
export const teacherUser = makeUser({ id: 2, email: 'oqituvchi@example.uz', full_name: 'Aziz Rahimov', role: 'teacher' })
export const adminUser = makeUser({ id: 3, email: 'admin@example.uz', full_name: 'Administrator', role: 'admin' })
export const pendingUser = makeUser({ id: 4, email: 'yangi@example.uz', full_name: 'Yangi Talaba', status: 'pending' })

interface RenderOptions {
  url?: string
  state?: unknown
  user?: User | null
}

export function renderRoutes(routes: RouteObject[], { url = '/', state, user = null }: RenderOptions = {}) {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: false },
  })
  queryClient.setQueryData(sessionKey, user)
  setAccessToken(user ? 'test-token' : null)
  installAuthHandlers(queryClient)
  const router = createMemoryRouter([...routes, { path: '*', element: <p>probe</p> }], {
    initialEntries: [state === undefined ? url : { pathname: url, state }],
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>,
  )
  return { ...result, router, queryClient }
}

/** Bitta sahifani `path` bo'yicha render qiladi; `url` — haqiqiy manzil (parametrlar bilan). */
export function renderRoute(
  element: ReactElement,
  { path = '/', ...options }: RenderOptions & { path?: string } = {},
) {
  return renderRoutes([{ path, element }], { url: options.url ?? path, ...options })
}
```

- [ ] **Step 2: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/app/guards.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import type { RouteObject } from 'react-router'
import { adminUser, pendingUser, renderRoutes, studentUser, teacherUser } from '@/test/render'
import { RedirectIfAuthed, RequireAuth } from './guards'

const pages: RouteObject[] = [
  { path: '/login', element: <p>login sahifa</p> },
  { path: '/pending', element: <p>pending sahifa</p> },
  { path: '/app', element: <p>talaba sahifa</p> },
  { path: '/teach', element: <p>teach sahifa</p> },
  { path: '/admin/users', element: <p>admin sahifa</p> },
]

const adminOnly: RouteObject[] = [
  ...pages,
  { element: <RequireAuth roles={['admin']} />, children: [{ path: '/secret', element: <p>maxfiy</p> }] },
]

test('mehmon /login ga yo\'naltiriladi va qaytish manzili saqlanadi', async () => {
  const { router } = renderRoutes(adminOnly, { url: '/secret', user: null })
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(router.state.location.state).toEqual({ from: '/secret' })
})

test('pending foydalanuvchi /pending ga yo\'naltiriladi', async () => {
  const { router } = renderRoutes(adminOnly, { url: '/secret', user: pendingUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/pending'))
})

test('roli mos kelmasa o\'z bosh sahifasiga yo\'naltiriladi', async () => {
  const { router } = renderRoutes(adminOnly, { url: '/secret', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})

test('ruxsat bor bo\'lsa sahifa ko\'rinadi', () => {
  renderRoutes(adminOnly, { url: '/secret', user: adminUser })
  expect(screen.getByText('maxfiy')).toBeInTheDocument()
})

const loginTree: RouteObject[] = [
  ...pages.filter((page) => page.path !== '/login'),
  { element: <RedirectIfAuthed />, children: [{ path: '/login', element: <p>login forma</p> }] },
  { path: '/teach/topics/5', element: <p>muharrir</p> },
]

test('kirgan foydalanuvchi /login dan o\'z bosh sahifasiga o\'tadi', async () => {
  const { router } = renderRoutes(loginTree, { url: '/login', user: teacherUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/teach'))
})

test('kirgan foydalanuvchi saqlangan qaytish manziliga o\'tadi', async () => {
  const { router } = renderRoutes(loginTree, {
    url: '/login',
    state: { from: '/teach/topics/5' },
    user: teacherUser,
  })
  await waitFor(() => expect(router.state.location.pathname).toBe('/teach/topics/5'))
})

test('mehmon login formasini ko\'radi', () => {
  renderRoutes(loginTree, { url: '/login', user: null })
  expect(screen.getByText('login forma')).toBeInTheDocument()
})
```

`frontend/src/app/SessionGate.test.tsx`:

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { sessionKey } from '@/api/auth'
import { getAccessToken } from '@/api/client'
import { createQueryClient } from '@/api/queryClient'
import { makeUser } from '@/test/render'
import { server } from '@/test/server'
import { SessionGate } from './SessionGate'

function renderGate() {
  const queryClient = createQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <SessionGate>
        <p>ilova</p>
      </SessionGate>
    </QueryClientProvider>,
  )
  return queryClient
}

test('refresh cookie bo\'lsa sessiya tiklanadi', async () => {
  const user = makeUser({ locale: 'ru' })
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ access_token: 'restored', token_type: 'bearer', user }),
    ),
  )
  const queryClient = renderGate()
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(await screen.findByText('ilova')).toBeInTheDocument()
  expect(queryClient.getQueryData(sessionKey)).toEqual(user)
  expect(getAccessToken()).toBe('restored')
})

test('refresh cookie bo\'lmasa mehmon sifatida davom etadi', async () => {
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ code: 'NO_REFRESH_TOKEN', message: 'x', details: {} }, { status: 401 }),
    ),
  )
  const queryClient = renderGate()
  expect(await screen.findByText('ilova')).toBeInTheDocument()
  expect(queryClient.getQueryData(sessionKey)).toBeNull()
})
```

- [ ] **Step 3: Testlar yiqilishini tekshirish**

Run: `npm test -- src/app`
Expected: FAIL — `./guards`, `./SessionGate`, `@/api/auth` topilmaydi.

- [ ] **Step 4: `frontend/src/api/auth.ts`**

```ts
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { pushToast } from '@/components/ui/toast-store'
import { i18n, setLanguage } from '@/i18n'
import { apiFetch, refreshSession, setAccessToken, setAuthHandlers } from './client'
import type { LoginIn, MeUpdateIn, PasswordChangeIn, RegisterIn, TokenOut, User } from './types'

export const sessionKey = ['session'] as const

/** Client refresh/sessiya yo'qolishi haqida xabar berganda keshni yangilaydi. */
export function installAuthHandlers(queryClient: QueryClient): void {
  setAuthHandlers({
    onRefreshed: (session) => queryClient.setQueryData(sessionKey, session.user),
    onLost: () => queryClient.setQueryData(sessionKey, null),
  })
}

async function restoreSession(): Promise<User | null> {
  try {
    const session = await refreshSession()
    if (session) setLanguage(session.user.locale)
    return session?.user ?? null
  } catch {
    // Backend'ga ulanib bo'lmadi — mehmon sifatida davom etamiz.
    return null
  }
}

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: restoreSession,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}

export function useCurrentUser(): User | null {
  return useSession().data ?? null
}

function startSession(queryClient: QueryClient, session: TokenOut): void {
  setAccessToken(session.access_token)
  queryClient.setQueryData(sessionKey, session.user)
  setLanguage(session.user.locale)
}

function endSession(queryClient: QueryClient): void {
  setAccessToken(null)
  queryClient.setQueryData(sessionKey, null)
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKey[0] })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginIn) =>
      apiFetch<TokenOut>('/api/auth/login', { method: 'POST', json: data, auth: false }),
    onSuccess: (session) => startSession(queryClient, session),
    meta: { silent: true },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterIn) =>
      apiFetch<User>('/api/auth/register', { method: 'POST', json: data, auth: false }),
    meta: { silent: true },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>('/api/auth/logout', { method: 'POST', auth: false }),
    onSettled: () => endSession(queryClient),
    meta: { silent: true },
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MeUpdateIn) => apiFetch<User>('/api/me', { method: 'PATCH', json: data }),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionKey, user)
      setLanguage(user.locale)
    },
  })
}

/**
 * Backend parol almashganda barcha sessiyalarni bekor qiladi, shuning uchun lokal sessiya ham yopiladi.
 * Toast shu yerda chiqariladi: sessiya yopilgach profil sahifasi unmount bo'ladi.
 */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PasswordChangeIn) =>
      apiFetch<void>('/api/me/password', { method: 'POST', json: data }),
    onSuccess: () => {
      endSession(queryClient)
      pushToast('success', i18n.t('profile.passwordChanged'))
    },
    meta: { silent: true },
  })
}
```

- [ ] **Step 5: `frontend/src/app/paths.ts`**

```ts
import type { Role, User } from '@/api/types'

export function homePathFor(user: User): string {
  if (user.status !== 'active') return '/pending'
  if (user.role === 'admin') return '/admin/users'
  if (user.role === 'teacher') return '/teach'
  return '/app'
}

export interface NavItem {
  to: string
  label: string
  end?: boolean
}

export function navLinksFor(role: Role): NavItem[] {
  const items: NavItem[] = [{ to: '/app', label: 'nav.subjects', end: true }]
  if (role === 'teacher' || role === 'admin') items.push({ to: '/teach', label: 'nav.teach' })
  if (role === 'admin') {
    items.push({ to: '/admin/users', label: 'nav.adminUsers' }, { to: '/admin/subjects', label: 'nav.adminSubjects' })
  }
  return items
}
```

- [ ] **Step 6: `frontend/src/app/guards.tsx`**

```tsx
import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import type { Role } from '@/api/types'
import { homePathFor } from './paths'

export function RequireAuth({ roles }: { roles?: Role[] }) {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.status !== 'active') return <Navigate to="/pending" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

/** Login/ro'yxatdan o'tish sahifalari: kirgan foydalanuvchini kerakli joyga yuboradi. */
export function RedirectIfAuthed() {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) return <Outlet />
  const from = (location.state as { from?: string } | null)?.from
  return <Navigate to={user.status === 'active' && from ? from : homePathFor(user)} replace />
}
```

- [ ] **Step 7: `frontend/src/app/SessionGate.tsx`**

```tsx
import type { ReactNode } from 'react'
import { useSession } from '@/api/auth'
import { Spinner } from '@/components/ui/Spinner'

export function SessionGate({ children }: { children: ReactNode }) {
  const session = useSession()
  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-500">
        <Spinner size="lg" />
      </div>
    )
  }
  return children
}
```

- [ ] **Step 8: Testlar o'tishini tekshirish**

Run: `npm test`
Expected: PASS.

Run: `npm run lint && npm run typecheck`
Expected: xatosiz.

- [ ] **Step 9: CHANGELOG va commit**

CHANGELOG qatori: `- Sessiya: refresh orqali tiklash, login/logout/profil hook'lari, rol bo'yicha route guard'lar.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): session restore, auth hooks and role-based route guards"
```

---

### Task 7: Router, layout'lar va sahifa "stub"lari

**Files:**
- Create: `frontend/src/app/router.tsx`, `frontend/src/app/layouts/PublicLayout.tsx`, `AppLayout.tsx`, `LanguageSwitch.tsx`
- Create (stub, keyingi tasklarda to'ldiriladi): `frontend/src/features/public/HomePage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `PendingPage.tsx`; `features/student/SubjectsPage.tsx`, `SubjectPage.tsx`, `PlayerPage.tsx`; `features/profile/ProfilePage.tsx`; `features/teach/TeachHomePage.tsx`, `TopicEditorPage.tsx`; `features/admin/AdminUsersPage.tsx`, `AdminSubjectsPage.tsx`
- Create: `frontend/src/features/public/NotFoundPage.tsx`
- Modify: `frontend/src/main.tsx`
- Delete: `frontend/src/App.tsx`, `frontend/src/App.test.tsx`
- Test: `frontend/src/app/layouts/AppLayout.test.tsx`, `frontend/src/app/layouts/PublicLayout.test.tsx`

**Route'lar xaritasi:**

| Manzil | Sahifa | Kim kiradi |
|---|---|---|
| `/` | HomePage | hamma |
| `/login`, `/register` | LoginPage, RegisterPage | faqat mehmon (`RedirectIfAuthed`) |
| `/pending` | PendingPage | hamma |
| `/app` | SubjectsPage | har qanday faol foydalanuvchi |
| `/app/subjects/:slug` | SubjectPage | faol |
| `/app/topics/:topicId/:kind?` | PlayerPage | faol |
| `/app/profile` | ProfilePage | faol |
| `/teach`, `/teach/topics/:topicId` | TeachHomePage, TopicEditorPage | teacher, admin |
| `/admin/users`, `/admin/subjects` | AdminUsersPage, AdminSubjectsPage | admin |

- [ ] **Step 1: Sahifa stub'larini yaratish**

Quyidagi 12 ta faylning har biri bitta funksiyadan iborat bo'ladi. Ular keyingi tasklarda to'liq almashtiriladi. Namuna (`frontend/src/features/student/SubjectsPage.tsx`):

```tsx
export function SubjectsPage() {
  return null
}
```

Xuddi shu ko'rinishda (faqat funksiya nomi farq qiladi) yaratiladi:
- `features/public/`: `HomePage`, `LoginPage`, `RegisterPage`, `PendingPage`;
- `features/student/`: `SubjectsPage`, `SubjectPage`, `PlayerPage`;
- `features/profile/`: `ProfilePage`;
- `features/teach/`: `TeachHomePage`, `TopicEditorPage`;
- `features/admin/`: `AdminUsersPage`, `AdminSubjectsPage`.

`frontend/src/features/public/NotFoundPage.tsx` (to'liq):

```tsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <EmptyState
        icon="🧭"
        title={t('notFound.title')}
        text={t('notFound.text')}
        action={
          <Link to="/" className={buttonClasses('primary')}>
            {t('notFound.home')}
          </Link>
        }
      />
    </main>
  )
}
```

- [ ] **Step 2: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/app/layouts/AppLayout.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import type { RouteObject } from 'react-router'
import { i18n } from '@/i18n'
import { adminUser, renderRoutes, studentUser, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { RequireAuth } from '../guards'
import { AppLayout } from './AppLayout'

const routes: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [{ element: <AppLayout />, children: [{ path: '/app', element: <p>sahifa</p> }] }],
  },
  { path: '/login', element: <p>login sahifa</p> },
]

test('o\'qituvchi muharrir havolasini ko\'radi, admin bo\'limlarini ko\'rmaydi', () => {
  renderRoutes(routes, { url: '/app', user: teacherUser })
  const nav = screen.getByRole('navigation')
  expect(within(nav).getByRole('link', { name: i18n.t('nav.teach') })).toBeInTheDocument()
  expect(within(nav).queryByRole('link', { name: i18n.t('nav.adminUsers') })).not.toBeInTheDocument()
})

test('admin barcha bo\'limlarni ko\'radi', () => {
  renderRoutes(routes, { url: '/app', user: adminUser })
  const nav = screen.getByRole('navigation')
  for (const key of ['nav.subjects', 'nav.teach', 'nav.adminUsers', 'nav.adminSubjects']) {
    expect(within(nav).getByRole('link', { name: i18n.t(key) })).toBeInTheDocument()
  }
})

test('chiqish tugmasi sessiyani yopadi va /login ga olib boradi', async () => {
  server.use(http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })))
  const { router } = renderRoutes(routes, { url: '/app', user: studentUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('nav.logout') }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(router.state.location.state).toBeNull()
})

test('til almashtirilganda PATCH /me yuboriladi', async () => {
  let body: unknown = null
  server.use(
    http.patch('/api/me', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...studentUser, locale: 'ru' })
    }),
  )
  renderRoutes(routes, { url: '/app', user: studentUser })
  await userEvent.click(screen.getByRole('button', { name: 'Русский' }))
  await waitFor(() => expect(body).toEqual({ locale: 'ru' }))
  expect(i18n.language).toBe('ru')
})
```

`frontend/src/app/layouts/PublicLayout.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { renderRoutes, teacherUser } from '@/test/render'
import { PublicLayout } from './PublicLayout'

const routes = [{ element: <PublicLayout />, children: [{ path: '/', element: <p>bosh</p> }] }]

test('mehmon kirish va ro\'yxatdan o\'tish havolalarini ko\'radi', () => {
  renderRoutes(routes, { url: '/' })
  expect(screen.getByRole('link', { name: i18n.t('nav.login') })).toHaveAttribute('href', '/login')
  expect(screen.getByRole('link', { name: i18n.t('nav.register') })).toHaveAttribute('href', '/register')
})

test('kirgan foydalanuvchi kabinetga havola ko\'radi', () => {
  renderRoutes(routes, { url: '/', user: teacherUser })
  expect(screen.getByRole('link', { name: i18n.t('nav.cabinet') })).toHaveAttribute('href', '/teach')
})
```

- [ ] **Step 3: Testlar yiqilishini tekshirish**

Run: `npm test -- src/app/layouts`
Expected: FAIL — layout modullari topilmaydi.

- [ ] **Step 4: `frontend/src/app/layouts/LanguageSwitch.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { useCurrentUser, useUpdateMe } from '@/api/auth'
import type { Locale } from '@/api/types'
import { setLanguage } from '@/i18n'
import { cx } from '@/lib/cx'

const LOCALES: Locale[] = ['uz', 'ru']

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const user = useCurrentUser()
  const updateMe = useUpdateMe()

  function choose(lang: Locale) {
    if (lang === i18n.language) return
    setLanguage(lang)
    if (user) updateMe.mutate({ locale: lang })
  }

  return (
    <div role="group" aria-label={t('nav.language')} className="inline-flex shrink-0 rounded-xl border-2 border-slate-200 p-0.5">
      {LOCALES.map((lang) => {
        const active = i18n.language === lang
        return (
          <button
            key={lang}
            type="button"
            aria-pressed={active}
            aria-label={t(`languages.${lang}`)}
            onClick={() => choose(lang)}
            className={cx(
              'rounded-lg px-2 py-1 text-xs font-bold uppercase',
              active ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {lang}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: `frontend/src/app/layouts/PublicLayout.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { buttonClasses } from '@/components/ui/button-classes'
import { homePathFor } from '../paths'
import { LanguageSwitch } from './LanguageSwitch'

export function PublicLayout() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="mr-auto text-lg font-extrabold text-brand-700">
            {t('app.name')}
          </Link>
          <LanguageSwitch />
          {user ? (
            <Link to={homePathFor(user)} className={buttonClasses('primary', 'sm')}>
              {t('nav.cabinet')}
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonClasses('ghost', 'sm')}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className={buttonClasses('primary', 'sm')}>
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t-2 border-slate-100 py-6 text-center text-sm text-slate-500">
        {t('footer.text', { year: new Date().getFullYear() })}
      </footer>
    </div>
  )
}
```

- [ ] **Step 6: `frontend/src/app/layouts/AppLayout.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { cx } from '@/lib/cx'
import { homePathFor, navLinksFor } from '../paths'
import { LanguageSwitch } from './LanguageSwitch'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap',
    isActive ? 'bg-brand-100 text-brand-900' : 'text-slate-600 hover:bg-slate-100',
  )

export function AppLayout() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b-2 border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to={homePathFor(user)} className="text-lg font-extrabold text-brand-700">
            {t('app.name')}
          </Link>
          <nav
            aria-label={t('nav.main')}
            className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1"
          >
            {navLinksFor(user.role).map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch />
            <NavLink to="/app/profile" className={navClass} title={t('nav.profile')}>
              <span aria-hidden="true">👤 </span>
              <span className="hidden md:inline">{user.full_name}</span>
              <span className="sr-only md:hidden">{t('nav.profile')}</span>
            </NavLink>
            <Button
              variant="ghost"
              size="sm"
              loading={logout.isPending}
              // Qaytish manzilisiz: keyingi kirgan foydalanuvchi oldingisining sahifasiga tushmasin.
              onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate('/login', { replace: true }) })}
            >
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 7: `frontend/src/app/router.tsx`**

```tsx
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AdminSubjectsPage } from '@/features/admin/AdminSubjectsPage'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { HomePage } from '@/features/public/HomePage'
import { LoginPage } from '@/features/public/LoginPage'
import { NotFoundPage } from '@/features/public/NotFoundPage'
import { PendingPage } from '@/features/public/PendingPage'
import { RegisterPage } from '@/features/public/RegisterPage'
import { PlayerPage } from '@/features/student/PlayerPage'
import { SubjectPage } from '@/features/student/SubjectPage'
import { SubjectsPage } from '@/features/student/SubjectsPage'
import { TeachHomePage } from '@/features/teach/TeachHomePage'
import { TopicEditorPage } from '@/features/teach/TopicEditorPage'
import { RedirectIfAuthed, RequireAuth } from './guards'
import { AppLayout } from './layouts/AppLayout'
import { PublicLayout } from './layouts/PublicLayout'

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'pending', element: <PendingPage /> },
      {
        element: <RedirectIfAuthed />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'app', element: <SubjectsPage /> },
          { path: 'app/subjects/:slug', element: <SubjectPage /> },
          { path: 'app/topics/:topicId/:kind?', element: <PlayerPage /> },
          { path: 'app/profile', element: <ProfilePage /> },
          {
            element: <RequireAuth roles={['teacher', 'admin']} />,
            children: [
              { path: 'teach', element: <TeachHomePage /> },
              { path: 'teach/topics/:topicId', element: <TopicEditorPage /> },
            ],
          },
          {
            element: <RequireAuth roles={['admin']} />,
            children: [
              { path: 'admin', element: <Navigate to="/admin/users" replace /> },
              { path: 'admin/users', element: <AdminUsersPage /> },
              { path: 'admin/subjects', element: <AdminSubjectsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
```

- [ ] **Step 8: `frontend/src/main.tsx` (to'liq yangi ko'rinishi) va `App.tsx`ni o'chirish**

```tsx
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { installAuthHandlers } from '@/api/auth'
import { createQueryClient } from '@/api/queryClient'
import { createAppRouter } from '@/app/router'
import { SessionGate } from '@/app/SessionGate'
import { Toaster } from '@/components/ui/Toast'
import '@/i18n'
import './index.css'

const queryClient = createQueryClient()
installAuthHandlers(queryClient)
const router = createAppRouter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionGate>
        <RouterProvider router={router} />
      </SessionGate>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
```

Run: `git rm frontend/src/App.tsx frontend/src/App.test.tsx` (repo ildizidan).

- [ ] **Step 9: Testlar, lint, build**

Run: `npm test && npm run lint && npm run build`
Expected: barcha testlar PASS, lint xatosiz, build muvaffaqiyatli.

Qo'lda tekshiruv: backend (`cd ../backend && uv run uvicorn app.main:create_app --factory --reload`) va `npm run dev` ishga tushiriladi.
- `http://localhost:5173/` — header'da logo, til tugmalari, "Kirish" va "Ro'yxatdan o'tish" havolalari ko'rinadi.
- `/app` mehmonni `/login`ga yo'naltiradi.
- `/nimadir` sahifasida 404 ko'rinadi.

- [ ] **Step 10: CHANGELOG va commit**

CHANGELOG qatori: `- Router, ochiq va ichki layout'lar (rol bo'yicha menyu, til almashtirish, chiqish), 404 sahifa.`

```bash
cd .. && git add -A frontend CHANGELOG.md
git commit -m "feat(frontend): router, public/app layouts, language switch and page stubs"
```

---

### Task 8: Ochiq sahifalar — bosh sahifa, kirish, ro'yxatdan o'tish, tasdiq kutish

**Files:**
- Create: `frontend/src/features/public/schemas.ts`, `frontend/src/features/public/AuthCard.tsx`
- Modify (stub → to'liq): `frontend/src/features/public/HomePage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `PendingPage.tsx`
- Modify: `frontend/src/i18n/uz.json` va `ru.json` — `pending` bo'limiga `"check"` kaliti qo'shiladi (uz: `"Holatni tekshirish"`, ru: `"Проверить статус"`)
- Test: `frontend/src/features/public/LoginPage.test.tsx`, `RegisterPage.test.tsx`, `PendingPage.test.tsx`

**Oqim:**
1. Ro'yxatdan o'tgan foydalanuvchi `pending` holatida bo'ladi va avtomatik kirmaydi. U `/pending` sahifasiga o'tadi, u yerda "admin tasdiqlashini kuting" deyiladi.
2. `pending` foydalanuvchi login qila oladi (backend ruxsat beradi), lekin `homePathFor` uni `/pending`ga yuboradi.
3. Login muvaffaqiyatli bo'lgach, yo'naltirishni `RedirectIfAuthed` bajaradi (Task 6). `LoginPage`ning o'zi navigatsiya qilmaydi.

Formalarda `noValidate` ishlatiladi: brauzerning o'z tekshiruvi o'rniga zod xabarlari (i18n kalitlari) ko'rsatiladi.

- [ ] **Step 1: `frontend/src/features/public/schemas.ts`**

```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email({ error: 'validation.email' }),
  password: z.string().min(1, { error: 'validation.required' }),
})

export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, { error: 'validation.nameMin' })
      .max(150, { error: 'validation.tooLong' }),
    email: z.email({ error: 'validation.email' }),
    phone: z.string().trim().max(32, { error: 'validation.tooLong' }),
    password: z.string().min(8, { error: 'validation.passwordMin' }).max(128, { error: 'validation.tooLong' }),
    password_confirm: z.string(),
  })
  .refine((values) => values.password === values.password_confirm, {
    error: 'validation.passwordMismatch',
    path: ['password_confirm'],
  })

export type RegisterValues = z.infer<typeof registerSchema>
```

- [ ] **Step 2: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/features/public/LoginPage.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import type { RouteObject } from 'react-router'
import { RedirectIfAuthed } from '@/app/guards'
import { i18n } from '@/i18n'
import { pendingUser, renderRoutes, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { LoginPage } from './LoginPage'

const routes: RouteObject[] = [
  { element: <RedirectIfAuthed />, children: [{ path: '/login', element: <LoginPage /> }] },
  { path: '/app', element: <p>talaba bosh sahifasi</p> },
  { path: '/pending', element: <p>pending sahifa</p> },
]

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(i18n.t('auth.email')), email)
  await userEvent.type(screen.getByLabelText(i18n.t('auth.password')), password)
  await userEvent.click(screen.getByRole('button', { name: i18n.t('auth.login.submit') }))
}

test('noto\'g\'ri email validatsiya xatosini ko\'rsatadi va so\'rov yubormaydi', async () => {
  renderRoutes(routes, { url: '/login' })
  await fillAndSubmit('emas-email', 'parol12345')
  expect(await screen.findByText(i18n.t('validation.email'))).toBeInTheDocument()
})

test('noto\'g\'ri parol tarjima qilingan xatoni ko\'rsatadi', async () => {
  server.use(
    http.post('/api/auth/login', () =>
      HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: 'x', details: {} }, { status: 401 }),
    ),
  )
  renderRoutes(routes, { url: '/login' })
  await fillAndSubmit('talaba@example.uz', 'notogri123')
  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('errors.INVALID_CREDENTIALS'))
})

test('muvaffaqiyatli kirishdan so\'ng talaba /app ga o\'tadi', async () => {
  server.use(
    http.post('/api/auth/login', () =>
      HttpResponse.json({ access_token: 'tok', token_type: 'bearer', user: studentUser }),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/login' })
  await fillAndSubmit('talaba@example.uz', 'parol12345')
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})

test('pending foydalanuvchi kirgach /pending ga o\'tadi', async () => {
  server.use(
    http.post('/api/auth/login', () =>
      HttpResponse.json({ access_token: 'tok', token_type: 'bearer', user: pendingUser }),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/login' })
  await fillAndSubmit('yangi@example.uz', 'parol12345')
  await waitFor(() => expect(router.state.location.pathname).toBe('/pending'))
})
```

`frontend/src/features/public/RegisterPage.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { pendingUser, renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import { RegisterPage } from './RegisterPage'

const routes = [
  { path: '/register', element: <RegisterPage /> },
  { path: '/pending', element: <p>pending sahifa</p> },
]

async function fill(password: string, confirm: string) {
  await userEvent.type(screen.getByLabelText(i18n.t('auth.fullName')), 'Yangi Talaba')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.email')), 'yangi@example.uz')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.password')), password)
  await userEvent.type(screen.getByLabelText(i18n.t('auth.passwordConfirm')), confirm)
  await userEvent.click(screen.getByRole('button', { name: i18n.t('auth.register.submit') }))
}

test('parollar mos kelmasa xato ko\'rsatiladi', async () => {
  renderRoutes(routes, { url: '/register' })
  await fill('parol12345', 'boshqa12345')
  expect(await screen.findByText(i18n.t('validation.passwordMismatch'))).toBeInTheDocument()
})

test('muvaffaqiyatli ro\'yxatdan o\'tish joriy til bilan yuboriladi va /pending ga olib boradi', async () => {
  let body: unknown = null
  server.use(
    http.post('/api/auth/register', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(pendingUser, { status: 201 })
    }),
  )
  const { router } = renderRoutes(routes, { url: '/register' })
  await fill('parol12345', 'parol12345')
  await waitFor(() => expect(router.state.location.pathname).toBe('/pending'))
  expect(body).toEqual({
    full_name: 'Yangi Talaba',
    email: 'yangi@example.uz',
    phone: null,
    password: 'parol12345',
    locale: 'uz',
  })
})

test('band email xatosi ko\'rsatiladi', async () => {
  server.use(
    http.post('/api/auth/register', () =>
      HttpResponse.json({ code: 'EMAIL_TAKEN', message: 'x', details: {} }, { status: 409 }),
    ),
  )
  renderRoutes(routes, { url: '/register' })
  await fill('parol12345', 'parol12345')
  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('errors.EMAIL_TAKEN'))
})
```

`frontend/src/features/public/PendingPage.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { pendingUser, renderRoutes, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { PendingPage } from './PendingPage'

const routes = [
  { path: '/pending', element: <PendingPage /> },
  { path: '/app', element: <p>talaba sahifa</p> },
]

test('pending foydalanuvchi ismi bilan kutish xabarini ko\'radi', () => {
  renderRoutes(routes, { url: '/pending', user: pendingUser })
  expect(screen.getByText(i18n.t('pending.textUser', { name: pendingUser.full_name }))).toBeInTheDocument()
  expect(screen.getByRole('button', { name: i18n.t('nav.logout') })).toBeInTheDocument()
})

test('"Holatni tekshirish" sessiyani qayta so\'raydi; tasdiqlangan bo\'lsa bosh sahifaga o\'tadi', async () => {
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ access_token: 'tok', token_type: 'bearer', user: { ...pendingUser, status: 'active' } }),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/pending', user: pendingUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('pending.check') }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})

test('mehmon kirish havolasini ko\'radi', () => {
  renderRoutes(routes, { url: '/pending' })
  expect(screen.getByRole('link', { name: i18n.t('nav.login') })).toHaveAttribute('href', '/login')
})

test('faol foydalanuvchi bosh sahifasiga yo\'naltiriladi', async () => {
  const { router } = renderRoutes(routes, { url: '/pending', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})
```

- [ ] **Step 3: Testlar yiqilishini tekshirish**

Run: `npm test -- src/features/public`
Expected: FAIL — stub sahifalar forma va matnlarni chizmaydi.

- [ ] **Step 4: `frontend/src/features/public/AuthCard.tsx`**

```tsx
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="p-6 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </Card>
      {footer && <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>}
    </div>
  )
}
```

- [ ] **Step 5: `frontend/src/features/public/LoginPage.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLogin } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { AuthCard } from './AuthCard'
import { loginSchema, type LoginValues } from './schemas'

export function LoginPage() {
  const { t } = useTranslation()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  return (
    <AuthCard
      title={t('auth.login.title')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            {t('nav.register')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit((values) => login.mutate(values))} className="flex flex-col gap-4">
        {login.error && <FormError error={login.error} />}
        <Field id="email" label={t('auth.email')} error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
        <Field id="password" label={t('auth.password')} error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <Button type="submit" loading={login.isPending}>
          {t('auth.login.submit')}
        </Button>
      </form>
    </AuthCard>
  )
}
```

- [ ] **Step 6: `frontend/src/features/public/RegisterPage.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useRegister } from '@/api/auth'
import type { Locale } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { AuthCard } from './AuthCard'
import { registerSchema, type RegisterValues } from './schemas'

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const registerUser = useRegister()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', phone: '', password: '', password_confirm: '' },
  })

  function onSubmit(values: RegisterValues) {
    registerUser.mutate(
      {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        password: values.password,
        locale: i18n.language as Locale,
      },
      { onSuccess: () => void navigate('/pending', { replace: true }) },
    )
  }

  return (
    <AuthCard
      title={t('auth.register.title')}
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            {t('nav.login')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {registerUser.error && <FormError error={registerUser.error} />}
        <Field id="full_name" label={t('auth.fullName')} error={errors.full_name?.message}>
          <Input id="full_name" autoComplete="name" aria-invalid={Boolean(errors.full_name)} {...register('full_name')} />
        </Field>
        <Field id="email" label={t('auth.email')} error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
        <Field id="phone" label={t('auth.phone')} hint={t('auth.phoneHint')} error={errors.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
        </Field>
        <Field id="password" label={t('auth.password')} hint={t('auth.passwordHint')} error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <Field id="password_confirm" label={t('auth.passwordConfirm')} error={errors.password_confirm?.message}>
          <Input
            id="password_confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password_confirm)}
            {...register('password_confirm')}
          />
        </Field>
        <Button type="submit" loading={registerUser.isPending}>
          {t('auth.register.submit')}
        </Button>
      </form>
    </AuthCard>
  )
}
```

- [ ] **Step 7: `frontend/src/features/public/PendingPage.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router'
import { sessionKey, useCurrentUser, useLogout, useSession } from '@/api/auth'
import { homePathFor } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-classes'
import { Card } from '@/components/ui/Card'

export function PendingPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogout()
  const session = useSession()
  const queryClient = useQueryClient()

  if (user && user.status === 'active') return <Navigate to={homePathFor(user)} replace />

  return (
    <Card className="mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <span className="text-5xl" aria-hidden="true">
        ⏳
      </span>
      <h1 className="text-2xl font-bold">{t('pending.title')}</h1>
      <p className="text-slate-600">
        {user ? t('pending.textUser', { name: user.full_name }) : t('pending.textGuest')}
      </p>
      {user ? (
        <div className="flex flex-wrap justify-center gap-2">
          {/* Sessiya keshda abadiy saqlanadi — admin tasdiqlaganini bilish uchun refresh orqali qayta so'raladi. */}
          <Button
            loading={session.isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: sessionKey })}
          >
            {t('pending.check')}
          </Button>
          <Button variant="secondary" loading={logout.isPending} onClick={() => logout.mutate()}>
            {t('nav.logout')}
          </Button>
        </div>
      ) : (
        <Link to="/login" className={buttonClasses('primary')}>
          {t('nav.login')}
        </Link>
      )}
    </Card>
  )
}
```

- [ ] **Step 8: `frontend/src/features/public/HomePage.tsx`** (skelet; yakuniy dizayni 4-bosqichda)

```tsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { homePathFor } from '@/app/paths'
import { buttonClasses } from '@/components/ui/button-classes'
import { Card } from '@/components/ui/Card'

const FEATURES = [
  { key: 'steps', icon: '🪜' },
  { key: 'player', icon: '📖' },
  { key: 'language', icon: '🌐' },
] as const

export function HomePage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-5 rounded-3xl bg-brand-50 px-6 py-12 sm:px-12">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-900">
          {t('home.badge')}
        </span>
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">{t('home.title')}</h1>
        <p className="max-w-xl text-lg text-slate-700">{t('home.subtitle')}</p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link to={homePathFor(user)} className={buttonClasses('primary')}>
              {t('home.continue')}
            </Link>
          ) : (
            <>
              <Link to="/register" className={buttonClasses('primary')}>
                {t('home.start')}
              </Link>
              <Link to="/login" className={buttonClasses('secondary')}>
                {t('nav.login')}
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.key} className="flex flex-col gap-2">
            <span className="text-3xl" aria-hidden="true">
              {feature.icon}
            </span>
            <h2 className="text-lg font-bold">{t(`home.features.${feature.key}.title`)}</h2>
            <p className="text-slate-600">{t(`home.features.${feature.key}.text`)}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
```

- [ ] **Step 9: Testlar o'tishini tekshirish**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS, xatosiz.

Qo'lda tekshiruv: backend va `npm run dev` ishga tushiriladi. Yangi foydalanuvchi ro'yxatdan o'tadi → `/pending` sahifasi ochiladi → u bilan login qilinadi → yana `/pending`. Til tugmasi `RU`ga o'tkazilganda matnlar ruschaga almashadi.

- [ ] **Step 10: CHANGELOG va commit**

CHANGELOG qatori: `- Ochiq sahifalar: bosh sahifa skeleti, kirish, ro'yxatdan o'tish, tasdiq kutish.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): home, login, register and pending pages"
```

---

### Task 9: Talaba — API hook'lari, fanlar ro'yxati va mavzu yo'li

**Files:**
- Create: `frontend/src/api/student.ts`, `frontend/src/lib/steps.ts`, `frontend/src/test/fixtures.ts`
- Modify (stub → to'liq): `frontend/src/features/student/SubjectsPage.tsx`, `SubjectPage.tsx`
- Test: `frontend/src/features/student/SubjectsPage.test.tsx`, `SubjectPage.test.tsx`, `frontend/src/lib/steps.test.ts`

- [ ] **Step 1: `frontend/src/lib/steps.ts`** (backend `learning/models.py` bilan mos)

```ts
import type { StepKind } from '@/api/types'

export const STEP_KINDS: readonly StepKind[] = [
  'review',
  'lecture',
  'presentation',
  'practice',
  'task',
  'glossary',
  'literature',
]

/** "Tugatdim" tugmasi bilan yakunlanadigan bosqichlar (qolganlari 2-bosqichda faoliyat orqali). */
export const SELF_COMPLETE_KINDS: ReadonlySet<StepKind> = new Set(['lecture', 'presentation', 'glossary', 'literature'])

/** Fayl (PDF/PPT/DOC) yuklanadigan bosqichlar. */
export const FILE_KINDS: ReadonlySet<StepKind> = new Set(['lecture', 'presentation'])

export const STEP_ICONS: Record<StepKind, string> = {
  review: '🔁',
  lecture: '📖',
  presentation: '🖥️',
  practice: '✍️',
  task: '📝',
  glossary: '🔤',
  literature: '📚',
}

export function isStepKind(value: string | null | undefined): value is StepKind {
  return value != null && (STEP_KINDS as readonly string[]).includes(value)
}
```

`frontend/src/lib/steps.test.ts`:

```ts
import { isStepKind, SELF_COMPLETE_KINDS, STEP_KINDS } from './steps'

test('7 ta bosqich backend tartibida', () => {
  expect(STEP_KINDS).toEqual(['review', 'lecture', 'presentation', 'practice', 'task', 'glossary', 'literature'])
})

test('isStepKind faqat ma\'lum turlarni qabul qiladi', () => {
  expect(isStepKind('lecture')).toBe(true)
  expect(isStepKind('exam')).toBe(false)
  expect(isStepKind(undefined)).toBe(false)
})

test('review/practice/task "Tugatdim" bilan yakunlanmaydi', () => {
  expect(SELF_COMPLETE_KINDS.has('review')).toBe(false)
  expect(SELF_COMPLETE_KINDS.has('glossary')).toBe(true)
})
```

- [ ] **Step 2: `frontend/src/api/student.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiBuffer, apiFetch } from './client'
import type { ContinueTarget, StepBrief, StepContent, SubjectCard, SubjectDetail, TopicDetail } from './types'

export const studentKeys = {
  subjects: ['subjects'] as const,
  subject: (slug: string) => ['subjects', slug] as const,
  topic: (id: number) => ['topics', id] as const,
  step: (id: number) => ['steps', id] as const,
  continue: ['me', 'continue'] as const,
}

export function useSubjects() {
  return useQuery({
    queryKey: studentKeys.subjects,
    queryFn: ({ signal }) => apiFetch<SubjectCard[]>('/api/subjects', { signal }),
  })
}

export function useSubject(slug: string) {
  return useQuery({
    queryKey: studentKeys.subject(slug),
    queryFn: ({ signal }) => apiFetch<SubjectDetail>(`/api/subjects/${encodeURIComponent(slug)}`, { signal }),
    enabled: slug !== '',
  })
}

export function useTopic(topicId: number) {
  return useQuery({
    queryKey: studentKeys.topic(topicId),
    queryFn: ({ signal }) => apiFetch<TopicDetail>(`/api/topics/${topicId}`, { signal }),
    enabled: Number.isInteger(topicId) && topicId > 0,
  })
}

/** `stepId` undefined bo'lsa so'rov yuborilmaydi (kontenti yo'q bosqich). */
export function useStep(stepId: number | undefined) {
  return useQuery({
    queryKey: studentKeys.step(stepId ?? 0),
    queryFn: ({ signal }) => apiFetch<StepContent>(`/api/steps/${stepId}`, { signal }),
    enabled: stepId !== undefined,
  })
}

export function useContinue() {
  return useQuery({
    queryKey: studentKeys.continue,
    queryFn: ({ signal }) => apiFetch<ContinueTarget | null>('/api/me/continue', { signal }),
  })
}

export function useCompleteStep(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stepId: number) => apiFetch<StepBrief>(`/api/steps/${stepId}/complete`, { method: 'POST' }),
    onSuccess: (step) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: studentKeys.topic(topicId) }),
        queryClient.invalidateQueries({ queryKey: studentKeys.step(step.id) }),
        queryClient.invalidateQueries({ queryKey: studentKeys.subjects }),
        queryClient.invalidateQueries({ queryKey: studentKeys.continue }),
      ]),
  })
}

/** Himoyalangan PDF Bearer token bilan yuklanadi (refresh mantiqi ham shu yerda ishlaydi). */
export function useMaterialPdf(fileUrl: string) {
  return useQuery({
    queryKey: ['pdf', fileUrl],
    queryFn: ({ signal }) => apiBuffer(fileUrl, signal),
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  })
}
```

- [ ] **Step 3: Test ma'lumotlari `frontend/src/test/fixtures.ts`**

```ts
import type { StepContent, SubjectCard, SubjectDetail, TopicDetail } from '@/api/types'

export const subjectCards: SubjectCard[] = [
  {
    id: 1,
    title: "Kasb ta'limi metodikasi",
    slug: 'kasb-talimi-metodikasi',
    description: 'Metodika asoslari',
    cover: null,
    topic_count: 2,
    progress: { completed: 1, total: 3 },
  },
]

export const subjectDetail: SubjectDetail = {
  id: 1,
  title: "Kasb ta'limi metodikasi",
  slug: 'kasb-talimi-metodikasi',
  description: 'Metodika asoslari',
  cover: null,
  topics: [
    { id: 10, title: 'Kasb tanlash asoslari', summary: '', order: 1, progress: { completed: 1, total: 2 } },
    { id: 11, title: 'Mehnat xavfsizligi', summary: '', order: 2, progress: { completed: 0, total: 0 } },
  ],
}

export function topicDetail(overrides: Partial<TopicDetail> = {}): TopicDetail {
  return {
    id: 10,
    title: 'Kasb tanlash asoslari',
    summary: '',
    subject: { id: 1, title: "Kasb ta'limi metodikasi", slug: 'kasb-talimi-metodikasi' },
    progress: { completed: 1, total: 2 },
    steps: [
      { id: 100, kind: 'review', order: 1, has_content: false, status: null },
      { id: 101, kind: 'lecture', order: 2, has_content: true, status: 'completed' },
      { id: 102, kind: 'presentation', order: 3, has_content: false, status: null },
      { id: 103, kind: 'practice', order: 4, has_content: false, status: null },
      { id: 104, kind: 'task', order: 5, has_content: false, status: null },
      { id: 105, kind: 'glossary', order: 6, has_content: true, status: null },
      { id: 106, kind: 'literature', order: 7, has_content: false, status: null },
    ],
    ...overrides,
  }
}

export function stepContent(overrides: Partial<StepContent> = {}): StepContent {
  return {
    id: 101,
    topic_id: 10,
    kind: 'lecture',
    order: 2,
    has_content: true,
    status: 'completed',
    materials: [{ id: 500, title: "Kirish ma'ruzasi", page_count: 3, file_url: '/api/materials/500/file' }],
    glossary: [],
    literature: [],
    ...overrides,
  }
}
```

- [ ] **Step 4: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/features/student/SubjectsPage.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { subjectCards } from '@/test/fixtures'
import { renderRoute, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { SubjectsPage } from './SubjectsPage'

test('salomlashuv, davom ettirish kartasi va fanlar ko\'rsatiladi', async () => {
  server.use(
    http.get('/api/subjects', () => HttpResponse.json(subjectCards)),
    http.get('/api/me/continue', () =>
      HttpResponse.json({
        subject_id: 1,
        subject_slug: 'kasb-talimi-metodikasi',
        subject_title: "Kasb ta'limi metodikasi",
        topic_id: 10,
        topic_title: 'Kasb tanlash asoslari',
        step_id: 105,
        step_kind: 'glossary',
      }),
    ),
  )
  renderRoute(<SubjectsPage />, { path: '/app', user: studentUser })
  expect(screen.getByRole('heading', { name: i18n.t('student.hello', { name: studentUser.full_name }) })).toBeInTheDocument()
  const resume = await screen.findByRole('link', { name: /Kasb tanlash asoslari/ })
  expect(resume).toHaveAttribute('href', '/app/topics/10/glossary')
  // Fan nomi davom ettirish kartasida ham bor, shuning uchun plitka tavsif matni bo'yicha topiladi.
  const subject = await screen.findByRole('link', { name: /Metodika asoslari/ })
  expect(subject).toHaveAttribute('href', '/app/subjects/kasb-talimi-metodikasi')
  expect(screen.getByRole('img', { name: i18n.t('common.progress', { completed: 1, total: 3 }) })).toBeInTheDocument()
})

test('fanlar bo\'lmasa bo\'sh holat ko\'rsatiladi', async () => {
  server.use(
    http.get('/api/subjects', () => HttpResponse.json([])),
    http.get('/api/me/continue', () => HttpResponse.json(null)),
  )
  renderRoute(<SubjectsPage />, { path: '/app', user: studentUser })
  expect(await screen.findByText(i18n.t('student.noSubjects'))).toBeInTheDocument()
})
```

`frontend/src/features/student/SubjectPage.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { subjectDetail } from '@/test/fixtures'
import { renderRoute, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { SubjectPage } from './SubjectPage'

test('mavzular tartib bilan, pleyerga havolalar bilan ko\'rsatiladi', async () => {
  server.use(http.get('/api/subjects/:slug', () => HttpResponse.json(subjectDetail)))
  renderRoute(<SubjectPage />, { path: '/app/subjects/:slug', url: '/app/subjects/kasb-talimi-metodikasi', user: studentUser })
  expect(await screen.findByRole('heading', { name: "Kasb ta'limi metodikasi" })).toBeInTheDocument()
  const links = screen.getAllByRole('link', { name: /Kasb tanlash asoslari|Mehnat xavfsizligi/ })
  expect(links.map((link) => link.getAttribute('href'))).toEqual(['/app/topics/10', '/app/topics/11'])
})

test('topilmagan fan xato holatini ko\'rsatadi', async () => {
  server.use(
    http.get('/api/subjects/:slug', () =>
      HttpResponse.json({ code: 'SUBJECT_NOT_FOUND', message: 'x', details: {} }, { status: 404 }),
    ),
  )
  renderRoute(<SubjectPage />, { path: '/app/subjects/:slug', url: '/app/subjects/yoq', user: studentUser })
  expect(await screen.findByText(i18n.t('errors.SUBJECT_NOT_FOUND'))).toBeInTheDocument()
})
```

- [ ] **Step 5: Testlar yiqilishini tekshirish**

Run: `npm test -- src/features/student src/lib`
Expected: FAIL — `steps.test.ts` `./steps`ni topmaydi, sahifa testlari stub tufayli yiqiladi.

- [ ] **Step 6: `frontend/src/features/student/SubjectsPage.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useContinue, useSubjects } from '@/api/student'
import type { ContinueTarget, SubjectCard } from '@/api/types'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { PageSpinner } from '@/components/ui/Spinner'
import { STEP_ICONS } from '@/lib/steps'

export function SubjectsPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const next = useContinue()
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t('student.hello', { name: user?.full_name ?? '' })}</h1>
      {next.data && <ContinueCard target={next.data} />}
      <section aria-labelledby="subjects-heading" className="flex flex-col gap-4">
        <h2 id="subjects-heading" className="text-lg font-bold">
          {t('student.subjects')}
        </h2>
        <SubjectList />
      </section>
    </div>
  )
}

function ContinueCard({ target }: { target: ContinueTarget }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/app/topics/${target.topic_id}/${target.step_kind}`}
      className="group flex items-center gap-4 rounded-2xl bg-brand-500 p-5 text-white shadow-press transition hover:bg-brand-600"
    >
      <span className="text-4xl" aria-hidden="true">
        {STEP_ICONS[target.step_kind]}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-semibold uppercase tracking-wide text-brand-100">{t('student.continue')}</span>
        <span className="text-lg font-bold">{target.topic_title}</span>
        <span className="text-sm text-brand-100">
          {target.subject_title} · {t(`steps.${target.step_kind}`)}
        </span>
      </span>
      <span aria-hidden="true" className="text-2xl transition group-hover:translate-x-1 motion-reduce:transition-none">
        →
      </span>
    </Link>
  )
}

function SubjectList() {
  const { t } = useTranslation()
  const subjects = useSubjects()
  if (subjects.isPending) return <PageSpinner />
  if (subjects.isError) return <ErrorState error={subjects.error} onRetry={() => void subjects.refetch()} />
  if (subjects.data.length === 0) {
    return <EmptyState icon="📚" title={t('student.noSubjects')} text={t('student.noSubjectsText')} />
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.data.map((subject) => (
        <li key={subject.id}>
          <SubjectTile subject={subject} />
        </li>
      ))}
    </ul>
  )
}

function SubjectTile({ subject }: { subject: SubjectCard }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/app/subjects/${subject.slug}`}
      className="flex h-full items-start gap-4 rounded-2xl border-2 border-slate-100 bg-white p-5 transition hover:border-brand-200 hover:shadow-md"
    >
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-lg font-bold">{subject.title}</span>
        {subject.description && <span className="line-clamp-2 text-sm text-slate-600">{subject.description}</span>}
        <span className="text-sm font-semibold text-slate-500">
          {t('student.topicCount', { count: subject.topic_count })}
        </span>
      </span>
      <ProgressRing completed={subject.progress.completed} total={subject.progress.total} />
    </Link>
  )
}
```

- [ ] **Step 7: `frontend/src/features/student/SubjectPage.tsx`** (Duolingo uslubidagi "zigzag" mavzu yo'li)

```tsx
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useSubject } from '@/api/student'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { PageSpinner } from '@/components/ui/Spinner'
import { cx } from '@/lib/cx'

// Katta ekranda mavzular chap-o'ng siljib, yo'l (path) shaklini hosil qiladi.
const OFFSETS = ['sm:ml-0', 'sm:ml-24', 'sm:ml-48', 'sm:ml-24']

export function SubjectPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const subject = useSubject(slug)

  if (subject.isPending) return <PageSpinner />
  if (subject.isError) return <ErrorState error={subject.error} onRetry={() => void subject.refetch()} />

  const { title, description, topics } = subject.data
  return (
    <div className="flex flex-col gap-6">
      <Link to="/app" className="text-sm font-semibold text-brand-700 hover:underline">
        ← {t('student.allSubjects')}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-slate-600">{description}</p>}
      </header>
      {topics.length === 0 ? (
        <EmptyState icon="🧩" title={t('student.noTopics')} />
      ) : (
        <ol className="flex flex-col gap-4">
          {topics.map((topic, index) => {
            const done = topic.progress.total > 0 && topic.progress.completed >= topic.progress.total
            return (
              <li key={topic.id} className={cx('w-full sm:max-w-md', OFFSETS[index % OFFSETS.length])}>
                <Link
                  to={`/app/topics/${topic.id}`}
                  className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-white p-4 transition hover:border-brand-200 hover:shadow-md"
                >
                  <ProgressRing completed={topic.progress.completed} total={topic.progress.total} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('student.topicNumber', { number: index + 1 })}
                    </span>
                    <span className="font-bold">{topic.title}</span>
                  </span>
                  {done && <Badge tone="green">✓ {t('student.topicDone')}</Badge>}
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Testlar o'tishini tekshirish**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS, xatosiz.

- [ ] **Step 9: CHANGELOG va commit**

CHANGELOG qatori: `- Talaba: fanlar ro'yxati (davom ettirish kartasi, progress halqalari) va mavzu yo'li.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): student subjects list and topic path"
```

---

### Task 10: Dars pleyeri — bosqichlar, PDF ko'ruvchi, glossariy, adabiyotlar, "Tugatdim"

**Files:**
- Create: `frontend/src/features/student/PdfViewer.tsx`, `frontend/src/features/student/StepContent.tsx`
- Modify (stub → to'liq): `frontend/src/features/student/PlayerPage.tsx`
- Test: `frontend/src/features/student/PlayerPage.test.tsx`

**Qoidalar (spec, "Bosqichni tugatish qoidalari"):**
- Bosqichlar qulflanmaydi: talaba istalgan bosqichni ochishi mumkin.
- Kontenti yo'q bosqichda "Hozircha material yo'q" ko'rsatiladi, "Tugatdim" tugmasi bo'lmaydi.
- `review`, `practice` va `task` bosqichlari 1B'da doim kontentsiz (ular 2-bosqichda qo'shiladi).
- Manzilda `kind` bo'lmasa (`/app/topics/10`), birinchi kontentli bosqichga yo'naltiriladi.

PDF faylni olish uchun Bearer token kerak, shuning uchun `PdfViewer` faylni `apiBuffer` orqali `ArrayBuffer` qilib oladi va react-pdf'ga `{ data }` sifatida beradi. pdf.js buferni "detach" qiladi, shu sababli keshdagi buferning nusxasi uzatiladi. Unit testlarda `PdfViewer` mock qilinadi, PDF'ning haqiqiy chizilishi E2E testda tekshiriladi.

- [ ] **Step 1: Muvaffaqiyatsiz testni yozish**

`frontend/src/features/student/PlayerPage.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { stepContent, topicDetail } from '@/test/fixtures'
import { renderRoute, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { PlayerPage } from './PlayerPage'

vi.mock('./PdfViewer', () => ({
  PdfViewer: ({ url, title }: { url: string; title: string }) => <div data-testid="pdf">{`${title}|${url}`}</div>,
}))

const PATH = '/app/topics/:topicId/:kind?'

function mockTopic(glossaryCompleted: () => boolean) {
  server.use(
    http.get('/api/topics/10', () => {
      const topic = topicDetail()
      topic.steps[5].status = glossaryCompleted() ? 'completed' : null
      return HttpResponse.json(topic)
    }),
    http.get('/api/steps/101', () => HttpResponse.json(stepContent())),
    http.get('/api/steps/105', () =>
      HttpResponse.json(
        stepContent({
          id: 105,
          kind: 'glossary',
          order: 6,
          status: glossaryCompleted() ? 'completed' : null,
          materials: [],
          glossary: [{ id: 1, term: 'Kasb', definition: 'Mehnat faoliyati turi', order: 0 }],
        }),
      ),
    ),
  )
}

test('kind ko\'rsatilmasa birinchi kontentli bosqichga yo\'naltiriladi', async () => {
  mockTopic(() => false)
  const { router } = renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app/topics/10/lecture'))
})

test('ma\'ruza bosqichida PDF va "tugatilgan" belgisi ko\'rinadi', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  expect(await screen.findByTestId('pdf')).toHaveTextContent("Kirish ma'ruzasi|/api/materials/500/file")
  const section = screen.getByRole('region', { name: i18n.t('steps.lecture') })
  expect(within(section).getByText(i18n.t('player.completed'), { exact: false })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: i18n.t('player.complete') })).not.toBeInTheDocument()
})

test('glossariy bosqichini "Tugatdim" bilan yakunlash', async () => {
  let completed = false
  mockTopic(() => completed)
  server.use(
    http.post('/api/steps/105/complete', () => {
      completed = true
      return HttpResponse.json({ id: 105, kind: 'glossary', order: 6, has_content: true, status: 'completed' })
    }),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/glossary', user: studentUser })
  expect(await screen.findByText('Mehnat faoliyati turi')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: i18n.t('player.complete') }))
  expect(await screen.findByText(i18n.t('player.completedToast'))).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: i18n.t('player.complete') })).not.toBeInTheDocument(),
  )
})

test('kontentsiz bosqich "material yo\'q" holatini ko\'rsatadi', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/review', user: studentUser })
  expect(await screen.findByText(i18n.t('player.noContent'))).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: i18n.t('player.complete') })).not.toBeInTheDocument()
})

test('bosqichlar ro\'yxatida joriy bosqich belgilangan', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/glossary', user: studentUser })
  const current = await screen.findByRole('link', { current: 'step' })
  expect(current).toHaveTextContent(i18n.t('steps.glossary'))
})
```

- [ ] **Step 2: Test yiqilishini tekshirish**

Run: `npm test -- src/features/student/PlayerPage`
Expected: FAIL (stub hech narsa chizmaydi).

- [ ] **Step 3: `frontend/src/features/student/PdfViewer.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useMaterialPdf } from '@/api/student'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageSpinner } from '@/components/ui/Spinner'

// Worker `<Document>` chiziladigan modulning o'zida sozlanishi shart (react-pdf 11).
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export function PdfViewer({ url, title }: { url: string; title: string }) {
  const { t } = useTranslation()
  const pdf = useMaterialPdf(url)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>()
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // pdf.js uzatilgan buferni "detach" qiladi — keshdagi bufer buzilmasligi uchun nusxa beriladi.
  const file = useMemo(() => (pdf.data ? { data: new Uint8Array(pdf.data.slice(0)) } : null), [pdf.data])

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="font-semibold">{title}</figcaption>
      <div ref={containerRef} className="min-h-40 overflow-hidden rounded-xl border-2 border-slate-100 bg-slate-100">
        {pdf.isError ? (
          <ErrorState error={pdf.error} onRetry={() => void pdf.refetch()} />
        ) : file ? (
          <Document
            file={file}
            suspense={false}
            loading={<PageSpinner />}
            error={<p className="p-6 text-center text-red-700">{t('player.pdfError')}</p>}
            onLoadSuccess={({ numPages: total }) => {
              setNumPages(total)
              setPage(1)
            }}
          >
            <Page pageNumber={page} width={width} loading={<PageSpinner />} />
          </Document>
        ) : (
          <PageSpinner />
        )}
      </div>
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            aria-label={t('player.prevPage')}
          >
            ←
          </Button>
          <span className="text-sm font-semibold" aria-live="polite">
            {t('player.pageOf', { page, total: numPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= numPages}
            onClick={() => setPage((current) => current + 1)}
            aria-label={t('player.nextPage')}
          >
            →
          </Button>
        </div>
      )}
    </figure>
  )
}
```

- [ ] **Step 4: `frontend/src/features/student/StepContent.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCompleteStep, useStep } from '@/api/student'
import type { GlossaryTerm, LiteratureItem, StepBrief, StepKind } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageSpinner } from '@/components/ui/Spinner'
import { pushToast } from '@/components/ui/toast-store'
import { FILE_KINDS, SELF_COMPLETE_KINDS } from '@/lib/steps'
import { PdfViewer } from './PdfViewer'

interface StepContentViewProps {
  topicId: number
  step: StepBrief
  nextKind?: StepKind
}

export function StepContentView({ topicId, step, nextKind }: StepContentViewProps) {
  const { t } = useTranslation()
  const content = useStep(step.has_content ? step.id : undefined)
  const complete = useCompleteStep(topicId)

  if (!step.has_content) {
    return <EmptyState icon="🗂️" title={t('player.noContent')} text={t('player.noContentText')} />
  }
  if (content.isPending) return <PageSpinner />
  if (content.isError) return <ErrorState error={content.error} onRetry={() => void content.refetch()} />

  const data = content.data
  return (
    <div className="flex flex-col gap-6">
      {FILE_KINDS.has(data.kind) &&
        data.materials.map((material) => (
          <PdfViewer key={material.id} url={material.file_url} title={material.title} />
        ))}
      {data.kind === 'glossary' && <GlossaryList items={data.glossary} />}
      {data.kind === 'literature' && <LiteratureList items={data.literature} />}
      {SELF_COMPLETE_KINDS.has(data.kind) && (
        <div className="flex flex-wrap items-center gap-3 border-t-2 border-slate-100 pt-4">
          {data.status === 'completed' ? (
            <Badge tone="green">✓ {t('player.completed')}</Badge>
          ) : (
            <Button
              loading={complete.isPending}
              onClick={() =>
                complete.mutate(step.id, { onSuccess: () => pushToast('success', t('player.completedToast')) })
              }
            >
              {t('player.complete')}
            </Button>
          )}
          {nextKind && (
            <Link to={`/app/topics/${topicId}/${nextKind}`} className={buttonClasses('secondary')}>
              {t('player.next')} →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function GlossaryList({ items }: { items: GlossaryTerm[] }) {
  return (
    <dl className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border-2 border-slate-100 bg-white p-4">
          <dt className="font-bold text-brand-900">{item.term}</dt>
          <dd className="mt-1 text-slate-700">{item.definition}</dd>
        </div>
      ))}
    </dl>
  )
}

function LiteratureList({ items }: { items: LiteratureItem[] }) {
  const { t } = useTranslation()
  return (
    <ol className="flex list-decimal flex-col gap-3 pl-6">
      {items.map((item) => (
        <li key={item.id} className="pl-1">
          <span className="font-semibold">{item.title}</span>
          {(item.author || item.year) && (
            <span className="text-slate-600"> — {[item.author, item.year].filter(Boolean).join(', ')}</span>
          )}
          {item.url && (
            <>
              {' '}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:underline"
              >
                {t('player.openLink')}
              </a>
            </>
          )}
        </li>
      ))}
    </ol>
  )
}
```

- [ ] **Step 5: `frontend/src/features/student/PlayerPage.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router'
import { useTopic } from '@/api/student'
import type { StepBrief } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { PageSpinner } from '@/components/ui/Spinner'
import { cx } from '@/lib/cx'
import { isStepKind, STEP_ICONS } from '@/lib/steps'
import { StepContentView } from './StepContent'

export function PlayerPage() {
  const { t } = useTranslation()
  const params = useParams()
  const topicId = Number(params.topicId)
  const topic = useTopic(topicId)

  if (!Number.isInteger(topicId) || topicId <= 0) return <EmptyState icon="🧭" title={t('notFound.title')} />
  if (topic.isPending) return <PageSpinner />
  if (topic.isError) return <ErrorState error={topic.error} onRetry={() => void topic.refetch()} />

  const { steps } = topic.data
  if (!isStepKind(params.kind)) {
    const first = steps.find((step) => step.has_content) ?? steps[0]
    return <Navigate to={`/app/topics/${topicId}/${first.kind}`} replace />
  }
  const index = steps.findIndex((step) => step.kind === params.kind)
  const current = steps[index]
  const next = steps.slice(index + 1).find((step) => step.has_content)

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/app/subjects/${topic.data.subject.slug}`}
        className="text-sm font-semibold text-brand-700 hover:underline"
      >
        ← {topic.data.subject.title}
      </Link>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <ProgressRing completed={topic.data.progress.completed} total={topic.data.progress.total} size={48} />
              <h1 className="font-bold leading-tight">{topic.data.title}</h1>
            </div>
            <ol aria-label={t('player.steps')} className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
              {steps.map((step) => (
                <li key={step.id} className="shrink-0">
                  <StepLink topicId={topicId} step={step} active={step.id === current.id} />
                </li>
              ))}
            </ol>
          </Card>
        </aside>
        <section aria-labelledby="step-title" className="min-w-0">
          <h2 id="step-title" className="mb-4 text-xl font-bold">
            <span aria-hidden="true">{STEP_ICONS[current.kind]} </span>
            {t(`steps.${current.kind}`)}
          </h2>
          <StepContentView key={current.id} topicId={topicId} step={current} nextKind={next?.kind} />
        </section>
      </div>
    </div>
  )
}

function StepLink({ topicId, step, active }: { topicId: number; step: StepBrief; active: boolean }) {
  const { t } = useTranslation()
  const completed = step.status === 'completed'
  return (
    <Link
      to={`/app/topics/${topicId}/${step.kind}`}
      aria-current={active ? 'step' : undefined}
      className={cx(
        'flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm whitespace-nowrap',
        active ? 'bg-brand-100 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-100',
        !step.has_content && !active && 'text-slate-400',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold',
          completed ? 'bg-brand-500 text-white' : active ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-600',
        )}
      >
        {completed ? '✓' : step.order}
      </span>
      {t(`steps.${step.kind}`)}
      {completed && <span className="sr-only"> ({t('player.completed')})</span>}
    </Link>
  )
}
```

- [ ] **Step 6: Testlar va qo'lda tekshiruv**

Run: `npm test && npm run lint && npm run build`
Expected: PASS, lint xatosiz, build muvaffaqiyatli (`dist/assets/pdf.worker.min-*.mjs` alohida asset bo'lib chiqadi).

Qo'lda tekshiruv: backend'da admin fan yaratadi va nashr qiladi, so'ng mavzu yaratib PDF yuklaydi (hozircha Swagger `/api/docs` orqali; muharrir Task 13'da paydo bo'ladi). Talaba sifatida `/app/topics/<id>` ochiladi.
- PDF sahifasi chiziladi, sahifalar o'rtasida o'tish ishlaydi.
- "Tugatdim" bosilgach progress halqasi yangilanadi.

- [ ] **Step 7: CHANGELOG va commit**

CHANGELOG qatori: `- Dars pleyeri: 7 bosqich paneli, himoyalangan PDF ko'ruvchi, glossariy, adabiyotlar, "Tugatdim".`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): lesson player with pdf viewer and step completion"
```

---

### Task 11: Profil — ism, telefon, til, parol

**Files:**
- Create: `frontend/src/features/profile/schemas.ts`
- Modify (stub → to'liq): `frontend/src/features/profile/ProfilePage.tsx`
- Test: `frontend/src/features/profile/ProfilePage.test.tsx`

Parol almashtirilganda backend barcha sessiyalarni bekor qiladi. Shuning uchun `useChangePassword` muvaffaqiyatli tugagach lokal sessiya yopiladi va `RequireAuth` foydalanuvchini `/login`ga yuboradi. Bu haqda toast orqali xabar beriladi.

- [ ] **Step 1: `frontend/src/features/profile/schemas.ts`**

```ts
import { z } from 'zod'

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, { error: 'validation.nameMin' }).max(150, { error: 'validation.tooLong' }),
  phone: z.string().trim().max(32, { error: 'validation.tooLong' }),
})

export type ProfileValues = z.infer<typeof profileSchema>

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, { error: 'validation.required' }),
    new_password: z.string().min(8, { error: 'validation.passwordMin' }).max(128, { error: 'validation.tooLong' }),
    confirm: z.string(),
  })
  .refine((values) => values.new_password === values.confirm, {
    error: 'validation.passwordMismatch',
    path: ['confirm'],
  })

export type PasswordValues = z.infer<typeof passwordSchema>
```

- [ ] **Step 2: Muvaffaqiyatsiz testni yozish**

`frontend/src/features/profile/ProfilePage.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { RequireAuth } from '@/app/guards'
import { i18n } from '@/i18n'
import { renderRoutes, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { ProfilePage } from './ProfilePage'

const routes = [
  { element: <RequireAuth />, children: [{ path: '/app/profile', element: <ProfilePage /> }] },
  { path: '/login', element: <p>login sahifa</p> },
]

test('ism yangilanadi va toast chiqadi', async () => {
  let body: unknown = null
  server.use(
    http.patch('/api/me', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...studentUser, full_name: 'Dilnoza Aliyeva' })
    }),
  )
  renderRoutes(routes, { url: '/app/profile', user: studentUser })
  const name = screen.getByLabelText(i18n.t('auth.fullName'))
  await userEvent.clear(name)
  await userEvent.type(name, 'Dilnoza Aliyeva')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.save') }))
  expect(await screen.findByText(i18n.t('profile.saved'))).toBeInTheDocument()
  expect(body).toEqual({ full_name: 'Dilnoza Aliyeva', phone: null })
})

async function submitPassword(current: string) {
  await userEvent.type(screen.getByLabelText(i18n.t('profile.currentPassword')), current)
  await userEvent.type(screen.getByLabelText(i18n.t('profile.newPassword')), 'yangi-parol-123')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.passwordConfirm')), 'yangi-parol-123')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('profile.changePassword') }))
}

test('joriy parol noto\'g\'ri bo\'lsa xato ko\'rsatiladi', async () => {
  server.use(
    http.post('/api/me/password', () =>
      HttpResponse.json({ code: 'WRONG_PASSWORD', message: 'x', details: {} }, { status: 400 }),
    ),
  )
  renderRoutes(routes, { url: '/app/profile', user: studentUser })
  await submitPassword('notogri')
  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('errors.WRONG_PASSWORD'))
})

test('parol almashgach sessiya yopiladi va /login ga o\'tiladi', async () => {
  server.use(http.post('/api/me/password', () => new HttpResponse(null, { status: 204 })))
  const { router } = renderRoutes(routes, { url: '/app/profile', user: studentUser })
  await submitPassword('eski-parol-123')
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(screen.getByText(i18n.t('profile.passwordChanged'))).toBeInTheDocument()
})
```

- [ ] **Step 3: Test yiqilishini tekshirish**

Run: `npm test -- src/features/profile`
Expected: FAIL.

- [ ] **Step 4: `frontend/src/features/profile/ProfilePage.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useChangePassword, useCurrentUser, useUpdateMe } from '@/api/auth'
import type { User } from '@/api/types'
import { LanguageSwitch } from '@/app/layouts/LanguageSwitch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { pushToast } from '@/components/ui/toast-store'
import { passwordSchema, profileSchema, type PasswordValues, type ProfileValues } from './schemas'

export function ProfilePage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  if (!user) return null
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
      <Card className="flex flex-col gap-1">
        <p className="text-sm text-slate-500">{t('auth.email')}</p>
        <p className="font-semibold">{user.email}</p>
        <p className="mt-2 text-sm text-slate-500">{t('profile.role')}</p>
        <p className="font-semibold">{t(`roles.${user.role}`)}</p>
      </Card>
      <ProfileForm user={user} />
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t('profile.language')}</h2>
        <LanguageSwitch />
      </Card>
      <PasswordForm />
    </div>
  )
}

function ProfileForm({ user }: { user: User }) {
  const { t } = useTranslation()
  const updateMe = useUpdateMe()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user.full_name, phone: user.phone ?? '' },
  })

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">{t('profile.personal')}</h2>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          updateMe.mutate(
            { full_name: values.full_name, phone: values.phone || null },
            { onSuccess: () => pushToast('success', t('profile.saved')) },
          ),
        )}
      >
        <Field id="full_name" label={t('auth.fullName')} error={errors.full_name?.message}>
          <Input id="full_name" autoComplete="name" aria-invalid={Boolean(errors.full_name)} {...register('full_name')} />
        </Field>
        <Field id="phone" label={t('auth.phone')} error={errors.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
        </Field>
        <div>
          <Button type="submit" loading={updateMe.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const { t } = useTranslation()
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">{t('profile.passwordTitle')}</h2>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          changePassword.mutate({ current_password: values.current_password, new_password: values.new_password }),
        )}
      >
        {changePassword.error && <FormError error={changePassword.error} />}
        <Field id="current_password" label={t('profile.currentPassword')} error={errors.current_password?.message}>
          <Input
            id="current_password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.current_password)}
            {...register('current_password')}
          />
        </Field>
        <Field
          id="new_password"
          label={t('profile.newPassword')}
          hint={t('auth.passwordHint')}
          error={errors.new_password?.message}
        >
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.new_password)}
            {...register('new_password')}
          />
        </Field>
        <Field id="confirm" label={t('auth.passwordConfirm')} error={errors.confirm?.message}>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm)}
            {...register('confirm')}
          />
        </Field>
        <div>
          <Button type="submit" loading={changePassword.isPending}>
            {t('profile.changePassword')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
```

Parol almashgani haqidagi toast `useChangePassword` hook'ining o'zida chiqariladi (Task 6, `api/auth.ts`). Sessiya yopilgach sahifa unmount bo'ladi, shuning uchun komponentdagi `mutate(..., { onSuccess })` callback'iga tayanib bo'lmaydi.

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS, xatosiz.

- [ ] **Step 6: CHANGELOG va commit**

CHANGELOG qatori: `- Profil sahifasi: shaxsiy ma'lumotlar, til, parolni almashtirish.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): profile page with personal data, language and password change"
```

---

### Task 12: O'qituvchi — API hook'lari va mavzular ro'yxati (yaratish, tartiblash, o'chirish)

**Files:**
- Create: `frontend/src/api/teach.ts`
- Modify (stub → to'liq): `frontend/src/features/teach/TeachHomePage.tsx`
- Test: `frontend/src/api/teach.test.ts`, `frontend/src/features/teach/TeachHomePage.test.tsx`

Tartiblash: backend `PUT /teach/subjects/{id}/topics/order` fanning **barcha** mavzu ID'larini yangi tartibda kutadi (aks holda `INVALID_ORDER`). Mavzular ↑/↓ tugmalari bilan suriladi. Drag-and-drop o'rniga tugmalar tanlangan, chunki ular klaviatura va telefonda ham qulay.

- [ ] **Step 1: `frontend/src/api/teach.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type {
  GlossaryIn,
  GlossaryTerm,
  LiteratureIn,
  LiteratureItem,
  Material,
  TeachSubject,
  TeachTopicBrief,
  TopicCreate,
  TopicEditor,
  TopicUpdate,
} from './types'

export const teachKeys = {
  subjects: ['teach', 'subjects'] as const,
  topic: (id: number) => ['teach', 'topics', id] as const,
}

const POLL_MS = 2000

/** Konvertatsiya qilinayotgan material bo'lsa, muharrir holatni so'rab turadi. */
export function hasProcessing(topic: TopicEditor | undefined): boolean {
  return Boolean(topic?.steps.some((step) => step.materials.some((m) => m.status === 'processing')))
}

export function useTeachSubjects() {
  return useQuery({
    queryKey: teachKeys.subjects,
    queryFn: ({ signal }) => apiFetch<TeachSubject[]>('/api/teach/subjects', { signal }),
  })
}

export function useEditorTopic(topicId: number) {
  return useQuery({
    queryKey: teachKeys.topic(topicId),
    queryFn: ({ signal }) => apiFetch<TopicEditor>(`/api/teach/topics/${topicId}`, { signal }),
    enabled: Number.isInteger(topicId) && topicId > 0,
    refetchInterval: (query) => (hasProcessing(query.state.data) ? POLL_MS : false),
  })
}

export function useCreateTopic(subjectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TopicCreate) =>
      apiFetch<TopicEditor>(`/api/teach/subjects/${subjectId}/topics`, { method: 'POST', json: data }),
    onSuccess: (topic) => {
      queryClient.setQueryData(teachKeys.topic(topic.id), topic)
      return queryClient.invalidateQueries({ queryKey: teachKeys.subjects })
    },
  })
}

export function useReorderTopics(subjectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topicIds: number[]) =>
      apiFetch<TeachTopicBrief[]>(`/api/teach/subjects/${subjectId}/topics/order`, {
        method: 'PUT',
        json: { topic_ids: topicIds },
      }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: teachKeys.subjects }),
  })
}

export function useUpdateTopic(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TopicUpdate) =>
      apiFetch<TopicEditor>(`/api/teach/topics/${topicId}`, { method: 'PATCH', json: data }),
    onSuccess: (topic) => {
      queryClient.setQueryData(teachKeys.topic(topic.id), topic)
      return queryClient.invalidateQueries({ queryKey: teachKeys.subjects })
    },
  })
}

export function useDeleteTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topicId: number) => apiFetch<void>(`/api/teach/topics/${topicId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachKeys.subjects }),
  })
}

export interface UploadInput {
  stepId: number
  title: string
  file: File
}

export function useUploadMaterial(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stepId, title, file }: UploadInput) => {
      const body = new FormData()
      body.append('title', title)
      body.append('file', file)
      return apiFetch<Material>(`/api/teach/steps/${stepId}/materials`, { method: 'POST', body })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) }),
    meta: { silent: true },
  })
}

export function useDeleteMaterial(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: number) =>
      apiFetch<void>(`/api/teach/materials/${materialId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) }),
  })
}

export function useRetryMaterial(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: number) =>
      apiFetch<Material>(`/api/teach/materials/${materialId}/retry`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) }),
  })
}

/** Glossariy va adabiyotlar uchun bir xil CRUD: `/api/teach/topics/{id}/{resource}[/{itemId}]`. */
function useTopicItemMutations<TIn, TOut>(topicId: number, resource: 'glossary' | 'literature') {
  const queryClient = useQueryClient()
  const base = `/api/teach/topics/${topicId}/${resource}`
  const invalidate = () => queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) })
  const add = useMutation({
    mutationFn: (data: TIn) => apiFetch<TOut>(base, { method: 'POST', json: data }),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TIn> }) =>
      apiFetch<TOut>(`${base}/${id}`, { method: 'PATCH', json: data }),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`${base}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
  return { add, update, remove }
}

export function useGlossaryMutations(topicId: number) {
  return useTopicItemMutations<GlossaryIn, GlossaryTerm>(topicId, 'glossary')
}

export function useLiteratureMutations(topicId: number) {
  return useTopicItemMutations<LiteratureIn, LiteratureItem>(topicId, 'literature')
}
```

- [ ] **Step 2: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/api/teach.test.ts`:

```ts
import type { TopicEditor } from './types'
import { hasProcessing } from './teach'

function topicWith(statuses: Array<'processing' | 'ready' | 'failed'>): TopicEditor {
  return {
    id: 1,
    subject_id: 1,
    title: 'Mavzu',
    summary: '',
    order: 1,
    is_published: false,
    glossary: [],
    literature: [],
    steps: [
      {
        id: 10,
        kind: 'lecture',
        order: 2,
        materials: statuses.map((status, index) => ({
          id: index + 1,
          step_id: 10,
          title: `M${index}`,
          original_name: 'a.pptx',
          page_count: null,
          status,
          error: null,
        })),
      },
    ],
  }
}

test('processing material bo\'lsa polling yoqiladi', () => {
  expect(hasProcessing(topicWith(['ready', 'processing']))).toBe(true)
})

test('hamma material tayyor yoki xato bo\'lsa polling o\'chadi', () => {
  expect(hasProcessing(topicWith(['ready', 'failed']))).toBe(false)
  expect(hasProcessing(undefined)).toBe(false)
})
```

`frontend/src/features/teach/TeachHomePage.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import type { TeachSubject } from '@/api/types'
import { i18n } from '@/i18n'
import { renderRoutes, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { TeachHomePage } from './TeachHomePage'

const subjects: TeachSubject[] = [
  {
    id: 1,
    title: "Kasb ta'limi metodikasi",
    slug: 'kasb',
    is_published: true,
    topics: [
      { id: 10, title: 'Birinchi mavzu', order: 1, is_published: true },
      { id: 11, title: 'Ikkinchi mavzu', order: 2, is_published: false },
    ],
  },
]

const routes = [
  { path: '/teach', element: <TeachHomePage /> },
  { path: '/teach/topics/:topicId', element: <p>muharrir</p> },
]

test('mavzular tartib va holat bilan ko\'rsatiladi', async () => {
  server.use(http.get('/api/teach/subjects', () => HttpResponse.json(subjects)))
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  const first = await screen.findByRole('link', { name: 'Birinchi mavzu' })
  expect(first).toHaveAttribute('href', '/teach/topics/10')
  expect(screen.getByText(i18n.t('common.draft'))).toBeInTheDocument()
})

test('↓ tugmasi yangi tartibni yuboradi', async () => {
  let body: unknown = null
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.put('/api/teach/subjects/1/topics/order', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json([])
    }),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  await userEvent.click(await screen.findByRole('button', { name: i18n.t('teach.moveDown', { title: 'Birinchi mavzu' }) }))
  await waitFor(() => expect(body).toEqual({ topic_ids: [11, 10] }))
})

test('yangi mavzu yaratilgach muharrirga o\'tiladi', async () => {
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.post('/api/teach/subjects/1/topics', () =>
      HttpResponse.json(
        { id: 12, subject_id: 1, title: 'Uchinchi', summary: '', order: 3, is_published: false, steps: [], glossary: [], literature: [] },
        { status: 201 },
      ),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/teach', user: teacherUser })
  await userEvent.type(await screen.findByLabelText(i18n.t('teach.newTopicLabel')), 'Uchinchi')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('teach.addTopic') }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/teach/topics/12'))
})

test('o\'chirish tasdiqlangach DELETE yuboriladi', async () => {
  const deleted = vi.fn()
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.delete('/api/teach/topics/11', () => {
      deleted()
      return new HttpResponse(null, { status: 204 })
    }),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  await userEvent.click(await screen.findByRole('button', { name: i18n.t('teach.deleteTopic', { title: 'Ikkinchi mavzu' }) }))
  const dialog = screen.getByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: i18n.t('common.delete') }))
  await waitFor(() => expect(deleted).toHaveBeenCalledOnce())
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

test('biriktirilgan fan bo\'lmasa tushuntirish ko\'rsatiladi', async () => {
  server.use(http.get('/api/teach/subjects', () => HttpResponse.json([])))
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  expect(await screen.findByText(i18n.t('teach.noSubjects'))).toBeInTheDocument()
})
```

- [ ] **Step 3: Testlar yiqilishini tekshirish**

Run: `npm test -- src/api/teach src/features/teach`
Expected: FAIL.

- [ ] **Step 4: `frontend/src/features/teach/TeachHomePage.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useCreateTopic, useDeleteTopic, useReorderTopics, useTeachSubjects } from '@/api/teach'
import type { TeachSubject, TeachTopicBrief } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'

export function TeachHomePage() {
  const { t } = useTranslation()
  const subjects = useTeachSubjects()

  if (subjects.isPending) return <PageSpinner />
  if (subjects.isError) return <ErrorState error={subjects.error} onRetry={() => void subjects.refetch()} />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('teach.title')}</h1>
      {subjects.data.length === 0 ? (
        <EmptyState icon="🧑‍🏫" title={t('teach.noSubjects')} text={t('teach.noSubjectsText')} />
      ) : (
        subjects.data.map((subject) => <SubjectTopics key={subject.id} subject={subject} />)
      )}
    </div>
  )
}

function PublishedBadge({ published }: { published: boolean }) {
  const { t } = useTranslation()
  return <Badge tone={published ? 'green' : 'amber'}>{published ? t('common.published') : t('common.draft')}</Badge>
}

function SubjectTopics({ subject }: { subject: TeachSubject }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateTopic(subject.id)
  const reorder = useReorderTopics(subject.id)
  const remove = useDeleteTopic()
  const [title, setTitle] = useState('')
  const [toDelete, setToDelete] = useState<TeachTopicBrief | null>(null)
  const inputId = `new-topic-${subject.id}`
  const topics = subject.topics

  function move(index: number, delta: -1 | 1) {
    const ids = topics.map((topic) => topic.id)
    const target = index + delta
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids)
  }

  function onCreate(event: FormEvent) {
    event.preventDefault()
    const value = title.trim()
    if (value.length < 2) return
    create.mutate(
      { title: value },
      {
        onSuccess: (topic) => {
          setTitle('')
          void navigate(`/teach/topics/${topic.id}`)
        },
      },
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{subject.title}</h2>
        <PublishedBadge published={subject.is_published} />
      </header>
      {topics.length === 0 ? (
        <p className="text-slate-500">{t('teach.noTopics')}</p>
      ) : (
        <ol className="flex flex-col divide-y-2 divide-slate-100">
          {topics.map((topic, index) => (
            <li key={topic.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="w-6 text-sm font-bold text-slate-400">{index + 1}</span>
              <Link to={`/teach/topics/${topic.id}`} className="min-w-40 flex-1 font-semibold hover:text-brand-700">
                {topic.title}
              </Link>
              <PublishedBadge published={topic.is_published} />
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('teach.moveUp', { title: topic.title })}
                disabled={index === 0 || reorder.isPending}
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('teach.moveDown', { title: topic.title })}
                disabled={index === topics.length - 1 || reorder.isPending}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('teach.deleteTopic', { title: topic.title })}
                onClick={() => setToDelete(topic)}
              >
                🗑️
              </Button>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          {t('teach.newTopicLabel')}
        </label>
        <Input
          id={inputId}
          value={title}
          maxLength={200}
          placeholder={t('teach.newTopicPlaceholder')}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button type="submit" className="shrink-0" loading={create.isPending} disabled={title.trim().length < 2}>
          {t('teach.addTopic')}
        </Button>
      </form>
      <ConfirmDialog
        open={toDelete !== null}
        title={t('teach.deleteTopicTitle')}
        text={t('teach.deleteTopicText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }}
      />
    </Card>
  )
}
```

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS, xatosiz.

- [ ] **Step 6: CHANGELOG va commit**

CHANGELOG qatori: `- O'qituvchi: API hook'lari, mavzular ro'yxati (yaratish, ↑/↓ tartiblash, o'chirish).`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): teacher topic list with create, reorder and delete"
```

---

### Task 13: Mavzu muharriri — mavzu ma'lumotlari, bosqich tablari, materiallar

**Files:**
- Create: `frontend/src/features/teach/schemas.ts`, `frontend/src/features/teach/TopicDetailsForm.tsx`, `frontend/src/features/teach/MaterialsTab.tsx`
- Modify (stub → to'liq): `frontend/src/features/teach/TopicEditorPage.tsx` (glossariy va adabiyot tablari Task 14'da ulanadi)
- Test: `frontend/src/features/teach/TopicEditorPage.test.tsx`

**Muharrir:**
- Yuqorida mavzu nomi, qisqacha mazmuni va "nashr qilingan" belgisi turadi.
- Pastda 7 bosqich tablari bor. Tanlangan tab manzilda `?tab=` parametri sifatida saqlanadi, shuning uchun sahifa yangilanganda ham o'sha tab ochiladi.
- `lecture` va `presentation` tablarida fayl yuklanadi.
- `glossary` va `literature` tablarida mos ro'yxatlar tahrirlanadi.
- `review`, `practice` va `task` tablarida "2-bosqichda qo'shiladi" degan yozuv turadi.
- Material `processing` holatida bo'lsa, `useEditorTopic` har 2 soniyada holatni yangilaydi (Task 12).

Yuklashning to'liq tekshiruvi (multipart body) E2E testda (Task 17) qilinadi. jsdom'ning `FormData` obyekti Node `fetch` bilan to'g'ri serializatsiya bo'lishi kafolatlanmagan, shuning uchun unit test faqat so'rov to'g'ri manzilga ketganini va interfeys holatini tekshiradi.

- [ ] **Step 1: `frontend/src/features/teach/schemas.ts`**

```ts
import { z } from 'zod'

export const topicSchema = z.object({
  title: z.string().trim().min(2, { error: 'validation.titleMin' }).max(200, { error: 'validation.tooLong' }),
  summary: z.string().max(5000, { error: 'validation.tooLong' }),
  is_published: z.boolean(),
})

export type TopicValues = z.infer<typeof topicSchema>

export const glossarySchema = z.object({
  term: z.string().trim().min(1, { error: 'validation.required' }).max(200, { error: 'validation.tooLong' }),
  definition: z.string().trim().min(1, { error: 'validation.required' }).max(5000, { error: 'validation.tooLong' }),
})

export type GlossaryValues = z.infer<typeof glossarySchema>

export const literatureSchema = z.object({
  title: z.string().trim().min(1, { error: 'validation.required' }).max(300, { error: 'validation.tooLong' }),
  author: z.string().trim().max(200, { error: 'validation.tooLong' }),
  year: z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2100), {
      error: 'validation.year',
    }),
  url: z
    .string()
    .trim()
    .max(500, { error: 'validation.tooLong' })
    .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), { error: 'validation.url' }),
})

export type LiteratureValues = z.infer<typeof literatureSchema>
```

- [ ] **Step 2: Muvaffaqiyatsiz testni yozish**

`frontend/src/features/teach/TopicEditorPage.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import type { Material, TopicEditor } from '@/api/types'
import { i18n } from '@/i18n'
import { STEP_KINDS } from '@/lib/steps'
import { renderRoute, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { TopicEditorPage } from './TopicEditorPage'

function material(overrides: Partial<Material>): Material {
  return {
    id: 1,
    step_id: 102,
    title: 'Material',
    original_name: 'fayl.pdf',
    page_count: 4,
    status: 'ready',
    error: null,
    ...overrides,
  }
}

function editorTopic(lectureMaterials: Material[] = []): TopicEditor {
  return {
    id: 10,
    subject_id: 1,
    title: 'Kasb tanlash asoslari',
    summary: 'Qisqacha',
    order: 1,
    is_published: false,
    glossary: [],
    literature: [],
    steps: STEP_KINDS.map((kind, index) => ({
      id: 100 + index,
      kind,
      order: index + 1,
      materials: kind === 'lecture' ? lectureMaterials : [],
    })),
  }
}

const PATH = '/teach/topics/:topicId'

test('ma\'ruza tabida materiallar holati bilan ko\'rsatiladi', async () => {
  server.use(
    http.get('/api/teach/topics/10', () =>
      HttpResponse.json(
        editorTopic([
          material({ id: 1, title: 'Tayyor PDF', status: 'ready', page_count: 4 }),
          material({ id: 2, title: 'Buzilgan PPTX', status: 'failed', error: 'LIBREOFFICE_NOT_FOUND', page_count: null }),
        ]),
      ),
    ),
  )
  renderRoute(<TopicEditorPage />, { path: PATH, url: '/teach/topics/10', user: teacherUser })
  expect(await screen.findByDisplayValue('Kasb tanlash asoslari')).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: new RegExp(i18n.t('steps.lecture')) })).toHaveAttribute('aria-selected', 'true')
  const failed = screen.getByRole('listitem', { name: 'Buzilgan PPTX' })
  expect(within(failed).getByText(i18n.t('materialErrors.LIBREOFFICE_NOT_FOUND'))).toBeInTheDocument()
  const ready = screen.getByRole('listitem', { name: 'Tayyor PDF' })
  expect(within(ready).getByText(i18n.t('teach.pagesCount', { count: 4 }), { exact: false })).toBeInTheDocument()
})

test('xato bilan tugagan materialni qayta urinish', async () => {
  const retried = vi.fn()
  server.use(
    http.get('/api/teach/topics/10', () =>
      HttpResponse.json(editorTopic([material({ id: 2, title: 'Buzilgan PPTX', status: 'failed', error: 'CONVERSION_FAILED' })])),
    ),
    http.post('/api/teach/materials/2/retry', () => {
      retried()
      return HttpResponse.json(material({ id: 2, status: 'processing' }))
    }),
  )
  renderRoute(<TopicEditorPage />, { path: PATH, url: '/teach/topics/10', user: teacherUser })
  const row = await screen.findByRole('listitem', { name: 'Buzilgan PPTX' })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('common.retry') }))
  await waitFor(() => expect(retried).toHaveBeenCalledOnce())
})

test('fayl yuklash so\'rovi to\'g\'ri bosqichga yuboriladi', async () => {
  const uploaded = vi.fn()
  server.use(
    http.get('/api/teach/topics/10', () => HttpResponse.json(editorTopic())),
    http.post('/api/teach/steps/101/materials', () => {
      uploaded()
      return HttpResponse.json(material({ id: 9, step_id: 101, status: 'processing' }), { status: 201 })
    }),
  )
  renderRoute(<TopicEditorPage />, { path: PATH, url: '/teach/topics/10', user: teacherUser })
  const submit = await screen.findByRole('button', { name: i18n.t('teach.upload') })
  expect(submit).toBeDisabled()
  await userEvent.type(screen.getByLabelText(i18n.t('teach.materialTitle')), "Kirish ma'ruzasi")
  await userEvent.upload(
    screen.getByLabelText(i18n.t('teach.materialFile')),
    new File(['%PDF-1.4'], 'kirish.pdf', { type: 'application/pdf' }),
  )
  await userEvent.click(submit)
  await waitFor(() => expect(uploaded).toHaveBeenCalledOnce())
  expect(await screen.findByText(i18n.t('teach.materialUploaded'))).toBeInTheDocument()
})

test('tab almashtirish manzilga yoziladi; 2-bosqich tablari "tez kunda" deydi', async () => {
  server.use(http.get('/api/teach/topics/10', () => HttpResponse.json(editorTopic())))
  const { router } = renderRoute(<TopicEditorPage />, { path: PATH, url: '/teach/topics/10', user: teacherUser })
  await userEvent.click(await screen.findByRole('tab', { name: new RegExp(i18n.t('steps.practice')) }))
  expect(router.state.location.search).toBe('?tab=practice')
  expect(screen.getByText(i18n.t('teach.comingSoon'))).toBeInTheDocument()
})

test('mavzu ma\'lumotlarini saqlash PATCH yuboradi', async () => {
  let body: unknown = null
  server.use(
    http.get('/api/teach/topics/10', () => HttpResponse.json(editorTopic())),
    http.patch('/api/teach/topics/10', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...editorTopic(), is_published: true })
    }),
  )
  renderRoute(<TopicEditorPage />, { path: PATH, url: '/teach/topics/10', user: teacherUser })
  await userEvent.click(await screen.findByLabelText(i18n.t('teach.topicPublished')))
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.save') }))
  await waitFor(() =>
    expect(body).toEqual({ title: 'Kasb tanlash asoslari', summary: 'Qisqacha', is_published: true }),
  )
})
```

- [ ] **Step 3: Test yiqilishini tekshirish**

Run: `npm test -- src/features/teach/TopicEditorPage`
Expected: FAIL.

- [ ] **Step 4: `frontend/src/features/teach/TopicDetailsForm.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useUpdateTopic } from '@/api/teach'
import type { TopicEditor } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field'
import { pushToast } from '@/components/ui/toast-store'
import { topicSchema, type TopicValues } from './schemas'

export function TopicDetailsForm({ topic }: { topic: TopicEditor }) {
  const { t } = useTranslation()
  const update = useUpdateTopic(topic.id)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TopicValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: { title: topic.title, summary: topic.summary, is_published: topic.is_published },
  })

  return (
    <Card>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          update.mutate(values, { onSuccess: () => pushToast('success', t('teach.topicSaved')) }),
        )}
      >
        <Field id="topic-title" label={t('teach.topicTitle')} error={errors.title?.message}>
          <Input id="topic-title" aria-invalid={Boolean(errors.title)} {...register('title')} />
        </Field>
        <Field id="topic-summary" label={t('teach.topicSummary')} error={errors.summary?.message}>
          <Textarea id="topic-summary" rows={3} aria-invalid={Boolean(errors.summary)} {...register('summary')} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox label={t('teach.topicPublished')} {...register('is_published')} />
          <Button type="submit" loading={update.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
```

- [ ] **Step 5: `frontend/src/features/teach/MaterialsTab.tsx`**

```tsx
import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteMaterial, useRetryMaterial, useUploadMaterial } from '@/api/teach'
import type { Material, StepEditor } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { pushToast } from '@/components/ui/toast-store'

const ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx'

export function MaterialsTab({ topicId, step }: { topicId: number; step: StepEditor }) {
  const { t } = useTranslation()
  const upload = useUploadMaterial(topicId)
  const remove = useDeleteMaterial(topicId)
  const retry = useRetryMaterial(topicId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [toDelete, setToDelete] = useState<Material | null>(null)
  const titleId = `material-title-${step.id}`
  const fileId = `material-file-${step.id}`
  const canSubmit = file !== null && title.trim() !== ''

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file || !title.trim()) return
    upload.mutate(
      { stepId: step.id, title: title.trim(), file },
      {
        onSuccess: () => {
          setTitle('')
          setFile(null)
          if (fileRef.current) fileRef.current.value = ''
          pushToast('success', t('teach.materialUploaded'))
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {upload.error && (
          <div className="sm:col-span-3">
            <FormError error={upload.error} />
          </div>
        )}
        <Field id={titleId} label={t('teach.materialTitle')}>
          <Input id={titleId} value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field id={fileId} label={t('teach.materialFile')} hint={t('teach.materialFileHint')}>
          <Input
            ref={fileRef}
            id={fileId}
            type="file"
            accept={ACCEPT}
            className="file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:font-semibold"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </Field>
        <Button type="submit" loading={upload.isPending} disabled={!canSubmit}>
          {t('teach.upload')}
        </Button>
      </form>
      {step.materials.length === 0 ? (
        <p className="text-slate-500">{t('teach.noMaterials')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {step.materials.map((material) => (
            <MaterialRow
              key={material.id}
              material={material}
              retrying={retry.isPending && retry.variables === material.id}
              onRetry={() => retry.mutate(material.id)}
              onDelete={() => setToDelete(material)}
            />
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title={t('teach.deleteMaterialTitle')}
        text={t('teach.deleteMaterialText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }}
      />
    </div>
  )
}

interface MaterialRowProps {
  material: Material
  retrying: boolean
  onRetry: () => void
  onDelete: () => void
}

function MaterialRow({ material, retrying, onRetry, onDelete }: MaterialRowProps) {
  const { t } = useTranslation()
  return (
    <li
      aria-label={material.title}
      className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-slate-100 bg-white px-4 py-3"
    >
      <div className="min-w-40 flex-1">
        <p className="font-semibold">{material.title}</p>
        <p className="text-sm text-slate-500">{material.original_name}</p>
        {material.status === 'failed' && (
          <p className="mt-1 text-sm text-red-700">
            {t(`materialErrors.${material.error ?? 'CONVERSION_FAILED'}`, {
              defaultValue: t('materialErrors.CONVERSION_FAILED'),
            })}
          </p>
        )}
      </div>
      {material.status === 'processing' && (
        <Badge tone="amber">
          <Spinner size="sm" decorative /> {t('teach.status.processing')}
        </Badge>
      )}
      {material.status === 'ready' && (
        <Badge tone="green">
          {t('teach.status.ready')}
          {material.page_count ? ` · ${t('teach.pagesCount', { count: material.page_count })}` : ''}
        </Badge>
      )}
      {material.status === 'failed' && (
        <>
          <Badge tone="red">{t('teach.status.failed')}</Badge>
          <Button variant="secondary" size="sm" loading={retrying} onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </>
      )}
      <Button variant="ghost" size="sm" disabled={material.status === 'processing'} onClick={onDelete}>
        {t('common.delete')}
      </Button>
    </li>
  )
}
```

- [ ] **Step 6: `frontend/src/features/teach/TopicEditorPage.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router'
import { useEditorTopic } from '@/api/teach'
import type { StepKind, TopicEditor } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { PageSpinner } from '@/components/ui/Spinner'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { FILE_KINDS, isStepKind, STEP_ICONS, STEP_KINDS } from '@/lib/steps'
import { MaterialsTab } from './MaterialsTab'
import { TopicDetailsForm } from './TopicDetailsForm'

function itemCount(topic: TopicEditor, kind: StepKind): number {
  if (kind === 'glossary') return topic.glossary.length
  if (kind === 'literature') return topic.literature.length
  return topic.steps.find((step) => step.kind === kind)?.materials.length ?? 0
}

export function TopicEditorPage() {
  const { t } = useTranslation()
  const topicId = Number(useParams().topicId)
  const topic = useEditorTopic(topicId)
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: StepKind = isStepKind(tabParam) ? tabParam : 'lecture'

  if (topic.isPending) return <PageSpinner />
  if (topic.isError) return <ErrorState error={topic.error} onRetry={() => void topic.refetch()} />

  const data = topic.data
  const step = data.steps.find((item) => item.kind === tab)

  return (
    <div className="flex flex-col gap-6">
      <Link to="/teach" className="text-sm font-semibold text-brand-700 hover:underline">
        ← {t('teach.backToTopics')}
      </Link>
      <TopicDetailsForm key={data.id} topic={data} />
      <Card className="p-0 sm:p-0">
        <div className="px-4 pt-3 sm:px-5">
          <Tabs
            label={t('teach.stepsLabel')}
            value={tab}
            onChange={(next) => setSearchParams({ tab: next }, { replace: true })}
            items={STEP_KINDS.map((kind) => {
              const count = itemCount(data, kind)
              return {
                id: kind,
                label: `${STEP_ICONS[kind]} ${t(`steps.${kind}`)}`,
                badge: count > 0 ? <span className="rounded-full bg-slate-100 px-1.5 text-xs">{count}</span> : undefined,
              }
            })}
          />
        </div>
        <div className="px-4 pb-5 sm:px-5">
          <TabPanel id={tab}>
            {FILE_KINDS.has(tab) && step ? (
              <MaterialsTab topicId={data.id} step={step} />
            ) : (
              <EmptyState icon="🛠️" title={t('teach.comingSoon')} text={t('teach.comingSoonText')} />
            )}
          </TabPanel>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 7: Testlar va qo'lda tekshiruv**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS, xatosiz.

Qo'lda tekshiruv (backend + `npm run dev`, admin yoki biriktirilgan o'qituvchi sifatida):
- PDF yuklanganda u darhol "Tayyor · N bet" holatiga o'tadi.
- PPTX yuklanganda avval "Qayta ishlanmoqda" ko'rinadi. LibreOffice bo'lsa, bir necha soniyadan keyin sahifani yangilamasdan "Tayyor"ga o'tadi. LibreOffice bo'lmasa, "Xato" va tushunarli izoh chiqadi.

- [ ] **Step 8: CHANGELOG va commit**

CHANGELOG qatori: `- Mavzu muharriri: mavzu ma'lumotlari, 7 bosqich tablari, material yuklash (holatni kuzatish, qayta urinish, o'chirish).`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): topic editor with step tabs and material uploads"
```

---

### Task 14: Mavzu muharriri — glossariy va adabiyotlar

**Files:**
- Create: `frontend/src/features/teach/GlossaryTab.tsx`, `frontend/src/features/teach/LiteratureTab.tsx`
- Modify: `frontend/src/features/teach/TopicEditorPage.tsx`
- Test: `frontend/src/features/teach/GlossaryTab.test.tsx`, `frontend/src/features/teach/LiteratureTab.test.tsx`

Har ikkala tab bir xil ishlaydi:
- yozuvlar ro'yxati;
- har bir qatorda "Tahrirlash" (qator joyida formaga aylanadi) va "O'chirish" (tasdiqlash oynasi bilan);
- pastda yangi yozuv qo'shish formasi.

Muvaffaqiyatli o'zgarishdan keyin `useTopicItemMutations` muharrir keshini (`['teach','topics',id]`) yangilaydi.

- [ ] **Step 1: Muvaffaqiyatsiz testlarni yozish**

`frontend/src/features/teach/GlossaryTab.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { renderRoute, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { GlossaryTab } from './GlossaryTab'

const items = [{ id: 1, term: 'Kasb', definition: 'Mehnat faoliyati turi', order: 0 }]

test('yangi atama qo\'shiladi va forma tozalanadi', async () => {
  let body: unknown = null
  server.use(
    http.post('/api/teach/topics/10/glossary', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ id: 2, term: 'Malaka', definition: "Ko'nikmalar darajasi", order: 1 }, { status: 201 })
    }),
  )
  renderRoute(<GlossaryTab topicId={10} items={items} />, { user: teacherUser })
  const term = screen.getByLabelText(i18n.t('teach.term'))
  await userEvent.type(term, 'Malaka')
  await userEvent.type(screen.getByLabelText(i18n.t('teach.definition')), "Ko'nikmalar darajasi")
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.add') }))
  await waitFor(() => expect(body).toEqual({ term: 'Malaka', definition: "Ko'nikmalar darajasi" }))
  await waitFor(() => expect(term).toHaveValue(''))
})

test('bo\'sh atama validatsiyadan o\'tmaydi', async () => {
  renderRoute(<GlossaryTab topicId={10} items={[]} />, { user: teacherUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.add') }))
  expect(await screen.findAllByText(i18n.t('validation.required'))).toHaveLength(2)
})

test('atamani tahrirlash PATCH yuboradi', async () => {
  let body: unknown = null
  server.use(
    http.patch('/api/teach/topics/10/glossary/1', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...items[0], definition: 'Yangi izoh' })
    }),
  )
  renderRoute(<GlossaryTab topicId={10} items={items} />, { user: teacherUser })
  const row = screen.getByRole('listitem', { name: 'Kasb' })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('common.edit') }))
  const definition = within(row).getByLabelText(i18n.t('teach.definition'))
  await userEvent.clear(definition)
  await userEvent.type(definition, 'Yangi izoh')
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('common.save') }))
  await waitFor(() => expect(body).toEqual({ term: 'Kasb', definition: 'Yangi izoh' }))
})

test('atamani o\'chirish tasdiqlangach DELETE yuboriladi', async () => {
  const deleted = vi.fn()
  server.use(
    http.delete('/api/teach/topics/10/glossary/1', () => {
      deleted()
      return new HttpResponse(null, { status: 204 })
    }),
  )
  renderRoute(<GlossaryTab topicId={10} items={items} />, { user: teacherUser })
  const row = screen.getByRole('listitem', { name: 'Kasb' })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('common.delete') }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: i18n.t('common.delete') }))
  await waitFor(() => expect(deleted).toHaveBeenCalledOnce())
})
```

`frontend/src/features/teach/LiteratureTab.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { renderRoute, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { LiteratureTab } from './LiteratureTab'

test('adabiyot qo\'shishda bo\'sh maydonlar null ga, yil songa aylanadi', async () => {
  let body: unknown = null
  server.use(
    http.post('/api/teach/topics/10/literature', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ id: 1, title: 'Kasb pedagogikasi', author: '', year: 2020, url: null, order: 0 }, { status: 201 })
    }),
  )
  renderRoute(<LiteratureTab topicId={10} items={[]} />, { user: teacherUser })
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litTitle')), 'Kasb pedagogikasi')
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litYear')), '2020')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.add') }))
  await waitFor(() => expect(body).toEqual({ title: 'Kasb pedagogikasi', author: '', year: 2020, url: null }))
})

test('noto\'g\'ri havola va yil xato beradi', async () => {
  renderRoute(<LiteratureTab topicId={10} items={[]} />, { user: teacherUser })
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litTitle')), 'Kitob')
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litYear')), '20')
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litUrl')), 'kitob.uz')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.add') }))
  expect(await screen.findByText(i18n.t('validation.year'))).toBeInTheDocument()
  expect(screen.getByText(i18n.t('validation.url'))).toBeInTheDocument()
})

test('mavjud adabiyot muallif, yil va havola bilan ko\'rsatiladi', () => {
  renderRoute(
    <LiteratureTab
      topicId={10}
      items={[{ id: 1, title: 'Kasb pedagogikasi', author: 'A. Karimov', year: 2020, url: 'https://kitob.uz/1', order: 0 }]}
    />,
    { user: teacherUser },
  )
  expect(screen.getByText('A. Karimov, 2020', { exact: false })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'https://kitob.uz/1' })).toHaveAttribute('href', 'https://kitob.uz/1')
})
```

- [ ] **Step 2: Testlar yiqilishini tekshirish**

Run: `npm test -- src/features/teach/GlossaryTab src/features/teach/LiteratureTab`
Expected: FAIL — modullar topilmaydi.

- [ ] **Step 3: `frontend/src/features/teach/GlossaryTab.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useGlossaryMutations } from '@/api/teach'
import type { GlossaryTerm } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { glossarySchema, type GlossaryValues } from './schemas'

export function GlossaryTab({ topicId, items }: { topicId: number; items: GlossaryTerm[] }) {
  const { t } = useTranslation()
  const { add, update, remove } = useGlossaryMutations(topicId)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<GlossaryTerm | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-slate-500">{t('teach.noGlossary')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} aria-label={item.term} className="rounded-xl border-2 border-slate-100 bg-white p-3">
              {editingId === item.id ? (
                <GlossaryForm
                  idPrefix={`glossary-${item.id}`}
                  initial={item}
                  submitLabel={t('common.save')}
                  pending={update.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(values) =>
                    update.mutate({ id: item.id, data: values }, { onSuccess: () => setEditingId(null) })
                  }
                />
              ) : (
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold">{item.term}</p>
                    <p className="text-slate-600">{item.definition}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(item.id)}>
                    {t('common.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(item)}>
                    {t('common.delete')}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <section className="rounded-2xl bg-slate-50 p-4">
        <h3 className="mb-3 font-semibold">{t('teach.addTerm')}</h3>
        <GlossaryForm
          idPrefix="glossary-new"
          submitLabel={t('common.add')}
          pending={add.isPending}
          onSubmit={(values, reset) => add.mutate(values, { onSuccess: reset })}
        />
      </section>
      <ConfirmDialog
        open={toDelete !== null}
        title={t('teach.deleteTermTitle')}
        text={t('teach.deleteItemText', { title: toDelete?.term ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }}
      />
    </div>
  )
}

interface GlossaryFormProps {
  idPrefix: string
  initial?: GlossaryTerm
  submitLabel: string
  pending: boolean
  onSubmit: (values: GlossaryValues, reset: () => void) => void
  onCancel?: () => void
}

function GlossaryForm({ idPrefix, initial, submitLabel, pending, onSubmit, onCancel }: GlossaryFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GlossaryValues>({
    resolver: zodResolver(glossarySchema),
    defaultValues: { term: initial?.term ?? '', definition: initial?.definition ?? '' },
  })

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={handleSubmit((values) => onSubmit(values, () => reset({ term: '', definition: '' })))}
    >
      <Field id={`${idPrefix}-term`} label={t('teach.term')} error={errors.term?.message}>
        <Input id={`${idPrefix}-term`} aria-invalid={Boolean(errors.term)} {...register('term')} />
      </Field>
      <Field id={`${idPrefix}-definition`} label={t('teach.definition')} error={errors.definition?.message}>
        <Textarea id={`${idPrefix}-definition`} rows={3} aria-invalid={Boolean(errors.definition)} {...register('definition')} />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}
```

- [ ] **Step 4: `frontend/src/features/teach/LiteratureTab.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLiteratureMutations } from '@/api/teach'
import type { LiteratureIn, LiteratureItem } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { literatureSchema, type LiteratureValues } from './schemas'

function toPayload(values: LiteratureValues): LiteratureIn {
  return {
    title: values.title,
    author: values.author,
    year: values.year === '' ? null : Number(values.year),
    url: values.url === '' ? null : values.url,
  }
}

const EMPTY: LiteratureValues = { title: '', author: '', year: '', url: '' }

export function LiteratureTab({ topicId, items }: { topicId: number; items: LiteratureItem[] }) {
  const { t } = useTranslation()
  const { add, update, remove } = useLiteratureMutations(topicId)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toDelete, setToDelete] = useState<LiteratureItem | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-slate-500">{t('teach.noLiterature')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} aria-label={item.title} className="rounded-xl border-2 border-slate-100 bg-white p-3">
              {editingId === item.id ? (
                <LiteratureForm
                  idPrefix={`literature-${item.id}`}
                  initial={{
                    title: item.title,
                    author: item.author,
                    year: item.year === null ? '' : String(item.year),
                    url: item.url ?? '',
                  }}
                  submitLabel={t('common.save')}
                  pending={update.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(values) =>
                    update.mutate({ id: item.id, data: toPayload(values) }, { onSuccess: () => setEditingId(null) })
                  }
                />
              ) : (
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold">{item.title}</p>
                    {(item.author || item.year) && (
                      <p className="text-slate-600">{[item.author, item.year].filter(Boolean).join(', ')}</p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm break-all text-brand-700 hover:underline"
                      >
                        {item.url}
                      </a>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(item.id)}>
                    {t('common.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(item)}>
                    {t('common.delete')}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <section className="rounded-2xl bg-slate-50 p-4">
        <h3 className="mb-3 font-semibold">{t('teach.addLiterature')}</h3>
        <LiteratureForm
          idPrefix="literature-new"
          initial={EMPTY}
          submitLabel={t('common.add')}
          pending={add.isPending}
          onSubmit={(values, reset) => add.mutate(toPayload(values), { onSuccess: reset })}
        />
      </section>
      <ConfirmDialog
        open={toDelete !== null}
        title={t('teach.deleteLiteratureTitle')}
        text={t('teach.deleteItemText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }}
      />
    </div>
  )
}

interface LiteratureFormProps {
  idPrefix: string
  initial: LiteratureValues
  submitLabel: string
  pending: boolean
  onSubmit: (values: LiteratureValues, reset: () => void) => void
  onCancel?: () => void
}

function LiteratureForm({ idPrefix, initial, submitLabel, pending, onSubmit, onCancel }: LiteratureFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LiteratureValues>({ resolver: zodResolver(literatureSchema), defaultValues: initial })

  return (
    <form
      noValidate
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={handleSubmit((values) => onSubmit(values, () => reset(EMPTY)))}
    >
      <div className="sm:col-span-2">
        <Field id={`${idPrefix}-title`} label={t('teach.litTitle')} error={errors.title?.message}>
          <Input id={`${idPrefix}-title`} aria-invalid={Boolean(errors.title)} {...register('title')} />
        </Field>
      </div>
      <Field id={`${idPrefix}-author`} label={t('teach.litAuthor')} error={errors.author?.message}>
        <Input id={`${idPrefix}-author`} aria-invalid={Boolean(errors.author)} {...register('author')} />
      </Field>
      <Field id={`${idPrefix}-year`} label={t('teach.litYear')} error={errors.year?.message}>
        <Input id={`${idPrefix}-year`} inputMode="numeric" aria-invalid={Boolean(errors.year)} {...register('year')} />
      </Field>
      <div className="sm:col-span-2">
        <Field id={`${idPrefix}-url`} label={t('teach.litUrl')} error={errors.url?.message}>
          <Input id={`${idPrefix}-url`} type="url" aria-invalid={Boolean(errors.url)} {...register('url')} />
        </Field>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" loading={pending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}
```

- [ ] **Step 5: Tablarni muharrirga ulash**

`frontend/src/features/teach/TopicEditorPage.tsx`ga ikkita import qo'shiladi:

```tsx
import { GlossaryTab } from './GlossaryTab'
import { LiteratureTab } from './LiteratureTab'
```

`<TabPanel>` ichidagi blok quyidagiga almashtiriladi:

```tsx
          <TabPanel id={tab}>
            {FILE_KINDS.has(tab) && step ? (
              <MaterialsTab topicId={data.id} step={step} />
            ) : tab === 'glossary' ? (
              <GlossaryTab topicId={data.id} items={data.glossary} />
            ) : tab === 'literature' ? (
              <LiteratureTab topicId={data.id} items={data.literature} />
            ) : (
              <EmptyState icon="🛠️" title={t('teach.comingSoon')} text={t('teach.comingSoonText')} />
            )}
          </TabPanel>
```

- [ ] **Step 6: Testlar o'tishini tekshirish**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS, xatosiz.

- [ ] **Step 7: CHANGELOG va commit**

CHANGELOG qatori: `- Mavzu muharriri: glossariy va adabiyotlar (qo'shish, joyida tahrirlash, o'chirish).`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): glossary and literature editors in topic editor"
```

---

### Task 15: Admin — API hook'lari va foydalanuvchilar sahifasi

**Files:**
- Create: `frontend/src/api/admin.ts`
- Modify (stub → to'liq): `frontend/src/features/admin/AdminUsersPage.tsx`
- Test: `frontend/src/features/admin/AdminUsersPage.test.tsx`

**Imkoniyatlar (spec):**
- Tasdiqlash navbati sukut bo'yicha `pending` filtri bilan ochiladi.
- Admin rol bera oladi, bloklaydi, blokdan chiqaradi va vaqtinchalik parol beradi.
- Vaqtinchalik parol faqat bir marta, modal oynada ko'rsatiladi.
- Admin o'z akkauntini bu sahifadan o'zgartira olmaydi: backend `CANNOT_MODIFY_SELF` qaytaradi, interfeysda ham boshqaruv elementlari o'chirilgan bo'ladi.

- [ ] **Step 1: `frontend/src/api/admin.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type {
  AdminUserUpdateIn,
  SubjectAdmin,
  SubjectCreate,
  SubjectUpdate,
  TempPasswordOut,
  User,
  UserStatus,
} from './types'

export type UserFilter = UserStatus | 'all'

export const adminKeys = {
  usersRoot: ['admin', 'users'] as const,
  users: (status: UserFilter, q: string) => ['admin', 'users', status, q] as const,
  teachers: ['admin', 'users', 'teachers'] as const,
  subjects: ['admin', 'subjects'] as const,
}

export function useAdminUsers(status: UserFilter, q: string) {
  const params = new URLSearchParams({ limit: '200' })
  if (status !== 'all') params.set('status', status)
  if (q) params.set('q', q)
  return useQuery({
    queryKey: adminKeys.users(status, q),
    queryFn: ({ signal }) => apiFetch<User[]>(`/api/admin/users?${params.toString()}`, { signal }),
  })
}

/** Fanlarga biriktirish uchun faol o'qituvchilar. */
export function useTeachers() {
  return useQuery({
    queryKey: adminKeys.teachers,
    queryFn: ({ signal }) => apiFetch<User[]>('/api/admin/users?status=active&limit=200', { signal }),
    select: (users) => users.filter((user) => user.role === 'teacher'),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminUserUpdateIn }) =>
      apiFetch<User>(`/api/admin/users/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.usersRoot }),
  })
}

export function useTempPassword() {
  return useMutation({
    mutationFn: (id: number) => apiFetch<TempPasswordOut>(`/api/admin/users/${id}/temp-password`, { method: 'POST' }),
  })
}

export function useAdminSubjects() {
  return useQuery({
    queryKey: adminKeys.subjects,
    queryFn: ({ signal }) => apiFetch<SubjectAdmin[]>('/api/admin/subjects', { signal }),
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubjectCreate) => apiFetch<SubjectAdmin>('/api/admin/subjects', { method: 'POST', json: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.subjects }),
    meta: { silent: true },
  })
}

/** `silent`: xato forma ichida ko'rsatiladigan joylarda (tahrirlash modali) umumiy toast chiqmaydi. */
export function useUpdateSubject({ silent = false }: { silent?: boolean } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubjectUpdate }) =>
      apiFetch<SubjectAdmin>(`/api/admin/subjects/${id}`, { method: 'PATCH', json: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.subjects }),
    meta: { silent },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/admin/subjects/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.subjects }),
  })
}

export function useSetTeachers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, teacherIds }: { id: number; teacherIds: number[] }) =>
      apiFetch<SubjectAdmin>(`/api/admin/subjects/${id}/teachers`, { method: 'PUT', json: { teacher_ids: teacherIds } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.subjects }),
  })
}
```

- [ ] **Step 2: Muvaffaqiyatsiz testni yozish**

`frontend/src/features/admin/AdminUsersPage.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { adminUser, makeUser, renderRoute } from '@/test/render'
import { server } from '@/test/server'
import { AdminUsersPage } from './AdminUsersPage'

const pending = makeUser({ id: 7, full_name: 'Yangi Talaba', email: 'yangi@example.uz', status: 'pending' })

function mockList(onQuery?: (params: URLSearchParams) => void) {
  server.use(
    http.get('/api/admin/users', ({ request }) => {
      const params = new URL(request.url).searchParams
      onQuery?.(params)
      return HttpResponse.json(params.get('status') === 'pending' ? [pending] : [adminUser, pending])
    }),
  )
}

test('sukut bo\'yicha tasdiq kutayotganlar so\'raladi', async () => {
  const queries: string[] = []
  mockList((params) => queries.push(params.get('status') ?? 'all'))
  renderRoute(<AdminUsersPage />, { user: adminUser })
  expect(await screen.findByRole('listitem', { name: 'Yangi Talaba' })).toBeInTheDocument()
  expect(queries[0]).toBe('pending')
})

test('tasdiqlash tugmasi status=active yuboradi', async () => {
  let body: unknown = null
  mockList()
  server.use(
    http.patch('/api/admin/users/7', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...pending, status: 'active' })
    }),
  )
  renderRoute(<AdminUsersPage />, { user: adminUser })
  const row = await screen.findByRole('listitem', { name: 'Yangi Talaba' })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('admin.users.approve') }))
  await waitFor(() => expect(body).toEqual({ status: 'active' }))
})

test('rol o\'zgartirilganda PATCH yuboriladi', async () => {
  let body: unknown = null
  mockList()
  server.use(
    http.patch('/api/admin/users/7', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...pending, role: 'teacher' })
    }),
  )
  renderRoute(<AdminUsersPage />, { user: adminUser })
  const row = await screen.findByRole('listitem', { name: 'Yangi Talaba' })
  await userEvent.selectOptions(within(row).getByRole('combobox'), 'teacher')
  await waitFor(() => expect(body).toEqual({ role: 'teacher' }))
})

test('vaqtinchalik parol modalda ko\'rsatiladi', async () => {
  mockList()
  server.use(http.post('/api/admin/users/7/temp-password', () => HttpResponse.json({ temp_password: 'Abc-123-xyz' })))
  renderRoute(<AdminUsersPage />, { user: adminUser })
  const row = await screen.findByRole('listitem', { name: 'Yangi Talaba' })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('admin.users.tempPassword') }))
  const dialog = await screen.findByRole('dialog', { name: i18n.t('admin.users.tempTitle') })
  expect(within(dialog).getByText('Abc-123-xyz')).toBeInTheDocument()
})

test('o\'z akkauntida boshqaruv elementlari o\'chirilgan', async () => {
  mockList()
  renderRoute(<AdminUsersPage />, { user: adminUser })
  await userEvent.click(await screen.findByRole('tab', { name: i18n.t('admin.users.filters.all') }))
  const self = await screen.findByRole('listitem', { name: adminUser.full_name })
  expect(within(self).getByRole('combobox')).toBeDisabled()
  expect(within(self).getByText(i18n.t('admin.users.you'))).toBeInTheDocument()
})
```

- [ ] **Step 3: Test yiqilishini tekshirish**

Run: `npm test -- src/features/admin/AdminUsersPage`
Expected: FAIL.

- [ ] **Step 4: `frontend/src/features/admin/AdminUsersPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminUsers, useTempPassword, useUpdateUser, type UserFilter } from '@/api/admin'
import { useCurrentUser } from '@/api/auth'
import type { Role, User, UserStatus } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'

const FILTERS: UserFilter[] = ['pending', 'active', 'blocked', 'all']
const ROLES: Role[] = ['student', 'teacher', 'admin']
const STATUS_TONES: Record<UserStatus, 'amber' | 'green' | 'red'> = { pending: 'amber', active: 'green', blocked: 'red' }

export function AdminUsersPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<UserFilter>('pending')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [tempResult, setTempResult] = useState<{ name: string; password: string } | null>(null)

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setQuery(search.trim())
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t('admin.users.title')}</h1>
      <Tabs
        label={t('admin.users.filter')}
        value={status}
        onChange={setStatus}
        items={FILTERS.map((filter) => ({ id: filter, label: t(`admin.users.filters.${filter}`) }))}
      />
      <form role="search" onSubmit={onSearch} className="flex gap-2">
        <label htmlFor="user-search" className="sr-only">
          {t('admin.users.searchLabel')}
        </label>
        <Input
          id="user-search"
          type="search"
          value={search}
          placeholder={t('admin.users.searchPlaceholder')}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" variant="secondary" className="shrink-0">
          {t('common.search')}
        </Button>
      </form>
      <UserList status={status} query={query} onTempPassword={setTempResult} />
      <Modal
        open={tempResult !== null}
        title={t('admin.users.tempTitle')}
        onClose={() => setTempResult(null)}
        footer={<Button onClick={() => setTempResult(null)}>{t('common.done')}</Button>}
      >
        <p className="text-slate-700">{t('admin.users.tempText', { name: tempResult?.name ?? '' })}</p>
        <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 font-mono text-lg tracking-wider select-all">
          {tempResult?.password}
        </p>
      </Modal>
    </div>
  )
}

interface UserListProps {
  status: UserFilter
  query: string
  onTempPassword: (result: { name: string; password: string }) => void
}

function UserList({ status, query, onTempPassword }: UserListProps) {
  const { t } = useTranslation()
  const me = useCurrentUser()
  const users = useAdminUsers(status, query)
  const update = useUpdateUser()
  const temp = useTempPassword()

  if (users.isPending) return <PageSpinner />
  if (users.isError) return <ErrorState error={users.error} onRetry={() => void users.refetch()} />
  if (users.data.length === 0) return <EmptyState icon="👥" title={t('admin.users.empty')} />

  return (
    <ul className="flex flex-col gap-3">
      {users.data.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          isSelf={user.id === me?.id}
          busy={update.isPending && update.variables?.id === user.id}
          onUpdate={(data) => update.mutate({ id: user.id, data })}
          onTempPassword={() =>
            temp.mutate(user.id, {
              onSuccess: (result) => onTempPassword({ name: user.full_name, password: result.temp_password }),
            })
          }
        />
      ))}
    </ul>
  )
}

interface UserRowProps {
  user: User
  isSelf: boolean
  busy: boolean
  onUpdate: (data: { role?: Role; status?: UserStatus }) => void
  onTempPassword: () => void
}

function UserRow({ user, isSelf, busy, onUpdate, onTempPassword }: UserRowProps) {
  const { t } = useTranslation()
  return (
    <li
      aria-label={user.full_name}
      className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-4"
    >
      <div className="min-w-48 flex-1">
        <p className="font-semibold">
          {user.full_name}
          {isSelf && <span className="ml-2 text-sm font-normal text-slate-500">{t('admin.users.you')}</span>}
        </p>
        <p className="text-sm text-slate-600">
          {user.email}
          {user.phone ? ` · ${user.phone}` : ''}
        </p>
      </div>
      <Badge tone={STATUS_TONES[user.status]}>{t(`admin.users.statuses.${user.status}`)}</Badge>
      <Select
        aria-label={t('admin.users.roleFor', { name: user.full_name })}
        className="w-auto"
        value={user.role}
        disabled={isSelf || busy}
        onChange={(event) => onUpdate({ role: event.target.value as Role })}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {t(`roles.${role}`)}
          </option>
        ))}
      </Select>
      {!isSelf && (
        <div className="flex flex-wrap gap-2">
          {user.status === 'pending' && (
            <Button size="sm" loading={busy} onClick={() => onUpdate({ status: 'active' })}>
              {t('admin.users.approve')}
            </Button>
          )}
          {user.status === 'active' && (
            <Button size="sm" variant="secondary" loading={busy} onClick={() => onUpdate({ status: 'blocked' })}>
              {t('admin.users.block')}
            </Button>
          )}
          {user.status === 'blocked' && (
            <Button size="sm" variant="secondary" loading={busy} onClick={() => onUpdate({ status: 'active' })}>
              {t('admin.users.unblock')}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onTempPassword}>
            {t('admin.users.tempPassword')}
          </Button>
        </div>
      )}
    </li>
  )
}
```

- [ ] **Step 5: Testlar o'tishini tekshirish**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS, xatosiz.

- [ ] **Step 6: CHANGELOG va commit**

CHANGELOG qatori: `- Admin: foydalanuvchilar (tasdiqlash navbati, rol, bloklash, vaqtinchalik parol).`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): admin users page with approval queue, roles and temp passwords"
```

---

### Task 16: Admin — fanlar (yaratish, tahrirlash, nashr, o'qituvchi biriktirish, o'chirish)

**Files:**
- Create: `frontend/src/features/admin/schemas.ts`, `frontend/src/features/admin/SubjectFormModal.tsx`, `frontend/src/features/admin/TeachersModal.tsx`
- Modify (stub → to'liq): `frontend/src/features/admin/AdminSubjectsPage.tsx`
- Test: `frontend/src/features/admin/AdminSubjectsPage.test.tsx`

- [ ] **Step 1: `frontend/src/features/admin/schemas.ts`**

```ts
import { z } from 'zod'

export const subjectSchema = z.object({
  title: z.string().trim().min(2, { error: 'validation.titleMin' }).max(200, { error: 'validation.tooLong' }),
  slug: z
    .string()
    .trim()
    .max(220, { error: 'validation.tooLong' })
    .refine((value) => value === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), { error: 'validation.slug' }),
  description: z.string().max(5000, { error: 'validation.tooLong' }),
  order: z.number({ error: 'validation.order' }).int({ error: 'validation.order' }).min(0, { error: 'validation.order' }).max(2147483647, { error: 'validation.order' }),
  is_published: z.boolean(),
})

export type SubjectValues = z.infer<typeof subjectSchema>
```

- [ ] **Step 2: Muvaffaqiyatsiz testni yozish**

`frontend/src/features/admin/AdminSubjectsPage.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import type { SubjectAdmin } from '@/api/types'
import { i18n } from '@/i18n'
import { adminUser, makeUser, renderRoute, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { AdminSubjectsPage } from './AdminSubjectsPage'

const subject: SubjectAdmin = {
  id: 1,
  title: "Kasb ta'limi metodikasi",
  slug: 'kasb-talimi-metodikasi',
  description: '',
  cover: null,
  order: 0,
  is_published: false,
  teacher_ids: [],
}

function mockBase(subjects: SubjectAdmin[] = [subject]) {
  server.use(
    http.get('/api/admin/subjects', () => HttpResponse.json(subjects)),
    http.get('/api/admin/users', () =>
      HttpResponse.json([adminUser, teacherUser, makeUser({ id: 9, full_name: 'Talaba', role: 'student' })]),
    ),
  )
}

test('yangi fan yaratish POST yuboradi (bo\'sh slug null bo\'ladi)', async () => {
  let body: unknown = null
  mockBase([])
  server.use(
    http.post('/api/admin/subjects', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...subject, id: 2 }, { status: 201 })
    }),
  )
  renderRoute(<AdminSubjectsPage />, { user: adminUser })
  await userEvent.click(await screen.findByRole('button', { name: i18n.t('admin.subjects.new') }))
  const dialog = screen.getByRole('dialog')
  await userEvent.type(within(dialog).getByLabelText(i18n.t('admin.subjects.titleLabel')), 'Yangi fan')
  await userEvent.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }))
  await waitFor(() =>
    expect(body).toEqual({ title: 'Yangi fan', slug: null, description: '', order: 0, is_published: false }),
  )
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

test('band slug xatosi modal ichida ko\'rsatiladi', async () => {
  mockBase([])
  server.use(
    http.post('/api/admin/subjects', () =>
      HttpResponse.json({ code: 'SLUG_TAKEN', message: 'x', details: {} }, { status: 409 }),
    ),
  )
  renderRoute(<AdminSubjectsPage />, { user: adminUser })
  await userEvent.click(await screen.findByRole('button', { name: i18n.t('admin.subjects.new') }))
  const dialog = screen.getByRole('dialog')
  await userEvent.type(within(dialog).getByLabelText(i18n.t('admin.subjects.titleLabel')), 'Yangi fan')
  await userEvent.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent(i18n.t('errors.SLUG_TAKEN'))
})

test('nashr tugmasi is_published ni almashtiradi', async () => {
  let body: unknown = null
  mockBase()
  server.use(
    http.patch('/api/admin/subjects/1', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...subject, is_published: true })
    }),
  )
  renderRoute(<AdminSubjectsPage />, { user: adminUser })
  const row = await screen.findByRole('listitem', { name: subject.title })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('admin.subjects.publish') }))
  await waitFor(() => expect(body).toEqual({ is_published: true }))
})

test('o\'qituvchi biriktirish PUT yuboradi', async () => {
  let body: unknown = null
  mockBase()
  server.use(
    http.put('/api/admin/subjects/1/teachers', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...subject, teacher_ids: [teacherUser.id] })
    }),
  )
  renderRoute(<AdminSubjectsPage />, { user: adminUser })
  const row = await screen.findByRole('listitem', { name: subject.title })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('admin.subjects.teachers') }))
  const dialog = screen.getByRole('dialog')
  await userEvent.click(await within(dialog).findByLabelText(teacherUser.full_name))
  expect(within(dialog).queryByLabelText('Talaba')).not.toBeInTheDocument()
  await userEvent.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }))
  await waitFor(() => expect(body).toEqual({ teacher_ids: [teacherUser.id] }))
})

test('fanni o\'chirish tasdiqlangach DELETE yuboriladi', async () => {
  const deleted = vi.fn()
  mockBase()
  server.use(
    http.delete('/api/admin/subjects/1', () => {
      deleted()
      return new HttpResponse(null, { status: 204 })
    }),
  )
  renderRoute(<AdminSubjectsPage />, { user: adminUser })
  const row = await screen.findByRole('listitem', { name: subject.title })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('common.delete') }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: i18n.t('common.delete') }))
  await waitFor(() => expect(deleted).toHaveBeenCalledOnce())
})
```

- [ ] **Step 3: Test yiqilishini tekshirish**

Run: `npm test -- src/features/admin/AdminSubjectsPage`
Expected: FAIL.

- [ ] **Step 4: `frontend/src/features/admin/SubjectFormModal.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useCreateSubject, useUpdateSubject } from '@/api/admin'
import type { SubjectAdmin } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Modal } from '@/components/ui/Modal'
import { pushToast } from '@/components/ui/toast-store'
import { subjectSchema, type SubjectValues } from './schemas'

interface SubjectFormModalProps {
  open: boolean
  /** null — yangi fan yaratiladi. */
  subject: SubjectAdmin | null
  onClose: () => void
}

export function SubjectFormModal({ open, subject, onClose }: SubjectFormModalProps) {
  const { t } = useTranslation()
  return (
    <Modal open={open} title={subject ? t('admin.subjects.editTitle') : t('admin.subjects.newTitle')} onClose={onClose}>
      <SubjectForm key={subject?.id ?? 'new'} subject={subject} onDone={onClose} />
    </Modal>
  )
}

function SubjectForm({ subject, onDone }: { subject: SubjectAdmin | null; onDone: () => void }) {
  const { t } = useTranslation()
  const create = useCreateSubject()
  const update = useUpdateSubject({ silent: true })
  const mutation = subject ? update : create
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      title: subject?.title ?? '',
      slug: subject?.slug ?? '',
      description: subject?.description ?? '',
      order: subject?.order ?? 0,
      is_published: subject?.is_published ?? false,
    },
  })

  function onSubmit(values: SubjectValues) {
    const onSuccess = () => {
      pushToast('success', t('admin.subjects.saved'))
      onDone()
    }
    if (subject) {
      // Bo'sh slug yuborilmaydi: backend `None`ni "o'zgartirmaslik" deb tushunadi.
      update.mutate({ id: subject.id, data: { ...values, slug: values.slug || null } }, { onSuccess })
    } else {
      create.mutate({ ...values, slug: values.slug || null }, { onSuccess })
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {mutation.error && <FormError error={mutation.error} />}
      <Field id="subject-title" label={t('admin.subjects.titleLabel')} error={errors.title?.message}>
        <Input id="subject-title" aria-invalid={Boolean(errors.title)} {...register('title')} />
      </Field>
      <Field
        id="subject-slug"
        label={t('admin.subjects.slugLabel')}
        hint={t('admin.subjects.slugHint')}
        error={errors.slug?.message}
      >
        <Input id="subject-slug" aria-invalid={Boolean(errors.slug)} {...register('slug')} />
      </Field>
      <Field id="subject-description" label={t('admin.subjects.descriptionLabel')} error={errors.description?.message}>
        <Textarea id="subject-description" rows={3} {...register('description')} />
      </Field>
      <Field id="subject-order" label={t('admin.subjects.orderLabel')} error={errors.order?.message}>
        <Input
          id="subject-order"
          type="number"
          min={0}
          aria-invalid={Boolean(errors.order)}
          {...register('order', { valueAsNumber: true })}
        />
      </Field>
      <Checkbox label={t('admin.subjects.publishedLabel')} {...register('is_published')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 5: `frontend/src/features/admin/TeachersModal.tsx`**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSetTeachers } from '@/api/admin'
import type { SubjectAdmin, User } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { pushToast } from '@/components/ui/toast-store'

interface TeachersModalProps {
  subject: SubjectAdmin | null
  teachers: User[]
  onClose: () => void
}

export function TeachersModal({ subject, teachers, onClose }: TeachersModalProps) {
  const { t } = useTranslation()
  return (
    <Modal open={subject !== null} title={t('admin.subjects.teachersTitle', { title: subject?.title ?? '' })} onClose={onClose}>
      {subject && <TeachersForm key={subject.id} subject={subject} teachers={teachers} onDone={onClose} />}
    </Modal>
  )
}

function TeachersForm({ subject, teachers, onDone }: { subject: SubjectAdmin; teachers: User[]; onDone: () => void }) {
  const { t } = useTranslation()
  const setTeachers = useSetTeachers()
  const [selected, setSelected] = useState<Set<number>>(() => new Set(subject.teacher_ids))

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function save() {
    setTeachers.mutate(
      { id: subject.id, teacherIds: [...selected] },
      {
        onSuccess: () => {
          pushToast('success', t('admin.subjects.saved'))
          onDone()
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {teachers.length === 0 ? (
        <p className="text-slate-600">{t('admin.subjects.noTeachers')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {teachers.map((teacher) => (
            <li key={teacher.id}>
              <Checkbox
                label={teacher.full_name}
                checked={selected.has(teacher.id)}
                onChange={() => toggle(teacher.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button loading={setTeachers.isPending} onClick={save}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: `frontend/src/features/admin/AdminSubjectsPage.tsx`**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminSubjects, useDeleteSubject, useTeachers, useUpdateSubject } from '@/api/admin'
import type { SubjectAdmin, User } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { SubjectFormModal } from './SubjectFormModal'
import { TeachersModal } from './TeachersModal'

export function AdminSubjectsPage() {
  const { t } = useTranslation()
  const subjects = useAdminSubjects()
  const teachers = useTeachers()
  const update = useUpdateSubject()
  const remove = useDeleteSubject()
  const [editing, setEditing] = useState<SubjectAdmin | 'new' | null>(null)
  const [teachersFor, setTeachersFor] = useState<SubjectAdmin | null>(null)
  const [toDelete, setToDelete] = useState<SubjectAdmin | null>(null)

  const teacherNames = new Map((teachers.data ?? []).map((teacher: User) => [teacher.id, teacher.full_name]))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin.subjects.title')}</h1>
        <Button onClick={() => setEditing('new')}>{t('admin.subjects.new')}</Button>
      </div>
      {subjects.isPending ? (
        <PageSpinner />
      ) : subjects.isError ? (
        <ErrorState error={subjects.error} onRetry={() => void subjects.refetch()} />
      ) : subjects.data.length === 0 ? (
        <EmptyState icon="📚" title={t('admin.subjects.empty')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {subjects.data.map((subject) => (
            <li
              key={subject.id}
              aria-label={subject.title}
              className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-4"
            >
              <div className="min-w-48 flex-1">
                <p className="font-semibold">{subject.title}</p>
                <p className="font-mono text-xs text-slate-500">{subject.slug}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {subject.teacher_ids.length === 0
                    ? t('admin.subjects.noAssigned')
                    : subject.teacher_ids.map((id) => teacherNames.get(id) ?? `#${id}`).join(', ')}
                </p>
              </div>
              <Badge tone={subject.is_published ? 'green' : 'amber'}>
                {subject.is_published ? t('common.published') : t('common.draft')}
              </Badge>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  loading={update.isPending && update.variables?.id === subject.id}
                  onClick={() => update.mutate({ id: subject.id, data: { is_published: !subject.is_published } })}
                >
                  {subject.is_published ? t('admin.subjects.unpublish') : t('admin.subjects.publish')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTeachersFor(subject)}>
                  {t('admin.subjects.teachers')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(subject)}>
                  {t('common.edit')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setToDelete(subject)}>
                  {t('common.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <SubjectFormModal
        open={editing !== null}
        subject={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
      <TeachersModal subject={teachersFor} teachers={teachers.data ?? []} onClose={() => setTeachersFor(null)} />
      <ConfirmDialog
        open={toDelete !== null}
        title={t('admin.subjects.deleteTitle')}
        text={t('admin.subjects.deleteText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }}
      />
    </div>
  )
}
```

- [ ] **Step 7: Testlar va qo'lda tekshiruv**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS, xatosiz.

Qo'lda tekshiruv (admin sifatida):
1. Yangi fan yaratiladi va nashr qilinadi.
2. O'qituvchi biriktiriladi.
3. Shu o'qituvchi bilan kirilganda `/teach` sahifasida fan ko'rinadi.

- [ ] **Step 8: CHANGELOG va commit**

CHANGELOG qatori: `- Admin: fanlar (yaratish, tahrirlash, nashr, o'qituvchi biriktirish, o'chirish).`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "feat(frontend): admin subjects page with publishing and teacher assignment"
```

---

### Task 17: Playwright E2E — to'liq o'quv oqimi

**Files:**
- Create: `frontend/playwright.config.ts`, `frontend/e2e/start-backend.mjs`, `frontend/e2e/i18n.ts`, `frontend/e2e/learning-flow.spec.ts`

**E2E muhiti:**
- Backend alohida portda (`8001`) ishga tushadi. Uning bazasi toza SQLite (`frontend/e2e/.data/e2e.db`, bu papka git'ga kirmaydi).
- `start-backend.mjs` ketma-ket bajaradi: migratsiyalar, admin yaratish, `pymupdf` bilan bitta sahifali namuna PDF yaratish va uvicorn'ni ishga tushirish.
- Frontend production build'dan `vite preview` orqali `4174` portda beriladi. Uning `/api` proksisi `API_PROXY_TARGET` orqali `8001`ga yo'naltiriladi.
- Matnlar `uz.json`dan o'qiladi, shuning uchun lug'atdagi matn o'zgarsa E2E test buzilmaydi.

Spec'dagi stsenariy: ro'yxatdan o'tish → admin tasdig'i → fanni ochish → bosqichni tugatish → progress yangilanishi. Kontentni admin tayyorlaydi (admin `StaffUser` bo'lgani uchun muharrirga ham kira oladi).

- [ ] **Step 1: `frontend/e2e/start-backend.mjs`**

```js
// E2E uchun toza backend: yangi SQLite baza, migratsiyalar, admin va namuna PDF, so'ng uvicorn.
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(here, '.data')
const backendDir = resolve(here, '../../backend')
const port = process.env.E2E_API_PORT ?? '8001'
const samplePdf = resolve(dataDir, 'sample.pdf')

rmSync(dataDir, { recursive: true, force: true })
mkdirSync(resolve(dataDir, 'media'), { recursive: true })

// Admin ma'lumotlari e2e/learning-flow.spec.ts dagi ADMIN bilan bir xil bo'lishi kerak.
const env = {
  ...process.env,
  ENV: 'dev',
  DATABASE_URL: `sqlite+aiosqlite:///${resolve(dataDir, 'e2e.db').replaceAll('\\', '/')}`,
  MEDIA_ROOT: resolve(dataDir, 'media'),
  JWT_SECRET: 'e2e-only-secret-not-for-production-000000',
  COOKIE_SECURE: 'false',
  ADMIN_EMAIL: 'admin@e2e.uz',
  ADMIN_PASSWORD: 'e2e-admin-parol-123',
}

function uv(args) {
  const result = spawnSync('uv', ['run', ...args], { cwd: backendDir, env, stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`E2E backend tayyorlanmadi: uv run ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

uv(['alembic', 'upgrade', 'head'])
uv(['python', '-m', 'app.cli', 'create-admin', '--name', 'E2E Admin'])
uv([
  'python',
  '-c',
  `import pymupdf; d = pymupdf.open(); p = d.new_page(); p.insert_text((72, 72), "Kasb tanlash asoslari"); d.save(${JSON.stringify(samplePdf)})`,
])

const server = spawn('uv', ['run', 'uvicorn', 'app.main:create_app', '--factory', '--port', port], {
  cwd: backendDir,
  env,
  stdio: 'inherit',
})
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.kill(signal)
    process.exit(0)
  })
}
server.on('exit', (code) => process.exit(code ?? 0))
```

- [ ] **Step 2: `frontend/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

const API_PORT = 8001
const WEB_PORT = 4174

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/start-backend.mjs',
      url: `http://localhost:${API_PORT}/api/health`,
      env: { E2E_API_PORT: String(API_PORT) },
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: `npm run build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
})
```

- [ ] **Step 3: `frontend/e2e/i18n.ts`** (testlar interfeys matnlarini lug'atdan oladi)

```ts
import { readFileSync } from 'node:fs'

type Dict = { [key: string]: string | Dict }

const uz = JSON.parse(readFileSync(new URL('../src/i18n/uz.json', import.meta.url), 'utf8')) as Dict

export function t(path: string, vars: Record<string, string | number> = {}): string {
  let node: string | Dict = uz
  for (const part of path.split('.')) {
    if (typeof node === 'string' || !(part in node)) throw new Error(`i18n kaliti topilmadi: ${path}`)
    node = node[part]
  }
  if (typeof node !== 'string') throw new Error(`i18n kaliti matn emas: ${path}`)
  return node.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(vars[name] ?? ''))
}
```

- [ ] **Step 4: `frontend/e2e/learning-flow.spec.ts`**

```ts
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { t } from './i18n'

// start-backend.mjs dagi ADMIN_EMAIL / ADMIN_PASSWORD bilan bir xil.
const ADMIN = { email: 'admin@e2e.uz', password: 'e2e-admin-parol-123' }
const SAMPLE_PDF = fileURLToPath(new URL('./.data/sample.pdf', import.meta.url))

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(t('auth.email')).fill(email)
  await page.getByLabel(t('auth.password'), { exact: true }).fill(password)
  await page.getByRole('button', { name: t('auth.login.submit') }).click()
}

test('ro\'yxatdan o\'tish → admin tasdig\'i → bosqichni tugatish → progress', async ({ browser, page }) => {
  const stamp = Date.now()
  const subjectTitle = `E2E fani ${stamp}`
  const student = { name: 'E2E Talaba', email: `talaba${stamp}@e2e.uz`, password: 'talaba-parol-123' }

  // 1. Admin kontent tayyorlaydi: fan, mavzu, PDF, nashr.
  const adminContext = await browser.newContext()
  const admin = await adminContext.newPage()
  await login(admin, ADMIN.email, ADMIN.password)
  await expect(admin).toHaveURL(/\/admin\/users$/)

  await admin.goto('/admin/subjects')
  await admin.getByRole('button', { name: t('admin.subjects.new') }).click()
  const dialog = admin.getByRole('dialog')
  await dialog.getByLabel(t('admin.subjects.titleLabel')).fill(subjectTitle)
  await dialog.getByLabel(t('admin.subjects.publishedLabel')).check()
  await dialog.getByRole('button', { name: t('common.save') }).click()
  await expect(admin.getByRole('listitem', { name: subjectTitle })).toBeVisible()

  await admin.goto('/teach')
  await admin.getByLabel(t('teach.newTopicLabel')).fill('Kasb tanlash asoslari')
  await admin.getByRole('button', { name: t('teach.addTopic') }).click()
  await expect(admin).toHaveURL(/\/teach\/topics\/\d+$/)

  await admin.getByLabel(t('teach.materialTitle')).fill("Kirish ma'ruzasi")
  await admin.getByLabel(t('teach.materialFile')).setInputFiles(SAMPLE_PDF)
  await admin.getByRole('button', { name: t('teach.upload') }).click()
  await expect(admin.getByRole('listitem', { name: "Kirish ma'ruzasi" })).toContainText(t('teach.status.ready'))

  await admin.getByLabel(t('teach.topicPublished')).check()
  await admin.getByRole('button', { name: t('common.save') }).click()
  await expect(admin.getByText(t('teach.topicSaved'))).toBeVisible()

  // 2. Talaba ro'yxatdan o'tadi va tasdiq kutadi.
  await page.goto('/register')
  await page.getByLabel(t('auth.fullName')).fill(student.name)
  await page.getByLabel(t('auth.email')).fill(student.email)
  await page.getByLabel(t('auth.password'), { exact: true }).fill(student.password)
  await page.getByLabel(t('auth.passwordConfirm')).fill(student.password)
  await page.getByRole('button', { name: t('auth.register.submit') }).click()
  await expect(page).toHaveURL(/\/pending$/)

  // 3. Admin tasdiqlaydi.
  await admin.goto('/admin/users')
  const row = admin.getByRole('listitem', { name: student.name })
  await row.getByRole('button', { name: t('admin.users.approve') }).click()
  await expect(row).toBeHidden()
  await adminContext.close()

  // 4. Talaba kiradi, mavzuni ochadi va bosqichni tugatadi.
  await login(page, student.email, student.password)
  await expect(page).toHaveURL(/\/app$/)
  await page
    .getByRole('link', { name: new RegExp(subjectTitle) })
    .filter({ hasText: t('student.topicCount', { count: 1 }) })
    .click()
  await page.getByRole('link', { name: /Kasb tanlash asoslari/ }).click()
  await expect(page).toHaveURL(/\/app\/topics\/\d+\/lecture$/)
  await expect(page.locator('.react-pdf__Page__canvas')).toBeVisible()

  await page.getByRole('button', { name: t('player.complete') }).click()
  await expect(page.getByText(t('player.completedToast'))).toBeVisible()

  // 5. Progress yangilangan.
  await page.goto('/app')
  await expect(page.getByRole('img', { name: t('common.progress', { completed: 1, total: 1 }) })).toBeVisible()
})
```

- [ ] **Step 5: Brauzerni o'rnatish va E2E'ni ishga tushirish**

Run: `npx playwright install chromium`
Expected: Chromium yuklab olinadi.

Run: `npm run e2e`
Expected: `1 passed`. Avval backend tayyorlanadi (migratsiyalar, admin, PDF), so'ng frontend build qilinadi va test o'tadi.

Agar test yiqilsa, trace quyidagi buyruq bilan ochiladi va qadamlar bo'yicha ko'riladi: `npx playwright show-trace test-results/<papka>/trace.zip`.

- [ ] **Step 6: CHANGELOG va commit**

CHANGELOG qatori: `- E2E (Playwright): ro'yxatdan o'tish → admin tasdig'i → PDF'li bosqichni tugatish → progress.`

```bash
cd .. && git add frontend CHANGELOG.md
git commit -m "test(frontend): playwright e2e for the full learning flow"
```

---

### Task 18: CI, hujjatlar va yakuniy tekshiruv

**Files:**
- Modify: `.github/workflows/ci.yml`, `CLAUDE.md`, `CHANGELOG.md`
- Create: `frontend/README.md`

- [ ] **Step 1: `.github/workflows/ci.yml`ga ikkita job qo'shish**

Mavjud `backend` job'i o'zgarmaydi. `jobs:` ostiga, `backend:` job'idan keyin quyidagilar qo'shiladi:

```yaml
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
      - run: uv python install 3.12
      - run: uv sync --frozen
        working-directory: backend
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
        env:
          CI: 'true'
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            frontend/playwright-report
            frontend/test-results
          retention-days: 7
```

- [ ] **Step 2: `frontend/README.md`**

````markdown
# Texnologiya platformasi — frontend

React 19 + Vite + TypeScript, Tailwind CSS v4, TanStack Query, React Router, react-i18next (uz/ru).

## Talablar

Node `>=22.22.2` (tavsiya: Node 24 LTS). Backend lokal ishlab turishi kerak (`../backend/README.md`).

## Ishga tushirish

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, /api → http://localhost:8000
```

## Tekshiruvlar

```bash
npm run lint
npm run typecheck
npm test                                 # Vitest (barcha unit testlar)
npm test -- src/features/teach           # bitta papka
npx vitest run src/api/client.test.ts -t "refresh"   # bitta test nomi bo'yicha
npm run build
```

## E2E (Playwright)

```bash
npx playwright install chromium          # bir marta
npm run e2e
```

E2E alohida backend'ni (`8001` port, toza SQLite baza `e2e/.data/`) va frontend'ning production build'ini (`4174` port) o'zi ishga tushiradi. Lokal dev serverlar bilan to'qnashmaydi.

## Tuzilma

- `src/api/` — fetch client (token xotirada, 401 da bitta refresh), backend tiplari, TanStack Query hook'lari.
- `src/app/` — router, layout'lar, rol bo'yicha guard'lar.
- `src/features/` — sahifalar: `public`, `student`, `profile`, `teach`, `admin`.
- `src/components/ui/` — dizayn tizimi ("Yorqin ilova").
- `src/i18n/` — `uz.json` va `ru.json`. Kalitlar ikkala faylda ham bo'lishi shart (`i18n.test.ts`).
````

- [ ] **Step 3: `CLAUDE.md`ni yangilash**

`## Commands` bo'limining oxiriga (CI paragrafidan oldin) qo'shiladi:

````markdown
Frontend commands run from `frontend/` (Node >=22.22.2):

```bash
npm install
npm run dev                               # http://localhost:5173, proxies /api → localhost:8000
npm test                                  # Vitest + RTL + MSW
npx vitest run src/api/client.test.ts -t "refresh"   # single test
npm run lint && npm run typecheck && npm run build
npm run e2e                               # Playwright; starts its own backend on :8001 with a fresh SQLite DB
```
````

`## Architecture (backend)`dan keyin yangi bo'lim qo'shiladi:

```markdown
## Architecture (frontend)

- **Auth:** the access token lives only in memory (`src/api/client.ts`). The refresh token is the backend's httpOnly cookie. On load, `SessionGate` restores the session via `POST /api/auth/refresh`. On a 401 with `INVALID_TOKEN`/`NOT_AUTHENTICATED`, the client does one single-flight refresh and retries the request once. The current user is the TanStack Query `['session']` entry (`User | null`).
- **Routing:** route guards live in `src/app/guards.tsx`. `RequireAuth roles=[...]` sends pending users to `/pending` and users with the wrong role to `homePathFor(user)`. `RedirectIfAuthed` covers `/login` and `/register`.
- **Errors:** every API error is an `ApiError` carrying the backend `code`. User-facing text comes from `errors.<CODE>` in i18n via `errorText()`. Mutations show a global error toast unless `meta: { silent: true }` is set; silent mutations render a `FormError` inline instead.
- **i18n:** never hard-code UI text. Add every key to both `src/i18n/uz.json` and `ru.json`; `i18n.test.ts` enforces this.
- **Lint rule:** files exporting components must not export anything else (react-refresh). Put zod schemas in `schemas.ts` and helpers in `.ts` files.
- **Tests:** `src/test/render.tsx` (`renderRoute`/`renderRoutes` with a memory router, session user and Toaster) and `src/test/fixtures.ts`. Mock HTTP with `server.use(http.get(...))` from `msw/http`. `PdfViewer` is mocked in unit tests; real PDF rendering is covered by E2E.
```

- [ ] **Step 4: CHANGELOG'ni yakunlash**

`CHANGELOG.md`dagi "1B-bosqich" bo'limidagi har bir qator boshiga tegishli commit hash'i qo'yiladi. Hash'larni olish uchun:

Run (repo ildizidan): `git log --reverse --format='%h %s' main..HEAD`

So'ng shu bo'limga yana bir qator qo'shiladi: `- CI: frontend (lint, typecheck, test, build) va e2e job'lari; frontend README; CLAUDE.md frontend bo'limi.`

- [ ] **Step 5: To'liq yakuniy tekshiruv**

Run (`frontend/`): `npm run lint && npm run typecheck && npm test && npm run build && npm run e2e`
Expected: hammasi yashil.

Run (`backend/`): `uv run pytest -q && uv run ruff check . && uv run mypy app`
Expected: hammasi yashil. Bu bosqichda backend o'zgarmagan bo'lishi kerak: `git diff main --stat -- backend` bo'sh chiqadi.

Spec'dagi "Tayyor bo'lish mezoni" brauzerda qo'lda tekshiriladi (backend + `npm run dev`):
1. Admin o'qituvchini tasdiqlaydi va fanga biriktiradi.
2. O'qituvchi mavzu yaratib, PDF va PPTX yuklaydi. PPTX avtomatik PDF'ga aylanadi (LibreOffice o'rnatilgan bo'lishi kerak).
3. Talaba ro'yxatdan o'tadi, tasdiqlangach mavzuni pleyerda ochadi, bosqichlarni tugatadi va progress ko'rinadi.
4. Interfeys uz va ru tillarida ishlaydi.
5. Telefon o'lchamida (DevTools, 375px) barcha sahifalar gorizontal scroll'siz ishlaydi.

- [ ] **Step 6: Commit, push va PR**

```bash
cd .. && git add .github/workflows/ci.yml CLAUDE.md CHANGELOG.md frontend/README.md
git commit -m "chore(ci): frontend and e2e jobs; docs for frontend"
git push -u origin feat/phase-1b-frontend
```

So'ng `main`ga PR ochiladi (sarlavha: "Phase 1B: frontend"). PR merge qilinishidan oldin CI'dagi `backend`, `frontend` va `e2e` job'lari yashil bo'lishi kerak. Merge foydalanuvchi tasdig'i bilan amalga oshiriladi, so'ng CHANGELOG'ga PR raqami va merge commit yoziladi.

