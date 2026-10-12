import type { StepKind } from '@/api/types'

export const STEP_KINDS: readonly StepKind[] = [
  'review',
  'lecture',
  'presentation',
  'practice',
  'task',
  'glossary',
  'literature',
]

/** "Tugatdim" tugmasi bilan yakunlanadigan bosqichlar (qolganlari 2-bosqichda faoliyat orqali). */
export const SELF_COMPLETE_KINDS: ReadonlySet<StepKind> = new Set([
  'lecture',
  'presentation',
  'glossary',
  'literature',
])

/** Faoliyatlar (test, ha/yo'q, krossvord) orqali yakunlanadigan bosqichlar. */
export const ACTIVITY_KINDS: ReadonlySet<StepKind> = new Set(['review', 'practice'])

/** Fayl (PDF/PPT/DOC) yuklanadigan bosqichlar. */
export const FILE_KINDS: ReadonlySet<StepKind> = new Set(['lecture', 'presentation'])

export const STEP_ICONS: Record<StepKind, string> = {
  review: '🔁',
  lecture: '📖',
  presentation: '🖥️',
  practice: '✍️',
  task: '📝',
  glossary: '🔤',
  literature: '📚',
}

export function isStepKind(value: string | null | undefined): value is StepKind {
  return value != null && (STEP_KINDS as readonly string[]).includes(value)
}
