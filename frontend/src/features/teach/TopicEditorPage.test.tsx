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
    lesson_type: 'lecture',
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

test("ma'ruza tabida materiallar holati bilan ko'rsatiladi", async () => {
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

test("fayl yuklash so'rovi to'g'ri bosqichga yuboriladi", async () => {
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

test("tab almashtirish manzilga yoziladi; amaliyot tabida faoliyatlar ro'yxati chiqadi", async () => {
  server.use(
    http.get('/api/teach/topics/10', () => HttpResponse.json(editorTopic())),
    http.get('/api/teach/steps/103/activities', () => HttpResponse.json([])),
  )
  const { router } = renderRoute(<TopicEditorPage />, { path: PATH, url: '/teach/topics/10', user: teacherUser })
  await userEvent.click(await screen.findByRole('tab', { name: new RegExp(i18n.t('steps.practice')) }))
  expect(router.state.location.search).toBe('?tab=practice')
  expect(await screen.findByText(i18n.t('activityEditor.empty'))).toBeInTheDocument()
})

test("mavzu ma'lumotlarini saqlash PATCH yuboradi", async () => {
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

test("noto'g'ri mavzu ID'sida so'rov yuborilmaydi va bo'sh holat ko'rsatiladi", async () => {
  renderRoute(<TopicEditorPage />, { path: PATH, url: '/teach/topics/abc', user: teacherUser })
  expect(await screen.findByText(i18n.t('notFound.title'))).toBeInTheDocument()
})
