import { i18n } from '@/i18n'
import { ApiError } from './client'
import { errorText } from './errors'

test('ma\'lum kod i18n orqali tarjima qilinadi', () => {
  const error = new ApiError(401, { code: 'INVALID_CREDENTIALS', message: 'server matni', details: {} })
  expect(errorText(error)).toBe(i18n.t('errors.INVALID_CREDENTIALS'))
})

test('noma\'lum kodda server xabari ko\'rsatiladi', () => {
  const error = new ApiError(400, { code: 'SOMETHING_NEW', message: 'Server xabari', details: {} })
  expect(errorText(error)).toBe('Server xabari')
})

test('tarmoq xatosi umumiy matn bilan', () => {
  expect(errorText(new TypeError('Failed to fetch'))).toBe(i18n.t('errors.NETWORK'))
})
