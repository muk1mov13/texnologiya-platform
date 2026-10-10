import { i18n, setLanguage } from '@/i18n'
import { ApiError } from './client'
import { canRetry, errorText } from './errors'

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

test('HTTP 5xx kodlar server xatosi matni bilan ko\'rsatiladi', () => {
  const error = new ApiError(502, { code: 'HTTP_502', message: 'Bad gateway', details: {} })
  expect(errorText(error)).toBe(i18n.t('errors.INTERNAL_ERROR'))
})

test('ruscha interfeysda noma\'lum kod uchun umumiy matn ko\'rsatiladi', () => {
  setLanguage('ru')
  const error = new ApiError(400, { code: 'SOMETHING_NEW', message: 'Server xabari', details: {} })
  expect(errorText(error)).toBe(i18n.t('errors.UNKNOWN'))
})

test('canRetry: 4xx ApiError qayta urinishga ruxsat bermaydi', () => {
  expect(canRetry(new ApiError(404, { code: 'TOPIC_NOT_FOUND', message: 'x', details: {} }))).toBe(false)
  expect(canRetry(new ApiError(400, { code: 'VALIDATION_ERROR', message: 'x', details: {} }))).toBe(false)
})

test('canRetry: 5xx ApiError va tarmoq xatosi qayta urinishga ruxsat beradi', () => {
  expect(canRetry(new ApiError(500, { code: 'INTERNAL_ERROR', message: 'x', details: {} }))).toBe(true)
  expect(canRetry(new ApiError(502, { code: 'HTTP_502', message: 'x', details: {} }))).toBe(true)
  expect(canRetry(new TypeError('Failed to fetch'))).toBe(true)
})
