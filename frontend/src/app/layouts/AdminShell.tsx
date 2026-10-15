import { AnimatePresence, m } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { usePendingUsersCount } from '@/api/admin'
import { useMessages } from '@/api/adminCms'
import { useCurrentUser, useLogoutAndRedirect } from '@/api/auth'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Avatar } from '@/components/ui/Avatar'
import { cx } from '@/lib/cx'
import { EASE_OUT, SPRING } from '@/lib/motion'
import { ADMIN_NAV, type NavItem } from '../paths'
import { LanguageSwitch } from './LanguageSwitch'

const MESSAGES_PATH = '/admin/messages'
const USERS_PATH = '/admin/users'
const COLLAPSED_KEY = 'admin.sidebar.collapsed'

/** To'q fondagi klaviatura fokusi halqasi (`FOCUS_RING` oq fon uchun). */
const DARK_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, value ? '1' : '0')
  } catch {
    // Saqlab bo'lmasa (yopiq rejim) — faqat shu sessiyada eslab qolinadi.
  }
}

function matches(pathname: string, item: NavItem): boolean {
  return pathname === item.to || (!item.end && pathname.startsWith(`${item.to}/`))
}

/**
 * `/admin/*` uchun alohida karkas: `md` dan kengda chapda to'q, yig'iladigan menyu; tepada
 * joylashuv (breadcrumb) va til; telefonda menyu chapdan chiquvchi panelda ochiladi.
 */
export function AdminShell() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const group = ADMIN_NAV.find((g) => g.items.some((item) => matches(pathname, item)))
  const current = group?.items.find((item) => matches(pathname, item))

  // Havola bosilganda panel o'zi yopiladi (`onNavigate`), shuning uchun yo'l kuzatilmaydi.
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  function toggleCollapsed() {
    setCollapsed((value) => {
      writeCollapsed(!value)
      return !value
    })
  }

  return (
    <div className="min-h-dvh md:flex">
      <m.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 264 }}
        transition={SPRING}
        className="sticky top-0 hidden h-dvh shrink-0 overflow-hidden md:block"
      >
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </m.aside>
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-8">
            <button
              type="button"
              aria-label={t('nav.menuOpen')}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="grid size-9 place-items-center rounded-xl bg-white text-slate-700 shadow-soft ring-1 ring-slate-200/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 md:hidden"
            >
              <Icon name="menu" />
            </button>
            <Breadcrumb groupLabel={group?.label} current={current} pathname={pathname} />
            <div className="ml-auto">
              <LanguageSwitch />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
          {/* Bo'lim almashganda yengil kirish; bo'lim ichidagi o'tishda (masalan, yangilik → tahrir) qayta chizilmaydi. */}
          <m.div
            key={current?.to ?? pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            <Outlet />
          </m.div>
        </main>
      </div>
    </div>
  )
}

interface BreadcrumbProps {
  groupLabel?: string
  current?: NavItem
  pathname: string
}

function Breadcrumb({ groupLabel, current, pathname }: BreadcrumbProps) {
  const { t } = useTranslation()
  // Bo'lim sahifasidan chuqurroq (masalan, `/admin/news/12`) — uchinchi daraja.
  const nested = current && pathname !== current.to
  const leaf = nested ? (pathname.endsWith('/new') ? t('adminNews.new') : t('common.edit')) : null

  return (
    <nav aria-label={t('adminShell.breadcrumb')} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        <li className="hidden shrink-0 sm:block">
          <Link
            to="/admin"
            className="rounded-md font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            {t('adminShell.root')}
          </Link>
        </li>
        {groupLabel && (
          <li className="hidden shrink-0 items-center gap-1.5 text-slate-500 lg:flex">
            <Icon name="chevronRight" className="size-3.5 text-slate-300" />
            {t(groupLabel)}
          </li>
        )}
        {current && (
          <li className="flex min-w-0 items-center gap-1.5">
            <Icon name="chevronRight" className="hidden size-3.5 shrink-0 text-slate-300 sm:block" />
            {nested ? (
              <Link
                to={current.to}
                className="truncate rounded-md font-medium text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-700"
              >
                {t(current.label)}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-semibold text-slate-900">
                {t(current.label)}
              </span>
            )}
          </li>
        )}
        {leaf && (
          <li className="flex min-w-0 items-center gap-1.5">
            <Icon name="chevronRight" className="size-3.5 shrink-0 text-slate-300" />
            <span aria-current="page" className="truncate font-semibold text-slate-900">
              {leaf}
            </span>
          </li>
        )}
      </ol>
    </nav>
  )
}

