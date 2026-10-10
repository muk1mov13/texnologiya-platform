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
]
