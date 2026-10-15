import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiUsage, useConversation, useConversations, useDeleteConversation } from '@/api/ai'
import type { ConversationBrief } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/icons/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { PAGE_TITLE, SURFACE } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { TutorPanel } from './tutor/TutorPanel'

/** `/app/tutor`: suhbatlar ro'yxati va tanlangan (yoki yangi, umumiy) suhbat. */
export function TutorPage() {
  const { t } = useTranslation()
  const usage = useAiUsage()
  const [selected, setSelected] = useState<number | null>(null)

  if (usage.data && !usage.data.enabled) {
    return <EmptyState icon="sparkles" title={t('tutor.disabled')} />
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className={PAGE_TITLE}>{t('tutor.title')}</h1>
        <p className="max-w-2xl text-pretty text-slate-600">{t('tutor.subtitle')}</p>
      </header>
      <div className="grid gap-5 md:grid-cols-[290px_minmax(0,1fr)]">
        <ConversationList selected={selected} onSelect={setSelected} />
        <div className={cx(SURFACE, 'flex h-[calc(100dvh-14rem)] min-h-[440px] flex-col overflow-hidden')}>
          {selected === null ? (
            <TutorPanel
              key="new"
              topicId={null}
              suggestions={[t('tutor.suggestion1'), t('tutor.suggestion2'), t('tutor.suggestion3')]}
            />
          ) : (
            <SelectedConversation id={selected} onNew={() => setSelected(null)} />
          )}
        </div>
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
    <div className={cx(SURFACE, 'flex flex-col gap-3 self-start p-4')}>
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="font-bold tracking-tight text-slate-900">{t('tutor.conversations')}</h2>
        <Button size="sm" onClick={() => onSelect(null)}>
          <Icon name="plus" className="size-4" />
          {t('tutor.new')}
        </Button>
      </div>
      <QueryState query={conversations}>
        {(items) =>
          items.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
              {t('tutor.noConversations')}
            </p>
          ) : (
          <ul className="-mx-1 flex max-h-[60dvh] flex-col gap-1 overflow-y-auto px-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-1">
                <button
                  type="button"
                  aria-current={item.id === selected ? 'true' : undefined}
                  onClick={() => onSelect(item.id)}
                  className={cx(
                    'flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2.5 py-2 text-left transition motion-reduce:transition-none',
                    item.id === selected
                      ? 'bg-brand-50 font-semibold text-brand-900 ring-1 ring-brand-200/70'
                      : 'text-slate-700 hover:bg-slate-50',
                    FOCUS_RING,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      'grid size-8 shrink-0 place-items-center rounded-lg',
                      item.id === selected ? 'bg-white text-brand-700 ring-1 ring-brand-200' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Icon name="chat" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{item.title}</span>
                    <span className="block text-xs font-normal text-slate-500">
                      {formatDate(item.updated_at, i18n.language)}
                    </span>
                  </span>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`${t('common.delete')}: ${item.title}`}
                  onClick={() => setToDelete(item)}
                >
                  <Icon name="trash" className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          )
        }
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
    </div>
  )
}
