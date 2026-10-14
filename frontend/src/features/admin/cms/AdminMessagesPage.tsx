import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteMessage, useMessages, useUpdateMessage } from '@/api/adminCms'
import type { ContactMessage } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Checkbox } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { cx } from '@/lib/cx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Kontakt email bo'lsa `mailto:`, telefon bo'lsa `tel:` havolasi. */
function ContactLink({ value }: { value: string }) {
  if (EMAIL_RE.test(value)) {
    return (
      <a href={`mailto:${value}`} className="break-all text-brand-700 hover:underline">
        {value}
      </a>
    )
  }
  const digits = value.replace(/[^\d+]/g, '')
  if (digits.length >= 7) {
    return (
      <a href={`tel:${digits}`} className="text-brand-700 hover:underline">
        {value}
      </a>
    )
  }
  return <span className="break-all">{value}</span>
}

function MessageCard({ message, onDelete }: { message: ContactMessage; onDelete: () => void }) {
  const { t, i18n } = useTranslation()
  const update = useUpdateMessage()
  return (
    <li
      className={cx(
        'flex flex-col gap-3 rounded-2xl border-2 bg-white p-4',
        message.is_read ? 'border-slate-100' : 'border-brand-200',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold break-words">{message.name}</span>
        <ContactLink value={message.contact} />
        {!message.is_read && <Badge tone="brand">{t('adminMessages.new')}</Badge>}
        <span className="ml-auto text-sm text-slate-500">
          {new Date(message.created_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>
      <p className="whitespace-pre-line break-words text-slate-800">{message.message}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={update.isPending}
          onClick={() => update.mutate({ id: message.id, is_read: !message.is_read })}
        >
          {t(message.is_read ? 'adminMessages.markUnread' : 'adminMessages.markRead')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          {t('common.delete')}
        </Button>
      </div>
    </li>
  )
}

export function AdminMessagesPage() {
  const { t } = useTranslation()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const query = useMessages(unreadOnly)
  const remove = useDeleteMessage()
  const [deleting, setDeleting] = useState<ContactMessage | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('adminMessages.title')}</h1>
          <p className="text-slate-600">{t('adminMessages.subtitle')}</p>
        </div>
        <Checkbox
          label={t('adminMessages.unreadOnly')}
          checked={unreadOnly}
          onChange={(event) => setUnreadOnly(event.target.checked)}
        />
      </div>
      <QueryState query={query}>
        {(messages) =>
          messages.length === 0 ? (
            <EmptyState icon="✉️" title={t(unreadOnly ? 'adminMessages.noUnread' : 'adminMessages.empty')} />
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((message) => (
                <MessageCard key={message.id} message={message} onDelete={() => setDeleting(message)} />
              ))}
            </ul>
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
