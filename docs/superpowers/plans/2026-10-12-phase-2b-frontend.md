# 2B-bosqich: Baholash va gamifikatsiya (frontend) — implementatsiya rejasi

> Bajarish `CLAUDE.md` "Execution Constraints" bo'yicha boradi: subagent ishlatilmaydi, bir vaqtda bitta task bajariladi, har task'dan keyin foydalanuvchi tasdig'i kutiladi.
>
> **Foydalanuvchi qarori (2026-10-12):** yangi testlar yozilmaydi va testlar lokal ishga tushirilmaydi.
> - Har task oxirida faqat `npm run lint && npm run typecheck && npm run build` ishlatiladi.
> - CI testlarni avtomatik ishga tushiradi. Mavjud test yangi so'rov tufayli yiqilsa, faqat o'sha testning MSW mock'i minimal qo'shiladi; yangi test holati yozilmaydi.
> - E2E baholash oqimi audit 7-band bilan birga loyiha oxiriga qoldi.
>
> Tiplar, API hook'lar va nozik mantiq (krossvord to'ri, javob formati) quyida to'liq kod bilan berilgan. JSX komponentlar esa props, holat, i18n kalitlari va mavjud namunalar (`GlossaryTab`, `MaterialsTab`, `StepContent`, `TeachHomePage`) bilan tavsiflangan; ularning to'liq kodi bajarish paytida shu namunalar uslubida yoziladi.

**Goal:** Mini-spec'ning 8-bo'limini (`docs/superpowers/specs/2026-10-11-phase-2-assessment-design.md`) frontend'da qurish:
- talaba uchun test, ha/yo'q, krossvord, vazifa, natija ekrani, mukofotlar, XP / seriya / nishonlar va "Natijalarim";
- o'qituvchi uchun faoliyat muharrirlari, vazifa formasi, tekshirish navbati va statistika.

**Architecture:**
- Yangi API hook'lar alohida modullarda turadi: `api/assessment.ts` (talaba), `api/teachAssessment.ts` (o'qituvchi). Ular `api/student.ts` va `api/teach.ts` uslubida: TanStack Query, `apiFetch`, keshni invalidatsiya qilish.
- Komponentlar `features/student/assessment/` va `features/teach/assessment/` ichida.
- Mukofotlar bitta `announceRewards()` orqali toast bilan ko'rsatiladi.

**Tech Stack:** mavjud — React 19, React Router, TanStack Query, react-hook-form + zod, Tailwind v4, react-i18next. Yangi bog'liqlik yo'q.

**Konventsiyalar** (`CLAUDE.md`):
- UI matni faqat i18n orqali beriladi, har kalit `uz.json` va `ru.json` ga birga qo'shiladi.
- Komponent eksport qiladigan fayl boshqa narsa eksport qilmaydi: zod sxemalar `schemas.ts` da, yordamchilar `.ts` fayllarda.
- Sahifalar `QueryState` bilan chiziladi.
- Mutatsiya xatosi sukut bo'yicha global toast bilan chiqadi. Forma ichida ko'rsatiladigan xatolar uchun `meta: { silent: true }` va `FormError`.
- Har task commit'i bilan `CHANGELOG.md` yozuvi va hash commit'i bo'ladi, keyin push. Commit oxirida `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` qatori.

**Mini-spec 8-bo'limidan ataylab soddalashtirish:** `/app` alohida "bosh sahifa"ga aylantirilmaydi va fanlar ro'yxati `/app/subjects` ga ko'chirilmaydi. Mavjud `/app` sahifasi (salomlashuv, "Davom ettirish", fanlar) XP, seriya va nishonlar bilan to'ldiriladi. Sabablari:
- `homePathFor`, E2E va mavjud havolalar o'zgarmaydi;
- natija spec'dagi bilan bir xil: bitta sahifada salomlashuv, seriya, XP, davom ettirish, nishonlar va fanlar.
- Spec bu bandda Task 12 da yangilanadi.

---

## Fayl xaritasi

```
frontend/src/
  api/types.ts                     # 2A javob/so'rov tiplari (Task 1)
  api/types.contract.ts            # yangi tiplar sxema bilan solishtiriladi (Task 1)
  api/assessment.ts                # YANGI: talaba hook'lari (Task 1)
  api/teachAssessment.ts           # YANGI: o'qituvchi hook'lari (Task 1)
  api/student.ts                   # useCompleteStep -> StepCompleteResult + announceRewards (Task 2)
  lib/rewards.ts                   # YANGI: announceRewards() (Task 2)
  lib/download.ts                  # YANGI: himoyalangan faylni yuklab olish (Task 6)
  app/router.tsx, app/paths.ts     # yangi marshrutlar va menyu (Task 3, 7, 10, 11)
  features/student/SubjectsPage.tsx            # XP/seriya/nishonlar bloki (Task 3)
  features/student/DashboardStats.tsx          # YANGI (Task 3)
  features/student/StepContent.tsx             # review/practice/task bosqichlari (Task 4, 6)
  features/student/assessment/ActivityList.tsx     # YANGI (Task 4)
  features/student/assessment/ChoicePlayer.tsx     # YANGI: test + ha/yo'q (Task 4)
  features/student/assessment/AttemptResult.tsx    # YANGI: natija ekrani (Task 4)
  features/student/assessment/CrosswordPlayer.tsx  # YANGI (Task 5)
  features/student/assessment/crossword.ts         # YANGI: to'r yordamchilari (Task 5)
  features/student/assessment/TaskStep.tsx         # YANGI (Task 6)
  features/student/ResultsPage.tsx                 # YANGI (Task 7)
  features/student/AttemptDetailPage.tsx           # YANGI (Task 7)
  features/teach/TopicEditorPage.tsx               # review/practice/task tablari (Task 8, 9)
  features/teach/assessment/ActivitiesTab.tsx      # YANGI (Task 8)
  features/teach/assessment/ActivityEditor.tsx     # YANGI: test / ha-yo'q / krossvord formalari (Task 8)
  features/teach/assessment/schemas.ts             # YANGI: zod (Task 8, 9)
  features/teach/assessment/TaskTab.tsx            # YANGI (Task 9)
  features/teach/ReviewQueuePage.tsx               # YANGI (Task 10)
  features/teach/ReviewDetailPage.tsx              # YANGI (Task 10)
  features/teach/TeachHomePage.tsx                 # "Tekshirilishi kerak: N ta" (Task 10)
  features/teach/StatsPage.tsx                     # YANGI (Task 11)
  i18n/uz.json, i18n/ru.json                       # har task o'z kalitlari bilan
```

