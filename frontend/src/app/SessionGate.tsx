import type { ReactNode } from 'react'
import { useSession } from '@/api/auth'
import { ErrorState } from '@/components/ui/ErrorState'
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
  // `isError` TanStack v5'da muvaffaqiyatsiz refetch'da ham o'rnatiladi, hatto oldingi
  // ma'lumot (`data`) saqlanib qolgan bo'lsa ham (masalan, "Holatni tekshirish" 5xx qaytarsa).
  // Shuning uchun butun ilovani faqat BIRINCHI yuklanish muvaffaqiyatsiz bo'lganda yopamiz —
  // mehmon uchun `data` `null` (muvaffaqiyatli), aniqlanmagan holat esa `undefined` bo'ladi.
  if (session.isError && session.data === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <ErrorState error={session.error} onRetry={() => session.refetch()} />
      </div>
    )
  }
  return children
}
