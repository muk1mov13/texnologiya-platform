# 3B-bosqich: AI (frontend) — implementatsiya rejasi

> Bajarish `CLAUDE.md` "Execution Constraints" bo'yicha: subagent yo'q, 3–5 tasklik batch'lar, har task bitta commit + `CHANGELOG.md` yozuvi (o'sha commitda), faqat `main`.
>
> **Foydalanuvchi qarori:** testlar loyiha oxirida. Har task oxirida faqat `npm run lint && npm run typecheck && npm run build`. CI'dagi mavjud test yangi so'rov tufayli yiqilsa, faqat o'sha testga minimal MSW mock qo'shiladi.
>
> Tiplar, API hook'lar, SSE va nozik mantiq quyida to'liq kod bilan. JSX komponentlar props, holat, i18n kalitlari va mavjud namunalar (`ActivitiesTab`, `TaskTab`, `GlossaryTab`, `ReviewDetailPage`, `TeachHomePage`, `AdminUsersPage`) bilan tavsiflanadi; to'liq kodi bajarishda shu namunalar uslubida yoziladi.

**Goal:** Spec `docs/superpowers/specs/2026-10-13-phase-3-ai-design.md` 7-bo'limini qurish: talaba repetitori (pleyer paneli + `/app/tutor`), "✨ AI bilan yaratish" qoralamalari, tekshirish navbatida AI tavsiyasi, o'qituvchi bosh sahifasida haftalik tahlil, admin `/admin/ai`.

**Architecture:**
- API: `api/ai.ts` (talaba/umumiy: usage, suhbatlar, SSE chat), `api/teachAi.ts` (qoralamalar, AI tekshiruv, hisobotlar), `api/adminAi.ts`. `client.ts` dan yangi `apiStream()` — mavjud refresh/401 mantig'ini qayta ishlatadi.
- SSE: `lib/sse.ts` (fetch + `ReadableStream` parser; `EventSource` POST va Bearer'ni qo'llamaydi).
- UI: `features/student/tutor/`, `features/teach/ai/`, `features/teach/AiSuggestionCard.tsx`, `features/teach/WeeklyReport.tsx`, `features/admin/AdminAiPage.tsx`.
- AI o'chiq bo'lsa (`GET /api/ai/usage` → `enabled: false`) barcha AI elementlari yashiriladi; sayt to'liq ishlaydi.

**Tech Stack:** mavjud — React 19, React Router, TanStack Query, react-hook-form + zod, Tailwind v4, react-i18next. Yangi bog'liqlik yo'q.

**Konventsiyalar:** UI matni faqat i18n (`uz.json` + `ru.json` birga); komponent faylidan faqat komponent eksport; zod `schemas.ts` da; `QueryState`; forma ichidagi xatolar `meta: { silent: true }` + `FormError`. AI xato kodlari (`AI_DISABLED`, `AI_BUSY`, `AI_LIMIT_REACHED`, `CONVERSATION_NOT_FOUND`, `AI_DRAFT_*`) `errors.*` da allaqachon bor (`d1274a3`).

---

## Fayl xaritasi

