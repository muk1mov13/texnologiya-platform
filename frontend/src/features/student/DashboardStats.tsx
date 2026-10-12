import { useTranslation } from 'react-i18next'
import { useDashboard } from '@/api/assessment'
import type { BadgeView } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { cx } from '@/lib/cx'

/**
 * Talaba bosh sahifasidagi seriya, XP va nishonlar. Ma'lumot hali yuklanmagan yoki xato bo'lsa
 * blok ko'rsatilmaydi — sahifaning asosiy qismi (fanlar, davom ettirish) bundan qat'i nazar ishlaydi.
 */
export function DashboardStats() {
  const { t, i18n } = useTranslation()
  const { data } = useDashboard()
  if (!data) return null
  const owned = data.badges.filter((badge) => badge.awarded_at !== null).length
  const ru = i18n.language === 'ru'
  return (
    <section aria-labelledby="dashboard-heading" className="flex flex-col gap-4">
      <h2 id="dashboard-heading" className="sr-only">
        {t('dashboard.title')}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon="🔥"
          value={t('dashboard.streak', { count: data.streak.current })}
          hint={data.streak.active_today ? t('dashboard.streakToday') : t('dashboard.streakIdle')}
        />
        <StatCard
          icon="⭐"
          value={t('dashboard.xp', { xp: data.xp_total })}
          hint={t('dashboard.longest', { count: data.streak.longest })}
        />
        <StatCard icon="🏅" value={t('dashboard.badges', { owned, total: data.badges.length })} />
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {data.badges.map((badge) => (
          <BadgeTile key={badge.code} badge={badge} ru={ru} />
        ))}
      </ul>
    </section>
  )
}

function StatCard({ icon, value, hint }: { icon: string; value: string; hint?: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-lg font-bold">{value}</span>
        {hint && <span className="text-sm text-slate-600">{hint}</span>}
      </span>
    </Card>
  )
}

function BadgeTile({ badge, ru }: { badge: BadgeView; ru: boolean }) {
  const { t } = useTranslation()
  const earned = badge.awarded_at !== null
  const title = ru ? badge.title_ru : badge.title_uz
  const description = ru ? badge.description_ru : badge.description_uz
  return (
    <li
      title={description}
      aria-label={`${title}: ${earned ? t('dashboard.badgeOwned') : t('dashboard.badgeLocked')}`}
      className={cx(
        'flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center',
        earned ? 'border-brand-200 bg-brand-50' : 'border-slate-100 bg-white opacity-50 grayscale',
      )}
    >
      <span className="text-3xl" aria-hidden="true">
        {badge.icon}
      </span>
      <span className="text-xs font-semibold">{title}</span>
    </li>
  )
}
