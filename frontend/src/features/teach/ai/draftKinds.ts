import type { DraftKind, StepKind } from '@/api/types'

/** Backend `COUNT_RANGE` bilan bir xil. */
export const COUNT_RANGE: Record<DraftKind, [number, number]> = {
  quiz: [3, 15],
  yesno: [3, 15],
  crossword: [5, 12],
  glossary: [3, 15],
  task: [1, 1],
}

export const DRAFT_ICONS: Record<DraftKind, string> = {
  quiz: '📝',
  yesno: '✅',
  crossword: '🧩',
  glossary: '📖',
  task: '📌',
}

export const MAX_DRAFT_MATERIALS = 3

/** Bosqich turiga mos qoralama turlari (backend `STEP_FOR_KIND`). */
export function draftKindsFor(step: StepKind): DraftKind[] {
  if (step === 'review' || step === 'practice') return ['quiz', 'yesno', 'crossword']
  if (step === 'glossary') return ['glossary']
  if (step === 'task') return ['task']
  return []
}

/** Formadagi boshlang'ich son: 5, lekin tur oralig'iga siqilgan (vazifa uchun 1). */
export function defaultCount(kind: DraftKind): number {
  const [low, high] = COUNT_RANGE[kind]
  return Math.min(Math.max(5, low), high)
}