| Fayl | Vazifa |
|---|---|
| `src/api/types.ts` (o'zg.) | AI tiplari |
| `src/api/types.contract.ts` (o'zg.) | AI tiplari kontrakti |
| `src/api/client.ts` (o'zg.) | `apiStream()` |
| `src/lib/sse.ts` (yangi) | SSE parser |
| `src/lib/plainText.ts` (yangi) | `**`/`#` markdown belgilarini olib tashlash |
| `src/lib/useMediaQuery.ts` (yangi) | `useSyncExternalStore` asosida media query |
| `src/api/ai.ts` (yangi) | `aiKeys`, `useAiUsage`, suhbatlar, `streamChat` |
| `src/api/teachAi.ts` (yangi) | qoralamalar, `useAiCheck`, `useAiReports` |
| `src/api/adminAi.ts` (yangi) | sozlamalar, sarf, reindex |
| `src/api/teachAssessment.ts` (o'zg.) | `useSubmission` — `ai_status=pending` da polling |
| `src/features/student/tutor/useTutorChat.ts` (yangi) | chat holati va oqim |
| `src/features/student/tutor/TutorPanel.tsx` (yangi) | xabarlar, manbalar, forma |
| `src/features/student/tutor/TutorDock.tsx` (yangi) | pleyerdagi o'ng panel / mobil bottom sheet |
| `src/features/student/TutorPage.tsx` (yangi) | `/app/tutor` |
| `src/features/teach/assessment/saver.ts` (yangi) | `ActivitySaver`, `TaskSaver` tiplari |
| `ActivityEditor.tsx`, `TaskTab.tsx`, `GlossaryTab.tsx` (o'zg.) | tashqi saver qabul qilish, `TaskForm`/`GlossaryForm` eksport |
| `src/features/teach/ai/draftKinds.ts`, `schemas.ts` (yangi) | turlar, son oraliqlari, zod |
| `src/features/teach/ai/AiDraftsSection.tsx`, `DraftCreateModal.tsx`, `DraftCard.tsx`, `DraftEditor.tsx`, `DraftGlossaryEditor.tsx` (yangi) | qoralamalar UI |
| `src/features/teach/TopicEditorPage.tsx` (o'zg.) | `AiDraftsSection` ni tablar ustiga qo'yish |
| `src/features/teach/AiSuggestionCard.tsx` (yangi), `ReviewDetailPage.tsx` (o'zg.) | AI tavsiyasi |
| `src/features/teach/WeeklyReport.tsx` (yangi), `TeachHomePage.tsx` (o'zg.) | haftalik tahlil |
| `src/features/admin/AdminAiPage.tsx` (yangi) | admin AI |
| `src/app/router.tsx`, `src/app/paths.ts` (o'zg.) | marshrutlar, nav |
| `src/i18n/uz.json`, `ru.json` (o'zg.) | kalitlar |

---

## Task 0: AI tiplari, kontrakt, `apiStream`, SSE va API hook'lari

**Files:** `api/types.ts`, `api/types.contract.ts`, `api/client.ts`, `lib/sse.ts`, `api/ai.ts`, `api/teachAi.ts`, `api/adminAi.ts`, `api/teachAssessment.ts`

- [ ] **Step 1: `types.ts` oxiriga**

```ts
// --- AI (3-bosqich) -----------------------------------------------------------------------

export type MessageMode = 'answer' | 'hint' | 'refusal' | 'canned'
export type MessageRole = 'user' | 'assistant'

export interface Citation {
  n: number
  source_type: string
  source_id: number
  title: string
  page: number | null
}

export interface ConversationBrief {
  id: number
  topic_id: number | null
  title: string
  updated_at: string
}

export interface ChatMessageView {
  id: number
  role: MessageRole
  content: string
  citations: Citation[]
  mode: MessageMode | null
  created_at: string
}

export interface ConversationDetail extends ConversationBrief {
  messages: ChatMessageView[]
}

export interface AiUsageMe {
  used: number
  limit: number | null
  enabled: boolean
}

export interface ChatIn {
  message: string
  topic_id?: number | null
  conversation_id?: number | null
}

/** SSE `meta` hodisasi (OpenAPI'da yo'q — kontraktsiz). */
export interface ChatMeta {
  conversation_id: number
  mode: MessageMode
  citations: Citation[]
}

export type DraftKind = 'quiz' | 'yesno' | 'crossword' | 'glossary' | 'task'
export type DraftStatus = 'generating' | 'draft' | 'approved' | 'rejected' | 'failed'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DraftCreateIn {
  step_id: number
  kind: DraftKind
  material_ids: number[]
  count: number
  difficulty?: Difficulty
}

export interface DraftUpdateIn {
  payload: Record<string, unknown>
}

export interface AiDraft {
  id: number
  topic_id: number
  step_id: number
  kind: DraftKind
  status: DraftStatus
  params: Record<string, unknown>
  payload: Record<string, unknown> | null
  error: string | null
  approved_ref: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AiReport {
  id: number
  subject_id: number
  locale: string
  period_start: string
  period_end: string
  stats: Record<string, unknown>
  content: string
  created_at: string
}

export interface AiSettingsView {
  enabled: boolean
  student_daily_limit: number
  configured: boolean
  provider: string
  chat_model: string
  embedding_model: string
}

export interface AiSettingsUpdate {
  enabled?: boolean | null
  student_daily_limit?: number | null
}

export interface AiUsageDay {
  day: string
  requests: number
  users: number
}

export interface AiUsageStats {
  days: AiUsageDay[]
  chunks: number
  stale_chunks: number
}

export interface ReindexIn {
  all?: boolean
}
```

- [ ] **Step 2: `types.contract.ts`** — `ResponseContract` ga:

```ts
  Check<Receives<T.Citation, S['Citation']>>,
  Check<Receives<T.ConversationBrief, S['ConversationOut']>>,
  Check<Receives<T.ChatMessageView, S['MessageOut']>>,
  Check<Receives<T.ConversationDetail, S['ConversationDetailOut']>>,
  Check<Receives<T.AiUsageMe, S['UsageOut']>>,
  Check<Receives<T.AiDraft, S['DraftOut']>>,
  Check<Receives<T.AiReport, S['AiReportOut']>>,
  Check<Receives<T.AiSettingsView, S['AiSettingsOut']>>,
  Check<Receives<T.AiUsageDay, S['AiUsageDay']>>,
  Check<Receives<T.AiUsageStats, S['AiUsageOut']>>,
```

`RequestContract` ga:

```ts
  Check<Sends<T.ChatIn, S['ChatIn']>>,
  Check<Sends<T.DraftCreateIn, S['DraftCreateIn']>>,
  Check<Sends<T.DraftUpdateIn, S['DraftUpdateIn']>>,
  Check<Sends<T.AiSettingsUpdate, S['AiSettingsUpdate']>>,
  Check<Sends<T.ReindexIn, S['ReindexIn']>>,
```

`typecheck` xato bersa, `types.ts` dagi tip sxemaga moslanadi (sxema emas).

- [ ] **Step 3: `client.ts` oxiriga**

```ts
/** Oqimli javob (SSE): 401 da refresh va xato formati `apiFetch` bilan bir xil, tana o'qilmaydi. */
export function apiStream(path: string, options: RequestOptions = {}): Promise<Response> {
  return request(path, options)
}
```

- [ ] **Step 4: `lib/sse.ts`**

```ts
export interface SseEvent {
  event: string
  data: string
}

/** `text/event-stream` tanasini hodisalarga ajratadi (bo'sh qator — hodisa chegarasi). */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      buffer += value.replace(/\r\n/g, '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        let event = 'message'
        const data: string[] = []
        for (const line of block.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim()
          else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
        }
        if (data.length > 0) yield { event, data: data.join('\n') }
        boundary = buffer.indexOf('\n\n')
      }
    }
  } finally {
    reader.releaseLock()
  }
}
```

- [ ] **Step 5: `api/ai.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { readSse } from '@/lib/sse'
import { ApiError, apiFetch, apiStream } from './client'
import type { AiUsageMe, ChatIn, ChatMeta, ConversationBrief, ConversationDetail } from './types'

export const aiKeys = {
  usage: ['ai', 'usage'] as const,
  conversations: ['ai', 'conversations'] as const,
  conversation: (id: number) => ['ai', 'conversations', id] as const,
}

/** AI yoqilganmi va bugungi sarf. Barcha rollar uchun; AI elementlarini ko'rsatish shu bo'yicha. */
export function useAiUsage() {
  return useQuery({
    queryKey: aiKeys.usage,
    queryFn: ({ signal }) => apiFetch<AiUsageMe>('/api/ai/usage', { signal }),
    staleTime: 60_000,
  })
}

export function useConversations() {
  return useQuery({
    queryKey: aiKeys.conversations,
    queryFn: ({ signal }) => apiFetch<ConversationBrief[]>('/api/ai/conversations', { signal }),
  })
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: aiKeys.conversation(id ?? 0),
    queryFn: ({ signal }) => apiFetch<ConversationDetail>(`/api/ai/conversations/${id}`, { signal }),
    enabled: id !== null,
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/ai/conversations/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiKeys.conversations }),
  })
}

interface ChatHandlers {
  onDelta: (text: string) => void
  onMeta: (meta: ChatMeta) => void
}

/** `POST /api/ai/chat` oqimi. Oldindan xato (429/503) — `ApiError`; oqimdagi `error` ham `ApiError`. */
export async function streamChat(input: ChatIn, handlers: ChatHandlers, signal: AbortSignal): Promise<void> {
  const response = await apiStream('/api/ai/chat', { method: 'POST', json: input, signal })
  if (!response.body) throw new ApiError(503, { code: 'AI_BUSY', message: 'AI_BUSY', details: {} })
  for await (const { event, data } of readSse(response.body)) {
    const payload: unknown = JSON.parse(data)
    if (event === 'delta') handlers.onDelta((payload as { text: string }).text)
    else if (event === 'meta') handlers.onMeta(payload as ChatMeta)
    else if (event === 'error') {
      const body = payload as { code: string; message: string }
      throw new ApiError(503, { code: body.code, message: body.message, details: {} })
    }
  }
}
```

- [ ] **Step 6: `api/teachAi.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { invalidateStudentCaches, teachKeys } from './teach'
import { teachAssessmentKeys } from './teachAssessment'
import type { AiDraft, AiReport, DraftCreateIn } from './types'

export const teachAiKeys = {
  drafts: (topicId: number) => ['teach', 'ai', 'drafts', topicId] as const,
  reports: (subjectId: number) => ['teach', 'ai', 'reports', subjectId] as const,
}

const POLL_MS = 3000

/** Mavzu qoralamalari; `generating` bor ekan har 3 soniyada yangilanadi. */
export function useDrafts(topicId: number) {
  return useQuery({
    queryKey: teachAiKeys.drafts(topicId),
    queryFn: ({ signal }) => apiFetch<AiDraft[]>(`/api/teach/ai/drafts?topic_id=${topicId}`, { signal }),
    refetchInterval: (query) =>
      query.state.data?.some((draft) => draft.status === 'generating') ? POLL_MS : false,
  })
}

function useInvalidateDrafts(topicId: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: teachAiKeys.drafts(topicId) })
}

export function useCreateDraft(topicId: number) {
  const invalidate = useInvalidateDrafts(topicId)
  return useMutation({
    mutationFn: (data: DraftCreateIn) =>
      apiFetch<AiDraft>('/api/teach/ai/drafts', { method: 'POST', json: data }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

export function useUpdateDraft(topicId: number) {
  const invalidate = useInvalidateDrafts(topicId)
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      apiFetch<AiDraft>(`/api/teach/ai/drafts/${id}`, { method: 'PUT', json: { payload } }),
    onSuccess: invalidate,
    meta: { silent: true },
  })
}

/** Tasdiqlash haqiqiy faoliyat/glossariy/vazifa yaratadi — muharrir va talaba keshlari ham yangilanadi. */
export function useApproveDraft(topicId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<AiDraft>(`/api/teach/ai/drafts/${id}/approve`, { method: 'POST' }),
    onSuccess: (draft) => {
      void queryClient.invalidateQueries({ queryKey: teachAiKeys.drafts(topicId) })
      void queryClient.invalidateQueries({ queryKey: teachKeys.topic(topicId) })
      void queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.activities(draft.step_id) })
      void queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.task(draft.step_id) })
      invalidateStudentCaches(queryClient)
    },
  })
}

export function useRejectDraft(topicId: number) {
  const invalidate = useInvalidateDrafts(topicId)
  return useMutation({
    mutationFn: (id: number) => apiFetch<AiDraft>(`/api/teach/ai/drafts/${id}/reject`, { method: 'POST' }),
    onSuccess: invalidate,
  })
}

export function useAiCheck(submissionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/teach/submissions/${submissionId}/ai-check`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teachAssessmentKeys.submission(submissionId) }),
  })
}

export function useAiReports(subjectId: number, enabled: boolean) {
  return useQuery({
    queryKey: teachAiKeys.reports(subjectId),
    queryFn: ({ signal }) => apiFetch<AiReport[]>(`/api/teach/ai/reports?subject_id=${subjectId}`, { signal }),
    enabled,
  })
}
```

Agar `teachAi.ts` ↔ `teachAssessment.ts` import sikli paydo bo'lsa (u holda `teachAssessment` `teachAi` ni import qilmaydi — sikl yo'q), hech narsa qilinmaydi.

- [ ] **Step 7: `api/adminAi.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { aiKeys } from './ai'
import type { AiSettingsUpdate, AiSettingsView, AiUsageStats, ReindexIn } from './types'

export const adminAiKeys = {
  settings: ['admin', 'ai', 'settings'] as const,
  usage: (days: number) => ['admin', 'ai', 'usage', days] as const,
}

export function useAiSettings() {
  return useQuery({
    queryKey: adminAiKeys.settings,
    queryFn: ({ signal }) => apiFetch<AiSettingsView>('/api/admin/ai/settings', { signal }),
  })
}

export function useUpdateAiSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AiSettingsUpdate) =>
      apiFetch<AiSettingsView>('/api/admin/ai/settings', { method: 'PATCH', json: data }),
    onSuccess: (data) => {
      queryClient.setQueryData(adminAiKeys.settings, data)
      void queryClient.invalidateQueries({ queryKey: aiKeys.usage })
    },
    meta: { silent: true },
  })
}

export function useAiUsageStats(days: number) {
  return useQuery({
    queryKey: adminAiKeys.usage(days),
    queryFn: ({ signal }) => apiFetch<AiUsageStats>(`/api/admin/ai/usage?days=${days}`, { signal }),
  })
}

export function useReindex() {
  return useMutation({
    mutationFn: (data: ReindexIn) => apiFetch<{ queued: boolean }>('/api/admin/ai/reindex', { method: 'POST', json: data }),
  })
}
```

- [ ] **Step 8: `teachAssessment.ts` `useSubmission`** ga AI tekshiruvini kuzatish:

```ts
    refetchInterval: (query) => (query.state.data?.ai_status === 'pending' ? 3000 : false),
```

- [ ] **Step 9:** `npm run lint && npm run typecheck && npm run build` → o'tadi.
- [ ] **Step 10:** CHANGELOG yozuvi + commit `feat(frontend): AI API types, hooks and SSE client`.

---

## Task 1: Repetitor holati va paneli

**Files:** `lib/plainText.ts`, `features/student/tutor/useTutorChat.ts`, `features/student/tutor/TutorPanel.tsx`, i18n

- [ ] **Step 1: `lib/plainText.ts`**

```ts
/** LLM javobidagi oddiy markdown belgilarini olib tashlaydi (matn `whitespace-pre-wrap` bilan chiziladi). */
export function plainText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
}
```

- [ ] **Step 2: `useTutorChat.ts`**

```ts
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { aiKeys, streamChat } from '@/api/ai'
import type { ChatMessageView, Citation, ConversationDetail, MessageMode, MessageRole } from '@/api/types'

