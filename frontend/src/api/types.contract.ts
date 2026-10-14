// `types.ts` (qo'lda yozilgan) va `schema.gen.ts` (backend OpenAPI'dan generatsiya) mosligi.
// Faqat tiplar: `tsc -b` tekshiradi, runtime'da hech narsa yo'q. Backend sxemasi o'zgarsa,
// `npm run gen:api` dan keyin shu yerda tip xatosi chiqadi va `types.ts` yangilanishi kerak.
import type { components } from './schema.gen'
import type * as T from './types'

type S = components['schemas']

type SameKeys<A, B> = [keyof A] extends [keyof B] ? ([keyof B] extends [keyof A] ? true : false) : false

/**
 * Javob: backend qaytaradigan har qanday qiymat frontend tipiga sig'adi, maydonlar bir xil.
 * Sukut qiymatli maydonlar sxemada ixtiyoriy chiqadi, lekin javobda doim bo'ladi (backend
 * javoblarda `exclude_unset` ishlatmaydi), shuning uchun backend tomoni `Required` qilinadi.
 */
type Receives<Front, Back> =
  SameKeys<Front, Back> extends true ? ([Required<Back>] extends [Front] ? true : false) : false

/** So'rov: frontend yuboradigan har qanday qiymat backend sxemasiga sig'adi, maydonlar bir xil. */
type Sends<Front, Back> = SameKeys<Front, Back> extends true ? ([Front] extends [Back] ? true : false) : false

type Check<Ok extends true> = Ok

export type ResponseContract = [
  Check<Receives<T.User, S['UserOut']>>,
  Check<Receives<T.TokenOut, S['TokenOut']>>,
  Check<Receives<T.TempPasswordOut, S['TempPasswordOut']>>,
  Check<Receives<T.Progress, S['ProgressOut']>>,
  Check<Receives<T.SubjectCard, S['SubjectCard']>>,
  Check<Receives<T.TopicCard, S['TopicCard']>>,
  Check<Receives<T.SubjectDetail, S['SubjectDetailOut']>>,
  Check<Receives<T.StepBrief, S['StepBrief']>>,
  Check<Receives<T.TopicDetail, S['TopicDetailOut']>>,
  Check<Receives<T.MaterialView, S['MaterialView']>>,
  Check<Receives<T.GlossaryTerm, S['GlossaryOut']>>,
  Check<Receives<T.LiteratureItem, S['LiteratureOut']>>,
  Check<Receives<T.StepContent, S['StepContentOut']>>,
  Check<Receives<T.ContinueTarget, S['ContinueOut']>>,
  Check<Receives<T.SubjectProgress, S['SubjectProgressOut']>>,
  Check<Receives<T.Material, S['MaterialOut']>>,
  Check<Receives<T.StepEditor, S['StepEditorOut']>>,
  Check<Receives<T.TopicEditor, S['TopicEditorOut']>>,
  Check<Receives<T.TeachTopicBrief, S['TeachTopicBrief']>>,
  Check<Receives<T.TeachSubject, S['TeachSubjectOut']>>,
  Check<Receives<T.SubjectAdmin, S['SubjectAdminOut']>>,
  Check<Receives<T.Rewards, S['RewardsOut']>>,
  Check<Receives<T.BadgeBrief, S['BadgeBrief']>>,
  Check<Receives<T.StepCompleteResult, S['StepCompleteOut']>>,
  Check<Receives<T.ResultItem, S['ResultItem']>>,
  Check<Receives<T.AttemptResult, S['AttemptOut']>>,
  Check<Receives<T.SubmitResult, S['SubmitOut']>>,
  Check<Receives<T.BadgeView, S['BadgeOut']>>,
  Check<Receives<T.Dashboard, S['DashboardOut']>>,
  Check<Receives<T.ActivityResult, S['ActivityResultOut']>>,
  Check<Receives<T.TaskResult, S['TaskResultOut']>>,
  Check<Receives<T.TopicResults, S['TopicResultsOut']>>,
  Check<Receives<T.SubjectResults, S['SubjectResultsOut']>>,
  Check<Receives<T.AttemptDetail, S['AttemptDetailOut']>>,
  Check<Receives<T.QuizItemOut, S['QuizItemOut']>>,
  Check<Receives<T.YesNoItemOut, S['YesNoItemOut']>>,
  Check<Receives<T.CrosswordItemOut, S['CrosswordItemOut']>>,
  Check<Receives<T.TeachLayoutWord, S['TeachLayoutWord']>>,
  Check<Receives<T.TeachLayout, S['TeachLayout']>>,
  Check<Receives<T.ActivityTeach, S['ActivityTeachOut']>>,
  Check<Receives<T.TaskOut, S['TaskOut']>>,
  Check<Receives<T.SubmissionQueueItem, S['SubmissionQueueItem']>>,
  Check<Receives<T.SubmissionDetail, S['SubmissionDetailOut']>>,
  Check<Receives<T.TopicStats, S['TopicStatsOut']>>,
  Check<Receives<T.ActivityView, S['ActivityView']>>,
  Check<Receives<T.TaskView, S['TaskView']>>,
  Check<Receives<T.SubmissionView, S['SubmissionView']>>,
  Check<Receives<T.StudentLayout, S['StudentLayout']>>,
  Check<Receives<T.Citation, S['Citation']>>,
  Check<Receives<T.ConversationBrief, S['ConversationOut']>>,
  Check<Receives<T.ChatMessageView, S['MessageOut']>>,
  Check<Receives<T.ConversationDetail, S['ConversationDetailOut']>>,
  Check<Receives<T.AiUsageMe, S['UsageOut']>>,
  Check<Receives<T.AiDraft, S['DraftOut']>>,
  Check<Receives<T.AiReport, S['AiReportOut']>>,
  Check<Receives<T.AiSettingsView, S['AiSettingsOut']>>,
  Check<Receives<T.AiUsageDay, S['AiUsageDay']>>,
  Check<Receives<T.AiUsageStats, S['AiUsageOut']>>,
  // Ichma-ich sxemalar alohida tekshiriladi: `Required` faqat yuqori darajaga ta'sir qiladi.
  Check<Receives<T.LibraryDocument, S['DocumentOut']>>,
  Check<Receives<Omit<T.FolderNode, 'documents' | 'children'>, Omit<S['FolderOut'], 'documents' | 'children'>>>,
  Check<Receives<T.FolderAdmin, S['FolderAdminOut']>>,
  Check<Receives<T.Book, S['BookOut']>>,
  Check<Receives<T.BookAdmin, S['BookAdminOut']>>,
  Check<Receives<T.BookPage, S['BookPage']>>,
  Check<Receives<T.NewsCard, S['NewsCard']>>,
  Check<Receives<T.NewsDetail, S['NewsOut']>>,
  Check<Receives<T.NewsAdmin, S['NewsAdminOut']>>,
  Check<Receives<T.NewsPage, S['NewsPage']>>,
  Check<Receives<T.FaqItem, S['FaqOut']>>,
  Check<Receives<T.SiteContacts, S['Contacts']>>,
  Check<Receives<T.SiteSocials, S['Socials']>>,
  Check<Receives<Omit<T.SiteSettings, 'contacts' | 'socials'>, Omit<S['SiteOut'], 'contacts' | 'socials'>>>,
  Check<Receives<T.ContactMessage, S['ContactMessageOut']>>,
]

