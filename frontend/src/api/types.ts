// backend/app/auth/schemas.py, learning/schemas.py, learning/student_schemas.py bilan mos.

export type Role = 'student' | 'teacher' | 'admin'
export type UserStatus = 'pending' | 'active' | 'blocked'
export type Locale = 'uz' | 'ru'
export type StepKind = 'review' | 'lecture' | 'presentation' | 'practice' | 'task' | 'glossary' | 'literature'
export type MaterialStatus = 'processing' | 'ready' | 'failed'
export type ProgressStatus = 'in_progress' | 'completed'

export interface ApiErrorBody {
  code: string
  message: string
  details: Record<string, unknown>
}

// --- auth ---
export interface User {
  id: number
  email: string
  phone: string | null
  full_name: string
  role: Role
  status: UserStatus
  locale: Locale
}

export interface TokenOut {
  access_token: string
  token_type: string
  user: User
}

export interface LoginIn {
  email: string
  password: string
}

export interface RegisterIn {
  email: string
  password: string
  full_name: string
  phone: string | null
  locale: Locale
}

export interface MeUpdateIn {
  full_name?: string
  phone?: string | null
  locale?: Locale
}

export interface PasswordChangeIn {
  current_password: string
  new_password: string
}

export interface AdminUserUpdateIn {
  role?: Role
  status?: UserStatus
}

export interface TempPasswordOut {
  temp_password: string
}

// --- talaba ---
export interface Progress {
  completed: number
  total: number
}

export interface SubjectCard {
  id: number
  title: string
  slug: string
  description: string
  cover: string | null
  topic_count: number
  progress: Progress
}

export interface TopicCard {
  id: number
  title: string
  summary: string
  order: number
  progress: Progress
}

export interface SubjectDetail {
  id: number
  title: string
  slug: string
  description: string
  cover: string | null
  topics: TopicCard[]
}

export interface StepBrief {
  id: number
  kind: StepKind
  order: number
  has_content: boolean
  status: ProgressStatus | null
}

export interface TopicDetail {
  id: number
  title: string
  summary: string
  subject: { id: number; title: string; slug: string }
  steps: StepBrief[]
  progress: Progress
}

export interface MaterialView {
  id: number
  title: string
  page_count: number | null
  file_url: string
}

export interface GlossaryTerm {
  id: number
  term: string
  definition: string
  order: number
}

export interface LiteratureItem {
  id: number
  title: string
  author: string
  year: number | null
  url: string | null
  order: number
}

export type ActivityType = 'quiz' | 'yesno' | 'crossword'
export type TaskType = 'text' | 'file' | 'both'
export type SubmissionStatus = 'submitted' | 'graded' | 'returned'

export interface StudentLayoutWord {
  number: number
  row: number
  col: number
  direction: 'across' | 'down'
  length: number
  clue: string
}

export interface StudentLayout {
  rows: number
  cols: number
  words: StudentLayoutWord[]
}

export interface QuizItemView {
  text: string
  options: string[]
}

export interface YesNoItemView {
  statement: string
}

export interface ActivityView {
  id: number
  type: ActivityType
  title: string
  items: (QuizItemView | YesNoItemView)[]
  layout: StudentLayout | null
  best_percent: number | null
  attempts_count: number
}

export interface TaskView {
  id: number
  title: string
  description: string
  type: TaskType
  max_score: number
  rubric: string | null
  deadline: string | null
}

export interface SubmissionView {
  id: number
  status: SubmissionStatus
  text: string | null
  original_name: string | null
  file_url: string | null
  score: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  is_late: boolean
}

export interface StepContent {
  id: number
  topic_id: number
  kind: StepKind
  order: number
  has_content: boolean
  status: ProgressStatus | null
  materials: MaterialView[]
  glossary: GlossaryTerm[]
  literature: LiteratureItem[]
  activities: ActivityView[]
  task: TaskView | null
  submission: SubmissionView | null
}

export interface ContinueTarget {
  subject_id: number
  subject_slug: string
  subject_title: string
  topic_id: number
  topic_title: string
  step_id: number
  step_kind: StepKind
}

export interface SubjectProgress {
  subject_id: number
  subject_title: string
  subject_slug: string
  progress: Progress
}

