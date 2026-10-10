import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { renderRoute, teacherUser } from '@/test/render'
import { server } from '@/test/server'
import { GlossaryTab } from './GlossaryTab'

const items = [{ id: 1, term: 'Kasb', definition: 'Mehnat faoliyati turi', order: 0 }]

test("yangi atama qo'shiladi va forma tozalanadi", async () => {
  let body: unknown = null
  server.use(
    http.post('/api/teach/topics/10/glossary', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ id: 2, term: 'Malaka', definition: "Ko'nikmalar darajasi", order: 1 }, { status: 201 })
    }),
  )
  renderRoute(<GlossaryTab topicId={10} items={items} />, { user: teacherUser })
  const term = screen.getByLabelText(i18n.t('teach.term'))
  await userEvent.type(term, 'Malaka')
  await userEvent.type(screen.getByLabelText(i18n.t('teach.definition')), "Ko'nikmalar darajasi")
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.add') }))
  await waitFor(() => expect(body).toEqual({ term: 'Malaka', definition: "Ko'nikmalar darajasi" }))
  await waitFor(() => expect(term).toHaveValue(''))
})

test("bo'sh atama validatsiyadan o'tmaydi", async () => {
  renderRoute(<GlossaryTab topicId={10} items={[]} />, { user: teacherUser })
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.add') }))
  expect(await screen.findAllByText(i18n.t('validation.required'))).toHaveLength(2)
})

test('atamani tahrirlash PATCH yuboradi', async () => {
  let body: unknown = null
  server.use(
    http.patch('/api/teach/topics/10/glossary/1', async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...items[0], definition: 'Yangi izoh' })
    }),
  )
  renderRoute(<GlossaryTab topicId={10} items={items} />, { user: teacherUser })
  const row = screen.getByRole('listitem', { name: 'Kasb' })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('common.edit') }))
  const definition = within(row).getByLabelText(i18n.t('teach.definition'))
  await userEvent.clear(definition)
  await userEvent.type(definition, 'Yangi izoh')
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('common.save') }))
  await waitFor(() => expect(body).toEqual({ term: 'Kasb', definition: 'Yangi izoh' }))
})

test("atamani o'chirish tasdiqlangach DELETE yuboriladi", async () => {
  const deleted = vi.fn()
  server.use(
    http.delete('/api/teach/topics/10/glossary/1', () => {
      deleted()
      return new HttpResponse(null, { status: 204 })
    }),
  )
  renderRoute(<GlossaryTab topicId={10} items={items} />, { user: teacherUser })
  const row = screen.getByRole('listitem', { name: 'Kasb' })
  await userEvent.click(within(row).getByRole('button', { name: i18n.t('common.delete') }))
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: i18n.t('common.delete') }))
  await waitFor(() => expect(deleted).toHaveBeenCalledOnce())
})
