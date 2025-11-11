import { useAuthStore } from '@/store/auth-store';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { TeacherDashboard } from './dashboards/TeacherDashboard';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { ParentDashboard } from './dashboards/ParentDashboard';

export function Dashboard() {
  const { user } = useAuthStore();

  if (!user) return null;

  // Render dashboard based on role
  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    case 'PARENT':
      return <ParentDashboard />;
    default:
      return <DefaultDashboard />;
  }
}

function DefaultDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome to EduTrak, {}</h1>
      <p className="text-gray-600">
        Your personalized dashboard is being prepared.
      </p>
    </div>
  );
}