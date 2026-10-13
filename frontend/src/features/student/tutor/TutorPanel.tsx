import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAiUsage } from '@/api/ai'
import type { ConversationDetail } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { FormError } from '@/components/ui/FormError'
import { Spinner } from '@/components/ui/Spinner'
import { cx } from '@/lib/cx'
import { plainText } from '@/lib/plainText'
import { MAX_MESSAGE_CHARS, useTutorChat, type TutorMessage } from './useTutorChat'

interface TutorPanelProps {
  /** Mavzu konteksti (pleyerda) yoki `null` (umumiy suhbat). */
  topicId: number | null
  /** Mavjud suhbatni davom ettirish (`/app/tutor`). */
  initial?: ConversationDetail
  onNew?: () => void
}

/** Repetitor oynasi: xabarlar, rejim belgisi, manbalar va yuborish formasi. Balandlikni ota-ona beradi. */
export function TutorPanel({ topicId, initial, onNew }: TutorPanelProps) {
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
      <div className="flex items-center gap-2 border-b-2 border-slate-100 px-4 py-3">
        <h2 className="min-w-0 flex-1 truncate font-bold">
          <span aria-hidden="true">🤖 </span>
          {t('tutor.title')}
        </h2>
        {limit !== null && <span className="text-xs text-slate-500">{t('tutor.usage', { used, limit })}</span>}
        {chat.messages.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              chat.reset()
              onNew?.()
            }}
          >
            {t('tutor.new')}
          </Button>
        )}
      </div>
      <div
        role="log"
        aria-live="polite"
        aria-label={t('tutor.title')}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3"
      >
        {chat.messages.length === 0 ? (
          <p className="text-sm text-slate-500">{t('tutor.empty')}</p>
        ) : (
          chat.messages.map((message) => <MessageBubble key={message.key} message={message} />)
        )}
        <div ref={endRef} />
      </div>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2 border-t-2 border-slate-100 p-3">
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
    <div className={cx('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      {message.mode === 'hint' && <Badge tone="amber">{t('tutor.modeHint')}</Badge>}
      {message.mode === 'refusal' && <Badge tone="slate">{t('tutor.modeRefusal')}</Badge>}
      <div
        className={cx(
          'max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm',
          mine ? 'bg-brand-50 text-slate-900' : 'border-2 border-slate-100 bg-white',
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
        <div className="max-w-[90%] text-xs text-slate-500">
          <p className="font-semibold">{t('tutor.sources')}</p>
          <ul>
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
  )
}
