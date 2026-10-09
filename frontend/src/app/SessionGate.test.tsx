import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { sessionKey } from '@/api/auth'
import { getAccessToken } from '@/api/client'
import { createQueryClient } from '@/api/queryClient'
import { makeUser } from '@/test/render'
import { server } from '@/test/server'
import { SessionGate } from './SessionGate'

function renderGate() {
  const queryClient = createQueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <SessionGate>
        <p>ilova</p>
      </SessionGate>
    </QueryClientProvider>,
  )
  return queryClient
}

test('refresh cookie bo\'lsa sessiya tiklanadi', async () => {
  const user = makeUser({ locale: 'ru' })
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ access_token: 'restored', token_type: 'bearer', user }),
    ),
  )
  const queryClient = renderGate()
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(await screen.findByText('ilova')).toBeInTheDocument()
  expect(queryClient.getQueryData(sessionKey)).toEqual(user)
  expect(getAccessToken()).toBe('restored')
})

test('refresh cookie bo\'lmasa mehmon sifatida davom etadi', async () => {
  server.use(
    http.post('/api/auth/refresh', () =>
      HttpResponse.json({ code: 'NO_REFRESH_TOKEN', message: 'x', details: {} }, { status: 401 }),
    ),
  )
  const queryClient = renderGate()
  expect(await screen.findByText('ilova')).toBeInTheDocument()
  expect(queryClient.getQueryData(sessionKey)).toBeNull()
})
