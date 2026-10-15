import { zodResolver } from '@hookform/resolvers/zod'
import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useDashboard } from '@/api/assessment'
import { useChangePassword, useCurrentUser, useUpdateMe } from '@/api/auth'
import type { User } from '@/api/types'
import { LanguageSwitch } from '@/app/layouts/LanguageSwitch'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { PAGE_TITLE, SURFACE } from '@/components/ui/styles'
import { pushToast } from '@/components/ui/toast-store'
import { cx } from '@/lib/cx'
import { fadeUp } from '@/lib/motion'
import { AvatarEditor, AvatarRemoveButton } from './AvatarEditor'
import { passwordSchema, profileSchema, type PasswordValues, type ProfileValues } from './schemas'

export function ProfilePage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  if (!user) return null
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className={PAGE_TITLE}>{t('profile.title')}</h1>
      <ProfileHero user={user} />
      <ProfileForm user={user} />
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon="globe">{t('profile.language')}</SectionTitle>
        <LanguageSwitch />
      </Card>
      <PasswordForm />
    </div>
  )
}

/** Yuqori karta: avatar (bosh harflar), ism, rol, email; talabada — seriya va XP. */
function ProfileHero({ user }: { user: User }) {
  const { t } = useTranslation()
  return (
    <m.section
      initial="hidden"
      animate="show"
      variants={fadeUp}
      aria-label={user.full_name}
      className={cx(SURFACE, 'overflow-hidden')}
    >
      <div aria-hidden="true" className="relative h-28 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-800 to-brand-950 sm:h-32">
        <div className="absolute inset-0 bg-grid opacity-25" />
        <div className="absolute -top-16 right-10 size-56 rounded-full bg-brand-400/30 blur-3xl" />
      </div>
      <div className="px-5 pb-6 sm:px-7">
        {/* Avatar bannerga yarim chiqadi; ism va ma'lumotlar esa banner ostida, alohida qatorda. */}
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 sm:-mt-14">
          <AvatarEditor user={user} />
          {user.role === 'student' && <StudentStats />}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-2xl">
            {user.full_name}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-0.5 font-semibold text-brand-800 ring-1 ring-brand-200/70">
              <span className="sr-only">{t('profile.role')}: </span>
              {t(`roles.${user.role}`)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Icon name="mail" className="size-4 shrink-0 text-slate-400" />
              <span className="sr-only">{t('auth.email')}: </span>
              <span className="truncate">{user.email}</span>
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
            <span className="text-xs text-slate-500">{t('profile.avatarHint')}</span>
            <AvatarRemoveButton user={user} />
          </div>
        </div>
      </div>
    </m.section>
  )
}

/** Talabaning seriya va XP ko'rsatkichi (ma'lumot yo'q bo'lsa ko'rinmaydi). */
function StudentStats() {
  const { t } = useTranslation()
  const { data } = useDashboard()
  if (!data) return null
  return (
    <dl className="flex gap-2">
      <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 ring-1 ring-orange-200/70">
        <Icon name="flame" className="size-4 text-orange-700" />
        <dt className="sr-only">{t('dashboard.streakLabel')}</dt>
        <dd className="text-sm font-bold text-orange-800 tabular-nums">
          {t('dashboard.streak', { count: data.streak.current })}
        </dd>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200/70">
        <Icon name="star" className="size-4 text-amber-700" />
        <dt className="sr-only">{t('dashboard.xpLabel')}</dt>
        <dd className="text-sm font-bold text-amber-800 tabular-nums">{t('dashboard.xp', { xp: data.xp_total })}</dd>
      </div>
    </dl>
  )
}

function SectionTitle({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-bold tracking-tight text-slate-900">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-1 ring-brand-200/70"
      >
        <Icon name={icon} className="size-4.5" />
      </span>
      {children}
    </h2>
  )
}

function ProfileForm({ user }: { user: User }) {
  const { t } = useTranslation()
  // `silent: true`: xato shu yerda `FormError` orqali ko'rsatiladi — umumiy toast bilan
  // ikki marta chiqmasligi uchun.
  const updateMe = useUpdateMe({ silent: true })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user.full_name, phone: user.phone ?? '' },
  })

  return (
    <Card>
      <div className="mb-5">
        <SectionTitle icon="user">{t('profile.personal')}</SectionTitle>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          // Har bir yuborishda eski server xatosi tozalanadi — validatsiya o'tmasa ham.
          updateMe.reset()
          void handleSubmit((values) =>
            updateMe.mutate(
              { full_name: values.full_name, phone: values.phone || null },
              {
                onSuccess: (updatedUser) => {
                  pushToast('success', t('profile.saved'))
                  // Server qaytargan (kesilgan/tozalangan) qiymatlar bilan formani yangilaymiz.
                  reset({ full_name: updatedUser.full_name, phone: updatedUser.phone ?? '' })
                },
              },
            ),
          )(event)
        }}
      >
        {updateMe.error && <FormError error={updateMe.error} />}
        <Field id="full_name" label={t('auth.fullName')} error={errors.full_name?.message}>
          <Input
            id="full_name"
            icon="user"
            autoComplete="name"
            placeholder={t('auth.placeholders.fullName')}
            aria-invalid={Boolean(errors.full_name)}
            {...register('full_name')}
          />
        </Field>
        <Field id="phone" label={t('auth.phone')} error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            icon="phone"
            autoComplete="tel"
            placeholder={t('auth.placeholders.phone')}
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
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
      <div className="mb-5">
        <SectionTitle icon="lock">{t('profile.passwordTitle')}</SectionTitle>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          // Har bir yuborishda eski server xatosi tozalanadi — validatsiya o'tmasa ham.
          changePassword.reset()
          void handleSubmit((values) =>
            changePassword.mutate({ current_password: values.current_password, new_password: values.new_password }),
          )(event)
        }}
      >
        {changePassword.error && <FormError error={changePassword.error} />}
        <Field id="current_password" label={t('profile.currentPassword')} error={errors.current_password?.message}>
          <PasswordInput
            id="current_password"
            placeholder={t('profile.currentPasswordPlaceholder')}
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
          <PasswordInput
            id="new_password"
            placeholder={t('auth.placeholders.passwordNew')}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.new_password)}
            {...register('new_password')}
          />
        </Field>
        <Field id="confirm" label={t('auth.passwordConfirm')} error={errors.confirm?.message}>
          <PasswordInput
            id="confirm"
            placeholder={t('auth.placeholders.passwordConfirm')}
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
