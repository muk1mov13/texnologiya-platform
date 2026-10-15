import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useTeachSubjects } from "@/api/teach";
import { useTeachStats } from "@/api/teachAssessment";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { QueryState } from "@/components/ui/QueryState";
import { PageHeader } from "@/features/admin/ui/PageHeader";
import { Panel } from "@/features/admin/ui/Panel";
import { StatCard } from "@/features/admin/ui/StatCard";
import { percent, summarize } from "./statsSummary";

/** O'qituvchi statistikasi: tanlangan fan mavzulari bo'yicha talabalar faolligi va natijasi. */
export function StatsPage() {
  const { t } = useTranslation();
  const subjects = useTeachSubjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const list = subjects.data ?? [];
  // Tanlangan fan manzilda saqlanadi; noto'g'ri yoki yo'q bo'lsa, birinchi fan olinadi.
  const subject =
    list.find((item) => String(item.id) === searchParams.get("subject")) ??
    list[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="chart"
        eyebrow={t("navGroups.learning")}
        title={t("stats.title")}
        subtitle={
          subject && list.length === 1 ? subject.title : t("stats.subtitle")
        }
        actions={
          subject &&
          list.length > 1 && (
            <div className="w-full sm:w-64">
              <label htmlFor="stats-subject" className="sr-only">
                {t("stats.subject")}
              </label>
              <Select
                id="stats-subject"
                value={subject.id}
                onChange={(event) =>
                  setSearchParams(
                    { subject: event.target.value },
                    { replace: true },
                  )
                }
              >
                {list.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </div>
          )
        }
      />
      <QueryState query={subjects}>
        {(data) =>
          data.length === 0 || !subject ? (
            <EmptyState
              icon="🧑‍🏫"
              title={t("teach.noSubjects")}
              text={t("teach.noSubjectsText")}
            />
          ) : (
            <SubjectStats key={subject.id} subjectId={subject.id} />
          )
        }
      </QueryState>
    </div>
  );
}

function SubjectStats({ subjectId }: { subjectId: number }) {
  const { t } = useTranslation();
  const stats = useTeachStats(subjectId);
  const summary = stats.data ? summarize(stats.data) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon="users"
          label={t("stats.kpi.students")}
          hint={t("stats.kpi.studentsHint")}
          value={summary?.activeStudents}
        />
        <StatCard
          icon="target"
          label={t("stats.kpi.completion")}
          hint={t("stats.kpi.completionHint")}
          value={summary && percent(summary.completionRate)}
        />
        <StatCard
          icon="trophy"
          label={t("stats.kpi.score")}
          hint={t("stats.kpi.scoreHint")}
          value={summary && percent(summary.avgScore)}
        />
        <StatCard
          icon="clipboard"
          tone={summary?.pending ? "amber" : "brand"}
          label={t("stats.kpi.pending")}
          value={summary?.pending}
          to={summary?.pending ? "/teach/review" : undefined}
        />
      </div>
      <Panel flush title={t("stats.topicsTitle")}>
        <QueryState query={stats}>
          {(rows) =>
            rows.length === 0 ? (
              <p className="px-5 py-6 text-slate-500 sm:px-6">
                {t("stats.empty")}
              </p>
            ) : (
              // Telefon ekranida jadval sahifani emas, faqat o'z konteynerini suradi.
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead className="border-b border-slate-100 text-slate-500">
                    <tr>
                      <th
                        scope="col"
                        className="px-5 py-3 font-semibold sm:px-6"
                      >
                        {t("stats.topic")}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-right font-semibold"
                      >
                        {t("stats.started")}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-right font-semibold"
                      >
                        {t("stats.completed")}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-right font-semibold"
                      >
                        {t("stats.avg")}
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3 text-right font-semibold sm:px-6"
                      >
                        {t("stats.pending")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.topic_id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <th
                          scope="row"
                          className="px-5 py-3 font-semibold sm:px-6"
                        >
                          {row.topic_title}
                        </th>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {row.started}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {row.completed}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {percent(row.avg_best_percent)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums sm:px-6">
                          {row.pending_submissions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </QueryState>
      </Panel>
    </div>
  );
}
