import type { TopicStats } from '@/api/types'

export interface StatsSummary {
  /** Eng ko'p talaba boshlagan mavzudagi talabalar soni (fan bo'yicha faol talabalar taxmini). */
  activeStudents: number
  /** Tugatganlar / boshlaganlar, 0–100; hech kim boshlamagan bo'lsa `null`. */
  completionRate: number | null
  /** Natijasi bor mavzular bo'yicha o'rtacha eng yaxshi natija, 0–100; natija yo'q bo'lsa `null`. */
  avgScore: number | null
  pending: number
}

/** Mavzular statistikasidan fan bo'yicha umumiy ko'rsatkichlar. */
export function summarize(rows: TopicStats[]): StatsSummary {
  let started = 0
  let completed = 0
  let pending = 0
  let activeStudents = 0
  const scores: number[] = []
  for (const row of rows) {
    started += row.started
    completed += row.completed
    pending += row.pending_submissions
    activeStudents = Math.max(activeStudents, row.started)
    if (row.avg_best_percent !== null) scores.push(row.avg_best_percent)
  }
  return {
    activeStudents,
    completionRate: started === 0 ? null : (completed / started) * 100,
    avgScore: scores.length === 0 ? null : scores.reduce((sum, value) => sum + value, 0) / scores.length,
    pending,
  }
}

/** Foiz ko'rinishi: butun songa yaxlitlangan yoki `—`. */
export function percent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`
}

/** Tugatish ulushi (0–100) bitta mavzu uchun; boshlagan yo'q bo'lsa `null`. */
export function completionOf(row: TopicStats): number | null {
  return row.started === 0 ? null : (row.completed / row.started) * 100
}

export type SortKey = 'order' | 'title' | 'started' | 'completion' | 'score' | 'pending'
export type SortDir = 'asc' | 'desc'

function sortValue(row: TopicStats, key: Exclude<SortKey, 'order' | 'title'>): number | null {
  if (key === 'started') return row.started
  if (key === 'completion') return completionOf(row)
  if (key === 'score') return row.avg_best_percent
  return row.pending_submissions
}

/**
 * Mavzular qatorini saralaydi (asl massiv o'zgarmaydi). `order` — backenddagi mavzu tartibi.
 * Qiymati yo'q (`null`) qatorlar yo'nalishdan qat'i nazar oxirida qoladi.
 */
export function sortRows(rows: TopicStats[], key: SortKey, dir: SortDir): TopicStats[] {
  const indexed = rows.map((row, index) => ({ row, index }))
  const sign = dir === 'asc' ? 1 : -1
  indexed.sort((a, b) => {
    if (key === 'order') return sign * (a.index - b.index)
    if (key === 'title') return sign * a.row.topic_title.localeCompare(b.row.topic_title)
    const x = sortValue(a.row, key)
    const y = sortValue(b.row, key)
    if (x === null || y === null) return x === y ? a.index - b.index : x === null ? 1 : -1
    return sign * (x - y) || a.index - b.index
  })
  return indexed.map((item) => item.row)
}

/** Natija rangi: 80+ yaxshi, 50–79 o'rta, <50 past. */
export function scoreTone(value: number | null): 'good' | 'mid' | 'low' | 'none' {
  if (value === null) return 'none'
  return value >= 80 ? 'good' : value >= 50 ? 'mid' : 'low'
}
