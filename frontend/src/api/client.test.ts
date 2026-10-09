import { http, HttpResponse } from 'msw/http'
import { server } from '@/test/server'
import {
  ApiError,
  apiFetch,
  getAccessToken,
  logoutRequest,
  refreshSession,
  resetSession,
  setAccessToken,
  setAuthHandlers,
} from './client'
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
  let unauthorizedCount = 0
  // Refresh ikkala so'rov ham 401 olguncha ushlab turiladi — shundagina single-flight haqiqatan
  // sinaladi, aks holda tezkor javoblarda ikkinchi so'rov allaqachon yangi token bilan ketishi mumkin.
  let releaseRefresh = () => {}
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve
  })
  server.use(
    http.post('/api/auth/refresh', async () => {
      refreshCalls += 1
      await refreshGate
      return HttpResponse.json(session)
    }),
    http.get('/api/subjects', ({ request }) => {
      if (request.headers.get('Authorization') === 'Bearer new-token') return HttpResponse.json([])
      unauthorizedCount += 1
      if (unauthorizedCount === 2) releaseRefresh()
      return invalidToken()
    }),
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

test('refresh 503 qaytarsa so\'rov HTTP_503 bilan rad etiladi, sessiya buzilmaydi', async () => {
  setAccessToken('old')
  const onLost = vi.fn()
  setAuthHandlers({ onRefreshed: vi.fn(), onLost })
  server.use(
    http.post('/api/auth/refresh', () => new HttpResponse(null, { status: 503 })),
    http.get('/api/subjects', invalidToken),
  )
  await expect(apiFetch('/api/subjects')).rejects.toMatchObject({ status: 503, code: 'HTTP_503' })
  expect(onLost).not.toHaveBeenCalled()
  expect(getAccessToken()).toBe('old')
})

test('403 ACCOUNT_BLOCKED kelsa onLost chaqiriladi', async () => {
  setAccessToken('blocked-token')
  const onLost = vi.fn()
  setAuthHandlers({ onRefreshed: vi.fn(), onLost })
  server.use(
    http.get('/api/subjects', () =>
      HttpResponse.json({ code: 'ACCOUNT_BLOCKED', message: 'Bloklangan', details: {} }, { status: 403 }),
    ),
  )
  await expect(apiFetch('/api/subjects')).rejects.toMatchObject({ status: 403, code: 'ACCOUNT_BLOCKED' })
  expect(onLost).toHaveBeenCalledOnce()
})

test('resetSession() dan keyin kelgan refresh natijasi e\'tiborsiz qoladi', async () => {
  const onRefreshed = vi.fn()
  setAuthHandlers({ onRefreshed, onLost: vi.fn() })
  let releaseRefresh = () => {}
  const refreshGate = new Promise<void>((resolve) => {
    releaseRefresh = resolve
  })
  server.use(
    http.post('/api/auth/refresh', async () => {
      await refreshGate
      return HttpResponse.json(session)
    }),
  )
  const pending = refreshSession()
  resetSession()
  releaseRefresh()
  await expect(pending).resolves.toBeNull()
  expect(getAccessToken()).toBeNull()
  expect(onRefreshed).not.toHaveBeenCalled()
})

test('refresh va logout bitta "auth-refresh" nomli Web Lock orqali navbatlanadi', async () => {
  const lockNames: string[] = []
  const fakeLocks = {
    request: (name: string, callback: () => Promise<unknown>) => {
      lockNames.push(name)
      return Promise.resolve(callback())
    },
  }
  // jsdom'ning Navigator'i brand-tekshiruvi tufayli prototip orqali almashtirib bo'lmaydi
  // (vi.stubGlobal bilan to'liq navigator'ni almashtirish MSW ichkarisida xato beradi),
  // shuning uchun asl obyektga faqat `locks`ni vaqtincha qo'shib, keyin olib tashlaymiz.
  Object.defineProperty(navigator, 'locks', { value: fakeLocks, configurable: true })
  try {
    server.use(
      http.post('/api/auth/refresh', () => HttpResponse.json(session)),
      http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
    )
    await refreshSession()
    await logoutRequest()
  } finally {
    Reflect.deleteProperty(navigator, 'locks')
  }
  expect(lockNames).toEqual(['auth-refresh', 'auth-refresh'])
})
