import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { pushToast } from '@/components/ui/toast-store'
import { i18n, setLanguage } from '@/i18n'
import { apiFetch, refreshSession, setAccessToken, setAuthHandlers } from './client'
import type { LoginIn, MeUpdateIn, PasswordChangeIn, RegisterIn, TokenOut, User } from './types'

export const sessionKey = ['session'] as const

/** Client refresh/sessiya yo'qolishi haqida xabar berganda keshni yangilaydi. */
export function installAuthHandlers(queryClient: QueryClient): void {
  setAuthHandlers({
    onRefreshed: (session) => queryClient.setQueryData(sessionKey, session.user),
    onLost: () => queryClient.setQueryData(sessionKey, null),
  })
}

async function restoreSession(): Promise<User | null> {
  try {
    const session = await refreshSession()
    if (session) setLanguage(session.user.locale)
    return session?.user ?? null
  } catch {
    // Backend'ga ulanib bo'lmadi — mehmon sifatida davom etamiz.
    return null
  }
}

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: restoreSession,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}

export function useCurrentUser(): User | null {
  return useSession().data ?? null
}

function startSession(queryClient: QueryClient, session: TokenOut): void {
  setAccessToken(session.access_token)
  queryClient.setQueryData(sessionKey, session.user)
  setLanguage(session.user.locale)
}

function endSession(queryClient: QueryClient): void {
  setAccessToken(null)
  queryClient.setQueryData(sessionKey, null)
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKey[0] })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginIn) =>
      apiFetch<TokenOut>('/api/auth/login', { method: 'POST', json: data, auth: false }),
    onSuccess: (session) => startSession(queryClient, session),
    meta: { silent: true },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterIn) =>
      apiFetch<User>('/api/auth/register', { method: 'POST', json: data, auth: false }),
    meta: { silent: true },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>('/api/auth/logout', { method: 'POST', auth: false }),
    onSettled: () => endSession(queryClient),
    meta: { silent: true },
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MeUpdateIn) => apiFetch<User>('/api/me', { method: 'PATCH', json: data }),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionKey, user)
      setLanguage(user.locale)
    },
  })
}

/**
 * Backend parol almashganda barcha sessiyalarni bekor qiladi, shuning uchun lokal sessiya ham yopiladi.
 * Toast shu yerda chiqariladi: sessiya yopilgach profil sahifasi unmount bo'ladi.
 */
export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PasswordChangeIn) =>
      apiFetch<void>('/api/me/password', { method: 'POST', json: data }),
    onSuccess: () => {
      endSession(queryClient)
      pushToast('success', i18n.t('profile.passwordChanged'))
    },
    meta: { silent: true },
  })
}
