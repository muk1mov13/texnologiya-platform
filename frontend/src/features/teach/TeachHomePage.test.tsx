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
  server.use(
    http.get('/api/teach/subjects', () => HttpResponse.json(subjects)),
    http.put('/api/teach/subjects/1/topics/order', () =>
      HttpResponse.json({ code: 'INVALID_ORDER', message: "Mavzular ro'yxati fan mavzulariga mos emas", details: {} }, { status: 400 }),
    ),
  )
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  const downButton = await screen.findByRole('button', {
    name: i18n.t('teach.moveDown', { title: 'Birinchi mavzu' }),
  })
  await userEvent.click(downButton)
  // Server GET /api/teach/subjects dan hamon eski tartibni qaytaradi (o'zgarish yo'q),
  // shuning uchun invalidatsiyadan keyin ro'yxat avvalgi holatiga qaytadi.
  await waitFor(() => {
    const names = screen.getAllByRole('link').map((el) => el.textContent)
    expect(names).toEqual(['Birinchi mavzu', 'Ikkinchi mavzu'])
  })
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

test("o'chirish server xato qaytarsa, dialog ochiq qoladi va xabar chiqadi", async () => {
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
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
})

test("biriktirilgan fan bo'lmasa tushuntirish ko'rsatiladi", async () => {
  server.use(http.get('/api/teach/subjects', () => HttpResponse.json([])))
  renderRoutes(routes, { url: '/teach', user: teacherUser })
  expect(await screen.findByText(i18n.t('teach.noSubjects'))).toBeInTheDocument()
})
