import { m } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router'
import { useEditorTopic, useTeachSubjects } from '@/api/teach'
import type { StepKind, TopicEditor } from '@/api/types'
import { Icon } from '@/components/icons/Icon'
import type { IconName } from '@/components/icons/paths'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/button-classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { PageHeader } from '@/features/admin/ui/PageHeader'
import { Panel } from '@/features/admin/ui/Panel'
import { cx, FOCUS_RING } from '@/lib/cx'
import { EASE_OUT } from '@/lib/motion'
import { ACTIVITY_KINDS, FILE_KINDS, isStepKind } from '@/lib/steps'
import { AiDraftsSection } from './ai/AiDraftsSection'
import { ActivitiesTab } from './assessment/ActivitiesTab'
import { TaskTab } from './assessment/TaskTab'
import { GlossaryTab } from './GlossaryTab'
import { LiteratureTab } from './LiteratureTab'
import { MaterialsTab } from './MaterialsTab'
import { StepNav } from './StepNav'
import { TopicDetailsForm } from './TopicDetailsForm'

/** Tab yonidagi son; faoliyat bosqichlari uchun `null` (ro'yxat alohida so'rov bilan keladi). */
function itemCount(topic: TopicEditor, kind: StepKind): number | null {
  if (ACTIVITY_KINDS.has(kind)) return null
  if (kind === 'glossary') return topic.glossary.length
  if (kind === 'literature') return topic.literature.length
  return topic.steps.find((step) => step.kind === kind)?.materials.length ?? 0
}

export function TopicEditorPage() {
  const { t } = useTranslation()
  const topicId = Number(useParams().topicId)
  const topic = useEditorTopic(topicId)
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: StepKind = isStepKind(tabParam) ? tabParam : 'lecture'

  // Noto'g'ri ID'da so'rov o'chiq (`enabled: false`) — QueryState spinnerni abadiy aylantirmasin.
  if (!Number.isInteger(topicId) || topicId <= 0) return <EmptyState icon="🧭" title={t('notFound.title')} />

  return (
    <QueryState query={topic}>
      {(data) => {
        const step = data.steps.find((item) => item.kind === tab)
        return (
          <div className="flex flex-col gap-6">
            <EditorHeader topic={data} />
            <TopicDetailsForm key={data.id} topic={data} />
            <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <StepNav
                value={tab}
                onChange={(next) => setSearchParams({ tab: next }, { replace: true })}
                countOf={(kind) => itemCount(data, kind)}
              />
              <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="min-w-0">
                <Panel title={t(`steps.${tab}`)} description={t(`teach.stepHints.${tab}`)}>
                  <m.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                  >
                    {step && <AiDraftsSection key={`ai-${step.id}`} topic={data} step={step} />}
                    {FILE_KINDS.has(tab) && step ? (
                      <MaterialsTab topicId={data.id} step={step} />
                    ) : tab === 'glossary' ? (
                      <GlossaryTab topicId={data.id} items={data.glossary} />
                    ) : tab === 'literature' ? (
                      <LiteratureTab topicId={data.id} items={data.literature} />
                    ) : ACTIVITY_KINDS.has(tab) && step ? (
                      <ActivitiesTab key={step.id} topicId={data.id} stepId={step.id} />
                    ) : tab === 'task' && step ? (
                      <TaskTab topicId={data.id} stepId={step.id} />
                    ) : (
                      <EmptyState icon="🛠️" title={t('teach.comingSoon')} text={t('teach.comingSoonText')} />
                    )}
                  </m.div>
                </Panel>
              </div>
            </div>
          </div>
        )
      }}
    </QueryState>
  )
}

/**
 * Muharrir sarlavhasi: fan nomi, mavzu nomi, turi va holati; mavzular orasida o'tish va talaba
 * ko'rinishi. Fan ma'lumoti `useTeachSubjects` keshidan olinadi (mavzular sahifasi bilan umumiy).
 */
function EditorHeader({ topic }: { topic: TopicEditor }) {
  const { t } = useTranslation()
  const subjects = useTeachSubjects()
  const subject = subjects.data?.find((item) => item.id === topic.subject_id)
  const topics = subject ? [...subject.topics].sort((a, b) => a.order - b.order) : []
  const index = topics.findIndex((item) => item.id === topic.id)
  const prev = index > 0 ? topics[index - 1] : undefined
  const next = index >= 0 ? topics[index + 1] : undefined

  return (
    <div className="flex flex-col gap-4">
      <Link
        to={`/teach?subject=${topic.subject_id}`}
        className={cx(
          'inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-semibold text-slate-500 transition-colors hover:text-brand-700 motion-reduce:transition-none',
          FOCUS_RING,
        )}
      >
        <Icon name="arrowLeft" className="size-4" />
        {t('teach.backToTopics')}
      </Link>
      <PageHeader
        icon="pencil"
        eyebrow={subject?.title ?? t('navGroups.learning')}
        title={topic.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span>{t(`lessonType.${topic.lesson_type}`)}</span>
            {index >= 0 && (
              <span className="text-slate-500 tabular-nums">
                {t('teach.topicPosition', { index: index + 1, total: topics.length })}
              </span>
            )}
            <Badge dot tone={topic.is_published ? 'green' : 'amber'}>
              {topic.is_published ? t('common.published') : t('common.draft')}
            </Badge>
          </span>
        }
        actions={
          <>
            {topic.is_published && (
              <Link
                to={`/app/topics/${topic.id}`}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses('secondary', 'sm')}
              >
                <Icon name="eye" className="size-4" />
                {t('teach.studentView')}
              </Link>
            )}
            {topics.length > 1 && (
              <div className="flex items-center rounded-xl bg-white p-0.5 shadow-soft ring-1 ring-slate-200">
                <TopicStepLink to={prev?.id} icon="arrowLeft" label={t('teach.prevTopic')} />
                <span aria-hidden="true" className="h-5 w-px bg-slate-200" />
                <TopicStepLink to={next?.id} icon="arrowRight" label={t('teach.nextTopic')} />
              </div>
            )}
          </>
        }
      />
    </div>
  )
}

/** Qo'shni mavzuga ikonka-havola; qo'shni yo'q bo'lsa — o'chiq ko'rinish. */
function TopicStepLink({ to, icon, label }: { to: number | undefined; icon: IconName; label: string }) {
  const base = 'grid size-8 place-items-center rounded-lg'
  if (to === undefined) {
    return (
      <span aria-hidden="true" className={cx(base, 'text-slate-300')}>
        <Icon name={icon} className="size-4" />
      </span>
    )
  }
  return (
    <Link
      to={`/teach/topics/${to}`}
      aria-label={label}
      title={label}
      className={cx(
        base,
        'text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700 motion-reduce:transition-none',
        FOCUS_RING,
      )}
    >
      <Icon name={icon} className="size-4" />
    </Link>
  )
}
