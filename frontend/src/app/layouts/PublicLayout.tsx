import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { buttonClasses } from '@/components/ui/button-classes'
import { homePathFor, PUBLIC_NAV } from '../paths'
import { LanguageSwitch } from './LanguageSwitch'
import { MobileMenu } from './MobileMenu'
import { navClass } from './navClass'
import { SiteFooter } from './SiteFooter'

export function PublicLayout() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-slate-100 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="mr-auto text-lg font-extrabold text-brand-700 lg:mr-4">
            {t('app.name')}
          </Link>
          <nav aria-label={t('nav.main')} className="hidden flex-1 gap-1 lg:flex">
            {PUBLIC_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
          <LanguageSwitch />
          {user ? (
            <Link to={homePathFor(user)} className={buttonClasses('primary', 'sm')}>
              {t('nav.cabinet')}
            </Link>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className={buttonClasses('ghost', 'sm')}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className={buttonClasses('primary', 'sm')}>
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
                  <Link to="/register" className={buttonClasses('primary', 'sm', 'flex-1')}>
                    {t('nav.register')}
                  </Link>
                </>
              )
            }
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
