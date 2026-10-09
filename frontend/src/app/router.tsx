import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AdminSubjectsPage } from '@/features/admin/AdminSubjectsPage'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { HomePage } from '@/features/public/HomePage'
import { LoginPage } from '@/features/public/LoginPage'
import { NotFoundPage } from '@/features/public/NotFoundPage'
import { PendingPage } from '@/features/public/PendingPage'
import { RegisterPage } from '@/features/public/RegisterPage'
import { PlayerPage } from '@/features/student/PlayerPage'
import { SubjectPage } from '@/features/student/SubjectPage'
import { SubjectsPage } from '@/features/student/SubjectsPage'
import { TeachHomePage } from '@/features/teach/TeachHomePage'
import { TopicEditorPage } from '@/features/teach/TopicEditorPage'
import { RedirectIfAuthed, RequireAuth } from './guards'
import { AppLayout } from './layouts/AppLayout'
import { PublicLayout } from './layouts/PublicLayout'

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
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
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'app', element: <SubjectsPage /> },
          { path: 'app/subjects/:slug', element: <SubjectPage /> },
          { path: 'app/topics/:topicId/:kind?', element: <PlayerPage /> },
          { path: 'app/profile', element: <ProfilePage /> },
          {
            element: <RequireAuth roles={['teacher', 'admin']} />,
            children: [
              { path: 'teach', element: <TeachHomePage /> },
              { path: 'teach/topics/:topicId', element: <TopicEditorPage /> },
            ],
          },
          {
            element: <RequireAuth roles={['admin']} />,
            children: [
              { path: 'admin', element: <Navigate to="/admin/users" replace /> },
              { path: 'admin/users', element: <AdminUsersPage /> },
              { path: 'admin/subjects', element: <AdminSubjectsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
