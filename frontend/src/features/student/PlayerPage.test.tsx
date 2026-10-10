import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { i18n } from '@/i18n'
import { stepContent, topicDetail } from '@/test/fixtures'
import { renderRoute, studentUser } from '@/test/render'
import { server } from '@/test/server'
import { PlayerPage } from './PlayerPage'

vi.mock('./PdfViewer', () => ({
  PdfViewer: ({ url, title }: { url: string; title: string }) => <div data-testid="pdf">{`${title}|${url}`}</div>,
}))

const PATH = '/app/topics/:topicId/:kind?'

function mockTopic(glossaryCompleted: () => boolean) {
  server.use(
    http.get('/api/topics/10', () => {
      const topic = topicDetail()
      topic.steps[5].status = glossaryCompleted() ? 'completed' : null
      return HttpResponse.json(topic)
    }),
    // StepContentView faqat `step.has_content` rost bo'lgan bosqichlar uchun GET /api/steps/{id}'ni
    // chaqiradi (gibrid "has_content" filtri) — shuning uchun bu yerda faqat kontentli
    // bosqichlar (lecture=101, glossary=105) uchun mock kerak; review (100) kontentsiz.
    http.get('/api/steps/101', () => HttpResponse.json(stepContent())),
    http.get('/api/steps/105', () =>
      HttpResponse.json(
        stepContent({
          id: 105,
          kind: 'glossary',
          order: 6,
          status: glossaryCompleted() ? 'completed' : null,
          materials: [],
          glossary: [{ id: 1, term: 'Kasb', definition: 'Mehnat faoliyati turi', order: 0 }],
        }),
      ),
    ),
  )
}

test('kind ko\'rsatilmasa birinchi kontentli bosqichga yo\'naltiriladi', async () => {
  mockTopic(() => false)
  const { router } = renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app/topics/10/lecture'))
})

test('ma\'ruza bosqichida PDF va "tugatilgan" belgisi ko\'rinadi', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  expect(await screen.findByTestId('pdf')).toHaveTextContent("Kirish ma'ruzasi|/api/materials/500/file")
  const section = screen.getByRole('region', { name: i18n.t('steps.lecture') })
  expect(within(section).getByText(i18n.t('player.completed'), { exact: false })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: i18n.t('player.complete') })).not.toBeInTheDocument()
})

test('glossariy bosqichini "Tugatdim" bilan yakunlash', async () => {
  let completed = false
  mockTopic(() => completed)
  server.use(
    http.post('/api/steps/105/complete', () => {
      completed = true
      return HttpResponse.json({ id: 105, kind: 'glossary', order: 6, has_content: true, status: 'completed' })
    }),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/glossary', user: studentUser })
  expect(await screen.findByText('Mehnat faoliyati turi')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: i18n.t('player.complete') }))
  expect(await screen.findByText(i18n.t('player.completedToast'))).toBeInTheDocument()
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: i18n.t('player.complete') })).not.toBeInTheDocument(),
  )
})

test('kontentsiz bosqich "material yo\'q" holatini ko\'rsatadi', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/review', user: studentUser })
  expect(await screen.findByText(i18n.t('player.noContent'))).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: i18n.t('player.complete') })).not.toBeInTheDocument()
})

test('bosqichlar ro\'yxatida joriy bosqich belgilangan', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/glossary', user: studentUser })
  const current = await screen.findByRole('link', { current: 'step' })
  expect(current).toHaveTextContent(i18n.t('steps.glossary'))
})

// --- Code-review tuzatishi: qo'shimcha testlar ---