export interface TutorMessage {
  key: string
  role: MessageRole
  content: string
  mode: MessageMode | null
  citations: Citation[]
  streaming: boolean
}

export const MAX_MESSAGE_CHARS = 1000

function fromView(message: ChatMessageView): TutorMessage {
  return { key: `m-${message.id}`, role: message.role, content: message.content, mode: message.mode, citations: message.citations, streaming: false }
}

/** Bitta suhbat: optimistik talaba xabari, oqimli javob, `meta` dan rejim va manbalar. */
export function useTutorChat(topicId: number | null, initial?: ConversationDetail) {
  const queryClient = useQueryClient()
  const [conversationId, setConversationId] = useState<number | null>(initial?.id ?? null)
  const [messages, setMessages] = useState<TutorMessage[]>(() => initial?.messages.map(fromView) ?? [])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const abortRef = useRef<AbortController | null>(null)
  const seq = useRef(0)

  useEffect(() => () => abortRef.current?.abort(), [])

  const patch = (key: string, change: (message: TutorMessage) => TutorMessage) =>
    setMessages((list) => list.map((message) => (message.key === key ? change(message) : message)))

  async function send(text: string) {
    const message = text.trim()
    if (!message || pending) return
    const controller = new AbortController()
    abortRef.current = controller
    seq.current += 1
    const answerKey = `a-${seq.current}`
    setMessages((list) => [
      ...list,
      { key: `u-${seq.current}`, role: 'user', content: message, mode: null, citations: [], streaming: false },
      { key: answerKey, role: 'assistant', content: '', mode: null, citations: [], streaming: true },
    ])
    setPending(true)
    setError(null)
    try {
      await streamChat(
        { message, topic_id: topicId, conversation_id: conversationId },
        {
          onDelta: (piece) => patch(answerKey, (m) => ({ ...m, content: m.content + piece })),
          onMeta: (meta) => {
            setConversationId(meta.conversation_id)
            patch(answerKey, (m) => ({ ...m, mode: meta.mode, citations: meta.citations }))
          },
        },
        controller.signal,
      )
      patch(answerKey, (m) => ({ ...m, streaming: false }))
    } catch (caught) {
      if (controller.signal.aborted) return
      setMessages((list) => list.filter((m) => m.key !== answerKey))
      setError(caught)
    } finally {
      if (!controller.signal.aborted) {
        setPending(false)
        void queryClient.invalidateQueries({ queryKey: aiKeys.usage })
        void queryClient.invalidateQueries({ queryKey: aiKeys.conversations })
      }
    }
  }

  function reset() {
    abortRef.current?.abort()
    setConversationId(null)
    setMessages([])
    setPending(false)
    setError(null)
  }

  return { messages, conversationId, pending, error, send, reset }
}
```

- [ ] **Step 3: `TutorPanel.tsx`** — `export function TutorPanel({ topicId, initial, onNew }: { topicId: number | null; initial?: ConversationDetail; onNew?: () => void })`
  - `useTutorChat(topicId, initial)`, `useAiUsage()`.
  - Sarlavha: `tutor.title` + qolgan limit: `limit !== null` bo'lsa `tutor.usage` (`{{used}} / {{limit}}`); "Yangi suhbat" tugmasi (`tutor.new`) → `reset()` va `onNew?.()`.
  - Xabarlar ro'yxati `role="log"` `aria-live="polite"`, `overflow-y-auto`, yangi xabarda pastga scroll (`ref.scrollIntoView({ block: 'end' })`).
  - Talaba xabari o'ngda (`bg-brand-50`), javob chapda (`bg-white border`); matn `plainText(content)` bilan, `whitespace-pre-wrap`. `streaming && !content` → `Spinner` + `tutor.thinking`.
  - Rejim belgisi: `hint` → `Badge tone="amber"` `tutor.modeHint`; `refusal` → `Badge tone="slate"` `tutor.modeRefusal`.
  - Manbalar: `citations.length > 0` bo'lsa `tutor.sources` sarlavhasi va `[n] title` + `page !== null` → `tutor.page` (`{{page}}-bet`).
  - Bo'sh holat: `tutor.empty` matni.
  - Forma: `Textarea` (`maxLength={MAX_MESSAGE_CHARS}`, `aria-label={t('tutor.placeholder')}`), Enter — yuborish, Shift+Enter — yangi qator; `Button` `tutor.send`, `loading={pending}`; limit tugagan (`limit !== null && used >= limit`) bo'lsa forma o'chiq va `errors.AI_LIMIT_REACHED` matni. `error` → `FormError`.
- [ ] **Step 4:** i18n `tutor.*` (pastdagi i18n bo'limidan).
- [ ] **Step 5:** lint, typecheck, build; CHANGELOG + commit `feat(frontend): tutor chat panel`.

---

## Task 2: Pleyerda repetitor (o'ng panel / mobil bottom sheet)

**Files:** `lib/useMediaQuery.ts`, `features/student/tutor/TutorDock.tsx`, `features/student/PlayerPage.tsx`, i18n

- [ ] **Step 1: `lib/useMediaQuery.ts`**

```ts
import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
```

- [ ] **Step 2: `TutorDock.tsx`** — `export function TutorDock({ topicId }: { topicId: number })`
  - `useAiUsage()`; `!data?.enabled` → `null` (yuklanayotganda ham `null`).
  - `const wide = useMediaQuery('(min-width: 1024px)')`. Faqat bitta `TutorPanel` chiziladi (holat ikkiga bo'linmasin).
  - `wide`: `<aside aria-label={t('tutor.title')} className="lg:sticky lg:top-20 lg:self-start"><Card className="flex h-[calc(100vh-7rem)] flex-col p-0">` ichida `TutorPanel`.
  - aks holda: `fixed bottom-4 right-4 z-30` tugma (`🤖 {t('tutor.open')}`, `aria-expanded`); ochilganda `fixed inset-x-0 bottom-0 z-40 h-[80vh] rounded-t-3xl bg-white shadow-2xl` panel, `role="dialog" aria-modal="true" aria-label={t('tutor.title')}`, yopish tugmasi (`common.close`), Escape bilan yopiladi, orqa fon `bg-slate-900/40` bosilsa yopiladi. Panel yopilganda ham `TutorPanel` holatini saqlash uchun u `hidden` class bilan yashiriladi, unmount qilinmaydi.
- [ ] **Step 3: `PlayerPage.tsx`** — grid `md:grid-cols-[260px_1fr] lg:grid-cols-[240px_1fr_340px]`; `<section>` dan keyin `<TutorDock topicId={topicId} />`.
- [ ] **Step 4:** i18n `tutor.open`; `common.close` bor-yo'qligini tekshirish, yo'q bo'lsa qo'shish.
- [ ] **Step 5:** lint, typecheck, build; CHANGELOG + commit `feat(frontend): tutor in lesson player`.

---

## Task 3: `/app/tutor` sahifasi

**Files:** `features/student/TutorPage.tsx`, `app/router.tsx`, `app/paths.ts`, i18n

- [ ] **Step 1: `TutorPage.tsx`**
  - `useAiUsage()`: `enabled === false` → `EmptyState icon="🤖" title={t('tutor.disabled')}`.
  - Grid `md:grid-cols-[280px_1fr]`. Chapda `useConversations()` (`QueryState`): "Yangi suhbat" tugmasi (`selected = null`), har suhbat — tugma (`title`, `formatDate(updated_at)` — `lib/datetime.ts` dagi mavjud formatter), tanlangani `aria-current`, yonida o'chirish (`ConfirmDialog`, `tutor.deleteTitle`/`tutor.deleteText`, `useDeleteConversation`; tanlangan o'chsa `selected = null`).
  - O'ngda: `selected === null` → `<TutorPanel key="new" topicId={null} />`; aks holda `useConversation(selected)` → `QueryState` → `<TutorPanel key={data.id} topicId={data.topic_id} initial={data} />`.
  - Yangi suhbat birinchi javobdan keyin ro'yxatda paydo bo'ladi (`useTutorChat` `conversations` ni invalidatsiya qiladi).
- [ ] **Step 2:** `router.tsx`: `{ path: 'app/tutor', element: <TutorPage /> }`. `paths.ts` `navLinksFor`: barcha rollar uchun `{ to: '/app/tutor', label: 'nav.tutor' }` (`/app` dan keyin).
- [ ] **Step 3:** i18n `nav.tutor`, `tutor.conversations`, `tutor.deleteTitle`, `tutor.deleteText`, `tutor.disabled`.
- [ ] **Step 4:** lint, typecheck, build; CHANGELOG + commit `feat(frontend): tutor page with conversations`.

---

## Task 4: Muharrirlarga tashqi saqlash (qoralama tahriri uchun tayyorgarlik)

**Files:** `features/teach/assessment/saver.ts`, `ActivityEditor.tsx`, `TaskTab.tsx`, `GlossaryTab.tsx`

- [ ] **Step 1: `saver.ts`**

```ts
import type { ActivityIn, TaskIn } from '@/api/types'

