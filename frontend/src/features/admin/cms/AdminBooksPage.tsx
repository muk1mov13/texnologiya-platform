import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { adminBookFileUrl, useAdminBooks, useDeleteBook, useUpdateBook, type BookStatus } from '@/api/adminCms'
import { bookCoverUrl } from '@/api/library'
import type { BookAdmin } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { pushToast } from '@/components/ui/toast-store'
import { BookUploadModal } from '@/features/teach/BookUploadModal'
import { useProtectedDownload } from '@/lib/download'
import { formatSize } from '@/lib/format'
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
    <li className="flex flex-col gap-3 rounded-2xl border-2 border-slate-100 bg-white p-4 sm:flex-row">
      <div className="flex min-w-0 flex-1 gap-4">
        {/* Ochiq muqova faqat tasdiqlangan kitob uchun beriladi. */}
        {book.has_cover && book.is_approved ? (
          <img src={bookCoverUrl(book)} alt="" className="h-24 w-16 shrink-0 rounded-md object-cover" />
        ) : (
          <div
            className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-brand-50 text-2xl"
            aria-hidden="true"
          >
            {book.has_cover ? '🖼️' : '📘'}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-bold break-words">{book.title}</h2>
          <p className="text-sm text-slate-600">{[book.author, book.category].filter(Boolean).join(' · ')}</p>
          <p className="text-xs text-slate-500">
            {t('adminBooks.uploadedBy', { name: book.uploader_name ?? t('adminBooks.unknownUploader') })} ·{' '}
            {new Date(book.created_at).toLocaleDateString(i18n.language)} · {formatSize(book.size, i18n.language)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2 sm:flex-col sm:items-end">
        <Button
          variant={book.is_approved ? 'secondary' : 'primary'}
          size="sm"
          loading={update.isPending}
          onClick={toggleApproval}
        >
          {t(book.is_approved ? 'adminBooks.unapprove' : 'adminBooks.approve')}
        </Button>
        <span className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            loading={downloading}
            onClick={() => void download(adminBookFileUrl(book.id), book.original_name)}
          >
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('adminBooks.title')}</h1>
          <p className="text-slate-600">{t('adminBooks.subtitle')}</p>
        </div>
        <Button onClick={() => setUploading(true)}>{t('myBooks.upload')}</Button>
      </div>
      <div>
        <Tabs
          label={t('adminBooks.title')}
          value={status}
          onChange={(next) => setSearchParams({ status: next }, { replace: true })}
          items={STATUSES.map((id) => ({ id, label: t(`adminBooks.tab.${id}`) }))}
        />
        <TabPanel id={status}>
          <QueryState query={query}>
            {(books) =>
              books.length === 0 ? (
                <EmptyState icon="📚" title={t(`adminBooks.empty.${status}`)} />
              ) : (
                <ul className="flex flex-col gap-3">
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
