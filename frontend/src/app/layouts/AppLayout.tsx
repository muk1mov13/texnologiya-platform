import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { useCurrentUser, useLogoutAndRedirect } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { homePathFor, navLinksFor } from '../paths'
import { LanguageSwitch } from './LanguageSwitch'
import { MobileMenu } from './MobileMenu'
import { navClass } from './navClass'

export function AppLayout() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogoutAndRedirect()
  if (!user) return null
  const links = navLinksFor(user.role)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b-2 border-slate-100 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to={homePathFor(user)} className="text-lg font-extrabold text-brand-700">
            {t('app.name')}
          </Link>
          <nav aria-label={t('nav.main')} className="hidden flex-1 gap-1 lg:flex">
            {links.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch />
            <NavLink to="/app/profile" className={navClass} title={t('nav.profile')}>
              <span aria-hidden="true">👤 </span>
              <span className="hidden xl:inline">{user.full_name}</span>
              <span className="sr-only xl:hidden">{t('nav.profile')}</span>
            </NavLink>
            {/* Telefonda "Chiqish" ☰ menyuda — header 360px ga sig'ishi uchun. */}
            <span className="hidden sm:block">
              <Button variant="ghost" size="sm" loading={logout.isPending} onClick={logout.logout}>
                {t('nav.logout')}
              </Button>
            </span>
            <MobileMenu
              items={links}
              until="lg"
              extra={
                <Button
                  variant="secondary"
                  size="sm"
                  className="sm:hidden"
                  loading={logout.isPending}
                  onClick={logout.logout}
                >
                  {t('nav.logout')}
                </Button>
              }
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
