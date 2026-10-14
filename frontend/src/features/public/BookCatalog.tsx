import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { bookCoverUrl, bookFileUrl, BOOKS_PAGE_SIZE, useBookCategories, useBooks } from '@/api/library'
import type { Book } from '@/api/types'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { QueryState } from '@/components/ui/QueryState'
import { formatSize } from '@/lib/format'

const SEARCH_DEBOUNCE_MS = 300

function BookCard({ book }: { book: Book }) {
  const { t, i18n } = useTranslation()
  return (
    <li className="flex gap-4 rounded-2xl border-2 border-slate-100 bg-white p-4">
      {book.has_cover ? (
        <img
          src={bookCoverUrl(book)}
          alt=""
          loading="lazy"
          className="h-32 w-24 shrink-0 rounded-lg bg-slate-100 object-cover"
        />
      ) : (
        <div
          className="flex h-32 w-24 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-4xl"
          aria-hidden="true"
        >
          📘
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="self-start rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {book.category}
        </span>
        <h3 className="font-bold break-words">{book.title}</h3>
        {book.author && <p className="text-sm text-slate-600">{book.author}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <a href={bookFileUrl(book.id)} download={book.original_name} className={buttonClasses('secondary', 'sm')}>
            {t('library.download')}
            <span className="sr-only">: {book.title}</span>
          </a>
          <span className="text-xs text-slate-500">{formatSize(book.size, i18n.language)}</span>
        </div>
      </div>
    </li>
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
      <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
        <Input
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
      <QueryState query={books}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState icon="📚" title={t(q || category ? 'library.noBooksFound' : 'library.noBooks')} />
          ) : (
            <>
              <ul className="grid gap-4 md:grid-cols-2">
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
