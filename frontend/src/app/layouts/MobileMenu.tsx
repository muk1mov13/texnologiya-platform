import { useEffect, useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { cx, FOCUS_RING } from '@/lib/cx'
import type { NavItem } from '../paths'
import { navClass } from './navClass'

interface MobileMenuProps {
  items: NavItem[]
  /** Panel pastidagi qo'shimcha havolalar (masalan, kirish / ro'yxatdan o'tish). */
  extra?: ReactNode
  /** Qaysi kenglikdan boshlab to'liq menyu ko'rinadi (mobil menyu yashirinadi). */
  until?: 'md' | 'lg'
}

const HIDE_FROM = { md: 'md:hidden', lg: 'lg:hidden' } as const

/**
 * `until` dan kichik ekranda menyu: ☰ tugma va header ostida ochiladigan panel. Header `relative`
 * bo'lishi kerak. Havola bosilganda, Escape yoki panel tashqarisi bosilganda yopiladi.
 */
export function MobileMenu({ items, extra, until = 'md' }: MobileMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <div className={HIDE_FROM[until]}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t(open ? 'nav.menuClose' : 'nav.menuOpen')}
        onClick={() => setOpen((value) => !value)}
        className={cx('rounded-xl border-2 border-slate-200 px-2.5 py-1 text-lg leading-none', FOCUS_RING)}
      >
        <span aria-hidden="true">{open ? '✕' : '☰'}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" aria-hidden="true" onClick={close} />
          <div
            id={panelId}
            className="absolute inset-x-0 top-full z-40 border-b-2 border-slate-100 bg-white px-4 pb-4 shadow-lg"
          >
            <nav aria-label={t('nav.main')} className="flex flex-col gap-1 pt-2">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={close}
                  className={(state) => cx(navClass(state), 'py-2.5 text-base')}
                >
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
            {extra && (
              <div className="mt-3 flex flex-wrap gap-2 border-t-2 border-slate-100 pt-3" onClick={close}>
                {extra}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
