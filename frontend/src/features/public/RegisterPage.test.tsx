import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { pendingUser, renderRoutes } from '@/test/render'
import { server } from '@/test/server'
import { RegisterPage } from './RegisterPage'

const routes = [
  { path: '/register', element: <RegisterPage /> },
  { path: '/pending', element: <p>pending sahifa</p> },
]

async function fill(password: string, confirm: string) {
  await userEvent.type(screen.getByLabelText(i18n.t('auth.fullName')), 'Yangi Talaba')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.email')), 'yangi@example.uz')
  await userEvent.type(screen.getByLabelText(i18n.t('auth.password')), password)
  await userEvent.type(screen.getByLabelText(i18n.t('auth.passwordConfirm')), confirm)
  await userEvent.click(screen.getByRole('button', { name: i18n.t('auth.register.submit') }))
}

test("parollar mos kelmasa xato ko'rsatiladi", async () => {
  renderRoutes(routes, { url: '/register' })
  await fill('parol12345', 'boshqa12345')
  expect(await screen.findByText(i18n.t('validation.passwordMismatch'))).toBeInTheDocument()
})

test("muvaffaqiyatli ro'yxatdan o'tish joriy til bilan yuboriladi va /pending ga olib boradi", async () => {
  let body: unknown = null
  server.use(
    http.post('/api/auth/register', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(pendingUser, { status: 201 })
    }),
  )
  const { router } = renderRoutes(routes, { url: '/register' })
  await fill('parol12345', 'parol12345')
  await waitFor(() => expect(router.state.location.pathname).toBe('/pending'))
  expect(body).toEqual({
    full_name: 'Yangi Talaba',
    email: 'yangi@example.uz',
    phone: null,
    password: 'parol12345',
    locale: 'uz',
  })
})

test('band email xatosi ko\'rsatiladi', async () => {
  server.use(
    http.post('/api/auth/register', () =>
      HttpResponse.json({ code: 'EMAIL_TAKEN', message: 'x', details: {} }, { status: 409 }),
    ),
  )
  renderRoutes(routes, { url: '/register' })
  await fill('parol12345', 'parol12345')
  expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('errors.EMAIL_TAKEN'))
})
