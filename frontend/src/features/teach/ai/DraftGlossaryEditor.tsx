import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GlossaryIn } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { FormError } from '@/components/ui/FormError'
import { GlossaryForm } from '../GlossaryTab'

interface Row extends GlossaryIn {
  key: number
}

interface DraftGlossaryEditorProps {
  items: GlossaryIn[]
  pending: boolean
  error: unknown
  onSave: (items: GlossaryIn[]) => void
  onCancel: () => void
}

/** Glossariy qoralamasi: atamalar lokal tahrirlanadi va "Saqlash" bilan qoralamaga yoziladi. */
export function DraftGlossaryEditor({ items, pending, error, onSave, onCancel }: DraftGlossaryEditorProps) {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Row[]>(() => items.map((item, index) => ({ ...item, key: index })))
  const [editingKey, setEditingKey] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.key} className="rounded-xl border-2 border-slate-100 p-3">
            {editingKey === row.key ? (
              <GlossaryForm
                idPrefix={`draft-term-${row.key}`}
                initial={row}
                submitLabel={t('common.save')}
                pending={false}
                onSubmit={(values) => {
                  setRows((list) => list.map((item) => (item.key === row.key ? { ...item, ...values } : item)))
                  setEditingKey(null)
                }}
                onCancel={() => setEditingKey(null)}
              />
            ) : (
              <div className="flex flex-wrap items-start gap-2">
                <p className="flex-1 text-sm">
                  <span className="font-semibold">{row.term}</span> — {row.definition}
                </p>
                <Button size="sm" variant="ghost" onClick={() => setEditingKey(row.key)}>
                  {t('common.edit')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRows((list) => list.filter((item) => item.key !== row.key))}
                >
                  {t('common.delete')}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {error !== null && <FormError error={error} />}
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={pending}
          disabled={rows.length === 0 || editingKey !== null}
          onClick={() => onSave(rows.map(({ term, definition }) => ({ term, definition })))}
        >
          {t('common.save')}
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
