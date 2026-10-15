import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useSite } from '@/api/cms'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { EmptyState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/ui/Markdown'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { SURFACE, SURFACE_LINK_SM } from '@/components/ui/styles'
import { cx } from '@/lib/cx'
import { usePageMeta } from '@/lib/usePageMeta'
import { PageHero } from './PageHero'

const QUICK_LINKS: { to: string; icon: IconName; key: string }[] = [
  { to: '/library', icon: 'library', key: 'library' },
  { to: '/news', icon: 'news', key: 'news' },
  { to: '/faq', icon: 'help', key: 'faq' },
  { to: '/contact', icon: 'mail', key: 'contact' },
]

function QuickLinks() {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('about.quickLinks')} className="flex flex-col gap-3">
      <h2 className="px-1 text-xs font-bold tracking-wider text-slate-500 uppercase">{t('about.quickLinks')}</h2>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
        {QUICK_LINKS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className={cx(SURFACE_LINK_SM, 'group flex items-center gap-3 p-3.5')}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                <Icon name={item.icon} className="size-5" />
              </span>
              <span className="flex-1 font-semibold text-slate-800">{t(`nav.${item.key}`)}</span>
              <Icon
                name="arrowRight"
                className="size-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-700"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function AboutSkeleton() {
  return (
    <div className={cx(SURFACE, 'flex flex-col gap-3 p-8')}>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  )
}

export function AboutPage() {
  const { t } = useTranslation()
  const query = useSite()
  usePageMeta(t('about.title'), t('meta.description'))

  return (
    <div className="flex flex-col gap-10 pb-8">
      <PageHero eyebrow={t('about.eyebrow')} icon="users" title={t('about.title')} subtitle={t('about.subtitle')} />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <QueryState query={query} loading={<AboutSkeleton />}>
          {(site) =>
            site.about.trim() ? (
              <article className={cx(SURFACE, 'p-6 sm:p-10')}>
                <Markdown className="max-w-[68ch] text-[1.0625rem] leading-[1.8]">{site.about}</Markdown>
              </article>
            ) : (
              <EmptyState icon="users" title={t('about.empty')} />
            )
          }
        </QueryState>
        <aside className="lg:sticky lg:top-24">
          <QuickLinks />
        </aside>
      </div>
    </div>
  )
}
