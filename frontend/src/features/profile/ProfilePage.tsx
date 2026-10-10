import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useChangePassword, useCurrentUser, useUpdateMe } from '@/api/auth'
import type { User } from '@/api/types'
import { LanguageSwitch } from '@/app/layouts/LanguageSwitch'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { pushToast } from '@/components/ui/toast-store'
import { passwordSchema, profileSchema, type PasswordValues, type ProfileValues } from './schemas'

export function ProfilePage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  if (!user) return null
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
      <Card className="flex flex-col gap-1">
        <p className="text-sm text-slate-500">{t('auth.email')}</p>
        <p className="font-semibold">{user.email}</p>
        <p className="mt-2 text-sm text-slate-500">{t('profile.role')}</p>
        <p className="font-semibold">{t(`roles.${user.role}`)}</p>
      </Card>
      <ProfileForm user={user} />
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t('profile.language')}</h2>
        <LanguageSwitch />
      </Card>
      <PasswordForm />
    </div>
  )
}

function ProfileForm({ user }: { user: User }) {
  const { t } = useTranslation()
  const updateMe = useUpdateMe()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user.full_name, phone: user.phone ?? '' },
  })

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">{t('profile.personal')}</h2>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          updateMe.mutate(
            { full_name: values.full_name, phone: values.phone || null },
            { onSuccess: () => pushToast('success', t('profile.saved')) },
          ),
        )}
      >
        {updateMe.error && <FormError error={updateMe.error} />}
        <Field id="full_name" label={t('auth.fullName')} error={errors.full_name?.message}>
          <Input
            id="full_name"
            autoComplete="name"
            aria-invalid={Boolean(errors.full_name)}
            {...register('full_name')}
          />
        </Field>
        <Field id="phone" label={t('auth.phone')} error={errors.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
        </Field>
        <div>
          <Button type="submit" loading={updateMe.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const { t } = useTranslation()
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">{t('profile.passwordTitle')}</h2>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) =>
          changePassword.mutate({ current_password: values.current_password, new_password: values.new_password }),
        )}
      >
        {changePassword.error && <FormError error={changePassword.error} />}
        <Field id="current_password" label={t('profile.currentPassword')} error={errors.current_password?.message}>
          <Input
            id="current_password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.current_password)}
            {...register('current_password')}
          />
        </Field>
        <Field
          id="new_password"
          label={t('profile.newPassword')}
          hint={t('auth.passwordHint')}
          error={errors.new_password?.message}
        >
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.new_password)}
            {...register('new_password')}
          />
        </Field>
        <Field id="confirm" label={t('auth.passwordConfirm')} error={errors.confirm?.message}>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm)}
            {...register('confirm')}
          />
        </Field>
        <div>
          <Button type="submit" loading={changePassword.isPending}>
            {t('profile.changePassword')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