---

### Task 0: Rejani repoga qo'shish
- [ ] Shu fayl commit qilinadi va `CHANGELOG.md` ga yoziladi: `docs: phase 2B frontend implementation plan`. So'ng hash commit'i va push.

---

### Task 1: API tiplari, hook'lar va xato matnlari

**Files:** `api/types.ts`, `api/types.contract.ts`, `api/assessment.ts`, `api/teachAssessment.ts`, `i18n/uz.json`, `i18n/ru.json`

- [ ] **Step 1: `api/types.ts`** — fayl oxiriga qo'shiladi (`ActivityView`, `TaskView`, `SubmissionView`, `StudentLayout` va boshqalar 2A Task 11 da qo'shilgan):

```ts
export interface BadgeBrief {
  code: string
  icon: string
  title_uz: string
  title_ru: string
}

export interface Rewards {
  xp: number
  new_badges: BadgeBrief[]
}

export interface StepCompleteResult extends StepBrief {
  rewards: Rewards
}

export type AttemptAnswer = number | boolean | string | null

export interface ResultItem {
  prompt: string
  options: string[] | null
  given: number | boolean | string | null
  correct: number | boolean | string
  is_correct: boolean
  explanation: string | null
}

export interface AttemptResult {
  attempt_id: number
  activity_id: number
  score: number
  max_score: number
  result: ResultItem[]
  rewards: Rewards
  step: StepBrief
}

export interface SubmitResult {
  submission: SubmissionView
  rewards: Rewards
  step: StepBrief
}

export interface BadgeView extends BadgeBrief {
  description_uz: string
  description_ru: string
  awarded_at: string | null
}

export interface Dashboard {
  xp_total: number
  streak: { current: number; longest: number; active_today: boolean }
  badges: BadgeView[]
  continue_step: ContinueTarget | null
}

export interface ActivityResult {
  activity_id: number
  title: string
  type: ActivityType
  best_percent: number
  attempts_count: number
  last_attempt_id: number
  last_attempt_at: string
}

export interface TaskResult {
  task_id: number
  title: string
  status: SubmissionStatus
  score: number | null
  max_score: number
  feedback: string | null
  is_late: boolean
  submitted_at: string
}

export interface TopicResults {
  topic_id: number
  topic_title: string
  activities: ActivityResult[]
  tasks: TaskResult[]
}

export interface SubjectResults {
  subject_id: number
  subject_title: string
  subject_slug: string
  topics: TopicResults[]
}

export interface AttemptDetail {
  id: number
  activity_id: number
  activity_title: string
  activity_type: ActivityType
  score: number
  max_score: number
  result: ResultItem[]
  created_at: string
}

// --- o'qituvchi ---
export interface QuizItemIn {
  text: string
  options: string[]
  correct_index: number
  explanation?: string | null
}

export interface YesNoItemIn {
  statement: string
  answer: boolean
  explanation?: string | null
}

export interface CrosswordItemIn {
  word: string
  clue: string
}

export type ActivityIn =
  | { type: 'quiz'; title: string; items: QuizItemIn[] }
  | { type: 'yesno'; title: string; items: YesNoItemIn[] }
  | { type: 'crossword'; title: string; items: CrosswordItemIn[] }

export interface QuizItemOut extends QuizItemIn {
  id: number
  explanation: string | null
}

export interface YesNoItemOut extends YesNoItemIn {
  id: number
  explanation: string | null
}

export interface CrosswordItemOut extends CrosswordItemIn {
  id: number
}

export interface TeachLayoutWord {
  number: number
  row: number
  col: number
  direction: 'across' | 'down'
  length: number
  word_id: number
  cells: string[]
}

export interface TeachLayout {
  rows: number
  cols: number
  words: TeachLayoutWord[]
}

export interface ActivityTeach {
  id: number
  step_id: number
  type: ActivityType
  title: string
  order: number
  is_published: boolean
  items: (QuizItemOut | YesNoItemOut | CrosswordItemOut)[]
  layout: TeachLayout | null
}

export interface TaskIn {
  title: string
  description: string
  type: TaskType
  max_score: number
  rubric?: string | null
  deadline?: string | null
}

export interface TaskOut {
  id: number
  step_id: number
  title: string
  description: string
  type: TaskType
  max_score: number
  rubric: string | null
  deadline: string | null
}

export interface SubmissionQueueItem {
  id: number
  status: SubmissionStatus
  student_name: string
  subject_id: number
  subject_title: string
  topic_id: number
  topic_title: string
  task_id: number
  task_title: string
  submitted_at: string
  is_late: boolean
}

export interface SubmissionDetail extends SubmissionQueueItem {
  task_description: string
  rubric: string | null
  max_score: number
  text: string | null
  original_name: string | null
  file_url: string | null
  score: number | null
  feedback: string | null
  graded_at: string | null
}

export interface GradeIn {
  score: number
  feedback?: string | null
}

export interface TopicStats {
  topic_id: number
  topic_title: string
  started: number
  completed: number
  avg_best_percent: number | null
  pending_submissions: number
}
```

