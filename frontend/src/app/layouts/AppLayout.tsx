import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { cx } from '@/lib/cx'
import { homePathFor, navLinksFor } from '../paths'
import { LanguageSwitch } from './LanguageSwitch'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap',
    isActive ? 'bg-brand-100 text-brand-900' : 'text-slate-600 hover:bg-slate-100',
  )

export function AppLayout() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b-2 border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to={homePathFor(user)} className="text-lg font-extrabold text-brand-700">
            {t('app.name')}
          </Link>
          <nav
            aria-label={t('nav.main')}
            className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1"
          >
            {navLinksFor(user.role).map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch />
            <NavLink to="/app/profile" className={navClass} title={t('nav.profile')}>
              <span aria-hidden="true">👤 </span>
              <span className="hidden md:inline">{user.full_name}</span>
              <span className="sr-only md:hidden">{t('nav.profile')}</span>
            </NavLink>
            <Button
              variant="ghost"
              size="sm"
              loading={logout.isPending}
              // Qaytish manzilisiz: keyingi kirgan foydalanuvchi oldingisining sahifasiga tushmasin.
              // `flushSync`: sessiya tozalanishi (setQueryData) React'ning navigatsiya
              // tranzitsiyasidan OLDIN qo'llanilishi mumkin — aks holda `RequireAuth` hali
              // eski `/app` manzilida qayta render bo'lib, `state: {from: '/app'}` bilan
              // o'ziga xos Navigate qaytarib, shu toza navigatsiyani bosib qo'yishi mumkin edi.
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => void navigate('/login', { replace: true, flushSync: true }),
                })
              }
            >
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
