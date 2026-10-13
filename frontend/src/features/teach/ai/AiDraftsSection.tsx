import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiUsage } from '@/api/ai'
import { useDrafts } from '@/api/teachAi'
import type { DraftStatus, StepEditor, TopicEditor } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { DraftCard } from './DraftCard'
import { DraftCreateModal } from './DraftCreateModal'
import { draftKindsFor } from './draftKinds'

const OPEN_STATUSES: DraftStatus[] = ['generating', 'draft', 'failed']

/**
 * Bosqich tabining tepasidagi "✨ AI bilan yaratish" bloki va shu bosqichning ochiq qoralamalari.
 * AI o'chiq yoki bosqich turiga qoralama yo'q bo'lsa hech narsa chizilmaydi.
 */
export function AiDraftsSection({ topic, step }: { topic: TopicEditor; step: StepEditor }) {
  const { t } = useTranslation()
  const usage = useAiUsage()
  const enabled = Boolean(usage.data?.enabled)
  const drafts = useDrafts(topic.id, enabled)
  const [creating, setCreating] = useState(false)
  const kinds = draftKindsFor(step.kind)

  if (!enabled || kinds.length === 0) return null

  const materials = topic.steps
    .filter((item) => item.kind === 'lecture' || item.kind === 'presentation')
    .flatMap((item) => item.materials)
    .filter((material) => material.status === 'ready')
  const items = (drafts.data ?? []).filter(
    (draft) => draft.step_id === step.id && OPEN_STATUSES.includes(draft.status),
  )

  return (
    <section
      aria-label={t('aiDraft.create')}
      className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-4"
    >
      <div>
        <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
          <span aria-hidden="true">✨ </span>
          {t('aiDraft.create')}
        </Button>
      </div>
      {items.map((draft) => (
        <DraftCard key={draft.id} draft={draft} topicId={topic.id} />
      ))}
      <DraftCreateModal
        open={creating}
        onClose={() => setCreating(false)}
        topicId={topic.id}
        stepId={step.id}
        kinds={kinds}
        materials={materials}
      />
    </section>
  )
}
