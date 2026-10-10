import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminUsers, useTempPassword, useUpdateUser, type UserFilter } from '@/api/admin'
import { useCurrentUser } from '@/api/auth'
import type { Role, User, UserStatus } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { QueryState } from '@/components/ui/QueryState'
import { Tabs } from '@/components/ui/Tabs'

const FILTERS: UserFilter[] = ['pending', 'active', 'blocked', 'all']
const ROLES: Role[] = ['student', 'teacher', 'admin']
const STATUS_TONES: Record<UserStatus, 'amber' | 'green' | 'red'> = { pending: 'amber', active: 'green', blocked: 'red' }

function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value)
}

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

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t('admin.users.title')}</h1>
      <Tabs
        label={t('admin.users.filter')}
        value={status}
        onChange={setStatus}
        items={FILTERS.map((filter) => ({ id: filter, label: t(`admin.users.filters.${filter}`) }))}
      />
      <form role="search" onSubmit={onSearch} className="flex gap-2">
        <label htmlFor="user-search" className="sr-only">
          {t('admin.users.searchLabel')}
        </label>
        <Input
          id="user-search"
          type="search"
          value={search}
          placeholder={t('admin.users.searchPlaceholder')}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" variant="secondary" className="shrink-0">
          {t('common.search')}
        </Button>
      </form>
      <UserList status={status} query={query} onTempPassword={setTempResult} />
      <Modal
        open={tempResult !== null}
        title={t('admin.users.tempTitle')}
        onClose={() => setTempResult(null)}
        footer={<Button onClick={() => setTempResult(null)}>{t('common.done')}</Button>}
      >
        <p className="text-slate-700">{t('admin.users.tempText', { name: tempResult?.name ?? '' })}</p>
        <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 font-mono text-lg tracking-wider select-all">
          {tempResult?.password}
        </p>
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
    <QueryState query={users}>
      {(list) =>
        list.length === 0 ? (
          <EmptyState icon="👥" title={t('admin.users.empty')} />
        ) : (
          <ul className="flex flex-col gap-3">
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
          </ul>
        )
      }
    </QueryState>
  )
}

interface UserRowProps {
  user: User
  isSelf: boolean
  busy: boolean
  onUpdate: (data: { role?: Role; status?: UserStatus }) => void
  onTempPassword: () => void
}

function UserRow({ user, isSelf, busy, onUpdate, onTempPassword }: UserRowProps) {
  const { t } = useTranslation()
  return (
    <li
      aria-label={user.full_name}
      className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-4"
    >
      <div className="min-w-48 flex-1">
        <p className="font-semibold">
          {user.full_name}
          {isSelf && <span className="ml-2 text-sm font-normal text-slate-500">{t('admin.users.you')}</span>}
        </p>
        <p className="text-sm text-slate-600">
          {user.email}
          {user.phone ? ` · ${user.phone}` : ''}
        </p>
      </div>
      <Badge tone={STATUS_TONES[user.status]}>{t(`admin.users.statuses.${user.status}`)}</Badge>
      <Select
        aria-label={t('admin.users.roleFor', { name: user.full_name })}
        className="w-auto"
        value={user.role}
        disabled={isSelf || busy}
        onChange={(event) => {
          const role = event.target.value
          if (isRole(role)) onUpdate({ role })
        }}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {t(`roles.${role}`)}
          </option>
        ))}
      </Select>
      {!isSelf && (
        <div className="flex flex-wrap gap-2">
          {user.status === 'pending' && (
            <Button size="sm" loading={busy} onClick={() => onUpdate({ status: 'active' })}>
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
            {t('admin.users.tempPassword')}
          </Button>
        </div>
      )}
    </li>
  )
}