// --- o'qituvchi ---
export interface Material {
  id: number
  step_id: number
  title: string
  original_name: string
  page_count: number | null
  status: MaterialStatus
  error: string | null
}

export interface StepEditor {
  id: number
  kind: StepKind
  order: number
  materials: Material[]
}

export interface TopicEditor {
  id: number
  subject_id: number
  title: string
  summary: string
  order: number
  is_published: boolean
  steps: StepEditor[]
  glossary: GlossaryTerm[]
  literature: LiteratureItem[]
}

export interface TeachTopicBrief {
  id: number
  title: string
  order: number
  is_published: boolean
}

export interface TeachSubject {
  id: number
  title: string
  slug: string
  is_published: boolean
  topics: TeachTopicBrief[]
}

export interface TopicCreate {
  title: string
  summary?: string
  is_published?: boolean
}

export type TopicUpdate = Partial<TopicCreate>

export interface GlossaryIn {
  term: string
  definition: string
}

export interface LiteratureIn {
  title: string
  author: string
  year: number | null
  url: string | null
}

// --- admin ---
export interface SubjectAdmin {
  id: number
  title: string
  slug: string
  description: string
  cover: string | null
  order: number
  is_published: boolean
  teacher_ids: number[]
}

export interface SubjectCreate {
  title: string
  slug: string | null
  description: string
  order: number
  is_published: boolean
}

export type SubjectUpdate = Partial<SubjectCreate>

export interface BadgeBrief {
  code: string
  icon: string
  title_uz: string
  title_ru: string
}

export interface Rewards {
  xp: number
  new_badges: BadgeBrief[]
}

export interface StepCompleteResult extends StepBrief {
  rewards: Rewards
}

export type AttemptAnswer = number | boolean | string | null

export interface ResultItem {
  prompt: string
  options: string[] | null
  given: number | boolean | string | null
  correct: number | boolean | string
  is_correct: boolean
  explanation: string | null
}

export interface AttemptResult {
  attempt_id: number
  activity_id: number
  score: number
  max_score: number
  result: ResultItem[]
  rewards: Rewards
  step: StepBrief
}

export interface SubmitResult {
  submission: SubmissionView
  rewards: Rewards
  step: StepBrief
}

export interface BadgeView extends BadgeBrief {
  description_uz: string
  description_ru: string
  awarded_at: string | null
}

export interface Dashboard {
  xp_total: number
  streak: { current: number; longest: number; active_today: boolean }
  badges: BadgeView[]
  continue_step: ContinueTarget | null
}

export interface ActivityResult {
  activity_id: number
  title: string
  type: ActivityType
  best_percent: number
  attempts_count: number
  last_attempt_id: number
  last_attempt_at: string
}

export interface TaskResult {
  task_id: number
  title: string
  status: SubmissionStatus
  score: number | null
  max_score: number
  feedback: string | null
  is_late: boolean
  submitted_at: string
}

export interface TopicResults {
  topic_id: number
  topic_title: string
  activities: ActivityResult[]
  tasks: TaskResult[]
}

export interface SubjectResults {
  subject_id: number
  subject_title: string
  subject_slug: string
  topics: TopicResults[]
}

export interface AttemptDetail {
  id: number
  activity_id: number
  activity_title: string
  activity_type: ActivityType
  score: number
  max_score: number
  result: ResultItem[]
  created_at: string
}

// --- o'qituvchi: baholash ---

export interface QuizItemIn {
  text: string
  options: string[]
  correct_index: number
  explanation?: string | null
}

export interface YesNoItemIn {
  statement: string
  answer: boolean
  explanation?: string | null
}

export interface CrosswordItemIn {
  word: string
  clue: string
}

export type ActivityIn =
  | { type: 'quiz'; title: string; items: QuizItemIn[] }
  | { type: 'yesno'; title: string; items: YesNoItemIn[] }
  | { type: 'crossword'; title: string; items: CrosswordItemIn[] }

export interface QuizItemOut extends QuizItemIn {
  id: number
  explanation: string | null
}

export interface YesNoItemOut extends YesNoItemIn {
  id: number
  explanation: string | null
}

export interface CrosswordItemOut extends CrosswordItemIn {
  id: number
}

