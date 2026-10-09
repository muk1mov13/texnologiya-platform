import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'
import { useCurrentUser, useLogout, useSession } from '@/api/auth'
import type { User } from '@/api/types'
import { homePathFor } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-classes'
import { Card } from '@/components/ui/Card'

export function PendingPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogout()
  const session = useSession()
  const navigate = useNavigate()

  const check = useMutation({
    mutationFn: async (): Promise<User | null> => {
      const result = await session.refetch()
      if (result.isError) throw result.error
      return result.data ?? null
    },
    onSuccess: (data) => {
      // `null` — sessiya tugagan (masalan, rad etilgan foydalanuvchi bloklangan va refresh
      // 401/403 qaytargan). Faol foydalanuvchi uchun pastdagi <Navigate /> yetarli.
      if (data === null) navigate('/login', { replace: true })
    },
    // meta.silent yo'q — xato global toast orqali ko'rsatiladi (api/queryClient.ts).
  })

  if (user && user.status === 'active') return <Navigate to={homePathFor(user)} replace />

  const stillPending = check.isSuccess && check.data?.status === 'pending'

  return (
    <Card className="mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <span className="text-5xl" aria-hidden="true">
        ⏳
      </span>
      <h1 className="text-2xl font-bold">{t('pending.title')}</h1>
      <p className="text-slate-600">
        {user ? t('pending.textUser', { name: user.full_name }) : t('pending.textGuest')}
      </p>
      {stillPending && <p role="status">{t('pending.stillPending')}</p>}
      {user ? (
        <div className="flex flex-wrap justify-center gap-2">
          {/* Sessiya keshda abadiy saqlanadi — admin tasdiqlaganini bilish uchun refresh orqali qayta so'raladi. */}
          <Button loading={check.isPending} onClick={() => check.mutate()}>
            {t('pending.check')}
          </Button>
          <Button
            variant="secondary"
            loading={logout.isPending}
            onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate('/login', { replace: true }) })}
          >
            {t('nav.logout')}
          </Button>
        </div>
      ) : (
        <Link to="/login" className={buttonClasses('primary')}>
          {t('nav.login')}
        </Link>
      )}
    </Card>
  )
}
