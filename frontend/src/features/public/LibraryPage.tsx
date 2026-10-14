import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { usePageMeta } from '@/lib/usePageMeta'
import { BookCatalog } from './BookCatalog'
import { FolderTree } from './FolderTree'

const TABS = ['metodik', 'huquqiy', 'books'] as const
type LibraryTab = (typeof TABS)[number]

function isTab(value: string | null): value is LibraryTab {
  return TABS.includes(value as LibraryTab)
}

export function LibraryPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tab')
  const tab: LibraryTab = isTab(raw) ? raw : 'metodik'
  usePageMeta(t('library.title'), t('library.description'))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t('library.title')}</h1>
        <p className="text-slate-600">{t('library.description')}</p>
      </div>
      <div>
        <Tabs
          label={t('library.title')}
          value={tab}
          // Bo'lim almashganda qidiruv va sahifa filtrlari tashlanadi.
          onChange={(next) => setSearchParams({ tab: next }, { replace: true })}
          items={TABS.map((id) => ({ id, label: t(`library.tabs.${id}`) }))}
        />
        <TabPanel id={tab}>{tab === 'books' ? <BookCatalog /> : <FolderTree section={tab} />}</TabPanel>
      </div>
    </div>
  )
}