export interface TeachLayoutWord {
  number: number
  row: number
  col: number
  direction: 'across' | 'down'
  length: number
  word_id: number
  cells: string[]
}

export interface TeachLayout {
  rows: number
  cols: number
  words: TeachLayoutWord[]
}

export interface ActivityTeach {
  id: number
  step_id: number
  type: ActivityType
  title: string
  order: number
  is_published: boolean
  items: (QuizItemOut | YesNoItemOut | CrosswordItemOut)[]
  layout: TeachLayout | null
}

export interface TaskIn {
  title: string
  description: string
  type: TaskType
  max_score: number
  rubric?: string | null
  deadline?: string | null
}

export interface TaskOut {
  id: number
  step_id: number
  title: string
  description: string
  type: TaskType
  max_score: number
  rubric: string | null
  deadline: string | null
}

export interface SubmissionQueueItem {
  id: number
  status: SubmissionStatus
  student_name: string
  subject_id: number
  subject_title: string
  topic_id: number
  topic_title: string
  task_id: number
  task_title: string
  submitted_at: string
  is_late: boolean
}

export interface SubmissionDetail extends SubmissionQueueItem {
  task_description: string
  rubric: string | null
  max_score: number
  text: string | null
  original_name: string | null
  file_url: string | null
  score: number | null
  feedback: string | null
  graded_at: string | null
  ai_status: AiCheckStatus
  ai_score: number | null
  ai_feedback: AiFeedback | null
}

export type AiCheckStatus = 'none' | 'pending' | 'done' | 'unsupported' | 'failed'

export interface AiFeedback {
  feedback: string
  strengths: string[]
  issues: string[]
}

export interface GradeIn {
  score: number
  feedback?: string | null
}

export interface TopicStats {
  topic_id: number
  topic_title: string
  started: number
  completed: number
  avg_best_percent: number | null
  pending_submissions: number
}

// --- AI (3-bosqich) -----------------------------------------------------------------------

export type MessageMode = 'answer' | 'hint' | 'refusal' | 'canned'
export type MessageRole = 'user' | 'assistant'

export interface Citation {
  n: number
  source_type: string
  source_id: number
  title: string
  page: number | null
}

export interface ConversationBrief {
  id: number
  topic_id: number | null
  title: string
  updated_at: string
}

export interface ChatMessageView {
  id: number
  role: MessageRole
  content: string
  citations: Citation[]
  mode: MessageMode | null
  created_at: string
}

export interface ConversationDetail extends ConversationBrief {
  messages: ChatMessageView[]
}

export interface AiUsageMe {
  used: number
  limit: number | null
  enabled: boolean
}

export interface ChatIn {
  message: string
  topic_id?: number | null
  conversation_id?: number | null
}

/** SSE `meta` hodisasi (OpenAPI'da yo'q — kontraktsiz). */
export interface ChatMeta {
  conversation_id: number
  mode: MessageMode
  citations: Citation[]
}

export type DraftKind = 'quiz' | 'yesno' | 'crossword' | 'glossary' | 'task'
export type DraftStatus = 'generating' | 'draft' | 'approved' | 'rejected' | 'failed'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DraftCreateIn {
  step_id: number
  kind: DraftKind
  material_ids: number[]
  count: number
  difficulty?: Difficulty
}

export interface DraftUpdateIn {
  payload: Record<string, unknown>
}

export interface AiDraft {
  id: number
  topic_id: number
  step_id: number
  kind: DraftKind
  status: DraftStatus
  params: Record<string, unknown>
  payload: Record<string, unknown> | null
  error: string | null
  approved_ref: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AiReport {
  id: number
  subject_id: number
  locale: string
  period_start: string
  period_end: string
  stats: Record<string, unknown>
  content: string
  created_at: string
}

export interface AiSettingsView {
  enabled: boolean
  student_daily_limit: number
  configured: boolean
  provider: string
  chat_model: string
  embedding_model: string
}

export interface AiSettingsUpdate {
  enabled?: boolean | null
  student_daily_limit?: number | null
}

export interface AiUsageDay {
  day: string
  requests: number
  users: number
}

export interface AiUsageStats {
  days: AiUsageDay[]
  chunks: number
  stale_chunks: number
}

export interface ReindexIn {
  all?: boolean
}
