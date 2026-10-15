import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { NEWS_PAGE_SIZE, useNewsPage } from '@/api/cms'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SURFACE } from '@/components/ui/styles'
import { cx } from '@/lib/cx'
import { fadeUp, stagger } from '@/lib/motion'
import { usePageMeta } from '@/lib/usePageMeta'
import { NewsCard } from './NewsCard'
import { PageHero } from './PageHero'

function CardSkeleton() {
  return (
    <div className={cx(SURFACE, 'overflow-hidden')}>
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  )
}

export function NewsListPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const query = useNewsPage(page)
  usePageMeta(t('news.title'), t('news.description'))

  function goTo(next: number) {
    setSearchParams(next > 1 ? { page: String(next) } : {})
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="flex flex-col gap-10 pb-8">
      <PageHero eyebrow={t('news.eyebrow')} icon="news" title={t('news.title')} subtitle={t('news.description')} />
      <QueryState query={query} loading={<ListSkeleton />}>
        {(data) => {
          if (data.items.length === 0) return <EmptyState icon="📰" title={t('news.empty')} />
          // Faqat birinchi sahifada eng yangi xabar katta "featured" karta bo'ladi.
          const [first, ...rest] = data.items
          const featured = page === 1 ? first : undefined
          const grid = featured ? rest : data.items
          return (
            <div className="flex flex-col gap-10">
              {featured && (
                <m.div initial="hidden" animate="show" variants={fadeUp} className="flex [&>a]:flex-1">
                  <NewsCard news={featured} featured />
                </m.div>
              )}
              {grid.length > 0 && (
                <m.div
                  key={page}
                  initial="hidden"
                  animate="show"
                  variants={stagger(0.07, featured ? 0.15 : 0)}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {grid.map((item) => (
                    <m.div key={item.id} variants={fadeUp} className="flex [&>a]:flex-1">
                      <NewsCard news={item} />
                    </m.div>
                  ))}
                </m.div>
              )}
              <Pagination page={page} total={data.total} size={NEWS_PAGE_SIZE} onChange={goTo} />
            </div>
          )
        }}
      </QueryState>
    </div>
  )
}
