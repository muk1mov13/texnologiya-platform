import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx, FOCUS_RING } from '@/lib/cx'
import { fadeUp, stagger, VIEWPORT_ONCE } from '@/lib/motion'

const LIBRARY_LINKS: { tab: string; icon: IconName; chip: string }[] = [
  { tab: 'metodik', icon: 'book', chip: 'from-brand-400 to-brand-700' },
  { tab: 'huquqiy', icon: 'scale', chip: 'from-sky-400 to-indigo-600' },
  { tab: 'books', icon: 'library', chip: 'from-amber-400 to-orange-600' },
]

/** Kartaning o'ng yuqori burchagidagi bezak: kitob javoni (faqat ko'rgazma). */
function BookStack() {
  return (
    <svg
      viewBox="0 0 160 120"
      aria-hidden="true"
      className="pointer-events-none absolute -top-2 right-4 h-28 w-auto opacity-90 sm:right-8 sm:h-32"
    >
      <defs>
        <linearGradient id="lib-a" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--color-brand-300)" />
          <stop offset="1" stopColor="var(--color-brand-600)" />
        </linearGradient>
        <linearGradient id="lib-b" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="lib-c" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <g opacity="0.85">
        <rect x="30" y="34" width="22" height="76" rx="4" fill="url(#lib-a)" />
        <rect x="56" y="22" width="18" height="88" rx="4" fill="url(#lib-b)" />
        <rect x="78" y="40" width="24" height="70" rx="4" fill="url(#lib-c)" />
        <rect x="104" y="30" width="16" height="80" rx="4" fill="url(#lib-a)" opacity="0.7" />
        <rect x="118" y="44" width="20" height="66" rx="4" fill="url(#lib-b)" opacity="0.6" transform="rotate(12 128 110)" />
        <g fill="white" opacity="0.55">
          <rect x="35" y="44" width="12" height="2.5" rx="1" />
          <rect x="35" y="96" width="12" height="2.5" rx="1" />
          <rect x="60" y="32" width="10" height="2.5" rx="1" />
          <rect x="83" y="50" width="14" height="2.5" rx="1" />
          <rect x="83" y="56" width="14" height="2.5" rx="1" />
        </g>
      </g>
      <rect x="20" y="110" width="128" height="4" rx="2" fill="var(--color-brand-900)" opacity="0.15" />
    </svg>
  )
}

/** Ochiq kutubxona kartasi: gradient ramka, bezak va bo'limlarga boy havolalar. */
function LibraryCard() {
  const { t } = useTranslation()
  return (
    <m.div
      variants={fadeUp}
      className="rounded-3xl bg-gradient-to-br from-brand-300/80 via-slate-200 to-amber-200/80 p-px shadow-soft"
    >
      <div className="relative isolate flex h-full flex-col gap-6 overflow-hidden rounded-[calc(1.5rem-1px)] bg-white p-7 sm:p-9">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-20 size-72 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="absolute -right-16 -bottom-24 size-64 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top_right,black_10%,transparent_60%)]" />
        </div>
        <BookStack />

        <div className="flex flex-col items-start gap-3 pr-24 sm:pr-36">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold tracking-wider text-brand-800 uppercase ring-1 ring-brand-200/70">
            <Icon name="globe" className="size-3.5" />
            {t('home.library.eyebrow')}
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {t('home.library.title')}
          </h2>
          <p className="leading-relaxed text-slate-600">{t('home.library.text')}</p>
        </div>

        <ul className="mt-auto flex flex-col gap-2.5">
          {LIBRARY_LINKS.map((link) => (
            <li key={link.tab}>
              <Link
                to={`/library?tab=${link.tab}`}
                className={cx(
                  'group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-3 pr-4 backdrop-blur',
                  'transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft',
                  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                  FOCUS_RING,
                )}
              >
                <span
                  className={cx(
                    'grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ring-1 ring-white/40',
                    link.chip,
                  )}
                >
                  <Icon name={link.icon} className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-bold text-slate-900">{t(`library.tabs.${link.tab}`)}</span>
                  <span className="truncate text-sm text-slate-500">{t(`home.library.items.${link.tab}`)}</span>
                </span>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/library"
          className={cx(
            'group inline-flex items-center gap-1.5 self-start rounded-lg text-sm font-bold text-brand-700 hover:text-brand-900',
            FOCUS_RING,
          )}
        >
          {t('home.library.open')}
          <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </m.div>
  )
}

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
        <LibraryCard />

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
