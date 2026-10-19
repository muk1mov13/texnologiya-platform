import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteSupportSession, useSupportSession, useSupportSessions } from '@/api/adminAi'
import type { SupportSession } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDateTime } from '@/lib/format'
import { plainText } from '@/lib/plainText'
import { DataList } from './ui/DataList'
import { ListSkeleton } from './ui/ListSkeleton'
import { PageHeader } from './ui/PageHeader'

const PAGE_SIZE = 20

/** `/admin/ai/support`: mehmonlar AI yordamchiga bergan savollar (FAQ'ni boyitish uchun). */
export function AdminSupportPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<SupportSession | null>(null)
  const query = useSupportSessions(page)
  const remove = useDeleteSupportSession()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="chat"
        eyebrow={t('navGroups.site')}
        title={t('adminSupport.title')}
        subtitle={t('adminSupport.subtitle')}
      />
      <QueryState query={query} loading={<ListSkeleton />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState icon="chat" title={t('adminSupport.empty')} />
          ) : (
            <div className="flex flex-col gap-4">
              <DataList>
                {data.items.map((session) => (
                  <SessionRow
                    key={session.session_key}
                    session={session}
                    open={openKey === session.session_key}
                    onToggle={() => setOpenKey((key) => (key === session.session_key ? null : session.session_key))}
                    onDelete={() => setDeleting(session)}
                  />
                ))}
              </DataList>
              <Pagination page={page} total={data.total} size={PAGE_SIZE} onChange={setPage} />
            </div>
          )
        }
      </QueryState>
      <ConfirmDialog
        open={deleting !== null}
        title={t('adminSupport.deleteTitle')}
        text={t('adminSupport.deleteText')}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.session_key, { onSettled: () => setDeleting(null) })}
      />
    </div>
  )
}

interface SessionRowProps {
  session: SupportSession
  open: boolean
  onToggle: () => void
  onDelete: () => void
}

function SessionRow({ session, open, onToggle, onDelete }: SessionRowProps) {
  const { t, i18n } = useTranslation()
  const panelId = `support-${session.session_key}`
  return (
    <li className="flex flex-col">
      <div className="flex items-start gap-3 px-5 py-4 sm:px-6">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className={cx('flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left', FOCUS_RING)}
        >
          <Icon
            name="chevronRight"
            className={cx('mt-0.5 size-4 shrink-0 text-slate-400 transition-transform motion-reduce:transition-none', open && 'rotate-90')}
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="line-clamp-2 font-semibold break-words text-slate-900">{session.first_question}</span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <Badge tone="slate">{t('adminSupport.messages', { count: session.messages })}</Badge>
              <span className="tabular-nums">{formatDateTime(session.last_at, i18n.language)}</span>
            </span>
          </span>
        </button>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label={t('common.delete')}>
          <Icon name="trash" className="size-4" />
        </Button>
      </div>
      {open && (
        <div id={panelId} className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <SessionMessages sessionKey={session.session_key} />
        </div>
      )}
    </li>
  )
}

function SessionMessages({ sessionKey }: { sessionKey: string }) {
  const { t, i18n } = useTranslation()
  const query = useSupportSession(sessionKey)
  return (
    <QueryState query={query} loading={<Skeleton className="h-24" />}>
      {(messages) => (
        <ol className="flex flex-col gap-4">
          {messages.map((message) => (
            <li key={message.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold break-words text-slate-900">{message.question}</p>
                <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                  {formatDateTime(message.created_at, i18n.language)}
                </span>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-700 ring-1 ring-slate-200/70">
                {plainText(message.answer)}
              </div>
              {message.citations.length > 0 && (
                <p className="text-xs text-slate-500">
                  {t('support.sources')}: {message.citations.map((c) => `[${c.n}] ${c.title}`).join('; ')}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </QueryState>
  )
}
