import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

// Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import ClassesList from '@/pages/classes/ClassesList';
import StudentsList from '@/pages/students/StudentsList';
import SchoolsList from './pages/schools/SchoolsList';
import CreateSchool from './pages/schools/CreateSchool';
import UsersList from './pages/users/UsersList';
import { AcademicYearsPage } from './pages/academic/AcademicYearsPage';
import TeachersList from './pages/teachers/TeachersList';
import { SubjectsList } from './pages/subjects/SubjectsList';
import { AssessmentsPage } from './pages/assessments/AssessmentsPage';
import { GradeEntryPage } from './pages/assessments/GradeEntryPage';
import { ReportsPage } from './pages/assessments/ReportsPage';
import { StudentSubjectManagementPage } from './pages/subjects/StudentSubjectManagementPage';
import { StudentSubjectEnrollmentPage } from './pages/students/SubjectEnrollment';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          {/* Add more protected routes here */}

          <Route
            path="/schools"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SchoolsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreateSchool />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UsersList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />


          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StudentsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />



          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TeachersList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  < ClassesList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  < ClassesList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  < SubjectsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

<Route
            path="/students/subjects"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  < StudentSubjectManagementPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/students/:studentId/subjects"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StudentSubjectEnrollmentPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/academic-year"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  < AcademicYearsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  < AssessmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessments/:assessmentId/grades"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  < GradeEntryPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  < ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>

        {/* Toast notifications */}
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