/** Muharrir qayerga saqlashini tashqaridan berish (masalan, AI qoralamasiga). */
export interface ActivitySaver {
  save: (data: ActivityIn, onError?: (error: unknown) => void) => void
  pending: boolean
  error: unknown
}

export interface TaskSaver {
  save: (data: TaskIn) => void
  pending: boolean
  error: unknown
}
```

- [ ] **Step 2: `ActivityEditor.tsx`**
  - Props: `initial?: ActivityInitial`, yangi `saver?: ActivitySaver`, bu yerda `type ActivityInitial = Pick<ActivityTeach, 'title' | 'items'> & { id?: number }` (fayl ichida, eksport qilinmaydi; `ActivitiesTab` `ActivityTeach` beradi — mos keladi).
  - `useSaveActivity`: hook'lar har doim chaqiriladi, oxirida:

```ts
  const own = { save, pending: mutation.isPending, error: mutation.isError ? mutation.error : null }
  return saver ?? own
```

  (`save` ichida `initial?.id !== undefined` bo'lsa update, aks holda create — qoralama `initial` i id'siz.)
- [ ] **Step 3: `TaskTab.tsx`** — `TaskForm` eksport qilinadi, props: `{ topicId; stepId; task: TaskOut | null; draft?: { initial: TaskIn; saver: TaskSaver } }`. `draft` bo'lsa: `defaultValues` `draft.initial` dan, submit `draft.saver.save(data)`, `pending`/`error` saver'dan, o'chirish tugmasi va `ConfirmDialog` ko'rsatilmaydi.
- [ ] **Step 4: `GlossaryTab.tsx`** — `GlossaryForm` eksport qilinadi; `initial` tipi `Pick<GlossaryTerm, 'term' | 'definition'>` ga kengaytiriladi.
- [ ] **Step 5:** lint, typecheck, build (mavjud xatti-harakat o'zgarmaydi); CHANGELOG + commit `refactor(frontend): editors accept external saver`.

---

## Task 5: "✨ AI bilan yaratish" va qoralamalar

**Files:** `features/teach/ai/draftKinds.ts`, `schemas.ts`, `AiDraftsSection.tsx`, `DraftCreateModal.tsx`, `DraftCard.tsx`, `DraftEditor.tsx`, `DraftGlossaryEditor.tsx`, `TopicEditorPage.tsx`, i18n

- [ ] **Step 1: `draftKinds.ts`**

```ts
import type { DraftKind, StepKind } from '@/api/types'

