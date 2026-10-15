import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router'
import { useDashboard } from '@/api/assessment'
import { useCurrentUser, useLogoutAndRedirect } from '@/api/auth'
import { Icon } from '@/components/icons/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { cx, FOCUS_RING } from '@/lib/cx'
import { SPRING } from '@/lib/motion'
import { homePathFor, navLinksFor } from '../paths'
import { LanguageSwitch } from './LanguageSwitch'
import { MobileMenu } from './MobileMenu'
import { appNavClass } from './navClass'

export function AppLayout() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogoutAndRedirect()
  if (!user) return null
  const links = navLinksFor(user.role)

  return (
    <div className="relative isolate min-h-dvh">
      {/* Sahifa tepasidagi yumshoq brand "nur"i (bezak). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(70%_60%_at_50%_0%,rgb(45_212_191/0.10),transparent)]"
      />
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/75 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link
            to={homePathFor(user)}
            className={cx('flex shrink-0 items-center gap-2.5 rounded-xl', FOCUS_RING)}
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow-sm"
            >
              <Icon name="layers" className="size-5" />
            </span>
            <span className="sr-only text-lg font-extrabold tracking-tight text-slate-900 sm:not-sr-only">
              {t('app.name')}
            </span>
          </Link>
          <nav aria-label={t('nav.main')} className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-1 rounded-2xl bg-slate-100/70 p-1 ring-1 ring-slate-200/60">
              {links.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={appNavClass}>
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <m.span
                            layoutId="app-nav-pill"
                            transition={SPRING}
                            aria-hidden="true"
                            className="absolute inset-0 rounded-xl bg-white shadow-soft ring-1 ring-slate-200/70"
                          />
                        )}
                        <span className="relative flex items-center gap-2">
                          {item.icon && <Icon name={item.icon} className="size-4" />}
                          {t(item.label)}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {/* XP va seriya faqat talabaga yoziladi (backend), boshqa rollarda so'rov ham yuborilmaydi. */}
            {user.role === 'student' && <StudentChip />}
            <LanguageSwitch />
            <NavLink
              to="/app/profile"
              title={t('nav.profile')}
              className={({ isActive }) =>
                cx(
                  'group flex items-center gap-2 rounded-xl p-0.5 pr-0.5 text-sm font-semibold text-slate-700 xl:pr-3',
                  'transition hover:bg-slate-100 motion-reduce:transition-none',
                  isActive && 'bg-brand-50 text-brand-800',
                  FOCUS_RING,
                )
              }
            >
              <Avatar user={user} className="size-8 rounded-[0.65rem] ring-1 ring-slate-900/5" />
              <span className="hidden max-w-40 truncate xl:inline">{user.full_name}</span>
              <span className="sr-only xl:hidden">{t('nav.profile')}</span>
            </NavLink>
            {/* Telefonda "Chiqish" ☰ menyuda — header 360px ga sig'ishi uchun. */}
            <span className="hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                loading={logout.isPending}
                onClick={logout.logout}
                title={t('nav.logout')}
              >
                {!logout.isPending && <Icon name="logout" className="size-4" />}
                <span className="sr-only xl:not-sr-only">{t('nav.logout')}</span>
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
                  <Icon name="logout" className="size-4" />
                  {t('nav.logout')}
                </Button>
              }
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

/** Header'dagi seriya va XP ko'rsatkichi (ma'lumot yo'q yoki xato bo'lsa ko'rinmaydi). */
function StudentChip() {
  const { t } = useTranslation()
  const { data } = useDashboard()
  if (!data) return null
  const active = data.streak.active_today
  return (
    <Link
      to="/app/results"
      className={cx(
        'hidden items-center gap-3 rounded-xl bg-white/80 px-3 py-1.5 text-sm font-bold tabular-nums shadow-soft ring-1 ring-slate-200/70 md:flex',
        'transition hover:ring-brand-200 motion-reduce:transition-none',
        FOCUS_RING,
      )}
    >
      <span className={cx('flex items-center gap-1', active ? 'text-orange-700' : 'text-slate-500')}>
        <Icon name="flame" className="size-4" />
        <span aria-hidden="true">{data.streak.current}</span>
        <span className="sr-only">{t('dashboard.streak', { count: data.streak.current })}</span>
      </span>
      <span aria-hidden="true" className="h-4 w-px bg-slate-200" />
      <span className="flex items-center gap-1 text-amber-700">
        <Icon name="star" className="size-4" />
        <span aria-hidden="true">{data.xp_total}</span>
        <span className="sr-only">{t('dashboard.xp', { xp: data.xp_total })}</span>
      </span>
    </Link>
  )
}
