import { useTranslation } from 'react-i18next'
import { useCurrentUser, useUpdateMe } from '@/api/auth'
import type { Locale } from '@/api/types'
import { setLanguage } from '@/i18n'
import { cx } from '@/lib/cx'

const LOCALES: Locale[] = ['uz', 'ru']

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const user = useCurrentUser()
  const updateMe = useUpdateMe()

  function choose(lang: Locale) {
    if (lang === i18n.language) return
    // Kirgan foydalanuvchida tilni `useUpdateMe` o'zi almashtiradi va server saqlamasa qaytaradi.
    if (user) updateMe.mutate({ locale: lang })
    else setLanguage(lang)
  }

  return (
    <div role="group" aria-label={t('nav.language')} className="inline-flex shrink-0 rounded-xl border-2 border-slate-200 p-0.5">
      {LOCALES.map((lang) => {
        const active = i18n.language === lang
        return (
          <button
            key={lang}
            type="button"
            aria-pressed={active}
            aria-label={t(`languages.${lang}`)}
            onClick={() => choose(lang)}
            className={cx(
              'rounded-lg px-2 py-1 text-xs font-bold uppercase',
              // brand-700: oq matn bilan WCAG AA kontrastini ta'minlaydi (brand-500 ~2.5:1 edi, yetarli emas).
              active ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {lang}
          </button>
        )
      })}
    </div>
  )
}
