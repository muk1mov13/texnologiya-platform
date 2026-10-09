import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import type { Role } from '@/api/types'
import { homePathFor } from './paths'

export function RequireAuth({ roles }: { roles?: Role[] }) {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.status !== 'active') return <Navigate to="/pending" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

/** Login/ro'yxatdan o'tish sahifalari: kirgan foydalanuvchini kerakli joyga yuboradi. */
export function RedirectIfAuthed() {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) return <Outlet />
  const from = (location.state as { from?: string } | null)?.from
  return <Navigate to={user.status === 'active' && from ? from : homePathFor(user)} replace />
}