test('bir nechta material bo\'lsa faqat tanlangani ko\'rsatiladi', async () => {
  mockTopic(() => false)
  server.use(
    http.get('/api/steps/101', () =>
      HttpResponse.json(
        stepContent({
          materials: [
            { id: 500, title: "Kirish ma'ruzasi", page_count: 3, file_url: '/api/materials/500/file' },
            { id: 501, title: "Qo'shimcha material", page_count: 2, file_url: '/api/materials/501/file' },
          ],
        }),
      ),
    ),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  expect(await screen.findByTestId('pdf')).toHaveTextContent("Kirish ma'ruzasi|/api/materials/500/file")
  expect(screen.getAllByTestId('pdf')).toHaveLength(1)

  const secondButton = screen.getByRole('button', { name: "Qo'shimcha material" })
  expect(secondButton).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(secondButton)

  expect(await screen.findByTestId('pdf')).toHaveTextContent("Qo'shimcha material|/api/materials/501/file")
  expect(screen.getAllByTestId('pdf')).toHaveLength(1)
  expect(secondButton).toHaveAttribute('aria-pressed', 'true')
})

test('bosqich kontentini olishda xato bo\'lsa qayta urinish bilan xato holati ko\'rsatiladi', async () => {
  mockTopic(() => false)
  let attempt = 0
  server.use(
    http.get('/api/steps/101', () => {
      attempt += 1
      if (attempt === 1) return HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'x', details: {} }, { status: 500 })
      return HttpResponse.json(stepContent())
    }),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  expect(await screen.findByText(i18n.t('errors.INTERNAL_ERROR'))).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.retry') }))
  expect(await screen.findByTestId('pdf')).toBeInTheDocument()
})

test('manzilda noma\'lum bosqich turi bo\'lsa birinchi kontentli bosqichga yo\'naltiriladi', async () => {
  mockTopic(() => false)
  const { router } = renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/exam', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app/topics/10/lecture'))
})

test('kontentli bosqich bo\'lmagan mavzuda birinchi bosqich ko\'rsatiladi', async () => {
  server.use(
    http.get('/api/topics/10', () =>
      HttpResponse.json(
        topicDetail({
          steps: [
            { id: 100, kind: 'review', order: 1, has_content: false, status: null },
            { id: 103, kind: 'practice', order: 2, has_content: false, status: null },
          ],
          progress: { completed: 0, total: 0 },
        }),
      ),
    ),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10', user: studentUser })
  expect(await screen.findByText(i18n.t('player.noContent'))).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: new RegExp(i18n.t('steps.review')) })).toBeInTheDocument()
})

test('manzildagi bosqich turi mavzuda bo\'lmasa birinchi kontentli bosqichga yo\'naltiriladi', async () => {
  server.use(
    http.get('/api/topics/10', () =>
      HttpResponse.json(
        topicDetail({
          steps: [
            { id: 100, kind: 'review', order: 1, has_content: false, status: null },
            { id: 105, kind: 'glossary', order: 2, has_content: true, status: null },
          ],
        }),
      ),
    ),
    http.get('/api/steps/105', () =>
      HttpResponse.json(stepContent({ id: 105, kind: 'glossary', order: 2, status: null, materials: [] })),
    ),
  )
  // `lecture` to'g'ri bosqich turi, lekin bu mavzuda yo'q.
  const { router } = renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  await waitFor(() => expect(router.state.location.pathname).toBe('/app/topics/10/glossary'))
})

test('mavzuda bosqich umuman bo\'lmasa sahifa yiqilmaydi, bo\'sh holat ko\'rsatiladi', async () => {
  server.use(http.get('/api/topics/10', () => HttpResponse.json(topicDetail({ steps: [] }))))
  const { router } = renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10', user: studentUser })
  expect(await screen.findByText(i18n.t('player.noContent'))).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/app/topics/10')
})

// --- Code-review tuzatishi 2: fon qayta so'rovi xatosi ochiq kontentni yopmaydi ---

