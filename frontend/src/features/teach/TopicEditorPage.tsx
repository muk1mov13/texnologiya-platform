import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router'
import { useEditorTopic } from '@/api/teach'
import type { StepKind, TopicEditor } from '@/api/types'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { QueryState } from '@/components/ui/QueryState'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { FILE_KINDS, isStepKind, STEP_ICONS, STEP_KINDS } from '@/lib/steps'
import { MaterialsTab } from './MaterialsTab'
import { TopicDetailsForm } from './TopicDetailsForm'

function itemCount(topic: TopicEditor, kind: StepKind): number {
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
            <Link to="/teach" className="text-sm font-semibold text-brand-700 hover:underline">
              ← {t('teach.backToTopics')}
            </Link>
            <TopicDetailsForm key={data.id} topic={data} />
            <Card className="p-0 sm:p-0">
              <div className="px-4 pt-3 sm:px-5">
                <Tabs
                  label={t('teach.stepsLabel')}
                  value={tab}
                  onChange={(next) => setSearchParams({ tab: next }, { replace: true })}
                  items={STEP_KINDS.map((kind) => {
                    const count = itemCount(data, kind)
                    return {
                      id: kind,
                      label: `${STEP_ICONS[kind]} ${t(`steps.${kind}`)}`,
                      badge: count > 0 ? <span className="rounded-full bg-slate-100 px-1.5 text-xs">{count}</span> : undefined,
                    }
                  })}
                />
              </div>
              <div className="px-4 pb-5 sm:px-5">
                <TabPanel id={tab}>
                  {FILE_KINDS.has(tab) && step ? (
                    <MaterialsTab topicId={data.id} step={step} />
                  ) : (
                    <EmptyState icon="🛠️" title={t('teach.comingSoon')} text={t('teach.comingSoonText')} />
                  )}
                </TabPanel>
              </div>
            </Card>
          </div>
        )
      }}
    </QueryState>
  )
}
