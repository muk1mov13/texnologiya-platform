import { AnimatePresence, m } from 'motion/react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useCurrentUser } from '@/api/auth'
import { useFaq } from '@/api/cms'
import type { SupportLang } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Spinner } from '@/components/ui/Spinner'
import { cx, FOCUS_RING } from '@/lib/cx'
import { EASE_OUT } from '@/lib/motion'
import { plainText } from '@/lib/plainText'
import { citationUrl, splitLinks } from './links'
import { MAX_SUPPORT_CHARS, useSupportChat, type SupportChatMessage } from './useSupportChat'

const SUGGESTION_COUNT = 3
/** Tailwind `sm` dan kichik ekran (oyna to'liq ekranli). */
const PHONE_QUERY = '(max-width: 639.98px)'

/**
 * Ochiq saytdagi AI yordamchi: o'ng pastdagi tugma va suhbat oynasi (telefonda to'liq ekran).
 * Ko'rsatish shartini (`/api/ai/support/status`) `PublicLayout` tekshiradi.
 */
export function SupportWidget() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const titleId = useId()
  const launcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        launcherRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    // Telefonda oyna to'liq ekran: orqadagi sahifa aylanmasin.
    const phone = window.matchMedia?.(PHONE_QUERY).matches ?? false
    const previous = document.body.style.overflow
    if (phone) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      if (phone) document.body.style.overflow = previous
    }
  }, [open])

  const close = () => {
    setOpen(false)
    launcherRef.current?.focus()
  }
  const lang: SupportLang = i18n.language.startsWith('ru') ? 'ru' : 'uz'

  return (
    <>
      <AnimatePresence>
        {open && (
          <m.div
            key="panel"
            id={panelId}
            role="dialog"
            aria-labelledby={titleId}
            className={cx(
              'fixed inset-0 z-50 flex flex-col overflow-hidden bg-white',
              'sm:inset-auto sm:right-5 sm:bottom-24 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-[380px] sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-slate-200/80',
            )}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            style={{ transformOrigin: 'bottom right' }}
          >
            <SupportPanel lang={lang} titleId={titleId} onClose={close} />
          </m.div>
        )}
      </AnimatePresence>
      <button
        ref={launcherRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t(open ? 'support.close' : 'support.open')}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          'fixed right-4 bottom-4 z-50 items-center gap-2 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-glow sm:right-5 sm:bottom-5',
          'transition hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          open ? 'hidden sm:inline-flex' : 'inline-flex sm:py-3 sm:pr-5 sm:pl-4',
          FOCUS_RING,
        )}
      >
        <Icon name={open ? 'close' : 'sparkles'} className="size-6" />
        {!open && <span className="hidden text-sm font-semibold sm:inline">{t('support.launcher')}</span>}
      </button>
    </>
  )
}

interface SupportPanelProps {
  lang: SupportLang
  titleId: string
  onClose: () => void
}

