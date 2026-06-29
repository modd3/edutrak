import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SchoolContextSwitcher } from './SchoolContextSwitcher';
import { useAuthStore } from '../../store/auth-store';
import { Bell } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

interface DashboardLayoutProps {
  children: ReactNode;
}

const year = new Date;
const thisYear = year.getFullYear();

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const { overrideSchool, clearOverrideSchool } = useAuthStore();
  const isOverrideActive = user?.role === 'SUPER_ADMIN' && !!overrideSchool;

  // Redirect to login only if auth state is definitively not authenticated
  // (not just still hydrating)
  useEffect(() => {
    if (!isAuthenticated && user === null) {
      // Give a small delay for Zustand persist hydration to complete
      const timeout = setTimeout(() => {
        // Re-check after brief delay — if still not authed, redirect
        const { isAuthenticated: stillAuthed } = useAuthStore.getState();
        if (!stillAuthed) {
          navigate('/login');
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, user, navigate]);

  // Render nothing while not authenticated (RoleGuard handles the redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(239_84%_67%_/_0.12),transparent_32rem),linear-gradient(180deg,#f8fafc,#eef2ff)]">
      <Sidebar />

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <CommandPalette />
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3 ml-4">
              {/* School Context Switcher (for SUPER_ADMIN) */}
              <SchoolContextSwitcher />

              {/* Security Settings */}
              <button
                onClick={() => setSecurityOpen(true)}
                title="Account Security Settings"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <KeyRound size={18} />
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* School Info (for non-super admins) */}
              {user.school && !isOverrideActive && (
                <div className="hidden md:block px-3 py-1 bg-indigo-50 text-indigo-700 font-medium rounded-lg text-xs">
                  {user.school.name}
                </div>
              )}
            </div>
          </div>
        </header>

        <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        <ProfileSecurityModal open={securityOpen} onOpenChange={setSecurityOpen} />

        {/* Override Active Banner */}
        {isOverrideActive && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Zap size={16} className="text-amber-500" />
                <span>
                  <strong>Override Mode:</strong> Viewing as <strong>{overrideSchool?.name}</strong>
                </span>
              </div>
              <button
                onClick={() => {
                  clearOverrideSchool();
                  navigate('/dashboard');
                }}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded transition-colors"
              >
                Exit Override
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
            <p>© {thisYear} EduTrak. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <a href="#" className="hover:text-blue-600">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600">Terms of Service</a>
              <a href="#" className="hover:text-blue-600">Help</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}