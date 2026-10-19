import { useEffect, useRef, useState } from 'react'
import { streamSupport, supportSessionKey } from '@/api/support'
import type { Citation, SupportLang } from '@/api/types'

export interface SupportChatMessage {
  key: string
  role: 'user' | 'assistant'
  content: string
  citations: Citation[]
  streaming: boolean
}

/** Backend `SUPPORT_MESSAGE_CHARS` bilan bir xil. */
export const MAX_SUPPORT_CHARS = 500

const MESSAGES_STORAGE_KEY = 'support-messages'

function loadMessages(): SupportChatMessage[] {
  try {
    const raw = sessionStorage.getItem(MESSAGES_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SupportChatMessage[]).filter((m) => !m.streaming) : []
  } catch {
    return []
  }
}

function saveMessages(messages: SupportChatMessage[]) {
  try {
    sessionStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // Storage yopiq (maxfiy oyna): suhbat faqat sahifa ochiq turganda saqlanadi.
  }
}

/** Mehmon suhbati: optimistik savol, oqimli javob; xabarlar va kalit shu tab davomida saqlanadi. */
export function useSupportChat(lang: SupportLang) {
  const [sessionKey, setSessionKey] = useState(() => supportSessionKey())
  const [messages, setMessages] = useState<SupportChatMessage[]>(loadMessages)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const abortRef = useRef<AbortController | null>(null)
  const seq = useRef(0)

  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => {
    if (!pending) saveMessages(messages)
  }, [messages, pending])

  const patch = (key: string, change: (message: SupportChatMessage) => SupportChatMessage) =>
    setMessages((list) => list.map((message) => (message.key === key ? change(message) : message)))

  async function send(text: string) {
    const message = text.trim()
    if (!message || pending) return
    const controller = new AbortController()
    abortRef.current = controller
    seq.current += 1
    const stamp = `${Date.now()}-${seq.current}`
    const answerKey = `a-${stamp}`
    setMessages((list) => [
      ...list,
      { key: `u-${stamp}`, role: 'user', content: message, citations: [], streaming: false },
      { key: answerKey, role: 'assistant', content: '', citations: [], streaming: true },
    ])
    setPending(true)
    setError(null)
    try {
      await streamSupport(
        { message, session_key: sessionKey, lang },
        {
          onDelta: (piece) => patch(answerKey, (m) => ({ ...m, content: m.content + piece })),
          onMeta: (meta) => patch(answerKey, (m) => ({ ...m, citations: meta.citations })),
        },
        controller.signal,
      )
      patch(answerKey, (m) => ({ ...m, streaming: false }))
    } catch (caught) {
      if (controller.signal.aborted) return
      // Savol ham olib tashlanadi: u serverda saqlanmagan, matni esa maydonga qaytariladi.
      setMessages((list) => list.filter((m) => m.key !== answerKey && m.key !== `u-${stamp}`))
      setError(caught)
      throw caught
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function reset() {
    abortRef.current?.abort()
    setSessionKey(supportSessionKey(true))
    setMessages([])
    setPending(false)
    setError(null)
  }

  return { messages, pending, error, send, reset }
}
