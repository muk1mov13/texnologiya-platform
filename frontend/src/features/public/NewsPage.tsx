import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { newsCoverUrl, useNews } from '@/api/cms'
import { buttonClasses } from '@/components/ui/button-classes'
import { Markdown } from '@/components/ui/Markdown'
import { QueryState } from '@/components/ui/QueryState'
import { formatDate } from '@/lib/format'
import { usePageMeta } from '@/lib/usePageMeta'

export function NewsPage() {
  const { t, i18n } = useTranslation()
  const { slug = '' } = useParams()
  const query = useNews(slug)
  const news = query.data
  usePageMeta(news?.title, news?.excerpt, news?.has_cover ? newsCoverUrl(news) : undefined)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link to="/news" className={buttonClasses('ghost', 'sm', 'self-start')}>
        ← {t('news.all')}
      </Link>
      <QueryState query={query}>
        {(data) => (
          <article className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
              <h1 className="text-3xl leading-tight font-extrabold sm:text-4xl">{data.title}</h1>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {data.published_at && (
                  <time dateTime={data.published_at}>{formatDate(data.published_at, i18n.language)}</time>
                )}
                <span>
                  <span aria-hidden="true">👁 </span>
                  {t('news.views', { count: data.views })}
                </span>
              </p>
            </header>
            {data.has_cover && (
              <img src={newsCoverUrl(data)} alt="" className="w-full rounded-2xl bg-slate-100 object-cover" />
            )}
            <Markdown>{data.body}</Markdown>
          </article>
        )}
      </QueryState>
    </div>
  )
}