export type RequestContract = [
  Check<Sends<T.LoginIn, S['LoginIn']>>,
  Check<Sends<T.RegisterIn, S['RegisterIn']>>,
  Check<Sends<T.MeUpdateIn, S['MeUpdateIn']>>,
  Check<Sends<T.PasswordChangeIn, S['PasswordChangeIn']>>,
  Check<Sends<T.AdminUserUpdateIn, S['AdminUserUpdateIn']>>,
  Check<Sends<T.TopicCreate, S['TopicCreate']>>,
  Check<Sends<T.TopicUpdate, S['TopicUpdate']>>,
  Check<Sends<T.GlossaryIn, S['GlossaryIn']>>,
  Check<Sends<Partial<T.GlossaryIn>, S['GlossaryUpdate']>>,
  Check<Sends<T.LiteratureIn, S['LiteratureIn']>>,
  Check<Sends<Partial<T.LiteratureIn>, S['LiteratureUpdate']>>,
  Check<Sends<T.SubjectCreate, S['SubjectCreate']>>,
  Check<Sends<T.SubjectUpdate, S['SubjectUpdate']>>,
  Check<Sends<T.TaskIn, S['TaskIn']>>,
  Check<Sends<T.GradeIn, S['GradeIn']>>,
  Check<Sends<T.QuizItemIn, S['QuizItemIn']>>,
  Check<Sends<T.YesNoItemIn, S['YesNoItemIn']>>,
  Check<Sends<T.CrosswordItemIn, S['CrosswordItemIn']>>,
  Check<Sends<Extract<T.ActivityIn, { type: 'quiz' }>, S['QuizActivityIn']>>,
  Check<Sends<Extract<T.ActivityIn, { type: 'yesno' }>, S['YesNoActivityIn']>>,
  Check<Sends<Extract<T.ActivityIn, { type: 'crossword' }>, S['CrosswordActivityIn']>>,
  Check<Sends<T.ChatIn, S['ChatIn']>>,
  Check<Sends<T.DraftCreateIn, S['DraftCreateIn']>>,
  Check<Sends<T.DraftUpdateIn, S['DraftUpdateIn']>>,
  Check<Sends<T.AiSettingsUpdate, S['AiSettingsUpdate']>>,
  Check<Sends<T.ReindexIn, S['ReindexIn']>>,
  Check<Sends<T.FolderIn, S['FolderIn']>>,
  Check<Sends<T.FolderUpdate, S['FolderUpdate']>>,
  Check<Sends<T.DocumentUpdate, S['DocumentUpdate']>>,
  Check<Sends<T.BookUpdate, S['BookUpdate']>>,
  Check<Sends<T.NewsIn, S['NewsIn']>>,
  Check<Sends<T.NewsUpdate, S['NewsUpdate']>>,
  Check<Sends<T.FaqIn, S['FaqIn']>>,
  Check<Sends<T.FaqUpdate, S['FaqUpdate']>>,
  Check<Sends<T.SiteUpdate, S['SiteUpdate']>>,
  Check<Sends<T.ContactIn, S['ContactIn']>>,
  Check<Sends<T.ContactMessageUpdate, S['ContactMessageUpdate']>>,
]
