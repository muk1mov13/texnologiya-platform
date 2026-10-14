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
    )
  }
  if (role === 'admin') {
    items.push(
      { to: '/admin/users', label: 'nav.adminUsers' },
      { to: '/admin/subjects', label: 'nav.adminSubjects' },
      { to: '/admin/ai', label: 'nav.adminAi' },
    )
  }
  return items
}
