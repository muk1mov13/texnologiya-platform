import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAdminNewsList } from '@/api/adminCms'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDateTime } from '@/lib/format'
import { DataList } from '../ui/DataList'
import { ListSkeleton } from '../ui/ListSkeleton'
import { PageHeader } from '../ui/PageHeader'
import { NEWS_STATUS_TONE, newsStatus, type NewsStatus } from './newsStatus'

/** Holatga mos belgi foni (ro'yxat qatorining chap tomonida). */
const LEADING_TONE: Record<NewsStatus, string> = {
  draft: 'bg-slate-100 text-slate-500 ring-slate-200/70',
  scheduled: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  published: 'bg-brand-50 text-brand-700 ring-brand-200/70',
}

export function AdminNewsPage() {
  const { t, i18n } = useTranslation()
  const query = useAdminNewsList()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="news"
        eyebrow={t('navGroups.site')}
        title={t('adminNews.title')}
        subtitle={t('adminNews.subtitle')}
        actions={
          <Link to="/admin/news/new" className={buttonClasses('primary')}>
            <Icon name="plus" className="size-4" />
            {t('adminNews.new')}
          </Link>
        }
      />
      <QueryState query={query} loading={<ListSkeleton />}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState icon="news" title={t('news.empty')} />
          ) : (
            <DataList>
              {items.map((item) => {
                const status = newsStatus(item)
                const date = item.published_at ?? item.updated_at
                return (
                  <li key={item.id}>
                    <Link
                      to={`/admin/news/${item.id}`}
                      className={cx(
                        'group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-slate-50/70 motion-reduce:transition-none sm:px-6',
                        FOCUS_RING,
                        'focus-visible:-outline-offset-2',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx('grid size-10 shrink-0 place-items-center rounded-xl ring-1', LEADING_TONE[status])}
                      >
                        <Icon name={item.has_cover ? 'camera' : 'news'} className="size-5" />
                      </span>
                      <span className="min-w-48 flex-1">
                        <span className="block font-semibold break-words text-slate-900 group-hover:text-brand-800">
                          {item.title}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-slate-500 tabular-nums">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="clock" className="size-3.5 text-slate-400" />
                            {formatDateTime(date, i18n.language)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Icon name="eye" className="size-3.5 text-slate-400" />
                            {t('news.views', { count: item.views })}
                          </span>
                        </span>
                      </span>
                      <Badge dot tone={NEWS_STATUS_TONE[status]}>
                        {t(`adminNews.status.${status}`)}
                      </Badge>
                      <Icon
                        name="chevronRight"
                        className="hidden size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 motion-reduce:transition-none sm:block"
                      />
                    </Link>
                  </li>
                )
              })}
            </DataList>
          )
        }
      </QueryState>
    </div>
  )
}