function SupportPanel({ lang, titleId, onClose }: SupportPanelProps) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const faq = useFaq()
  const chat = useSupportChat(lang)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const lastContent = chat.messages.at(-1)?.content

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [chat.messages.length, lastContent])

  const fromFaq = (faq.data ?? []).slice(0, SUGGESTION_COUNT).map((item) => item.question)
  const suggestions = fromFaq.length > 0 ? fromFaq : [t('support.suggestion1'), t('support.suggestion2'), t('support.suggestion3')]
  const isStudent = user?.role === 'student' && user.status === 'active'

  const ask = (text: string) => {
    chat.send(text).catch(() => setDraft(text))
  }
  const submit = () => {
    if (!draft.trim() || chat.pending) return
    ask(draft)
    setDraft('')
  }
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-200/70 bg-gradient-to-r from-brand-50 to-white px-4 py-3">
        <SupportAvatar />
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate font-bold tracking-tight text-slate-900">
            {t('support.title')}
          </h2>
          <p className="truncate text-xs text-slate-500">{t('support.subtitle')}</p>
        </div>
        {chat.messages.length > 0 && (
          <button
            type="button"
            onClick={chat.reset}
            aria-label={t('support.new')}
            title={t('support.new')}
            className={cx('grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800', FOCUS_RING)}
          >
            <Icon name="refresh" className="size-4.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('support.close')}
          className={cx('grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800', FOCUS_RING)}
        >
          <Icon name="close" className="size-5" />
        </button>
      </div>
      <div
        role="log"
        aria-live="polite"
        aria-label={t('support.title')}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/60 px-4 py-4"
      >
        {chat.messages.length === 0 ? (
          <div className="my-auto flex flex-col gap-3">
            <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-700 shadow-soft ring-1 ring-slate-200/70">
              {t('support.greeting')}
            </div>
            {isStudent && (
              <Link
                to="/app/tutor"
                onClick={onClose}
                className={cx(
                  'flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 ring-1 ring-brand-200/70 hover:bg-brand-100',
                  FOCUS_RING,
                )}
              >
                <Icon name="chat" className="size-4" />
                {t('support.tutorLink')}
              </Link>
            )}
            <p className="mt-1 text-xs font-semibold text-slate-500">{t('support.suggestionsTitle')}</p>
            {suggestions.map((text) => (
              <button
                key={text}
                type="button"
                disabled={chat.pending}
                onClick={() => ask(text)}
                className={cx(
                  'rounded-xl bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-soft ring-1 ring-slate-200/70',
                  'transition hover:text-brand-800 hover:ring-brand-300 disabled:opacity-60 motion-reduce:transition-none',
                  FOCUS_RING,
                )}
              >
                {text}
              </button>
            ))}
          </div>
        ) : (
          chat.messages.map((message) => <SupportBubble key={message.key} message={message} onNavigate={onClose} />)
        )}
        <div ref={endRef} />
      </div>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-slate-200/70 bg-white p-3">
        {chat.error !== null && <FormError error={chat.error} />}
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MAX_SUPPORT_CHARS}
            aria-label={t('support.placeholder')}
            placeholder={t('support.placeholder')}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            className="max-h-32 min-h-11 flex-1 resize-none!"
          />
          <Button type="submit" size="sm" className="h-11 shrink-0" loading={chat.pending} disabled={!draft.trim()} aria-label={t('support.send')}>
            {!chat.pending && <Icon name="send" className="size-4" />}
          </Button>
        </div>
        <p className="text-[11px] leading-snug text-slate-400">{t('support.disclaimer')}</p>
      </form>
    </>
  )
}

function SupportBubble({ message, onNavigate }: { message: SupportChatMessage; onNavigate: () => void }) {
  const { t } = useTranslation()
  const mine = message.role === 'user'
  const sources = message.citations.flatMap((citation) => {
    const href = citationUrl(citation)
    return href ? [{ ...citation, href }] : []
  })
  return (
    <div className={cx('flex gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
      {!mine && <SupportAvatar small />}
      <div className={cx('flex min-w-0 flex-1 flex-col gap-1', mine ? 'items-end' : 'items-start')}>
        <div
          className={cx(
            'max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap',
            mine
              ? 'rounded-br-md bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-glow-sm'
              : 'rounded-bl-md bg-white text-slate-800 shadow-soft ring-1 ring-slate-200/70',
          )}
        >
          {message.streaming && !message.content ? (
            <span className="inline-flex items-center gap-2 text-slate-500">
              <Spinner size="sm" decorative />
              {t('support.thinking')}
            </span>
          ) : mine ? (
            message.content
          ) : (
            splitLinks(plainText(message.content)).map((part, i) =>
              part.kind === 'text' ? (
                <span key={i}>{part.text}</span>
              ) : (
                <Link
                  key={i}
                  to={part.to}
                  onClick={onNavigate}
                  className={cx('font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900', FOCUS_RING)}
                >
                  {t(`nav.${part.to.slice(1)}`)}
                </Link>
              ),
            )
          )}
        </div>
        {sources.length > 0 && (
          <div className="max-w-[92%] rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200/60">
            <p className="font-semibold text-slate-600">{t('support.sources')}</p>
            <ul className="mt-0.5 flex flex-col gap-0.5">
              {sources.map((source) => (
                <li key={source.n}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cx('inline-flex items-center gap-1 hover:text-brand-800', FOCUS_RING)}
                  >
                    [{source.n}] {source.title}
                    {source.page !== null && `, ${t('tutor.page', { page: source.page })}`}
                    <Icon name="externalLink" className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function SupportAvatar({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid shrink-0 place-items-center bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow-sm',
        small ? 'mt-0.5 size-7 rounded-lg' : 'size-9 rounded-xl',
      )}
    >
      <Icon name="sparkles" className={small ? 'size-3.5' : 'size-4.5'} />
    </span>
  )
}
