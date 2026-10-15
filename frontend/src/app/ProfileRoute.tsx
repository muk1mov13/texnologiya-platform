import { Navigate } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { ProfilePage } from '@/features/profile/ProfilePage'

/**
 * `/app/profile`: admin profili o'z panelida (`/admin/profile`, `AdminShell` ichida) ochiladi,
 * talaba va o'qituvchi esa shu yerda — ilovaning `AppLayout`ida qoladi.
 */
export function ProfileRoute() {
  const isAdmin = useCurrentUser()?.role === 'admin'
  return isAdmin ? <Navigate to="/admin/profile" replace /> : <ProfilePage />
}
