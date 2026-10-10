import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSetTeachers } from '@/api/admin'
import type { SubjectAdmin, User } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { pushToast } from '@/components/ui/toast-store'

interface TeachersModalProps {
  subject: SubjectAdmin | null
  teachers: User[]
  onClose: () => void
}

export function TeachersModal({ subject, teachers, onClose }: TeachersModalProps) {
  const { t } = useTranslation()
  return (
    <Modal open={subject !== null} title={t('admin.subjects.teachersTitle', { title: subject?.title ?? '' })} onClose={onClose}>
      {subject && <TeachersForm key={subject.id} subject={subject} teachers={teachers} onDone={onClose} />}
    </Modal>
  )
}

function TeachersForm({ subject, teachers, onDone }: { subject: SubjectAdmin; teachers: User[]; onDone: () => void }) {
  const { t } = useTranslation()
  const setTeachers = useSetTeachers()
  const [selected, setSelected] = useState<Set<number>>(() => new Set(subject.teacher_ids))

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function save() {
    setTeachers.mutate(
      { id: subject.id, teacherIds: [...selected] },
      {
        onSuccess: () => {
          pushToast('success', t('admin.subjects.saved'))
          onDone()
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {teachers.length === 0 ? (
        <p className="text-slate-600">{t('admin.subjects.noTeachers')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {teachers.map((teacher) => (
            <li key={teacher.id}>
              <Checkbox
                label={teacher.full_name}
                checked={selected.has(teacher.id)}
                onChange={() => toggle(teacher.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button loading={setTeachers.isPending} onClick={save}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}
