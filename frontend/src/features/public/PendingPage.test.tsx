import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { pendingUser, renderRoutes, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { PendingPage } from './PendingPage'

const routes = [
  { path: '/pending', element: <PendingPage /> },
  { path: '/app', element: <p>talaba sahifa</p> },
  { path: '/login', element: <p>login sahifa</p> },
]

test("pending foydalanuvchi ismi bilan kutish xabarini ko'radi", () => {
  renderRoutes(routes, { url: '/pending', user: pendingUser })
  expect(screen.getByText(i18n.t('pending.textUser', { name: pendingUser.full_name }))).toBeInTheDocument()
  expect(screen.getByRole('button', { name: i18n.t('nav.logout') })).toBeInTheDocument()
})

test('"Holatni tekshirish" sessiyani qayta so\'raydi; tasdiqlangan bo\'lsa bosh sahifaga o\'tadi', async () => {
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ access_token: 'tok', token_type: 'bearer', user: { ...pendingUser, status: 'active' } }),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/pending', user: pendingUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('pending.check') }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})

test("\"Holatni tekshirish\" hali tasdiqlanmagan bo'lsa xabar ko'rsatadi", async () => {
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ access_token: 'tok', token_type: 'bearer', user: pendingUser }),
    ),
  )
  renderRoutes(routes, { url: '/pending', user: pendingUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('pending.check') }))
  expect(await screen.findByRole('status')).toHaveTextContent(i18n.t('pending.stillPending'))
})

test('"Holatni tekshirish" 401 qaytarsa sessiya tugaganini bildirib /login ga o\'tadi', async () => {
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ code: 'INVALID_REFRESH_TOKEN', message: 'x', details: {} }, { status: 401 }),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/pending', user: pendingUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('pending.check') }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
})

test('"Holatni tekshirish" 500 qaytarsa sahifa ko\'rinishda qoladi va xato ko\'rsatiladi', async () => {
  server.use(http.post('/api/auth/refresh', () => new HttpResponse(null, { status: 500 })))
  renderRoutes(routes, { url: '/pending', user: pendingUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('pending.check') }))
  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('errors.INTERNAL_ERROR'))
  expect(screen.getByText(i18n.t('pending.title'))).toBeInTheDocument()
})

test('mehmon kirish havolasini ko\'radi', () => {
  renderRoutes(routes, { url: '/pending' })
  expect(screen.getByRole('link', { name: i18n.t('nav.login') })).toHaveAttribute('href', '/login')
})

test('faol foydalanuvchi bosh sahifasiga yo\'naltiriladi', async () => {
  const { router } = renderRoutes(routes, { url: '/pending', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})

test('tasdiq kutish sahifasidan chiqish /login ga olib boradi', async () => {
  let logoutCalls = 0
  server.use(
    http.post('/api/auth/logout', () => {
      logoutCalls += 1
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const { router } = renderRoutes(routes, { url: '/pending', user: pendingUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('nav.logout') }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(logoutCalls).toBe(1)
})
