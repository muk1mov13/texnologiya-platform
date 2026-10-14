import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { bookCoverUrl, bookFileUrl, useDeleteMyBook, useMyBooks } from '@/api/library'
import type { Book } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { formatSize } from '@/lib/format'
import { BookUploadModal } from './BookUploadModal'

export function MyBooksPage() {
  const { t, i18n } = useTranslation()
  const query = useMyBooks()
  const remove = useDeleteMyBook()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<Book | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('myBooks.title')}</h1>
          <p className="text-slate-600">{t('myBooks.subtitle')}</p>
        </div>
        <Button onClick={() => setUploading(true)}>{t('myBooks.upload')}</Button>
      </div>
      <QueryState query={query}>
        {(books) =>
          books.length === 0 ? (
            <EmptyState icon="📘" title={t('myBooks.empty')} text={t('myBooks.emptyText')} />
          ) : (
            <ul className="flex flex-col gap-3">
              {books.map((book) => (
                <li key={book.id} className="flex gap-4 rounded-2xl border-2 border-slate-100 bg-white p-4">
                  {book.has_cover && book.is_approved ? (
                    <img src={bookCoverUrl(book)} alt="" className="h-20 w-14 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div
                      className="flex h-20 w-14 shrink-0 items-center justify-center rounded-md bg-brand-50 text-2xl"
                      aria-hidden="true"
                    >
                      📘
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold break-words">{book.title}</h2>
                      <Badge tone={book.is_approved ? 'green' : 'amber'}>
                        {t(book.is_approved ? 'myBooks.approved' : 'myBooks.pending')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {[book.author, book.category].filter(Boolean).join(' · ')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {book.original_name} · {formatSize(book.size, i18n.language)} ·{' '}
                      {new Date(book.created_at).toLocaleDateString(i18n.language)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {book.is_approved ? (
                      <a href={bookFileUrl(book.id)} download={book.original_name} className="text-sm font-semibold text-brand-700 hover:underline">
                        {t('library.download')}
                      </a>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(book)}>
                        {t('common.delete')}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
      <BookUploadModal open={uploading} onClose={() => setUploading(false)} />
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
