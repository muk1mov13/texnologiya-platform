import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <EmptyState
        icon="🧭"
        title={t('notFound.title')}
        text={t('notFound.text')}
        action={
          <Link to="/" className={buttonClasses('primary')}>
            {t('notFound.home')}
          </Link>
        }
      />
    </main>
  )
}
