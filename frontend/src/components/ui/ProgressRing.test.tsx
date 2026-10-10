import { render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { ProgressRing } from './ProgressRing'

test('progress matn va aria-label bilan ko\'rsatiladi', () => {
  render(<ProgressRing completed={3} total={7} />)
  const ring = screen.getByRole('img', { name: i18n.t('common.progress', { completed: 3, total: 7 }) })
  expect(ring).toHaveTextContent('3/7')
})

test('total=0 bo\'lsa halqa bo\'sh', () => {
  const { container } = render(<ProgressRing completed={0} total={0} size={56} />)
  const arc = container.querySelectorAll('circle')[1]
  expect(arc.getAttribute('stroke-dashoffset')).toBe(arc.getAttribute('stroke-dasharray'))
})
