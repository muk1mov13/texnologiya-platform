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
