import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useRegister } from '@/api/auth'
import type { Locale } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { AuthCard } from './AuthCard'
import { registerSchema, type RegisterValues } from './schemas'

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const registerUser = useRegister()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', phone: '', password: '', password_confirm: '' },
  })

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
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            {t('nav.login')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {registerUser.error && <FormError error={registerUser.error} />}
        <Field id="full_name" label={t('auth.fullName')} error={errors.full_name?.message}>
          <Input id="full_name" autoComplete="name" aria-invalid={Boolean(errors.full_name)} {...register('full_name')} />
        </Field>
        <Field id="email" label={t('auth.email')} error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
        <Field id="phone" label={t('auth.phone')} hint={t('auth.phoneHint')} error={errors.phone?.message}>
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} {...register('phone')} />
        </Field>
        <Field id="password" label={t('auth.password')} hint={t('auth.passwordHint')} error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <Field id="password_confirm" label={t('auth.passwordConfirm')} error={errors.password_confirm?.message}>
          <Input
            id="password_confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password_confirm)}
            {...register('password_confirm')}
          />
        </Field>
        <Button type="submit" loading={registerUser.isPending}>
          {t('auth.register.submit')}
        </Button>
      </form>
    </AuthCard>
  )
}
