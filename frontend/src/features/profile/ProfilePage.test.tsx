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
  // `toEqual` aniq teng bo'lishni talab qiladi — shuning uchun `locale` kiritilmagani ham tasdiqlanadi.
  expect(body).toEqual({ full_name: 'Dilnoza Aliyeva', phone: null })
  expect(body).not.toHaveProperty('locale')
})

test("profil saqlash xatosi faqat bir marta ko'rsatiladi", async () => {
  server.use(
    http.patch('/api/me', () =>
      HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'x', details: {} }, { status: 422 }),
    ),
  )
  renderRoutes(routes, { url: '/app/profile', user: studentUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.save') }))
  // `useUpdateMe({ silent: true })` + forma ichidagi `FormError`: umumiy toast chiqmasligi
  // kerak, shuning uchun matn aynan bir marta ko'rinadi.
  const matches = await screen.findAllByText(i18n.t('errors.VALIDATION_ERROR'))
  expect(matches).toHaveLength(1)
})

test('telefon tozalansa phone: null yuboriladi', async () => {
  const user = { ...studentUser, phone: '+998901234567' }
  let body: unknown = null
  server.use(
    http.patch('/api/me', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(user)
    }),
  )
  renderRoutes(routes, { url: '/app/profile', user })
  const phone = screen.getByLabelText(i18n.t('auth.phone'))
  await userEvent.clear(phone)
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.save') }))
  await waitFor(() => expect(body).toEqual({ full_name: user.full_name, phone: null }))
})

test("ism 2 belgidan kam bo'lsa xato ko'rsatiladi va so'rov yuborilmaydi", async () => {
  let called = false
  server.use(
    http.patch('/api/me', () => {
      called = true
      return HttpResponse.json(studentUser)
    }),
  )
  renderRoutes(routes, { url: '/app/profile', user: studentUser })
  const name = screen.getByLabelText(i18n.t('auth.fullName'))
  await userEvent.clear(name)
  await userEvent.type(name, 'A')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.save') }))
  expect(await screen.findByText(i18n.t('validation.nameMin'))).toBeInTheDocument()
  expect(called).toBe(false)
})

async function submitPassword(current: string) {
  await userEvent.type(screen.getByLabelText(i18n.t('profile.currentPassword')), current)
  await userEvent.type(screen.getByLabelText(i18n.t('profile.newPassword')), 'yangi-parol-123')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.passwordConfirm')), 'yangi-parol-123')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('profile.changePassword') }))
}

test("parol tasdiqlash mos kelmasa xato ko'rsatiladi va so'rov yuborilmaydi", async () => {
  let called = false
  server.use(
    http.post('/api/me/password', () => {
      called = true
      return new HttpResponse(null, { status: 204 })
    }),
  )
  renderRoutes(routes, { url: '/app/profile', user: studentUser })
  await userEvent.type(screen.getByLabelText(i18n.t('profile.currentPassword')), 'eski-parol-123')
  await userEvent.type(screen.getByLabelText(i18n.t('profile.newPassword')), 'yangi-parol-123')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.passwordConfirm')), 'boshqa-parol-123')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('profile.changePassword') }))
  expect(await screen.findByText(i18n.t('validation.passwordMismatch'))).toBeInTheDocument()
  expect(called).toBe(false)
})

test("yangi parol 8 belgidan kam bo'lsa xato ko'rsatiladi va so'rov yuborilmaydi", async () => {
  let called = false
  server.use(
    http.post('/api/me/password', () => {
      called = true
      return new HttpResponse(null, { status: 204 })
    }),
  )
  renderRoutes(routes, { url: '/app/profile', user: studentUser })
  await userEvent.type(screen.getByLabelText(i18n.t('profile.currentPassword')), 'eski-parol-123')
  await userEvent.type(screen.getByLabelText(i18n.t('profile.newPassword')), 'qisqa')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.passwordConfirm')), 'qisqa')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('profile.changePassword') }))
  expect(await screen.findByText(i18n.t('validation.passwordMin'))).toBeInTheDocument()
  expect(called).toBe(false)
})

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
