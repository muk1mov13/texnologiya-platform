import { MutationCache, QueryClient } from '@tanstack/react-query'
import { pushToast } from '@/components/ui/toast-store'
import { ApiError } from './client'
import { errorText } from './errors'

declare module '@tanstack/react-query' {
  interface Register {
    // silent: xato forma ichida ko'rsatiladi, umumiy toast chiqmaydi.
    mutationMeta: { silent?: boolean }
  }
}

function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 2
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silent) return
        pushToast('error', errorText(error))
      },
    }),
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: shouldRetry },
      mutations: { retry: false },
    },
  })
}
