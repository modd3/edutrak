import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

// Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

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
            path="/students"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div>Students Page</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div>Teachers Page</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div>Classes Page</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
          path="/assessments"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <div>Assessments Page</div>
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