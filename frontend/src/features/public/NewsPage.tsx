import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { newsCoverUrl, useNews } from '@/api/cms'
import { Icon } from '@/components/icons/Icon'
import { Markdown } from '@/components/ui/Markdown'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { BACK_LINK, EYEBROW } from '@/components/ui/styles'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { fadeUp, stagger } from '@/lib/motion'
import { usePageMeta } from '@/lib/usePageMeta'

function ArticleSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-10 w-4/5" />
      <Skeleton className="h-10 w-3/5" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-4 aspect-[16/9] rounded-3xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export function NewsPage() {
  const { t, i18n } = useTranslation()
  const { slug = '' } = useParams()
  const query = useNews(slug)
  const news = query.data
  usePageMeta(news?.title, news?.excerpt, news?.has_cover ? newsCoverUrl(news) : undefined)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 pb-8">
      <Link to="/news" className={BACK_LINK}>
        <Icon name="arrowLeft" className="size-4" />
        {t('news.all')}
      </Link>
      <QueryState query={query} loading={<ArticleSkeleton />}>
        {(data) => (
          <m.article initial="hidden" animate="show" variants={stagger(0.08)} className="flex flex-col gap-8">
            <header className="flex flex-col items-start gap-4">
              <m.span variants={fadeUp} className={EYEBROW}>
                <Icon name="news" className="size-3.5" strokeWidth={2.2} />
                {t('news.eyebrow')}
              </m.span>
              <m.h1
                variants={fadeUp}
                className="text-3xl leading-[1.1] font-extrabold tracking-tight text-balance text-slate-900 sm:text-[2.75rem]"
              >
                {data.title}
              </m.h1>
              <m.p variants={fadeUp} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-500">
                {data.published_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" className="size-4 text-brand-600" />
                    <time dateTime={data.published_at}>{formatDate(data.published_at, i18n.language)}</time>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Icon name="eye" className="size-4 text-brand-600" />
                  {t('news.views', { count: data.views })}
                </span>
              </m.p>
            </header>
            {data.has_cover && (
              <m.figure variants={fadeUp} className="overflow-hidden rounded-3xl bg-slate-100 shadow-soft ring-1 ring-slate-200/70">
                <img src={newsCoverUrl(data)} alt="" className="w-full object-cover" />
              </m.figure>
            )}
            <m.div variants={fadeUp}>
              <Markdown className="max-w-[68ch] text-[1.0625rem] leading-[1.8]">{data.body}</Markdown>
            </m.div>
          </m.article>
        )}
      </QueryState>
      <aside className="relative isolate mt-4 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-3xl bg-brand-50 p-6 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:p-8">
        <div aria-hidden="true" className="absolute -top-16 -right-10 -z-10 size-56 rounded-full bg-brand-200/50 blur-3xl" />
        <p className="text-lg font-bold tracking-tight text-slate-900">{t('news.moreTitle')}</p>
        <Link
          to="/news"
          className={cx(
            'group inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 font-semibold text-white shadow-glow-sm transition hover:bg-brand-800 active:scale-[0.98] motion-reduce:transition-none',
            FOCUS_RING,
          )}
        >
          {t('news.all')}
          <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </aside>
    </div>
  )
}
