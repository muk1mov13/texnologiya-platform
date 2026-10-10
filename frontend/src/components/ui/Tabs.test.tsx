import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Tabs } from './Tabs'

function Harness() {
  const [value, setValue] = useState<'a' | 'b'>('a')
  return (
    <Tabs
      label="Bo'limlar"
      value={value}
      onChange={setValue}
      items={[
        { id: 'a', label: 'Birinchi' },
        { id: 'b', label: 'Ikkinchi' },
      ]}
    />
  )
}

test('bosilgan tab tanlanadi, strelka bilan o\'tiladi', async () => {
  render(<Harness />)
  expect(screen.getByRole('tab', { name: 'Birinchi' })).toHaveAttribute('aria-selected', 'true')
  await userEvent.click(screen.getByRole('tab', { name: 'Ikkinchi' }))
  expect(screen.getByRole('tab', { name: 'Ikkinchi' })).toHaveAttribute('aria-selected', 'true')
  await userEvent.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', { name: 'Birinchi' })).toHaveAttribute('aria-selected', 'true')
})
