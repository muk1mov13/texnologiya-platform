import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AdminAiPage } from '@/features/admin/AdminAiPage'
import { AdminSubjectsPage } from '@/features/admin/AdminSubjectsPage'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { AdminBooksPage } from '@/features/admin/cms/AdminBooksPage'
import { AdminLibraryPage } from '@/features/admin/cms/AdminLibraryPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { AboutPage } from '@/features/public/AboutPage'
import { ContactPage } from '@/features/public/ContactPage'
import { FaqPage } from '@/features/public/FaqPage'
import { HomePage } from '@/features/public/HomePage'
import { LibraryPage } from '@/features/public/LibraryPage'
import { LoginPage } from '@/features/public/LoginPage'
import { NewsListPage } from '@/features/public/NewsListPage'
import { NewsPage } from '@/features/public/NewsPage'
import { NotFoundPage } from '@/features/public/NotFoundPage'
import { PendingPage } from '@/features/public/PendingPage'
import { RegisterPage } from '@/features/public/RegisterPage'
import { AttemptDetailPage } from '@/features/student/AttemptDetailPage'
import { PlayerPage } from '@/features/student/PlayerPage'
import { ResultsPage } from '@/features/student/ResultsPage'
import { SubjectPage } from '@/features/student/SubjectPage'
import { SubjectsPage } from '@/features/student/SubjectsPage'
import { TutorPage } from '@/features/student/TutorPage'
import { MyBooksPage } from '@/features/teach/MyBooksPage'
import { ReviewDetailPage } from '@/features/teach/ReviewDetailPage'
import { ReviewQueuePage } from '@/features/teach/ReviewQueuePage'
import { StatsPage } from '@/features/teach/StatsPage'
import { TeachHomePage } from '@/features/teach/TeachHomePage'
import { TopicEditorPage } from '@/features/teach/TopicEditorPage'
import { RedirectIfAuthed, RequireAuth } from './guards'
import { AdminLayout } from './layouts/AdminLayout'
import { AppLayout } from './layouts/AppLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { RouteError } from './RouteError'

// Har bir yuqori darajadagi marshrutga (ochiq layout, ichki ilova layout'i, 404 fallback)
// alohida `errorElement` biriktirilgan — shunda ULARNING ICHIDAGI render xatosi (yoki lazy
// chunk yuklanmasa, masalan `StepContent`dagi `import('./PdfViewer')`) butun ilovani
// qulatmaydi, faqat o'sha bo'limni lokalizatsiya qilingan xato sahifasiga almashtiradi.
export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'news', element: <NewsListPage /> },
      { path: 'news/:slug', element: <NewsPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'pending', element: <PendingPage /> },
      {
        element: <RedirectIfAuthed />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'app', element: <SubjectsPage /> },
          { path: 'app/subjects/:slug', element: <SubjectPage /> },
          { path: 'app/topics/:topicId/:kind?', element: <PlayerPage /> },
          { path: 'app/profile', element: <ProfilePage /> },
          { path: 'app/results', element: <ResultsPage /> },
          { path: 'app/results/attempts/:attemptId', element: <AttemptDetailPage /> },
          { path: 'app/tutor', element: <TutorPage /> },
          {
            element: <RequireAuth roles={['teacher', 'admin']} />,
            children: [
              { path: 'teach', element: <TeachHomePage /> },
              { path: 'teach/topics/:topicId', element: <TopicEditorPage /> },
              { path: 'teach/review', element: <ReviewQueuePage /> },
              { path: 'teach/review/:submissionId', element: <ReviewDetailPage /> },
              { path: 'teach/stats', element: <StatsPage /> },
              { path: 'teach/books', element: <MyBooksPage /> },
            ],
          },
          {
            element: <RequireAuth roles={['admin']} />,
            children: [
              { path: 'admin', element: <Navigate to="/admin/users" replace /> },
              {
                element: <AdminLayout />,
                children: [
                  { path: 'admin/users', element: <AdminUsersPage /> },
                  { path: 'admin/subjects', element: <AdminSubjectsPage /> },
                  { path: 'admin/ai', element: <AdminAiPage /> },
                  { path: 'admin/library', element: <AdminLibraryPage /> },
                  { path: 'admin/books', element: <AdminBooksPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage />, errorElement: <RouteError /> },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
