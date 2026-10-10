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

// `onUnhandledFrame: 'error'` faqat konsolga yozadi, so'rov esa tarmoq xatosi bilan tugaydi.
// Ilova tarmoq xatosini muloyim ko'rsatgani uchun test baribir o'tib ketardi. Shu sabab
// handler'siz so'rovlar yig'iladi va `afterEach`da test aniq xato bilan yiqiladi.
const unhandledRequests: string[] = []

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  server.events.on('request:unhandled', ({ request }) => {
    unhandledRequests.push(`${request.method} ${request.url}`)
  })
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
  const unhandled = unhandledRequests.splice(0)
  if (unhandled.length > 0) {
    throw new Error(`MSW handler'i yo'q so'rov(lar): ${unhandled.join(', ')}`)
  }
})

afterAll(() => {
  server.close()
})
