import type { Role, User } from '@/api/types'
import type { IconName } from '@/components/icons/paths'

export function homePathFor(user: User): string {
  if (user.status !== 'active') return '/pending'
  // Admin — saytdagi yagona o'qituvchi, kundalik ishi `/teach` da.
  if (user.role === 'admin' || user.role === 'teacher') return '/teach'
  return '/app'
}

export interface NavItem {
  to: string
  label: string
  end?: boolean
  /** Ilova menyusidagi ikonka (ochiq sayt menyusi ikonkasiz). */
  icon?: IconName
}

/** Ochiq sayt menyusi (yo'llar backend `seo.py: STATIC_PATHS` bilan mos). Bosh sahifaga — logo orqali. */
export const PUBLIC_NAV: NavItem[] = [
  { to: '/news', label: 'nav.news' },
  { to: '/library', label: 'nav.library' },
  { to: '/faq', label: 'nav.faq' },
  { to: '/about', label: 'nav.about' },
  { to: '/contact', label: 'nav.contact' },
]

export function navLinksFor(role: Role): NavItem[] {
  if (role === 'student') {
    // XP va natijalar faqat talabaga yoziladi (backend), shuning uchun "Natijalarim" ham faqat unga.
    return [
      { to: '/app', label: 'nav.subjects', end: true, icon: 'home' },
      { to: '/app/results', label: 'nav.results', icon: 'chart' },
      { to: '/app/tutor', label: 'nav.tutor', icon: 'sparkles' },
    ]
  }
  // O'qituvchi (amalda — admin) ish bo'limlari oldinda; talaba sahifalari bitta havolada,
  // AI repetitor esa mavzu pleyeridagi `TutorDock` orqali ochiladi.
  const items: NavItem[] = [
    { to: '/teach', label: 'nav.teach', end: true, icon: 'pencil' },
    { to: '/teach/review', label: 'nav.review', icon: 'clipboard' },
    { to: '/teach/stats', label: 'nav.stats', icon: 'chart' },
  ]
  // Admin kitoblarni `/admin/books` da yuklaydi va boshqaradi.
  if (role === 'teacher') items.push({ to: '/teach/books', label: 'nav.myBooks', icon: 'book' })
  // Admin bo'limlari ko'p — yuqori menyuda bitta havola, ichki menyu `AdminLayout` da.
  if (role === 'admin') items.push({ to: '/admin', label: 'nav.admin', icon: 'shield' })
  items.push({ to: '/app', label: 'nav.studentView', end: true, icon: 'user' })
  return items
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/** `/admin/*` ichki menyusi (`AdminLayout`). */
export const ADMIN_NAV: NavGroup[] = [
  { label: 'navGroups.people', items: [{ to: '/admin/users', label: 'nav.adminUsers' }] },
  {
    label: 'navGroups.learning',
    items: [
      { to: '/admin/subjects', label: 'nav.adminSubjects' },
      { to: '/admin/ai', label: 'nav.adminAi' },
    ],
  },
  {
    label: 'navGroups.site',
    items: [
      { to: '/admin/library', label: 'nav.adminLibrary' },
      { to: '/admin/books', label: 'nav.adminBooks' },
      { to: '/admin/news', label: 'nav.adminNews' },
      { to: '/admin/faq', label: 'nav.adminFaq' },
      { to: '/admin/messages', label: 'nav.adminMessages' },
      { to: '/admin/site', label: 'nav.adminSite' },
    ],
  },
]
