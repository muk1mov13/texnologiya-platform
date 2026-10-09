import type { ReactNode } from 'react'
import { useSession } from '@/api/auth'
import { Spinner } from '@/components/ui/Spinner'

export function SessionGate({ children }: { children: ReactNode }) {
  const session = useSession()
  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-500">
        <Spinner size="lg" />
      </div>
    )
  }
  return children
}
