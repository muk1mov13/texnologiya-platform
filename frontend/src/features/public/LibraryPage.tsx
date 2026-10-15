import { m } from 'motion/react'
import type { KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { TabPanel } from '@/components/ui/Tabs'
import { cx, FOCUS_RING } from '@/lib/cx'
import { SPRING } from '@/lib/motion'
import { usePageMeta } from '@/lib/usePageMeta'
import { BookCatalog } from './BookCatalog'
import { FolderTree } from './FolderTree'
import { PageHero } from './PageHero'

const TABS = ['metodik', 'huquqiy', 'books'] as const
type LibraryTab = (typeof TABS)[number]

const TAB_ICONS: Record<LibraryTab, IconName> = { metodik: 'steps', huquqiy: 'scale', books: 'book' }

function isTab(value: string | null): value is LibraryTab {
  return TABS.includes(value as LibraryTab)
}

/**
 * Bo'lim tanlovi kartalar ko'rinishida; semantikasi `Tabs` bilan bir xil
 * (`tablist`/`tab`, chap-o'ng strelkalar, faqat tanlangani Tab bilan fokuslanadi).
 */
function SectionTabs({ value, onChange }: { value: LibraryTab; onChange: (tab: LibraryTab) => void }) {
  const { t } = useTranslation()

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const step = event.key === 'ArrowRight' ? 1 : -1
    const next = TABS[(TABS.indexOf(value) + step + TABS.length) % TABS.length]
    onChange(next)
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus()
  }

  return (
    <div role="tablist" aria-label={t('library.title')} onKeyDown={onKeyDown} className="grid gap-3 sm:grid-cols-3">
      {TABS.map((id) => {
        const selected = id === value
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            data-tab={id}
            aria-selected={selected}
            aria-controls={`panel-${id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={cx(
              'group relative flex items-center gap-3 rounded-2xl p-3 text-left transition-colors duration-300 active:scale-[0.98] motion-reduce:transition-none sm:p-4',
              selected ? 'text-white' : 'bg-white/70 text-slate-800 ring-1 ring-slate-200/70 backdrop-blur hover:bg-white hover:ring-brand-200',
              FOCUS_RING,
            )}
          >
            {selected && (
              <m.span
                layoutId="library-tab"
                transition={SPRING}
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-glow"
              />
            )}
            <span
              className={cx(
                'relative grid size-11 shrink-0 place-items-center rounded-xl transition-colors',
                selected ? 'bg-white/15 ring-1 ring-white/25' : 'bg-brand-50 text-brand-700 group-hover:bg-brand-100',
              )}
            >
              <Icon name={TAB_ICONS[id]} className="size-5" />
            </span>
            <span className="relative flex min-w-0 flex-col">
              <span className="font-bold">{t(`library.tabs.${id}`)}</span>
              <span className={cx('text-xs', selected ? 'text-brand-100' : 'text-slate-500')}>
                {t(`library.tabHints.${id}`)}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function LibraryPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('tab')
  const tab: LibraryTab = isTab(raw) ? raw : 'metodik'
  usePageMeta(t('library.title'), t('library.description'))

  return (
    <div className="flex flex-col gap-8 pb-8">
      <PageHero eyebrow={t('library.eyebrow')} icon="library" title={t('library.title')} subtitle={t('library.description')}>
        {/* Bo'lim almashganda qidiruv va sahifa filtrlari tashlanadi. */}
        <SectionTabs value={tab} onChange={(next) => setSearchParams({ tab: next }, { replace: true })} />
      </PageHero>
      <TabPanel id={tab}>{tab === 'books' ? <BookCatalog /> : <FolderTree section={tab} />}</TabPanel>
    </div>
  )
}
