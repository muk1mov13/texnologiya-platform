import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useSite } from '@/api/cms'
import type { SiteSocials } from '@/api/types'
import { PUBLIC_NAV } from '../paths'

const SOCIALS: (keyof SiteSocials)[] = ['telegram', 'instagram', 'facebook', 'youtube']

/** Ochiq sayt footer'i: menyu, kontaktlar va ijtimoiy tarmoqlar (`/api/site`). */
export function SiteFooter() {
  const { t } = useTranslation()
  const { data: site } = useSite()
  const contacts = site?.contacts
  const socials = site ? SOCIALS.filter((key) => site.socials[key]) : []

  return (
    <footer className="border-t-2 border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-extrabold text-brand-700">{t('app.name')}</span>
          <p className="text-sm text-slate-600">{t('footer.tagline')}</p>
        </div>
        <nav aria-label={t('footer.sections')} className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('footer.sections')}</h2>
          {PUBLIC_NAV.slice(1).map((item) => (
            <Link key={item.to} to={item.to} className="text-sm text-slate-700 hover:text-brand-700">
              {t(item.label)}
            </Link>
          ))}
        </nav>
        {contacts && (contacts.phone || contacts.email || contacts.address) && (
          <div className="flex flex-col gap-2 text-sm">
            <h2 className="font-bold uppercase tracking-wide text-slate-500">{t('footer.contacts')}</h2>
            {contacts.phone && (
              <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className="text-slate-700 hover:text-brand-700">
                📞 {contacts.phone}
              </a>
            )}
            {contacts.email && (
              <a href={`mailto:${contacts.email}`} className="break-all text-slate-700 hover:text-brand-700">
                ✉️ {contacts.email}
              </a>
            )}
            {contacts.address && <p className="text-slate-700">📍 {contacts.address}</p>}
          </div>
        )}
        {socials.length > 0 && (
          <div className="flex flex-col gap-2 text-sm">
            <h2 className="font-bold uppercase tracking-wide text-slate-500">{t('footer.socials')}</h2>
            {socials.map((key) => (
              <a
                key={key}
                href={site?.socials[key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 hover:text-brand-700"
              >
                {t(`socials.${key}`)}
              </a>
            ))}
          </div>
        )}
      </div>
      <p className="border-t-2 border-slate-100 py-4 text-center text-sm text-slate-500">
        {t('footer.text', { year: new Date().getFullYear() })}
      </p>
    </footer>
  )
}
