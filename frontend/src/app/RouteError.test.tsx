import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { i18n } from '@/i18n'
import { RouteError } from './RouteError'

function ThrowingPage(): never {
  throw new Error('boom')
}

test('marshrut elementi xato tashlasa lokalizatsiya qilingan xato sahifasi va qayta yuklash tugmasi ko\'rsatiladi', async () => {
  const reload = vi.fn()
  Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true })

  const router = createMemoryRouter(
    [{ path: '/', element: <ThrowingPage />, errorElement: <RouteError /> }],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)

  expect(await screen.findByText(i18n.t('routeError.title'))).toBeInTheDocument()
  expect(screen.getByText(i18n.t('routeError.text'))).toBeInTheDocument()
  const reloadButton = screen.getByRole('button', { name: i18n.t('routeError.reload') })
  await userEvent.click(reloadButton)
  expect(reload).toHaveBeenCalledTimes(1)
})
