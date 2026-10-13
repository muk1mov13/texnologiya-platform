import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiUsage, useConversation, useConversations, useDeleteConversation } from '@/api/ai'
import type { ConversationBrief } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
import { TutorPanel } from './tutor/TutorPanel'

/** `/app/tutor`: suhbatlar ro'yxati va tanlangan (yoki yangi, umumiy) suhbat. */
export function TutorPage() {
  const { t } = useTranslation()
  const usage = useAiUsage()
  const [selected, setSelected] = useState<number | null>(null)

  if (usage.data && !usage.data.enabled) {
    return <EmptyState icon="🤖" title={t('tutor.disabled')} />
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('tutor.title')}</h1>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <ConversationList selected={selected} onSelect={setSelected} />
        <Card className="flex h-[calc(100vh-12rem)] min-h-[420px] flex-col overflow-hidden p-0 sm:p-0">
          {selected === null ? (
            <TutorPanel key="new" topicId={null} />
          ) : (
            <SelectedConversation id={selected} onNew={() => setSelected(null)} />
          )}
        </Card>
      </div>
    </div>
  )
}

function SelectedConversation({ id, onNew }: { id: number; onNew: () => void }) {
  const conversation = useConversation(id)
  return (
    <QueryState query={conversation}>
      {(data) => <TutorPanel key={data.id} topicId={data.topic_id} initial={data} onNew={onNew} />}
    </QueryState>
  )
}

interface ConversationListProps {
  selected: number | null
  onSelect: (id: number | null) => void
}

function ConversationList({ selected, onSelect }: ConversationListProps) {
  const { t, i18n } = useTranslation()
  const conversations = useConversations()
  const remove = useDeleteConversation()
  const [toDelete, setToDelete] = useState<ConversationBrief | null>(null)

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">{t('tutor.conversations')}</h2>
        <Button size="sm" variant="secondary" onClick={() => onSelect(null)}>
          {t('tutor.new')}
        </Button>
      </div>
      <QueryState query={conversations}>
        {(items) => (
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-1">
                <button
                  type="button"
                  aria-current={item.id === selected ? 'true' : undefined}
                  onClick={() => onSelect(item.id)}
                  className={cx(
                    'min-w-0 flex-1 rounded-xl px-3 py-2 text-left transition hover:bg-slate-50',
                    item.id === selected && 'bg-brand-50 font-semibold',
                    FOCUS_RING,
                  )}
                >
                  <span className="block truncate text-sm">{item.title}</span>
                  <span className="block text-xs text-slate-500">
                    {new Date(item.updated_at).toLocaleDateString(i18n.language)}
                  </span>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`${t('common.delete')}: ${item.title}`}
                  onClick={() => setToDelete(item)}
                >
                  🗑️
                </Button>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
      <ConfirmDialog
        open={toDelete !== null}
        title={t('tutor.deleteTitle')}
        text={t('tutor.deleteText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          const id = toDelete.id
          remove.mutate(id, {
            onSuccess: () => {
              setToDelete(null)
              if (id === selected) onSelect(null)
            },
          })
        }}
      />
    </Card>
  )
}
