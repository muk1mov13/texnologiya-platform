import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLogin } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { AuthCard } from './AuthCard'
import { loginSchema, type LoginValues } from './schemas'

export function LoginPage() {
  const { t } = useTranslation()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  return (
    <AuthCard
      title={t('auth.login.title')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            {t('nav.register')}
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit((values) => login.mutate(values))} className="flex flex-col gap-4">
        {login.error && <FormError error={login.error} />}
        <Field id="email" label={t('auth.email')} error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email')} />
        </Field>
        <Field id="password" label={t('auth.password')} error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </Field>
        <Button type="submit" loading={login.isPending}>
          {t('auth.login.submit')}
        </Button>
      </form>
    </AuthCard>
  )
}
