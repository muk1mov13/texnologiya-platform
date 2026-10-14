import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAdminNewsList } from '@/api/adminCms'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDateTime } from '@/lib/format'
import { NEWS_STATUS_TONE, newsStatus } from './newsStatus'

export function AdminNewsPage() {
  const { t, i18n } = useTranslation()
  const query = useAdminNewsList()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{t('adminNews.title')}</h1>
          <p className="text-slate-600">{t('adminNews.subtitle')}</p>
        </div>
        <Link to="/admin/news/new" className={buttonClasses('primary')}>
          + {t('adminNews.new')}
        </Link>
      </div>
      <QueryState query={query}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState icon="📰" title={t('news.empty')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const status = newsStatus(item)
                const date = item.published_at ?? item.updated_at
                return (
                  <li key={item.id}>
                    <Link
                      to={`/admin/news/${item.id}`}
                      className={cx(
                        'flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border-2 border-slate-100 bg-white px-4 py-3 hover:border-brand-200',
                        FOCUS_RING,
                      )}
                    >
                      <span className="min-w-0 flex-1 font-semibold break-words">{item.title}</span>
                      <Badge tone={NEWS_STATUS_TONE[status]}>{t(`adminNews.status.${status}`)}</Badge>
                      <span className="text-sm text-slate-500">
                        {formatDateTime(date, i18n.language)}
                      </span>
                      <span className="text-sm text-slate-500">{t('news.views', { count: item.views })}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )
        }
      </QueryState>
    </div>
  )
}