test('bosqichni tugatgandan keyin fon qayta so\'rovi 500 bo\'lsa ham kontent ko\'rinishda qoladi', async () => {
  mockTopic(() => false)
  server.use(
    http.post('/api/steps/105/complete', () =>
      HttpResponse.json({ id: 105, kind: 'glossary', order: 6, has_content: true, status: 'completed' }),
    ),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/glossary', user: studentUser })
  expect(await screen.findByText('Mehnat faoliyati turi')).toBeInTheDocument()

  // "Tugatdim"dan keyingi invalidatsiya qayta so'rovlari serverda 500 bilan tugaydi.
  server.use(
    http.get('/api/topics/10', () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'x', details: {} }, { status: 500 }),
    ),
    http.get('/api/steps/105', () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'x', details: {} }, { status: 500 }),
    ),
  )
  await userEvent.click(screen.getByRole('button', { name: i18n.t('player.complete') }))
  expect(await screen.findByText(i18n.t('player.completedToast'))).toBeInTheDocument()

  // Avval yuklangan kontent ko'rinishda qoladi — "Nimadir xato ketdi" chiqmaydi.
  expect(screen.getByText('Mehnat faoliyati turi')).toBeInTheDocument()
  expect(screen.queryByText(i18n.t('common.errorTitle'))).not.toBeInTheDocument()
})

// --- Code-review tuzatishi 3: umumiy canRetry ---

test('mavzu topilmasa (404) qayta urinish tugmasi ko\'rsatilmaydi', async () => {
  server.use(
    http.get('/api/topics/10', () =>
      HttpResponse.json({ code: 'TOPIC_NOT_FOUND', message: 'x', details: {} }, { status: 404 }),
    ),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10', user: studentUser })
  expect(await screen.findByText(i18n.t('errors.TOPIC_NOT_FOUND'))).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: i18n.t('common.retry') })).not.toBeInTheDocument()
})

test('mavzuni olishda server xatosi (5xx) bo\'lsa qayta urinish tugmasi ko\'rsatiladi', async () => {
  server.use(
    http.get('/api/topics/10', () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'x', details: {} }, { status: 500 }),
    ),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10', user: studentUser })
  expect(await screen.findByText(i18n.t('errors.INTERNAL_ERROR'))).toBeInTheDocument()
  expect(screen.getByRole('button', { name: i18n.t('common.retry') })).toBeInTheDocument()
})

// --- Code-review tuzatishi 4: bosqich almashganda fokus va scroll ---

test('"Keyingi bosqich" bosilganda fokus yangi bosqich sarlavhasiga o\'tadi', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  const next = await screen.findByRole('link', { name: new RegExp(i18n.t('player.next')) })
  await userEvent.click(next)
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: i18n.t('steps.glossary') })).toHaveFocus(),
  )
})

test('birinchi yuklanishda sarlavhaga fokus o\'g\'irlanmaydi', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  await screen.findByTestId('pdf')
  expect(screen.getByRole('heading', { name: i18n.t('steps.lecture') })).not.toHaveFocus()
})

// --- Code-review tuzatishi 8: "Keyingi bosqich" bo'sh bosqichlarni o'tkazib yuboradi ---

test('"Keyingi bosqich" kontentsiz bosqichlarni o\'tkazib yuboradi', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  const next = await screen.findByRole('link', { name: new RegExp(i18n.t('player.next')) })
  // lecture(101)dan keyingi kontentli bosqich glossary(105) — presentation/practice/task
  // (kontentsiz) o'tkazib yuboriladi.
  expect(next).toHaveAttribute('href', '/app/topics/10/glossary')
})

test('oxirgi kontentli bosqichda "Keyingi bosqich" havolasi yo\'q', async () => {
  mockTopic(() => false)
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/glossary', user: studentUser })
  await screen.findByText('Mehnat faoliyati turi')
  expect(screen.queryByRole('link', { name: new RegExp(i18n.t('player.next')) })).not.toBeInTheDocument()
})

// --- Code-review tuzatishi (3-tur): gibrid has_content filtri ---

test('mavzu kontentli deb bilgan bosqich eskirib, kontentsiz qaytsa bo\'sh holat ko\'rsatiladi', async () => {
  mockTopic(() => false)
  server.use(
    http.get('/api/steps/101', () =>
      HttpResponse.json(stepContent({ has_content: false, status: null, materials: [] })),
    ),
  )
  renderRoute(<PlayerPage />, { path: PATH, url: '/app/topics/10/lecture', user: studentUser })
  expect(await screen.findByText(i18n.t('player.noContent'))).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: i18n.t('player.complete') })).not.toBeInTheDocument()
})