- [ ] **Step 2: `api/types.contract.ts`.** `ResponseContract` ga quyidagi juftliklar qo'shiladi:
  - `Rewards` ↔ `RewardsOut`, `BadgeBrief` ↔ `BadgeBrief`, `StepCompleteResult` ↔ `StepCompleteOut`;
  - `ResultItem` ↔ `ResultItem`, `AttemptResult` ↔ `AttemptOut`, `SubmitResult` ↔ `SubmitOut`;
  - `BadgeView` ↔ `BadgeOut`, `Dashboard` ↔ `DashboardOut`;
  - `ActivityResult` ↔ `ActivityResultOut`, `TaskResult` ↔ `TaskResultOut`, `TopicResults` ↔ `TopicResultsOut`, `SubjectResults` ↔ `SubjectResultsOut`, `AttemptDetail` ↔ `AttemptDetailOut`;
  - `QuizItemOut`, `YesNoItemOut`, `CrosswordItemOut`, `TeachLayoutWord`, `TeachLayout` (bir xil nomlar), `ActivityTeach` ↔ `ActivityTeachOut`, `TaskOut` ↔ `TaskOut`;
  - `SubmissionQueueItem` ↔ `SubmissionQueueItem`, `SubmissionDetail` ↔ `SubmissionDetailOut`, `TopicStats` ↔ `TopicStatsOut`.

  `RequestContract` ga:
  - `TaskIn` ↔ `TaskIn`, `GradeIn` ↔ `GradeIn`;
  - `Extract<ActivityIn, { type: 'quiz' }>` ↔ `QuizActivityIn` (yesno va crossword uchun ham xuddi shunday);
  - `QuizItemIn`, `YesNoItemIn`, `CrosswordItemIn` (bir xil nomlar).

  `npm run typecheck` ko'rsatgan farqlar `types.ts` da tuzatiladi; `schema.gen.ts` qo'lda o'zgartirilmaydi.

- [ ] **Step 3: `api/assessment.ts` (yangi):**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { announceRewards } from '@/lib/rewards'
import { apiFetch } from './client'
import { studentKeys } from './student'
import type { AttemptAnswer, AttemptDetail, AttemptResult, Dashboard, SubjectResults, SubmitResult } from './types'

export const assessmentKeys = {
  dashboard: ['me', 'dashboard'] as const,
  results: ['me', 'results'] as const,
  attempt: (id: number) => ['me', 'attempts', id] as const,
}

/** Mukofot yoki progress o'zgarganda talaba tomonidagi keshlar yangilanadi. */
function useInvalidateProgress(topicId: number) {
  const queryClient = useQueryClient()
  return (stepId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: studentKeys.topic(topicId) }),
      queryClient.invalidateQueries({ queryKey: studentKeys.step(stepId) }),
      queryClient.invalidateQueries({ queryKey: studentKeys.subjects }),
      queryClient.invalidateQueries({ queryKey: studentKeys.continue }),
      queryClient.invalidateQueries({ queryKey: assessmentKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: assessmentKeys.results }),
    ])
}

export function useSubmitAttempt(topicId: number, stepId: number) {
  const invalidate = useInvalidateProgress(topicId)
  return useMutation({
    mutationFn: ({ activityId, answers }: { activityId: number; answers: AttemptAnswer[] }) =>
      apiFetch<AttemptResult>(`/api/activities/${activityId}/attempts`, { method: 'POST', json: { answers } }),
    onSuccess: (result) => {
      announceRewards(result.rewards)
      return invalidate(stepId)
    },
  })
}

export function useSubmitTask(topicId: number, stepId: number) {
  const invalidate = useInvalidateProgress(topicId)
  return useMutation({
    mutationFn: ({ taskId, text, file }: { taskId: number; text: string; file: File | null }) => {
      const body = new FormData()
      if (text.trim()) body.append('text', text)
      if (file) body.append('file', file)
      return apiFetch<SubmitResult>(`/api/tasks/${taskId}/submission`, { method: 'PUT', body })
    },
    onSuccess: (result) => {
      announceRewards(result.rewards)
      return invalidate(stepId)
    },
    meta: { silent: true },
  })
}

export function useDashboard() {
  return useQuery({
    queryKey: assessmentKeys.dashboard,
    queryFn: ({ signal }) => apiFetch<Dashboard>('/api/me/dashboard', { signal }),
  })
}

export function useResults() {
  return useQuery({
    queryKey: assessmentKeys.results,
    queryFn: ({ signal }) => apiFetch<SubjectResults[]>('/api/me/results', { signal }),
  })
}

