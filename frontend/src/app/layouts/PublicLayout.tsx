import { m, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useMatch } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { buttonClasses } from '@/components/ui/button-classes'
import { cx, FOCUS_RING } from '@/lib/cx'
import { SPRING } from '@/lib/motion'
import { homePathFor, PUBLIC_NAV } from '../paths'
import { BrandLogo } from './BrandLogo'
import { LanguageSwitch } from './LanguageSwitch'
import { MobileMenu } from './MobileMenu'
import { SiteFooter } from './SiteFooter'

/** Header shu masofadan keyin "yig'iladi" (soya, kichikroq balandlik). */
const SCROLLED_AT = 12

const CTA_CLASS = cx(
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 px-4 py-2 text-sm font-semibold text-white',
  'shadow-glow transition hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  FOCUS_RING,
)

export function PublicLayout() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  // Bosh sahifa bo'limlari to'liq kenglikdagi fonga ega, konteynerni har bo'lim o'zi qo'yadi.
  const isHome = useMatch({ path: '/', end: true }) !== null
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > SCROLLED_AT))

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={cx(
          'sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300',
          scrolled
            ? 'border-slate-200/70 bg-white/80 shadow-soft backdrop-blur-xl'
            : 'border-transparent bg-white/50 backdrop-blur-md',
        )}
      >
        <div
          className={cx(
            'relative mx-auto flex max-w-6xl items-center gap-3 px-4 transition-[padding] duration-300 motion-reduce:transition-none',
            scrolled ? 'py-2' : 'py-3.5',
          )}
        >
          <BrandLogo className="mr-auto lg:mr-6" />
          <nav aria-label={t('nav.main')} className="hidden flex-1 items-center justify-end gap-1 lg:mr-3 lg:flex">
            {PUBLIC_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'relative rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors',
                    isActive ? 'text-brand-900' : 'text-slate-600 hover:text-slate-900',
                    FOCUS_RING,
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <m.span
                        layoutId="public-nav-pill"
                        transition={SPRING}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-xl bg-brand-100/80 ring-1 ring-brand-200/70"
                      />
                    )}
                    <span className="relative">{t(item.label)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <LanguageSwitch />
          {user ? (
            <Link to={homePathFor(user)} className={CTA_CLASS}>
              {t('nav.cabinet')}
            </Link>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className={buttonClasses('ghost', 'sm')}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className={CTA_CLASS}>
                {t('nav.register')}
              </Link>
            </div>
          )}
          <MobileMenu
            items={PUBLIC_NAV}
            until="lg"
            extra={
              user ? undefined : (
                <>
                  <Link to="/login" className={buttonClasses('secondary', 'sm', 'flex-1')}>
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className={cx(CTA_CLASS, 'flex-1')}>
                    {t('nav.register')}
                  </Link>
                </>
              )
            }
          />
        </div>
      </header>
      <main className={cx('w-full flex-1', !isHome && 'mx-auto max-w-6xl px-4 py-8')}>
        <Outlet />
      </main>
      <SiteFooter flush={isHome} />
    </div>
  )
}
