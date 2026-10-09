import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { resetAuthHandlers, setAccessToken } from '@/api/client'
import { clearToasts } from '@/components/ui/toast-store'
import { setLanguage } from '@/i18n'
import { server } from './server'

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

beforeEach(() => {
  // Til, localStorage'dagi tanlov va <html lang> har test oldidan tiklanadi.
  setLanguage('uz')
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  clearToasts()
  setAccessToken(null)
  resetAuthHandlers()
})

afterAll(() => {
  server.close()
})
