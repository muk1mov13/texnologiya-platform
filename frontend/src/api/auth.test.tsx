import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import type { ReactNode } from 'react'
import { makeUser } from '@/test/render'
import { server } from '@/test/server'
import { installAuthHandlers, sessionKey, useChangePassword, useLogout, useSession } from './auth'
import { getAccessToken, refreshSession, setAccessToken } from './client'
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

test('mahalliy refresh kutilayotganda logout qilinsa, u avval tugaydi va logout keyin sessiyani tozalaydi', async () => {
  const user = makeUser()
  const queryClient = createQueryClient()
  queryClient.setQueryData(sessionKey, user)
  setAccessToken('old-token')
  installAuthHandlers(queryClient)

  let releaseRefresh = () => {}
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve
  })
  server.use(
    http.post('/api/auth/refresh', async () => {
      await refreshGate
      return HttpResponse.json({ access_token: 'new-token', token_type: 'bearer', user })
    }),
    http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
  )

  const pendingRefresh = refreshSession()

  const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper(queryClient) })
  result.current.mutate()

  // Web Locks yo'q (jsdom): logout avval kutilayotgan refresh tugashini kutadi, shuning uchun
  // mutatsiya faqat gate ochilgandan keyin "isSuccess" bo'lishi mumkin.
  releaseRefresh()
  await expect(pendingRefresh).resolves.toMatchObject({ access_token: 'new-token' })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  // Refresh muvaffaqiyatli tugagan bo'lsa ham, undan keyin ishga tushgan logout
  // sessiyani oxir-oqibat tozalaydi.
  expect(queryClient.getQueryData(sessionKey)).toBeNull()
  expect(getAccessToken()).toBeNull()
})

test('sessiya so\'rovi hali yuklanayotganda logout qilinsa, oxirida foydalanuvchi qaytarilmaydi', async () => {
  const user = makeUser()
  const queryClient = createQueryClient()
  queryClient.setQueryData(sessionKey, user)
  setAccessToken('old-token')
  installAuthHandlers(queryClient)

  let releaseRefresh = () => {}
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve
  })
  server.use(
    http.post('/api/auth/refresh', async () => {
      await refreshGate
      return HttpResponse.json({ access_token: 'new-token', token_type: 'bearer', user })
    }),
    http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
  )

  const wrapper = makeWrapper(queryClient)
  // Query'ning queryFn'i ro'yxatdan o'tishi uchun kamida bitta kuzatuvchi kerak.
  renderHook(() => useSession(), { wrapper })
  const refetchPromise = queryClient.refetchQueries({ queryKey: sessionKey })

  const { result } = renderHook(() => useLogout(), { wrapper })
  result.current.mutate()

  // Web Locks yo'q (jsdom): logout avval kutilayotgan refetch'ning refresh so'rovi
  // tugashini kutadi, shuning uchun uni shu yerda ochamiz.
  releaseRefresh()
  await refetchPromise.catch(() => {})
  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(queryClient.getQueryData(sessionKey)).toBeNull()
})
