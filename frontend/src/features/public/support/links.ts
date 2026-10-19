import { bookFileUrl, documentFileUrl } from '@/api/library'
import type { Citation } from '@/api/types'

/** Yordamchi javobida uchraydigan sayt sahifalari (backend `support.PLATFORM_FACTS` bilan bir xil). */
const SITE_PATH = /(?<![\w/.:])(\/(?:contact|register|login|library|news|faq|about))(?![\w/-])/g

export type AnswerPart = { kind: 'text'; text: string } | { kind: 'link'; to: string }

/** Javob matnini oddiy matn va ichki havolalarga ajratadi. */
export function splitLinks(text: string): AnswerPart[] {
  const parts: AnswerPart[] = []
  let last = 0
  for (const match of text.matchAll(SITE_PATH)) {
    const start = match.index
    if (start > last) parts.push({ kind: 'text', text: text.slice(last, start) })
    parts.push({ kind: 'link', to: match[1] })
    last = start + match[0].length
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) })
  return parts
}

/** Kutubxona manbasining ochiq fayl manzili (boshqa turlar mehmonga ko'rsatilmaydi). */
export function citationUrl(citation: Citation): string | null {
  if (citation.source_type === 'document') return documentFileUrl(citation.source_id)
  if (citation.source_type === 'book') return bookFileUrl(citation.source_id)
  return null
}
