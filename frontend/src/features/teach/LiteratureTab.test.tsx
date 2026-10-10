import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { renderRoute, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { LiteratureTab } from './LiteratureTab'

test("adabiyot qo'shishda bo'sh maydonlar null ga, yil songa aylanadi", async () => {
  let body: unknown = null
  server.use(
    http.post('/api/teach/topics/10/literature', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ id: 1, title: 'Kasb pedagogikasi', author: '', year: 2020, url: null, order: 0 }, { status: 201 })
    }),
  )
  renderRoute(<LiteratureTab topicId={10} items={[]} />, { user: teacherUser })
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litTitle')), 'Kasb pedagogikasi')
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litYear')), '2020')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.add') }))
  await waitFor(() => expect(body).toEqual({ title: 'Kasb pedagogikasi', author: '', year: 2020, url: null }))
})

test("noto'g'ri havola va yil xato beradi", async () => {
  renderRoute(<LiteratureTab topicId={10} items={[]} />, { user: teacherUser })
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litTitle')), 'Kitob')
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litYear')), '20')
  await userEvent.type(screen.getByLabelText(i18n.t('teach.litUrl')), 'kitob.uz')
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.add') }))
  expect(await screen.findByText(i18n.t('validation.year'))).toBeInTheDocument()
  expect(screen.getByText(i18n.t('validation.url'))).toBeInTheDocument()
})

test("mavjud adabiyot muallif, yil va havola bilan ko'rsatiladi", () => {
  renderRoute(
    <LiteratureTab
      topicId={10}
      items={[{ id: 1, title: 'Kasb pedagogikasi', author: 'A. Karimov', year: 2020, url: 'https://kitob.uz/1', order: 0 }]}
    />,
    { user: teacherUser },
  )
  expect(screen.getByText('A. Karimov, 2020', { exact: false })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'https://kitob.uz/1' })).toHaveAttribute('href', 'https://kitob.uz/1')
})
