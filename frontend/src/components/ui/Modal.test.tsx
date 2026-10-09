import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n } from '@/i18n'
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

test('oxirgi fokuslanadigan elementdan Tab bilan birinchisiga qaytiladi', async () => {
  render(
    <Modal open title="Fan" onClose={() => {}}>
      <input aria-label="Nomi" />
    </Modal>,
  )
  const closeButton = screen.getByRole('button', { name: i18n.t('common.close') })
  const input = screen.getByLabelText('Nomi')
  input.focus()
  expect(input).toHaveFocus()
  await userEvent.tab()
  expect(closeButton).toHaveFocus()
})

test('Shift+Tab bilan birinchi elementdan oxirgisiga o\'tiladi', async () => {
  render(
    <Modal open title="Fan" onClose={() => {}}>
      <input aria-label="Nomi" />
    </Modal>,
  )
  const closeButton = screen.getByRole('button', { name: i18n.t('common.close') })
  const input = screen.getByLabelText('Nomi')
  closeButton.focus()
  expect(closeButton).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(input).toHaveFocus()
})

test('panelning o\'ziga fokus bo\'lsa, Shift+Tab oxirgi elementga o\'tkazadi', async () => {
  render(
    <Modal open title="Fan" onClose={() => {}}>
      <input aria-label="Nomi" />
    </Modal>,
  )
  const dialog = screen.getByRole('dialog')
  const input = screen.getByLabelText('Nomi')
  dialog.focus()
  expect(dialog).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(input).toHaveFocus()
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
