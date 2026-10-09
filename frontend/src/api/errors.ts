import { i18n } from '@/i18n'
import { ApiError } from './client'

const HTTP_5XX = /^HTTP_5\d\d$/

/** Backend xato kodini joriy tilga o'giradi; tarjimasi yo'q kod uchun server xabari (uz) yoki umumiy matn qaytadi. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (HTTP_5XX.test(error.code)) {
      return i18n.t('errors.INTERNAL_ERROR')
    }
    const key = `errors.${error.code}`
    if (i18n.exists(key)) {
      return i18n.t(key)
    }
    return i18n.language === 'uz' ? error.message : i18n.t('errors.UNKNOWN')
  }
  return i18n.t('errors.NETWORK')
}
