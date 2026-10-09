import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import type { RouteObject } from 'react-router'
import { RedirectIfAuthed } from '@/app/guards'
import { i18n } from '@/i18n'
import { pendingUser, renderRoutes, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { LoginPage } from './LoginPage'

const routes: RouteObject[] = [
  { element: <RedirectIfAuthed />, children: [{ path: '/login', element: <LoginPage /> }] },
  { path: '/app', element: <p>talaba bosh sahifasi</p> },
  { path: '/pending', element: <p>pending sahifa</p> },
]

async function fillAndSubmit(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(i18n.t('auth.email')), email)
  await userEvent.type(screen.getByLabelText(i18n.t('auth.password')), password)
  await userEvent.click(screen.getByRole('button', { name: i18n.t('auth.login.submit') }))
}

test("noto'g'ri email validatsiya xatosini ko'rsatadi va so'rov yubormaydi", async () => {
  renderRoutes(routes, { url: '/login' })
  await fillAndSubmit('emas-email', 'parol12345')
  expect(await screen.findByText(i18n.t('validation.email'))).toBeInTheDocument()
})

test("noto'g'ri parol tarjima qilingan xatoni ko'rsatadi", async () => {
  server.use(
    http.post('/api/auth/login', () =>
      HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: 'x', details: {} }, { status: 401 }),
    ),
  )
  renderRoutes(routes, { url: '/login' })
  await fillAndSubmit('talaba@example.uz', 'notogri123')
  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('errors.INVALID_CREDENTIALS'))
})

test("muvaffaqiyatli kirishdan so'ng talaba /app ga o'tadi", async () => {
  server.use(
    http.post('/api/auth/login', () =>
      HttpResponse.json({ access_token: 'tok', token_type: 'bearer', user: studentUser }),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/login' })
  await fillAndSubmit('talaba@example.uz', 'parol12345')
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})

test('pending foydalanuvchi kirgach /pending ga o\'tadi', async () => {
  server.use(
    http.post('/api/auth/login', () =>
      HttpResponse.json({ access_token: 'tok', token_type: 'bearer', user: pendingUser }),
    ),
  )
  const { router } = renderRoutes(routes, { url: '/login' })
  await fillAndSubmit('yangi@example.uz', 'parol12345')
  await waitFor(() => expect(router.state.location.pathname).toBe('/pending'))
})
