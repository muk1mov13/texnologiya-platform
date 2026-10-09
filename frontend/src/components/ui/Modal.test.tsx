import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog, Modal } from './Modal'

test('ochiq modal dialog sifatida ko\'rinadi va Escape bilan yopiladi', async () => {
  const onClose = vi.fn()
  render(
    <Modal open title="Fan" onClose={onClose}>
      <input aria-label="Nomi" />
    </Modal>,
  )
  expect(screen.getByRole('dialog', { name: 'Fan' })).toBeInTheDocument()
  expect(screen.getByLabelText('Nomi')).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledOnce()
})

test('yopiq modal hech narsa chizmaydi', () => {
  render(
    <Modal open={false} title="Fan" onClose={() => {}}>
      x
    </Modal>,
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('ConfirmDialog tasdiqlash tugmasini chaqiradi', async () => {
  const onConfirm = vi.fn()
  render(
    <ConfirmDialog open title="O'chirish" text="Ishonchingiz komilmi?" confirmLabel="Ha" onConfirm={onConfirm} onCancel={() => {}} />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Ha' }))
  expect(onConfirm).toHaveBeenCalledOnce()
})
