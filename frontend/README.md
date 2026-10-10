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

## Backend tiplari bilan moslik

```bash
npm run gen:api                          # backend OpenAPI'dan src/api/schema.gen.ts (uv kerak)
```

- `src/api/types.ts` qo'lda yoziladi va kodda shu tiplar ishlatiladi.
- `src/api/types.contract.ts` ularning `schema.gen.ts` bilan mosligini tip darajasida tekshiradi (`npm run typecheck`).
- Backend sxemasi o'zgarsa: `npm run gen:api`, so'ng typecheck xato bergan joyda `types.ts` yangilanadi.
- CI `gen:api` ni qayta ishga tushirib, `schema.gen.ts` commit qilingan nusxadan farq qilmasligini tekshiradi.

## Tuzilma

- `src/api/` — fetch client (token xotirada, 401 da bitta refresh), backend tiplari, TanStack Query hook'lari.
- `src/app/` — router, layout'lar, rol bo'yicha guard'lar.
- `src/features/` — sahifalar: `public`, `student`, `profile`, `teach`, `admin`.
- `src/components/ui/` — dizayn tizimi ("Yorqin ilova").
- `src/i18n/` — `uz.json` va `ru.json`. Kalitlar ikkala faylda ham bo'lishi shart (`i18n.test.ts`).
