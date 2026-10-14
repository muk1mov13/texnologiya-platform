import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { NEWS_PAGE_SIZE, useNewsPage } from '@/api/cms'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { QueryState } from '@/components/ui/QueryState'
import { usePageMeta } from '@/lib/usePageMeta'
import { NewsCard } from './NewsCard'

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
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t('news.title')}</h1>
      <QueryState query={query}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState icon="📰" title={t('news.empty')} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))}
              </div>
              <Pagination page={page} total={data.total} size={NEWS_PAGE_SIZE} onChange={goTo} />
            </>
          )
        }
      </QueryState>
    </div>
  )
}
