import type { Role, User } from '@/api/types'

export function homePathFor(user: User): string {
  if (user.status !== 'active') return '/pending'
  if (user.role === 'admin') return '/admin/users'
  if (user.role === 'teacher') return '/teach'
  return '/app'
}

export interface NavItem {
  to: string
  label: string
  end?: boolean
}

/** Ochiq sayt menyusi (yo'llar backend `seo.py: STATIC_PATHS` bilan mos). */
export const PUBLIC_NAV: NavItem[] = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/news', label: 'nav.news' },
  { to: '/library', label: 'nav.library' },
  { to: '/faq', label: 'nav.faq' },
  { to: '/about', label: 'nav.about' },
  { to: '/contact', label: 'nav.contact' },
]

export function navLinksFor(role: Role): NavItem[] {
  const items: NavItem[] = [{ to: '/app', label: 'nav.subjects', end: true }]
  // XP va natijalar faqat talabaga yoziladi (backend), shuning uchun "Natijalarim" ham faqat unga.
  if (role === 'student') items.push({ to: '/app/results', label: 'nav.results' })
  items.push({ to: '/app/tutor', label: 'nav.tutor' })
  if (role === 'teacher' || role === 'admin') {
    items.push(
      { to: '/teach', label: 'nav.teach', end: true },
      { to: '/teach/review', label: 'nav.review' },
      { to: '/teach/stats', label: 'nav.stats' },
      { to: '/teach/books', label: 'nav.myBooks' },
    )
  }
  // Admin bo'limlari ko'p — yuqori menyuda bitta havola, ichki menyu `AdminLayout` da.
  if (role === 'admin') items.push({ to: '/admin', label: 'nav.admin' })
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
    ],
  },
]
