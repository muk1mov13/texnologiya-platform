import type { NewsAdmin } from '@/api/types'

export type NewsStatus = 'draft' | 'scheduled' | 'published'

/** `published_at` NULL — qoralama, kelajakda — rejalashtirilgan, aks holda nashr qilingan. */
export function newsStatus(news: Pick<NewsAdmin, 'published_at'>, now = Date.now()): NewsStatus {
  if (!news.published_at) return 'draft'
  return new Date(news.published_at).getTime() > now ? 'scheduled' : 'published'
}

export const NEWS_STATUS_TONE = { draft: 'slate', scheduled: 'amber', published: 'green' } as const
