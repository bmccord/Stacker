import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProviderWrapper } from '@/lib/apollo';
import PublicLayout from '@/components/layout/PublicLayout';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import RequirePermission from '@/components/layout/RequirePermission';
import SignInPage from '@/pages/SignInPage';
import LandingPage from '@/pages/LandingPage';

const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const BooksPage = lazy(() => import('@/pages/content/BooksPage'));
const BookFormPage = lazy(() => import('@/pages/content/BookFormPage'));
const AuthorsPage = lazy(() => import('@/pages/content/AuthorsPage'));
const AuthorFormPage = lazy(() => import('@/pages/content/AuthorFormPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const GroupsPage = lazy(() => import('@/pages/admin/GroupsPage'));
const GroupFormPage = lazy(() => import('@/pages/admin/GroupFormPage'));

export default function App() {
  return (
    <ApolloProviderWrapper>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" /></div>}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected app routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="books" element={<RequirePermission permission="books.view"><BooksPage /></RequirePermission>} />
          <Route path="books/new" element={<RequirePermission permission="books.manage"><BookFormPage /></RequirePermission>} />
          <Route path="books/:id" element={<RequirePermission permission="books.manage"><BookFormPage /></RequirePermission>} />
          <Route path="authors" element={<RequirePermission permission="authors.view"><AuthorsPage /></RequirePermission>} />
          <Route path="authors/new" element={<RequirePermission permission="authors.manage"><AuthorFormPage /></RequirePermission>} />
          <Route path="authors/:id" element={<RequirePermission permission="authors.manage"><AuthorFormPage /></RequirePermission>} />
          <Route path="users" element={<RequirePermission permission="users.manage"><UsersPage /></RequirePermission>} />
          <Route path="groups" element={<RequirePermission permission="users.manage"><GroupsPage /></RequirePermission>} />
          <Route path="groups/new" element={<RequirePermission permission="users.manage"><GroupFormPage /></RequirePermission>} />
          <Route path="groups/:id" element={<RequirePermission permission="users.manage"><GroupFormPage /></RequirePermission>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </ApolloProviderWrapper>
  );
}
