import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActivityView, AttemptAnswer } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { cx, FOCUS_RING } from '@/lib/cx'
import {
  answersFromCells,
  cellKey,
  cellOwners,
  mayTakeApostrophe,
  normalizeCellInput,
  wordCells,
  type CellKey,
} from './crossword'

interface CrosswordPlayerProps {
  activity: ActivityView
  pending: boolean
  onSubmit: (answers: AttemptAnswer[]) => void
}

/**
 * Krossvord: katakli to'r va savollar ro'yxati. To'r ustunlari `minmax(0, 2.5rem)` bilan
 * qisqaradi — telefon kengligida (375px) ham gorizontal scroll bo'lmaydi.
 */
export function CrosswordPlayer({ activity, pending, onSubmit }: CrosswordPlayerProps) {
  const { t } = useTranslation()
  const layout = activity.layout
  const owners = useMemo(() => (layout ? cellOwners(layout) : new Map<CellKey, number[]>()), [layout])
  const [values, setValues] = useState<Map<CellKey, string>>(() => new Map())
  const [active, setActive] = useState(0)
  const inputs = useRef(new Map<CellKey, HTMLInputElement | null>())
  // Bosish oldidan katak allaqachon fokusda bo'lsa, bosish yo'nalishni almashtiradi.
  const pressedWhileFocused = useRef(false)

  if (!layout || layout.words.length === 0) return null
  const words = layout.words
  const activeCells = wordCells(words[active])
  const starts = new Map(words.map((word) => [cellKey(word.row, word.col), word.number]))

  const focusCell = (key: CellKey | undefined) => {
    if (key) inputs.current.get(key)?.focus()
  }

  const setCell = (key: CellKey, value: string) =>
    setValues((previous) => {
      const next = new Map(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })

  function onInput(key: CellKey, raw: string) {
    const previous = values.get(key) ?? ''
    let value = normalizeCellInput(raw)
    let carry = ''
    // "O"/"G" dan keyin apostrof emas, boshqa harf yozildi: u keyingi katakka o'tadi.
    if (mayTakeApostrophe(previous) && value !== `${previous}ʻ` && value !== '') {
      carry = value
      value = previous
    }
    setCell(key, value)
    const position = activeCells.indexOf(key)
    if (carry) {
      const nextKey = activeCells[position + 1]
      if (nextKey) {
        setCell(nextKey, carry)
        focusCell(mayTakeApostrophe(carry) ? nextKey : (activeCells[position + 2] ?? nextKey))
      }
    } else if (value && !mayTakeApostrophe(value)) {
      focusCell(activeCells[position + 1])
    }
  }

  function onKeyDown(key: CellKey, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Backspace' || values.get(key)) return
    const previousKey = activeCells[activeCells.indexOf(key) - 1]
    if (previousKey) {
      event.preventDefault()
      setCell(previousKey, '')
      focusCell(previousKey)
    }
  }

  function onFocus(key: CellKey) {
    const own = owners.get(key) ?? []
    if (!own.includes(active) && own.length > 0) setActive(own[0])
  }

  function onClick(key: CellKey) {
    const own = owners.get(key) ?? []
    if (pressedWhileFocused.current && own.length > 1) setActive(own.find((index) => index !== active) ?? own[0])
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-600">{t('crossword.hint')}</p>
      <div className="w-full">
        <div
          className="mx-auto grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 2.5rem))`, maxWidth: `${layout.cols * 2.6}rem` }}
        >
          {Array.from({ length: layout.rows * layout.cols }, (_, index) => {
            const key = cellKey(Math.floor(index / layout.cols), index % layout.cols)
            const own = owners.get(key)
            if (!own) return <div key={key} aria-hidden="true" />
            const word = words[own[0]]
            const number = starts.get(key)
            return (
              <div key={key} className="relative aspect-square">
                {number !== undefined && (
                  <span className="pointer-events-none absolute top-0 left-0.5 text-[0.6rem] font-bold text-slate-500">
                    {number}
                  </span>
                )}
                <input
                  ref={(element) => {
                    inputs.current.set(key, element)
                  }}
                  value={values.get(key) ?? ''}
                  maxLength={3}
                  autoComplete="off"
                  autoCapitalize="characters"
                  aria-label={t('crossword.cellLabel', {
                    number: word.number,
                    direction: t(`crossword.${word.direction}`),
                    k: wordCells(word).indexOf(key) + 1,
                  })}
                  onPointerDown={(event) => {
                    pressedWhileFocused.current = document.activeElement === event.currentTarget
                  }}
                  onClick={() => onClick(key)}
                  onFocus={() => onFocus(key)}
                  onChange={(event) => onInput(key, event.target.value)}
                  onKeyDown={(event) => onKeyDown(key, event)}
                  className={cx(
                    'size-full rounded-lg border-2 p-0 text-center text-sm font-bold text-slate-900 uppercase shadow-sm outline-none sm:text-base',
                    'transition-colors focus:border-brand-700 focus:bg-white motion-reduce:transition-none',
                    activeCells.includes(key) ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white',
                  )}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['across', 'down'] as const).map((direction) => (
          <section key={direction} className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-200/70">
            <h4 className="mb-2 font-bold tracking-tight text-slate-900">{t(`crossword.${direction}`)}</h4>
            <ol className="flex flex-col gap-1">
              {words.map((word, index) =>
                word.direction === direction ? (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => {
                        setActive(index)
                        focusCell(wordCells(word)[0])
                      }}
                      className={cx(
                        'w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition motion-reduce:transition-none',
                        FOCUS_RING,
                        index === active ? 'bg-brand-50 font-semibold text-brand-900 ring-1 ring-brand-200' : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      {word.number}. {word.clue} ({t('crossword.letters', { count: word.length })})
                    </button>
                  </li>
                ) : null,
              )}
            </ol>
          </section>
        ))}
      </div>
      <div>
        <Button loading={pending} onClick={() => onSubmit(answersFromCells(layout, values))}>
          {t('activity.finish')}
        </Button>
      </div>
    </div>
  )
}
