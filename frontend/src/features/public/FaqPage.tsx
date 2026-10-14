import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useFaq } from '@/api/cms'
import { EmptyState } from '@/components/ui/EmptyState'
import { FaqAccordion } from '@/components/ui/FaqAccordion'
import { QueryState } from '@/components/ui/QueryState'
import { usePageMeta } from '@/lib/usePageMeta'

export function FaqPage() {
  const { t } = useTranslation()
  const query = useFaq()
  usePageMeta(t('faq.title'), t('faq.description'))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t('faq.title')}</h1>
        <p className="text-slate-600">{t('faq.description')}</p>
      </div>
      <QueryState query={query}>
        {(items) =>
          items.length === 0 ? (
            <EmptyState icon="❓" title={t('faq.empty')} />
          ) : (
            <FaqAccordion items={items} />
          )
        }
      </QueryState>
      <p className="text-slate-600">
        {t('faq.more')}{' '}
        <Link to="/contact" className="font-semibold text-brand-700 hover:underline">
          {t('faq.contactLink')}
        </Link>
      </p>
    </div>
  )
}
