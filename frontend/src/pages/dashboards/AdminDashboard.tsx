import { Users, GraduationCap, BookOpen, TrendingUp, Calendar, FileText, UserCog, School } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAcademicStatistics } from '@/hooks/use-academic';
import { useUserStatistics } from '@/hooks/use-users';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const { user } = useAuthStore();

  // Fetch real statistics
  const { data: academicStats } = useAcademicStatistics();
  const { data: userStats } = useUserStatistics();

  const stats = [
    {
      title: 'Total Students',
      value: userStats?.students?.toString() || '0',
      change: '+12%',
      icon: GraduationCap,
      color: 'bg-blue-500',
      link: '/students',
    },
    {
      title: 'Teachers',
      value: userStats?.teachers?.toString() || '0',
      change: '+5%',
      icon: UserCog,
      color: 'bg-green-500',
      link: '/teachers',
    },
    {
      title: 'Classes',
      value: academicStats?.totalClasses?.toString() || '0',
      change: '+3',
      icon: BookOpen,
      color: 'bg-purple-500',
      link: '/classes',
    },
    {
      title: 'Assessments',
      value: academicStats?.totalAssessments?.toString() || '0',
      change: '+8%',
      icon: FileText,
      color: 'bg-orange-500',
      link: '/assessments',
    },
  ];

  const recentActivities = [
    { action: 'New student enrolled', name: 'John Doe', time: '2 hours ago' },
    { action: 'Assessment completed', name: 'Form 3 Math', time: '4 hours ago' },
    { action: 'Teacher assigned', name: 'Jane Smith to Grade 7', time: '1 day ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
         {user?.role === 'ADMIN' ? <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}!</h1> : <h1 className="text-3xl font-bold mb-2">
          Welcome back, Super Admin!</h1>}
        
         {user?.role === 'ADMIN' ? <p className="text-blue-100">Here's what's happening in {user?.school?.name || 'your school'} today </p>
         : <p> Manage EduTrak systems here </p> } 
        
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
          ))}
          </div>
    
          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart placeholder - integrate Recharts here</p>
              </div>
            </div>
    
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600">{activity.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
    
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/users/bulk-create" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block text-center">
            <Users className="mx-auto mb-2 text-blue-600" size={24} />
            <p className="text-sm font-medium">Bulk Create Users</p>
          </Link>
          <Link to="/students/enrollments" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block text-center">
            <GraduationCap className="mx-auto mb-2 text-green-600" size={24} />
            <p className="text-sm font-medium">Manage Enrollments</p>
          </Link>
          <Link to="/teachers/assignments" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block text-center">
            <UserCog className="mx-auto mb-2 text-purple-600" size={24} />
            <p className="text-sm font-medium">Teacher Assignments</p>
          </Link>
          <Link to="/assessments/grade-entry" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block text-center">
            <FileText className="mx-auto mb-2 text-orange-600" size={24} />
            <p className="text-sm font-medium">Enter Grades</p>
          </Link>
        </div>
      </div>
    </div>
  );
}