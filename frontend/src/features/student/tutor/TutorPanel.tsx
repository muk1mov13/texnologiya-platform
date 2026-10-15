import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiUsage } from '@/api/ai'
import type { ConversationDetail } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Spinner } from '@/components/ui/Spinner'
import { cx, FOCUS_RING } from '@/lib/cx'
import { plainText } from '@/lib/plainText'
import { MAX_MESSAGE_CHARS, useTutorChat, type TutorMessage } from './useTutorChat'

interface TutorPanelProps {
  /** Mavzu konteksti (pleyerda) yoki `null` (umumiy suhbat). */
  topicId: number | null
  /** Mavjud suhbatni davom ettirish (`/app/tutor`). */
  initial?: ConversationDetail
  onNew?: () => void
  /** Bo'sh suhbatda ko'rsatiladigan namuna savollar (bosilsa darhol yuboriladi). */
  suggestions?: string[]
}

/** Repetitor oynasi: xabarlar, rejim belgisi, manbalar va yuborish formasi. Balandlikni ota-ona beradi. */
export function TutorPanel({ topicId, initial, onNew, suggestions = [] }: TutorPanelProps) {
  const { t } = useTranslation()
  const usage = useAiUsage()
  const chat = useTutorChat(topicId, initial)
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const lastContent = chat.messages.at(-1)?.content

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [chat.messages.length, lastContent])

  const limit = usage.data?.limit ?? null
  const used = usage.data?.used ?? 0
  const exhausted = limit !== null && used >= limit

  const submit = () => {
    if (!draft.trim() || chat.pending || exhausted) return
    void chat.send(draft)
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white/60 px-4 py-3 backdrop-blur">
        <TutorAvatar />
        <h2 className="min-w-0 flex-1 truncate font-bold tracking-tight text-slate-900">{t('tutor.title')}</h2>
        {limit !== null && (
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 tabular-nums">
            {t('tutor.usage', { used, limit })}
          </span>
        )}
        {chat.messages.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              chat.reset()
              onNew?.()
            }}
          >
            <Icon name="plus" className="size-4" />
            {t('tutor.new')}
          </Button>
        )}
      </div>
      <div
        role="log"
        aria-live="polite"
        aria-label={t('tutor.title')}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/60 px-4 py-4"
      >
        {chat.messages.length === 0 ? (
          <div className="m-auto flex max-w-sm flex-col items-center gap-3 py-6 text-center">
            <span
              aria-hidden="true"
              className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-700 ring-1 ring-brand-200/70"
            >
              <Icon name="sparkles" className="size-6" />
            </span>
            <p className="text-sm text-pretty text-slate-600">{t('tutor.empty')}</p>
            {suggestions.length > 0 && (
              <div className="mt-2 flex w-full flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500">{t('tutor.suggestionsTitle')}</p>
                {suggestions.map((text) => (
                  <button
                    key={text}
                    type="button"
                    disabled={chat.pending || exhausted}
                    onClick={() => void chat.send(text)}
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
            )}
          </div>
        ) : (
          chat.messages.map((message) => <MessageBubble key={message.key} message={message} />)
        )}
        <div ref={endRef} />
      </div>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-slate-200/70 bg-white p-3">
        {chat.error !== null && <FormError error={chat.error} />}
        {exhausted && (
          <p role="status" className="text-sm text-amber-800">
            {t('errors.AI_LIMIT_REACHED')}
          </p>
        )}
        <Textarea
          rows={2}
          value={draft}
          maxLength={MAX_MESSAGE_CHARS}
          disabled={exhausted}
          aria-label={t('tutor.placeholder')}
          placeholder={t('tutor.placeholder')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button type="submit" size="sm" className="self-end" loading={chat.pending} disabled={exhausted || !draft.trim()}>
          {!chat.pending && <Icon name="send" className="size-4" />}
          {t('tutor.send')}
        </Button>
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: TutorMessage }) {
  const { t } = useTranslation()
  const mine = message.role === 'user'
  return (
    <div className={cx('flex gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
      {!mine && <TutorAvatar small />}
      <div className={cx('flex min-w-0 flex-1 flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      {message.mode === 'hint' && <Badge tone="amber">{t('tutor.modeHint')}</Badge>}
      {message.mode === 'refusal' && <Badge tone="slate">{t('tutor.modeRefusal')}</Badge>}
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
            {t('tutor.thinking')}
          </span>
        ) : (
          plainText(message.content)
        )}
      </div>
      {message.citations.length > 0 && (
        <div className="max-w-[92%] rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200/60">
          <p className="font-semibold text-slate-600">{t('tutor.sources')}</p>
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {message.citations.map((citation) => (
              <li key={citation.n}>
                [{citation.n}] {citation.title}
                {citation.page !== null && `, ${t('tutor.page', { page: citation.page })}`}
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  )
}

function TutorAvatar({ small = false }: { small?: boolean }) {
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
