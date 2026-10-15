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

test("sukut bo'yicha tasdiq kutayotganlar so'raladi", async () => {
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

test("vaqtinchalik parol modalda ko'rsatiladi", async () => {
  mockList()
  server.use(http.post('/api/admin/users/7/temp-password', () => HttpResponse.json({ temp_password: 'Abc-123-xyz' })))
  renderRoute(<AdminUsersPage />, { user: adminUser })
  const row = await screen.findByRole('listitem', { name: 'Yangi Talaba' })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('admin.users.tempPassword') }))
  const dialog = await screen.findByRole('dialog', { name: i18n.t('admin.users.tempTitle') })
  expect(within(dialog).getByText('Abc-123-xyz')).toBeInTheDocument()
})

test("o'z akkauntida boshqaruv elementlari o'chirilgan", async () => {
  mockList()
  renderRoute(<AdminUsersPage />, { user: adminUser })
  await userEvent.click(await screen.findByRole('tab', { name: i18n.t('admin.users.filters.all') }))
  const self = await screen.findByRole('listitem', { name: adminUser.full_name })
  expect(within(self).getByText(i18n.t('roles.admin'))).toBeInTheDocument()
  expect(within(self).queryByRole('button')).not.toBeInTheDocument()
  expect(within(self).getByText(i18n.t('admin.users.you'))).toBeInTheDocument()
})
