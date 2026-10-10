import { useTranslation } from 'react-i18next'
import { Link, Outlet } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { buttonClasses } from '@/components/ui/button-classes'
import { homePathFor } from '../paths'
import { LanguageSwitch } from './LanguageSwitch'

export function PublicLayout() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="mr-auto text-lg font-extrabold text-brand-700">
            {t('app.name')}
          </Link>
          <LanguageSwitch />
          {user ? (
            <Link to={homePathFor(user)} className={buttonClasses('primary', 'sm')}>
              {t('nav.cabinet')}
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonClasses('ghost', 'sm')}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className={buttonClasses('primary', 'sm')}>
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t-2 border-slate-100 py-6 text-center text-sm text-slate-500">
        {t('footer.text', { year: new Date().getFullYear() })}
      </footer>
    </div>
  )
}
