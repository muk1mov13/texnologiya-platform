import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { RequireAuth } from '@/app/guards'
import { i18n } from '@/i18n'
import { renderRoutes, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { ProfilePage } from './ProfilePage'

const routes = [
  { element: <RequireAuth />, children: [{ path: '/app/profile', element: <ProfilePage /> }] },
  { path: '/login', element: <p>login sahifa</p> },
]

test('ism yangilanadi va toast chiqadi', async () => {
  let body: unknown = null
  server.use(
    http.patch('/api/me', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...studentUser, full_name: 'Dilnoza Aliyeva' })
    }),
  )
  renderRoutes(routes, { url: '/app/profile', user: studentUser })
  const name = screen.getByLabelText(i18n.t('auth.fullName'))
  await userEvent.clear(name)
  await userEvent.type(name, 'Dilnoza Aliyeva')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.save') }))
  expect(await screen.findByText(i18n.t('profile.saved'))).toBeInTheDocument()
  expect(body).toEqual({ full_name: 'Dilnoza Aliyeva', phone: null })
})

async function submitPassword(current: string) {
  await userEvent.type(screen.getByLabelText(i18n.t('profile.currentPassword')), current)
  await userEvent.type(screen.getByLabelText(i18n.t('profile.newPassword')), 'yangi-parol-123')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.passwordConfirm')), 'yangi-parol-123')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('profile.changePassword') }))
}

test("joriy parol noto'g'ri bo'lsa xato ko'rsatiladi", async () => {
  server.use(
    http.post('/api/me/password', () =>
      HttpResponse.json({ code: 'WRONG_PASSWORD', message: 'x', details: {} }, { status: 400 }),
    ),
  )
  renderRoutes(routes, { url: '/app/profile', user: studentUser })
  await submitPassword('notogri')
  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('errors.WRONG_PASSWORD'))
})

test("parol almashgach sessiya yopiladi va /login ga o'tiladi", async () => {
  server.use(http.post('/api/me/password', () => new HttpResponse(null, { status: 204 })))
  const { router } = renderRoutes(routes, { url: '/app/profile', user: studentUser })
  await submitPassword('eski-parol-123')
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(screen.getByText(i18n.t('profile.passwordChanged'))).toBeInTheDocument()
  // Logout bilan bir xil sabab: qaytish manzilisiz — aks holda keyingi kirgan foydalanuvchi
  // oldingisining sahifasiga tushib qolardi (AppLayout logout testiga qarang).
  expect(router.state.location.state).toBeNull()
})
