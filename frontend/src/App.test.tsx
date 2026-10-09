import { render, screen } from '@testing-library/react'
import { App } from './App'

test('App sarlavhani ko\'rsatadi', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Texnologiya platformasi' })).toBeInTheDocument()
})
