import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { subjectDetail } from '@/test/fixtures'
import { renderRoute, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { SubjectPage } from './SubjectPage'

test("mavzular tartib bilan, pleyerga havolalar bilan ko'rsatiladi", async () => {
  server.use(http.get('/api/subjects/:slug', () => HttpResponse.json(subjectDetail)))
  renderRoute(<SubjectPage />, { path: '/app/subjects/:slug', url: '/app/subjects/kasb-talimi-metodikasi', user: studentUser })
  expect(await screen.findByRole('heading', { name: "Kasb ta'limi metodikasi" })).toBeInTheDocument()
  const links = screen.getAllByRole('link', { name: /Kasb tanlash asoslari|Mehnat xavfsizligi/ })
  expect(links.map((link) => link.getAttribute('href'))).toEqual(['/app/topics/10', '/app/topics/11'])
})

test("topilmagan fan xato holatini ko'rsatadi, qayta urinish tugmasisiz, ortga havola bilan", async () => {
  server.use(
    http.get('/api/subjects/:slug', () =>
      HttpResponse.json({ code: 'SUBJECT_NOT_FOUND', message: 'x', details: {} }, { status: 404 }),
    ),
  )
  renderRoute(<SubjectPage />, { path: '/app/subjects/:slug', url: '/app/subjects/yoq', user: studentUser })
  expect(await screen.findByText(i18n.t('errors.SUBJECT_NOT_FOUND'))).toBeInTheDocument()
  // 4xx qayta urinish bilan tuzatilmaydi, shuning uchun tugma ko'rsatilmaydi.
  expect(screen.queryByRole('button', { name: i18n.t('common.retry') })).not.toBeInTheDocument()
  // Ortga havola xato holatida ham mavjud.
  expect(screen.getByRole('link', { name: new RegExp(i18n.t('student.allSubjects')) })).toBeInTheDocument()
})

test("fan ro'yxatini olishda server xatosi bo'lsa qayta urinish tugmasi ko'rsatiladi", async () => {
  server.use(
    http.get('/api/subjects/:slug', () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'x', details: {} }, { status: 500 }),
    ),
  )
  renderRoute(<SubjectPage />, { path: '/app/subjects/:slug', url: '/app/subjects/kasb-talimi-metodikasi', user: studentUser })
  expect(await screen.findByText(i18n.t('errors.INTERNAL_ERROR'))).toBeInTheDocument()
  expect(screen.getByRole('button', { name: i18n.t('common.retry') })).toBeInTheDocument()
})

test("mavzular bo'lmasa bo'sh holat ko'rsatiladi", async () => {
  server.use(
    http.get('/api/subjects/:slug', () => HttpResponse.json({ ...subjectDetail, topics: [] })),
  )
  renderRoute(<SubjectPage />, { path: '/app/subjects/:slug', url: '/app/subjects/kasb-talimi-metodikasi', user: studentUser })
  expect(await screen.findByText(i18n.t('student.noTopics'))).toBeInTheDocument()
})
