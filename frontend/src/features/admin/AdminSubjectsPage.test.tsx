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
  syllabus_name: null,
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

test("yangi fan yaratish POST yuboradi (bo'sh slug null bo'ladi)", async () => {
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

test("band slug xatosi modal ichida ko'rsatiladi", async () => {
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

test("o'qituvchi biriktirish PUT yuboradi", async () => {
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

test("fanni o'chirish tasdiqlangach DELETE yuboriladi", async () => {
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
