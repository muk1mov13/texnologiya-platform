import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { installAuthHandlers } from '@/api/auth'
import { createQueryClient } from '@/api/queryClient'
import { createAppRouter } from '@/app/router'
import { SessionGate } from '@/app/SessionGate'
import { Toaster } from '@/components/ui/Toast'
import '@/i18n'
import './index.css'

const queryClient = createQueryClient()
installAuthHandlers(queryClient)
const router = createAppRouter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionGate>
        <RouterProvider router={router} />
      </SessionGate>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
