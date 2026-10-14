import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useNewsPage, useSite } from '@/api/cms'
import type { SiteSocials } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { cx } from '@/lib/cx'
import { formatDate } from '@/lib/format'
import { homePathFor, PUBLIC_NAV } from '../paths'
import { BrandLogo } from './BrandLogo'

const SOCIALS: (keyof SiteSocials)[] = ['telegram', 'instagram', 'facebook', 'youtube']
const LIBRARY_TABS = ['metodik', 'huquqiy', 'books'] as const
/** Bosh sahifadagi `NewsSection` bilan bir xil so'rov — kesh umumiy, qo'shimcha so'rov yo'q. */
const LATEST_NEWS = 3

interface FooterTheme {
  root: string
  decor: ReactNode
  heading: string
  text: string
  muted: string
  link: string
  icon: string
  border: string
  chip: string
  button: string
  focus: string
  logo: 'light' | 'dark'
}

const DARK_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300'

/**
 * Footer rang variantlari (VAQTINCHALIK: `?footer=a|b|c` bilan solishtirish uchun;
 * tanlov qilingach bittasi qoladi). Standart — `a`.
 */
const THEMES: Record<'a' | 'b' | 'c', FooterTheme> = {
  // A — chuqur teal: CTA panelining davomi, bir rang oilasi.
  a: {
    root: 'bg-brand-950 text-brand-50',
    decor: (
      <>
        <div className="absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand-700/35 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent" />
      </>
    ),
    heading: 'text-brand-300',
    text: 'text-brand-100/75',
    muted: 'text-brand-200/60',
    link: 'text-brand-100/75 hover:text-white',
    icon: 'text-brand-300',
    border: 'border-brand-800/70',
    chip: 'border-brand-700/70 bg-brand-900/60 text-brand-100 hover:border-brand-300/70 hover:bg-brand-800 hover:text-white',
    button: 'border-brand-700/70 text-brand-100/80 hover:border-brand-300/70 hover:text-white',
    focus: DARK_FOCUS,
    logo: 'dark',
  },
  // B — yorug': sahifa foni (slate-50) bilan uzluksiz, teal urg'ular.
  b: {
    root: 'border-t border-brand-100 bg-gradient-to-b from-white to-brand-50 text-slate-700',
    decor: (
      <>
        <div className="absolute -right-24 -bottom-32 size-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      </>
    ),
    heading: 'text-brand-800',
    text: 'text-slate-600',
    muted: 'text-slate-500',
    link: 'text-slate-600 hover:text-brand-700',
    icon: 'text-brand-600',
    border: 'border-brand-100',
    chip: 'border-brand-100 bg-white text-brand-700 shadow-soft hover:border-brand-300 hover:bg-brand-50',
    button: 'border-brand-200 bg-white text-brand-800 hover:border-brand-400',
    focus: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    logo: 'light',
  },
  // C — gradient + blob: teal → to'q ko'k, CTA dagi kabi xira bloblar va katak naqsh.
  c: {
    root: 'bg-gradient-to-br from-brand-950 via-slate-900 to-sky-950 text-slate-200',
    decor: (
      <>
        <div className="absolute -top-24 -left-20 size-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -right-16 -bottom-28 size-96 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-20 invert [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_70%)]" />
      </>
    ),
    heading: 'text-brand-300',
    text: 'text-slate-300/80',
    muted: 'text-slate-400',
    link: 'text-slate-300/80 hover:text-white',
    icon: 'text-sky-300',
    border: 'border-white/10',
    chip: 'border-white/10 bg-white/5 text-slate-200 backdrop-blur hover:border-sky-300/60 hover:bg-sky-400/15 hover:text-white',
    button: 'border-white/15 text-slate-300 hover:border-white/30 hover:text-white',
    focus: DARK_FOCUS,
    logo: 'dark',
  },
}

function useFooterTheme(): FooterTheme {
  const [params] = useSearchParams()
  const key = params.get('footer')
  return key === 'b' || key === 'c' ? THEMES[key] : THEMES.a
}

function Column({ title, theme, children }: { title: string; theme: FooterTheme; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h2 className={cx('text-xs font-bold tracking-wider uppercase', theme.heading)}>{title}</h2>
      {children}
    </div>
  )
}

/**
 * Ochiq sayt footer'i: brend va ijtimoiy tarmoqlar, bo'limlar, platforma havolalari,
 * so'nggi yangiliklar va kontaktlar (`/api/site`). Ma'lumot bo'lmagan ustun chiqmaydi.
 */
