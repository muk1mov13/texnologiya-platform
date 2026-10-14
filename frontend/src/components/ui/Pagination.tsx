import { useTranslation } from 'react-i18next'
import { Button } from './Button'

interface PaginationProps {
  page: number
  total: number
  size: number
  onChange: (page: number) => void
}

/** Oldingi / keyingi sahifa; bitta sahifa bo'lsa chizilmaydi. */
export function Pagination({ page, total, size, onChange }: PaginationProps) {
  const { t } = useTranslation()
  const pages = Math.max(1, Math.ceil(total / size))
  if (pages <= 1) return null
  return (
    <nav aria-label={t('pagination.label')} className="flex items-center justify-center gap-3">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← {t('pagination.prev')}
      </Button>
      <span className="text-sm font-semibold text-slate-600" aria-current="page">
        {t('pagination.status', { page, pages })}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        {t('pagination.next')} →
      </Button>
    </nav>
  )
}
