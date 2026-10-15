import { zodResolver } from '@hookform/resolvers/zod'
import { m } from 'motion/react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useSendContact, useSite } from '@/api/cms'
import type { SiteSocials } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { SURFACE } from '@/components/ui/styles'
import { cx } from '@/lib/cx'
import { EASE_OUT } from '@/lib/motion'
import { usePageMeta } from '@/lib/usePageMeta'
import { ContactDetails } from './ContactDetails'
import { hasAnyContact } from './contacts'
import { PageHero } from './PageHero'
import { contactSchema, type ContactValues } from './schemas'

const EMPTY: ContactValues = { name: '', contact: '', message: '', website: '' }
const SOCIALS: (keyof SiteSocials)[] = ['telegram', 'instagram', 'facebook', 'youtube']

/** Chap to'q panel: kontaktlar va ijtimoiy tarmoqlar (bo'lmasa — faqat qisqa izoh). */
function InfoPanel() {
  const { t } = useTranslation()
  const site = useSite().data
  const contacts = site?.contacts
  const socials = site ? SOCIALS.filter((key) => site.socials[key]) : []
  return (
    <aside className="relative isolate order-last flex flex-col gap-8 overflow-hidden rounded-3xl bg-brand-950 p-6 text-white sm:p-8 lg:order-first lg:p-10">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-20 size-72 rounded-full bg-brand-500/35 blur-3xl" />
        <div className="absolute -right-24 -bottom-28 size-80 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-60 invert [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-balance">{t('contact.info')}</h2>
        <p className="leading-relaxed text-pretty text-brand-100/75">{t('contact.infoText')}</p>
      </div>
      {hasAnyContact(contacts) && <ContactDetails contacts={contacts} tone="dark" />}
      {socials.length > 0 && (
        <ul aria-label={t('footer.socials')} className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-6">
          {socials.map((key) => (
            <li key={key}>
              <a
                href={site?.socials[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(`socials.${key}`)}
                className={cx(
                  'grid size-11 place-items-center rounded-xl bg-white/10 text-brand-100 ring-1 ring-white/15 transition',
                  'hover:-translate-y-0.5 hover:bg-white hover:text-brand-900 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300',
                )}
              >
                <Icon name={key} className="size-5" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

function SentState({ onAgain }: { onAgain: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-10 text-center">
      <m.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow"
      >
        <Icon name="check" className="size-8" strokeWidth={2.4} />
      </m.span>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('contact.sent')}</h2>
      <p className="max-w-sm text-pretty text-slate-600">{t('contact.sentText')}</p>
      <Button variant="secondary" size="sm" onClick={onAgain}>
        {t('contact.again')}
      </Button>
    </div>
  )
}

export function ContactPage() {
  const { t } = useTranslation()
  const send = useSendContact()
  usePageMeta(t('contact.title'), t('contact.description'))
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: EMPTY })

  const submit = handleSubmit((values) => send.mutate(values, { onSuccess: () => reset(EMPTY) }))

  return (
    <div className="flex flex-col gap-10 pb-8">
      <PageHero eyebrow={t('contact.eyebrow')} icon="send" title={t('contact.title')} subtitle={t('contact.description')} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <InfoPanel />
        <section aria-label={t('contact.formTitle')} className={cx(SURFACE, 'p-6 sm:p-8 lg:p-10')}>
          {send.isSuccess ? (
            <SentState onAgain={() => send.reset()} />
          ) : (
            <form noValidate onSubmit={submit} className="relative flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {t('contact.formTitle')}
                </h2>
                <p className="text-sm text-slate-500">{t('contact.formHint')}</p>
              </div>
              {send.error && <FormError error={send.error} />}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="contact-name" label={t('contact.name')} error={errors.name?.message}>
                  <Input id="contact-name" icon="user" autoComplete="name" maxLength={150} {...register('name')} />
                </Field>
                <Field
                  id="contact-contact"
                  label={t('contact.contact')}
                  hint={t('contact.contactHint')}
                  error={errors.contact?.message}
                >
                  <Input id="contact-contact" icon="mail" autoComplete="email" maxLength={150} {...register('contact')} />
                </Field>
              </div>
              <Field id="contact-message" label={t('contact.message')} error={errors.message?.message}>
                <Textarea id="contact-message" rows={7} maxLength={5000} {...register('message')} />
              </Field>
              {/* Honeypot: odam ko'rmaydi va to'ldirmaydi; bot to'ldirsa backend xabarni jim tashlaydi. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="contact-website">{t('contact.website')}</label>
                <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
              </div>
              <Button type="submit" loading={send.isPending} className="self-start">
                <Icon name="send" className="size-4" />
                {t('contact.submit')}
              </Button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
