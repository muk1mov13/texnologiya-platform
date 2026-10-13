import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { aiKeys, streamChat } from '@/api/ai'
import type { ChatMessageView, Citation, ConversationDetail, MessageMode, MessageRole } from '@/api/types'

export interface TutorMessage {
  key: string
  role: MessageRole
  content: string
  mode: MessageMode | null
  citations: Citation[]
  streaming: boolean
}

/** Backend `MAX_MESSAGE_CHARS` bilan bir xil. */
export const MAX_MESSAGE_CHARS = 1000

function fromView(message: ChatMessageView): TutorMessage {
  return {
    key: `m-${message.id}`,
    role: message.role,
    content: message.content,
    mode: message.mode,
    citations: message.citations,
    streaming: false,
  }
}

/** Bitta suhbat: optimistik talaba xabari, oqimli javob, `meta` dan rejim va manbalar. */
export function useTutorChat(topicId: number | null, initial?: ConversationDetail) {
  const queryClient = useQueryClient()
  const [conversationId, setConversationId] = useState<number | null>(initial?.id ?? null)
  const [messages, setMessages] = useState<TutorMessage[]>(() => initial?.messages.map(fromView) ?? [])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const abortRef = useRef<AbortController | null>(null)
  const seq = useRef(0)

  useEffect(() => () => abortRef.current?.abort(), [])

  const patch = (key: string, change: (message: TutorMessage) => TutorMessage) =>
    setMessages((list) => list.map((message) => (message.key === key ? change(message) : message)))

  async function send(text: string) {
    const message = text.trim()
    if (!message || pending) return
    const controller = new AbortController()
    abortRef.current = controller
    seq.current += 1
    const answerKey = `a-${seq.current}`
    setMessages((list) => [
      ...list,
      { key: `u-${seq.current}`, role: 'user', content: message, mode: null, citations: [], streaming: false },
      { key: answerKey, role: 'assistant', content: '', mode: null, citations: [], streaming: true },
    ])
    setPending(true)
    setError(null)
    try {
      await streamChat(
        { message, topic_id: topicId, conversation_id: conversationId },
        {
          onDelta: (piece) => patch(answerKey, (m) => ({ ...m, content: m.content + piece })),
          onMeta: (meta) => {
            setConversationId(meta.conversation_id)
            patch(answerKey, (m) => ({ ...m, mode: meta.mode, citations: meta.citations }))
          },
        },
        controller.signal,
      )
      patch(answerKey, (m) => ({ ...m, streaming: false }))
    } catch (caught) {
      if (controller.signal.aborted) return
      setMessages((list) => list.filter((m) => m.key !== answerKey))
      setError(caught)
    } finally {
      if (!controller.signal.aborted) {
        setPending(false)
        void queryClient.invalidateQueries({ queryKey: aiKeys.usage })
        void queryClient.invalidateQueries({ queryKey: aiKeys.conversations })
      }
    }
  }

  function reset() {
    abortRef.current?.abort()
    setConversationId(null)
    setMessages([])
    setPending(false)
    setError(null)
  }

  return { messages, conversationId, pending, error, send, reset }
}
