import { useTranslation } from 'react-i18next'
import { errorText } from '@/api/errors'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon="⚠️"
      title={t('common.errorTitle')}
      text={errorText(error)}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )
      }
    />
  )
}
