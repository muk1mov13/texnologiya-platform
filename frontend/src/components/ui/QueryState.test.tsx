import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/api/client'
import { createQueryClient } from '@/api/queryClient'
import { i18n } from '@/i18n'
import { QueryState } from './QueryState'

function apiError(status: number, code: string): ApiError {
  return new ApiError(status, { code, message: code, details: {} })
}

function Probe({ queryFn }: { queryFn: () => Promise<string> }) {
  const query = useQuery({ queryKey: ['probe'], queryFn, retry: false })
  return (
    <>
      <QueryState query={query}>{(data) => <p>{data}</p>}</QueryState>
      <button type="button" onClick={() => void query.refetch()}>
        refetch
      </button>
      {/* Fon so'rovi xato bilan tugaganini testda kutish uchun belgi. */}
      {query.isError && <span>so'rov xatosi</span>}
    </>
  )
}

function renderProbe(queryFn: () => Promise<string>) {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <Probe queryFn={queryFn} />
    </QueryClientProvider>,
  )
}

test("ma'lumot kelguncha spinner ko'rsatiladi", () => {
  renderProbe(() => new Promise<string>(() => {}))
  expect(screen.getByRole('status', { name: i18n.t('common.loading') })).toBeInTheDocument()
})

test("ma'lumot kelgach children chiziladi", async () => {
  renderProbe(() => Promise.resolve('salom'))
  expect(await screen.findByText('salom')).toBeInTheDocument()
})

test("4xx xatoda xato holati chiqadi, qayta urinish tugmasi yo'q", async () => {
  renderProbe(() => Promise.reject(apiError(404, 'NOT_FOUND')))
  expect(await screen.findByText(i18n.t('errors.NOT_FOUND'))).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: i18n.t('common.retry') })).not.toBeInTheDocument()
})

test("5xx xatoda qayta urinish tugmasi bor va u so'rovni qaytaradi", async () => {
  let calls = 0
  renderProbe(() => {
    calls += 1
    return calls === 1 ? Promise.reject(apiError(500, 'HTTP_500')) : Promise.resolve('tiklandi')
  })
  await userEvent.click(await screen.findByRole('button', { name: i18n.t('common.retry') }))
  expect(await screen.findByText('tiklandi')).toBeInTheDocument()
})

test("ma'lumot bor paytda fon qayta so'rovi xato bersa ham ma'lumot ko'rinishda qoladi", async () => {
  let calls = 0
  renderProbe(() => {
    calls += 1
    return calls === 1 ? Promise.resolve('eski') : Promise.reject(apiError(500, 'HTTP_500'))
  })
  expect(await screen.findByText('eski')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'refetch' }))
  expect(await screen.findByText("so'rov xatosi")).toBeInTheDocument()
  expect(screen.getByText('eski')).toBeInTheDocument()
  expect(screen.queryByText(i18n.t('errors.INTERNAL_ERROR'))).not.toBeInTheDocument()
})
