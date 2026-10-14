import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useSite } from '@/api/cms'
import type { SiteSocials } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { cx } from '@/lib/cx'
import { PUBLIC_NAV } from '../paths'
import { BrandLogo } from './BrandLogo'

const SOCIALS: (keyof SiteSocials)[] = ['telegram', 'instagram', 'facebook', 'youtube']
const LIBRARY_TABS = ['metodik', 'huquqiy', 'books'] as const

const LIGHT_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300'
const LINK = cx('rounded text-sm text-slate-400 transition-colors hover:text-white', LIGHT_FOCUS)

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">{title}</h2>
      {children}
    </div>
  )
}

/** Ochiq sayt footer'i: menyu, kutubxona, kontaktlar va ijtimoiy tarmoqlar (`/api/site`). */
export function SiteFooter() {
  const { t } = useTranslation()
  const { data: site } = useSite()
  const contacts = site?.contacts
  const socials = site ? SOCIALS.filter((key) => site.socials[key]) : []
  const hasContacts = Boolean(contacts && (contacts.phone || contacts.email || contacts.address))

  return (
    <footer className="relative bg-slate-950 text-slate-300">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent"
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col items-start gap-4">
          <BrandLogo tone="dark" />
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">{t('footer.tagline')}</p>
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
                      'grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300',
                      'transition hover:-translate-y-0.5 hover:border-brand-400/60 hover:bg-brand-500/15 hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                      LIGHT_FOCUS,
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
              <Link key={item.to} to={item.to} className={LINK}>
                {t(item.label)}
              </Link>
            ))}
          </Column>
        </nav>

        <Column title={t('nav.library')}>
          {LIBRARY_TABS.map((tab) => (
            <Link key={tab} to={`/library?tab=${tab}`} className={LINK}>
              {t(`library.tabs.${tab}`)}
            </Link>
          ))}
        </Column>

        {hasContacts && contacts && (
          <Column title={t('footer.contacts')}>
            {contacts.phone && (
              <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className={cx(LINK, 'flex items-center gap-2.5')}>
                <Icon name="phone" className="size-4 shrink-0 text-brand-400" />
                {contacts.phone}
              </a>
            )}
            {contacts.email && (
              <a href={`mailto:${contacts.email}`} className={cx(LINK, 'flex items-center gap-2.5 break-all')}>
                <Icon name="mail" className="size-4 shrink-0 text-brand-400" />
                {contacts.email}
              </a>
            )}
            {contacts.address && (
              <p className="flex items-start gap-2.5 text-sm text-slate-400">
                <Icon name="mapPin" className="mt-0.5 size-4 shrink-0 text-brand-400" />
                {contacts.address}
              </p>
            )}
          </Column>
        )}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <p className="text-sm text-slate-500">{t('footer.text', { year: new Date().getFullYear() })}</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={cx(
              'group inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-400 transition hover:border-white/25 hover:text-white',
              LIGHT_FOCUS,
            )}
          >
            {t('footer.toTop')}
            <Icon name="arrowUp" className="size-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  )
}
