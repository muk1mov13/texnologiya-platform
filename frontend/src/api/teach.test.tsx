import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import type { ReactNode } from 'react'
import { getToasts } from '@/components/ui/toast-store'
import { server } from '@/test/server'
import { ApiError } from './client'
import { createQueryClient } from './queryClient'
import { studentKeys } from './student'
import {
  hasProcessing,
  teachKeys,
  useCreateTopic,
  useDeleteMaterial,
  useDeleteTopic,
  useEditorTopic,
  useGlossaryMutations,
  useLiteratureMutations,
  useRetryMaterial,
  useUploadMaterial,
} from './teach'
import type { GlossaryTerm, LiteratureItem, Material, TopicEditor } from './types'

function makeWrapper(queryClient: ReturnType<typeof createQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function topicWith(statuses: Array<'processing' | 'ready' | 'failed'>): TopicEditor {
  return {
    id: 1,
    subject_id: 1,
    lesson_type: 'lecture',
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

test("processing material bo'lsa polling yoqiladi", () => {
  expect(hasProcessing(topicWith(['ready', 'processing']))).toBe(true)
})

test("hamma material tayyor yoki xato bo'lsa polling o'chadi", () => {
  expect(hasProcessing(topicWith(['ready', 'failed']))).toBe(false)
  expect(hasProcessing(undefined)).toBe(false)
})

test("useEditorTopic: processing dan ready'ga o'tgach polling to'xtaydi", async () => {
  vi.useFakeTimers()
  try {
    let calls = 0
    server.use(
      http.get('/api/teach/topics/1', () => {
        calls += 1
        return HttpResponse.json(topicWith([calls === 1 ? 'processing' : 'ready']))
      }),
    )
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useEditorTopic(1), { wrapper: makeWrapper(queryClient) })
    await vi.advanceTimersByTimeAsync(0)
    expect(calls).toBe(1)
    expect(result.current.data?.steps[0].materials[0].status).toBe('processing')
    // ~2 soniyadan keyin (kichik bufer bilan — so'rov o'zi ham fake vaqtni bir oz oldinga
    // suradi) ikkinchi so'rov yuborilishi va natija 'ready'ga o'tishi kerak.
    await vi.advanceTimersByTimeAsync(2500)
    expect(calls).toBe(2)
    expect(result.current.data?.steps[0].materials[0].status).toBe('ready')
    // Hammasi tayyor — yana 10 soniya o'tsa ham qayta so'rov yuborilmaydi.
    await vi.advanceTimersByTimeAsync(10_000)
    expect(calls).toBe(2)
  } finally {
    vi.useRealTimers()
  }
})

test("useEditorTopic: so'rov xato bo'lsa polling to'xtaydi", async () => {
  vi.useFakeTimers()
  try {
    let calls = 0
    server.use(
      http.get('/api/teach/topics/1', () => {
        calls += 1
        return HttpResponse.json({ code: 'HTTP_500', message: 'x', details: {} }, { status: 500 })
      }),
    )
    const queryClient = createQueryClient()
    queryClient.setDefaultOptions({ queries: { retry: false } })
    const { result } = renderHook(() => useEditorTopic(1), { wrapper: makeWrapper(queryClient) })
    await vi.advanceTimersByTimeAsync(0)
    expect(result.current.isError).toBe(true)
    expect(calls).toBe(1)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(calls).toBe(1)
  } finally {
    vi.useRealTimers()
  }
})

test('useCreateTopic: muharrir keshini darhol to\'ldiradi', async () => {
  const queryClient = createQueryClient()
  // Invalidatsiyani kuzatish uchun ikkala kalit oldindan (bo'sh) ma'lumot bilan urug'lanadi —
  // `invalidateQueries` hali umuman so'ralmagan so'rov uchun holat yaratmaydi.
  queryClient.setQueryData(teachKeys.subjects, [])
  queryClient.setQueryData(studentKeys.subjects, [])
  const created: TopicEditor = {
    id: 12,
    subject_id: 1,
    lesson_type: 'lecture',
    title: 'Uchinchi',
    summary: '',
    order: 3,
    is_published: false,
    steps: [],
    glossary: [],
    literature: [],
  }
  server.use(http.post('/api/teach/subjects/1/topics', () => HttpResponse.json(created, { status: 201 })))
  const { result } = renderHook(() => useCreateTopic(1), { wrapper: makeWrapper(queryClient) })
  result.current.mutate({ title: 'Uchinchi' })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(queryClient.getQueryData(teachKeys.topic(12))).toEqual(created)
  expect(queryClient.getQueryState(teachKeys.subjects)?.isInvalidated).toBe(true)
  expect(queryClient.getQueryState(studentKeys.subjects)?.isInvalidated).toBe(true)
})

test("useDeleteTopic: o'chirilgan mavzu muharriri keshdan olib tashlanadi", async () => {
  const queryClient = createQueryClient()
  queryClient.setQueryData(teachKeys.topic(11), topicWith(['ready']))
  server.use(http.delete('/api/teach/topics/11', () => new HttpResponse(null, { status: 204 })))
  const { result } = renderHook(() => useDeleteTopic(), { wrapper: makeWrapper(queryClient) })
  result.current.mutate(11)
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(queryClient.getQueryState(teachKeys.topic(11))).toBeUndefined()
})

test("useUploadMaterial: multipart maydonlari yuboriladi, xato bo'lsa toast chiqmaydi (silent)", async () => {
  // Izoh: haqiqiy MSW tarmoq so'rovi orqali FormData+File yuborish bu muhitda (jsdom Blob/File
  // + undici fetch) "content-length mismatch" xatosiga olib keladi — bu ma'lum jsdom/undici
  // moslik muammosi, kodimizdagi xato emas. Shu sabab global `fetch` to'g'ridan-to'g'ri
  // josuslanadi (tarmoqga chiqmasdan), bu esa yuborilgan FormData maydonlari va headerlarni
  // tekshirish imkonini beradi. Mock faqat javob qaytaradi — tekshiruvlar test tanasida: mock
  // ichidagi `expect` yiqilsa, xato fetch rad etilishiga aylanib, `isError` kutilgan holatda
  // test baribir o'tib ketardi.
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({ code: 'UNSUPPORTED_FILE_TYPE', message: "Fayl turi qo'llab-quvvatlanmaydi", details: {} }),
      { status: 400 },
    ),
  )
  try {
    const queryClient = createQueryClient()
    const { result } = renderHook(() => useUploadMaterial(1), { wrapper: makeWrapper(queryClient) })
    const file = new File(['x'], 'lecture.pptx', { type: 'application/vnd.ms-powerpoint' })
    result.current.mutate({ stepId: 10, title: "Ma'ruza", file })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [input, init] = fetchSpy.mock.calls[0]
    expect(input).toBe('/api/teach/steps/10/materials')
    expect(init?.method).toBe('POST')
    const form = init?.body
    expect(form).toBeInstanceOf(FormData)
    if (!(form instanceof FormData)) throw new Error('body FormData emas')
    expect(form.get('title')).toBe("Ma'ruza")
    const sentFile = form.get('file')
    expect(sentFile).toBeInstanceOf(File)
    expect(sentFile instanceof File ? sentFile.name : null).toBe('lecture.pptx')
    // Content-Type qo'lda o'rnatilmaydi — multipart boundary'ni brauzer o'zi qo'yadi.
    expect(new Headers(init?.headers).get('Content-Type')).toBeNull()

    expect(result.current.error).toBeInstanceOf(ApiError)
    expect(result.current.error instanceof ApiError ? result.current.error.code : null).toBe('UNSUPPORTED_FILE_TYPE')
    expect(getToasts()).toHaveLength(0)
  } finally {
    fetchSpy.mockRestore()
  }
})

