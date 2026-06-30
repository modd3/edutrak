import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SchoolContextSwitcher } from './SchoolContextSwitcher';
import { useAuthStore } from '../../store/auth-store';
import { Bell, Moon, Sun, Zap } from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const year = new Date;
const thisYear = year.getFullYear();

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, overrideSchool, clearOverrideSchool } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('edutrak-theme') === 'dark');
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);

  const toggleSideBar = () => setSideBarCollapsed(prev => !prev)

  // Redirect to login only if auth state is definitively not authenticated
  // (not just still hydrating)
  useEffect(() => {
    if (!isAuthenticated && user === null) {
      // Give a small delay for Zustand persist hydration to complete
      const timeout = setTimeout(() => {
        // Re-check after brief delay — if still not authed, redirect
        const { isAuthenticated: stillAuthed } = useAuthStore.getState();
        if (!stillAuthed) {
          navigate('/login', { replace: true });
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, user, navigate]);


  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('edutrak-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const exitOverrideMode = () => {
    clearOverrideSchool();
    navigate('/dashboard');
  };

  // Render nothing while not authenticated (RoleGuard handles the redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(239_84%_67%_/_0.12),transparent_32rem),linear-gradient(180deg,#f8fafc,#eef2ff)] dark:bg-[radial-gradient(circle_at_top_left,hsl(239_84%_67%_/_0.14),transparent_32rem),linear-gradient(180deg,#020617,#0f172a)]">
      <Sidebar collapsed={sideBarCollapsed} onToggleCollapsed={toggleSideBar}/>

      {/* Main Content */}
      <div className={cn(
        'flex flex-col min-h-screen transition-all duration-300',
        'lg:pl-64',
        sideBarCollapsed && 'lg:pl-20'
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/75">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <CommandPalette />
            </div>
            <SchoolContextSwitcher />

            {/* Right Section */}
            <div className="flex items-center space-x-4 ml-4">
              <button
                type="button"
                onClick={() => setIsDarkMode((value) => !value)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* School Info (for non-super admins) */}
              {user.school && (
                <div className="hidden md:block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm dark:bg-blue-950 dark:text-blue-200">
                  {user.school.name}
                </div>
              )}
            </div>
          </div>
        </header>

        {overrideSchool && user.role === 'SUPER_ADMIN' && (
          <div className="sticky top-[73px] z-20 border-b border-amber-200 bg-amber-50/95 px-4 py-3 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-2 dark:border-amber-900 dark:bg-amber-950/90 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-amber-900 dark:text-amber-100">
                <span className="rounded-full bg-amber-200 p-2 text-amber-700 dark:bg-amber-900 dark:text-amber-100"><Zap className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold">Override Active: Viewing as {overrideSchool.name}</p>
                  <p className="text-sm text-amber-700 dark:text-amber-200">School-level pages and API calls are scoped with X-School-Override.</p>
                </div>
              </div>
              <button type="button" onClick={exitOverrideMode} className="rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950">Exit override mode</button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white/80 border-t border-slate-200 px-4 lg:px-8 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <p>© {thisYear} EduTrak. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-300">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-300">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-300">Help</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}