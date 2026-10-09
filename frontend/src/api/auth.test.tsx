import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import type { ReactNode } from 'react'
import { makeUser } from '@/test/render'
import { server } from '@/test/server'
import { sessionKey, useChangePassword, useLogout } from './auth'
import { getAccessToken, setAccessToken } from './client'
import { createQueryClient } from './queryClient'

function makeWrapper(queryClient: ReturnType<typeof createQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

test('logout muvaffaqiyatli bo\'lsa sessiya null bo\'ladi', async () => {
  const user = makeUser()
  const queryClient = createQueryClient()
  queryClient.setQueryData(sessionKey, user)
  setAccessToken('token')
  server.use(http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })))

  const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper(queryClient) })
  result.current.mutate()

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(queryClient.getQueryData(sessionKey)).toBeNull()
  expect(getAccessToken()).toBeNull()
})

test('logout tarmoq xatosida sessiya saqlanadi', async () => {
  const user = makeUser()
  const queryClient = createQueryClient()
  queryClient.setQueryData(sessionKey, user)
  setAccessToken('token')
  server.use(http.post('/api/auth/logout', () => HttpResponse.error()))

  const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper(queryClient) })
  result.current.mutate()

  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(queryClient.getQueryData(sessionKey)).toEqual(user)
  expect(getAccessToken()).toBe('token')
})

test('parol almashtirilgach logout chaqiriladi va sessiya null bo\'ladi', async () => {
  const user = makeUser()
  const queryClient = createQueryClient()
  queryClient.setQueryData(sessionKey, user)
  setAccessToken('token')
  const logout = vi.fn(() => new HttpResponse(null, { status: 204 }))
  server.use(
    http.post('/api/me/password', () => new HttpResponse(null, { status: 204 })),
    http.post('/api/auth/logout', logout),
  )

  const { result } = renderHook(() => useChangePassword(), { wrapper: makeWrapper(queryClient) })
  result.current.mutate({ current_password: 'old12345', new_password: 'new12345' })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(logout).toHaveBeenCalledOnce()
  expect(queryClient.getQueryData(sessionKey)).toBeNull()
  expect(getAccessToken()).toBeNull()
})
