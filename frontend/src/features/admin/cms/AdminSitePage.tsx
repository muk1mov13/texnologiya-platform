import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAdminSite, useUpdateSite } from '@/api/adminCms'
import type { SiteSettings, SiteSocials } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Markdown } from '@/components/ui/Markdown'
import { QueryState } from '@/components/ui/QueryState'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { pushToast } from '@/components/ui/toast-store'
import {
  aboutSchema,
  contactsSchema,
  socialsSchema,
  type AboutValues,
  type ContactsValues,
  type SocialsValues,
} from './schemas'

const SOCIALS: (keyof SiteSocials)[] = ['telegram', 'instagram', 'facebook', 'youtube']

function SaveButton({ pending }: { pending: boolean }) {
  const { t } = useTranslation()
  return (
    <Button type="submit" loading={pending} className="self-start">
      {t('common.save')}
    </Button>
  )
}

// Har bo'lim faqat o'z kalitini yuboradi — boshqa bo'limdagi saqlanmagan o'zgarishlar tegilmaydi.

function ContactsForm({ initial }: { initial: SiteSettings['contacts'] }) {
  const { t } = useTranslation()
  const update = useUpdateSite()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactsValues>({ resolver: zodResolver(contactsSchema), defaultValues: initial })
  return (
    <form
      noValidate
      onSubmit={handleSubmit((contacts) =>
        update.mutate({ contacts }, { onSuccess: () => pushToast('success', t('adminSite.saved')) }),
      )}
      className="flex flex-col gap-4"
    >
      {update.error && <FormError error={update.error} />}
      <Field id="site-phone" label={t('adminSite.phone')} error={errors.phone?.message}>
        <Input id="site-phone" type="tel" maxLength={50} {...register('phone')} />
      </Field>
      <Field id="site-email" label={t('adminSite.email')} error={errors.email?.message}>
        <Input id="site-email" type="email" maxLength={150} {...register('email')} />
      </Field>
      <Field id="site-address" label={t('adminSite.address')} error={errors.address?.message}>
        <Input id="site-address" maxLength={300} {...register('address')} />
      </Field>
      <Field id="site-hours" label={t('adminSite.hours')} error={errors.hours?.message}>
        <Input id="site-hours" maxLength={100} {...register('hours')} />
      </Field>
      <SaveButton pending={update.isPending} />
    </form>
  )
}

function SocialsForm({ initial }: { initial: SiteSocials }) {
  const { t } = useTranslation()
  const update = useUpdateSite()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SocialsValues>({ resolver: zodResolver(socialsSchema), defaultValues: initial })
  return (
    <form
      noValidate
      onSubmit={handleSubmit((socials) =>
        update.mutate({ socials }, { onSuccess: () => pushToast('success', t('adminSite.saved')) }),
      )}
      className="flex flex-col gap-4"
    >
      {update.error && <FormError error={update.error} />}
      {SOCIALS.map((key) => (
        <Field key={key} id={`site-${key}`} label={t(`socials.${key}`)} error={errors[key]?.message}>
          <Input id={`site-${key}`} type="url" placeholder="https://" maxLength={300} {...register(key)} />
        </Field>
      ))}
      <SaveButton pending={update.isPending} />
    </form>
  )
}

function AboutForm({ initial }: { initial: string }) {
  const { t } = useTranslation()
  const update = useUpdateSite()
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AboutValues>({ resolver: zodResolver(aboutSchema), defaultValues: { about: initial } })
  const about = useWatch({ control, name: 'about' })
  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        update.mutate(values, { onSuccess: () => pushToast('success', t('adminSite.saved')) }),
      )}
      className="flex flex-col gap-4"
    >
      {update.error && <FormError error={update.error} />}
      <div>
        <Tabs
          label={t('adminSite.about')}
          value={mode}
          onChange={setMode}
          items={[
            { id: 'edit', label: t('adminNews.write') },
            { id: 'preview', label: t('adminNews.preview') },
          ]}
        />
        <TabPanel id={`about-${mode}`}>
          {mode === 'edit' ? (
            <Field id="site-about" label={t('adminSite.about')} hint={t('adminNews.bodyHint')} error={errors.about?.message}>
              <Textarea id="site-about" rows={12} className="font-mono text-sm" {...register('about')} />
            </Field>
          ) : about.trim() ? (
            <Markdown className="rounded-2xl border-2 border-slate-100 p-5">{about}</Markdown>
          ) : (
            <p className="text-slate-500">{t('adminNews.previewEmpty')}</p>
          )}
        </TabPanel>
      </div>
      <SaveButton pending={update.isPending} />
    </form>
  )
}

export function AdminSitePage() {
  const { t } = useTranslation()
  const query = useAdminSite()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t('adminSite.title')}</h1>
        <p className="text-slate-600">{t('adminSite.subtitle')}</p>
      </div>
      <QueryState query={query}>
        {(site) => (
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="flex flex-col gap-4">
                <h2 className="text-lg font-bold">{t('adminSite.contacts')}</h2>
                <ContactsForm initial={site.contacts} />
              </Card>
              <Card className="flex flex-col gap-4">
                <h2 className="text-lg font-bold">{t('footer.socials')}</h2>
                <SocialsForm initial={site.socials} />
              </Card>
            </div>
            <Card className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">{t('adminSite.about')}</h2>
              <AboutForm initial={site.about} />
            </Card>
          </div>
        )}
      </QueryState>
    </div>
  )
}
