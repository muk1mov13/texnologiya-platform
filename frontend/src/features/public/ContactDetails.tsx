import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { SiteContacts } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { cx } from '@/lib/cx'

type Tone = 'light' | 'dark'

const TONES: Record<Tone, { tile: string; label: string; value: string; link: string; focus: string }> = {
  light: {
    tile: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
    label: 'text-slate-500',
    value: 'text-slate-800',
    link: 'hover:text-brand-700',
    focus: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700',
  },
  dark: {
    tile: 'bg-white/10 text-brand-200 ring-1 ring-white/15',
    label: 'text-brand-200/70',
    value: 'text-white',
    link: 'hover:text-brand-200',
    focus: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300',
  },
}

function Row({ icon, label, tone, children }: { icon: IconName; label: string; tone: Tone; children: ReactNode }) {
  const style = TONES[tone]
  return (
    <li className="flex items-start gap-3.5">
      <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', style.tile)}>
        <Icon name={icon} className="size-[1.125rem]" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <span className={cx('text-xs font-semibold tracking-wide uppercase', style.label)}>{label}</span>
        <div className={cx('font-medium break-words', style.value)}>{children}</div>
      </div>
    </li>
  )
}

/** Sayt kontaktlari ikonkali qatorlar ko'rinishida (telefon, email, manzil + xarita, ish vaqti). */
export function ContactDetails({ contacts, tone = 'light' }: { contacts: SiteContacts; tone?: Tone }) {
  const { t } = useTranslation()
  const style = TONES[tone]
  const link = cx('rounded transition-colors', style.link, style.focus)
  return (
    <ul className="flex flex-col gap-5">
      {contacts.phone && (
        <Row icon="phone" label={t('contact.phone')} tone={tone}>
          <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className={cx(link, 'tabular-nums')}>
            {contacts.phone}
          </a>
        </Row>
      )}
      {contacts.email && (
        <Row icon="mail" label={t('contact.email')} tone={tone}>
          <a href={`mailto:${contacts.email}`} className={cx(link, 'break-all')}>
            {contacts.email}
          </a>
        </Row>
      )}
      {contacts.address && (
        <Row icon="mapPin" label={t('contact.address')} tone={tone}>
          <span>{contacts.address}</span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contacts.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(link, 'mt-1 flex w-fit items-center gap-1 text-sm font-semibold opacity-80')}
          >
            {t('footer.map')}
            <Icon name="externalLink" className="size-3.5" />
          </a>
        </Row>
      )}
      {contacts.hours && (
        <Row icon="clock" label={t('contact.hours')} tone={tone}>
          {contacts.hours}
        </Row>
      )}
    </ul>
  )
}
