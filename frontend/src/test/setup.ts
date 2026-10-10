import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { resetAuthHandlers, setAccessToken } from '@/api/client'
import { clearToasts } from '@/components/ui/toast-store'
import { setLanguage } from '@/i18n'
import { server } from './server'

// jsdom `ResizeObserver` va `Element.scrollIntoView`ni amalga oshirmaydi — PdfViewer va
// PlayerPage'dagi fokus/o'lcham effektlari test muhitida xato bermasligi uchun minimal stub.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {}
}

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
