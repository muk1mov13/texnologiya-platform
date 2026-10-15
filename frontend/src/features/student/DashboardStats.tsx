import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '@/api/assessment'
import type { BadgeView } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SURFACE } from '@/components/ui/styles'
import { cx } from '@/lib/cx'
import { fadeUp, stagger } from '@/lib/motion'

/**
 * Talaba bosh sahifasidagi seriya, XP va nishonlar (bento). Ma'lumot hali yuklanmagan yoki xato
 * bo'lsa blok ko'rsatilmaydi — sahifaning asosiy qismi (fanlar, davom ettirish) bundan qat'i nazar ishlaydi.
 */
export function DashboardStats() {
  const { t, i18n } = useTranslation()
  const { data } = useDashboard()
  if (!data) return null
  const owned = data.badges.filter((badge) => badge.awarded_at !== null).length
  const ru = i18n.language === 'ru'
  const active = data.streak.active_today
  return (
    <section aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading" className="sr-only">
        {t('dashboard.title')}
      </h2>
      <m.div
        initial="hidden"
        animate="show"
        variants={stagger(0.07, 0.1)}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatTile
          icon="flame"
          tone={active ? 'orange' : 'slate'}
          label={t('dashboard.streakLabel')}
          value={data.streak.current}
          srValue={t('dashboard.streak', { count: data.streak.current })}
        >
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <span
              aria-hidden="true"
              className={cx('size-2 shrink-0 rounded-full', active ? 'bg-emerald-500' : 'bg-slate-300')}
            />
            {active ? t('dashboard.streakToday') : t('dashboard.streakIdle')}
          </p>
          <p className="text-xs text-slate-500">{t('dashboard.longest', { count: data.streak.longest })}</p>
        </StatTile>
        <StatTile
          icon="star"
          tone="amber"
          label={t('dashboard.xpLabel')}
          value={data.xp_total}
          srValue={t('dashboard.xp', { xp: data.xp_total })}
        >
          <p className="text-sm text-pretty text-slate-600">{t('dashboard.xpHint')}</p>
        </StatTile>
        <m.div variants={fadeUp} className={cx(SURFACE, 'flex flex-col gap-4 p-5 sm:col-span-2')}>
          <div className="flex items-center gap-3">
            <TileIcon icon="medal" tone="brand" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-slate-600">{t('dashboard.badgesTitle')}</span>
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  {t('dashboard.badges', { owned, total: data.badges.length })}
                </span>
              </p>
              <ProgressBar value={data.badges.length > 0 ? owned / data.badges.length : 0} />
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {data.badges.map((badge) => (
              <BadgeTile key={badge.code} badge={badge} ru={ru} />
            ))}
          </ul>
        </m.div>
      </m.div>
    </section>
  )
}

type Tone = 'orange' | 'amber' | 'brand' | 'slate'

const TONES: Record<Tone, string> = {
  orange: 'from-orange-100 to-amber-50 text-orange-700 ring-orange-200/70',
  amber: 'from-amber-100 to-yellow-50 text-amber-700 ring-amber-200/70',
  brand: 'from-brand-100 to-brand-50 text-brand-700 ring-brand-200/70',
  slate: 'from-slate-100 to-slate-50 text-slate-500 ring-slate-200/70',
}

function TileIcon({ icon, tone }: { icon: IconName; tone: Tone }) {
  return (
    <span
      aria-hidden="true"
      className={cx('grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ring-1', TONES[tone])}
    >
      <Icon name={icon} className="size-5" />
    </span>
  )
}

interface StatTileProps {
  icon: IconName
  tone: Tone
  label: string
  value: number
  /** Ekran o'quvchi uchun to'liq matn (katta raqam yashiriladi). */
  srValue: string
  children?: ReactNode
}

function StatTile({ icon, tone, label, value, srValue, children }: StatTileProps) {
  return (
    <m.div variants={fadeUp} className={cx(SURFACE, 'flex flex-col gap-3 p-5')}>
      <div className="flex items-center gap-3">
        <TileIcon icon={icon} tone={tone} />
        <span className="text-sm font-semibold text-slate-600">{label}</span>
      </div>
      <p className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
        <span aria-hidden="true">{value}</span>
        <span className="sr-only">{srValue}</span>
      </p>
      <div className="mt-auto flex flex-col gap-1">{children}</div>
    </m.div>
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
        'flex flex-col items-center gap-1.5 rounded-2xl p-2.5 text-center ring-1 transition motion-reduce:transition-none',
        earned
          ? 'bg-gradient-to-b from-brand-50 to-white ring-brand-200/70'
          : 'bg-slate-50 opacity-60 ring-slate-200/60 grayscale',
      )}
    >
      <span className="relative text-2xl" aria-hidden="true">
        {badge.icon}
        {!earned && (
          <span className="absolute -right-2 -bottom-1 grid size-4 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
            <Icon name="lock" className="size-2.5" />
          </span>
        )}
      </span>
      <span className="line-clamp-2 text-[0.7rem] leading-tight font-semibold text-slate-700">{title}</span>
    </li>
  )
}
