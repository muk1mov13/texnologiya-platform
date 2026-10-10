import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'
import { useCurrentUser, useLogoutAndRedirect, useSession } from '@/api/auth'
import type { User } from '@/api/types'
import { homePathFor } from '@/app/paths'
import { Button } from '@/components/ui/Button'
import { buttonClasses } from '@/components/ui/button-classes'
import { Card } from '@/components/ui/Card'
import { cx } from '@/lib/cx'

export function PendingPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const logout = useLogoutAndRedirect()
  const session = useSession()
  const navigate = useNavigate()

  // "Holatni tekshirish" aniq natijalarga ega bo'lishi uchun `invalidateQueries` o'rniga
  // lokal mutatsiya ishlatiladi: `session.refetch()` natijasini o'zi tekshiradi va
  // muvaffaqiyatsizlikda xatoni uloqtiradi (shunda `check.isError`/`check.error` ishlaydi).
  const check = useMutation({
    mutationFn: async (): Promise<User | null> => {
      const result = await session.refetch()
      if (result.isError) throw result.error
      return result.data ?? null
    },
    // meta.silent yo'q — xato global toast orqali ko'rsatiladi (api/queryClient.ts).
  })

  if (user && user.status === 'active') return <Navigate to={homePathFor(user)} replace />

  const stillPendingText = check.isSuccess && check.data?.status === 'pending' ? t('pending.stillPending') : ''

  return (
    <Card className="mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <span className="text-5xl" aria-hidden="true">
        ⏳
      </span>
      <h1 className="text-2xl font-bold">{t('pending.title')}</h1>
      <p className="text-slate-600">
        {user ? t('pending.textUser', { name: user.full_name }) : t('pending.textGuest')}
      </p>
      {/* Doim DOM'da turadi — faqat matn almashadi, shunda ekran o'quvchi o'zgarishni e'lon qiladi.
          Bo'sh bo'lganda `sr-only`: ko'rinmaydi va joy egallamaydi, lekin live region sifatida qoladi. */}
      <p role="status" className={cx(!stillPendingText && 'sr-only')}>
        {stillPendingText}
      </p>
      {user ? (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            loading={check.isPending}
            onClick={() =>
              check.mutate(undefined, {
                // Call-level callback: komponent unmount bo'lgach chaqirilmaydi — kechikkan
                // javob allaqachon boshqa sahifaga o'tgan foydalanuvchini qaytarib yubormaydi.
                onSuccess: (data) => {
                  // `null` — sessiya tugagan (masalan, rad etilgan foydalanuvchi bloklangan va
                  // refresh 401/403 qaytargan — ikkisi ham `client.ts`da `null`ga tushadi).
                  if (data === null) navigate('/login', { replace: true, flushSync: true })
                },
              })
            }
          >
            {t('pending.check')}
          </Button>
          <Button variant="secondary" loading={logout.isPending} onClick={logout.logout}>
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
