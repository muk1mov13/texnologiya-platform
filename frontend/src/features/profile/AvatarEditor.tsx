import { useRef, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteAvatar, useUploadAvatar } from '@/api/auth'
import type { User } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { pushToast } from '@/components/ui/toast-store'
import { cx, FOCUS_RING } from '@/lib/cx'
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, AVATAR_TYPES } from './avatarRules'

/** Profil kartasidagi katta avatar: ustidagi kamera tugmasi rasm tanlaydi va darhol yuklaydi. */
export function AvatarEditor({ user }: { user: User }) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadAvatar()
  const pending = upload.isPending

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Bir xil faylni qayta tanlash ham `change` bersin.
    event.target.value = ''
    if (!file) return
    if (!AVATAR_TYPES.has(file.type)) return pushToast('error', t('profile.avatarBadType'))
    if (file.size > AVATAR_MAX_BYTES) return pushToast('error', t('profile.avatarTooBig'))
    upload.mutate(file, { onSuccess: () => pushToast('success', t('profile.avatarSaved')) })
  }

  return (
    <div className="relative w-fit">
      <Avatar
        user={user}
        className="size-24 rounded-[1.75rem] bg-white shadow-soft ring-4 ring-white sm:size-28 sm:rounded-[2rem]"
      />
      {pending && (
        <span className="absolute inset-0 grid place-items-center rounded-[1.75rem] bg-slate-900/40 text-white sm:rounded-[2rem]">
          <Spinner size="md" />
        </span>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => input.current?.click()}
        aria-label={user.avatar_url ? t('profile.avatarChange') : t('profile.avatarUpload')}
        title={user.avatar_url ? t('profile.avatarChange') : t('profile.avatarUpload')}
        className={cx(
          'absolute -right-1.5 -bottom-1.5 grid size-9 place-items-center rounded-full bg-brand-700 text-white shadow-glow-sm ring-4 ring-white',
          'transition hover:bg-brand-800 active:scale-95 disabled:opacity-60 motion-reduce:transition-none',
          FOCUS_RING,
        )}
      >
        <Icon name="camera" className="size-4" />
      </button>
      <input ref={input} type="file" accept={AVATAR_ACCEPT} className="sr-only" tabIndex={-1} onChange={onChange} />
    </div>
  )
}

/** "Rasmni o'chirish" — faqat yuklangan rasm bo'lsa. */
export function AvatarRemoveButton({ user }: { user: User }) {
  const { t } = useTranslation()
  const remove = useDeleteAvatar()
  if (!user.avatar_url) return null
  return (
    <button
      type="button"
      disabled={remove.isPending}
      onClick={() => remove.mutate(undefined, { onSuccess: () => pushToast('success', t('profile.avatarRemoved')) })}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500',
        'transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60 motion-reduce:transition-none',
        FOCUS_RING,
      )}
    >
      {remove.isPending ? <Spinner size="sm" decorative /> : <Icon name="trash" className="size-4" />}
      {t('profile.avatarRemove')}
    </button>
  )
}
