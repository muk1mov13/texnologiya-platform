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
let handlers: AuthHandlers = NOOP_HANDLERS
let refreshing: Promise<TokenOut | null> | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
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

/** Refresh cookie orqali yangi access token oladi. Parallel chaqiruvlar bitta so'rovni bo'lishadi. */
export function refreshSession(): Promise<TokenOut | null> {
  refreshing ??= (async () => {
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
      if (!response.ok) {
        accessToken = null
        return null
      }
      const session = (await response.json()) as TokenOut
      accessToken = session.access_token
      handlers.onRefreshed(session)
      return session
    } finally {
      refreshing = null
    }
  })()
  return refreshing
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
        } else {
          handlers.onLost()
        }
      }
    }
  }
  if (!response.ok) throw await toApiError(response)
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
