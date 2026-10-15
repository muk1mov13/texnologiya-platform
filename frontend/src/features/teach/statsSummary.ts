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
