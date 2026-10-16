import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { newsCoverUrl } from '@/api/cms'
import type { NewsCard as NewsCardData } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { SURFACE_LINK } from '@/components/ui/styles'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { NewsCoverFallback } from './NewsCoverFallback'

/**
 * Yangilik kartasi: butun karta bitta havola (`/news/:slug`). `featured` — ro'yxat boshidagi
 * katta gorizontal karta (desktopda rasm chapda, matn o'ngda).
 */
export function NewsCard({ news, featured = false }: { news: NewsCardData; featured?: boolean }) {
  const { t, i18n } = useTranslation()
  return (
    <Link
      to={`/news/${news.slug}`}
      className={cx(
        SURFACE_LINK,
        'group flex flex-col overflow-hidden',
        featured && 'lg:grid lg:grid-cols-[1.35fr_1fr]',
      )}
    >
      <div className={cx('relative overflow-hidden bg-slate-100', featured ? 'aspect-[16/9] lg:aspect-auto lg:min-h-80' : 'aspect-[16/9]')}>
        {news.has_cover ? (
          <img
            src={newsCoverUrl(news)}
            alt=""
            loading={featured ? 'eager' : 'lazy'}
            className="size-full object-cover transition duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <NewsCoverFallback />
        )}
        {news.published_at && (
          <time
            dateTime={news.published_at}
            className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-soft backdrop-blur"
          >
            <Icon name="clock" className="size-3.5 text-brand-600" strokeWidth={2.2} />
            {formatDate(news.published_at, i18n.language)}
          </time>
        )}
      </div>
      <div className={cx('flex flex-1 flex-col gap-3', featured ? 'p-6 sm:p-8 lg:justify-center' : 'p-6')}>
        <h3
          className={cx(
            'font-bold tracking-tight text-balance text-slate-900 transition-colors group-hover:text-brand-800',
            featured ? 'text-2xl leading-tight sm:text-3xl' : 'text-lg leading-snug',
          )}
        >
          {news.title}
        </h3>
        {news.excerpt && (
          <p className={cx('leading-relaxed text-pretty text-slate-600', featured ? 'line-clamp-4' : 'line-clamp-3')}>
            {news.excerpt}
          </p>
        )}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-brand-700">
          {t('news.read')}
          <Icon name="arrowRight" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
