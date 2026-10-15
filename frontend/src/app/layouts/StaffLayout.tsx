import { useCurrentUser } from '@/api/auth'
import { AdminShell } from './AdminShell'
import { AppLayout } from './AppLayout'

/**
 * `/teach/*` karkasi: admin (saytdagi yagona o'qituvchi) uchun boshqaruv paneli bilan bitta
 * `AdminShell`, oddiy o'qituvchi uchun esa ilovaning `AppLayout`i.
 */
export function StaffLayout() {
  const isAdmin = useCurrentUser()?.role === 'admin'
  return isAdmin ? <AdminShell /> : <AppLayout />
}