test('useRetryMaterial va useDeleteMaterial: muharrir mavzusi va talaba bosqichi invalidatsiya qilinadi', async () => {
  const queryClient = createQueryClient()
  queryClient.setQueryData(teachKeys.topic(1), topicWith(['failed']))
  queryClient.setQueryData(studentKeys.step(10), {})
  const retried: Material = {
    id: 1,
    step_id: 10,
    title: 'M0',
    original_name: 'a.pptx',
    page_count: null,
    status: 'processing',
    error: null,
  }
  server.use(
    http.post('/api/teach/materials/1/retry', () => HttpResponse.json(retried)),
    http.delete('/api/teach/materials/2', () => new HttpResponse(null, { status: 204 })),
  )
  const { result: retry } = renderHook(() => useRetryMaterial(1), { wrapper: makeWrapper(queryClient) })
  retry.current.mutate(1)
  await waitFor(() => expect(retry.current.isSuccess).toBe(true))
  expect(queryClient.getQueryState(teachKeys.topic(1))?.isInvalidated).toBe(true)
  expect(queryClient.getQueryState(studentKeys.step(10))?.isInvalidated).toBe(true)

  queryClient.setQueryData(teachKeys.topic(1), topicWith(['ready']))
  queryClient.setQueryData(studentKeys.step(10), {})
  const { result: remove } = renderHook(() => useDeleteMaterial(1), { wrapper: makeWrapper(queryClient) })
  remove.current.mutate(2)
  await waitFor(() => expect(remove.current.isSuccess).toBe(true))
  expect(queryClient.getQueryState(teachKeys.topic(1))?.isInvalidated).toBe(true)
  expect(queryClient.getQueryState(studentKeys.step(10))?.isInvalidated).toBe(true)
})

