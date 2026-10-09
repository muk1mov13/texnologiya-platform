import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { sessionKey, useCurrentUser, useLogout, useSession } from '@/api/auth'
import { homePathFor } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-classes'
import { Card } from '@/components/ui/Card'

export function PendingPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogout()
  const session = useSession()
  const queryClient = useQueryClient()

  if (user && user.status === 'active') return <Navigate to={homePathFor(user)} replace />

  return (
    <Card className="mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <span className="text-5xl" aria-hidden="true">
        ⏳
      </span>
      <h1 className="text-2xl font-bold">{t('pending.title')}</h1>
      <p className="text-slate-600">
        {user ? t('pending.textUser', { name: user.full_name }) : t('pending.textGuest')}
      </p>
      {user ? (
        <div className="flex flex-wrap justify-center gap-2">
          {/* Sessiya keshda abadiy saqlanadi — admin tasdiqlaganini bilish uchun refresh orqali qayta so'raladi. */}
          <Button
            loading={session.isFetching}
            onClick={() => void queryClient.invalidateQueries({ queryKey: sessionKey })}
          >
            {t('pending.check')}
          </Button>
          <Button variant="secondary" loading={logout.isPending} onClick={() => logout.mutate()}>
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
