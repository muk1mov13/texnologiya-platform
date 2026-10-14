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
      { id: 10, title: 'Birinchi mavzu', order: 1, lesson_type: 'lecture', is_published: true },
      { id: 11, title: 'Ikkinchi mavzu', order: 2, lesson_type: 'lecture', is_published: false },
    ],
  },
]

const routes = [
  { path: '/teach', element: <TeachHomePage /> },
  { path: '/teach/topics/:topicId', element: <p>muharrir</p> },
]

/** 3 mavzuli fan — fokus testlarida chegara bo'lmagan (o'rtadagi) surishlarni tekshirish uchun. */
function threeTopicSubjects(ids: number[]): TeachSubject[] {
  const byId: Record<number, { title: string; is_published: boolean }> = {
    10: { title: 'Birinchi mavzu', is_published: true },
    11: { title: 'Ikkinchi mavzu', is_published: false },
    12: { title: 'Uchinchi mavzu', is_published: false },
  }
  return [
    {
      id: 1,
      title: "Kasb ta'limi metodikasi",
      slug: 'kasb',
      is_published: true,
      topics: ids.map((id, index) => ({ id, order: index + 1, lesson_type: 'lecture' as const, ...byId[id] })),
    },
  ]
}

test("mavzular tartib va holat bilan ko'rsatiladi", async () => {
  server.use(http.get('/api/teach/subjects', () => HttpResponse.json(subjects)))
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  const first = await screen.findByRole('link', { name: 'Birinchi mavzu' })
  expect(first).toHaveAttribute('href', '/teach/topics/10')
  expect(screen.getByText(i18n.t('common.draft'))).toBeInTheDocument()
})

test("↓ tugmasi yangi tartibni yuboradi", async () => {
  let body: unknown = null
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.put('/api/teach/subjects/1/topics/order', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json([])
    }),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('teach.moveDown', { title: 'Birinchi mavzu' }) }),
  )
  await waitFor(() => expect(body).toEqual({ topic_ids: [11, 10] }))
})

test("birinchi elementning ↑ va oxirgisining ↓ tugmasi o'chirilgan", async () => {
  server.use(http.get('/api/teach/subjects', () => HttpResponse.json(subjects)))
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  const upFirst = await screen.findByRole('button', { name: i18n.t('teach.moveUp', { title: 'Birinchi mavzu' }) })
  const downLast = screen.getByRole('button', { name: i18n.t('teach.moveDown', { title: 'Ikkinchi mavzu' }) })
  expect(upFirst).toBeDisabled()
  expect(downLast).toBeDisabled()
})

test('tartiblash xato qaytarsa, holat tiklanadi va xabar chiqadi', async () => {
  let getCalls = 0
  server.use(
    http.get('/api/teach/subjects', () => {
      getCalls += 1
      return HttpResponse.json(subjects)
    }),
    http.put('/api/teach/subjects/1/topics/order', () =>
      HttpResponse.json(
        { code: 'INVALID_ORDER', message: "Mavzular ro'yxati fan mavzulariga mos emas", details: {} },
        { status: 400 },
      ),
    ),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  const downButton = await screen.findByRole('button', {
    name: i18n.t('teach.moveDown', { title: 'Birinchi mavzu' }),
  })
  await waitFor(() => expect(getCalls).toBe(1))
  await userEvent.click(downButton)
  // Xato xabari aniq kod bo'yicha ko'rsatiladi (umumiy toast).
  expect(await screen.findByText(i18n.t('errors.INVALID_ORDER'))).toBeInTheDocument()
  // `onSettled` ro'yxatni qayta so'ragani (refetch haqiqatan sodir bo'lgani) tasdiqlanadi —
  // server hamon eski tartibni qaytaradi, shuning uchun ro'yxat o'zgarmaydi.
  await waitFor(() => expect(getCalls).toBeGreaterThanOrEqual(2))
  const names = screen.getAllByRole('link').map((el) => el.textContent)
  expect(names).toEqual(['Birinchi mavzu', 'Ikkinchi mavzu'])
})

test("yangi mavzu yaratilgach muharrirga o'tiladi", async () => {
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.post('/api/teach/subjects/1/topics', () =>
      HttpResponse.json(
        {
          id: 12,
          subject_id: 1,
          title: 'Uchinchi',
          summary: '',
          order: 3,
          is_published: false,
          steps: [],
          glossary: [],
          literature: [],
        },
        { status: 201 },
      ),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/teach', user: teacherUser })
  await userEvent.type(await screen.findByLabelText(i18n.t('teach.newTopicLabel')), 'Uchinchi')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('teach.addTopic') }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/teach/topics/12'))
})

test('mavzu yaratishda server validatsiya xatosini qaytarsa, xabar ko\'rsatiladi', async () => {
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.post('/api/teach/subjects/1/topics', () =>
      HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Nomi juda qisqa', details: {} }, { status: 422 }),
    ),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  await userEvent.type(await screen.findByLabelText(i18n.t('teach.newTopicLabel')), 'Ab')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('teach.addTopic') }))
  // Global toast orqali xato ko'rsatiladi (bu forma inline FormError ishlatmaydi, VALIDATION_ERROR
  // kodi uchun errors.ts tarjima qilingan umumiy xabarni qaytaradi, server matnini emas).
  expect(await screen.findByText(i18n.t('errors.VALIDATION_ERROR'))).toBeInTheDocument()
})

