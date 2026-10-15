import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useRegister } from '@/api/auth'
import type { Locale } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { AuthCard } from './AuthCard'
import { AUTH_LINK, AUTH_SUBMIT } from './authStyles'
import { PasswordStrength } from './PasswordStrength'
import { registerSchema, type RegisterValues } from './schemas'

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const registerUser = useRegister()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', phone: '', password: '', password_confirm: '' },
  })
  const password = watch('password')

  function onSubmit(values: RegisterValues) {
    registerUser.mutate(
      {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        password: values.password,
        locale: i18n.language as Locale,
      },
      { onSuccess: () => void navigate('/pending', { replace: true }) },
    )
  }

  return (
    <AuthCard
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      variant="register"
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className={AUTH_LINK}>
            {t('nav.login')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {registerUser.error && <FormError error={registerUser.error} />}
        <Field id="full_name" label={t('auth.fullName')} error={errors.full_name?.message}>
          <Input
            id="full_name"
            icon="user"
            autoComplete="name"
            aria-invalid={Boolean(errors.full_name)}
            {...register('full_name')}
          />
        </Field>
        <Field id="email" label={t('auth.email')} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            icon="mail"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>
        <Field id="phone" label={t('auth.phone')} hint={t('auth.phoneHint')} error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            icon="phone"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </Field>
        <Field id="password" label={t('auth.password')} hint={t('auth.passwordHint')} error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <PasswordStrength password={password} />
        <Field id="password_confirm" label={t('auth.passwordConfirm')} error={errors.password_confirm?.message}>
          <PasswordInput
            id="password_confirm"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password_confirm)}
            {...register('password_confirm')}
          />
        </Field>
        <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-xs text-brand-900 ring-1 ring-brand-100">
          <Icon name="shield" className="mt-px size-4 shrink-0 text-brand-700" />
          {t('auth.register.pendingNote')}
        </p>
        <Button type="submit" loading={registerUser.isPending} className={AUTH_SUBMIT}>
          {t('auth.register.submit')}
          {!registerUser.isPending && (
            <Icon
              name="arrowRight"
              className="size-5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
