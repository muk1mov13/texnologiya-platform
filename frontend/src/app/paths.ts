import type { Role, User } from '@/api/types'
import type { IconName } from '@/components/icons/paths'

export function homePathFor(user: User): string {
  if (user.status !== 'active') return '/pending'
  // Admin — saytdagi yagona o'qituvchi: o'qitish va boshqaruv bitta panelda (`AdminShell`).
  if (user.role === 'admin') return '/admin'
  if (user.role === 'teacher') return '/teach'
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

/** Kutubxona bo'limlari (`/library?tab=...`): footer va sayt xaritasi uchun. */
export const LIBRARY_TABS = ['metodik', 'huquqiy', 'books'] as const

export function navLinksFor(role: Role): NavItem[] {
  if (role === 'student') {
    // XP va natijalar faqat talabaga yoziladi (backend), shuning uchun "Natijalarim" ham faqat unga.
    return [
      { to: '/app', label: 'nav.subjects', end: true, icon: 'home' },
      { to: '/app/results', label: 'nav.results', icon: 'chart' },
      { to: '/app/tutor', label: 'nav.tutor', icon: 'sparkles' },
    ]
  }
  // Admin ilova karkasini faqat talaba ko'rinishida ko'radi; o'qitish va boshqaruv `AdminShell` da.
  if (role === 'admin') {
    return [
      { to: '/admin', label: 'nav.admin', icon: 'shield' },
      { to: '/app', label: 'nav.studentView', end: true, icon: 'user' },
    ]
  }
  // O'qituvchi: ish bo'limlari oldinda; talaba sahifalari bitta havolada,
  // AI repetitor esa mavzu pleyeridagi `TutorDock` orqali ochiladi.
  return [
    { to: '/teach', label: 'nav.teach', end: true, icon: 'pencil' },
    { to: '/teach/review', label: 'nav.review', icon: 'clipboard' },
    { to: '/teach/stats', label: 'nav.stats', icon: 'chart' },
    { to: '/teach/books', label: 'nav.myBooks', icon: 'book' },
    { to: '/app', label: 'nav.studentView', end: true, icon: 'user' },
  ]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/** `/admin/*` ichki menyusi (`AdminShell`). */
export const ADMIN_NAV: NavGroup[] = [
  { label: 'navGroups.main', items: [{ to: '/admin', label: 'nav.adminOverview', end: true, icon: 'grid' }] },
  { label: 'navGroups.people', items: [{ to: '/admin/users', label: 'nav.adminUsers', icon: 'users' }] },
  {
    label: 'navGroups.learning',
    items: [
      { to: '/admin/subjects', label: 'nav.adminSubjects', icon: 'layers' },
      { to: '/admin/ai', label: 'nav.adminAi', icon: 'sparkles' },
    ],
  },
  {
    label: 'navGroups.site',
    items: [
      { to: '/admin/library', label: 'nav.adminLibrary', icon: 'folder' },
      { to: '/admin/books', label: 'nav.adminBooks', icon: 'book' },
      { to: '/admin/news', label: 'nav.adminNews', icon: 'news' },
      { to: '/admin/faq', label: 'nav.adminFaq', icon: 'help' },
      { to: '/admin/messages', label: 'nav.adminMessages', icon: 'inbox' },
      { to: '/admin/site', label: 'nav.adminSite', icon: 'settings' },
    ],
  },
]
