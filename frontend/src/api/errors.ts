import { i18n } from '@/i18n'
import { ApiError } from './client'

/** Backend xato kodini joriy tilga o'giradi; tarjimasi yo'q kod uchun server xabari qaytadi. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    return i18n.t(`errors.${error.code}`, { defaultValue: error.message })
  }
  return i18n.t('errors.NETWORK')
}