export function useAttemptDetail(attemptId: number) {
  return useQuery({
    queryKey: assessmentKeys.attempt(attemptId),
    queryFn: ({ signal }) => apiFetch<AttemptDetail>(`/api/me/attempts/${attemptId}`, { signal }),
    enabled: Number.isInteger(attemptId) && attemptId > 0,
  })
}
```

- [ ] **Step 4: `api/teachAssessment.ts` (yangi):**
  - Kalitlar: `teachAssessmentKeys = { activities: (stepId) => ['teach','steps',stepId,'activities'], task: (stepId) => ['teach','steps',stepId,'task'], queue: (status) => ['teach','submissions',status], submission: (id) => ['teach','submissions','detail',id], summary: ['teach','summary'], stats: (subjectId) => ['teach','stats',subjectId] }`.
  - Hook'lar:
    - `useStepActivities(stepId)` — `GET /api/teach/steps/{id}/activities`;
    - `useCreateActivity(topicId, stepId)` — POST, `meta: { silent: true }`;
    - `useUpdateActivity(topicId, stepId)` — `PUT /activities/{id}`, silent;
    - `usePublishActivity(topicId, stepId)` — PATCH `{is_published}`;
    - `useDeleteActivity(topicId, stepId)`;
    - `useReorderActivities(topicId, stepId)` — `PUT .../order {ids}`;
    - `useStepTask(stepId)` — `GET /steps/{id}/task` → `TaskOut | null`;
    - `useSaveTask(topicId, stepId)` — PUT, silent;
    - `useDeleteTask(topicId, stepId)`;
    - `useSubmissionQueue(status)` — `GET /api/teach/submissions?status=…&limit=200`;
    - `useSubmission(id)`;
    - `useGradeSubmission(id)` — POST `.../grade`, silent;
    - `useReturnSubmission(id)` — POST `.../return {feedback}`, silent;
    - `useTeachSummary()`;
    - `useTeachStats(subjectId | undefined)` — `enabled: subjectId !== undefined`.
  - Har bir faoliyat/vazifa mutatsiyasi muvaffaqiyatda quyidagilarni invalidatsiya qiladi:
    - `teachAssessmentKeys.activities(stepId)` (yoki `task(stepId)`);
    - `teachKeys.topic(topicId)`;
    - talaba keshlari: `api/teach.ts` dagi `invalidateStudentCaches` `export` qilinadi va shu yerda chaqiriladi.
  - Baholash va qaytarish `submission(id)`, `['teach','submissions']` prefiksi va `summary` ni invalidatsiya qiladi.

- [ ] **Step 5: `errors` i18n** — `uz.json` va `ru.json` dagi `errors` ga 2A kodlari qo'shiladi:
  - `ACTIVITY_NOT_FOUND`, `TASK_NOT_FOUND`, `SUBMISSION_NOT_FOUND`, `ATTEMPT_NOT_FOUND`;
  - `ACTIVITY_WRONG_STEP`, `TASK_WRONG_STEP`;
  - `ACTIVITY_INVALID_ITEMS`, `CROSSWORD_INVALID_WORD`, `CROSSWORD_UNPLACEABLE`, `ATTEMPT_INVALID_ANSWERS`;
  - `SUBMISSION_EMPTY`, `SUBMISSION_FIELD_NOT_ALLOWED`, `SCORE_OUT_OF_RANGE`, `SUBMISSION_GRADED`, `SUBMISSION_NOT_SUBMITTED`, `MAX_SCORE_BELOW_GRADED`.

  Matnlar backend xabarlariga mos: uz backend'dagidek, ru tarjima.
- [ ] **Step 6:** `npm run lint && npm run typecheck && npm run build`. Commit: `feat(frontend): API types and hooks for assessment`.

---

### Task 2: Mukofotlar va "Tugatdim" javobi

**Files:** `lib/rewards.ts`, `api/student.ts`, `components/ui/Toast.tsx`, `index.css`, i18n

- [ ] **`lib/rewards.ts`:**

```ts
import { pushToast } from '@/components/ui/toast-store'
import { i18n } from '@/i18n'
import type { Rewards } from '@/api/types'

