import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import type { RouteObject } from 'react-router'
import { i18n } from '@/i18n'
import { adminUser, renderRoutes, studentUser, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { RequireAuth } from '../guards'
import { AppLayout } from './AppLayout'

const routes: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [{ element: <AppLayout />, children: [{ path: '/app', element: <p>sahifa</p> }] }],
  },
  { path: '/login', element: <p>login sahifa</p> },
]

test('o\'qituvchi muharrir havolasini ko\'radi, admin bo\'limlarini ko\'rmaydi', () => {
  renderRoutes(routes, { url: '/app', user: teacherUser })
  const nav = screen.getByRole('navigation')
  expect(within(nav).getByRole('link', { name: i18n.t('nav.teach') })).toBeInTheDocument()
  expect(within(nav).queryByRole('link', { name: i18n.t('nav.adminUsers') })).not.toBeInTheDocument()
})

test('admin barcha bo\'limlarni ko\'radi', () => {
  renderRoutes(routes, { url: '/app', user: adminUser })
  const nav = screen.getByRole('navigation')
  for (const key of ['nav.subjects', 'nav.teach', 'nav.adminUsers', 'nav.adminSubjects']) {
    expect(within(nav).getByRole('link', { name: i18n.t(key) })).toBeInTheDocument()
  }
})

test('chiqish tugmasi sessiyani yopadi va /login ga olib boradi', async () => {
  server.use(http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })))
  const { router } = renderRoutes(routes, { url: '/app', user: studentUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('nav.logout') }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(router.state.location.state).toBeNull()
})

test('til almashtirilganda PATCH /me yuboriladi', async () => {
  let body: unknown = null
  server.use(
    http.patch('/api/me', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...studentUser, locale: 'ru' })
    }),
  )
  renderRoutes(routes, { url: '/app', user: studentUser })
  await userEvent.click(screen.getByRole('button', { name: 'Русский' }))
  await waitFor(() => expect(body).toEqual({ locale: 'ru' }))
  expect(i18n.language).toBe('ru')
})
