import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { readSse } from '@/lib/sse'
import { ApiError, apiFetch, apiStream } from './client'
import type { AiUsageMe, ChatIn, ChatMeta, ConversationBrief, ConversationDetail } from './types'

export const aiKeys = {
  usage: ['ai', 'usage'] as const,
  conversations: ['ai', 'conversations'] as const,
  conversation: (id: number) => ['ai', 'conversations', id] as const,
}

/** AI yoqilganmi va bugungi sarf. Barcha rollar uchun; AI elementlarini ko'rsatish shu bo'yicha. */
export function useAiUsage() {
  return useQuery({
    queryKey: aiKeys.usage,
    queryFn: ({ signal }) => apiFetch<AiUsageMe>('/api/ai/usage', { signal }),
    staleTime: 60_000,
  })
}

export function useConversations() {
  return useQuery({
    queryKey: aiKeys.conversations,
    queryFn: ({ signal }) => apiFetch<ConversationBrief[]>('/api/ai/conversations', { signal }),
  })
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: aiKeys.conversation(id ?? 0),
    queryFn: ({ signal }) => apiFetch<ConversationDetail>(`/api/ai/conversations/${id}`, { signal }),
    enabled: id !== null,
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/ai/conversations/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiKeys.conversations }),
  })
}

interface ChatHandlers {
  onDelta: (text: string) => void
  onMeta: (meta: ChatMeta) => void
}

/** `POST /api/ai/chat` oqimi. Oldindan xato (429/503) — `ApiError`; oqimdagi `error` ham `ApiError`. */
export async function streamChat(input: ChatIn, handlers: ChatHandlers, signal: AbortSignal): Promise<void> {
  const response = await apiStream('/api/ai/chat', { method: 'POST', json: input, signal })
  if (!response.body) throw new ApiError(503, { code: 'AI_BUSY', message: 'AI_BUSY', details: {} })
  for await (const { event, data } of readSse(response.body)) {
    const payload: unknown = JSON.parse(data)
    if (event === 'delta') handlers.onDelta((payload as { text: string }).text)
    else if (event === 'meta') handlers.onMeta(payload as ChatMeta)
    else if (event === 'error') {
      const body = payload as { code: string; message: string }
      throw new ApiError(503, { code: body.code, message: body.message, details: {} })
    }
  }
}
