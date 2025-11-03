import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, BookOpen, GraduationCap, 
  BarChart4, Settings, CalendarDays 
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Role } from '@/types'; 
import { cn } from '@/lib/utils'; // Tailwind utility helper

// Define Navigation Items and their required roles
const navItems = [
  { 
    name: 'Dashboard', 
    path: '/', 
    icon: Home, 
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER] 
  },
  { 
    name: 'Academic Setup', 
    path: '/academic/classes', 
    icon: CalendarDays, 
    roles: [Role.ADMIN, Role.PRINCIPAL] 
  },
  { 
    name: 'Staff Directory', 
    path: '/teachers', 
    icon: Users, 
    roles: [Role.ADMIN, Role.PRINCIPAL] 
  },
  { 
    name: 'Student Enrollment', 
    path: '/students', 
    icon: GraduationCap, 
    roles: [Role.ADMIN, Role.PRINCIPAL, Role.TEACHER] 
  },
  { 
    name: 'Subject Grading', 
    path: '/grading/my-subjects', 
    icon: BookOpen, 
    roles: [Role.TEACHER] 
  },
  { 
    name: 'Term Reports', 
    path: '/grading/reports', 
    icon: BarChart4, 
    roles: [Role.ADMIN, Role.PRINCIPAL] 
  },
  { 
    name: 'Settings', 
    path: '/settings', 
    icon: Settings, 
    roles: [Role.ADMIN] 
  },
];

export function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const userRole = user?.role as Role;
  
  if (!userRole) return null; // Should be handled by ProtectedRoute, but defensive coding is good

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="hidden md:flex flex-col w-64 bg-gray-900 text-white min-h-screen p-4 sticky top-0">
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <h1 className="text-xl font-bold text-primary-500">EduTrak LMS</h1>
      </div>
      
      <nav className="flex-1 mt-6 space-y-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || (
            item.name === 'Academic Setup' && location.pathname.startsWith('/academic')
          );
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-2 rounded-lg transition-colors group",
                isActive ? "bg-primary text-white hover:bg-primary-dark" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-gray-700 text-sm text-gray-400">
        Logged in as: <span className="font-semibold text-primary">{userRole}</span>
      </div>
    </div>
  );
}