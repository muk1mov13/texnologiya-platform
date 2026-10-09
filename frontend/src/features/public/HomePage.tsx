import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { homePathFor } from '@/app/paths'
import { buttonClasses } from '@/components/ui/button-classes'
import { Card } from '@/components/ui/Card'

const FEATURES = [
  { key: 'steps', icon: '🪜' },
  { key: 'player', icon: '📖' },
  { key: 'language', icon: '🌐' },
] as const

export function HomePage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-5 rounded-3xl bg-brand-50 px-6 py-12 sm:px-12">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-900">
          {t('home.badge')}
        </span>
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">{t('home.title')}</h1>
        <p className="max-w-xl text-lg text-slate-700">{t('home.subtitle')}</p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link to={homePathFor(user)} className={buttonClasses('primary')}>
              {t('home.continue')}
            </Link>
          ) : (
            <>
              <Link to="/register" className={buttonClasses('primary')}>
                {t('home.start')}
              </Link>
              <Link to="/login" className={buttonClasses('secondary')}>
                {t('nav.login')}
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
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
    </div>
  )
}
