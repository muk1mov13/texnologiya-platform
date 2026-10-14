import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
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

/** Footer rang tokenlari: fon, matn, havola, ikonka va chegaralar. */
const THEME = {
  root: 'bg-slate-950 text-slate-300',
  decor: (
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent" />
  ),
  heading: 'text-slate-500',
  text: 'text-slate-400',
  muted: 'text-slate-500',
  link: 'text-slate-400 hover:text-white',
  icon: 'text-brand-400',
  border: 'border-white/10',
  chip: 'border-white/10 bg-white/5 text-slate-300 hover:border-brand-400/60 hover:bg-brand-500/15 hover:text-white',
  button: 'border-white/10 text-slate-400 hover:border-white/25 hover:text-white',
  focus: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300',
  logo: 'dark' as const,
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h2 className={cx('text-xs font-bold tracking-wider uppercase', THEME.heading)}>{title}</h2>
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
  const user = useCurrentUser()
  const { data: site } = useSite()
  const news = useNewsPage(1, LATEST_NEWS).data?.items ?? []
  const contacts = site?.contacts
  const socials = site ? SOCIALS.filter((key) => site.socials[key]) : []
  const hasContacts = Boolean(
    contacts && (contacts.phone || contacts.email || contacts.address || contacts.hours),
  )
  const link = cx('rounded text-sm transition-colors', THEME.link, THEME.focus)

  return (
    <footer className={cx('relative isolate overflow-hidden', THEME.root)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {THEME.decor}
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1.2fr_1.2fr] lg:gap-8">
        <div className="flex flex-col items-start gap-4 sm:col-span-2 lg:col-span-1">
          <BrandLogo tone={THEME.logo} />
          <p className={cx('max-w-xs text-sm leading-relaxed', THEME.text)}>{t('footer.tagline')}</p>
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
                      THEME.chip,
                      THEME.focus,
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
          <Column title={t('footer.sections')}>
            {PUBLIC_NAV.slice(1).map((item) => (
              <Link key={item.to} to={item.to} className={link}>
                {t(item.label)}
              </Link>
            ))}
          </Column>
        </nav>

        <Column title={t('footer.platform')}>
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
          <Column title={t('footer.latestNews')}>
            <ul className="flex flex-col gap-3">
              {news.map((item) => (
                <li key={item.id}>
                  <Link to={`/news/${item.slug}`} className={cx(link, 'line-clamp-2 font-medium')}>
                    {item.title}
                  </Link>
                  {item.published_at && (
                    <time dateTime={item.published_at} className={cx('mt-0.5 block text-xs', THEME.muted)}>
                      {formatDate(item.published_at, i18n.language)}
                    </time>
                  )}
                </li>
              ))}
            </ul>
          </Column>
        )}

        {hasContacts && contacts && (
          <Column title={t('footer.contacts')}>
            {contacts.phone && (
              <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className={cx(link, 'flex items-center gap-2.5')}>
                <Icon name="phone" className={cx('size-4 shrink-0', THEME.icon)} />
                {contacts.phone}
              </a>
            )}
            {contacts.email && (
              <a href={`mailto:${contacts.email}`} className={cx(link, 'flex items-center gap-2.5 break-all')}>
                <Icon name="mail" className={cx('size-4 shrink-0', THEME.icon)} />
                {contacts.email}
              </a>
            )}
            {contacts.hours && (
              <p className={cx('flex items-center gap-2.5 text-sm', THEME.text)}>
                <Icon name="clock" className={cx('size-4 shrink-0', THEME.icon)} />
                {contacts.hours}
              </p>
            )}
            {contacts.address && (
              <div className={cx('flex items-start gap-2.5 text-sm', THEME.text)}>
                <Icon name="mapPin" className={cx('mt-0.5 size-4 shrink-0', THEME.icon)} />
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

      <div className={cx('border-t', THEME.border)}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5">
          <p className={cx('text-sm', THEME.muted)}>{t('footer.text', { year: new Date().getFullYear() })}</p>
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
                THEME.button,
                THEME.focus,
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
