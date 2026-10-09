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

test('mehmon kirish havolasini ko\'radi', () => {
  renderRoutes(routes, { url: '/pending' })
  expect(screen.getByRole('link', { name: i18n.t('nav.login') })).toHaveAttribute('href', '/login')
})

test('faol foydalanuvchi bosh sahifasiga yo\'naltiriladi', async () => {
  const { router } = renderRoutes(routes, { url: '/pending', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})
