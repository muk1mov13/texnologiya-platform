import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { bookCoverUrl, bookFileUrl, BOOKS_PAGE_SIZE, useBookCategories, useBooks } from '@/api/library'
import type { Book } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SURFACE } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatSize } from '@/lib/format'

const SEARCH_DEBOUNCE_MS = 300

/** Muqova "kitob" ko'rinishida: chap qirrada umurtqa soyasi, hover'da biroz ko'tariladi. */
function BookCover({ book }: { book: Book }) {
  return (
    <div
      className={cx(
        'relative h-36 w-26 shrink-0 overflow-hidden rounded-r-lg rounded-l-sm shadow-[0_14px_28px_-12px_rgb(4_47_46/0.45)] ring-1 ring-slate-900/5',
        'transition duration-500 ease-out group-hover:-translate-y-1 group-hover:-rotate-2 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:rotate-0',
      )}
    >
      {book.has_cover ? (
        <img src={bookCoverUrl(book)} alt="" loading="lazy" className="size-full bg-slate-100 object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-full flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-900 p-3 pl-4 text-white"
        >
          <Icon name="book" className="size-5 text-brand-200" />
          <span className="line-clamp-4 text-[0.6875rem] leading-tight font-bold">{book.title}</span>
        </div>
      )}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-white/15 to-transparent" />
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  const { t, i18n } = useTranslation()
  return (
    <li className={cx(SURFACE, 'group flex gap-5 p-5 transition duration-300 hover:ring-brand-200 motion-reduce:transition-none')}>
      <BookCover book={book} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="self-start rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">{book.category}</span>
        <h3 className="leading-snug font-bold tracking-tight break-words text-slate-900">{book.title}</h3>
        {book.author && <p className="text-sm text-slate-600">{book.author}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-3">
          <a
            href={bookFileUrl(book.id)}
            download={book.original_name}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white shadow-glow-sm transition',
              'hover:bg-brand-800 active:scale-[0.97] motion-reduce:transition-none',
              FOCUS_RING,
            )}
          >
            <Icon name="download" className="size-4" />
            {t('library.download')}
            <span className="sr-only">: {book.title}</span>
          </a>
          <span className="text-xs text-slate-500 tabular-nums">{formatSize(book.size, i18n.language)}</span>
        </div>
      </div>
    </li>
  )
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={cx(SURFACE, 'flex gap-5 p-5')}>
          <Skeleton className="h-36 w-26 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-auto h-9 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Kitoblar katalogi: qidiruv, kategoriya va sahifa URL'da (`?tab=books&q=&category=&page=`). */
export function BookCatalog() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const [search, setSearch] = useState(q)
  const books = useBooks({ category, q, page })
  const categories = useBookCategories()

  function update(changes: Record<string, string>) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    const value = search.trim()
    if (value === q) return
    const timer = window.setTimeout(() => update({ q: value, page: '' }), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
    // `update` har render'da yangi, lekin faqat `search` o'zgarishi kerak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, q])

  return (
    <div className="flex flex-col gap-5">
      <div className={cx(SURFACE, 'grid gap-3 p-3 sm:grid-cols-[1fr_16rem]')}>
        <Input
          icon="search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('library.searchPlaceholder')}
          aria-label={t('library.search')}
          maxLength={100}
        />
        <Select
          value={category}
          onChange={(event) => update({ category: event.target.value, page: '' })}
          aria-label={t('library.category')}
        >
          <option value="">{t('library.allCategories')}</option>
          {(categories.data ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <QueryState query={books} loading={<CatalogSkeleton />}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState icon="📚" title={t(q || category ? 'library.noBooksFound' : 'library.noBooks')} />
          ) : (
            <>
              <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {data.items.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </ul>
              <Pagination
                page={page}
                total={data.total}
                size={BOOKS_PAGE_SIZE}
                onChange={(next) => update({ page: next > 1 ? String(next) : '' })}
              />
            </>
          )
        }
      </QueryState>
    </div>
  )
}