interface SidebarProps {
  collapsed: boolean
  /** Faqat kompyuterda: menyuni yig'ish/yoyish. Telefondagi panelda yo'q. */
  onToggle?: () => void
  /** Telefondagi panel: yopish tugmasi va havola bosilganda yopish. */
  onClose?: () => void
}

/** Menyu tarkibi: kompyuterdagi yon panel va telefondagi chiquvchi panel uchun umumiy. */
function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogoutAndRedirect()
  // O'qilmagan bog'lanish xabarlari "Xabarlar" yonida, tasdiq kutayotgan talabalar
  // "Foydalanuvchilar" yonida ko'rsatiladi.
  const unread = useMessages(true).data?.length ?? 0
  const pendingUsers = usePendingUsersCount()
  const countFor = (to: string) => (to === MESSAGES_PATH ? unread : to === USERS_PATH ? pendingUsers : 0)
  const countLabel = (to: string) =>
    to === USERS_PATH ? t('admin.users.pendingCount') : t('adminMessages.unreadCount')
  const pillId = onClose ? 'admin-drawer-pill' : 'admin-nav-pill'

  return (
    <div className="relative isolate flex h-full w-full flex-col overflow-hidden bg-brand-950 text-brand-50">
      {/* Bezak: yuqoridan tushuvchi yumshoq nur va nozik katak. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_45%_at_0%_0%,rgb(45_212_191/0.22),transparent_70%),radial-gradient(70%_40%_at_100%_100%,rgb(13_148_136/0.18),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_40%)]"
      />

      <div className={cx('flex h-14 shrink-0 items-center gap-3', collapsed ? 'justify-center px-3' : 'px-5')}>
        <Link to="/admin" className={cx('flex min-w-0 items-center gap-3 rounded-xl', DARK_FOCUS)}>
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-300 via-brand-500 to-brand-700 text-white shadow-[0_0_0_1px_rgb(255_255_255/0.12)_inset,0_8px_24px_-6px_rgb(45_212_191/0.55)]"
          >
            <Icon name="layers" className="size-5" />
          </span>
          <span className={cx('min-w-0 leading-tight', collapsed && 'sr-only')}>
            <span className="block truncate text-[0.95rem] font-extrabold tracking-tight text-white">
              {t('app.name')}
            </span>
            <span className="block text-[0.7rem] font-semibold tracking-[0.14em] text-brand-300/80 uppercase">
              {t('adminShell.root')}
            </span>
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            aria-label={t('nav.menuClose')}
            onClick={onClose}
            data-autofocus
            className={cx('ml-auto grid size-9 place-items-center rounded-xl text-brand-100 hover:bg-white/10', DARK_FOCUS)}
          >
            <Icon name="close" />
          </button>
        )}
      </div>

      <nav
        aria-label={t('nav.adminSection')}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ADMIN_NAV.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <h2
              className={cx(
                'mb-0.5 px-3 text-[0.68rem] font-bold tracking-[0.14em] text-brand-200/50 uppercase',
                collapsed && 'sr-only',
              )}
            >
              {t(group.label)}
            </h2>
            {group.items.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={collapsed}
                pillId={pillId}
                count={countFor(item.to)}
                countLabel={countLabel(item.to)}
                onNavigate={onClose}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 px-3 py-2.5">
        {/* Qo'shimcha havolalar: yoyilganda ikonka + yozuv, yig'ilganda faqat ikonka. */}
        <div className={cx('flex flex-col gap-0.5', collapsed && 'items-center')}>
          <FooterLink to="/teach" icon="pencil" label={t('adminShell.teachPanel')} collapsed={collapsed} />
          <div className={cx('flex items-center gap-1', collapsed && 'flex-col gap-0.5')}>
            <FooterLink to="/" icon="globe" label={t('adminShell.viewSite')} collapsed={collapsed} />
            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-label={collapsed ? t('adminShell.expand') : t('adminShell.collapse')}
                title={collapsed ? t('adminShell.expand') : t('adminShell.collapse')}
                className={FOOTER_BUTTON}
              >
                <Icon
                  name="panelLeft"
                  className={cx('size-[1.15rem] transition-transform motion-reduce:transition-none', collapsed && 'rotate-180')}
                />
              </button>
            )}
          </div>
        </div>
        {user && (
          <div
            className={cx(
              'flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2 ring-1 ring-white/10',
              collapsed && 'flex-col p-1.5',
            )}
          >
            <Link
              to="/app/profile"
              title={t('nav.profile')}
              className={cx('flex min-w-0 flex-1 items-center gap-3 rounded-xl', DARK_FOCUS)}
            >
              <Avatar user={user} className="size-9 rounded-[0.7rem] ring-1 ring-white/15" />
              <span className={cx('min-w-0 leading-tight', collapsed && 'sr-only')}>
                <span className="block truncate text-sm font-semibold text-white">{user.full_name}</span>
                <span className="block truncate text-xs text-brand-200/60">{user.email}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={logout.logout}
              disabled={logout.isPending}
              aria-label={t('nav.logout')}
              title={t('nav.logout')}
              className={cx(
                'grid size-8 shrink-0 place-items-center rounded-lg text-brand-100/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 motion-reduce:transition-none',
                DARK_FOCUS,
              )}
            >
              <Icon name="logout" className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface SidebarLinkProps {
  item: NavItem
  collapsed: boolean
  pillId: string
  count: number
  countLabel: string
  onNavigate?: () => void
}

function SidebarLink({ item, collapsed, pillId, count, countLabel, onNavigate }: SidebarLinkProps) {
  const { t } = useTranslation()
  const label = t(item.label)
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cx(
          'group relative flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors motion-reduce:transition-none',
          collapsed && 'justify-center',
          isActive ? 'text-white' : 'text-brand-100/70 hover:bg-white/5 hover:text-white',
          DARK_FOCUS,
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <m.span
              layoutId={pillId}
              transition={SPRING}
              aria-hidden="true"
              className="absolute inset-0 rounded-xl bg-white/10 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-white/10"
            >
              <span className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-300 shadow-[0_0_12px_rgb(94_234_212/0.8)]" />
            </m.span>
          )}
          <span className="relative">
            {item.icon && (
              <Icon
                name={item.icon}
                className={cx('size-[1.15rem] shrink-0', isActive ? 'text-brand-300' : 'text-brand-200/60 group-hover:text-brand-200')}
              />
            )}
            {collapsed && count > 0 && (
              <span aria-hidden="true" className="absolute -top-1 -right-1 size-2 rounded-full bg-brand-300 ring-2 ring-brand-950" />
            )}
          </span>
          <span className={cx('relative min-w-0 flex-1 truncate', collapsed && 'sr-only')}>{label}</span>
          {count > 0 && (
            <span
              className={cx(
                'relative min-w-5 rounded-md bg-brand-300 px-1.5 py-px text-center text-[0.7rem] font-bold text-brand-950 tabular-nums',
                collapsed && 'sr-only',
              )}
            >
              {count}
              <span className="sr-only"> {countLabel}</span>
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

const FOOTER_BUTTON = cx(
  'grid size-9 place-items-center rounded-xl text-brand-100/70 transition-colors hover:bg-white/10 hover:text-white motion-reduce:transition-none',
  DARK_FOCUS,
)

interface FooterLinkProps {
  to: string
  icon: IconName
  label: string
  collapsed: boolean
}

/** Pastki havola: yoyilganda ikonka va yozuv; yig'ilganda faqat ikonka (nomi `title`da). */
function FooterLink({ to, icon, label, collapsed }: FooterLinkProps) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cx(
        'group flex h-9 items-center gap-3 rounded-xl text-sm font-medium text-brand-100/70 transition-colors hover:bg-white/5 hover:text-white motion-reduce:transition-none',
        collapsed ? 'w-9 justify-center' : 'min-w-0 flex-1 px-3',
        DARK_FOCUS,
      )}
    >
      <Icon name={icon} className="size-[1.15rem] shrink-0 text-brand-200/60 group-hover:text-brand-200" />
      <span className={cx('min-w-0 truncate', collapsed && 'sr-only')}>{label}</span>
    </Link>
  )
}

/** Telefondagi menyu: chapdan chiquvchi panel. Escape, fon yoki havola bosilganda yopiladi. */
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <m.div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.adminSection')}
            className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] shadow-2xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <Sidebar collapsed={false} onClose={onClose} />
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}
