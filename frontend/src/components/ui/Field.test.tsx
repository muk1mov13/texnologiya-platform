import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { Field, Input } from './Field'

test('label input bilan bog\'langan', () => {
  render(
    <Field id="email" label="Email">
      <Input id="email" />
    </Field>,
  )
  expect(screen.getByLabelText('Email')).toBeInstanceOf(HTMLInputElement)
})

test('xato kaliti i18n orqali tarjima qilinadi', () => {
  render(
    <Field id="email" label="Email" error="validation.required">
      <Input id="email" />
    </Field>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('validation.required'))
})

test('xato bo\'lsa input aria-invalid va aria-describedby oladi', () => {
  render(
    <Field id="email" label="Email" error="validation.required">
      <Input id="email" />
    </Field>,
  )
  const input = screen.getByLabelText('Email')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAttribute('aria-describedby', 'email-error')
})

test('Input\'ga berilgan ref <input> elementiga yetadi', () => {
  const ref = createRef<HTMLInputElement>()
  render(<Input id="email" ref={ref} />)
  expect(ref.current).toBeInstanceOf(HTMLInputElement)
})
