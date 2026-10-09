import { screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { renderRoutes, teacherUser } from '@/test/render'
import { PublicLayout } from './PublicLayout'

const routes = [{ element: <PublicLayout />, children: [{ path: '/', element: <p>bosh</p> }] }]

test('mehmon kirish va ro\'yxatdan o\'tish havolalarini ko\'radi', () => {
  renderRoutes(routes, { url: '/' })
  expect(screen.getByRole('link', { name: i18n.t('nav.login') })).toHaveAttribute('href', '/login')
  expect(screen.getByRole('link', { name: i18n.t('nav.register') })).toHaveAttribute('href', '/register')
})

test('kirgan foydalanuvchi kabinetga havola ko\'radi', () => {
  renderRoutes(routes, { url: '/', user: teacherUser })
  expect(screen.getByRole('link', { name: i18n.t('nav.cabinet') })).toHaveAttribute('href', '/teach')
})
