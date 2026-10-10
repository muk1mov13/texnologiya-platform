import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

test('bosilganda onClick chaqiriladi', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Saqlash</Button>)
  await userEvent.click(screen.getByRole('button', { name: 'Saqlash' }))
  expect(onClick).toHaveBeenCalledOnce()
})

test('loading holatida tugma bloklanadi va nomi o\'zgarmaydi', () => {
  render(<Button loading>Saqlash</Button>)
  const button = screen.getByRole('button', { name: 'Saqlash' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
})

test('sukut bo\'yicha type="button"', () => {
  render(<Button>OK</Button>)
  expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
})
