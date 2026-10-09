import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster } from './Toast'
import { pushToast } from './toast-store'

test('pushToast xabarni ko\'rsatadi va yopish tugmasi uni olib tashlaydi', async () => {
  render(<Toaster />)
  act(() => pushToast('success', 'Saqlandi'))
  expect(screen.getByText('Saqlandi')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /yopish|закрыть/i }))
  expect(screen.queryByText('Saqlandi')).not.toBeInTheDocument()
})
