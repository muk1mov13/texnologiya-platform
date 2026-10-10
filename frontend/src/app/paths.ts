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

export function navLinksFor(role: Role): NavItem[] {
  const items: NavItem[] = [{ to: '/app', label: 'nav.subjects', end: true }]
  if (role === 'teacher' || role === 'admin') items.push({ to: '/teach', label: 'nav.teach' })
  if (role === 'admin') {
    items.push({ to: '/admin/users', label: 'nav.adminUsers' }, { to: '/admin/subjects', label: 'nav.adminSubjects' })
  }
  return items
}
