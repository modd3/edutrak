import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/auth-store';
import { Bell, Search } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const year = new Date;
const thisYear = year.getFullYear();

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-lg">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search students, classes, reports..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4 ml-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* School Info (for non-super admins) */}
              {user.school && (
                <div className="hidden md:block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                  {user.school.name}
                </div>
              )}
            </div>
          </div>
        </header>

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