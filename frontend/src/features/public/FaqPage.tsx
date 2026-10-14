import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useFaq } from '@/api/cms'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { cx, FOCUS_RING } from '@/lib/cx'
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
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <details key={item.id} className="group rounded-2xl border-2 border-slate-100 bg-white">
                  <summary
                    className={cx(
                      'flex cursor-pointer list-none items-start gap-3 rounded-2xl px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden',
                      FOCUS_RING,
                    )}
                  >
                    <span className="flex-1">{item.question}</span>
                    <span
                      aria-hidden="true"
                      className="text-xl leading-none text-brand-700 transition group-open:rotate-45 motion-reduce:transition-none"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 whitespace-pre-line text-slate-700">{item.answer}</p>
                </details>
              ))}
            </div>
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
