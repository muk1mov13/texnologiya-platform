import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteMessage, useMessages, useUpdateMessage } from '@/api/adminCms'
import type { ContactMessage } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { Tabs } from '@/components/ui/Tabs'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDateTime } from '@/lib/format'
import { initials } from '@/lib/initials'
import { DataList } from '../ui/DataList'
import { ListSkeleton } from '../ui/ListSkeleton'
import { PageHeader } from '../ui/PageHeader'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Filter = 'all' | 'unread'

/** Kontakt email bo'lsa `mailto:`, telefon bo'lsa `tel:` havolasi. */
function ContactLink({ value }: { value: string }) {
  const linkClass = cx('inline-flex items-center gap-1.5 rounded text-brand-700 hover:underline', FOCUS_RING)
  if (EMAIL_RE.test(value)) {
    return (
      <a href={`mailto:${value}`} className={cx(linkClass, 'break-all')}>
        <Icon name="mail" className="size-3.5 shrink-0" />
        {value}
      </a>
    )
  }
  const digits = value.replace(/[^\d+]/g, '')
  if (digits.length >= 7) {
    return (
      <a href={`tel:${digits}`} className={cx(linkClass, 'tabular-nums')}>
        <Icon name="phone" className="size-3.5 shrink-0" />
        {value}
      </a>
    )
  }
  return <span className="break-all">{value}</span>
}

function MessageRow({ message, onDelete }: { message: ContactMessage; onDelete: () => void }) {
  const { t, i18n } = useTranslation()
  const update = useUpdateMessage()
  const unread = !message.is_read
  return (
    <li
      className={cx(
        'relative flex gap-4 px-5 py-5 transition-colors motion-reduce:transition-none sm:px-6',
        unread ? 'bg-brand-50/40 hover:bg-brand-50/70' : 'hover:bg-slate-50/70',
      )}
    >
      {/* O'qilmagan xabar chap chetida brand chiziq bilan ajraladi. */}
      {unread && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-brand-500" />}
      <span
        aria-hidden="true"
        className={cx(
          'grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold ring-1',
          unread ? 'bg-brand-600 text-white ring-brand-700/20' : 'bg-slate-100 text-slate-600 ring-slate-200/70',
        )}
      >
        {initials(message.name)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={cx('break-words text-slate-900', unread ? 'font-bold' : 'font-semibold')}>
            {message.name}
          </span>
          {unread && <Badge tone="brand">{t('adminMessages.new')}</Badge>}
          <span className="ml-auto text-xs text-slate-500 tabular-nums">
            {formatDateTime(message.created_at, i18n.language)}
          </span>
        </div>
        <div className="text-sm">
          <ContactLink value={message.contact} />
        </div>
        <p className="max-w-prose text-pretty whitespace-pre-line break-words text-slate-700">{message.message}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            loading={update.isPending}
            onClick={() => update.mutate({ id: message.id, is_read: !message.is_read })}
          >
            {!update.isPending && <Icon name={unread ? 'check' : 'mail'} className="size-4" />}
            {t(message.is_read ? 'adminMessages.markUnread' : 'adminMessages.markRead')}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Icon name="trash" className="size-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </li>
  )
}

export function AdminMessagesPage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const unreadOnly = filter === 'unread'
  const query = useMessages(unreadOnly)
  const remove = useDeleteMessage()
  const [deleting, setDeleting] = useState<ContactMessage | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="inbox"
        eyebrow={t('navGroups.site')}
        title={t('adminMessages.title')}
        subtitle={t('adminMessages.subtitle')}
        actions={
          <Tabs
            variant="pill"
            label={t('adminMessages.filter')}
            value={filter}
            onChange={setFilter}
            items={[
              { id: 'all', label: t('adminMessages.filterAll') },
              { id: 'unread', label: t('adminMessages.unreadOnly') },
            ]}
          />
        }
      />
      <QueryState query={query} loading={<ListSkeleton />}>
        {(messages) =>
          messages.length === 0 ? (
            <EmptyState icon="inbox" title={t(unreadOnly ? 'adminMessages.noUnread' : 'adminMessages.empty')} />
          ) : (
            <DataList>
              {messages.map((message) => (
                <MessageRow key={message.id} message={message} onDelete={() => setDeleting(message)} />
              ))}
            </DataList>
          )
        }
      </QueryState>
      <ConfirmDialog
        open={deleting !== null}
        title={t('adminMessages.deleteTitle')}
        text={t('adminMessages.deleteText', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </div>
  )
}
