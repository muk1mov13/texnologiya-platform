import { useQuery } from '@tanstack/react-query'
import { readSse } from '@/lib/sse'
import { ApiError, apiFetch, apiStream } from './client'
import type { SupportChatIn, SupportMeta, SupportStatus } from './types'

export const supportKeys = {
  status: ['support', 'status'] as const,
}

/** Ochiq AI yordamchi yoqilganmi. O'chiq bo'lsa vidjet umuman chiqmaydi. */
export function useSupportStatus() {
  return useQuery({
    queryKey: supportKeys.status,
    queryFn: ({ signal }) => apiFetch<SupportStatus>('/api/ai/support/status', { signal }),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

const SESSION_STORAGE_KEY = 'support-session'

function randomUuid(): string {
  // `crypto.randomUUID` faqat HTTPS'da bor; ichki IP (http) uchun `getRandomValues` bilan.
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Mehmon suhbatining kaliti: shu tab davomida (`sessionStorage`), ekrandagi xabarlar bilan birga. */
export function supportSessionKey(renew = false): string {
  try {
    const saved = renew ? null : sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (saved) return saved
    const key = randomUuid()
    sessionStorage.setItem(SESSION_STORAGE_KEY, key)
    return key
  } catch {
    return randomUuid()
  }
}

interface SupportHandlers {
  onDelta: (text: string) => void
  onMeta: (meta: SupportMeta) => void
}

/** `POST /api/ai/support/chat` oqimi (`streamChat` bilan bir xil hodisalar). */
export async function streamSupport(
  input: SupportChatIn,
  handlers: SupportHandlers,
  signal: AbortSignal,
): Promise<void> {
  const response = await apiStream('/api/ai/support/chat', { method: 'POST', json: input, signal })
  if (!response.body) throw new ApiError(503, { code: 'AI_BUSY', message: 'AI_BUSY', details: {} })
  for await (const { event, data } of readSse(response.body)) {
    const payload: unknown = JSON.parse(data)
    if (event === 'delta') handlers.onDelta((payload as { text: string }).text)
    else if (event === 'meta') handlers.onMeta(payload as SupportMeta)
    else if (event === 'error') {
      const body = payload as { code: string; message: string }
      throw new ApiError(503, { code: body.code, message: body.message, details: {} })
    }
  }
}
