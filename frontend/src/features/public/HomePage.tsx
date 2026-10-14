import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useNewsPage } from '@/api/cms'
import { buttonClasses } from '@/components/ui/button-classes'
import { Card } from '@/components/ui/Card'
import { cx, FOCUS_RING } from '@/lib/cx'
import { usePageMeta } from '@/lib/usePageMeta'
import { HeroSection } from './home/HeroSection'
import { NewsCard } from './NewsCard'

const FEATURES = [
  { key: 'steps', icon: '🪜' },
  { key: 'player', icon: '📖' },
  { key: 'language', icon: '🌐' },
] as const

const LIBRARY_LINKS = [
  { tab: 'metodik', icon: '📚' },
  { tab: 'huquqiy', icon: '⚖️' },
  { tab: 'books', icon: '📘' },
] as const

const LATEST_NEWS = 3

export function HomePage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const news = useNewsPage(1, LATEST_NEWS)
  usePageMeta('')

  return (
    <>
      <HeroSection />
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16">
      <section id="features" className="grid scroll-mt-24 gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.key} className="flex flex-col gap-2">
            <span className="text-3xl" aria-hidden="true">
              {feature.icon}
            </span>
            <h2 className="text-lg font-bold">{t(`home.features.${feature.key}.title`)}</h2>
            <p className="text-slate-600">{t(`home.features.${feature.key}.text`)}</p>
          </Card>
        ))}
      </section>

      {news.data && news.data.items.length > 0 && (
        <section aria-labelledby="home-news" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="home-news" className="text-2xl font-extrabold">
              {t('home.latestNews')}
            </h2>
            <Link to="/news" className={buttonClasses('ghost', 'sm')}>
              {t('home.allNews')} →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.data.items.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold">{t('home.library.title')}</h2>
          <p className="text-slate-600">{t('home.library.text')}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {LIBRARY_LINKS.map((link) => (
              <Link
                key={link.tab}
                to={`/library?tab=${link.tab}`}
                className={cx(
                  'flex items-center gap-2 rounded-xl border-2 border-slate-100 px-3 py-3 font-semibold hover:border-brand-200 hover:bg-brand-50',
                  FOCUS_RING,
                )}
              >
                <span aria-hidden="true">{link.icon}</span>
                {t(`library.tabs.${link.tab}`)}
              </Link>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col items-start gap-4 border-brand-100 bg-gradient-to-br from-white to-brand-50 p-6 sm:p-8">
          <span className="text-4xl" aria-hidden="true">
            🤖
          </span>
          <h2 className="text-2xl font-extrabold">{t('home.tutor.title')}</h2>
          <p className="text-slate-600">{t('home.tutor.text')}</p>
          <Link to={user ? '/app/tutor' : '/register'} className={buttonClasses('primary', 'sm')}>
            {t(user ? 'home.tutor.open' : 'home.tutor.join')}
          </Link>
        </Card>
      </section>
      </div>
    </>
  )
}
