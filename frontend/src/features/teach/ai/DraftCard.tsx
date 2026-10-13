import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApproveDraft, useRejectDraft } from '@/api/teachAi'
import type { AiDraft } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { pushToast } from '@/components/ui/toast-store'
import { DraftEditor } from './DraftEditor'
import { DRAFT_ICONS } from './draftKinds'

/** Bitta qoralama: holat, qisqa ko'rinish, tahrirlash, tasdiqlash yoki rad etish. */
export function DraftCard({ draft, topicId }: { draft: AiDraft; topicId: number }) {
  const { t, i18n } = useTranslation()
  const approve = useApproveDraft(topicId)
  const reject = useRejectDraft(topicId)
  const [editing, setEditing] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)

  const payload = draft.payload ?? {}
  const title = typeof payload.title === 'string' ? payload.title : null
  const count = Array.isArray(payload.items) ? payload.items.length : null
  const tone = draft.status === 'failed' ? 'red' : draft.status === 'generating' ? 'amber' : 'brand'
  const kindLabel = t(`aiDraft.kinds.${draft.kind}`)

  return (
    <article aria-label={kindLabel} className="flex flex-col gap-3 rounded-xl border-2 border-slate-100 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true">{DRAFT_ICONS[draft.kind]}</span>
        <span className="font-semibold">{kindLabel}</span>
        <Badge tone={tone}>{t(`aiDraft.status.${draft.status}`)}</Badge>
        <span className="ml-auto text-xs text-slate-500">
          {new Date(draft.created_at).toLocaleString(i18n.language)}
        </span>
      </div>

      {draft.status === 'generating' && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner size="sm" decorative />
          {t('aiDraft.generating')}
        </p>
      )}

      {draft.status === 'failed' && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex-1 text-sm text-red-700">
            {t('aiDraft.failedText')}
            {draft.error && <span className="ml-1 text-xs text-slate-500">({draft.error})</span>}
          </p>
          <Button size="sm" variant="ghost" loading={reject.isPending} onClick={() => reject.mutate(draft.id)}>
            {t('aiDraft.dismiss')}
          </Button>
        </div>
      )}

      {draft.status === 'draft' && (
        <>
          <p className="text-sm text-slate-700">
            {title && <span className="font-semibold">{title} · </span>}
            {count !== null && t('aiDraft.itemCount', { count })}
          </p>
          {editing ? (
            <DraftEditor draft={draft} topicId={topicId} onDone={() => setEditing(false)} />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                {t('aiDraft.review')}
              </Button>
              <Button
                size="sm"
                loading={approve.isPending}
                onClick={() =>
                  approve.mutate(draft.id, { onSuccess: () => pushToast('success', t('aiDraft.approved')) })
                }
              >
                {t('aiDraft.approve')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmReject(true)}>
                {t('aiDraft.reject')}
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmReject}
        title={t('aiDraft.rejectTitle')}
        text={t('aiDraft.rejectText')}
        confirmLabel={t('aiDraft.reject')}
        pending={reject.isPending}
        onCancel={() => setConfirmReject(false)}
        onConfirm={() => reject.mutate(draft.id, { onSuccess: () => setConfirmReject(false) })}
      />
    </article>
  )
}
