import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAdminUsers, useUpdateUser } from '@/api/admin'
import { useAiSettings } from '@/api/adminAi'
import { useAdminBooks, useAdminNewsList, useMessages } from '@/api/adminCms'
import { useCurrentUser } from '@/api/auth'
import { useTeachSummary } from '@/api/teachAssessment'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cx, FOCUS_RING } from '@/lib/cx'
import { formatDate, formatDateTime } from '@/lib/format'
import { newsStatus } from './cms/newsStatus'
import { ListRow } from './ui/DataList'
import { PageHeader } from './ui/PageHeader'
import { Panel } from './ui/Panel'
import { StatCard } from './ui/StatCard'

const PREVIEW = 5

const QUICK_LINKS: { to: string; icon: IconName; label: string }[] = [
  { to: '/admin/news/new', icon: 'news', label: 'adminOverview.quick.news' },
  { to: '/admin/subjects', icon: 'layers', label: 'adminOverview.quick.subjects' },
  { to: '/admin/library', icon: 'folder', label: 'adminOverview.quick.library' },
  { to: '/admin/site', icon: 'settings', label: 'adminOverview.quick.site' },
]

/** `/admin` bosh sahifasi: kutayotgan ishlar, ko'rsatkichlar va tezkor havolalar (mavjud API'dan). */
export function AdminOverviewPage() {
  const { t, i18n } = useTranslation()
  const me = useCurrentUser()
  // Kesh `AdminShell` dagi hisoblagichlar va tegishli sahifalar bilan umumiy.
  const pending = useAdminUsers('pending', '')
  const reviews = useTeachSummary().data?.pending_submissions
  const unread = useMessages(true)
  const books = useAdminBooks('pending')
  const news = useAdminNewsList()
  const unpublished = news.data?.filter((item) => newsStatus(item) !== 'published').length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={formatDate(new Date().toISOString(), i18n.language)}
        title={t('adminOverview.title', { name: me?.full_name.split(' ')[0] ?? '' })}
        subtitle={t('adminOverview.subtitle')}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {/* O'qitish ishi — kundalik asosiy vazifa, shuning uchun birinchi (telefonda to'liq kenglikda). */}
        <div className="col-span-2 sm:col-span-1 [&>*]:h-full">
          <StatCard
            icon="clipboard"
            tone={reviews ? 'amber' : 'brand'}
            label={t('adminOverview.stats.pendingReviews')}
            value={reviews}
            to="/teach/review"
          />
        </div>
        <StatCard
          icon="users"
          tone={pending.data?.length ? 'amber' : 'brand'}
          label={t('adminOverview.stats.pendingUsers')}
          value={pending.data?.length}
          to="/admin/users"
        />
        <StatCard
          icon="inbox"
          tone={unread.data?.length ? 'rose' : 'brand'}
          label={t('adminOverview.stats.unreadMessages')}
          value={unread.data?.length}
          to="/admin/messages"
        />
        <StatCard
          icon="book"
          tone={books.data?.length ? 'amber' : 'brand'}
          label={t('adminOverview.stats.pendingBooks')}
          value={books.data?.length}
          to="/admin/books"
        />
        <StatCard
          icon="news"
          tone="slate"
          label={t('adminOverview.stats.unpublishedNews')}
          value={unpublished}
          to="/admin/news"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <PendingUsers />
          <Panel
            flush
            title={t('adminOverview.messagesTitle')}
            actions={<SeeAll to="/admin/messages" />}
          >
            <QueryState query={unread} loading={<RowsSkeleton />}>
              {(list) =>
                list.length === 0 ? (
                  <AllClear text={t('adminOverview.messagesEmpty')} />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {list.slice(0, PREVIEW).map((message) => (
                      <ListRow
                        key={message.id}
                        leading={
                          <span
                            aria-hidden="true"
                            className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200/70"
                          >
                            <Icon name="mail" className="size-5" />
                          </span>
                        }
                        title={message.name}
                        meta={<span className="line-clamp-1">{message.message}</span>}
                        badges={
                          <span className="text-xs text-slate-500 tabular-nums">
                            {formatDateTime(message.created_at, i18n.language)}
                          </span>
                        }
                      />
                    ))}
                  </ul>
                )
              }
            </QueryState>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <AiStatus />
          <Panel title={t('adminOverview.quickTitle')}>
            <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={cx(
                      'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/70',
                      'transition hover:bg-brand-50/60 hover:text-brand-800 hover:ring-brand-200 motion-reduce:transition-none',
                      FOCUS_RING,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-white group-hover:text-brand-700 motion-reduce:transition-none"
                    >
                      <Icon name={link.icon} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">{t(link.label)}</span>
                    <Icon
                      name="arrowRight"
                      className="hidden size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 motion-reduce:transition-none lg:block"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/** Tasdiq kutayotgan talabalar: birinchi beshtasi, shu yerning o'zida tasdiqlash mumkin. */
function PendingUsers() {
  const { t } = useTranslation()
  const pending = useAdminUsers('pending', '')
  const update = useUpdateUser()

  return (
    <Panel
      flush
      title={t('adminOverview.pendingTitle')}
      description={t('adminOverview.pendingText')}
      actions={<SeeAll to="/admin/users" />}
    >
      <QueryState query={pending} loading={<RowsSkeleton />}>
        {(list) =>
          list.length === 0 ? (
            <AllClear text={t('adminOverview.pendingEmpty')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.slice(0, PREVIEW).map((user) => (
                <ListRow
                  key={user.id}
                  aria-label={user.full_name}
                  leading={<Avatar user={user} className="size-10 rounded-xl" />}
                  title={user.full_name}
                  meta={user.email}
                  actions={
                    <Button
                      size="sm"
                      loading={update.isPending && update.variables?.id === user.id}
                      onClick={() => update.mutate({ id: user.id, data: { status: 'active' } })}
                    >
                      {t('admin.users.approve')}
                    </Button>
                  }
                />
              ))}
            </ul>
          )
        }
      </QueryState>
    </Panel>
  )
}

function AiStatus() {
  const { t } = useTranslation()
  const settings = useAiSettings()

  return (
    <Panel title={t('adminOverview.aiTitle')} actions={<SeeAll to="/admin/ai" />}>
      <QueryState query={settings} loading={<Skeleton className="h-20" />}>
        {(data) => {
          const tone = !data.configured ? 'red' : data.enabled ? 'green' : 'slate'
          const label = !data.configured
            ? t('adminOverview.aiNotConfigured')
            : data.enabled
              ? t('adminOverview.aiOn')
              : t('adminOverview.aiOff')
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-brand-200/70"
                >
                  <Icon name="sparkles" className="size-5" />
                </span>
                <Badge dot tone={tone}>
                  {label}
                </Badge>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-slate-500">{t('adminAi.provider')}</dt>
                <dd className="truncate font-medium text-slate-800">{data.provider}</dd>
                <dt className="text-slate-500">{t('adminAi.chatModel')}</dt>
                <dd className="truncate font-medium text-slate-800" title={data.chat_model}>
                  {data.chat_model}
                </dd>
                <dt className="text-slate-500">{t('adminOverview.aiLimit')}</dt>
                <dd className="font-medium text-slate-800 tabular-nums">{data.student_daily_limit}</dd>
              </dl>
            </div>
          )
        }}
      </QueryState>
    </Panel>
  )
}

function SeeAll({ to }: { to: string }) {
  const { t } = useTranslation()
  return (
    <Link
      to={to}
      className={cx(
        'inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-900',
        FOCUS_RING,
      )}
    >
      {t('adminOverview.seeAll')}
      <Icon name="arrowRight" className="size-4" />
    </Link>
  )
}

function AllClear({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-600 sm:px-6">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70"
      >
        <Icon name="check" className="size-4" />
      </span>
      {text}
    </div>
  )
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="size-10 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}
