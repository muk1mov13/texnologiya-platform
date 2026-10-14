import { useTranslation } from 'react-i18next'
import { useSite } from '@/api/cms'
import { EmptyState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/ui/Markdown'
import { QueryState } from '@/components/ui/QueryState'
import { usePageMeta } from '@/lib/usePageMeta'

export function AboutPage() {
  const { t } = useTranslation()
  const query = useSite()
  usePageMeta(t('about.title'), t('meta.description'))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t('about.title')}</h1>
      <QueryState query={query}>
        {(site) =>
          site.about.trim() ? (
            <Markdown className="rounded-2xl border-2 border-slate-100 bg-white p-6 sm:p-8">{site.about}</Markdown>
          ) : (
            <EmptyState icon="🏛️" title={t('about.empty')} />
          )
        }
      </QueryState>
    </div>
  )
}