test("useGlossaryMutations: to'g'ri manzil/metodlar bilan ishlaydi va mavzuni invalidatsiya qiladi", async () => {
  const queryClient = createQueryClient()
  queryClient.setQueryData(teachKeys.topic(1), topicWith(['ready']))
  queryClient.setQueryData(studentKeys.step(16), {})
  const term: GlossaryTerm = { id: 5, term: 'A', definition: 'B', order: 1 }
  let addPath = ''
  let updatePath = ''
  let updateMethod = ''
  let removePath = ''
  let removeMethod = ''
  server.use(
    http.post('/api/teach/topics/1/glossary', ({ request }) => {
      addPath = new URL(request.url).pathname
      return HttpResponse.json(term, { status: 201 })
    }),
    http.patch('/api/teach/topics/1/glossary/5', ({ request }) => {
      updatePath = new URL(request.url).pathname
      updateMethod = request.method
      return HttpResponse.json(term)
    }),
    http.delete('/api/teach/topics/1/glossary/5', ({ request }) => {
      removePath = new URL(request.url).pathname
      removeMethod = request.method
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const { result } = renderHook(() => useGlossaryMutations(1), { wrapper: makeWrapper(queryClient) })
  result.current.add.mutate({ term: 'A', definition: 'B' })
  await waitFor(() => expect(result.current.add.isSuccess).toBe(true))
  expect(addPath).toBe('/api/teach/topics/1/glossary')
  expect(queryClient.getQueryState(teachKeys.topic(1))?.isInvalidated).toBe(true)
  // Talaba glossariy bosqichini `['steps', id]` keshidan ko'radi — u ham yangilanishi kerak.
  expect(queryClient.getQueryState(studentKeys.step(16))?.isInvalidated).toBe(true)

  result.current.update.mutate({ id: 5, data: { definition: 'C' } })
  await waitFor(() => expect(result.current.update.isSuccess).toBe(true))
  expect(updatePath).toBe('/api/teach/topics/1/glossary/5')
  expect(updateMethod).toBe('PATCH')

  result.current.remove.mutate(5)
  await waitFor(() => expect(result.current.remove.isSuccess).toBe(true))
  expect(removePath).toBe('/api/teach/topics/1/glossary/5')
  expect(removeMethod).toBe('DELETE')
})

test("useLiteratureMutations: to'g'ri manzildan foydalanadi", async () => {
  const queryClient = createQueryClient()
  const item: LiteratureItem = { id: 7, title: 'Kitob', author: 'Muallif', year: 2020, url: null, order: 1 }
  let addPath = ''
  server.use(
    http.post('/api/teach/topics/1/literature', ({ request }) => {
      addPath = new URL(request.url).pathname
      return HttpResponse.json(item, { status: 201 })
    }),
  )
  const { result } = renderHook(() => useLiteratureMutations(1), { wrapper: makeWrapper(queryClient) })
  result.current.add.mutate({ title: 'Kitob', author: 'Muallif', year: 2020, url: null })
  await waitFor(() => expect(result.current.add.isSuccess).toBe(true))
  expect(addPath).toBe('/api/teach/topics/1/literature')
})
