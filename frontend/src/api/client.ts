import type { ApiErrorBody, TokenOut } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || body.code)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.details = body.details
  }
}

interface AuthHandlers {
  onRefreshed: (session: TokenOut) => void
  onLost: () => void
}

const NOOP_HANDLERS: AuthHandlers = { onRefreshed: () => {}, onLost: () => {} }
const REFRESHABLE_CODES = new Set(['INVALID_TOKEN', 'NOT_AUTHENTICATED'])

let accessToken: string | null = null
let generation = 0
let handlers: AuthHandlers = NOOP_HANDLERS
let refreshing: Promise<TokenOut | null> | null = null
// refreshSession/logoutRequest o'z slot egaligini promise identifikatori o'rniga shu hisoblagich
// bilan tekshiradi — shunda funksiya o'ziga (hali to'liq tayinlanmagan promise'ga) ishora qilmaydi.
let slotOwner = 0

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

/** Sessiya zo'rlab yopilganda (logout, parol almashtirish) chaqiriladi: kechikkan refresh natijasi e'tiborsiz qoladi. */
export function resetSession(): void {
  accessToken = null
  generation += 1
}

export function setAuthHandlers(next: AuthHandlers): void {
  handlers = next
}

export function resetAuthHandlers(): void {
  handlers = NOOP_HANDLERS
}

async function toApiError(response: Response): Promise<ApiError> {
  const fallback: ApiErrorBody = { code: `HTTP_${response.status}`, message: response.statusText, details: {} }
  try {
    const data = (await response.json()) as Partial<ApiErrorBody> | null
    if (data && typeof data.code === 'string') {
      return new ApiError(response.status, {
        code: data.code,
        message: data.message ?? data.code,
        details: data.details ?? {},
      })
    }
  } catch {
    // Javob JSON emas (masalan, proksi HTML sahifasi) — fallback ishlatiladi.
  }
  return new ApiError(response.status, fallback)
}

const AUTH_LOCK_NAME = 'auth-refresh'
const AUTH_REQUEST_TIMEOUT_MS = 15_000

function hasWebLocks(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.locks
}

function withAuthLock<T>(run: () => Promise<T>): Promise<T> {
  if (hasWebLocks()) return navigator.locks.request(AUTH_LOCK_NAME, run)
  return run()
}

function fetchRefresh(): Promise<Response> {
  return fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
  })
}

/**
 * Tablar bitta cookie jar'ni bo'lishadi: refresh rotatsiya qilgach, eski refresh tokendan
 * qayta foydalanish backend tomonida BARCHA sessiyalarni bekor qiladi. Shu sababli bir vaqtda
 * faqat bitta tab haqiqiy so'rov yuborishi kerak — Web Locks API orqali navbatlanadi.
 */
function requestRefresh(): Promise<Response> {
  return withAuthLock(() => fetchRefresh())
}

function fetchLogout(): Promise<Response> {
  return fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
    signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
  })
}

function requestLogout(): Promise<Response> {
  return withAuthLock(() => fetchLogout())
}

/** Refresh cookie orqali yangi access token oladi. Parallel chaqiruvlar bitta so'rovni bo'lishadi. */
export function refreshSession(): Promise<TokenOut | null> {
  if (refreshing) return refreshing
  slotOwner += 1
  const ownToken = slotOwner
  const promise: Promise<TokenOut | null> = (async () => {
    const startGeneration = generation
    try {
      const response = await requestRefresh()
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Shu orada resetSession() chaqirilgan bo'lsa (logout/parol almashtirish), token
          // allaqachon null — uni qayta tozalashning hojati yo'q, holatni buzmaymiz.
          if (generation === startGeneration) accessToken = null
          return null
        }
        // 5xx, tarmoq xatosi yoki timeout: sessiya haqiqatan yo'qolganini bilmaymiz, token saqlanadi.
        throw await toApiError(response)
      }
      const session = (await response.json()) as TokenOut
      if (generation !== startGeneration) {
        // Shu orada resetSession() chaqirilgan (logout/parol almashtirish) — natija e'tiborsiz qoladi.
        return null
      }
      accessToken = session.access_token
      handlers.onRefreshed(session)
      return session
    } finally {
      // Boshqa chaqiruv (masalan, logoutRequest) slotni allaqachon egallab olgan bo'lishi mumkin —
      // bu holda uni bekor qilmaymiz.
      if (slotOwner === ownToken) refreshing = null
    }
  })()
  refreshing = promise
  return promise
}

/**
 * Logout so'rovi ham bir xil tab-ichi navbatda turadi: ishlayotgan vaqtida `refreshing`
 * slotini egallaydi, shunda parallel refreshSession() chaqiruvlari o'z so'rovini
 * boshlamasdan shu (null bilan tugaydigan) natijani kutib oladi va keyin generation
 * o'zgarganini ko'rib, eskirgan natijani e'tiborsiz qoldiradi.
 */
export function logoutRequest(): Promise<void> {
  const previousRefresh = refreshing
  slotOwner += 1
  const ownToken = slotOwner
  const promise: Promise<TokenOut | null> = (async () => {
    try {
      if (!hasWebLocks() && previousRefresh) {
        // Web Locks yo'q brauzerlarda tartibni o'zimiz ta'minlaymiz: eski refresh tugaguncha
        // logout so'rovini yubormaymiz (xatosi bu yerda ahamiyatsiz) — aks holda ikkisi bir
        // vaqtda ketib, backend'da refresh token qayta ishlatilgandek ko'rinishi mumkin.
        await previousRefresh.catch(() => {})
      }
      const response = await requestLogout()
      if (!response.ok) throw await toApiError(response)
      return null
    } finally {
      if (slotOwner === ownToken) refreshing = null
    }
  })()
  refreshing = promise
  return promise.then(() => undefined)
}

export interface RequestOptions {
  method?: string
  json?: unknown
  body?: FormData
  signal?: AbortSignal
  /** false: 401 kelganda refresh qilinmaydi (login, register, logout). */
  auth?: boolean
}

function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers = new Headers()
  if (options.json !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    signal: options.signal,
    credentials: 'same-origin',
  })
}

async function request(path: string, options: RequestOptions): Promise<Response> {
  const tokenUsed = accessToken
  const startGeneration = generation
  let response = await send(path, options, tokenUsed)
  if (response.status === 401 && options.auth !== false) {
    const error = await toApiError(response.clone())
    if (REFRESHABLE_CODES.has(error.code)) {
      if (accessToken && accessToken !== tokenUsed) {
        // Token boshqa so'rov tomonidan allaqachon yangilangan.
        response = await send(path, options, accessToken)
      } else {
        const session = await refreshSession()
        if (session) {
          response = await send(path, options, session.access_token)
        } else if (generation === startGeneration) {
          // null faqat eskirgan natija bo'lgani uchun bo'lishi mumkin (shu orada login/logout
          // bo'lgan) — bu holda sessiya aslida yo'qolmagan, onLost chaqirilmaydi.
          handlers.onLost()
        }
      }
    }
  }
  if (!response.ok) {
    const error = await toApiError(response)
    if (response.status === 403 && error.code === 'ACCOUNT_BLOCKED') {
      handlers.onLost()
    }
    throw error
  }
  return response
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await request(path, options)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function apiBuffer(path: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const response = await request(path, { signal })
  return response.arrayBuffer()
}