/** XP va yangi nishonlarni toast bilan e'lon qiladi (0 XP va nishonsiz bo'lsa hech narsa chiqmaydi). */
export function announceRewards(rewards: Rewards): void {
  if (rewards.xp > 0) pushToast('success', i18n.t('rewards.xp', { xp: rewards.xp }))
  for (const badge of rewards.new_badges) {
    const title = i18n.language === 'ru' ? badge.title_ru : badge.title_uz
    pushToast('info', i18n.t('rewards.badge', { icon: badge.icon, title }))
  }
}
```

- [ ] **`api/student.ts` → `useCompleteStep`:**
  - `apiFetch<StepCompleteResult>` ga o'tadi;
  - `onSuccess` da `announceRewards(step.rewards)` chaqiriladi;
  - `assessmentKeys.dashboard` va `results` ham invalidatsiya qilinadi (`assessment.ts` dan import, tsikl yo'q: `assessment.ts` faqat `studentKeys` ni oladi).
- [ ] **i18n kalitlari:** `rewards.xp` — "+{{xp}} XP" (ru bir xil); `rewards.badge` — "{{icon}} Yangi nishon: {{title}}" / "{{icon}} Новый значок: {{title}}".
- [ ] Toast animatsiyasi: `Toast.tsx` ga `motion-safe:animate-[pop_.3s_ease-out]` qo'shiladi. `@keyframes pop` `index.css` ga yoziladi (`scale .9 → 1`, `opacity 0 → 1`), `prefers-reduced-motion` da ishlamaydi.
- [ ] Tekshiruv va commit: `feat(frontend): reward toasts`.

---

### Task 3: Bosh sahifada XP, seriya va nishonlar; menyu

**Files:** `features/student/DashboardStats.tsx`, `features/student/SubjectsPage.tsx`, `app/paths.ts`, i18n

- [ ] **`DashboardStats`** (`useDashboard`, `QueryState` bilan):
  - uchta katta karta: "🔥 {current} kunlik seriya" (`active_today` bo'lmasa "Bugun hali o'qimadingiz" izohi), "⭐ {xp_total} XP", "🏅 {olingan}/{jami} nishon";
  - ostida nishonlar to'ri: `grid grid-cols-2 sm:grid-cols-5`, olingani rangli, olinmagani `opacity-40 grayscale`;
  - har birida `title` va `description` (til bo'yicha `_uz`/`_ru`), `aria-label` da holat.
- [ ] **`SubjectsPage`:** salomlashuvdan keyin `<DashboardStats />`, `ContinueCard` va fanlar avvalgidek. Faqat `user.role === 'student'` uchun chiziladi, chunki o'qituvchi va admin XP olmaydi.
- [ ] **`paths.ts` → `navLinksFor`:** talaba uchun `{ to: '/app/results', label: 'nav.results' }` qo'shiladi.
- [ ] **i18n:** `nav.results`, `dashboard.streak` ("{{count}} kunlik seriya"), `dashboard.streakIdle`, `dashboard.xp`, `dashboard.badges` ("{{owned}} / {{total}} nishon"), `dashboard.badgeLocked`, `dashboard.badgeOwned`.
- [ ] **Mavjud test:** `SubjectsPage.test.tsx` endi `/api/me/dashboard` so'raydi. CI yiqilsa, `src/test/fixtures.ts` ga `dashboard()` fixture'i va testga `http.get('/api/me/dashboard', …)` handler qo'shiladi.
- [ ] Tekshiruv va commit: `feat(frontend): XP, streak and badges on the student home`.

---

### Task 4: Pleyerda faoliyatlar: test, ha/yo'q va natija ekrani

**Files:** `features/student/assessment/ActivityList.tsx`, `ChoicePlayer.tsx`, `AttemptResult.tsx`, `features/student/StepContent.tsx`, i18n

- [ ] **`StepContent`:** `data.kind` `review` yoki `practice` bo'lsa, `<ActivityList topicId stepId={data.id} activities={data.activities} nextKind />` chiziladi. "Keyingi bosqich" havolasi `SELF_COMPLETE_KINDS` blokidagidek ko'rinadi.
- [ ] **`ActivityList`:**
  - holat `selected: ActivityView | null`;
  - tanlanmagan bo'lsa, faoliyat kartalari: ikonka (quiz 📝, yesno ✅❌, crossword 🧩), nom, `best_percent` (bo'lsa "Eng yaxshi: 80%" Badge, yo'q bo'lsa "Hali yechilmagan") va "Boshlash" / "Qayta urinish" tugmasi;
  - tanlansa, `type` bo'yicha `ChoicePlayer` yoki `CrosswordPlayer` (Task 5) chiziladi. "← Faoliyatlar" tugmasi orqaga qaytaradi.
- [ ] **`ChoicePlayer`** (`activity`, `onSubmit(answers)`, `pending`, `result`):
  - `answers: AttemptAnswer[]` (boshida `null` lar), `index` holati;
  - **test:** bitta savol, 4 variant `role="radiogroup"` (radio tugmalar), "Oldingi" / "Keyingi", oxirgi savolda "Yakunlash";
  - **ha/yo'q:** barcha bayonotlar ro'yxat bo'lib chiqadi, har birida "Ha" / "Yo'q" (`aria-pressed`), oxirida "Yakunlash";
  - javobsiz element bo'lsa, `ConfirmDialog` "N ta savol javobsiz. Yakunlaysizmi?" deb so'raydi;
  - yuborish `useSubmitAttempt(topicId, stepId).mutate({ activityId, answers })`, muvaffaqiyatda `AttemptResult` ko'rsatiladi.
- [ ] **`AttemptResult`** (`result: { score, max_score, result: ResultItem[] }`, `onRetry`, `onBack`):
  - katta "{score} / {max_score}" va foiz, `ProgressRing` qayta ishlatiladi;
  - har element uchun ✓/✗, savol yoki bayonot (`prompt`), talaba javobi va to'g'ri javob:
    - test: `options[given]` va `options[correct]`;
    - ha/yo'q: "Ha" / "Yo'q";
    - krossvord: satr;
  - izoh (`explanation`);
  - "Qayta urinish" va "← Faoliyatlar" tugmalari;
  - komponent `AttemptDetailPage` (Task 7) da ham ishlatiladi.
- [ ] **i18n (`activity.*`):** `quiz`, `yesno`, `crossword`, `start`, `retry`, `notAttempted`, `best` ("Eng yaxshi: {{percent}}%"), `attempts` ("{{count}} ta urinish"), `back`, `prev`, `next`, `finish`, `yes`, `no`, `unansweredTitle`, `unansweredText` ("{{count}} ta savol javobsiz qoldi. Yakunlaysizmi?"), `score`, `yourAnswer`, `correctAnswer`, `noAnswer`, `explanation`, `empty`.
- [ ] Tekshiruv va commit: `feat(frontend): quiz and yes/no players with result review`.

---

### Task 5: Krossvord pleyeri

**Files:** `features/student/assessment/crossword.ts`, `CrosswordPlayer.tsx`, i18n

- [ ] **`crossword.ts`** — sof yordamchilar:

```ts
import type { StudentLayout, StudentLayoutWord } from '@/api/types'

export type CellKey = `${number}:${number}`

export function cellKey(row: number, col: number): CellKey {
  return `${row}:${col}`
}

export function wordCells(word: StudentLayoutWord): CellKey[] {
  return Array.from({ length: word.length }, (_, k) =>
    word.direction === 'across' ? cellKey(word.row, word.col + k) : cellKey(word.row + k, word.col),
  )
}

/** To'rdagi har katak qaysi so'zlarga tegishli (kesishmada ikkita). */
export function cellOwners(layout: StudentLayout): Map<CellKey, number[]> {
  const owners = new Map<CellKey, number[]>()
  layout.words.forEach((word, index) => {
    for (const key of wordCells(word)) owners.set(key, [...(owners.get(key) ?? []), index])
  })
  return owners
}