export function SiteFooter() {
  const { t, i18n } = useTranslation()
  const theme = useFooterTheme()
  const user = useCurrentUser()
  const { data: site } = useSite()
  const news = useNewsPage(1, LATEST_NEWS).data?.items ?? []
  const contacts = site?.contacts
  const socials = site ? SOCIALS.filter((key) => site.socials[key]) : []
  const hasContacts = Boolean(
    contacts && (contacts.phone || contacts.email || contacts.address || contacts.hours),
  )
  const link = cx('rounded text-sm transition-colors', theme.link, theme.focus)

  return (
    <footer className={cx('relative isolate overflow-hidden', theme.root)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {theme.decor}
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1.2fr_1.2fr] lg:gap-8">
        <div className="flex flex-col items-start gap-4 sm:col-span-2 lg:col-span-1">
          <BrandLogo tone={theme.logo} />
          <p className={cx('max-w-xs text-sm leading-relaxed', theme.text)}>{t('footer.tagline')}</p>
          {socials.length > 0 && (
            <ul aria-label={t('footer.socials')} className="flex flex-wrap gap-2">
              {socials.map((key) => (
                <li key={key}>
                  <a
                    href={site?.socials[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`socials.${key}`)}
                    className={cx(
                      'grid size-10 place-items-center rounded-xl border transition hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                      theme.chip,
                      theme.focus,
                    )}
                  >
                    <Icon name={key} className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label={t('footer.sections')}>
          <Column theme={theme} title={t('footer.sections')}>
            {PUBLIC_NAV.slice(1).map((item) => (
              <Link key={item.to} to={item.to} className={link}>
                {t(item.label)}
              </Link>
            ))}
          </Column>
        </nav>

        <Column theme={theme} title={t('footer.platform')}>
          {user ? (
            <Link to={homePathFor(user)} className={link}>
              {t('nav.cabinet')}
            </Link>
          ) : (
            <>
              <Link to="/login" className={link}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className={link}>
                {t('nav.register')}
              </Link>
            </>
          )}
          {LIBRARY_TABS.map((tab) => (
            <Link key={tab} to={`/library?tab=${tab}`} className={link}>
              {t(`library.tabs.${tab}`)}
            </Link>
          ))}
        </Column>

        {news.length > 0 && (
          <Column theme={theme} title={t('footer.latestNews')}>
            <ul className="flex flex-col gap-3">
              {news.map((item) => (
                <li key={item.id}>
                  <Link to={`/news/${item.slug}`} className={cx(link, 'line-clamp-2 font-medium')}>
                    {item.title}
                  </Link>
                  {item.published_at && (
                    <time dateTime={item.published_at} className={cx('mt-0.5 block text-xs', theme.muted)}>
                      {formatDate(item.published_at, i18n.language)}
                    </time>
                  )}
                </li>
              ))}
            </ul>
          </Column>
        )}

        {hasContacts && contacts && (
          <Column theme={theme} title={t('footer.contacts')}>
            {contacts.phone && (
              <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className={cx(link, 'flex items-center gap-2.5')}>
                <Icon name="phone" className={cx('size-4 shrink-0', theme.icon)} />
                {contacts.phone}
              </a>
            )}
            {contacts.email && (
              <a href={`mailto:${contacts.email}`} className={cx(link, 'flex items-center gap-2.5 break-all')}>
                <Icon name="mail" className={cx('size-4 shrink-0', theme.icon)} />
                {contacts.email}
              </a>
            )}
            {contacts.hours && (
              <p className={cx('flex items-center gap-2.5 text-sm', theme.text)}>
                <Icon name="clock" className={cx('size-4 shrink-0', theme.icon)} />
                {contacts.hours}
              </p>
            )}
            {contacts.address && (
              <div className={cx('flex items-start gap-2.5 text-sm', theme.text)}>
                <Icon name="mapPin" className={cx('mt-0.5 size-4 shrink-0', theme.icon)} />
                <div className="flex flex-col gap-1">
                  <span>{contacts.address}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contacts.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cx(link, 'inline-flex items-center gap-1 self-start font-semibold')}
                  >
                    {t('footer.map')}
                    <Icon name="externalLink" className="size-3.5" />
                  </a>
                </div>
              </div>
            )}
          </Column>
        )}
      </div>

      <div className={cx('border-t', theme.border)}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5">
          <p className={cx('text-sm', theme.muted)}>{t('footer.text', { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/faq" className={link}>
              {t('nav.faq')}
            </Link>
            <Link to="/contact" className={link}>
              {t('nav.contact')}
            </Link>
            <a href="/api/seo/sitemap.xml" className={link}>
              {t('footer.sitemap')}
            </a>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={cx(
                'group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold transition',
                theme.button,
                theme.focus,
              )}
            >
              {t('footer.toTop')}
              <Icon name="arrowUp" className="size-4 transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
