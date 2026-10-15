import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { adminBookFileUrl, useAdminBooks, useDeleteBook, useUpdateBook, type BookStatus } from '@/api/adminCms'
import { bookCoverUrl } from '@/api/library'
import type { BookAdmin } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { pushToast } from '@/components/ui/toast-store'
import { BookUploadModal } from '@/features/teach/BookUploadModal'
import { useProtectedDownload } from '@/lib/download'
import { formatDate, formatSize } from '@/lib/format'
import { ListSkeleton } from '../ui/ListSkeleton'
import { PageHeader } from '../ui/PageHeader'
import { BookEditModal } from './BookEditModal'

// Admin yuklagan kitob darhol tasdiqlanadi, shuning uchun asosiy ro'yxat — tasdiqlanganlar.
const STATUSES: BookStatus[] = ['approved', 'pending']

function BookRow({
  book,
  onEdit,
  onDelete,
}: {
  book: BookAdmin
  onEdit: () => void
  onDelete: () => void
}) {
  const { t, i18n } = useTranslation()
  const update = useUpdateBook()
  const { download, pending: downloading } = useProtectedDownload()

  function toggleApproval() {
    const is_approved = !book.is_approved
    update.mutate(
      { id: book.id, data: { is_approved } },
      { onSuccess: () => pushToast('success', t(is_approved ? 'adminBooks.approvedToast' : 'adminBooks.unapprovedToast')) },
    )
  }

  return (
    <li
      aria-label={book.title}
      className="flex flex-col rounded-3xl bg-white shadow-soft ring-1 ring-slate-200/70 transition hover:ring-brand-200 motion-reduce:transition-none"
    >
      <div className="flex min-w-0 flex-1 gap-4 p-5">
        {/* Ochiq muqova faqat tasdiqlangan kitob uchun beriladi. */}
        {book.has_cover && book.is_approved ? (
          <img
            src={bookCoverUrl(book)}
            alt=""
            className="h-32 w-[5.5rem] shrink-0 rounded-xl object-cover shadow-[0_8px_20px_-8px_rgb(15_23_42/0.35)] ring-1 ring-slate-900/5"
          />
        ) : (
          <div
            className="flex h-32 w-[5.5rem] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-200/60"
            aria-hidden="true"
          >
            <Icon name={book.has_cover ? 'camera' : 'book'} className="size-7" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Badge dot tone={book.is_approved ? 'green' : 'amber'}>
            {t(`adminBooks.tab.${book.is_approved ? 'approved' : 'pending'}`)}
          </Badge>
          <h2 className="font-bold tracking-tight break-words text-slate-900">{book.title}</h2>
          <p className="text-sm text-slate-600">{[book.author, book.category].filter(Boolean).join(' · ')}</p>
          <p className="mt-auto text-xs text-slate-500 tabular-nums">
            {t('adminBooks.uploadedBy', { name: book.uploader_name ?? t('adminBooks.unknownUploader') })}
            <br />
            {formatDate(book.created_at, i18n.language)} · {formatSize(book.size, i18n.language)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 px-4 py-3">
        <Button
          variant={book.is_approved ? 'secondary' : 'primary'}
          size="sm"
          loading={update.isPending}
          onClick={toggleApproval}
        >
          {!book.is_approved && <Icon name="check" className="size-4" />}
          {t(book.is_approved ? 'adminBooks.unapprove' : 'adminBooks.approve')}
        </Button>
        <span className="ml-auto flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            loading={downloading}
            onClick={() => void download(adminBookFileUrl(book.id), book.original_name)}
          >
            {!downloading && <Icon name="download" className="size-4" />}
            {t('adminBooks.open')}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            {t('common.edit')}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            {t('common.delete')}
          </Button>
        </span>
      </div>
    </li>
  )
}

export function AdminBooksPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const status: BookStatus = searchParams.get('status') === 'pending' ? 'pending' : 'approved'
  const query = useAdminBooks(status)
  const remove = useDeleteBook()
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<BookAdmin | null>(null)
  const [deleting, setDeleting] = useState<BookAdmin | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="book"
        eyebrow={t('navGroups.site')}
        title={t('adminBooks.title')}
        subtitle={t('adminBooks.subtitle')}
        actions={
          <Button onClick={() => setUploading(true)}>
            <Icon name="plus" className="size-4" />
            {t('myBooks.upload')}
          </Button>
        }
      />
      <div>
        <Tabs
          variant="pill"
          label={t('adminBooks.title')}
          value={status}
          onChange={(next) => setSearchParams({ status: next }, { replace: true })}
          items={STATUSES.map((id) => ({ id, label: t(`adminBooks.tab.${id}`) }))}
        />
        <TabPanel id={status}>
          <QueryState query={query} loading={<ListSkeleton rows={3} />}>
            {(books) =>
              books.length === 0 ? (
                <EmptyState icon="book" title={t(`adminBooks.empty.${status}`)} />
              ) : (
                <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {books.map((book) => (
                    <BookRow
                      key={book.id}
                      book={book}
                      onEdit={() => setEditing(book)}
                      onDelete={() => setDeleting(book)}
                    />
                  ))}
                </ul>
              )
            }
          </QueryState>
        </TabPanel>
      </div>
      <BookUploadModal open={uploading} onClose={() => setUploading(false)} />
      <BookEditModal book={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        title={t('myBooks.deleteTitle')}
        text={t('myBooks.deleteText', { title: deleting?.title ?? '' })}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </div>
  )
}
