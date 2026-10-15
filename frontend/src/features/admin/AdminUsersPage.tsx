import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminUsers, useTempPassword, useUpdateUser, type UserFilter } from '@/api/admin'
import { useCurrentUser } from '@/api/auth'
import type { User, UserStatus } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { Tabs } from '@/components/ui/Tabs'
import { pushToast } from '@/components/ui/toast-store'
import { DataList, ListRow } from './ui/DataList'
import { ListSkeleton } from './ui/ListSkeleton'
import { PageHeader } from './ui/PageHeader'
import { Toolbar } from './ui/Toolbar'

const FILTERS: UserFilter[] = ['pending', 'active', 'blocked', 'all']
const STATUS_TONES: Record<UserStatus, 'amber' | 'green' | 'red'> = { pending: 'amber', active: 'green', blocked: 'red' }

export function AdminUsersPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<UserFilter>('pending')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [tempResult, setTempResult] = useState<{ name: string; password: string } | null>(null)

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setQuery(search.trim())
  }

  async function copyPassword() {
    if (!tempResult) return
    try {
      await navigator.clipboard.writeText(tempResult.password)
      pushToast('success', t('admin.users.copied'))
    } catch {
      // Brauzer ruxsat bermasa — parol baribir belgilanadigan (`select-all`) blokda ko'rinib turadi.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="users"
        eyebrow={t('navGroups.people')}
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle')}
      />
      <Toolbar
        start={
          <Tabs
            variant="pill"
            label={t('admin.users.filter')}
            value={status}
            onChange={setStatus}
            items={FILTERS.map((filter) => ({ id: filter, label: t(`admin.users.filters.${filter}`) }))}
          />
        }
        end={
          <form role="search" onSubmit={onSearch} className="flex gap-2">
            <label htmlFor="user-search" className="sr-only">
              {t('admin.users.searchLabel')}
            </label>
            <Input
              id="user-search"
              type="search"
              icon="search"
              value={search}
              placeholder={t('admin.users.searchPlaceholder')}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button type="submit" variant="secondary" className="shrink-0">
              {t('common.search')}
            </Button>
          </form>
        }
      />
      <UserList status={status} query={query} onTempPassword={setTempResult} />
      <Modal
        open={tempResult !== null}
        title={t('admin.users.tempTitle')}
        onClose={() => setTempResult(null)}
        footer={<Button onClick={() => setTempResult(null)}>{t('common.done')}</Button>}
      >
        <p className="text-slate-700">{t('admin.users.tempText', { name: tempResult?.name ?? '' })}</p>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-950 p-2 pl-4 ring-1 ring-slate-900/10">
          <p className="min-w-0 flex-1 truncate font-mono text-lg tracking-wider text-brand-200 select-all">
            {tempResult?.password}
          </p>
          <Button size="sm" variant="secondary" className="shrink-0" onClick={() => void copyPassword()}>
            <Icon name="copy" className="size-4" />
            {t('admin.users.copy')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

interface UserListProps {
  status: UserFilter
  query: string
  onTempPassword: (result: { name: string; password: string }) => void
}

function UserList({ status, query, onTempPassword }: UserListProps) {
  const { t } = useTranslation()
  const me = useCurrentUser()
  const users = useAdminUsers(status, query)
  const update = useUpdateUser()
  const temp = useTempPassword()

  return (
    <QueryState query={users} loading={<ListSkeleton />}>
      {(list) =>
        list.length === 0 ? (
          <EmptyState icon="users" title={t('admin.users.empty')} />
        ) : (
          <DataList>
            {list.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === me?.id}
                busy={update.isPending && update.variables?.id === user.id}
                onUpdate={(data) => update.mutate({ id: user.id, data })}
                onTempPassword={() =>
                  temp.mutate(user.id, {
                    onSuccess: (result) => onTempPassword({ name: user.full_name, password: result.temp_password }),
                  })
                }
              />
            ))}
          </DataList>
        )
      }
    </QueryState>
  )
}

interface UserRowProps {
  user: User
  isSelf: boolean
  busy: boolean
  onUpdate: (data: { status: UserStatus }) => void
  onTempPassword: () => void
}

function UserRow({ user, isSelf, busy, onUpdate, onTempPassword }: UserRowProps) {
  const { t } = useTranslation()
  return (
    <ListRow
      aria-label={user.full_name}
      leading={<Avatar user={user} className="size-11 rounded-[0.85rem] ring-1 ring-slate-900/5" />}
      title={
        <>
          {user.full_name}
          {isSelf && <span className="ml-2 text-sm font-normal text-slate-500">{t('admin.users.you')}</span>}
        </>
      }
      meta={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="mail" className="size-3.5 text-slate-400" />
            {user.email}
          </span>
          {user.phone && (
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Icon name="phone" className="size-3.5 text-slate-400" />
              {user.phone}
            </span>
          )}
        </span>
      }
      badges={
        <>
          {/* Saytda bitta o'qituvchi = admin, qolganlar talaba: rol tanlanmaydi, faqat talaba bo'lmaganda ko'rsatiladi. */}
          {user.role !== 'student' && <Badge tone="brand">{t(`roles.${user.role}`)}</Badge>}
          <Badge dot tone={STATUS_TONES[user.status]}>
            {t(`admin.users.statuses.${user.status}`)}
          </Badge>
        </>
      }
      actions={
        !isSelf && (
          <>
            {user.status === 'pending' && (
              <Button size="sm" loading={busy} onClick={() => onUpdate({ status: 'active' })}>
                <Icon name="check" className="size-4" />
                {t('admin.users.approve')}
              </Button>
            )}
            {user.status === 'active' && (
              <Button size="sm" variant="secondary" loading={busy} onClick={() => onUpdate({ status: 'blocked' })}>
                {t('admin.users.block')}
              </Button>
            )}
            {user.status === 'blocked' && (
              <Button size="sm" variant="secondary" loading={busy} onClick={() => onUpdate({ status: 'active' })}>
                {t('admin.users.unblock')}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onTempPassword}>
              <Icon name="lock" className="size-4" />
              {t('admin.users.tempPassword')}
            </Button>
          </>
        )
      }
    />
  )
}
