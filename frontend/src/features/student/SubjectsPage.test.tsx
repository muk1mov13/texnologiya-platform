import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { studentKeys } from '@/api/student'
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

// --- Code-review tuzatishi (3-tur): ma'lumot-birinchi — fon qayta so'rovi xatosi kontentni yopmaydi ---

test('fanlar keshda bo\'lsa, fon qayta so\'rovi 500 bo\'lganda ham ro\'yxat ko\'rinishda qoladi', async () => {
  server.use(
    http.get('/api/subjects', () => HttpResponse.json(subjectCards)),
    http.get('/api/me/continue', () => HttpResponse.json(null)),
  )
  const { queryClient } = renderRoute(<SubjectsPage />, { path: '/app', user: studentUser })
  expect(await screen.findByRole('link', { name: /Metodika asoslari/ })).toBeInTheDocument()

  // "Tugatdim" ['subjects']ni invalidatsiya qiladi; keyingi qayta so'rov serverda 500 bilan tugaydi.
  server.use(
    http.get('/api/subjects', () => HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'x', details: {} }, { status: 500 })),
  )
  await queryClient.invalidateQueries({ queryKey: studentKeys.subjects })

  await waitFor(() => expect(queryClient.isFetching({ queryKey: studentKeys.subjects })).toBe(0))
  // Avval yuklangan ro'yxat ko'rinishda qoladi — "Nimadir xato ketdi" chiqmaydi.
  expect(screen.getByRole('link', { name: /Metodika asoslari/ })).toBeInTheDocument()
  expect(screen.queryByText(i18n.t('common.errorTitle'))).not.toBeInTheDocument()
})
