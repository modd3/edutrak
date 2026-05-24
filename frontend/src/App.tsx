import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

// Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Components
import { RoleGuard } from '@/components/RoleGuard';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Unauthorized } from './pages/Unauthorized';
import { YearEndWizard } from './pages/academic/YearEndWizard';
import ClassesList from '@/pages/classes/ClassesList';
import StudentsList from '@/pages/students/StudentsList';
import SchoolsList from './pages/schools/SchoolsList';
import UsersList from './pages/users/UsersList';
import {GuardiansList} from './pages/guardians/GuardiansList';
import { AcademicYearsPage } from './pages/academic/AcademicYearsPage';
import TeachersList from './pages/teachers/TeachersList';
import { SubjectsList } from './pages/subjects/SubjectsList';
import { AssessmentsPage } from './pages/assessments/AssessmentsPage';
import { GradeEntryPage } from './pages/assessments/GradeEntryPage';
import { ReportsPage } from './pages/assessments/ReportsPage';
import StrandManagementPage from './pages/assessments/StrandManagementPage';
import { StudentSubjectManagementPage } from './pages/subjects/StudentSubjectManagementPage';
import { StudentSubjectEnrollmentPage } from './pages/students/SubjectEnrollment';
import ClassSubjectStrandsPage from '@/pages/assessments/ClassSubjectStrands';
import FeesPagePro from '@/pages/fees/FeesPagePro';
import FeeStructuresPagePro from '@/pages/fees/FeeStructuresPagePro';
import InvoicesPagePro from '@/pages/fees/InvoicesPagePro';
import PaymentsPagePro from '@/pages/fees/PaymentsPagePro';
import BillingAdminPage from '@/pages/billing/BillingAdminPage';
import SubscriptionsPage from '@/pages/subscriptions/SubscriptionsPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user, token } = useAuthStore();

  useEffect(() => {
    const applyBranding = async () => {
      if (!user?.schoolId || !token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/schools/${user.schoolId}/branding`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const branding = json?.data;
        if (!branding) return;

        const root = document.documentElement;
        if (branding.primaryColor) root.style.setProperty('--primary-brand', branding.primaryColor);
        if (branding.secondaryColor) root.style.setProperty('--secondary-brand', branding.secondaryColor);
        if (branding.accentColor) root.style.setProperty('--accent-brand', branding.accentColor);
        if (branding.fontFamily) root.style.setProperty('--brand-font-family', branding.fontFamily);
        if (branding.borderRadiusScale) root.style.setProperty('--radius', branding.borderRadiusScale);
        if (branding.appDisplayName) document.title = branding.appDisplayName;
      } catch (e) {
        // fallback to defaults silently
      }
    };

    applyBranding();
  }, [user?.schoolId, token]);

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

          {/* Auth Error Pages */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Dashboard - All authenticated users */}
          <Route
            path="/dashboard"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPPORT_STAFF']}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          <Route
            path="/billing-admin"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <BillingAdminPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          <Route
            path="/subscriptions"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <SubscriptionsPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* SUPER_ADMIN ONLY: Schools Management */}
          <Route
            path="/schools"
            element={
              <RoleGuard roles={['SUPER_ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <SchoolsList />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN & SUPER_ADMIN: User Management */}
          <Route
            path="/users"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <UsersList />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER: Students */}
          <Route
            path="/students"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <StudentsList />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN: Teachers Management */}
          <Route
            path="/teachers"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <TeachersList />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER: Classes */}
          <Route
            path="/classes"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <ClassesList />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          <Route
            path="/classes/new"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <ClassesList />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER: Subjects */}
          <Route
            path="/subjects"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <SubjectsList />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER: Student Subject Management */}
          <Route
            path="/students/subjects"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <StudentSubjectManagementPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* All authenticated users: Student Subject Enrollment */}
          <Route
            path="/students/:studentId/subjects"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <StudentSubjectEnrollmentPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN: Academic Years */}
          <Route
            path="/academic-year"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <AcademicYearsPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN: Year-End Transition Wizard */}
          <Route
            path="/academic-year/year-end-wizard"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <YearEndWizard />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER, STUDENT, PARENT: Assessments */}
          <Route
            path="/assessments"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <AssessmentsPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* TEACHER ONLY: Grade Entry */}
          <Route
            path="/assessments/:assessmentId/grades"
            element={
              <RoleGuard roles={['TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <GradeEntryPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER: Strand Management */}
          <Route
            path="/assessments/strands/manage"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <StrandManagementPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER: Class Subject Strands */}
          <Route
            path="/assessments/class-subject-strands"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <ClassSubjectStrandsPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          <Route
            path="/assessments/class-subject-strands/:classSubjectId"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <ClassSubjectStrandsPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER: Reports */}
          <Route
            path="/reports"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN: Guardians */}
          <Route
            path="/guardians"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <GuardiansList />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN: Fee Management Hub */}
          <Route
            path="/fees"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <FeesPagePro />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN: Fee Structures (separate route if direct access needed) */}
          <Route
            path="/fees/structures"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <FeeStructuresPagePro />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN, TEACHER: Fee Invoices */}
          <Route
            path="/fees/invoices"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN', 'TEACHER']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <InvoicesPagePro />
                </DashboardLayout>
              </RoleGuard>
            }
          />

          {/* ADMIN, SUPER_ADMIN: Fee Payments */}
          <Route
            path="/fees/payments"
            element={
              <RoleGuard roles={['SUPER_ADMIN', 'ADMIN']} fallbackRoute="/dashboard">
                <DashboardLayout>
                  <PaymentsPagePro />
                </DashboardLayout>
              </RoleGuard>
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
