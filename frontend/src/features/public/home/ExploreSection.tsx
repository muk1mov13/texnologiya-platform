import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx, FOCUS_RING } from '@/lib/cx'
import { fadeUp, stagger, VIEWPORT_ONCE } from '@/lib/motion'

const LIBRARY_LINKS: { tab: string; icon: IconName }[] = [
  { tab: 'metodik', icon: 'book' },
  { tab: 'huquqiy', icon: 'scale' },
  { tab: 'books', icon: 'layers' },
]

/** Kutubxona (ochiq) va AI repetitor kartalari yonma-yon. */
export function ExploreSection() {
  const { t } = useTranslation()
  const user = useCurrentUser()

  return (
    <section aria-label={t('home.exploreLabel')} className="relative bg-brand-50/60 py-20 sm:py-24">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-100 to-transparent" />
      <m.div
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={stagger(0.12)}
        className="mx-auto grid max-w-6xl gap-5 px-4 lg:grid-cols-2"
      >
        <m.div
          variants={fadeUp}
          className="flex flex-col gap-5 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-soft sm:p-9"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-200/60">
            <Icon name="book" className="size-6" />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight">{t('home.library.title')}</h2>
            <p className="leading-relaxed text-slate-600">{t('home.library.text')}</p>
          </div>
          <div className="mt-auto grid gap-2 sm:grid-cols-3">
            {LIBRARY_LINKS.map((link) => (
              <Link
                key={link.tab}
                to={`/library?tab=${link.tab}`}
                className={cx(
                  'group flex items-center gap-2.5 rounded-2xl border border-slate-200 px-3.5 py-3 font-semibold text-slate-800',
                  'transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                  FOCUS_RING,
                )}
              >
                <Icon name={link.icon} className="size-5 shrink-0 text-brand-600" />
                <span className="flex-1">{t(`library.tabs.${link.tab}`)}</span>
                <Icon
                  name="arrowRight"
                  className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700"
                />
              </Link>
            ))}
          </div>
        </m.div>

        <m.div
          variants={fadeUp}
          className="relative isolate flex flex-col items-start gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-7 text-white shadow-glow sm:p-9"
        >
          <div
            aria-hidden="true"
            className="absolute -top-20 -right-16 -z-10 size-64 animate-blob rounded-full bg-brand-400/30 blur-3xl motion-reduce:animate-none"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-grid opacity-20 invert" />
          <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-brand-200 ring-1 ring-white/20 backdrop-blur">
            <Icon name="sparkles" className="size-6" />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight">{t('home.tutor.title')}</h2>
            <p className="leading-relaxed text-brand-100">{t('home.tutor.text')}</p>
          </div>
          <Link
            to={user ? '/app/tutor' : '/register'}
            className={cx(
              'group mt-auto inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-brand-900',
              'transition hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
            )}
          >
            {t(user ? 'home.tutor.open' : 'home.tutor.join')}
            <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </m.div>
      </m.div>
    </section>
  )
}
