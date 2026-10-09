import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import type { Role } from '@/api/types'
import { homePathFor } from './paths'

function isSafeInternalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
}

export function RequireAuth({ roles }: { roles?: Role[] }) {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) {
    const from = location.pathname + location.search + location.hash
    return <Navigate to="/login" replace state={{ from }} />
  }
  if (user.status !== 'active') return <Navigate to="/pending" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

/** Login/ro'yxatdan o'tish sahifalari: kirgan foydalanuvchini kerakli joyga yuboradi. */
export function RedirectIfAuthed() {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) return <Outlet />
  const from = (location.state as { from?: unknown } | null)?.from
  const safeFrom = isSafeInternalPath(from) ? from : null
  return <Navigate to={user.status === 'active' && safeFrom ? safeFrom : homePathFor(user)} replace />
}