/** Kataklar qiymatidan backend kutgan javoblar ro'yxati (layout.words tartibida). */
export function answersFromCells(layout: StudentLayout, values: Map<CellKey, string>): string[] {
  return layout.words.map((word) => wordCells(word).map((key) => values.get(key) ?? '').join(''))
}

/** Katakka kiritilgan qiymatni normallashtiradi: bitta harf, katta; O' / G' bitta katak. */
export function normalizeCellInput(raw: string): string {
  const text = raw.toUpperCase().replace(/['ʻʼ’‘`]/g, 'ʻ')
  const match = text.match(/[OG]ʻ$/u) ?? text.match(/\p{L}$/u)
  return match ? match[0] : ''
}
```

- [ ] **`CrosswordPlayer`** (`activity` (`layout` bor), `onSubmit`, `pending`):
  - holat `values: Map<CellKey,string>`, `activeWord: number`;
  - to'r — CSS grid `grid-template-columns: repeat(cols, minmax(0,1fr))` va `max-w-full`, shunda 375px kenglikda gorizontal scroll bo'lmaydi;
  - bo'sh kataklar ko'rinmaydi, so'z boshida raqam;
  - har katak `<input maxLength={2} aria-label="{number} {direction}, {k}-harf">`. `onChange` da `normalizeCellInput` qo'llanadi va fokus faol so'zdagi keyingi katakka o'tadi. `Backspace` bo'sh katakda oldingisiga qaytadi;
  - katak bosilganda uning so'zi faol bo'ladi; kesishmada qayta bosish yo'nalishni almashtiradi. Faol so'z kataklari `bg-brand-50` bilan ajralib turadi;
  - ostida "Gorizontal" va "Vertikal" savollar ro'yxati: `number. clue (length)`, bosilganda o'sha so'z faol bo'ladi;
  - "Yakunlash" `onSubmit(answersFromCells(layout, values))` ni chaqiradi;
  - natija `AttemptResult` bilan ko'rsatiladi.
- [ ] **i18n:** `crossword.across`, `crossword.down`, `crossword.cellLabel`, `crossword.letters` ("{{count}} harf").
- [ ] Tekshiruv va commit: `feat(frontend): crossword player`.

---

### Task 6: Vazifa bosqichi (talaba)

**Files:** `features/student/assessment/TaskStep.tsx`, `lib/download.ts`, `features/student/StepContent.tsx`, i18n

- [ ] **`lib/download.ts`:**

```ts
import { apiBuffer } from '@/api/client'

/** Himoyalangan faylni Bearer token bilan yuklab, brauzerda saqlaydi. */
export async function downloadProtected(url: string, filename: string): Promise<void> {
  const buffer = await apiBuffer(url)
  const href = URL.createObjectURL(new Blob([buffer]))
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
  URL.revokeObjectURL(href)
}
```

- [ ] **`StepContent`:** `data.kind === 'task'` va `data.task` bo'lsa, `<TaskStep topicId stepId task={data.task} submission={data.submission} />` chiziladi.
- [ ] **`TaskStep`:**
  - topshiriq: sarlavha, tavsif (`whitespace-pre-line`), maksimal ball, muddat (`toLocaleDateString(i18n.language)`, o'tgan bo'lsa amber "Muddat o'tgan" Badge), mezon (`rubric`, bo'lsa);
  - **holat kartasi** (`submission` bo'lsa):
    - `submitted` — "Tekshirilmoqda" (slate);
    - `returned` — "Qaytarildi" (amber) va izoh;
    - `graded` — "Baholandi: {score}/{max}" (green) va izoh;
    - `is_late` bo'lsa "Kechikkan" Badge;
    - fayl bo'lsa, "Faylni yuklab olish" (`downloadProtected(file_url, original_name)`);
  - **forma** (`graded` bo'lmaganda ko'rinadi):
    - `type !== 'file'` → `Textarea` (`defaultValue = submission?.text`);
    - `type !== 'text'` → fayl `Input` (`accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"`, hint "20 MB gacha");
    - tugma: birinchi marta "Yuborish", qayta "Qayta yuborish";
    - `useSubmitTask` silent, xato `FormError` bilan; muvaffaqiyatda `pushToast('success', t('task.sent'))`.
- [ ] **i18n (`task.*`):** `maxScore`, `deadline`, `overdue`, `rubric`, `answer`, `file`, `fileHint`, `send`, `resend`, `sent`, `statusSubmitted`, `statusReturned`, `statusGraded` ("Baholandi: {{score}} / {{max}}"), `late`, `feedback`, `download`.
- [ ] Tekshiruv va commit: `feat(frontend): task submission step`.

---

### Task 7: "Natijalarim" va urinish tahlili

**Files:** `features/student/ResultsPage.tsx`, `features/student/AttemptDetailPage.tsx`, `app/router.tsx`, i18n

- [ ] **Marshrutlar** (`AppLayout` ichida): `app/results` → `ResultsPage`, `app/results/attempts/:attemptId` → `AttemptDetailPage`.
- [ ] **`ResultsPage`** (`useResults`):
  - bo'sh bo'lsa `EmptyState` "Hali natijalar yo'q";
  - fan → mavzu sarlavhalari;
  - faoliyatlar jadvali (nom, tur, eng yaxshi %, urinishlar, oxirgi sana, "Tahlil" havolasi → `attempts/{last_attempt_id}`);
  - vazifalar ro'yxati (nom, holat Badge, ball/max, izoh, "Kechikkan").
- [ ] **`AttemptDetailPage`** (`useAttemptDetail`): sarlavhada faoliyat nomi va sana, so'ng `AttemptResult` (`onRetry` yo'q), "← Natijalarim".
- [ ] **i18n (`results.*`):** `title`, `empty`, `emptyText`, `activities`, `tasks`, `review`, `lastAttempt`, `back`.
- [ ] Tekshiruv va commit: `feat(frontend): my results and attempt review pages`.

---

### Task 8: O'qituvchi — faoliyat muharrirlari

**Files:** `features/teach/assessment/schemas.ts`, `ActivitiesTab.tsx`, `ActivityEditor.tsx`, `features/teach/TopicEditorPage.tsx`, i18n

- [ ] **`schemas.ts`:**

```ts
import { z } from 'zod'

const text = (max: number) =>
  z.string().trim().min(1, { error: 'validation.required' }).max(max, { error: 'validation.tooLong' })
const optional = z.string().trim().max(2000, { error: 'validation.tooLong' })

export const quizSchema = z.object({
  title: text(200),
  items: z
    .array(
      z.object({
        text: text(1000),
        options: z.array(text(300)).length(4),
        correct_index: z.number().int().min(0).max(3),
        explanation: optional,
      }),
    )
    .min(1, { error: 'activity.needItems' })
    .max(50),
})

export const yesnoSchema = z.object({
  title: text(200),
  items: z
    .array(z.object({ statement: text(1000), answer: z.boolean(), explanation: optional }))
    .min(1, { error: 'activity.needItems' })
    .max(50),
})

export const crosswordSchema = z.object({
  title: text(200),
  items: z
    .array(z.object({ word: text(60), clue: text(300) }))
    .min(3, { error: 'activity.needWords' })
    .max(20, { error: 'activity.tooManyWords' }),
})

export type QuizValues = z.infer<typeof quizSchema>
export type YesNoValues = z.infer<typeof yesnoSchema>
export type CrosswordValues = z.infer<typeof crosswordSchema>
```

- [ ] **`TopicEditorPage`:** `review` va `practice` tablarida `<ActivitiesTab topicId stepId={step.id} />` chiziladi (`teach.comingSoon` o'rniga). `itemCount` bu tablar uchun `null` qaytaradi, badge ko'rsatilmaydi.
- [ ] **`ActivitiesTab`** (`useStepActivities`):
  - har faoliyat qatori: tur ikonka, nom, elementlar soni, `PublishedBadge`, "Nashr qilish" / "Yashirish" (`usePublishActivity`), ↑ / ↓ (`useReorderActivities`), "Tahrirlash", "O'chirish" (`ConfirmDialog`);
  - pastida "+ Test", "+ Ha/yo'q" va "+ Krossvord" tugmalari;
  - tahrirlash va yaratish `ActivityEditor` ni qator o'rnida (inline) ochadi.
- [ ] **`ActivityEditor`** (`type`, `initial?: ActivityTeach`, `onSaved`, `onCancel`):
  - `useForm` + `useFieldArray` (`items`), mos zod sxema bilan;
  - **test elementi:** savol `Textarea`, 4 ta variant `Input` va har biri yonida `correct_index` radio, izoh `Input`;
  - **ha/yo'q elementi:** bayonot `Textarea`, "Ha / Yo'q" `Select`, izoh;
  - **krossvord elementi:** so'z va savol `Input` lar;
  - elementni o'chirish ✕ va ↑↓ (`move`), "+ Element qo'shish" (`append`);
  - submit `initial` bo'lsa `useUpdateActivity`, aks holda `useCreateActivity`. Yuboriladigan qiymat `{ type, title, items }`, bo'sh `explanation` `null` ga aylantiriladi;
  - backend xatolari `FormError` bilan ko'rsatiladi. `CROSSWORD_UNPLACEABLE` / `CROSSWORD_INVALID_WORD` da `error.details.words` / `word` dagi so'zlar mos `Input` da `setError` bilan belgilanadi;
  - saqlangach krossvord bo'lsa, javobdagi `layout` dan to'r ko'rinishi (faqat o'qish uchun, harflar bilan) chiziladi.
- [ ] **i18n (`activity.*` davomi, `teach.*`):** `newQuiz`, `newYesNo`, `newCrossword`, `title`, `question`, `option` ("{{n}}-variant"), `correct`, `statement`, `answerIs`, `word`, `clue`, `addItem`, `removeItem`, `needItems`, `needWords`, `tooManyWords`, `publish`, `unpublish`, `deleteTitle`, `deleteText`, `itemsCount` ("{{count}} ta element"), `preview`, `empty`.
- [ ] Tekshiruv va commit: `feat(frontend): teacher activity editors`.

---

### Task 9: O'qituvchi — vazifa formasi

**Files:** `features/teach/assessment/TaskTab.tsx`, `schemas.ts`, `TopicEditorPage.tsx`, i18n

- [ ] **`schemas.ts`:** `taskSchema`:
  - `title` 1–200;
  - `description` 1–10000;
  - `type` `'text'|'file'|'both'`;
  - `max_score` 1–100, `z.coerce.number().int()`;
  - `rubric` ≤ 5000;
  - `deadline` `''` yoki `datetime-local` satri.
- [ ] **`TopicEditorPage`:** `task` tabida `<TaskTab topicId stepId={step.id} />`.
- [ ] **`TaskTab`** (`useStepTask`):
  - forma (`defaultValues` mavjud vazifadan). `deadline` `datetime-local` ↔ ISO: yuborishda `new Date(value).toISOString()`; ko'rsatishda UTC'dagi `toISOString().slice(0,16)` emas, mahalliy vaqt (offset bilan) ishlatiladi;
  - "Saqlash" (`useSaveTask`, silent, `MAX_SCORE_BELOW_GRADED` va boshqa xatolar `FormError`);
  - "Vazifani o'chirish" (`ConfirmDialog`, `useDeleteTask`).
- [ ] **i18n (`taskEdit.*`):** `title`, `description`, `type`, `typeText`, `typeFile`, `typeBoth`, `maxScore`, `rubric`, `deadline`, `saved`, `delete`, `deleteTitle`, `deleteText`.
- [ ] Tekshiruv va commit: `feat(frontend): teacher task form`.

---

### Task 10: Tekshirish navbati

**Files:** `features/teach/ReviewQueuePage.tsx`, `ReviewDetailPage.tsx`, `TeachHomePage.tsx`, `app/router.tsx`, `app/paths.ts`, i18n

- [ ] **Marshrutlar** (teacher/admin guard ichida): `teach/review` va `teach/review/:submissionId`. `navLinksFor` ga teacher/admin uchun `{ to: '/teach/review', label: 'nav.review' }` va `{ to: '/teach/stats', label: 'nav.stats' }`.
- [ ] **`ReviewQueuePage`:**
  - holat filtri tablari: "Tekshirilmagan" (`submitted`), "Qaytarilgan", "Baholangan";
  - ro'yxat kartalari: talaba, fan · mavzu, vazifa, sana, "Kechikkan" Badge, havola → detail;
  - bo'sh bo'lsa `EmptyState`.
- [ ] **`ReviewDetailPage`** (`useSubmission`):
  - vazifa matni va mezon, talaba javobi (matn), fayl (`downloadProtected(detail.file_url, original_name)`);
  - `submitted` bo'lsa forma: ball `Input type=number min=0 max=max_score`, izoh `Textarea`, "Baholash" (`useGradeSubmission`) va "Qaytarish" (`useReturnSubmission`, izoh majburiy — bo'sh bo'lsa forma xatosi);
  - aks holda natija (ball, izoh, holat);
  - muvaffaqiyatda toast va `navigate('/teach/review')`.
- [ ] **`TeachHomePage`:** sarlavha ostida `useTeachSummary`; `pending_submissions > 0` bo'lsa "📝 Tekshirilishi kerak: N ta" havola kartasi → `/teach/review`.
- [ ] **i18n:** `nav.review`, `nav.stats`, `review.*` — `title`, `tabSubmitted`, `tabReturned`, `tabGraded`, `empty`, `late`, `student`, `answer`, `noText`, `file`, `score` ("Ball (0–{{max}})"), `feedback`, `grade`, `return`, `returnNeedsFeedback`, `graded`, `returned`, `pending` ("Tekshirilishi kerak: {{count}} ta"), `back`.
- [ ] **Mavjud test:** `TeachHomePage.test.tsx` `/api/teach/summary` uchun mock talab qilsa, minimal handler qo'shiladi.
- [ ] Tekshiruv va commit: `feat(frontend): teacher review queue`.

---

### Task 11: O'qituvchi statistikasi

**Files:** `features/teach/StatsPage.tsx`, `app/router.tsx`, i18n

- [ ] **Marshrut:** `teach/stats`.
- [ ] **`StatsPage`:**
  - fan tanlash `Select` (`useTeachSubjects`, birinchisi sukut bo'yicha);
  - `useTeachStats(subjectId)` jadvali: mavzu, boshlagan, tugatgan, o'rtacha natija (`—` yoki "78%"), tekshirilmagan;
  - mobil'da jadval `overflow-x-auto` konteynerda.
- [ ] **i18n (`stats.*`):** `title`, `subject`, `topic`, `started`, `completed`, `avg`, `pending`, `empty`.
- [ ] Tekshiruv va commit: `feat(frontend): teacher stats page`.

---

### Task 12: Hujjatlar va yakun

- [ ] `npm run lint && npm run typecheck && npm run build` (frontend), `npm run gen:api` farqsiz bo'lishi kerak.
- [ ] **Spec 8-bo'limi:** `/app` soddalashtirish bandi yoziladi (fanlar `/app` da qoladi, XP/seriya/nishonlar shu sahifada).
- [ ] **`CLAUDE.md` "Architecture (frontend)":** `api/assessment.ts` / `api/teachAssessment.ts`, `announceRewards`, `features/*/assessment/`.
- [ ] **Roadmap:** 2B bajarildi, keyingi qadam — PR #4 ni review va merge qilish, so'ng 3-bosqich.
- [ ] CHANGELOG, commit va push. PR #4 tavsifi 2B bilan yangilanadi, draft holatidan chiqarish foydalanuvchi bilan hal qilinadi.

---

## O'z-o'zini tekshirish (spec 8-bo'lim bilan)

| Spec talabi | Task |
|---|---|
| Bosh sahifa: seriya, XP, davom ettirish, nishonlar | 3 (soddalashtirilgan) |
| Pleyer: faoliyat kartalari, eng yaxshi natija | 4 |
| Test / ha-yo'q o'ynash, natija ekrani (✓/✗, to'g'ri javob, izoh, qayta urinish) | 4 |
| Krossvord (to'r, raqamlar, savollar, telefon kengligi) | 5 |
| Vazifa: topshiriq, muddat, matn/fayl, holat kartasi, kechikkan | 6 |
| Natijalarim, urinish tahlili | 7 |
| Mukofotlar: +XP, nishon toast, reduced-motion | 2 |
| Muharrir: faoliyatlar, nashr, tartib, test/ha-yo'q/krossvord, preview, `CROSSWORD_UNPLACEABLE` belgilash | 8 |
| Vazifa formasi | 9 |
| Tekshirish navbati, baholash/qaytarish, bosh sahifadagi soni | 10 |
| Statistika | 11 |
| i18n uz/ru, xato kodlari, tiplar va kontrakt | 1 va har task |
| Vitest va E2E | foydalanuvchi qarori bilan loyiha oxiriga qoldirildi |
