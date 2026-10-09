import { http, HttpResponse } from 'msw/http'
import { server } from '@/test/server'
import { ApiError, apiFetch, getAccessToken, setAccessToken, setAuthHandlers } from './client'
import type { TokenOut } from './types'

const session: TokenOut = {
  access_token: 'new-token',
  token_type: 'bearer',
  user: {
    id: 1,
    email: 'talaba@example.uz',
    phone: null,
    full_name: 'Dilnoza Karimova',
    role: 'student',
    status: 'active',
    locale: 'uz',
  },
}

const invalidToken = () =>
  HttpResponse.json({ code: 'INVALID_TOKEN', message: 'Token yaroqsiz', details: {} }, { status: 401 })

test('Bearer token yuboriladi va JSON qaytadi', async () => {
  setAccessToken('abc')
  server.use(
    http.get('/api/me', ({ request }) => HttpResponse.json({ auth: request.headers.get('Authorization') })),
  )
  await expect(apiFetch('/api/me')).resolves.toEqual({ auth: 'Bearer abc' })
})

test('JSON body Content-Type bilan yuboriladi', async () => {
  server.use(
    http.post('/api/echo', async ({ request }) =>
      HttpResponse.json({ type: request.headers.get('Content-Type'), body: await request.json() }),
    ),
  )
  await expect(apiFetch('/api/echo', { method: 'POST', json: { a: 1 } })).resolves.toEqual({
    type: 'application/json',
    body: { a: 1 },
  })
})

test('204 javobda undefined qaytadi', async () => {
  server.use(http.delete('/api/teach/topics/1', () => new HttpResponse(null, { status: 204 })))
  await expect(apiFetch('/api/teach/topics/1', { method: 'DELETE' })).resolves.toBeUndefined()
})

test('xato javob ApiError ga aylanadi', async () => {
  server.use(
    http.get('/api/topics/1', () =>
      HttpResponse.json({ code: 'TOPIC_NOT_FOUND', message: 'Mavzu topilmadi', details: {} }, { status: 404 }),
    ),
  )
  const error = await apiFetch('/api/topics/1').catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  expect(error).toMatchObject({ status: 404, code: 'TOPIC_NOT_FOUND', message: 'Mavzu topilmadi' })
})

test('JSON bo\'lmagan xato HTTP_<status> kodini oladi', async () => {
  server.use(http.get('/api/subjects', () => HttpResponse.text('Bad gateway', { status: 502 })))
  await expect(apiFetch('/api/subjects')).rejects.toMatchObject({ status: 502, code: 'HTTP_502' })
})

test('401 da bitta refresh, so\'ng so\'rovlar yangi token bilan qayta yuboriladi', async () => {
  setAccessToken('old')
  const onRefreshed = vi.fn()
  setAuthHandlers({ onRefreshed, onLost: vi.fn() })
  let refreshCalls = 0
  server.use(
    http.post('/api/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.json(session)
    }),
    http.get('/api/subjects', ({ request }) =>
      request.headers.get('Authorization') === 'Bearer new-token' ? HttpResponse.json([]) : invalidToken(),
    ),
  )
  await expect(Promise.all([apiFetch('/api/subjects'), apiFetch('/api/subjects')])).resolves.toEqual([[], []])
  expect(refreshCalls).toBe(1)
  expect(getAccessToken()).toBe('new-token')
  expect(onRefreshed).toHaveBeenCalledWith(session)
})

test('refresh muvaffaqiyatsiz bo\'lsa onLost chaqiriladi va asl xato tashlanadi', async () => {
  setAccessToken('old')
  const onLost = vi.fn()
  setAuthHandlers({ onRefreshed: vi.fn(), onLost })
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ code: 'NO_REFRESH_TOKEN', message: 'Sessiya topilmadi', details: {} }, { status: 401 }),
    ),
    http.get('/api/subjects', invalidToken),
  )
  await expect(apiFetch('/api/subjects')).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
  expect(onLost).toHaveBeenCalledOnce()
  expect(getAccessToken()).toBeNull()
})

test('auth: false so\'rovlarda refresh qilinmaydi', async () => {
  const refresh = vi.fn(() => HttpResponse.json(session))
  server.use(
    http.post('/api/auth/refresh', refresh),
    http.post('/api/auth/login', invalidToken),
  )
  await expect(apiFetch('/api/auth/login', { method: 'POST', json: {}, auth: false })).rejects.toMatchObject({
    code: 'INVALID_TOKEN',
  })
  expect(refresh).not.toHaveBeenCalled()
})
