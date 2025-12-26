import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

// Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

// Academic Pages
import { AcademicYearsPage } from './pages/academic/AcademicYearsPage';
import TermsList from './pages/academic/TermsList';

// Classes Pages
import ClassesList from '@/pages/classes/ClassesList';
import StreamsList from './pages/classes/StreamsList';

// Students Pages
import StudentsList from '@/pages/students/StudentsList';
import StudentEnrollments from './pages/students/StudentEnrollments';

// Teachers Pages
import TeachersList from './pages/teachers/TeachersList';
import TeacherAssignments from './pages/teachers/TeacherAssignments';

// Schools Pages
import SchoolsList from './pages/schools/SchoolsList';
import CreateSchool from './pages/schools/CreateSchool';

// Users Pages
import UsersList from './pages/users/UsersList';
import BulkCreateUsers from './pages/users/BulkCreateUsers';

// Assessments Pages
import AssessmentsList from './pages/assessments/AssessmentsList';
import GradeEntry from './pages/assessments/GradeEntry';

// Subjects Pages
import SubjectOfferingsList from './pages/subjects/SubjectOfferingsList';

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

          {/* Academic Routes */}
          <Route
            path="/academic/years"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AcademicYearsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/terms"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TermsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Classes Routes */}
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ClassesList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes/streams"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StreamsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Students Routes */}
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
            path="/students/enrollments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StudentEnrollments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Teachers Routes */}
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
            path="/teachers/assignments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TeacherAssignments />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Schools Routes */}
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

          {/* Users Routes */}
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
            path="/users/bulk-create"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BulkCreateUsers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Assessments Routes */}
          <Route
            path="/assessments"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AssessmentsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/grade-entry"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <GradeEntry />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Subjects Routes */}
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SubjectOfferingsList />
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
