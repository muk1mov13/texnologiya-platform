import { AnimatePresence, m } from 'motion/react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { cx, FOCUS_RING } from '@/lib/cx'
import { EASE_OUT } from '@/lib/motion'
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

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

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
        className={cx(
          'grid size-9 place-items-center rounded-xl border-2 border-slate-200 bg-white/70 text-slate-700',
          FOCUS_RING,
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={open ? 'close' : 'menu'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </m.span>
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <m.div
              key="backdrop"
              className="fixed inset-0 z-30 bg-slate-900/10"
              aria-hidden="true"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <m.div
              key="panel"
              id={panelId}
              className="absolute inset-x-0 top-full z-40 origin-top border-b-2 border-slate-100 bg-white/95 px-4 pb-4 shadow-soft backdrop-blur-xl"
              initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              <m.nav
                aria-label={t('nav.main')}
                className="flex flex-col gap-1 pt-2"
                initial="hidden"
                animate="show"
                transition={{ staggerChildren: 0.035 }}
              >
                {items.map((item) => (
                  <m.div key={item.to} variants={ITEM_VARIANTS}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={close}
                      className={(state) => cx(navClass(state), 'block py-2.5 text-base')}
                    >
                      {t(item.label)}
                    </NavLink>
                  </m.div>
                ))}
              </m.nav>
              {extra && (
                <div className="mt-3 flex flex-wrap gap-2 border-t-2 border-slate-100 pt-3" onClick={close}>
                  {extra}
                </div>
              )}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
