import { QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
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
const loadMotionFeatures = () => import('@/lib/motionFeatures').then((module) => module.default)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Tizimda "kamroq harakat" yoqilgan bo'lsa, `motion` transform animatsiyalarini o'chiradi. */}
    {/* `strict`: faqat yengil `m.*` komponentlari; to'liq `motion.*` bundle'ni kattalashtiradi. */}
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>
          <SessionGate>
            <RouterProvider router={router} />
          </SessionGate>
          <Toaster />
        </QueryClientProvider>
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
)
