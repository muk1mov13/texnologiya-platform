import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { canRetry } from '@/api/errors'
import { ErrorState } from './ErrorState'
import { PageSpinner } from './Spinner'

/**
 * So'rov holatiga qarab spinner, xato yoki ma'lumotni chizadi.
 * Ma'lumot bor bo'lsa (fon qayta so'rovi xato bersa ham) shu ma'lumot ko'rsatiladi —
 * xato holati faqat ma'lumot umuman yo'q bo'lsa chiqadi. 4xx xatoda qayta urinish tugmasi
 * ko'rsatilmaydi (`canRetry`).
 *
 * O'chiq (`enabled: false`) so'rov doim `isPending` bo'ladi — bunday holatni chaqiruvchi
 * o'zi ajratishi kerak, aks holda spinner abadiy aylanadi.
 */
export function QueryState<T>({
  query,
  children,
}: {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
}) {
  if (query.data !== undefined) return children(query.data)
  if (query.isPending) return <PageSpinner />
  return <ErrorState error={query.error} onRetry={canRetry(query.error) ? () => void query.refetch() : undefined} />
}
