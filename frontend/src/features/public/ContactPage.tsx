import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSendContact, useSite } from '@/api/cms'
import type { SiteContacts } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { usePageMeta } from '@/lib/usePageMeta'
import { contactSchema, type ContactValues } from './schemas'

const EMPTY: ContactValues = { name: '', contact: '', message: '', website: '' }

function ContactInfo({ contacts }: { contacts: SiteContacts }) {
  const { t } = useTranslation()
  return (
    <Card className="flex flex-col gap-3 self-start">
      <h2 className="text-lg font-bold">{t('contact.info')}</h2>
      {contacts.phone && (
        <a href={`tel:${contacts.phone.replace(/[^\d+]/g, '')}`} className="text-slate-700 hover:text-brand-700">
          <span aria-hidden="true">📞 </span>
          {contacts.phone}
        </a>
      )}
      {contacts.email && (
        <a href={`mailto:${contacts.email}`} className="break-all text-slate-700 hover:text-brand-700">
          <span aria-hidden="true">✉️ </span>
          {contacts.email}
        </a>
      )}
      {contacts.address && (
        <p className="text-slate-700">
          <span aria-hidden="true">📍 </span>
          {contacts.address}
        </p>
      )}
      {contacts.hours && (
        <p className="text-slate-700">
          <span aria-hidden="true">🕘 </span>
          {contacts.hours}
        </p>
      )}
    </Card>
  )
}

export function ContactPage() {
  const { t } = useTranslation()
  const send = useSendContact()
  const contacts = useSite().data?.contacts
  const hasContacts = !!contacts && !!(contacts.phone || contacts.email || contacts.address || contacts.hours)
  usePageMeta(t('contact.title'), t('contact.description'))
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: EMPTY })

  const submit = handleSubmit((values) => send.mutate(values, { onSuccess: () => reset(EMPTY) }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">{t('contact.title')}</h1>
        <p className="text-slate-600">{t('contact.description')}</p>
      </div>
      <div className={hasContacts ? 'grid gap-6 lg:grid-cols-[1fr_2fr]' : 'max-w-2xl'}>
        {hasContacts && contacts && <ContactInfo contacts={contacts} />}
        <Card>
          {send.isSuccess ? (
            <div role="status" className="flex flex-col items-start gap-3 py-4">
              <span className="text-4xl" aria-hidden="true">
                ✅
              </span>
              <h2 className="text-lg font-bold">{t('contact.sent')}</h2>
              <p className="text-slate-600">{t('contact.sentText')}</p>
              <Button variant="secondary" size="sm" onClick={() => send.reset()}>
                {t('contact.again')}
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="relative flex flex-col gap-4">
              {send.error && <FormError error={send.error} />}
              <Field id="contact-name" label={t('contact.name')} error={errors.name?.message}>
                <Input id="contact-name" autoComplete="name" maxLength={150} {...register('name')} />
              </Field>
              <Field
                id="contact-contact"
                label={t('contact.contact')}
                hint={t('contact.contactHint')}
                error={errors.contact?.message}
              >
                <Input id="contact-contact" autoComplete="email" maxLength={150} {...register('contact')} />
              </Field>
              <Field id="contact-message" label={t('contact.message')} error={errors.message?.message}>
                <Textarea id="contact-message" rows={6} maxLength={5000} {...register('message')} />
              </Field>
              {/* Honeypot: odam ko'rmaydi va to'ldirmaydi; bot to'ldirsa backend xabarni jim tashlaydi. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="contact-website">{t('contact.website')}</label>
                <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
              </div>
              <Button type="submit" loading={send.isPending} className="self-start">
                {t('contact.submit')}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
