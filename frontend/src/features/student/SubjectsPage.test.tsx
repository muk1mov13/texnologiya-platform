import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { subjectCards } from '@/test/fixtures'
import { renderRoute, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { SubjectsPage } from './SubjectsPage'

test("salomlashuv, davom ettirish kartasi va fanlar ko'rsatiladi", async () => {
  server.use(
    http.get('/api/subjects', () => HttpResponse.json(subjectCards)),
    http.get('/api/me/continue', () =>
      HttpResponse.json({
        subject_id: 1,
        subject_slug: 'kasb-talimi-metodikasi',
        subject_title: "Kasb ta'limi metodikasi",
        topic_id: 10,
        topic_title: 'Kasb tanlash asoslari',
        step_id: 105,
        step_kind: 'glossary',
      }),
    ),
  )
  renderRoute(<SubjectsPage />, { path: '/app', user: studentUser })
  expect(
    screen.getByRole('heading', { name: i18n.t('student.hello', { name: studentUser.full_name }) }),
  ).toBeInTheDocument()
  const resume = await screen.findByRole('link', { name: /Kasb tanlash asoslari/ })
  expect(resume).toHaveAttribute('href', '/app/topics/10/glossary')
  // Fan nomi davom ettirish kartasida ham bor, shuning uchun plitka tavsif matni bo'yicha topiladi.
  const subject = await screen.findByRole('link', { name: /Metodika asoslari/ })
  expect(subject).toHaveAttribute('href', '/app/subjects/kasb-talimi-metodikasi')
  expect(screen.getByRole('img', { name: i18n.t('common.progress', { completed: 1, total: 3 }) })).toBeInTheDocument()
})

test("fanlar bo'lmasa bo'sh holat ko'rsatiladi", async () => {
  server.use(
    http.get('/api/subjects', () => HttpResponse.json([])),
    http.get('/api/me/continue', () => HttpResponse.json(null)),
  )
  renderRoute(<SubjectsPage />, { path: '/app', user: studentUser })
  expect(await screen.findByText(i18n.t('student.noSubjects'))).toBeInTheDocument()
})

test('fanlar ro\'yxati xato bo\'lsa qayta urinish tugmasi bilan xato holat ko\'rsatiladi', async () => {
  server.use(
    http.get('/api/subjects', () => HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'x', details: {} }, { status: 500 })),
    http.get('/api/me/continue', () => HttpResponse.json(null)),
  )
  renderRoute(<SubjectsPage />, { path: '/app', user: studentUser })
  expect(await screen.findByText(i18n.t('errors.INTERNAL_ERROR'))).toBeInTheDocument()
  expect(screen.getByRole('button', { name: i18n.t('common.retry') })).toBeInTheDocument()
})