test("o'chirish tasdiqlangach DELETE yuboriladi", async () => {
  const deleted = vi.fn()
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.delete('/api/teach/topics/11', () => {
      deleted()
      return new HttpResponse(null, { status: 204 })
    }),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('teach.deleteTopic', { title: 'Ikkinchi mavzu' }) }),
  )
  const dialog = screen.getByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: i18n.t('common.delete') }))
  await waitFor(() => expect(deleted).toHaveBeenCalledOnce())
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
})

test("o'chirish server xato qaytarsa, dialog ochiq qoladi va tugmalar qayta yoqiladi", async () => {
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.delete('/api/teach/topics/11', () =>
      HttpResponse.json({ code: 'HTTP_500', message: 'Server xatosi', details: {} }, { status: 500 }),
    ),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  await userEvent.click(
    await screen.findByRole('button', { name: i18n.t('teach.deleteTopic', { title: 'Ikkinchi mavzu' }) }),
  )
  const dialog = screen.getByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: i18n.t('common.delete') }))
  expect(await screen.findByText(i18n.t('errors.INTERNAL_ERROR'))).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  // Mutation tugagach "Bekor qilish"/"O'chirish" qayta yoqiladi — foydalanuvchi qayta urinishi
  // yoki bekor qilishi mumkin.
  expect(within(dialog).getByRole('button', { name: i18n.t('common.cancel') })).not.toBeDisabled()
  expect(within(dialog).getByRole('button', { name: i18n.t('common.delete') })).not.toBeDisabled()
})

test("mavzuni yuqoriga surish — chegaraga yetgach fokus o'zining pastga tugmasiga o'tadi", async () => {
  let currentIds = [10, 11, 12]
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(threeTopicSubjects(currentIds))),
    http.put('/api/teach/subjects/1/topics/order', async ({ request }) => {
      const body = (await request.json()) as { topic_ids: number[] }
      currentIds = body.topic_ids
      return HttpResponse.json([])
    }),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  const upButton = await screen.findByRole('button', { name: i18n.t('teach.moveUp', { title: 'Ikkinchi mavzu' }) })
  upButton.focus()
  await userEvent.keyboard('{Enter}')
  await waitFor(() => {
    const downButton = screen.getByRole('button', { name: i18n.t('teach.moveDown', { title: 'Ikkinchi mavzu' }) })
    expect(document.activeElement).toBe(downButton)
  })
  // Harakatlangan mavzu endi birinchi o'rinda — uning ↑ tugmasi chegara bo'yicha o'chirilgan,
  // shuning uchun fokus ↓ tugmasiga o'tgan va u haqiqatan bosilishi mumkin.
  expect(document.activeElement).not.toBeDisabled()
})

test("mavzuni pastga surish — fokus o'zining pastga tugmasida qoladi", async () => {
  let currentIds = [10, 11, 12]
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(threeTopicSubjects(currentIds))),
    http.put('/api/teach/subjects/1/topics/order', async ({ request }) => {
      const body = (await request.json()) as { topic_ids: number[] }
      currentIds = body.topic_ids
      return HttpResponse.json([])
    }),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  const downButton = await screen.findByRole('button', {
    name: i18n.t('teach.moveDown', { title: 'Birinchi mavzu' }),
  })
  downButton.focus()
  await userEvent.keyboard('{Enter}')
  await waitFor(() => {
    const target = screen.getByRole('button', { name: i18n.t('teach.moveDown', { title: 'Birinchi mavzu' }) })
    expect(document.activeElement).toBe(target)
  })
  // Harakatlangan mavzu endi o'rtada (2-o'rinda, 3 tadan) — ↓ tugmasi hamon bosilishi mumkin.
  expect(document.activeElement).not.toBeDisabled()
})

test("biriktirilgan fan bo'lmasa tushuntirish ko'rsatiladi", async () => {
  server.use(http.get('/api/teach/subjects', () => HttpResponse.json([])))
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  expect(await screen.findByText(i18n.t('teach.noSubjects'))).toBeInTheDocument()
})