export const COUNT_RANGE: Record<DraftKind, [number, number]> = {
  quiz: [3, 15],
  yesno: [3, 15],
  crossword: [5, 12],
  glossary: [3, 15],
  task: [1, 1],
}

export const DRAFT_ICONS: Record<DraftKind, string> = { quiz: '📝', yesno: '✅', crossword: '🧩', glossary: '📖', task: '📌' }

/** Bosqich turiga mos qoralama turlari (backend `STEP_FOR_KIND`). */
export function draftKindsFor(step: StepKind): DraftKind[] {
  if (step === 'review' || step === 'practice') return ['quiz', 'yesno', 'crossword']
  if (step === 'glossary') return ['glossary']
  if (step === 'task') return ['task']
  return []
}

export const MAX_DRAFT_MATERIALS = 3
```

- [ ] **Step 2: `schemas.ts`**

```ts
import { z } from 'zod'
import { COUNT_RANGE, MAX_DRAFT_MATERIALS } from './draftKinds'

export const draftCreateSchema = z
  .object({
    kind: z.enum(['quiz', 'yesno', 'crossword', 'glossary', 'task']),
    material_ids: z.array(z.number()).min(1, 'aiDraft.pickMaterial').max(MAX_DRAFT_MATERIALS, 'aiDraft.tooManyMaterials'),
    count: z.number().int(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })
  .superRefine((value, ctx) => {
    const [low, high] = COUNT_RANGE[value.kind]
    if (value.count < low || value.count > high) {
      ctx.addIssue({ code: 'custom', path: ['count'], message: 'aiDraft.countRange' })
    }
  })

export type DraftCreateValues = z.infer<typeof draftCreateSchema>
```

- [ ] **Step 3: `AiDraftsSection.tsx`** — `export function AiDraftsSection({ topic, step }: { topic: TopicEditor; step: StepEditor })`
  - `useAiUsage()`: `!enabled` → `null`. `kinds = draftKindsFor(step.kind)`; bo'sh → `null`.
  - `materials = topic.steps.filter(s => s.kind === 'lecture' || s.kind === 'presentation').flatMap(s => s.materials).filter(m => m.status === 'ready')`.
  - "✨ {t('aiDraft.create')}" tugmasi (`variant="secondary"`) → `DraftCreateModal`.
  - `useDrafts(topic.id)` → `step_id === step.id` va `status` `generating | draft | failed` bo'lganlari → har biri `DraftCard`. Ro'yxat bo'sh bo'lsa hech narsa ko'rsatilmaydi (faqat tugma).
  - Blok `rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-4 mb-4`.
- [ ] **Step 4: `DraftCreateModal.tsx`** — `{ open; onClose; topicId; stepId; kinds; materials: Material[] }`
  - react-hook-form + `draftCreateSchema`; default: `kind = kinds[0]`, `count = COUNT_RANGE[kind][0] === 1 ? 1 : 5`, `difficulty = 'medium'`, `material_ids = materials.length === 1 ? [materials[0].id] : []`.
  - `kinds.length > 1` → `Select` (`aiDraft.kind`, `aiDraft.kinds.<kind>`); kind o'zgarsa `count` oraliqqa siqiladi.
  - Materiallar: checkbox ro'yxati (`title`); `materials.length === 0` → `aiDraft.noMaterials` matni va yuborish o'chiq.
  - `count` — `Input type="number"` (`kind === 'task'` da yashirin); `difficulty` — `Select` (`aiDraft.difficulty.easy|medium|hard`).
  - Yuborish → `useCreateDraft(topicId).mutate({ ...values, step_id: stepId })`, muvaffaqiyatda `pushToast('info', t('aiDraft.started'))` va `onClose()`; xato → `FormError` (`AI_DISABLED`, `AI_BUSY`, `AI_DRAFT_WRONG_STEP`).
- [ ] **Step 5: `DraftCard.tsx`** — `{ draft: AiDraft; topicId: number; stepId: number }`
  - Sarlavha: `DRAFT_ICONS[kind]` + `t('aiDraft.kinds.<kind>')` + `Badge` (`generating` → amber `aiDraft.status.generating`; `draft` → brand; `failed` → red) + vaqt.
  - `generating` → `Spinner` + `aiDraft.generating`.
  - `failed` → `aiDraft.failedText` (+ `draft.error` kodi bo'lsa `errorText` orqali emas, kichik kulrang matn sifatida) va "Yopish" tugmasi (`useRejectDraft`) — ro'yxatdan chiqadi.
  - `draft` → qisqa ko'rinish: `payload.title` (bo'lsa) va elementlar soni `aiDraft.itemCount` (`items.length`); tugmalar: `aiDraft.review` (tahrirni ochadi/yopadi), `aiDraft.approve` (`useApproveDraft`, muvaffaqiyatda `pushToast('success', t('aiDraft.approved'))`), `aiDraft.reject` (`ConfirmDialog` `aiDraft.rejectTitle`/`aiDraft.rejectText` → `useRejectDraft`).
  - Tahrir ochiq → `<DraftEditor draft={draft} topicId stepId onDone={() => setOpen(false)} />`.
- [ ] **Step 6: `DraftEditor.tsx`**

```tsx
  const update = useUpdateDraft(topicId)
  const pending = update.isPending
  const error = update.isError ? update.error : null
  const saveRaw = (payload: Record<string, unknown>, onError?: (e: unknown) => void) =>
    update.mutate({ id: draft.id, payload }, { onSuccess: onDone, onError })
```

  - `quiz | yesno | crossword` → `<ActivityEditor topicId={topicId} stepId={stepId} type={draft.kind} initial={payload as unknown as Pick<ActivityTeach, 'title' | 'items'>} saver={{ save: (data, onError) => saveRaw({ title: data.title, items: data.items }, onError), pending, error }} onDone={onDone} />`
  - `task` → `<TaskForm topicId stepId task={null} draft={{ initial: payload as unknown as TaskIn, saver: { save: (data) => saveRaw({ ...data }), pending, error } }} />` + "Bekor qilish" tugmasi.
  - `glossary` → `<DraftGlossaryEditor items={payload.items} pending error onSave={(items) => saveRaw({ items })} onCancel={onDone} />`.
- [ ] **Step 7: `DraftGlossaryEditor.tsx`** — lokal `useState` ro'yxat (`{ key, term, definition }`); har qator: ko'rinish rejimi (atama — ta'rif, "Tahrirlash", "O'chirish") yoki `GlossaryForm` (`submitLabel={t('common.save')}`, qatorni yangilaydi); pastda "Saqlash" (`onSave`) va "Bekor qilish"; `error` → `FormError`.
- [ ] **Step 8: `TopicEditorPage.tsx`** — `TabPanel` ichida, tab kontentidan oldin: `step && draftKindsFor(step.kind).length > 0 && <AiDraftsSection topic={data} step={step} />`. (`glossary` tabida ham `step` bor — `data.steps` da glossary bosqichi mavjud.)
- [ ] **Step 9:** i18n `aiDraft.*`.
- [ ] **Step 10:** lint, typecheck, build; CHANGELOG + commit `feat(frontend): AI drafts in topic editor`.

---

## Task 6: Tekshirish navbatida AI tavsiyasi

**Files:** `features/teach/AiSuggestionCard.tsx`, `features/teach/ReviewDetailPage.tsx`, i18n

- [ ] **Step 1: `AiSuggestionCard.tsx`** — `{ detail: SubmissionDetail }`
  - `useAiUsage()`: `!enabled && detail.ai_status === 'none'` → `null`.
  - `Card` sarlavhasi `✨ {t('aiReview.title')}`.
  - `none` → `aiReview.none` + tugma `aiReview.check`.
  - `pending` → `Spinner` + `aiReview.pending` (sahifa `useSubmission` polling bilan yangilanadi).
  - `done` → `aiReview.score` (`{{score}} / {{max}}`), `ai_feedback.feedback`, `aiReview.strengths` ro'yxati, `aiReview.issues` ro'yxati; ostida kulrang `aiReview.notice` ("Ball avtomatik qo'yilmaydi").
  - `unsupported` → `aiReview.unsupported`; `failed` → `aiReview.failed`.
  - `pending` dan boshqa holatlarda (`none`dan tashqari) `aiReview.recheck` tugmasi — `useAiCheck(detail.id)`; AI o'chiq bo'lsa tugma ko'rsatilmaydi.
- [ ] **Step 2: `ReviewDetailPage.tsx`** — `ReviewBody` da baholash formasi/natijasidan oldin `<AiSuggestionCard detail={detail} />`.
- [ ] **Step 3:** i18n `aiReview.*`.
- [ ] **Step 4:** lint, typecheck, build; CHANGELOG + commit `feat(frontend): AI suggestion on review page`.

---

## Task 7: O'qituvchi bosh sahifasida haftalik tahlil

**Files:** `features/teach/WeeklyReport.tsx`, `features/teach/TeachHomePage.tsx`, i18n

- [ ] **Step 1: `WeeklyReport.tsx`** — `{ subjectId: number }`
  - `useAiUsage()`; `useAiReports(subjectId, Boolean(usage.data?.enabled))`.
  - Yo'q, bo'sh yoki xato → `null` (bosh sahifani buzmaydi).
  - Oxirgisi (`data[0]`): `<details className="rounded-2xl border-2 border-brand-100 bg-brand-50/50 p-4">`, `<summary>` — `📊 {t('aiReport.title', { from, to })}` (`period_start`/`period_end` `lib/datetime.ts` formatteri bilan); ichida `plainText(content)`, `whitespace-pre-wrap`.
- [ ] **Step 2: `TeachHomePage.tsx`** — `SubjectTopics` kartasida sarlavhadan keyin `<WeeklyReport subjectId={subject.id} />`.
- [ ] **Step 3:** i18n `aiReport.title`.
- [ ] **Step 4:** lint, typecheck, build; CHANGELOG + commit `feat(frontend): weekly AI report on teacher home`.

---

## Task 8: Admin `/admin/ai`

**Files:** `features/admin/AdminAiPage.tsx`, `features/admin/schemas.ts`, `app/router.tsx`, `app/paths.ts`, i18n

- [ ] **Step 1: `schemas.ts` ga**

```ts
export const aiSettingsSchema = z.object({
  enabled: z.boolean(),
  student_daily_limit: z.number().int().min(0, 'adminAi.limitRange').max(500, 'adminAi.limitRange'),
})
export type AiSettingsValues = z.infer<typeof aiSettingsSchema>
```

- [ ] **Step 2: `AdminAiPage.tsx`** — `h1` `adminAi.title`, uchta `Card`:
  1. **Sozlamalar** (`useAiSettings` → `QueryState`): `configured=false` → amber ogohlantirish `adminAi.notConfigured`; ma'lumot qatorlari `provider`, `chat_model`, `embedding_model`; forma: checkbox `adminAi.enabled`, `Input type="number"` `adminAi.dailyLimit` (`hint` `adminAi.dailyLimitHint`), saqlash → `useUpdateAiSettings`, muvaffaqiyatda `pushToast('success', t('adminAi.saved'))`, xato `FormError`.
  2. **Sarf** (`useAiUsageStats(days)`, `days` — `Select` 7/30/90, default 30): jami so'rovlar; jadval `adminAi.day` / `adminAi.requests` / `adminAi.users`, har qatorda so'rovlar soniga proporsional `div` chiziq (`style={{ width: \`${(r / max) * 100}%\` }}`, `aria-hidden`); bo'sh → `adminAi.noUsage`; pastda `adminAi.chunks` (`{{chunks}}`) va `stale_chunks > 0` → amber `adminAi.stale`.
  3. **Indeks**: `adminAi.reindexText`; tugmalar `adminAi.reindexStale` (`useReindex().mutate({ all: false })`) va `adminAi.reindexAll` (`ConfirmDialog` `adminAi.reindexAllTitle`/`adminAi.reindexAllText` → `{ all: true }`); muvaffaqiyat → `pushToast('info', t('adminAi.queued'))`.
  - Pastda maxfiylik ogohlantirishi `adminAi.privacy` (kulrang kichik matn, `ℹ️`).
- [ ] **Step 3:** `router.tsx` admin bolalariga `{ path: 'admin/ai', element: <AdminAiPage /> }`; `paths.ts` admin nav'ga `{ to: '/admin/ai', label: 'nav.adminAi' }`.
- [ ] **Step 4:** i18n `nav.adminAi`, `adminAi.*`.
- [ ] **Step 5:** lint, typecheck, build; CHANGELOG + commit `feat(frontend): admin AI page`.

---

## Task 9: Hujjatlar, `gen:api` tekshiruvi va qo'lda smoke

- [ ] `npm run gen:api` → `git diff --exit-code src/api/schema.gen.ts` (farq yo'q).
- [ ] Qo'lda (backend `e2e/start-backend.mjs` port 8011 + `vite` proxy shu portga yoki odatiy 8000): spec 9-bo'lim mezonlari brauzerda — repetitor rad etadi va `[n]` manbalarni ko'rsatadi; yechilmagan test savolida `hint`; qoralama → tasdiqlash → nashr qilinmagan faoliyat; tekshirish sahifasida AI tavsiyasi; `weekly-report` dan keyin bosh sahifada tahlil; `GEMINI_API_KEY` siz AI elementlari ko'rinmaydi va sahifalar xatosiz. 375px kenglikda bottom sheet.
- [ ] `CLAUDE.md` "Architecture (frontend)" ga AI bandi (`api/ai.ts`/`teachAi.ts`/`adminAi.ts`, `apiStream` + `lib/sse.ts`, `useTutorChat`, saver naqshi, `useAiUsage().enabled` bilan yashirish); loyiha holati: 3B qurilgan.
- [ ] Roadmap: 3-bosqich ✅ (testlar oxirida); keyingisi — 4-bosqich mini-spec.
- [ ] CHANGELOG + commit `docs: close phase 3B frontend`. Push — foydalanuvchi so'raganda.

---

## i18n kalitlari (uz / ru)

`nav`: `tutor` "AI repetitor" / "AI-репетитор"; `adminAi` "AI sozlamalari" / "Настройки AI".
`common.close` (yo'q bo'lsa): "Yopish" / "Закрыть".

`tutor`:
| kalit | uz | ru |
|---|---|---|
| title | AI repetitor | AI-репетитор |
| open | Repetitor | Репетитор |
| new | Yangi suhbat | Новый диалог |
| usage | Bugun: {{used}} / {{limit}} | Сегодня: {{used}} / {{limit}} |
| empty | Mavzu bo'yicha savol bering — javob dars materiallaridan olinadi. | Задайте вопрос по теме — ответ берётся из материалов урока. |
| placeholder | Savolingizni yozing… | Напишите вопрос… |
| send | Yuborish | Отправить |
| thinking | O'ylayapti… | Думает… |
| modeHint | 💡 Maslahat: javobni o'zingiz toping | 💡 Подсказка: найдите ответ сами |
| modeRefusal | Mavzudan tashqari | Вне темы |
| sources | Manbalar | Источники |
| page | {{page}}-bet | стр. {{page}} |
| conversations | Suhbatlar | Диалоги |
| deleteTitle | Suhbatni o'chirish | Удалить диалог |
| deleteText | "{{title}}" suhbati o'chiriladi. | Диалог «{{title}}» будет удалён. |
| disabled | AI repetitor hozircha o'chirilgan | AI-репетитор сейчас отключён |

`aiDraft`:
| kalit | uz | ru |
|---|---|---|
| create | AI bilan yaratish | Создать с AI |
| modalTitle | AI bilan yaratish | Создание с AI |
| kind | Turi | Тип |
| kinds.quiz / yesno / crossword / glossary / task | Test / Ha yoki yo'q / Krossvord / Glossariy / Vazifa | Тест / Да или нет / Кроссворд / Глоссарий / Задание |
| materials | Materiallar (3 tagacha) | Материалы (до 3) |
| noMaterials | Avval ma'ruza yoki taqdimot faylini yuklang. | Сначала загрузите файл лекции или презентации. |
| pickMaterial | Kamida bitta material tanlang | Выберите хотя бы один материал |
| tooManyMaterials | Ko'pi bilan 3 ta material | Не более 3 материалов |
| count | Soni | Количество |
| countRange | Son ruxsat etilgan oraliqda emas | Количество вне допустимого диапазона |
| difficultyLabel | Qiyinlik | Сложность |
| difficulty.easy / medium / hard | Oson / O'rtacha / Qiyin | Лёгкий / Средний / Сложный |
| submit | Yaratish | Создать |
| started | Qoralama yaratilmoqda… | Черновик создаётся… |
| status.generating / draft / failed | Yaratilmoqda / Qoralama / Xato | Создаётся / Черновик / Ошибка |
| generating | AI materialni o'qib, qoralama tayyorlamoqda… | AI читает материал и готовит черновик… |
| failedText | Qoralama yaratilmadi. Birozdan so'ng qayta urinib ko'ring. | Не удалось создать черновик. Попробуйте позже. |
| dismiss | Yopish | Закрыть |
| itemCount | {{count}} ta element | Элементов: {{count}} |
| review | Ko'rish va tahrirlash | Просмотреть и изменить |
| approve | Tasdiqlash | Утвердить |
| approved | Qoralama tasdiqlandi va nashr qilinmagan holda qo'shildi | Черновик утверждён и добавлен неопубликованным |
| reject | Rad etish | Отклонить |
| rejectTitle | Qoralamani rad etish | Отклонить черновик |
| rejectText | Qoralama o'chiriladi va qayta tiklanmaydi. | Черновик будет удалён без возможности восстановления. |

`aiReview`:
| kalit | uz | ru |
|---|---|---|
| title | AI tavsiyasi | Рекомендация AI |
| none | AI hali tekshirmagan. | AI ещё не проверял. |
| check | AI bilan tekshirish | Проверить с AI |
| recheck | Qayta tekshirish | Проверить заново |
| pending | AI tekshirmoqda… | AI проверяет… |
| score | Taklif qilingan ball: {{score}} / {{max}} | Предлагаемый балл: {{score}} / {{max}} |
| strengths | Kuchli tomonlar | Сильные стороны |
| issues | Kamchiliklar | Недостатки |
| notice | Bu faqat tavsiya: ballni o'qituvchi qo'yadi. | Это лишь рекомендация: балл ставит преподаватель. |
| unsupported | AI bu turdagi javobni o'qiy olmaydi (rasm yoki skan). | AI не может прочитать такой ответ (изображение или скан). |
| failed | AI tekshira olmadi. Qayta urinib ko'ring. | AI не смог проверить. Попробуйте ещё раз. |

`aiReport.title`: "Haftalik AI tahlili ({{from}} – {{to}})" / "Еженедельный AI-анализ ({{from}} – {{to}})".

`adminAi`:
| kalit | uz | ru |
|---|---|---|
| title | AI sozlamalari | Настройки AI |
| settings | Sozlamalar | Настройки |
| notConfigured | AI kaliti sozlanmagan (GEMINI_API_KEY). AI funksiyalari ishlamaydi. | Ключ AI не настроен (GEMINI_API_KEY). Функции AI не работают. |
| provider | Provayder | Провайдер |
| chatModel | Chat modeli | Модель чата |
| embeddingModel | Embedding modeli | Модель эмбеддингов |
| enabled | AI yoqilgan | AI включён |
| dailyLimit | Talaba uchun kunlik limit | Дневной лимит для студента |
| dailyLimitHint | 0–500 so'rov; o'qituvchi va admin uchun limit yo'q | 0–500 запросов; для преподавателя и админа без лимита |
| limitRange | 0 dan 500 gacha | От 0 до 500 |
| saved | Sozlamalar saqlandi | Настройки сохранены |
| usage | Sarf | Использование |
| days | {{count}} kun | {{count}} дн. |
| total | Jami so'rovlar: {{count}} | Всего запросов: {{count}} |
| day | Kun | День |
| requests | So'rovlar | Запросы |
| users | Foydalanuvchilar | Пользователи |
| noUsage | Bu davrda so'rovlar yo'q | За этот период запросов нет |
| chunks | Indeksdagi bo'laklar: {{chunks}} | Фрагментов в индексе: {{chunks}} |
| stale | Eskirgan bo'laklar: {{count}} — indeksni qayta quring | Устаревших фрагментов: {{count}} — перестройте индекс |
| index | Indeks | Индекс |
| reindexText | Embedding modeli o'zgarsa yoki qidiruv yomonlashsa, indeksni qayta quring. | Перестройте индекс, если сменилась модель эмбеддингов или ухудшился поиск. |
| reindexStale | Eskirganlarini qayta qurish | Перестроить устаревшие |
| reindexAll | Hammasini qayta qurish | Перестроить всё |
| reindexAllTitle | Butun indeksni qayta qurish | Перестроить весь индекс |
| reindexAllText | Barcha materiallar qayta indekslanadi; bu provayder limitini sarflaydi va vaqt oladi. | Все материалы будут переиндексированы; это расходует лимит провайдера и занимает время. |
| queued | Navbatga qo'yildi | Поставлено в очередь |
| privacy | AI'ga ism, email, telefon va fayl nomlari yuborilmaydi. Dars materiallari, savollar va talaba javoblari matni tashqi provayderga (Google Gemini, Groq) yuboriladi. | Имена, email, телефоны и имена файлов в AI не передаются. Тексты материалов, вопросов и ответов студентов отправляются внешнему провайдеру (Google Gemini, Groq). |

---

## Spec 7-bo'limi bilan solishtirish

| Spec talabi | Task |
|---|---|
| Repetitor pleyerning o'ng panelida, telefonda bottom sheet | 2 |
| `/app/tutor` suhbatlar ro'yxati bilan | 3 |
| Oqimli javob, `[n]` manba nomi va sahifasi | 0 (SSE), 1 |
| Maslahat va rad rejimlari belgisi, qolgan limit | 1 |
| `AI_DISABLED` da panel yashirinadi | 1–3, 5–8 (`useAiUsage().enabled`) |
| "✨ AI bilan yaratish" faoliyat, glossariy, vazifa tablarida; materiallar/son/qiyinlik | 5 |
| Qoralamalar ro'yxati, `generating` polling | 0 (`useDrafts`), 5 |
| Mavjud `ActivityEditor`/glossariy/vazifa formalari bilan tahrir, tasdiqlash/rad | 4, 5 |
| AI tavsiyasi kartasi + qayta tekshirish, ball avtomatik emas | 6 |
| O'qituvchi bosh sahifasida haftalik tahlil | 7 |
| Admin: sozlamalar, sarf jadvali, reindex, maxfiylik ogohlantirishi | 8 |

## Batch'lar
- **Batch 1:** Task 0, 1, 2 (API + repetitor pleyerda).
- **Batch 2:** Task 3, 4, 5 (tutor sahifasi, qoralamalar).
- **Batch 3:** Task 6, 7, 8, 9 (AI tavsiyasi, tahlil, admin, yakun).

## Loyiha oxirida yoziladigan testlar (eslatma)
- `lib/sse.test.ts`: bo'laklarga bo'lingan oqim, `\r\n`, ko'p qatorli `data`.
- `useTutorChat`: optimistik xabar, `delta`+`meta`, `error` hodisasi xabarni olib tashlaydi, `AI_LIMIT_REACHED`.
- `TutorDock`: `enabled=false` da chizilmaydi; mobil/desktop.
- `AiDraftsSection`/`DraftCard`: polling, tasdiqlash invalidatsiyasi, glossariy tahriri.
- `AiSuggestionCard` holatlari; `AdminAiPage` forma va reindex.
- E2E: repetitor (`AI_PROVIDER=fake`) va qoralama → tasdiqlash oqimi.

## Tekshirish
- Har task: `npm run lint && npm run typecheck && npm run build`.
- Task 9: `gen:api` farqsiz; brauzerda spec 9-bo'lim mezonlari; 375px.
