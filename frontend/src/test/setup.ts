import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { clearToasts } from '@/components/ui/toast-store'
import { setLanguage } from '@/i18n'

beforeEach(() => {
  // Til, localStorage'dagi tanlov va <html lang> har test oldidan tiklanadi.
  setLanguage('uz')
})

afterEach(() => {
  cleanup()
  clearToasts()
})
