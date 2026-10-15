import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useFaq } from '@/api/cms'
import type { FaqItem } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { EmptyState } from '@/components/ui/EmptyState'
import { FaqAccordion } from '@/components/ui/FaqAccordion'
import { Input } from '@/components/ui/Field'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cx } from '@/lib/cx'
import { usePageMeta } from '@/lib/usePageMeta'
import { PageHero } from './PageHero'

function filterFaq(items: FaqItem[], search: string): FaqItem[] {
  const needle = search.trim().toLocaleLowerCase()
  if (!needle) return items
  return items.filter((item) => `${item.question}\n${item.answer}`.toLocaleLowerCase().includes(needle))
}

function FaqSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-16 rounded-2xl" />
      ))}
    </div>
  )
}

function FaqList({ items, search }: { items: FaqItem[]; search: string }) {
  const { t } = useTranslation()
  const found = useMemo(() => filterFaq(items, search), [items, search])
  if (items.length === 0) return <EmptyState icon="help" title={t('faq.empty')} />
  return (
    <div className="flex flex-col gap-4">
      {search.trim() && (
        <p role="status" className="text-sm font-medium text-slate-500">
          {t('faq.found', { count: found.length })}
        </p>
      )}
      {found.length === 0 ? <EmptyState icon="search" title={t('faq.noResults')} /> : <FaqAccordion items={found} />}
    </div>
  )
}

/** "Javob topmadingizmi?" — bog'lanish sahifasiga yo'naltiruvchi yon karta. */
function ContactCard() {
  const { t } = useTranslation()
  return (
    <aside className="relative isolate flex flex-col items-start gap-4 overflow-hidden rounded-3xl bg-brand-950 p-6 text-white sm:p-7 lg:sticky lg:top-24">
      <div aria-hidden="true" className="absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-brand-500/40 blur-3xl" />
      <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-brand-200 ring-1 ring-white/15">
        <Icon name="chat" className="size-6" />
      </span>
      <h2 className="text-xl font-bold tracking-tight text-balance">{t('faq.more')}</h2>
      <p className="leading-relaxed text-pretty text-brand-100/80">{t('faq.moreText')}</p>
      <Link
        to="/contact"
        className={cx(
          'group mt-1 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-brand-900 transition',
          'hover:bg-brand-50 active:scale-[0.98] motion-reduce:transition-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300',
        )}
      >
        {t('faq.contactLink')}
        <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </aside>
  )
}

export function FaqPage() {
  const { t } = useTranslation()
  const query = useFaq()
  const [search, setSearch] = useState('')
  usePageMeta(t('faq.title'), t('faq.description'))

  return (
    <div className="flex flex-col gap-10 pb-8">
      <PageHero eyebrow={t('faq.eyebrow')} icon="help" title={t('faq.title')} subtitle={t('faq.description')}>
        <div className="max-w-xl">
          <Input
            icon="search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('faq.searchPlaceholder')}
            aria-label={t('faq.search')}
            maxLength={100}
            className="h-12 shadow-soft"
          />
        </div>
      </PageHero>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <QueryState query={query} loading={<FaqSkeleton />}>
          {(items) => <FaqList items={items} search={search} />}
        </QueryState>
        <ContactCard />
      </div>
    </div>
  )
}
