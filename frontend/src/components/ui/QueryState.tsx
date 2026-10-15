import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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
  loading,
}: {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
  /** Birinchi yuklanishda spinner o'rniga ko'rsatiladigan skelet (sahifa shaklida). */
  loading?: ReactNode
}) {
  const { t } = useTranslation()
  if (query.data !== undefined) return children(query.data)
  if (query.isPending) {
    if (loading === undefined) return <PageSpinner />
    // Skelet bezak (`aria-hidden`), shuning uchun ekran o'quvchiga holat alohida e'lon qilinadi.
    return (
      <div role="status" aria-label={t('common.loading')}>
        {loading}
      </div>
    )
  }
  return <ErrorState error={query.error} onRetry={canRetry(query.error) ? () => void query.refetch() : undefined} />
}
