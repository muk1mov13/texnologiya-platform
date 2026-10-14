import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { newsCoverUrl } from '@/api/cms'
import type { NewsCard as NewsCardData } from '@/api/types'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDate } from '@/lib/format'

/** Yangilik kartasi: butun karta bitta havola (`/news/:slug`). */
export function NewsCard({ news }: { news: NewsCardData }) {
  const { i18n } = useTranslation()
  return (
    <Link
      to={`/news/${news.slug}`}
      className={cx(
        'group flex flex-col overflow-hidden rounded-2xl border-2 border-slate-100 bg-white transition hover:border-brand-200 motion-reduce:transition-none',
        FOCUS_RING,
      )}
    >
      {news.has_cover ? (
        <img
          src={newsCoverUrl(news)}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full bg-slate-100 object-cover"
        />
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-brand-50 text-5xl" aria-hidden="true">
          📰
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-5">
        {news.published_at && (
          <time dateTime={news.published_at} className="text-sm text-slate-500">
            {formatDate(news.published_at, i18n.language)}
          </time>
        )}
        <h3 className="text-lg leading-snug font-bold group-hover:text-brand-700">{news.title}</h3>
        {news.excerpt && <p className="line-clamp-3 text-slate-600">{news.excerpt}</p>}
      </div>
    </Link>
  )
}
