import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useNewsPage } from '@/api/cms'
import { Icon } from '@/components/icons/Icon'
import { Reveal } from '@/components/motion/Reveal'
import { cx, FOCUS_RING } from '@/lib/cx'
import { fadeUp, stagger, VIEWPORT_ONCE } from '@/lib/motion'
import { NewsCard } from '../NewsCard'
import { EYEBROW, SECTION_TITLE } from './styles'

const LATEST_NEWS = 3

/** So'nggi 3 ta yangilik; yangilik bo'lmasa bo'lim chiqmaydi. */
export function NewsSection() {
  const { t } = useTranslation()
  const news = useNewsPage(1, LATEST_NEWS)
  if (!news.data || news.data.items.length === 0) return null

  return (
    <section aria-labelledby="home-news" className="pt-20 sm:pt-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col items-start gap-3">
            <span className={EYEBROW}>{t('home.newsEyebrow')}</span>
            <h2 id="home-news" className={SECTION_TITLE}>
              {t('home.latestNews')}
            </h2>
          </div>
          <Link
            to="/news"
            className={cx(
              'group inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold text-brand-700 hover:bg-brand-50',
              FOCUS_RING,
            )}
          >
            {t('home.allNews')}
            <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          variants={stagger(0.1)}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {news.data.items.map((item) => (
            <m.div
              key={item.id}
              variants={fadeUp}
              className="flex transition duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&>a]:flex-1 [&>a]:shadow-soft"
            >
              <NewsCard news={item} />
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  )
}
