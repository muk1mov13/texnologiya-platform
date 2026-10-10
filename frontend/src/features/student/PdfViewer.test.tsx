import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useEffect, type ReactNode } from 'react'
import { setAccessToken } from '@/api/client'
import { createQueryClient } from '@/api/queryClient'
import { i18n } from '@/i18n'
import { server } from '@/test/server'
import { PdfViewer } from './PdfViewer'

// `react-pdf` o'zi mock qilinadi (haqiqiy chizish E2E testda tekshiriladi) — Document/Page
// oddiy stub'lar, `onLoadSuccess` mount bo'lgach chaqiriladi (render paytida emas, aks holda
// boshqa komponentni render paytida yangilash haqida ogohlantirish beradi).
vi.mock('react-pdf', () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: ({
    children,
    onLoadSuccess,
  }: {
    children?: ReactNode
    onLoadSuccess?: (info: { numPages: number }) => void
  }) => {
    // Faqat mount bo'lganda bir marta chaqiriladi — haqiqiy react-pdf PDF yuklanganda shunday
    // ishlaydi. `onLoadSuccess` har renderda yangi funksiya bo'lgani uchun deps'ga kiritilmaydi,
    // aks holda `page` o'zgarganda PdfViewer qayta render bo'lib, sahifa 1'ga qaytib ketardi.
    useEffect(() => {
      onLoadSuccess?.({ numPages: 3 })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return <div data-testid="document">{children}</div>
  },
  Page: ({ pageNumber }: { pageNumber: number }) => <div data-testid="page">{pageNumber}</div>,
}))

function renderViewer(url = '/api/materials/500/file') {
  setAccessToken('test-token')
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false, retryDelay: 0 } })
  return render(
    <QueryClientProvider client={queryClient}>
      <PdfViewer url={url} title="Kirish ma'ruzasi" />
    </QueryClientProvider>,
  )
}

test('sahifalar o\'rtasida o\'tish, chegaralarda tugmalar o\'chiriladi', async () => {
  server.use(http.get('/api/materials/500/file', () => new HttpResponse(new Uint8Array([1, 2, 3]).buffer)))
  renderViewer()

  expect(await screen.findByTestId('document')).toBeInTheDocument()
  expect(screen.getByText('1 / 3')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: i18n.t('player.prevPage') })).toBeDisabled()
  expect(screen.getByRole('button', { name: i18n.t('player.nextPage') })).toBeEnabled()

  await userEvent.click(screen.getByRole('button', { name: i18n.t('player.nextPage') }))
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: i18n.t('player.prevPage') })).toBeEnabled()
  expect(screen.getByRole('button', { name: i18n.t('player.nextPage') })).toBeEnabled()

  await userEvent.click(screen.getByRole('button', { name: i18n.t('player.nextPage') }))
  expect(screen.getByText('3 / 3')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: i18n.t('player.nextPage') })).toBeDisabled()

  await userEvent.click(screen.getByRole('button', { name: i18n.t('player.prevPage') }))
  expect(screen.getByText('2 / 3')).toBeInTheDocument()
})

test('faylni olishda 404 bo\'lsa qayta urinish tugmasisiz xato ko\'rsatiladi', async () => {
  server.use(
    http.get('/api/materials/404/file', () =>
      HttpResponse.json({ code: 'MATERIAL_NOT_FOUND', message: 'x', details: {} }, { status: 404 }),
    ),
  )
  renderViewer('/api/materials/404/file')
  expect(await screen.findByText(i18n.t('errors.MATERIAL_NOT_FOUND'))).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: i18n.t('common.retry') })).not.toBeInTheDocument()
  expect(screen.queryByTestId('document')).not.toBeInTheDocument()
})
