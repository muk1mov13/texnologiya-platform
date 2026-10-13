import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import type { ReactNode } from 'react'
import { i18n } from '@/i18n'
import { subjectCards, subjectDetail, stepContent, topicDetail } from '@/test/fixtures'
import { server } from '@/test/server'
import { getToasts } from '@/components/ui/toast-store'
import { setAccessToken } from './client'
import { createQueryClient } from './queryClient'
import { studentKeys, useCompleteStep, useMaterialPdf } from './student'
import type { TokenOut } from './types'

function makeWrapper(queryClient: ReturnType<typeof createQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

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

test('useCompleteStep: natija darhol keshga yoziladi, bog\'liq so\'rovlar invalidatsiya qilinadi', async () => {
  const queryClient = createQueryClient()
  const topic = topicDetail()
  // Bosqich hali tugatilmagan holatdan boshlanadi — progress oshishini aniq tekshirish uchun.
  topic.steps = topic.steps.map((s) => (s.id === 101 ? { ...s, status: null } : s))
  topic.progress = { ...topic.progress, completed: 0 }
  const step = stepContent({ status: null })

  queryClient.setQueryData(studentKeys.topic(topic.id), topic)
  queryClient.setQueryData(studentKeys.step(step.id), step)
  queryClient.setQueryData(studentKeys.subjects, subjectCards)
  queryClient.setQueryData(studentKeys.subject(subjectDetail.slug), subjectDetail)
  queryClient.setQueryData(studentKeys.continue, null)

  server.use(
    http.post('/api/steps/:id/complete', () =>
      HttpResponse.json({ id: step.id, kind: step.kind, order: step.order, has_content: true, status: 'completed', rewards: { xp: 0, new_badges: [] } }),
    ),
  )

  const { result } = renderHook(() => useCompleteStep(topic.id), { wrapper: makeWrapper(queryClient) })
  result.current.mutate(step.id)
  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  // Keshga darhol yoziladi — refetch muvaffaqiyatsiz bo'lsa ham holat qayta "ochiq"ga qaytmaydi.
  expect(queryClient.getQueryData<typeof step>(studentKeys.step(step.id))?.status).toBe('completed')
  expect(
    queryClient.getQueryData<typeof topic>(studentKeys.topic(topic.id))?.steps.find((s) => s.id === step.id)?.status,
  ).toBe('completed')
  // Progress halqasi ham patch qilinadi: avval tugatilmagan bo'lgani uchun hisoblagich oshadi.
  expect(queryClient.getQueryData<typeof topic>(studentKeys.topic(topic.id))?.progress.completed).toBe(1)
  // "Tugatdim" toast'i hook darajasida chiqariladi — chaqiruvchi komponentga bog'liq emas.
  expect(getToasts().some((toast) => toast.text === i18n.t('player.completedToast'))).toBe(true)

  // Bog'liq so'rovlar invalidatsiya qilingan: ['subjects'] prefiksi orqali ro'yxat HAM fan
  // tafsiloti (['subjects', slug]) invalidatsiya qilinishini ham tasdiqlaymiz.
  expect(queryClient.getQueryState(studentKeys.topic(topic.id))?.isInvalidated).toBe(true)
  expect(queryClient.getQueryState(studentKeys.step(step.id))?.isInvalidated).toBe(true)
  expect(queryClient.getQueryState(studentKeys.subjects)?.isInvalidated).toBe(true)
  expect(queryClient.getQueryState(studentKeys.subject(subjectDetail.slug))?.isInvalidated).toBe(true)
  expect(queryClient.getQueryState(studentKeys.continue)?.isInvalidated).toBe(true)
})

test('useCompleteStep: allaqachon tugatilgan bosqichda progress hisoblagichi qayta oshmaydi', async () => {
  const queryClient = createQueryClient()
  // Fixture'dagi standart holat: step 101 allaqachon 'completed', progress 1/2.
  const topic = topicDetail()
  const step = stepContent({ status: 'completed' })

  queryClient.setQueryData(studentKeys.topic(topic.id), topic)
  queryClient.setQueryData(studentKeys.step(step.id), step)

  server.use(
    http.post('/api/steps/:id/complete', () =>
      HttpResponse.json({ id: step.id, kind: step.kind, order: step.order, has_content: true, status: 'completed', rewards: { xp: 0, new_badges: [] } }),
    ),
  )

  const { result } = renderHook(() => useCompleteStep(topic.id), { wrapper: makeWrapper(queryClient) })
  result.current.mutate(step.id)
  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(queryClient.getQueryData<typeof topic>(studentKeys.topic(topic.id))?.progress.completed).toBe(1)
})

test('useMaterialPdf: Bearer token bilan so\'raladi, 401 bo\'lsa refresh qilinib qayta yuboriladi', async () => {
  setAccessToken('old-token')
  const bytes = new Uint8Array([9, 8, 7, 6]).buffer
  let secondAuthHeader: string | null = null
  server.use(
    http.post('/api/auth/refresh', () => HttpResponse.json(session)),
    http.get('/api/materials/500/file', ({ request }) => {
      const auth = request.headers.get('Authorization')
      if (auth === 'Bearer old-token') {
        return HttpResponse.json({ code: 'INVALID_TOKEN', message: 'x', details: {} }, { status: 401 })
      }
      secondAuthHeader = auth
      return new HttpResponse(bytes)
    }),
  )

  const queryClient = createQueryClient()
  const { result } = renderHook(() => useMaterialPdf('/api/materials/500/file'), {
    wrapper: makeWrapper(queryClient),
  })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(secondAuthHeader).toBe('Bearer new-token')
  expect(new Uint8Array(result.current.data as ArrayBuffer)).toEqual(new Uint8Array(bytes))
  expect(queryClient.getQueryData(studentKeys.pdf('/api/materials/500/file'))).toBe(result.current.data)
})
