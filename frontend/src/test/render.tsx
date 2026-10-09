import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { installAuthHandlers, sessionKey } from '@/api/auth'
import { setAccessToken } from '@/api/client'
import { createQueryClient } from '@/api/queryClient'
import type { User } from '@/api/types'
import { Toaster } from '@/components/ui/Toast'

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'talaba@example.uz',
    phone: null,
    full_name: 'Dilnoza Karimova',
    role: 'student',
    status: 'active',
    locale: 'uz',
    ...overrides,
  }
}

export const studentUser = makeUser()
export const teacherUser = makeUser({ id: 2, email: 'oqituvchi@example.uz', full_name: 'Aziz Rahimov', role: 'teacher' })
export const adminUser = makeUser({ id: 3, email: 'admin@example.uz', full_name: 'Administrator', role: 'admin' })
export const pendingUser = makeUser({ id: 4, email: 'yangi@example.uz', full_name: 'Yangi Talaba', status: 'pending' })

interface RenderOptions {
  url?: string
  state?: unknown
  user?: User | null
}

export function renderRoutes(routes: RouteObject[], { url = '/', state, user = null }: RenderOptions = {}) {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 },
    mutations: { retry: false },
  })
  queryClient.setQueryData(sessionKey, user)
  setAccessToken(user ? 'test-token' : null)
  installAuthHandlers(queryClient)
  const router = createMemoryRouter([...routes, { path: '*', element: <p>probe</p> }], {
    initialEntries: [state === undefined ? url : { pathname: url, state }],
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>,
  )
  return { ...result, router, queryClient }
}

/** Bitta sahifani `path` bo'yicha render qiladi; `url` — haqiqiy manzil (parametrlar bilan). */
export function renderRoute(
  element: ReactElement,
  { path = '/', ...options }: RenderOptions & { path?: string } = {},
) {
  return renderRoutes([{ path, element }], { url: options.url ?? path, ...options })
}
