import { screen, waitFor } from '@testing-library/react'
import type { RouteObject } from 'react-router'
import { adminUser, pendingUser, renderRoutes, studentUser, teacherUser } from '@/test/render'
import { RedirectIfAuthed, RequireAuth } from './guards'

const pages: RouteObject[] = [
  { path: '/login', element: <p>login sahifa</p> },
  { path: '/pending', element: <p>pending sahifa</p> },
  { path: '/app', element: <p>talaba sahifa</p> },
  { path: '/teach', element: <p>teach sahifa</p> },
  { path: '/admin/users', element: <p>admin sahifa</p> },
]

const adminOnly: RouteObject[] = [
  ...pages,
  { element: <RequireAuth roles={['admin']} />, children: [{ path: '/secret', element: <p>maxfiy</p> }] },
]

test('mehmon /login ga yo\'naltiriladi va qaytish manzili saqlanadi', async () => {
  const { router } = renderRoutes(adminOnly, { url: '/secret', user: null })
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(router.state.location.state).toEqual({ from: '/secret' })
})

test('qaytish manzili query-string bilan birga saqlanadi', async () => {
  const { router } = renderRoutes(adminOnly, { url: '/secret?tab=2', user: null })
  await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  expect(router.state.location.state).toEqual({ from: '/secret?tab=2' })
})

test('pending foydalanuvchi /pending ga yo\'naltiriladi', async () => {
  const { router } = renderRoutes(adminOnly, { url: '/secret', user: pendingUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/pending'))
})

test('roli mos kelmasa o\'z bosh sahifasiga yo\'naltiriladi', async () => {
  const { router } = renderRoutes(adminOnly, { url: '/secret', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app'))
})

test('ruxsat bor bo\'lsa sahifa ko\'rinadi', () => {
  renderRoutes(adminOnly, { url: '/secret', user: adminUser })
  expect(screen.getByText('maxfiy')).toBeInTheDocument()
})

const loginTree: RouteObject[] = [
  ...pages.filter((page) => page.path !== '/login'),
  { element: <RedirectIfAuthed />, children: [{ path: '/login', element: <p>login forma</p> }] },
  { path: '/teach/topics/5', element: <p>muharrir</p> },
]

test('kirgan foydalanuvchi /login dan o\'z bosh sahifasiga o\'tadi', async () => {
  const { router } = renderRoutes(loginTree, { url: '/login', user: teacherUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/teach'))
})

test('kirgan foydalanuvchi saqlangan qaytish manziliga o\'tadi', async () => {
  const { router } = renderRoutes(loginTree, {
    url: '/login',
    state: { from: '/teach/topics/5' },
    user: teacherUser,
  })
  await waitFor(() => expect(router.state.location.pathname).toBe('/teach/topics/5'))
})

test('mehmon login formasini ko\'radi', () => {
  renderRoutes(loginTree, { url: '/login', user: null })
  expect(screen.getByText('login forma')).toBeInTheDocument()
})

test('xavfli qaytish manzili (//) e\'tiborsiz qoldiriladi va bosh sahifaga o\'tiladi', async () => {
  const { router } = renderRoutes(loginTree, {
    url: '/login',
    state: { from: '//evil.example' },
    user: teacherUser,
  })
  await waitFor(() => expect(router.state.location.pathname).toBe('/teach'))
})

test('orqa chiziqli qaytish manzili (/\\) ham e\'tiborsiz qoldiriladi', async () => {
  const { router } = renderRoutes(loginTree, {
    url: '/login',
    state: { from: '/\\evil.example' },
    user: teacherUser,
  })
  await waitFor(() => expect(router.state.location.pathname).toBe('/teach'))
})
