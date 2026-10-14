import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Select } from '@/components/ui/Field'
import { cx } from '@/lib/cx'
import { ADMIN_NAV } from '../paths'
import { navClass } from './navClass'

/**
 * `/admin/*` sahifalari: `md` dan kengda chapda guruhlangan menyu, telefonda ochiladigan ro'yxat
 * (tanlansa o'sha sahifaga o'tadi) — gorizontal scroll yo'q.
 */
export function AdminLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const current = ADMIN_NAV.flatMap((group) => group.items).find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  )

  return (
    <div className="grid gap-6 md:grid-cols-[13rem_1fr]">
      <div className="md:hidden">
        <Select
          aria-label={t('nav.adminSection')}
          value={current?.to ?? ''}
          onChange={(event) => void navigate(event.target.value)}
        >
          {ADMIN_NAV.map((group) => (
            <optgroup key={group.label} label={t(group.label)}>
              {group.items.map((item) => (
                <option key={item.to} value={item.to}>
                  {t(item.label)}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </div>
      <nav aria-label={t('nav.adminSection')} className="hidden flex-col gap-5 md:flex">
        {ADMIN_NAV.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <h2 className="px-3 text-xs font-bold tracking-wide text-slate-500 uppercase">{t(group.label)}</h2>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={(state) => cx(navClass(state), 'whitespace-normal')}>
                {t(item.label)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
